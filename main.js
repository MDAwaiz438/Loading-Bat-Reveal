import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const loadCanvasContainer = document.getElementById('loader');

// Global setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Pin the canvas to fully cover the loader container instead of relying
// solely on flex-centering, which is fragile across resizes.
renderer.domElement.style.cssText = 'position:absolute;inset:0;z-index:2;';
loadCanvasContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const batPathStr = "M483.92 0S481.38 24.71 466 40.11c-11.74 11.74-24.09 12.66-40.26 15.07-9.42 1.41-29.7 3.77-34.81-.79-2.37-2.11-3-21-3.22-27.62-.21-6.92-1.36-16.52-2.82-18-.75 3.06-2.49 11.53-3.09 13.61S378.49 34.3 378 36a85.13 85.13 0 0 0-30.09 0c-.46-1.67-3.17-11.48-3.77-13.56s-2.34-10.55-3.09-13.61c-1.45 1.45-2.61 11.05-2.82 18-.21 6.67-.84 25.51-3.22 27.62-5.11 4.56-25.38 2.2-34.8.79-16.16-2.47-28.51-3.39-40.21-15.13C244.57 24.71 242 0 242 0H0s69.52 22.74 97.52 68.59c16.56 27.11 14.14 58.49 9.92 74.73C170 140 221.46 140 273 158.57c69.23 24.93 83.2 76.19 90 93.6 6.77-17.41 20.75-68.67 90-93.6 51.54-18.56 103-18.59 165.56-15.25-4.21-16.24-6.63-47.62 9.93-74.73C656.43 22.74 726 0 726 0z";

function createCustomBatGeometry() {
  const loader = new SVGLoader();
  const parsed = loader.parse(`<svg viewBox="0 0 800 300"><path d="${batPathStr}"></path></svg>`);
  const shapes = SVGLoader.createShapes(parsed.paths[0]);
  const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 0.04, bevelEnabled: false });
  geometry.center();
  geometry.scale(0.012, -0.012, 0.012);
  return geometry;
}

const geometry = createCustomBatGeometry();

const material = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  side: THREE.DoubleSide,
  vertexShader: `
    uniform float uTime;
    attribute float aWingSpeed;
    attribute float aSeed;

    void main() {
      vec3 transformed = vec3(position);
      float flapTimeline = uTime * aWingSpeed + aSeed;
      float distanceFromCenter = abs(transformed.x);

      if (distanceFromCenter > 0.15) {
        float wave = sin(flapTimeline) * 0.7 * (distanceFromCenter - 0.15);
        transformed.y += wave;
        transformed.z += abs(wave) * 0.2;
      }

      vec4 instancePosition = instanceMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Matte White
    }
  `
});

const count = 200;
const speedArray = new Float32Array(count);
const seedArray = new Float32Array(count);
for (let i = 0; i < count; i++) {
  speedArray[i] = 16 + Math.random() * 10;
  seedArray[i] = Math.random() * 100;
}

geometry.setAttribute('aWingSpeed', new THREE.InstancedBufferAttribute(speedArray, 1));
geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedArray, 1));

const batMesh = new THREE.InstancedMesh(geometry, material, count);
scene.add(batMesh);

const batsData = [];
for (let i = 0; i < count; i++) {
  batsData.push({ speed: 0, seed: 0, waveSpeed: 0, scaleModifier: 0, innateSpread: 0, currentProgress: 0, startX: 0, startY: 0 });
}

const dummy = new THREE.Object3D();
const clock = new THREE.Clock();

let isAnimating = false;
let loopTimeout = null;
let soundPlayed = false;

// ── Timing constants (tune these together) ──────────────────────────────
const BAT_SPEED_MIN = 45;       // units/sec, was 25
const BAT_SPEED_RANGE = 20;     // was 15 (so range is 45-65)
const REVEAL_START = 0.5;       // when the CSS wipe (.done) triggers
const CSS_WIPE_DURATION = 1.3;  // must match style.css transition duration
const FLIGHT_END = REVEAL_START + CSS_WIPE_DURATION + 0.4; // small buffer after wipe finishes
const LOOP_PAUSE_MS = 1500;     // pause between loops, was 3000
// ──────────────────────────────────────────────────────────────────────

function initBats() {
  for (let i = 0; i < count; i++) {
    const stagger = i / count;
    const innateSpread = (Math.random() * 20) - 10;

    batsData[i] = {
      startX: -40 - (stagger * 50),
      startY: -30 - (stagger * 50),
      currentProgress: -(stagger * 60) - (Math.random() * 10),
      speed: BAT_SPEED_MIN + Math.random() * BAT_SPEED_RANGE,
      waveSpeed: 1 + Math.random() * 3,
      seed: Math.random() * 100,
      scaleModifier: 0.4 + Math.random() * 0.8,
      innateSpread: innateSpread
    };
  }
}

function startLoop() {
  initBats();
  soundPlayed = false;

  // Snap the black screen back instantly
  loadCanvasContainer.classList.add('no-transition');
  loadCanvasContainer.classList.remove('done');

  // Force reflow so transition snaps immediately
  void loadCanvasContainer.offsetWidth;

  // Re-enable transition for the wipe
  loadCanvasContainer.classList.remove('no-transition');

  clock.start();
  isAnimating = true;
  animateLoader();
}

function stopAndResetLoop() {
  isAnimating = false;

  // Clear the canvas by moving dummy off-screen
  const clearMatrix = new THREE.Matrix4().makeTranslation(999, 999, 999);
  for (let i = 0; i < count; i++) {
    batMesh.setMatrixAt(i, clearMatrix);
  }
  batMesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);

  // Wait, then start again
  clearTimeout(loopTimeout);
  loopTimeout = setTimeout(() => {
    startLoop();
  }, LOOP_PAUSE_MS);
}

function animateLoader() {
  if (!isAnimating) return;
  requestAnimationFrame(animateLoader);

  const time = clock.getElapsedTime();
  material.uniforms.uTime.value = time;

  for (let i = 0; i < count; i++) {
    const bat = batsData[i];
    bat.currentProgress += bat.speed * 0.016;

    const spreadFactor = Math.exp(-(bat.currentProgress * bat.currentProgress) / 200.0);
    const dynamicSpread = bat.innateSpread * (1.0 + spreadFactor * 3.5);

    const translationX = bat.startX + (bat.currentProgress * 1.2) - dynamicSpread;
    const translationY = bat.startY + (bat.currentProgress * 1.0) + dynamicSpread;
    const translationZ = -30 + (bat.currentProgress * 0.6);

    const floatDriftX = Math.sin(time * bat.waveSpeed + bat.seed) * 1.5;
    const floatDriftY = Math.cos(time * bat.waveSpeed + bat.seed) * 0.8;

    dummy.position.set(translationX + floatDriftX, translationY + floatDriftY, translationZ);

    const distanceScale = THREE.MathUtils.mapLinear(translationZ, -30, 5, 0.1, 1.5);
    const finalScale = Math.max(0.01, distanceScale) * bat.scaleModifier;
    dummy.scale.set(finalScale, finalScale, finalScale);

    dummy.rotation.set(0.1, -0.3, 0.4);
    dummy.updateMatrix();
    batMesh.setMatrixAt(i, dummy.matrix);
  }

  batMesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);

  if (time >= REVEAL_START - 0.2 && !soundPlayed) {
    soundPlayed = true;
    const audio = document.getElementById('batSound');
    if (audio) {
      audio.currentTime = 0;
      // Play sound, suppressing the NotAllowedError if the user hasn't clicked yet
      audio.play().catch(err => console.warn('Click anywhere on the page to enable sound!'));
    }
  }

  if (time >= REVEAL_START && !loadCanvasContainer.classList.contains('done')) {
    loadCanvasContainer.classList.add('done');
  }
  if (time > FLIGHT_END) {
    stopAndResetLoop();
  }
}

// Start the infinite loop
startLoop();