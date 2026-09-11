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

- Click **Explore** or empty canvas to capture the mouse; **Esc** releases it.
- **W/A/S/D** fly; **Q/E** move down/up. Mouse movement looks around.
- Drag-to-look works without pointer lock. Focus the canvas and use arrow keys for keyboard-only looking.
- **Touch:** left-half drag moves, right-half drag looks. Both zones work together; lift to stop.
- Aim or hover near a ring to reveal its label. On touch, the nearest ring is labelled while you drag.
- Click/tap a ring or its nearby scan surface to open a detail. The keyboard-focusable dock buttons expose the same label and detail states.
- Opened details are marked with a check and counted in the session-only `N / 3 found` display. Refreshing starts a new discovery session.
- Closing with **Close**, **Esc**, an empty-canvas tap or **Reset view** returns focus to the canvas or the dock button that opened the detail.
- **Reset view** restores the starting camera position and orientation without clearing discoveries. It takes 400 ms, or returns immediately with reduced motion. **Reload capture** after an error also retains discoveries; a full page refresh starts a new session. **Controls** toggles the four-second hint.

### Safari notes

In the recorded Safari 26.6.2 desktop pass, the first Esc dismissed Safari's own mouse-capture banner and a second Esc released the mouse. Press Esc again if that banner consumed the first press. This is a [recorded browser behavior](design/reference/2026-09-11-final-hardening-qa/device-qa.md), not a guarantee for every Safari version; the app does not override it or detect Safari to change the HUD.

For keyboard navigation on macOS, enable **Keyboard navigation** in System Settings > Keyboard. Safari Settings > Advanced > **Press Tab to highlight each item on a webpage** controls Tab/Option-Tab behavior for clickable items. See [Apple's keyboard navigation guidance](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac). The dock uses native buttons; no browser or system preferences are changed by the app.

## Use your own scan

1. Capture Gaussian splats with **Scaniverse** or **Polycam**, not a textured mesh export.
2. Clean in **SuperSplat 3.0**: crop, remove floaters and unnecessary background, and keep the scene object/room-scale.
3. Export `.spz`. If your editor only offers `.ply`/`.splat`, convert the cleaned export using [Niantic's SPZ converter](https://scaniverse.com/spz). The loader supports SPZ v1–v4.
4. Place the file in `public/scenes/`, then change the single `SPZ_URL` constant in `lib/scene.config.ts`, for example `/scenes/my-room.spz`. Public HTTPS URLs also work when their host allows CORS.
5. Adjust `SPAWN_POSITION`, `LOOK_AT`, `SCAN_ROTATION` and the named input constants for the scan's axes and scale. Defaults are `KEYBOARD_MOVE_SPEED = 0.35`, `TOUCH_MOVE_SPEED = 0.32` scan units/second, `MOUSE_LOOK_SENSITIVITY = 0.0018` and `TOUCH_LOOK_SENSITIVITY = 0.0034` radians/pixel, and `KEYBOARD_LOOK_SPEED = 1.15` radians/second. The lion uses an X half-turn; yours may not. There is no automatic recentering or rescaling.
6. Set `HOTSPOTS` to `{ position: [x, y, z], label, description }` entries. Positions are world coordinates after the scan rotation, with Y up. Adjust `HOTSPOT_RADIUS` and `MARKER_SIZE` for your units. Update the title, canvas label and attribution to match your scan.

During development, `window.__splatWalk` in the page's main-world console reports camera coordinates, projected hotspot positions, last raycast point/source, revision and splat count. It is absent in production. A picked surface point helps place annotations.

## Implementation

- `app/page.tsx`, `app/layout.tsx`: one App Router page plus canonical, Open Graph, Twitter and icon metadata.
- `public/og.png`, `public/icon.svg`, `app/apple-icon.png`: the committed 1200×630 real-scene share image and browser/touch icons.
- `components/SplatScene.tsx`: WebGPU renderer, scan, native raycasts, rings, discovery state, accessible DOM HUD, responsive camera and resource cleanup.
- `lib/controls.ts`: the `createFlyControls()` factory for pointer-lock mouse, keyboard and two-zone touch input, including the reduced-motion-aware reset tween.
- `lib/scene.config.ts`: the scan URL, transforms, spawn, named input tuning and annotations.
- `app/globals.css`: Tailwind v4 and the dark museum/exhibition HUD palette.
- `lib/three-addons.d.ts`: source-matched declarations for the two new addons. The installed runtime is r186; current `@types/three` is still r185.4. Remove these declarations when DefinitelyTyped includes the addons.

The scan is the visual treatment. High-opacity panels preserve contrast over arbitrary captures; there is no automatic orbit or cinematic camera path. `renderer.setAnimationLoop` owns the requestAnimationFrame-backed loop. DPR is capped at 2 desktop / 1.5 coarse-pointer, and rendering pauses in hidden tabs. The component cleans up source and generated geometries, materials, listeners, pending fetches and renderer resources. GPU loss ends the current attempt: the dead canvas is removed, pointer-lock state is cleared, and late loading/visibility callbacks cannot restart it. Retry creates a new renderer; app-initiated disposal does not replace the original error with a GPU-loss message.

A deliberate click invokes native Gaussian ellipsoid raycasting and selects a configured hotspot near the surface hit. Marker raycasting covers rings when no nearby surface qualifies. No mesh proxy or fake scan rendering.

The SPZ is fetched once per loading attempt. Byte progress uses the GET response's `Content-Length` when available; without a usable length it stays indeterminate. There is no separate HEAD probe.

## Sharing

The canonical public URL is `https://splat-walk.vercel.app`. Open Graph and Twitter cards use `public/og.png`, a real 1200×630 capture of the lion in the exhibition HUD rather than placeholder artwork. When the scene, public URL or share copy changes, update both `app/layout.tsx` and the committed share image together.

## Verification

The Phase 4–6 record below predates final-hardening PR #4. These were real Chromium/native-WebGPU checks of that release, not reruns of every subsequent branch head:

- 195,099 splats rendered; the final normal load and interaction run had zero console warnings, errors or page errors.
- WASD and Q/E changed camera position; pointer lock, mouse look, named sensitivity tuning and the 400 ms reset tween were exercised.
- Native splat raycasting opened detail cards; touch-nearest targeting and dock focus exposed the same labels.
- Discovery reached `3 / 3 found`, marked each button/marker, and reset to `0 / 3` on refresh.
- Keyboard-only Tab, Enter and Escape paths restored focus to the originating dock button; Close, canvas dismissal and Reset restored focus without falling back to `body`.
- 1440×900, 390×844, 320×568 and coarse-pointer 844×390 were checked in idle, labelled, detail, all-found and reset-in-progress states.
- Reduced motion disabled entrance/detail transitions and skipped the reset tween.
- Missing-WebGPU and HTTP 500 states were exercised with working retries; the HTTP failure recovered to the real scan.
- `npm run check` passed TypeScript, ESLint, the production build and static prerendering.

### Evidence and build scope

| Record | Build tested | Scope |
|---|---|---|
| [Phase 4–6 evidence](design/reference/2026-09-11-phase-4-6-qa/) | Phase 4–6 candidate and production through `0ccea82` | Interaction, responsive layouts, keyboard/focus, reduced motion, metadata and release checks. |
| [Single-fetch evidence](design/reference/2026-09-11-final-hardening-qa/spz-requests-after.txt) and [GPU-loss evidence](design/reference/2026-09-11-final-hardening-qa/device-loss-and-pointer-lock.md) | Local production build on `fix/spz-single-fetch`, code commit `7107471` | One GET, streamed progress, real device destruction and GPU-process crash/retry. |
| [Desktop device QA](design/reference/2026-09-11-final-hardening-qa/device-qa.md) | Previous production, `0ccea82` | Chrome 153 input/pointer lock and Safari 26.6.2 rendering/input. |
| [Physical iPhone QA](design/reference/2026-09-11-final-hardening-qa/iphone-12-pro/iphone-qa.md) | Previous production, `0ccea82` | iPhone 12 Pro, iOS 26.6.1, Safari, portrait 390×699: real touch, reset, background/resume, console and network. |
| [ChatGPT recovery review](https://github.com/vsolano9/splat-walk/pull/4#issuecomment-5638998666) | Local production candidate matching `417a24c` | Real pointer lock plus device loss/retry/relock, interrupted loading, background/return, HTTP 500, retained discoveries, and narrow-viewport recovery. |

[PR #4](https://github.com/vsolano9/splat-walk/pull/4) tracks subsequent usability checks and the final review/release status. A passing local build, successful preview, merge and live production verification are separate milestones. Older Safari/iPhone results do not establish coverage of a newer commit. Historical logs and screenshots retain their original labels and findings; the current implementation and PR follow-ups supersede resolved issues.

Physical-device landscape was not captured and was explicitly skipped for this release. No physical Android or tablet pass is recorded. Touch-capability emulation and desktop resizing are not physical-device evidence. The earlier simulator-only no-adapter finding described the old generic retry copy; the current UI distinguishes **WebGPU unavailable** from a scan failure.

Large-scene streaming/LOD, collision, multiplayer, auth, CMS and replacing the cave-lion sample are outside this showcase scope.

## License and sample attribution

Application code is [MIT licensed](LICENSE).

The bundled `public/scenes/lion.v3.spz` is the unmodified 4,303,196-byte [official three.js sample](https://threejs.org/examples/models/spz/lion.v3.spz), **licensed separately under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), not MIT**. Its [source scene](https://superspl.at/scene/56155c3f), shared by **Renaud**, credits **Joanna Kobierska** and depicts a reconstruction of a female cave lion. This viewer rotates the sample and adds annotations without modifying the asset. Preserve the sample's attribution when sharing it.

Native API references:
- [Official r186 example source](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_gaussian_splat.html)
- [Ben Houston's native splat how-to](https://ben3d.ca/blog/how-to-use-threejs-native-gaussian-splats)
