import * as THREE from "./libs/three.module.js";
import {GLTFLoader} from './libs/GLTFLoader.js';
import {EXRLoader} from "./libs/EXRLoader.js";
import {Quaternion} from "./libs/three.module.js";
import {RoomEnvironment} from "./libs/RoomEnvironment.min.js";

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

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0).texture;

// load the fellow
const loader = new GLTFLoader();
let fellow;
let ready = false;
loader.load('./tbh-creature-fixed.glb', function (gltf) {
    fellow = gltf.scene;
    document.querySelector("#loading").remove()
    scene.add(fellow)
    ready = true;
    // scene.add(fellow);
    // console.debug(fellow)
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

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function rawbowatpoint(i) {
    // weird constant brightness rainbow, feels less jank
    // from https://krazydad.com/tutorials/makecolors.php
    const waveintensity = .25;
    const waveheight = .75;
    const frequency = 2 * Math.PI;
    let red = Math.sin(frequency * i) * waveintensity + waveheight;
    let green = Math.sin((frequency * i) + (2 * Math.PI / 3)) * waveintensity + waveheight;
    let blue = Math.sin((frequency * i) + (4 * Math.PI / 3)) * waveintensity + waveheight;
    return [red, green, blue]
}

function rainbowatpoint(i) {
    return new THREE.Color(...rawbowatpoint(i))
}

function rbowgatpoint(i) {
    const rb = rawbowatpoint(i)
    return `rgb(${rb[0] * 255},${rb[1] * 255},${rb[2] * 255})`
}

const start = Date.now();
let last = start;

function arrayfromfunc(len, func) {
    return Array.from({length: len}, func);
}

// random smooth 3vectors to convert to euler to convert to rotations
const curve = new THREE.CatmullRomCurve3(
    arrayfromfunc(100, () =>
        new THREE.Vector3(...arrayfromfunc(3, () => randomFloat(-1, 1)))
    ),
    true,
    "centripetal",
    0.4
);

function animate() {
    // frame delta calculations
    let elapsed = Date.now() - start;
    let delta = Date.now() - last;
    last = Date.now();

    // rotate the fellow
    if (ready) {
        // NORMALIZE the vector to keep the rotation speed constant!! (well idk constant but never 0) tbh never stops...
        let randvec = curve.getPoint(elapsed / 1000 / 300).normalize().multiplyScalar(0.02)
        fellow.applyQuaternion(
            new THREE.Quaternion().setFromEuler(new THREE.Euler().setFromVector3(randvec))
        )
    } else {
        document.getElementById("loading").style.color = rbowgatpoint((elapsed / 1000 / 20) + 0.5)
    }

    // funny rainbow
    renderer.setClearColor(rainbowatpoint(elapsed / 1000 / 20), 1);

    // render
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

document.body.appendChild(renderer.domElement);
animate();

/*
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
audio.preload = "auto";
let audioinit = false;

function play() {
    audio.pause();
    audio.src = audios.sample();
    audio.load();
    audio.play().finally(() => {
        audio.addEventListener("ended", play)
    });
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

document.addEventListener("click", (e) => {
    e.preventDefault()
    audioclick()
})
*/
