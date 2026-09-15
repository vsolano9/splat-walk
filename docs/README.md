# Splat Walk documentation

This directory is the working context for Splat Walk. The root `README.md` describes the behavior represented by the branch it is read from; `docs/STATUS.md` distinguishes production from an in-flight candidate.

## Current truth

- Production remains on the previously released free-flight behavior until PR #6 is merged, deployed and verified live.
- PR #6 (`feat/object-camera-exhibit-2026-09-15`) implements the accepted subject-centered object-camera direction for the cave lion.
- The existing free-flight controller remains available as explicit `environment` mode.
- The renderer remains three.js r186 native WebGPU `GaussianSplat` + `SPZLoader`.
- The sample remains `public/scenes/lion.v3.spz` with the existing dark museum/exhibition HUD.
- Historical release evidence under `design/reference/2026-09-11-*` remains tied to those exact builds and is not proof for the new controller.
- PR #6 evidence lives under `design/reference/2026-09-15-object-camera-qa/`.

Read these documents in order:

1. [`STATUS.md`](STATUS.md) — production/candidate state and current gate.
2. [`PRODUCT-DIRECTION.md`](PRODUCT-DIRECTION.md) — product intent, experience principles, scope, and non-goals.
3. [`CAMERA-INTERACTION-SPEC.md`](CAMERA-INTERACTION-SPEC.md) — canonical object-camera behavior and control mapping.
4. [`HOTSPOTS-TOUR-SPEC.md`](HOTSPOTS-TOUR-SPEC.md) — guided hotspot camera poses, transitions, and completion behavior.
5. [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) — bounded implementation sequence and affected files.
6. [`QA-ACCEPTANCE.md`](QA-ACCEPTANCE.md) — acceptance criteria and regression matrix.
7. [`DECISIONS.md`](DECISIONS.md) — decisions that should not be rediscovered by later agents.
8. [`CONTEXT-MAP.md`](CONTEXT-MAP.md) — current code/evidence map for fast orientation.

## Source-of-truth order

When documents disagree, use this order:

1. Current source on the exact branch/commit being worked on.
2. `docs/STATUS.md` for production vs candidate state.
3. `docs/DECISIONS.md` for accepted product/architecture decisions.
4. The relevant spec in `docs/`.
5. Root `README.md` for operational/use instructions on that branch.
6. `design/reference/` for evidence tied to the exact builds named in those records.

Never treat old screenshots, QA notes or successful builds as proof for a newer commit unless the same behavior was rerun and recorded against that newer commit or the record explicitly scopes what remains equivalent.

## Current implementation shape

PR #6 follows the documented architecture rather than turning one controller into a mode-heavy state machine:

- `lib/object-controls.ts` owns object orbit/dolly interaction;
- `lib/controls.ts` remains the environment/free-flight controller and exposes a small shared `SceneControls` contract;
- `lib/scene.config.ts` owns explicit scene mode, object overview/constraints, tuning and hotspot camera poses;
- `components/SplatScene.tsx` selects the controller and coordinates discovery/tour UI while preserving the proven renderer/loading/recovery path.

Optional idle orbit, decorative initial settle, arbitrary surface focus and panning remain deferred. They are not required for the current candidate.

## Documentation discipline

For any further object-camera source change:

- keep work on the feature branch until the UI gate passes;
- update `docs/STATUS.md` if implementation or verification state changes;
- update `docs/CONTEXT-MAP.md` when module/file ownership changes;
- record material design deviations in `docs/DECISIONS.md` instead of silently changing the spec;
- add new exact-build QA evidence under a dated `design/reference/` directory rather than rewriting historical evidence;
- rerun `npm run check` after source changes;
- merge only after the rendered visual/input checks in `docs/QA-ACCEPTANCE.md` pass.
