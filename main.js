import * as THREE from "./libs/three.module.js";
import {GLTFLoader} from './libs/GLTFLoader.js';
import {EXRLoader} from "./libs/EXRLoader.js";

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

const fov = 75;
const planeAspectRatio = 1;

const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const light = new THREE.PointLight(0xffffff, 5, 100);
light.position.set(0, 0, 5);
// scene.add(light);

renderer.setClearColor(0xcccccc, 1);

function applyenvmap() {
    if (!envmap || !fellow) return
    fellow.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material.envMapIntensity = 2.0;
            child.material.envMap = envmap;
            child.material.needsUpdate = true;
        }
    });
}

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
let exrCubeRenderTarget, exrBackground;
let envmap;
new EXRLoader()
    // .setDataType(THREE.UnsignedByteType)
    .load(
        "./lilienstein_1k.exr",
        function (texture) {
            exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
            exrBackground = exrCubeRenderTarget.texture;
            envmap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
            applyenvmap()
        }
    );

const loader = new GLTFLoader();
let fellow;
loader.load('./tbh-character-autism-creature.glb', function (gltf) {
    fellow = gltf.scene;
    applyenvmap()
    scene.add(fellow);
    console.debug(fellow)

}, console.debug, console.error);


window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;

    if (camera.aspect > planeAspectRatio) {
        // window too large
        camera.fov = fov;
    } else {
        // window too narrow
        const cameraHeight = Math.tan(THREE.MathUtils.degToRad(fov / 2));
        const ratio = camera.aspect / planeAspectRatio;
        const newCameraHeight = cameraHeight / ratio;
        camera.fov = THREE.MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
}

function animate() {
    if (fellow) {
        fellow.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.009, -0.011, 0.01)))
    }

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

document.body.appendChild(renderer.domElement);
animate();