# Object-camera implementation plan

This plan is intentionally narrow. The renderer/loading/recovery stack is already proven; the work is to replace the cave-lion interaction model while preserving environment/free-flight support.

## Phase 0 — Baseline and branch hygiene

Before editing behavior:

1. start from current `main`;
2. confirm `npm ci` and `npm run check` pass;
3. capture one desktop and one mobile/coarse-pointer baseline of the current lion framing;
4. do not modify historical `design/reference/` evidence;
5. create a new dated evidence directory for this iteration.

Done when the exact starting commit and baseline are recorded.

## Phase 1 — Scene mode and configuration

Primary files:

- `lib/scene.config.ts`
- optional small new `lib/scene.types.ts` if types become noisy

Implement:

- explicit `SceneMode = "object" | "environment"`;
- cave lion configured as `object`;
- object overview camera profile;
- named object interaction tuning constants;
- hotspot camera-pose fields while preserving existing position/label/description data.

Do not change renderer behavior yet.

Done when configuration can describe both controller modes without duplicated scene data.

## Phase 2 — Object controller

Primary file:

- new `lib/object-controls.ts`

Keep:

- `lib/controls.ts` as the environment/free-flight controller unless a small rename improves clarity.

Implement the smallest dedicated object controller that supports:

- orbit state around a target;
- delta-time-aware damping;
- pitch/radius constraints;
- mouse/trackpad drag orbit;
- wheel/trackpad zoom;
- one-finger touch orbit;
- pinch zoom;
- reset-to-overview;
- reduced-motion reset behavior;
- clean listener/resource disposal.

Optional pan/focus gestures come after core orbit + zoom is correct.

Done when a standalone controller can keep the lion centered and cannot trivially lose the subject.

## Phase 3 — Scene integration

Primary file:

- `components/SplatScene.tsx`

Implement:

- choose object vs. environment controller from scene mode;
- object mode does not request pointer lock;
- hide object-mode crosshair/pointer-lock affordances;
- update object-mode canvas accessibility label and control hints;
- preserve environment behavior unchanged;
- preserve renderer lifecycle, single-fetch loading, device-loss recovery, raycasting, discovery, and cleanup.

Do not combine renderer refactors with this phase.

Done when object mode is usable end-to-end and environment mode still follows current controls.

## Phase 4 — Hotspot camera poses

Primary files:

- `lib/scene.config.ts`
- `components/SplatScene.tsx`
- `lib/object-controls.ts`

Implement:

- `focusHotspot`/equivalent controller API;
- authored pose for all three lion hotspots;
- same camera destination regardless of marker/surface/dock selection path;
- interruption by direct user input;
- reduced-motion snap/near-snap behavior;
- detail-panel framing compensation.

Author the final values against the rendered scene, not by static coordinate math alone.

Done when each description is visibly supported by the camera composition.

## Phase 5 — Tour/UI polish

Primary files:

- `components/SplatScene.tsx`
- `app/globals.css`

Implement only after camera behavior is stable:

- marker-adjacent labels with viewport clamping;
- compact Previous/Next detail navigation;
- completion acknowledgement at `3 / 3`;
- `Explore freely` + `Overview`/`Replay tour` actions;
- optional HUD fade while actively orbiting;
- initial settle and idle orbit only if they improve the experience in real testing.

Do not redesign the established exhibition visual language.

Done when the tour feels intentional without adding permanent UI clutter.

## Phase 6 — Responsive and accessibility hardening

Verify and fix:

- desktop mouse;
- high-resolution trackpad wheel behavior;
- keyboard/focus paths;
- coarse-pointer responsive layout;
- physical touch where available;
- portrait and landscape/short-height layouts;
- reduced motion;
- browser zoom/text scaling enough to catch obvious clipping;
- detail panel + selected feature composition at all tested sizes.

Keep native buttons and deterministic focus restoration.

Done when the new control model is usable without pointer lock and no important UI covers the focused feature.

## Phase 7 — Regression / runtime verification

Rerun the high-risk existing behaviors:

- one SPZ GET per load attempt;
- byte progress when `Content-Length` exists;
- HTTP failure + retry;
- missing WebGPU and no-adapter paths;
- explicit GPU device loss + recovery if the existing harness can still reproduce it;
- background/return;
- hidden-tab render pause;
- hotspot native splat raycast;
- discovery state and refresh reset;
- cleanup/no duplicated listeners after reload attempts;
- `npm run check`.

Only rerun expensive device-loss/browser cases to the level justified by touched code. Because `SplatScene.tsx` integrates both controls and renderer lifecycle, at least one device-loss/reload regression pass is warranted.

## Phase 8 — Documentation and release evidence

After behavior is final:

1. update the root `README.md` Controls, Use your own scan, Implementation, and Verification sections;
2. update `docs/CONTEXT-MAP.md` with final module names;
3. mark any changed decisions in `docs/DECISIONS.md`;
4. add exact-commit QA notes/screenshots under a new `design/reference/YYYY-MM-DD-.../` directory;
5. ensure old free-flight statements are clearly scoped to `environment` mode;
6. ensure screenshots and share metadata still represent the actual product if the visual framing materially changed.

## Expected file ownership

| File | Expected change |
|---|---|
| `lib/scene.config.ts` | scene mode, object profile, tuning, hotspot camera poses |
| `lib/object-controls.ts` | new object orbit/dolly controller |
| `lib/controls.ts` | preserve fly/environment controller; only minimal interface alignment if required |
| `components/SplatScene.tsx` | mode selection, focus integration, object-mode UI behavior |
| `app/globals.css` | marker labels/tour/completion polish only |
| `README.md` | update after implementation is verified |
| `docs/*` | reconcile decisions/spec with final implementation |
| `design/reference/<new-date>/` | exact-build evidence |

## Engineering constraints

- simplest sufficient implementation;
- no broad renderer refactor;
- no controls framework beyond the two concrete modes;
- no new dependency unless native/browser/three.js APIs cannot reasonably provide the behavior;
- no speculative collision/physics system;
- no persistence/backend work;
- preserve accessible DOM controls rather than moving all UI into WebGPU;
- test to risk, with real input/device evidence where it materially matters.

## Ship gate

The camera iteration is not ready to merge/release until `QA-ACCEPTANCE.md` passes for the exact candidate commit and the final visual review confirms that the lion remains the focal point throughout the primary interaction paths.
