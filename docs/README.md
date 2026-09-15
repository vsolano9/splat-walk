# Splat Walk documentation

This directory is the working context for the next Splat Walk iteration. It complements the root `README.md`, which documents the currently shipped implementation and its verified behavior.

## Current truth

- Production baseline: `main` at `d6cedaf394dccdc0af33d19e7897a504070f9228` as reviewed on 2026-09-15.
- Current interaction: free-flight camera with WASD/QE, pointer-lock mouse look on desktop, drag-to-look without lock, split move/look touch controls, reset-to-spawn, and three discoverable hotspots.
- Current renderer: three.js r186 native WebGPU `GaussianSplat` + `SPZLoader`.
- Current sample: cave-lion head in `public/scenes/lion.v3.spz`.
- Current visual treatment: dark museum/exhibition HUD with three hotspot details.
- Existing release evidence remains under `design/reference/` and must not be rewritten as evidence for future changes.

## Next-iteration direction

The next iteration changes the default interaction from generic free flight to subject-centered object inspection for object-scale captures such as the lion. The asset remains the visual center of the experience while the existing fly controller is preserved for environment/room-scale captures.

Read these documents in order:

1. [`PRODUCT-DIRECTION.md`](PRODUCT-DIRECTION.md) — product intent, experience principles, scope, and non-goals.
2. [`CAMERA-INTERACTION-SPEC.md`](CAMERA-INTERACTION-SPEC.md) — canonical object-camera behavior and control mapping.
3. [`HOTSPOTS-TOUR-SPEC.md`](HOTSPOTS-TOUR-SPEC.md) — guided hotspot camera poses, transitions, and completion behavior.
4. [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) — bounded implementation sequence and affected files.
5. [`QA-ACCEPTANCE.md`](QA-ACCEPTANCE.md) — acceptance criteria and regression matrix.
6. [`DECISIONS.md`](DECISIONS.md) — decisions that should not be rediscovered by later agents.
7. [`CONTEXT-MAP.md`](CONTEXT-MAP.md) — code/evidence map for fast orientation.

## Source-of-truth order

When documents disagree, use this order:

1. Current source on the branch being worked on.
2. `docs/DECISIONS.md` for accepted product/architecture decisions.
3. The relevant spec in `docs/`.
4. Root `README.md` for shipped behavior and operational instructions.
5. `design/reference/` for historical QA evidence tied to the exact builds named in those records.

Never treat old screenshots or QA notes as proof for a newer commit unless the same behavior was rerun and recorded against that newer commit.

## Documentation discipline

When the object-camera work lands:

- update the root `README.md` so its Controls and Implementation sections describe the actual shipped behavior;
- update `docs/CONTEXT-MAP.md` with the final file ownership and any new module names;
- mark completed implementation phases in `docs/IMPLEMENTATION-PLAN.md`;
- record any material deviation in `docs/DECISIONS.md` instead of silently changing the spec;
- add new QA evidence under a new dated `design/reference/` directory rather than altering historical evidence.
