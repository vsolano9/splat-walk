# Status

Last updated: 2026-09-15

## Production

Production `main` is still the previously released free-flight build until PR #6 is merged and the resulting production deployment is verified.

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

## Object-camera candidate

PR #6, branch `feat/object-camera-exhibit-2026-09-15`, implements the accepted interaction direction documented in this directory.

Implemented on the candidate:

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

## Verification state

Completed:

- Vercel production-style preview builds compile on Next.js 16.3.4;
- the post-review full `npm run check` passed at `a65a7ffdf3ee67f01cbc2c41551a92a67e0ec028`, which is source commit `2db6cf376323631276aa2ed9cea4577f2eae0d68` plus a temporary preview-only build override:
  - `tsc --noEmit`;
  - `eslint .`;
  - `next build` and static prerender;
- the temporary override was removed in `3161e331c8dd6ee99ef7b519a945865d3d029baf` without changing application source;
- preview route returned HTTP 200;
- prerendered output exposed `data-scene-mode="object"`;
- review confirmed that the single-fetch loader, GPU-loss path, native raycasting, render-loop ownership and cleanup architecture were not broadly rewritten.

Still required before merge/release under the project UI gate:

- rendered WebGPU visual review of the exact candidate;
- real orbit/wheel interaction pass on desktop;
- touch orbit + pinch pass on a real/coarse-pointer surface where available;
- visual confirmation that all three authored hotspot poses keep the described feature unobscured by the detail UI;
- responsive confirmation at desktop and narrow portrait minimum;
- final production/live verification after merge.

The Work/OMP local browser bridge became unavailable during this implementation session, and the isolated fallback Chromium could not reach external network. None of those rendered-input checks are being invented or inferred from old screenshots. Historical free-flight evidence is not proof for the object controller.

## Branch / PR

- Repository: `vsolano9/splat-walk`
- Base: `main` at `a237a5c27540edd5001d1ba2631950fa2e41a247`
- Feature branch: `feat/object-camera-exhibit-2026-09-15`
- Pull request: #6
- Merge state: not merged while the rendered UI gate remains outstanding
- Production state: unchanged until merge/deploy/live verification

## Next gate

Run `docs/QA-ACCEPTANCE.md` against the exact PR #6 candidate with an actual rendered browser/device surface. Fix only concrete defects found there, rerun `npm run check` if source changes, then merge and verify `https://splat-walk.vercel.app`.
