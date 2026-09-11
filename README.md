# Splat Walk

A small, Vercel-hostable Next.js page for exploring a real capture with **three.js r186's native WebGPU `GaussianSplat` and `SPZLoader`**. No third-party splat renderer.

The included sample is a **cave lion head**, not a room. Replace it with your own room-scale scan for a walkthrough. The app uses free-flight controls, not gravity or collision detection.

## Run

Requires Node.js 20.9+ and npm (matching the neighbouring Work projects).

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` in a recent Chromium browser or Safari 26+ with WebGPU and hardware acceleration available. WebGPU requires HTTPS or localhost. Unsupported browsers and unavailable adapters get an explanatory message; load failures have a reload action.

For another port: `npm run dev -- --port 3014`.

Standard Vercel settings: Next.js framework, project root this folder, install `npm ci`, build `npm run build`. No environment variables or server services are required. This assignment was verified locally, not pushed or deployed. The production build was not run as part of the explicitly browser-only verification scope.

## Explore

- **Explore** or click empty canvas: capture the mouse. **Esc** releases it.
- **W/A/S/D**: fly forward/left/back/right. **Q/E**: descend/ascend.
- Move the mouse to look. Drag-to-look also works without pointer lock; focus the canvas and use arrow keys for keyboard-only looking.
- **Touch:** drag on the left half to move; drag on the right half to look. Both zones work together. Lift your finger to stop.
- Click/tap a ring or its nearby scan surface to open its detail. The three bottom buttons provide the same details without precise 3D pointing.
- **Reset** returns to the configured starting view. **Controls** briefly restores the hint, which fades after four seconds.

## Swap in your own scan

1. Capture in **Scaniverse** or **Polycam**. Export the Gaussian splat capture rather than a textured mesh.
2. Open it in **SuperSplat 3.0**, crop the scene, remove floaters and unnecessary background, and keep it object/room-scale.
3. Export `.spz`. If your editor's export offers only `.ply`/`.splat`, convert that result with [Niantic's SPZ converter](https://scaniverse.com/spz). Native `SPZLoader` reads gzip SPZ v1–v3 and zstd SPZ v4.
4. Put the file in `public/scenes/`, then change **only `SPZ_URL`** in `lib/scene.config.ts`, for example to `/scenes/my-room.spz`. A public HTTPS URL also works if its host permits cross-origin requests.
5. Set `SPAWN_POSITION`, `LOOK_AT`, `SCAN_ROTATION`, and `MOVE_SPEED` for that scan's axes and scale. The sample needs a half-turn around X; your scan may not. Positions are in world space after that rotation, with Y up. There is no automatic recentering/scaling.
6. Replace `HOTSPOTS` with meaningful `{ position: [x, y, z], label, description }` entries. Adjust `HOTSPOT_RADIUS` (surface-selection distance) and `MARKER_SIZE` for the scan's units. Update the page title, canvas label and footer attribution to match your scan and its rights.

During `npm run dev`, inspect `window.__splatWalk` in the **page's main-world console** for camera coordinates, projected hotspot positions, last pick source/point, revision and splat count. This getter is absent from the production bundle. A picked surface point is useful when placing hotspots.

## Structure and decisions

- `app/page.tsx`, `app/layout.tsx`: one App Router page and metadata.
- `components/SplatScene.tsx`: loading/error states, renderer and scan ownership, native raycasts, ring markers, DOM HUD, resize and disposal.
- `lib/controls.ts`: one controls hook, with pointer/keyboard/touch listeners and a frame-delta update. Input is cleared on blur, visibility loss, pointer cancellation and disposal.
- `lib/scene.config.ts`: the single scan URL, transforms, spawn, speed and hotspot configuration.
- `app/globals.css`: Tailwind v4 plus the compact, dark HUD palette and focus styling.
- `lib/three-addons.d.ts`: two source-matched declarations because the latest available `@types/three` is r185.4, while the installed runtime is r186. Remove this file when DefinitelyTyped includes these addons.

The full-bleed scan is the visual treatment. Opaque dark panels keep copy readable over any capture; no automatic camera animation. Camera FOV expands on portrait screens to preserve subject framing. Rendering uses `renderer.setAnimationLoop`, three.js's requestAnimationFrame-backed lifecycle API. Pixel ratio is capped at 2 desktop / 1.5 coarse pointer; the loop pauses while the page is hidden. Source geometry, generated splat geometry/material, shared marker resources, listeners, in-flight fetch and renderer are cleaned up by the scene owner.

Picking uses the real r186 Gaussian ellipsoid raycast and finds a configured hotspot near its surface hit. Marker raycasts cover the ring when no nearby surface qualifies. Native surface picking was verified; it is not a placeholder or mesh proxy.

The Work context map has no demos/experiments owner, so the requested fallback location `demos/splat-walk/` owns an independent repository on `feat/splat-walk`. The implementation plan was recorded here before code: verify native exports, render the sample, wire input and picking, verify the real browser, document replacement, commit named files. This constrained prototype keeps its visual/architecture notes here rather than adding a separate design system or mockup pipeline.

## Sample and source credits

Bundled `public/scenes/lion.v3.spz` is the unmodified 4,303,196-byte [official three.js sample](https://threejs.org/examples/models/spz/lion.v3.spz), 195,099 splats. The [source scene](https://superspl.at/scene/56155c3f) is shared by **Renaud**, credits **Joanna Kobierska**, and depicts a reconstruction of a female cave lion. Licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This viewer rotates the sample and adds annotations; it does not modify the asset. Preserve attribution when sharing the sample.

API references inspected before implementation:
- [Official r186 example source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_gaussian_splat.html).
- [Ben Houston's native splat how-to](https://ben3d.ca/blog/how-to-use-threejs-native-gaussian-splats).
- Installed `three@0.186.0` addon source and actual Node imports confirmed `GaussianSplat`, `SPZLoader`, `WebGPURenderer` and native `raycast`.

## Verification

Real Chromium, native WebGPU backend, September 11, 2026. Receipts are local and gitignored in `_receipts/`:

- `desktop.png`: 195,099-splat lion rendered, 1440×1000.
- `wasd-forward.png`: W moved camera from `[0, 0.42, 1.2]` to approximately `[-0.00371, 0.38142, 1.02935]`.
- `hotspot-card.png`: clicking the brow selected **Face to face** through the native splat raycast.
- `mobile.png`, `mobile-hotspot.png`: 390×844 portrait framing and tap-selected card.
- `narrow-reduced-motion.png`: 320px reflow, light system preference with the intentional dark HUD, reduced motion; no horizontal overflow or card/navigation overlap.
- `webgpu-required.png`, `load-error.png`: missing WebGPU and injected HTTP 503, followed by recovery to the real capture.
- `verification.json`: camera, mouse-look, touch, height controls, native pick point and console evidence.

Pointer lock was confirmed on the real canvas and mouse motion changed camera rotation. Left-zone touch moved the camera; right-zone touch changed orientation; a tap selected the actual splat surface. Q/E changed height. Final load reported **zero console errors and zero warnings**. No test files, lint/format passes or project-wide test/build suites were run. Dedicated OMP Chrome failed to attach, so verification used an isolated owned Chrome relay tab instead.

Remaining verification limits: not tested on physical mobile hardware or Safari; no production build or Vercel deployment; adapter failure/device-loss messages are implemented but physical device loss was not induced. Large-scene streaming/LOD, collision, multiplayer, auth and CMS are intentionally out of scope.
