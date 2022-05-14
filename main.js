import * as THREE from "./libs/three.module.js";
import {GLTFLoader} from './libs/GLTFLoader.js';
import {EXRLoader} from "./libs/EXRLoader.js";

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
// weird stuff that fixes overexposure
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

const fov = 50;

const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const light = new THREE.PointLight(0xffffff, 5, 100);
light.position.set(0, 0, 5);

// scene.add(light);

function applyenvmap() {
    // this'll be called twice so both the fellow and the env map can load at once, on the 2nd call they'll both be
    // loaded and the map will actually be applied
    if (!envmap || !fellow) return
    fellow.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material.envMapIntensity = 2.0;
            child.material.envMap = envmap;
            child.material.needsUpdate = true;
        }
    });
}


// load the environment map
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

// load the fellow
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

    // stolen from https://discourse.threejs.org/t/keeping-an-object-scaled-based-on-the-bounds-of-the-canvas-really-battling-to-explain-this-one/17574/10
    // resizes the fellow to scale to the viewport
    if (camera.aspect > 1) {
        // window too large
        camera.fov = fov;
    } else {
        // window too narrow
        const cameraHeight = Math.tan(THREE.MathUtils.degToRad(fov / 2));
        const ratio = camera.aspect;
        const newCameraHeight = cameraHeight / ratio;
        camera.fov = THREE.MathUtils.radToDeg(Math.atan(newCameraHeight)) * 2;
    }

    // full screen
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
}

function rainbowatpoint(i) {
    // weird constant brightness rainbow, feels less jank
    // from https://krazydad.com/tutorials/makecolors.php
    const waveintensity = .25;
    const waveheight = .75;
    const frequency = 2 * Math.PI;
    let red = Math.sin(frequency * i) * waveintensity + waveheight;
    let green = Math.sin((frequency * i) + (2 * Math.PI / 3)) * waveintensity + waveheight;
    let blue = Math.sin((frequency * i) + (4 * Math.PI / 3)) * waveintensity + waveheight;
    return new THREE.Color(red, green, blue)
}

let rainbow = 0;
const start = Date.now();
let last = start;

function animate() {
    // frame delta calculations
    let elapsed = Date.now() - start;
    let delta = Date.now() - last;
    last = Date.now();

    // rotate the fellow
    if (fellow) {
        fellow.applyQuaternion(new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    0.009 * delta * (60 / 1000),
                    -0.011 * delta * (60 / 1000),
                    0.01 * delta * (60 / 1000))
            )
        )
    }

    // funny rainbow
    renderer.setClearColor(rainbowatpoint(elapsed / 1000 / 20), 1);
    if (rainbow > 1) rainbow -= 1; // probably fixes float fuckery

    // render
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

document.body.appendChild(renderer.domElement);
animate();

const audios = [
    "./music/Beachwalk (Zen Remix) [lzNpXqvm0_g].m4a",
    "./music/Blank Banshee - Mindtrap [wOhvbXLsLrI].m4a",
    "./music/Carpenter Brut - Turbo Killer [wy9r2qeouiQ].m4a",
    "./music/Intergalactic (Remastered 2009) [6TgTXYFHlfk].m4a",
    "./music/LOOK MUM NO COMPUTER - DESPERADO VESPA (LYRIC VIDEO) [bFGs6xuSJBs].m4a",
    "./music/Source [OHUi8670BIM].m4a",
]
Array.prototype.sample = function () {
    return this[Math.floor(Math.random() * this.length)];
}
let audio = new Audio();
let audioinit = false;

function play() {
    audio.src = audios.sample();
    audio.autoplay = true;
    audio.play();
    audio.addEventListener("ended", play)
}

function audioclick() {
    if (!audioinit) {
        audioinit = true;
        play();
    } else {
        if (audio.paused) {
            audio.play()
        } else {
            audio.pause()
        }
    }
}

document.addEventListener("click", audioclick)
