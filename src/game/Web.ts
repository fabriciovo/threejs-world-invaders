import * as THREE from "three";
import { Capsule } from "three/addons/math/Capsule.js";
import GameObject from "../assets/gameObjects/GameObject";
import { CreateStars, SpawnInvaders } from "../utils/utils";
import WorldWebGameObject from "../assets/gameObjects/WorldWebGameObject";
import Player from "../assets/WebPlayer";
import InvaderGameObject from "../assets/gameObjects/InvaderGameObject";
import GreenInvaderGameObject from "../assets/gameObjects/GreenInvaderGameObject";
import Stats from "three/examples/jsm/libs/stats.module.js";
import ShootGameObject from "../assets/gameObjects/ShootGameObject";

class Web {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly fillLight1: THREE.HemisphereLight;
  private readonly directionalLight: THREE.DirectionalLight;
  private readonly GRAVITY: number;
  private readonly playerShoots: GameObject[] = [];
  private readonly invaderShoots: GameObject[] = [];
  private readonly playerCollider: Capsule;
  private readonly playerVelocity: THREE.Vector3;
  private readonly playerDirection: THREE.Vector3;
  private readonly assets: Map<string, THREE.Object3D>;
  private clock: THREE.Clock;
  private renderer: THREE.WebGLRenderer;
  private playerOnFloor: boolean;

  private invaderModel: THREE.Object3D;
  private worldWeb: WorldWebGameObject;
  private spawnTime: number = 10;
  private timer: number = 10;
  private shakeIntensity: number = 0;
  private player: Player;
  private stats: Stats;
  private gameObjectList: GameObject[] = [];
  private invaders: InvaderGameObject[] = [];
  private projectiles: ShootGameObject[] = [];
  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    assets: Map<string, THREE.Object3D>
  ) {
    this._createGameEvents();
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x88ccee, 0, 50);
    this.camera = camera;
    this.camera.rotation.order = "YXZ";
    this.fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
    this.fillLight1.position.set(2, 1, 1);
    this.scene.add(this.fillLight1);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.directionalLight.position.set(-5, 25, -1);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.near = 0.01;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.right = 30;
    this.directionalLight.shadow.camera.left = -30;
    this.directionalLight.shadow.camera.top = 30;
    this.directionalLight.shadow.camera.bottom = -30;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.radius = 4;
    this.directionalLight.shadow.bias = -0.00006;
    this.scene.add(this.directionalLight);
    this.renderer = renderer;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.GRAVITY = 30;
    this.assets = assets;
    this.playerCollider = new Capsule(
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 1, 0),
      0.35
    );
    this.playerVelocity = new THREE.Vector3();
    this.playerDirection = new THREE.Vector3();
    this.playerOnFloor = false;

    window.addEventListener("resize", this.onWindowResize);
    this.onWindowResize();

    this.invaderModel = this.assets.get("invader")!;
    this.invaderModel.scale.set(1, 1, 1);
    this.worldWeb = new WorldWebGameObject(
      this.assets.get("city")!,
      new THREE.Vector3(0, 0, 0),
      0,
      this.scene
    );

    this.scene.add(this.worldWeb.GetModel());

    this.player = new Player(this.scene, this.camera, this.worldWeb);

    CreateStars(this.scene);

    this.stats = new Stats();
    const container = document.getElementById("stats-container");
    container?.appendChild(this.stats.dom);

    this.animate();
  }

  private _createGameEvents() {
    document.addEventListener("addInstance", (event: Event) => {
      const customEvent = event as CustomEvent;
      this._onAddInstance(customEvent.detail as ShootGameObject);
    });
  }

  private _onAddInstance(_instance: ShootGameObject) {
    this.projectiles.push(_instance);
    console.log(this.projectiles);
  }

  private updateInvaders(_deltaTime: number): void {
    this.invaders.forEach((el, index, object) => {
      if (el.IsRemoved()) {
        object.splice(index, 1);
      }
      el.Update(_deltaTime);
    });

    this.invadersCollisions();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private throwBall(): void {
    const playerShootGeometry = new THREE.IcosahedronGeometry(0.1, 5);
    const playerShootMaterial = new THREE.MeshLambertMaterial({
      color: 0xdede8d,
    });
    const playerShootMesh = new THREE.Mesh(
      playerShootGeometry,
      playerShootMaterial
    );
    playerShootMesh.castShadow = true;
    playerShootMesh.receiveShadow = true;

    // const playerShoot = new GameObject(
    //   playerShootMesh,
    //   this.gunModel.localToWorld(new THREE.Vector3(0.15, -0.15, -0.5)),
    //   30,
    //   this.scene
    // );

    // const impulse =
    //   15 + 30 * (1 - Math.exp((this.mouseTime - performance.now()) * 0.001));
    // playerShoot.SetVelocity(
    //   this.gunModel
    //     .localToWorld(new THREE.Vector3(0, 0, -1))
    //     .sub(this.camera.position)
    //     .normalize()
    //     .multiplyScalar(impulse * 4)
    // );

    // this.playerShoots.push(playerShoot);
    // this.scene.add(playerShoot.GetModel());
  }

  private playerCollisions(): void {
    const result = this.worldWeb
      .GetOctree()
      .capsuleIntersect(this.playerCollider);

    this.playerOnFloor = false;
    if (result) {
      this.playerOnFloor = result.normal.y > 0;
      if (!this.playerOnFloor) {
        this.playerVelocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.playerVelocity)
        );
      }
      this.playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }

    // this.worldWeb.GetMeshes().forEach((el, index, object) => {
    //   const elBox = new THREE.Box3().setFromObject(el);
    //   const result = this.playerCollider.intersectsBox(elBox);

    //   if (result) {
    //     this.playerOnFloor = true;
    //   }else{
    //     this.playerOnFloor = false;
    //   }
    // });

    ///-------------------------
    for (let i = 0; i < this.invaders.length; i++) {
      const invader = this.invaders[i];
      if (invader.GetModel().position.distanceTo(this.camera.position) <= 1) {
        this.player.TakeDamage();
        invader.Destroy();
        this.shakeIntensity = 1;
      }
    }

    for (let i = 0; i < this.invaderShoots.length; i++) {
      const shoot = this.invaderShoots[i];
      if (shoot.GetModel().position.distanceTo(this.camera.position) <= 0.5) {
        shoot.Destroy();
        this.player.TakeDamage();
        this.shakeIntensity = 1;
      }
    }
  }


  private invaderWorldCollisions(): void {
    this.invaders
      .filter((invader) => invader.constructor == GreenInvaderGameObject)
      .forEach((invader) => {
        this.worldWeb.GetMeshes().forEach((el, index, object) => {
          const elBox = new THREE.Box3().setFromObject(el);
          const result = elBox.intersectsBox(invader.GetBox());
          if (result) {
            invader.Destroy();
            this.worldWeb.GetModel().remove(el);
            this.worldWeb.ResetOctree();
            object.splice(index, 1);
          }
        });
      });
  }

  private invadersCollisions(): void {
    for (let i = 0; i < this.playerShoots.length; i++) {
      for (let j = 0; j < this.invaders.length; j++) {
        const playerShoot = this.playerShoots[i];
        const invader = this.invaders[j];

        if (invader.IntersectBoxWith(playerShoot)) {
          playerShoot.Destroy();
          this.playerShoots.splice(i, 1);

          invader.Destroy();
          this.invaders.splice(j, 1);

          i--;
          j--;
        }
      }
    }

    for (let i = 0; i < this.playerShoots.length; i++) {
      for (let j = 0; j < this.invaders.length; j++) {
        const playerShoot = this.playerShoots[i];
        const invader = this.invaders[j];

        if (invader.IntersectBoxWith(playerShoot)) {
          playerShoot.Destroy();
          this.playerShoots.splice(i, 1);

          invader.Destroy();
          this.invaders.splice(j, 1);

          i--;
          j--;
        }
      }
    }
  }

  private updateShoots(_deltaTime: number): void {
    this.playerShoots.forEach((el, index, object) => {
      if (el.IsRemoved()) {
        object.splice(index, 1);
      }
      el.AddScalar(_deltaTime);
    });

    this.invaderShoots.forEach((el, index, object) => {
      if (el.IsRemoved()) {
        object.splice(index, 1);
      }
      el.AddScalar(_deltaTime);
    });
  }

  private animate(): void {
    if (this.player.IsEndGame()) {
      document.exitPointerLock();
      return;
    }
    const deltaTime = this.clock.getDelta();
    this.player.Update(deltaTime);


    this.gameObjectList.forEach((gameObject) => {
      gameObject.Update(deltaTime);
    });

    this.projectiles.filter(el => !el.IsRemoved()).map((gameObject) => {
      if (gameObject.IsRemoved()) return
      gameObject.Update(deltaTime);
      gameObject.WorldCollision(this.worldWeb);
    });

    // if (this.spawnTime <= 0) {
    //   this.spawnTime = this.timer;
    //   SpawnInvaders(
    //     this.scene,
    //     this.invaders,
    //     this.assets,
    //     this.invaderShoots,
    //     [this.worldWeb.GetRandomMesh(), this.worldWeb.GetRandomMesh()]
    //   );
    // }
    // this.spawnTime -= deltaTime;

    this.stats.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  Destroy() {
    this.renderer.setAnimationLoop(null);
  }
}

export default Web;
