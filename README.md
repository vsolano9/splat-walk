# Splat Walk

[Live demo](https://splat-walk.vercel.app) · [Source](https://github.com/vsolano9/splat-walk)

Explore a real capture with **three.js r186's native WebGPU `GaussianSplat` and `SPZLoader`**, inside a small Next.js + Tailwind app. No third-party splat renderer, backend, auth or API keys.

The bundled example is a cave-lion head. Swap in your own room-scale scan for a walkthrough. Controls are free-flight, without gravity or collision detection.

## Run

Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` in recent Chromium or Safari 26+ with WebGPU/hardware acceleration available. WebGPU needs HTTPS or localhost. Missing WebGPU, unavailable adapters and load failures have explanatory states.

```sh
npm run build
npm start
```

For Vercel: import this repository, select the Next.js preset and leave the project root at the repository root. No environment variables are required. Build command: `npm run build`.

## Controls

- Click **Explore** or empty canvas to capture the mouse; **Esc** releases it.
- **W/A/S/D** fly; **Q/E** move down/up. Mouse movement looks around.
- Drag-to-look works without pointer lock. Focus the canvas and use arrow keys for keyboard-only looking.
- **Touch:** left-half drag moves, right-half drag looks. Both zones work together; lift to stop.
- Click/tap a ring or its nearby scan surface to open a detail. Bottom buttons provide the same details without precise 3D pointing.
- **Reset** returns to the starting view. **Controls** restores the four-second hint.

## Use your own scan

1. Capture Gaussian splats with **Scaniverse** or **Polycam**, not a textured mesh export.
2. Clean in **SuperSplat 3.0**: crop, remove floaters and unnecessary background, and keep the scene object/room-scale.
3. Export `.spz`. If your editor only offers `.ply`/`.splat`, convert the cleaned export using [Niantic's SPZ converter](https://scaniverse.com/spz). The loader supports SPZ v1–v4.
4. Place the file in `public/scenes/`, then change the single `SPZ_URL` constant in `lib/scene.config.ts`, for example `/scenes/my-room.spz`. Public HTTPS URLs also work when their host allows CORS.
5. Adjust `SPAWN_POSITION`, `LOOK_AT`, `SCAN_ROTATION` and `MOVE_SPEED` for the scan's axes and scale. The lion uses an X half-turn; yours may not. There is no automatic recentering or rescaling.
6. Set `HOTSPOTS` to `{ position: [x, y, z], label, description }` entries. Positions are world coordinates after the scan rotation, with Y up. Adjust `HOTSPOT_RADIUS` and `MARKER_SIZE` for your units. Update the title, canvas label and attribution to match your scan.

During development, `window.__splatWalk` in the page's main-world console reports camera coordinates, projected hotspot positions, last raycast point/source, revision and splat count. It is absent in production. A picked surface point helps place annotations.

## Implementation

- `app/page.tsx`, `app/layout.tsx`: one App Router page and metadata.
- `components/SplatScene.tsx`: WebGPU renderer, scan, native raycasts, rings, accessible DOM HUD, responsive camera and resource cleanup.
- `lib/controls.ts`: one hook for pointer-lock mouse, keyboard and two-zone touch input.
- `lib/scene.config.ts`: the scan URL, transforms, spawn, speed and annotations.
- `app/globals.css`: Tailwind v4 and a small dark HUD palette.
- `lib/three-addons.d.ts`: source-matched declarations for the two new addons. The installed runtime is r186; current `@types/three` is still r185.4. Remove these declarations when DefinitelyTyped includes the addons.

The scan is the visual treatment. Opaque panels preserve contrast over arbitrary captures; no automatic camera animation. `renderer.setAnimationLoop` owns the requestAnimationFrame-backed loop. DPR is capped at 2 desktop / 1.5 coarse-pointer, and rendering pauses in hidden tabs. The component cleans up source and generated geometries, materials, listeners, pending fetches and renderer resources.

A deliberate click invokes native Gaussian ellipsoid raycasting and selects a configured hotspot near the surface hit. Marker raycasting covers rings when no nearby surface qualifies. No mesh proxy or fake scan rendering.

## Verification

Verified in real Chromium using the native WebGPU backend:

- 195,099 splats rendered; final load had zero console errors or warnings.
- WASD and Q/E changed camera position; real pointer lock and mouse-look rotation worked.
- Native splat raycasting opened the detail card on desktop and touch.
- Left touch drag moved; right touch drag looked.
- Desktop, 390px portrait and 320px reflow checked, including reduced motion and light system preference with the intentional dark HUD.
- Missing-WebGPU and HTTP 503 states exercised, then recovered to the real scan.
- `npm run build` passed, including TypeScript checking and static prerendering.

Local browser receipts are gitignored in `_receipts/`. Physical mobile hardware, Safari and induced physical GPU loss have not been tested. Large-scene streaming/LOD, collision, multiplayer, auth and CMS are out of scope.

## License and sample attribution

Application code is [MIT licensed](LICENSE).

The bundled `public/scenes/lion.v3.spz` is the unmodified 4,303,196-byte [official three.js sample](https://threejs.org/examples/models/spz/lion.v3.spz), **licensed separately under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), not MIT**. Its [source scene](https://superspl.at/scene/56155c3f), shared by **Renaud**, credits **Joanna Kobierska** and depicts a reconstruction of a female cave lion. This viewer rotates the sample and adds annotations without modifying the asset. Preserve the sample's attribution when sharing it.

Native API references:
- [Official r186 example source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_gaussian_splat.html)
- [Ben Houston's native splat how-to](https://ben3d.ca/blog/how-to-use-threejs-native-gaussian-splats)
