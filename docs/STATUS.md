# Status

Last updated: 2026-09-27

## Production

PRs #6 (object-camera exhibit), #7 (custom scans) and #8 (narrow-field-of-view framing) are merged. The object-camera release has a **GO** record at `design/reference/2026-09-15-object-camera-qa/qa.md`.

The custom-scan hardening release is [PR #9](https://github.com/vsolano9/splat-walk/pull/9). Exact tested code: `c9dcdeca1a694de9cd6561dbd001faa11e1f24e0`. Its release comment records the merge, production deployment and public-site verification. The [hardening evidence](evidence/custom-scan-hardening-2026-09-27.md) identifies the local acceptance run and its limits. Do not substitute a local pass for deployment verification.

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

The controller uses authored target/yaw/pitch/radius poses. `SplatScene` also applies optional mobile framing offsets when a detail card is open.

## Custom scans (released in PRs #7 and #8)

- **Open scan** button, whole-page `.spz` drop and `?scene=<https-or-same-origin-url>` load any SPZ capture client-side;
- non-bundled captures run in object mode with an automatic profile from `fitObjectProfile()` (`lib/scan-source.ts`), a scaled camera depth range, and no lion hotspots/tour/counter;
- file/URL-specific errors (unreadable SPZ, unreachable/CORS, HTTP status) with **Back to the lion**;
- `@types/three` 0.186 replaces the local `lib/three-addons.d.ts` shim; `three` 0.186.1.

Verified in native WebGPU Chrome on a local dev server (see README "Custom scans"). Not physically tested on touch hardware or Safari.

## Custom-scan hardening (PR #9)

All three confirmed defects are fixed and covered by the 14 passing browser regressions:

- selecting or dropping a capture while a lion detail is open no longer dereferences removed hotspots; selection, targeting and discovery reset with the source;
- malformed percent/UTF-8 escapes retain a literal filename and use normal load/recovery UI rather than crashing the page;
- long and unbroken filenames truncate without hiding Overview, Open scan, navigation or Source at the tested desktop/portrait/landscape sizes.

`npm run check` and `npm run test:e2e` pass. This closes 3/3 findings in the bounded hardening scope, not a claim of universal browser/device compatibility.

## Safari Simulator follow-up

The [Safari Simulator qualification](evidence/safari-simulator-2026-09-27.md) exercised production in iPhone 17 Pro and iPad Pro 11-inch (M5) simulators on iOS 26.5 / Safari 26.5. Both correctly reached the WebGPU-unavailable fallback with no horizontal overflow; malformed and long linked filenames kept the page shell intact.

Apple Simulator cannot provide the WebGPU feature level Splat Walk requires, so this pass cannot qualify splat rendering, orbit, pinch, hotspot/tour or ready-state custom scans. It is fallback-shell coverage only.

## Open coverage gaps

- hardware Safari/WebGPU and real touch gestures remain unqualified for the current object-camera/custom-scan release; the simulator cannot replace this because WebGPU is unsupported there;
- Android hardware remains unqualified;
- environment mode is not offered for custom scans (object mode only).
