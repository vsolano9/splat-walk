# Status

Last updated: 2026-09-15

## Shipped / implemented

Baseline reviewed while writing these docs: `main` at `d6cedaf394dccdc0af33d19e7897a504070f9228`.

Implemented on that baseline:

- Next.js + Tailwind single-page WebGPU viewer;
- three.js r186 native `GaussianSplat` + `SPZLoader`;
- cave-lion SPZ sample;
- streamed single-request loading progress;
- supported / unavailable / load-error states and retry;
- GPU-loss teardown/recovery;
- free-flight desktop controls with pointer lock, WASD/QE, mouse/arrow look;
- drag-to-look without pointer lock;
- split move/look touch controls;
- reset-to-spawn with reduced-motion behavior;
- native splat/marker raycast hotspot picking;
- three session-only discoverable details;
- accessible DOM HUD/dock/detail controls;
- responsive desktop/mobile layout;
- historical desktop/Safari/physical-iPhone QA under `design/reference/`.

## Documented / accepted direction

The following is now specified in `docs/` but is **not yet implemented** on the baseline above:

- explicit `object` vs `environment` scene modes;
- cave lion switched to object mode;
- subject-centered orbit camera;
- mouse/trackpad drag orbit;
- wheel/trackpad dolly zoom;
- one-finger orbit + pinch zoom;
- damping and camera constraints;
- no pointer lock/crosshair in object mode;
- preserved existing fly controls for environment mode;
- authored hotspot camera poses;
- camera/detail-panel recomposition;
- Previous/Next guided detail navigation;
- completion payoff after all three discoveries;
- optional idle orbit / initial settle after core behavior is correct;
- new exact-build QA gate for the camera iteration.

## Documentation branch

Documentation was authored on:

`docs/object-camera-direction-2026-09-15`

No application source behavior was changed by this documentation pass.

## Verification state

- Existing runtime behavior: previously verified as recorded in `README.md` and `design/reference/`; those records remain tied to their named commits/builds.
- New object-camera behavior: not tested because it is not implemented yet.
- Documentation consistency: reviewed against current `README.md`, `components/SplatScene.tsx`, `lib/controls.ts`, `lib/scene.config.ts`, and the existing QA record.

## Next implementation entry point

Start with `IMPLEMENTATION-PLAN.md` Phase 0, then Phase 1 scene-mode/config work. Read `DECISIONS.md` and `CAMERA-INTERACTION-SPEC.md` before touching controls.

Do not begin by rewriting `SplatScene.tsx` or the renderer. The first behavioral implementation should establish the scene-mode/config contract and a separate object controller while preserving the existing environment controller.
