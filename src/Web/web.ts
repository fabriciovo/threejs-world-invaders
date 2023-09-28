import * as THREE from 'three';

import Prefab from "@/Assets/Prefab.ts";
import {Asset} from "@/type";
import Tower from "@/Assets/Tower.ts";

class Web {
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.Camera;
    private readonly assets: Asset[];
    private prefabs: Prefab[];
    constructor(scene: THREE.Scene, camera: THREE.Camera,) {
        this.scene = scene;
        this.camera = camera;
        this.prefabs = [];
        this.assets = [{
            asset: "Tower",
            position: new THREE.Vector3(80, 0, 96),
            prefabType: Tower
        }, {
            asset: "Tower",
            position: new THREE.Vector3(-90, 0, 71),
            prefabType: Tower
        }, {
            asset: "Tower",
            position: new THREE.Vector3(10, 0, 82),
            prefabType: Tower
        }
            , {
                asset: "Tower",
                position: new THREE.Vector3(-20, 0, 90),
                prefabType: Tower
            }, {
                asset: "Tower",
                position: new THREE.Vector3(40, 0, 82),
                prefabType: Tower
            }, {
                asset: "Tower",
                position: new THREE.Vector3(90, 0, 73),
                prefabType: Tower
            }, {
                asset: "Tower",
                position: new THREE.Vector3(-32, 0, 62),
                prefabType: Tower
            }
        ];

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({
            color: 0xcbcbcb,
            depthWrite: false
        }));
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);

        const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        document.addEventListener('mousedown', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects([plane]);
            console.log(intersects)
            if (intersects.length > 0) {
                const cubeGeometry = new THREE.BoxGeometry();
                const cubeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
                const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

                cube.position.copy(intersects[0].point);

                this.scene.add(cube);
            }
        });

        this._createPrefabs();

    }
    _createPrefabs() {
        for (const {asset, position, prefabType} of this.assets) {
            const prefab = new prefabType(asset, position);

            prefab.Load().then((r:any) => console.log("then", r)).catch((err:Error) => err).finally(()=> {
                this.prefabs.push(prefab)
                prefab.AddToScene(this.scene);
            });
        }

    }
}

export default Web;