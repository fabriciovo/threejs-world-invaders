import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';

class App {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private reticle: THREE.Mesh;
  private hitTestSource: any;
  private hitTestSourceRequested: boolean;
  private loader: GLTFLoader;
  constructor() {
    this.loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
    this.loader.setDRACOLoader(dracoLoader);

    this.hitTestSource = undefined;
    this.hitTestSourceRequested = false;


    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    this.camera.position.set(0, 200, 3);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x505050);
    this.scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);

    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('app') as HTMLCanvasElement,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);


    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.target.set(0, 5, 0);
    // this.controls.update();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 10;
    this.controls.target.y = 1.6;
    this.controls.update();

    this.reticle = new THREE.Mesh(new THREE.RingGeometry(0.15, .2, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial());
    this.reticle.matrixAutoUpdate = false;
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    //const self = this;

    const room = new THREE.LineSegments(
      new BoxLineGeometry(6, 6, 6, 10, 10, 10).translate(0, 0, 0),
      new THREE.LineBasicMaterial({ color: 0xbcbcbc })
    );

    this.scene.add(room);

    window.addEventListener('resize', this.resize.bind(this));
  }


  public Start() {
    this.renderer.xr.enabled = true;
    console.log(this.renderer.xr)
    this.renderer.xr.setReferenceSpaceType('viewer');

    const self = this;


    this.renderer.xr.addEventListener('sessionstart', () => {

      self.renderer.xr.getCamera().position.copy(self.camera.position);
      console.log('sessionStart')
      self.renderer.xr.updateCamera(self.camera)
      //camera.position.copy(renderer.xr.getCamera().position);

      console.log("pos", self.renderer.xr.getCamera().position);

    });

    function onSelect() {
      if (self.reticle.visible) {

      }
    }



    document.body.appendChild(ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] }))

    const controller: THREE.Group = this.renderer.xr.getController(0) as THREE.Group;
    controller.addEventListener('select', onSelect);

    this.scene.add(controller);

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  //@ts-ignore
  private render(timestamp: any, frame: any) {
    if (frame) {
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const session = this.renderer.xr.getSession();

      if (this.hitTestSourceRequested === false) {
        session?.requestReferenceSpace('viewer').then(referenceSpace => {
          //@ts-ignore
          session?.requestHitTestSource({ space: referenceSpace })?.then(source =>
            this.hitTestSource = source)
        })

        this.hitTestSourceRequested = true;

        session?.addEventListener("end", () => {
          this.hitTestSourceRequested = false;
          this.hitTestSource = null;
        })
      }

      if (this.hitTestSource) {
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix)

        } else {
          this.reticle.visible = false
        }
      }
    }
    this.scene.children.forEach(object => {
      if (object.name === "cube") {
        object.rotation.y += 0.01
      }
    })
    this.renderer.render(this.scene, this.camera);
  }
}
export default App 
