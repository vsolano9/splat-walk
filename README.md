# Splat Walk

[Live demo](https://splat-walk.vercel.app) · [Source](https://github.com/vsolano9/splat-walk)

Explore a real capture with **three.js r186's native WebGPU `GaussianSplat` and `SPZLoader`**, inside a small Next.js + Tailwind app. No third-party splat renderer, backend, auth or API keys.

The bundled cave-lion capture runs in **object mode**: the camera orbits and zooms around the subject instead of flying away from it. Splat Walk also retains an **environment mode** for room-scale captures using the original free-flight controller.

## Run

Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` in recent Chromium or Safari 26+ with WebGPU/hardware acceleration available. WebGPU needs HTTPS or localhost. Missing WebGPU shows **WebGPU required**; an exposed API with no usable adapter shows **WebGPU unavailable**. Both can be retried after browser capabilities change. Initialization, GPU-interruption and scan-load failures keep their own error messages.

```sh
npm run build
npm start
```

Run the complete release check before pushing:

```sh
npm run check
```

`check` runs TypeScript with no emit, the flat ESLint configuration, and a production Next build.

For Vercel: import this repository, select the Next.js preset and leave the project root at the repository root. No environment variables are required. Build command: `npm run build`.

## Controls

The bundled lion uses **object mode**:

- Drag with a mouse or trackpad to orbit around the lion. The subject remains the camera target.
- Mouse wheel or trackpad scroll dollies in and out within authored distance limits.
- **Touch:** one-finger drag orbits; two-finger pinch zooms.
- With the canvas focused, arrow keys orbit, `+`/`-` zoom, and **Home** returns to the overview.
- Hover or move near a ring to reveal its label. Click/tap a ring or its nearby splat surface to inspect it.
- Selecting a detail moves toward an authored camera composition for that feature. Direct orbit/zoom input can interrupt the camera motion immediately.
- The detail card includes cyclic **Previous** / **Next** tour navigation. Opened details are marked with a check and counted in the session-only `N / 3 found` display.
- After all three details are discovered, **Explore freely** dismisses the completion prompt and **Replay tour** returns to the first guided detail.
- Closing with **Close**, **Esc**, or an empty-canvas tap leaves the camera at its current inspection pose. **Overview** is the explicit return to the authored starting view and does not clear discoveries.
- Reduced motion removes nonessential camera interpolation. **Reload capture** after an error retains discoveries; a full page refresh starts a new discovery session.
- **Controls** toggles the four-second interaction hint.

`SCENE_MODE = "environment"` preserves the original walkthrough controls: pointer-lock Explore, WASD movement, Q/E height, mouse/arrow look, drag-to-look, and split move/look touch controls.

### Safari notes

The Safari pointer-lock note applies only to **environment mode**. In the recorded Safari 26.6.2 desktop pass for the earlier free-flight build, the first Esc dismissed Safari's own mouse-capture banner and a second Esc released the mouse. Object mode does not request pointer lock.

For keyboard navigation on macOS, enable **Keyboard navigation** in System Settings > Keyboard. Safari Settings > Advanced > **Press Tab to highlight each item on a webpage** controls Tab/Option-Tab behavior for clickable items. See [Apple's keyboard navigation guidance](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac). The dock uses native buttons; no browser or system preferences are changed by the app.

## Use your own scan

1. Capture Gaussian splats with **Scaniverse** or **Polycam**, not a textured mesh export.
2. Clean in **SuperSplat 3.0**: crop, remove floaters and unnecessary background, and keep the scene at a sensible object/room scale.
3. Export `.spz`. If your editor only offers `.ply`/`.splat`, convert the cleaned export using [Niantic's SPZ converter](https://scaniverse.com/spz). The loader supports SPZ v1–v4.
4. Place the file in `public/scenes/`, then change `SPZ_URL` in `lib/scene.config.ts`, for example `/scenes/my-room.spz`. Public HTTPS URLs also work when their host allows CORS.
5. Choose `SCENE_MODE = "object"` for an isolated subject or `"environment"` for a room/walkthrough.
6. For object mode, tune `OBJECT_CAMERA` (`target`, `yaw`, `pitch`, `radius`, and radius/pitch limits) plus the named object sensitivity/damping constants. The controller derives its position from that subject-centered state and does not use arbitrary free-look quaternions.
7. For environment mode, tune `SPAWN_POSITION`, `LOOK_AT`, and the existing fly/touch movement and look constants. The lion uses an X half-turn in `SCAN_ROTATION`; another scan may not.
8. Set `HOTSPOTS` to `{ position, label, description, camera?, framing? }`. `position` remains the world-space raycast/marker anchor. `camera` is the preferred object-mode presentation pose for the detail. Positions are world coordinates after the scan rotation, with Y up.
9. Adjust `HOTSPOT_RADIUS` and `MARKER_SIZE` for your units, then update the visible title, canvas label, attribution and share copy to match the scan.

During development, `window.__splatWalk` in the page's main-world console reports scene mode, camera coordinates, projected hotspot positions, last raycast point/source, revision and splat count. It is absent in production. A picked surface point helps place annotations.

## Implementation

- `app/page.tsx`, `app/layout.tsx`: one App Router page plus canonical, Open Graph, Twitter and icon metadata.
- `public/og.png`, `public/icon.svg`, `app/apple-icon.png`: the committed 1200×630 real-scene share image and browser/touch icons.
- `components/SplatScene.tsx`: WebGPU renderer, scan, native raycasts, controller selection, rings, guided discovery state, accessible DOM HUD, responsive projection and resource cleanup.
- `lib/object-controls.ts`: subject-centered object orbit/dolly controls, damping, radius/pitch constraints, mouse/touch/keyboard input, overview reset and hotspot focus poses.
- `lib/controls.ts`: the preserved `createFlyControls()` environment controller for pointer-lock mouse, keyboard and two-zone touch input, plus the small shared `SceneControls` contract.
- `lib/scene.config.ts`: scene mode, scan URL/transforms, object and environment camera tuning, and annotations with authored camera poses.
- `app/globals.css`: Tailwind v4 and the dark museum/exhibition HUD palette.
- `lib/three-addons.d.ts`: source-matched declarations for the two new addons. The installed runtime is r186; current `@types/three` is still r185.4. Remove these declarations when DefinitelyTyped includes the addons.

The scan remains the visual treatment. Object mode keeps a stable subject target and derives camera position from yaw, pitch and radius with delta-time-aware damping. Hotspot selection changes the desired object-camera pose without blocking direct manipulation. Environment mode keeps the prior free-flight behavior.

`renderer.setAnimationLoop` owns the requestAnimationFrame-backed loop. DPR is capped at 2 desktop / 1.5 coarse-pointer, and rendering pauses in hidden tabs. The component cleans up source and generated geometries, materials, listeners, pending fetches and renderer resources. GPU loss ends the current attempt: the dead canvas is removed, pointer-lock state is cleared, and late loading/visibility callbacks cannot restart it. Retry creates a new renderer; app-initiated disposal does not replace the original error with a GPU-loss message.

A deliberate click invokes native Gaussian ellipsoid raycasting and selects a configured hotspot near the surface hit. Marker raycasting covers rings when no nearby surface qualifies. No mesh proxy or fake scan rendering.

The SPZ is fetched once per loading attempt. Byte progress uses the GET response's `Content-Length` when available; without a usable length it stays indeterminate. There is no separate HEAD probe.

## Sharing

The canonical public URL is `https://splat-walk.vercel.app`. Open Graph and Twitter cards use `public/og.png`, a real 1200×630 capture of the lion in the exhibition HUD rather than placeholder artwork. The image still represents the same lion/HUD world; share descriptions now describe orbit/zoom inspection rather than free flight.

## Verification

### Object-camera candidate

The object-camera implementation is tracked in PR #6. The post-review full release check passed at `a65a7ffdf3ee67f01cbc2c41551a92a67e0ec028`, which contains application source `2db6cf376323631276aa2ed9cea4577f2eae0d68` plus a temporary preview-only Vercel build override:

- `tsc --noEmit` passed;
- `eslint .` passed;
- the Next.js 16.3.4 production build compiled and prerendered successfully on Vercel;
- the preview route returned HTTP 200 and prerendered `data-scene-mode="object"`;
- the temporary build override was removed immediately afterwards without changing application source.

The camera/touch interaction changes still require an exact-candidate rendered input/visual pass before they should be treated as released evidence. Historical screenshots below are deliberately **not** reused as proof for the new controller. See [the dated candidate record](design/reference/2026-09-15-object-camera-qa/qa.md).

### Historical free-flight evidence

The Phase 4–6 and final-hardening records below predate the object-camera iteration. They remain evidence for the renderer/recovery stack and the earlier free-flight behavior only:

- 195,099 splats rendered; the final normal load and interaction run had zero console warnings, errors or page errors.
- Native splat raycasting opened detail cards; discovery reached `3 / 3 found` and refresh reset the session.
- Keyboard focus restoration, responsive layouts, reduced motion, missing-WebGPU and HTTP-failure retry paths were exercised.
- Single-fetch loading and explicit GPU-loss recovery were separately hardened and recorded.

### Evidence and build scope

| Record | Build tested | Scope |
|---|---|---|
| [Object-camera evidence](design/reference/2026-09-15-object-camera-qa/) | PR #6 candidate family | Automated build/release checks and explicit remaining visual/input gate. |
| [Phase 4–6 evidence](design/reference/2026-09-11-phase-4-6-qa/) | Phase 4–6 candidate and production through `0ccea82` | Earlier interaction, responsive layouts, keyboard/focus, reduced motion, metadata and release checks. |
| [Single-fetch evidence](design/reference/2026-09-11-final-hardening-qa/spz-requests-after.txt) and [GPU-loss evidence](design/reference/2026-09-11-final-hardening-qa/device-loss-and-pointer-lock.md) | Local production build on `fix/spz-single-fetch`, code commit `7107471` | One GET, streamed progress, real device destruction and GPU-process crash/retry. |
| [Desktop device QA](design/reference/2026-09-11-final-hardening-qa/device-qa.md) | Previous production, `0ccea82` | Chrome 153 input/pointer lock and Safari 26.6.2 rendering/input for the free-flight build. |
| [Physical iPhone QA](design/reference/2026-09-11-final-hardening-qa/iphone-12-pro/iphone-qa.md) | Previous production, `0ccea82` | iPhone 12 Pro, iOS 26.6.1, Safari, portrait: earlier split-touch controls, reset, background/resume, console and network. |

Historical logs and screenshots retain their original labels and findings. Physical Android/tablet coverage was not recorded for the earlier release. Large-scene streaming/LOD, collision, multiplayer, auth, CMS and replacing the cave-lion sample remain outside this showcase scope.

## License and sample attribution

Application code is [MIT licensed](LICENSE).

The bundled `public/scenes/lion.v3.spz` is the unmodified 4,303,196-byte [official three.js sample](https://threejs.org/examples/models/spz/lion.v3.spz), **licensed separately under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), not MIT**. Its [source scene](https://superspl.at/scene/56155c3f), shared by **Renaud**, credits **Joanna Kobierska** and depicts a reconstruction of a female cave lion. This viewer rotates the sample and adds annotations without modifying the asset. Preserve the sample's attribution when sharing it.

Native API references:
- [Official r186 example source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_gaussian_splat.html)
- [Ben Houston's native splat how-to](https://ben3d.ca/blog/how-to-use-threejs-native-gaussian-splats)
