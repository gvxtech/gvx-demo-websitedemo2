import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js';
gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector('#ocean-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05263a);
scene.fog = new THREE.FogExp2(0x05263a, 0.012);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0.2, 0.1, 13.5);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

scene.add(new THREE.HemisphereLight(0x9cecff, 0x03111c, 2.1));
const key = new THREE.DirectionalLight(0xc8f5ff, 3.0); key.position.set(-5, 8, 7); scene.add(key);
const rim = new THREE.DirectionalLight(0x168bff, 4.0); rim.position.set(5, 1, -6); scene.add(rim);
const fill = new THREE.PointLight(0x24c8ef, 80, 35); fill.position.set(1, 1, 5); scene.add(fill);
const warm = new THREE.PointLight(0xffb94d, 22, 18); warm.position.set(-3, 1, 1); scene.add(warm);

// Submarine GLB: true 3D geometry, loaded as a rotatable model.
const submarinePivot = new THREE.Group();
const submarineTilt = new THREE.Group();
submarinePivot.add(submarineTilt);
scene.add(submarinePivot);
let submarineLoaded = false;
const loader = new GLTFLoader();
loader.load('./GVX_Submarine_360.glb', (gltf) => {
  const model = gltf.scene;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  model.scale.setScalar(8.7 / maxDim);
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        obj.material.side = THREE.DoubleSide;
        if ('envMapIntensity' in obj.material) obj.material.envMapIntensity = 1.15;
      }
    }
  });
  submarineTilt.add(model);
  submarinePivot.position.set(1.15, -0.28, -1.8);
  submarineTilt.rotation.set(0.03, -0.12, -0.015);
  submarineLoaded = true;
}, undefined, (error) => {
  console.error('Could not load GVX_Submarine_360.glb', error);
  const msg = document.querySelector('.model-loading');
  if (msg) msg.textContent = '3D model could not load — check that GVX_Submarine_360.glb is beside index.html.';
});

// Deep ocean atmosphere: seafloor, floating particles, shafts of light and distant schools.
const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ color: 0x031925, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, -8.2, -34); scene.add(floor);
const rockMat = new THREE.MeshStandardMaterial({ color: 0x092c3c, roughness: 0.98 });
for (let i = 0; i < 22; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + Math.random() * 1.3, 1), rockMat);
  rock.position.set((Math.random() - .5) * 32, -7.3 + Math.random() * .6, -12 - Math.random() * 36);
  rock.scale.y = .45 + Math.random() * .55;
  scene.add(rock);
}
const count = 2800, positions = new Float32Array(count * 3), speeds = new Float32Array(count);
for (let i = 0; i < count; i++) {
  positions[i*3] = (Math.random() - .5) * 42;
  positions[i*3+1] = (Math.random() - .5) * 25;
  positions[i*3+2] = (Math.random() - .5) * 50 - 8;
  speeds[i] = .15 + Math.random() * .55;
}
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xb5efff, size: .045, transparent: true, opacity: .68, sizeAttenuation: true })); scene.add(particles);
const rays = new THREE.Group(); scene.add(rays);
for (let i = 0; i < 13; i++) {
  const ray = new THREE.Mesh(new THREE.PlaneGeometry(.75 + Math.random()*.9, 26), new THREE.MeshBasicMaterial({ color: 0x63dfff, transparent: true, opacity: .045 + Math.random()*.025, side: THREE.DoubleSide, depthWrite: false }));
  ray.position.set(-12 + i*2, 4, -17 - i*.9); ray.rotation.z = -.12; rays.add(ray);
}
const fishGroup = new THREE.Group(); scene.add(fishGroup);
for (let i = 0; i < 42; i++) {
  const fish = new THREE.Mesh(new THREE.ConeGeometry(.045, .24, 5), new THREE.MeshBasicMaterial({ color: 0x8eeaff, transparent: true, opacity: .48 }));
  fish.rotation.z = -Math.PI/2; fish.position.set((Math.random()-.5)*18, -2.8+Math.random()*3, -8-Math.random()*25); fishGroup.add(fish);
}

let mx = 0, my = 0, scrollProgress = 0, drag = false, lastX = 0, lastY = 0;
let userRotationY = 0, userRotationX = 0, velocityY = 0;
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { drag = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging'); } });
canvas.addEventListener('pointermove', (e) => {
  mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2;
  const glow = document.querySelector('.cursor-glow'); if (glow) { glow.style.left = e.clientX+'px'; glow.style.top = e.clientY+'px'; }
  if (drag) { const dx = e.clientX-lastX, dy=e.clientY-lastY; userRotationY += dx*.009; userRotationX += dy*.006; velocityY = dx*.002; lastX=e.clientX; lastY=e.clientY; }
});
canvas.addEventListener('pointerup', () => { drag=false; canvas.classList.remove('is-dragging'); });
canvas.addEventListener('pointercancel', () => { drag=false; canvas.classList.remove('is-dragging'); });
// Touch: horizontal swipes rotate the model while vertical swipes remain page scrolling.
let touchX = null;
canvas.addEventListener('touchstart', e => { if (e.touches.length===1) touchX=e.touches[0].clientX; }, {passive:true});
canvas.addEventListener('touchmove', e => { if (touchX!==null && e.touches.length===1) { const x=e.touches[0].clientX, dx=x-touchX; if (Math.abs(dx)>2) userRotationY += dx*.009; touchX=x; } }, {passive:true});
canvas.addEventListener('touchend', () => touchX=null, {passive:true});

const cameraAim = { x: 1.05, y: -.15, z: -1.8 };
const journey = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=210%', scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: s => scrollProgress=s.progress } });
journey
  .to(camera.position, { x: -.3, y: .12, z: 10.5, ease: 'none' }, 0)
  .to(cameraAim, { x: 1.05, y: -.2, z: -1.8, ease: 'none' }, 0)
  .to(camera.position, { x: 2.7, y: .1, z: 7.2, ease: 'none' }, .45)
  .to(cameraAim, { x: 1.2, y: -.2, z: -1.8, ease: 'none' }, .45)
  .to(camera.position, { x: -.8, y: -.45, z: 13.8, ease: 'none' }, .82)
  .to(cameraAim, { x: .1, y: 0, z: -2.8, ease: 'none' }, .82)
  .to(submarinePivot.position, { x: 1.0, y: -.2, z: -5.0, ease: 'none' }, .78)
  .to('.hero-copy', { y: -105, opacity: 0, ease: 'none' }, .32)
  .to('.hero-topline,.hero-stats,.hero-side-note', { opacity: 0, ease: 'none' }, .22);

gsap.to('.hero-title span', { y: 0, opacity: 1, duration: 1.2, stagger: .16, ease: 'power4.out', delay: .2 });
gsap.from('.hero .eyebrow,.hero-bottom-copy', { y: 22, opacity: 0, duration: 1, stagger: .2, ease: 'power3.out', delay: .65 });
gsap.utils.toArray('.reveal').forEach(el => gsap.to(el, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } }));
gsap.utils.toArray('.service-row').forEach((el,i) => gsap.from(el, { x: -35, opacity: 0, duration: .7, delay: i*.06, scrollTrigger: { trigger: el, start: 'top 88%' } }));
gsap.to('.manifesto-content', { y: -90, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1 } });
ScrollTrigger.create({ trigger: document.body, start: 0, end: 'max', onUpdate: s => { const bar=document.querySelector('.scroll-progress span'); if(bar) bar.style.width=(s.progress*100)+'%'; } });

function animate(t) {
  requestAnimationFrame(animate);
  const time = t * .0002;
  particles.rotation.y = time * .055; particles.position.y = Math.sin(time) * .16;
  const arr = pGeo.attributes.position.array;
  for (let i=0;i<count;i++) { arr[i*3+1] += speeds[i]*.002; if(arr[i*3+1]>13) arr[i*3+1]=-13; }
  pGeo.attributes.position.needsUpdate = true;
  fishGroup.position.x = Math.sin(time*.7)*.25;
  if (submarineLoaded) {
    if (!drag) { userRotationY += velocityY; velocityY *= .94; }
    submarineTilt.rotation.y += (userRotationY - submarineTilt.rotation.y) * .09;
    submarineTilt.rotation.x += (THREE.MathUtils.clamp(userRotationX, -.42, .42) - submarineTilt.rotation.x) * .08;
    submarinePivot.position.y = -.28 + Math.sin(time*1.4)*.12;
  }
  camera.lookAt(cameraAim.x + mx*.11*(1-scrollProgress), cameraAim.y - my*.07*(1-scrollProgress), cameraAim.z);
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize', () => { camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); ScrollTrigger.refresh(); });
const menu=document.querySelector('.menu-toggle');
if(menu) menu.addEventListener('click',()=>{ let panel=document.querySelector('.mobile-panel'); if(panel){panel.remove();return;} panel=document.createElement('div'); panel.className='mobile-panel'; panel.innerHTML='<a href="#about">ABOUT</a><a href="#services">CAPABILITIES</a><a href="#work">SELECTED WORK</a><a href="#contact">LET’S TALK ↗</a>'; document.body.appendChild(panel); panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>panel.remove())); });
