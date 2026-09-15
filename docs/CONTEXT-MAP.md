# Splat Walk context map

Use this file to orient before editing. It maps both the released renderer/recovery baseline and the PR #6 object-camera candidate.

## Repository / current work

- Repository: `vsolano9/splat-walk`
- Public demo: `https://splat-walk.vercel.app`
- Current implementation branch: `feat/object-camera-exhibit-2026-09-15`
- Pull request: #6
- Base: `main` at `a237a5c27540edd5001d1ba2631950fa2e41a247`
- Stack: Next.js App Router, React, Tailwind CSS v4, three.js r186 WebGPU, TypeScript
- No backend/auth/API keys required

Production remains on the earlier free-flight behavior until PR #6 passes rendered UI review, merges, deploys and is verified live. The branch README describes the candidate behavior; historical `design/reference/` records stay tied to their named commits.

## Read order

1. `docs/STATUS.md`
2. `docs/DECISIONS.md`
3. `docs/PRODUCT-DIRECTION.md`
4. `docs/CAMERA-INTERACTION-SPEC.md`
5. `docs/HOTSPOTS-TOUR-SPEC.md`
6. `docs/QA-ACCEPTANCE.md`
7. current source files below

## Core source map

### `components/SplatScene.tsx`

Owns runtime integration:

- phase state: loading / ready / unsupported / unavailable / error;
- WebGPU renderer creation and adapter/device checks;
- GPU loss handling and retry teardown;
- canvas creation/accessibility labeling;
- responsive projection sizing;
- one-request SPZ fetch with streamed progress;
- `SPZLoader` parse and `GaussianSplat` construction;
- scan rotation and marker attachment;
- scene-mode controller selection;
- native splat + marker raycasting;
- selected/targeted/visited discovery state;
- hotspot camera-focus dispatch;
- projected object-mode hotspot labels;
- guided Previous/Next and completion UI;
- marker billboard/pulse/visited state;
- render loop, visibility pause/resume and cleanup.

This remains the highest-risk integration file. The object-camera implementation intentionally did not rewrite its loading/recovery sections.

### `lib/object-controls.ts`

Dedicated object-mode controller added by PR #6:

- canonical target/yaw/pitch/radius state;
- separate current/desired values;
- delta-time-aware exponential damping;
- pitch/radius constraints and stable world-up;
- mouse/trackpad drag orbit;
- wheel/trackpad zoom;
- one-finger touch orbit;
- two-finger pinch zoom;
- keyboard arrow orbit, `+`/`-` zoom and Home reset;
- overview reset;
- authored hotspot focus poses;
- reduced-motion snap behavior;
- pointer/listener/pointer-capture cleanup.

It does not own rendering, raycasting, discovery state or UI.

### `lib/controls.ts`

Preserved environment/free-flight controller:

- pointer-lock mouse look;
- drag mouse look without lock;
- WASD horizontal movement;
- QE vertical movement;
- arrow-key look;
- split touch controls: left half move, right half look;
- reset tween to spawn pose;
- listener/pointer-lock cleanup.

PR #6 only adds the small shared `SceneControls` interface. Environment behavior should remain otherwise unchanged.

### `lib/scene.config.ts`

Owns scene-authored values:

- `SCENE_MODE`: lion is `"object"`;
- `SPZ_URL` and `SCAN_ROTATION`;
- legacy `SPAWN_POSITION` / `LOOK_AT` for environment mode;
- `OBJECT_CAMERA` overview pose and constraints;
- object and environment input tuning constants;
- hotspot radius / marker size;
- three lion hotspot anchors, copy and object-camera presentation poses;
- optional framing metadata reserved for later visual tuning.

Do not bury scan-specific pose values inside controller implementation code.

### `app/globals.css`

Owns the existing dark exhibition visual system:

- canvas/scene atmosphere;
- header/title HUD;
- control hints;
- hotspot labels;
- detail card/bottom sheet;
- detail dock;
- footer/attribution;
- loading state;
- environment-mode crosshair styling;
- responsive/coarse-pointer rules.

PR #6 did not need a broad stylesheet redesign. Tailwind utilities on new guided-tour/completion markup compile through the normal build.

### `app/page.tsx`

Thin page wrapper around `SplatScene` plus Escape handling for open detail UI. Unchanged by PR #6.

### `app/layout.tsx`

Metadata/canonical/Open Graph/Twitter/icon ownership. PR #6 updates the description from free movement to guided orbit/zoom inspection.

### `lib/three-addons.d.ts`

Local declarations bridging the current `@types/three` gap for native Gaussian splat addons. Unrelated to camera work.

## Public assets

### `public/scenes/lion.v3.spz`

Official three.js cave-lion sample. Separately licensed CC BY 4.0. Do not treat it as MIT-covered application code.

### `public/og.png`

Existing real-scene social card. The lion/HUD world remains representative, so PR #6 updates share copy without replacing the image. No generated replacement asset was created during this work.

### icons

`public/icon.svg` and `app/apple-icon.png` are existing brand/touch assets and are not camera-work targets.

## Candidate interaction truth

For the lion on PR #6:

- object mode is explicit rather than inferred;
- the subject target is the camera invariant;
- camera position is derived from yaw/pitch/radius every frame;
- direct drag orbits rather than free-looks;
- wheel/pinch changes radius rather than translating freely;
- camera cannot trivially fly away from or through the subject because radius/pitch are authored and clamped;
- pointer lock, crosshair, WASD and QE are absent from the normal object experience;
- Overview returns to the authored object pose;
- each hotspot can set an authored desired camera pose;
- direct input can interrupt that camera motion;
- environment mode still selects the legacy fly controller.

## Existing QA evidence

### `design/reference/2026-09-15-object-camera-qa/`

PR #6 candidate evidence. At present this records automated build/preview truth and explicitly lists the outstanding rendered-input/visual gate. It must be expanded if real visual QA is later performed.

### `design/reference/2026-09-11-phase-4-6-qa/`

Earlier interaction/responsive/accessibility/release evidence for the pre-object-camera release family.

### `design/reference/2026-09-11-final-hardening-qa/`

Historical evidence for:

- desktop Chrome/Safari rendering;
- free-flight pointer lock/movement;
- GPU loss/recovery;
- single-fetch behavior;
- detail focus paths;
- physical iPhone split-touch behavior.

Those screenshots and reports establish renderer/recovery history but do **not** prove the new orbit/pinch controller.

## Runtime invariants to preserve

High-value proven behavior:

- native WebGPU backend check;
- one SPZ GET per attempt;
- streamed loading progress;
- graceful no-WebGPU/no-adapter errors;
- scan HTTP/load errors with retry;
- explicit GPU-loss recovery;
- abort/dispose safety;
- hidden-tab render pause/resume;
- DPR cap: desktop 2, coarse pointer 1.5;
- native Gaussian ellipsoid raycasting on deliberate pick;
- marker fallback raycast;
- session-only discovery;
- accessible DOM controls/focus restoration;
- reduced-motion handling;
- complete resource cleanup.

A camera improvement that weakens any of these is a regression.

## Current gate

Automated checks are green. The remaining ship blocker is not source compilation; it is the required real rendered UI/input review of PR #6:

- desktop orbit and wheel/trackpad zoom;
- narrow portrait touch orbit and pinch;
- all three authored detail shots with their panel open;
- Overview/reset and reduced-motion behavior;
- responsive visual composition and focus paths.

The local Work/OMP browser bridge became unavailable during this implementation session, so no claim is made that those checks ran.

## If continuing this work

1. inspect the exact current PR #6 head;
2. read `docs/STATUS.md` and `docs/QA-ACCEPTANCE.md`;
3. run a real WebGPU preview rather than relying on historical screenshots;
4. tune `OBJECT_CAMERA` / hotspot camera poses only if the rendered evidence shows a concrete framing problem;
5. keep changes on the feature branch;
6. rerun `npm run check` after source changes;
7. merge only after the UI gate is satisfied, then verify production live.
