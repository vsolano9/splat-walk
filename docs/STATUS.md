# Status

Last updated: 2026-09-27

## Production

Production `main` serves the object-camera exhibit (PR #6, merge `dd34078`). Its rendered QA verdict is **GO**; see `design/reference/2026-09-15-object-camera-qa/qa.md`.

The renderer/recovery baseline remains proven by the historical records under `design/reference/`:

- Next.js + Tailwind single-page WebGPU viewer;
- three.js r186 native `GaussianSplat` + `SPZLoader`;
- cave-lion SPZ sample;
- streamed single-request loading progress;
- WebGPU unsupported/unavailable/load-error states and retry;
- GPU-loss teardown/recovery;
- native Gaussian splat/marker raycast picking;
- session-only discoveries and accessible DOM HUD;
- responsive layout and resource cleanup.

## Object camera (released in PR #6)

Implemented:

- explicit `object` vs `environment` scene modes;
- cave lion configured as `object` mode;
- a separate subject-centered orbit/dolly controller in `lib/object-controls.ts`;
- mouse/trackpad drag orbit and wheel/trackpad zoom;
- one-finger touch orbit and two-finger pinch zoom;
- keyboard arrow orbit, `+`/`-` zoom and Home overview reset;
- delta-time-aware damping and authored pitch/radius constraints;
- no pointer lock/crosshair or WASD requirement in object mode;
- existing free-flight controller preserved for environment mode;
- authored camera poses for all three lion hotspots;
- marker/surface/dock selection converging on the same detail/camera state;
- cyclic Previous/Next guided detail navigation with stable keyboard focus;
- marker-adjacent projected labels with viewport clamping;
- `3 / 3` completion acknowledgement with Explore freely / Replay tour;
- object-mode metadata, accessibility copy and README documentation.

Not implemented because they remain optional polish rather than ship requirements:

- idle orbit;
- decorative initial camera settle;
- camera panning;
- double-click/double-tap arbitrary surface focus;
- generalized UI collision/framing engine.

The hotspot config retains optional framing metadata for later visual tuning, but the current controller uses authored target/yaw/pitch/radius poses only.

## Custom scans (branch `feat/custom-scans`)

- **Open scan** button, whole-page `.spz` drop and `?scene=<https-or-same-origin-url>` load any SPZ capture client-side;
- non-bundled captures run in object mode with an automatic profile from `fitObjectProfile()` (`lib/scan-source.ts`), a scaled camera depth range, and no lion hotspots/tour/counter;
- file/URL-specific errors (unreadable SPZ, unreachable/CORS, HTTP status) with **Back to the lion**;
- `@types/three` 0.186 replaces the local `lib/three-addons.d.ts` shim; `three` 0.186.1.

Verified in native WebGPU Chrome on a local dev server (see README "Custom scans"). Not physically tested on touch hardware or Safari.

## Open coverage gaps

- physical touch, Safari and Android/tablet for the object camera and custom scans;
- environment mode is not offered for custom scans (object mode only).
