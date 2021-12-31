import * as THREE from "three/build/three.module.js";
import { useEffect, useState } from "react";
import "./index.css";
import axios from "axios";

const Character = () => {
  var scene, camera, cameras, cameraIndex, renderer, clock, player;

  const [userName, setUserName] = useState("");
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    init();
  }, []);

  function init() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    let col = 0x605050;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(col);
    scene.fog = new THREE.Fog(col, 10, 100);

    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 7);
    camera.lookAt(0, 1.5, 0);

    const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820);
    scene.add(ambient);

    const lights = {};
    lights.spot = new THREE.SpotLight(0xffffff, 1, 20, 0.88, 0.5);
    lights.spot.position.set(1, 10, 1);
    lights.spot.castShadow = true;
    lights.spot.power = 17;
    lights.spot.shadow.camera.near = 3;
    lights.spot.shadow.camera.farr = 30;
    lights.spot.shadow.mapSize.width = 1024;
    lights.spot.shadow.mapSize.height = 1024;

    lights.spotCameraHelper = new THREE.CameraHelper(lights.spot.shadow.camera);
    lights.spotCameraHelper.visible = false;
    scene.add(lights.spotCameraHelper);

    lights.spotHelper = new THREE.SpotLightHelper(lights.spot);
    lights.spotHelper.visible = false;
    scene.add(lights.spotHelper);
    scene.add(lights.spot);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshStandardMaterial();
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const grid = new THREE.GridHelper(200, 80);
    scene.add(grid);

    player = new THREE.Group();
    scene.add(player);

    const bodyGeomety = new THREE.CylinderBufferGeometry(0.5, 0.3, 1.6, 20);
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const body = new THREE.Mesh(bodyGeomety, material);
    body.position.y = 0.8;
    body.scale.z = 0.5;
    body.castShadow = true;
    player.add(body);

    const headGeometry = new THREE.SphereBufferGeometry(0.3, 20, 15);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 2;
    body.castShadow = true;
    player.add(head);

    addKeyboardControl();
    //Add cameras
    cameras = [];
    cameraIndex = 0;
    const followCam = new THREE.Object3D();
    followCam.position.copy(camera.position);
    player.add(followCam);
    cameras.push(followCam);

    const frontCam = new THREE.Object3D();
    frontCam.position.set(0, 3, -8);
    player.add(frontCam);
    cameras.push(frontCam);

    const overheadCam = new THREE.Object3D();
    overheadCam.position.set(0, 20, 0);
    cameras.push(overheadCam);

    window.addEventListener("resize", resize, false);

    update();
  }

  function changeCamera() {
    cameraIndex++;
    if (cameraIndex >= cameras.length) cameraIndex = 0;
  }

  function addKeyboardControl() {
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
  }

  function keyDown(evt) {

    let forward =
      player.userData !== undefined && player.userData.move !== undefined
        ? player.userData.move.forward
        : 0;
    let turn =
      player.userData != undefined && player.userData.move !== undefined
        ? player.userData.move.turn
        : 0;
    switch (evt.keyCode) {
      case 38:
        forward = -1;
        break;
      case 40:
        forward = 1;
        break;
      case 37:
        turn = 1;
        break;
      case 39:
        turn = -1;
        break;
      default:
        break;
    }

    playerControl(forward, turn);
  }

  function keyUp(evt) {
    let forward =
      player.userData !== undefined && player.userData.move !== undefined
        ? player.userData.move.forward
        : 0;
    let turn =
      player.move != undefined && player.userData.move !== undefined
        ? player.userData.move.turn
        : 0;
    switch (evt.keyCode) {
      case 38:
        forward = 0;
        break;
      case 40:
        forward = 0;
        break;
      case 39:
        turn = 0;
        break;
      case 37:
        turn = 0;
        break;
      default:
        break;
    }

    playerControl(forward, turn);
  }

  function playerControl(forward, turn) {
    if (forward == 0 && turn == 0) {
      delete player.userData.move;
    } else {
      if (player.userData === undefined) player.userData = {};
      player.userData.move = { forward, turn };
    }
  }

  function update() {
    requestAnimationFrame(update);
    renderer.render(scene, camera);
    const dt = clock.getDelta();
    if (player.userData !== undefined && player.userData.move !== undefined) {
      setPlayerPosition(player.position);
      player.translateZ(player.userData.move.forward * dt * 5);
      player.rotateY(player.userData.move.turn * dt);
    }

    //Add camera lerping
    camera.position.lerp(
      cameras[cameraIndex].getWorldPosition(new THREE.Vector3()),
      0.05
    );
    const pos = player.position.clone();
    pos.y += 3;
    camera.lookAt(pos);
  }
  function save() {
    axios
      .post("http://localhost:8080/add", {
        userName: userName,
        location: playerPosition,
      })
      .then((r) => {
      });
  }
  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  function changeUserName(value) {
    setUserName(value);
  }
  function load() { 
        //load first location of player based on latest save
        axios.get(`http://localhost:8080/get?userName=${userName}`).then((result) => {
          setPlayerPosition(result.data);   
        });
  }
  return (
    <div>
      <button id="camera-btn" onClick={() => changeCamera()}>
        Camera
      </button>
      <button id="save-btn" onClick={() => save()}>
        Save
      </button>
      <button id="load-btn" onClick={() => load()}>
        Load Pervios data
      </button>
      <div className="input-box">
        <input
          onChange={(e) => changeUserName(e.target.value)}
          type="text"
          id="inputUsername"
          placeholder="Whats your name?"
        />
      </div>
    </div>
  );
};
export default Character;
