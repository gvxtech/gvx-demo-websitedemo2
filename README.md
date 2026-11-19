# GVX TECH — Underwater 360° Experience

A cinematic GVX Tech website using HTML, CSS, JavaScript, Three.js, GLTFLoader and GSAP ScrollTrigger.

## What's included
- Your supplied `GVX_Submarine_360.glb` is loaded as a real 3D model (not a flat image).
- Drag with a mouse to rotate the submarine around 360 degrees. Horizontal touch swipes rotate it on mobile while vertical swipes continue scrolling.
- The model has inertia and gentle floating motion.
- A continuous underwater WebGL environment (water-coloured fog, light shafts, drifting particles, distant fish and seabed) remains behind every section of the website.
- Scroll-driven camera movement in the pinned hero sequence.
- Responsive GVX Tech sections, mobile navigation and GSAP reveals.

## Run locally
1. Keep `index.html`, `style.css`, `main.js`, and `GVX_Submarine_360.glb` in the same folder.
2. Start a local server from this folder:
   - `python3 -m http.server 8000`
3. Open `http://localhost:8000` in a modern browser.

The page imports Three.js and GSAP from jsDelivr, so an internet connection is required. The GLB is loaded locally using a relative path; preserve its exact filename and upload it beside `index.html` when deploying.

## 360 interaction
- Desktop: click and drag the submarine horizontally/vertically.
- Mobile: swipe horizontally over the scene to rotate; swipe vertically to scroll the page.
- The 3D object is the supplied GLB model, with its full geometry and materials.
