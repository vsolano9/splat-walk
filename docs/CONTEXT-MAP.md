# Splat Walk context map

Use this file to orient before editing. It maps the current shipped implementation and the planned object-camera iteration.

## Repository / baseline

- Repository: `vsolano9/splat-walk`
- Public demo: `https://splat-walk.vercel.app`
- Baseline reviewed for this documentation pass: `main` at `d6cedaf394dccdc0af33d19e7897a504070f9228`
- Stack: Next.js App Router, React, Tailwind CSS v4, three.js r186 WebGPU, TypeScript
- No backend/auth/API keys required

The root `README.md` describes the shipped implementation. The `docs/` directory describes the accepted next interaction direction until that work is implemented and the README is updated.

## Read order for implementation work

1. `docs/DECISIONS.md`
2. `docs/PRODUCT-DIRECTION.md`
3. `docs/CAMERA-INTERACTION-SPEC.md`
4. `docs/HOTSPOTS-TOUR-SPEC.md`
5. `docs/IMPLEMENTATION-PLAN.md`
6. `docs/QA-ACCEPTANCE.md`
7. current source files below

## Core source map

### `components/SplatScene.tsx`

Owns most runtime integration:

- phase state: loading / ready / unsupported / unavailable / error;
- WebGPU renderer creation and initialization;
- adapter/device checks;
- GPU loss handling;
- canvas creation and accessibility labeling;
- responsive camera projection sizing;
- SPZ fetch and streamed progress;
- `SPZLoader` parse and `GaussianSplat` construction;
- scene rotation and marker attachment;
- current fly-controller construction;
- native splat + marker raycasting;
- hotspot selected/targeted/visited state;
- marker billboard/pulse/visited visual state;
- render loop;
- resource/listener cleanup;
- DOM HUD/detail/dock rendering.

This is the highest-risk integration file. Camera work should be narrow here and should not rewrite loading/recovery code.

### `lib/controls.ts`

Current free-flight controller:

- pointer-lock mouse look;
- drag mouse look without lock;
- WASD horizontal movement;
- QE vertical movement;
- arrow-key look;
- split touch controls: left half move, right half look;
- reset tween to spawn pose;
- input/listener cleanup.

Next role: environment-mode controller. Prefer leaving its behavior intact except for a small shared interface alignment if required.

### Planned `lib/object-controls.ts`

Does not exist on the baseline commit.

Target ownership:

- orbit yaw/pitch/radius around subject target;
- wheel/trackpad zoom;
- one-finger orbit + pinch zoom;
- damping and constraints;
- reset to authored overview;
- hotspot focus pose transitions;
- reduced-motion behavior;
- optional later pan/idle motion.

See `CAMERA-INTERACTION-SPEC.md`.

### `lib/scene.config.ts`

Current scene constants:

- `SPZ_URL = "/scenes/lion.v3.spz"`
- `SPAWN_POSITION = [0, 0.42, 1.2]`
- `LOOK_AT = [-0.025, 0.16, 0.05]`
- scan X half-turn rotation;
- fly/touch sensitivity and movement speeds;
- reset duration;
- hotspot radius / marker size;
- three lion hotspot positions/labels/descriptions.

Next role:

- explicit scene mode (`object` for lion);
- authored object overview profile;
- object-control tuning constants;
- hotspot camera presentation poses;
- optional framing offsets.

Do not mix scene-authored values into controller implementation code.

### `app/globals.css`

Owns the dark exhibition visual system:

- canvas/scene appearance;
- title/header HUD;
- controls hint;
- hotspot label;
- detail card/bottom sheet;
- dock controls;
- footer/attribution;
- loading state;
- current crosshair;
- responsive/coarse-pointer behavior;
- reduced-motion-related presentation hooks.

Next role: small object-mode/tour refinements only. Avoid broad redesign.

### `app/page.tsx`

Thin page wrapper around `SplatScene` plus Escape handling for open detail UI.

Expected next-iteration changes: ideally none or very small.

### `app/layout.tsx`

Metadata/canonical/Open Graph/Twitter/icon ownership.

Only update if the visible product/share framing changes enough that `public/og.png` or copy becomes stale.

### `lib/three-addons.d.ts`

Local declarations bridging the current `@types/three` gap for native Gaussian splat addons.

Unrelated to camera work unless dependency versions change.

## Public assets

### `public/scenes/lion.v3.spz`

Official three.js cave-lion sample. Separately licensed CC BY 4.0. Do not treat it as MIT-covered application code.

### `public/og.png`

Current social card based on the real scene/HUD. Re-evaluate after camera/UI changes; update only if it no longer represents the product.

### icons

`public/icon.svg` and `app/apple-icon.png` are existing brand/touch assets and are not camera-work targets.

## Current interaction truth

Baseline object behavior is not yet object-centric. The lion currently uses:

- perspective camera FOV 50 before responsive adjustment;
- spawn + look-at initialization;
- free camera quaternion look;
- camera-relative translation;
- desktop pointer lock via Explore/canvas interaction;
- split move/look touch drag;
- Reset back to initial pose;
- three hotspots with discovery state.

This is why the next iteration exists. Do not confuse the documented target with shipped behavior until implementation lands.

## Existing QA evidence

### `design/reference/2026-09-11-phase-4-6-qa/`

Earlier interaction/responsive/accessibility/release evidence for the pre-hardening candidate/production range documented in the root README.

### `design/reference/2026-09-11-final-hardening-qa/`

Contains final-hardening and device evidence including:

- desktop Chrome/Safari screenshots;
- pointer lock and movement evidence;
- device-loss/recovery evidence;
- single-fetch evidence;
- dock/detail focus paths;
- physical iPhone 12 Pro portrait/touch evidence;
- QA markdown reports.

Important observed interaction signal: existing QA records show that free look can move the lion dramatically across the viewport. That is expected under the current controller and is a motivating product issue, not a renderer defect.

Do not reuse these records as proof for the future object controller.

## Runtime invariants to preserve

High-value proven behavior:

- native WebGPU backend check;
- single SPZ GET per attempt;
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
- accessible DOM controls and focus restoration;
- reduced-motion reset behavior;
- complete resource cleanup.

A camera implementation that weakens these is a regression even if orbit feels better.

## Main product gap

The current implementation is technically mature but interactionally mismatched to an isolated subject. The main next task is not renderer quality. It is to make the lion remain the center of the experience through object-oriented orbit/zoom/focus behavior and to let hotspots present authored views of the features they describe.

## Expected next files touched

Likely:

- `lib/scene.config.ts`
- new `lib/object-controls.ts`
- `components/SplatScene.tsx`
- `app/globals.css`
- later `README.md`
- new `design/reference/<date>-object-camera-qa/*`

Avoid touching unrelated metadata/assets unless verification shows they became stale.

## Handoff checklist for an implementation agent

Before coding, the agent should be able to answer:

- Why is the lion changing from free flight to object mode?
- What remains in environment mode?
- What are the camera invariants: target, yaw, pitch, radius?
- What inputs map to orbit and zoom on desktop/touch?
- How are hotspot pick position and camera pose different?
- What existing runtime/recovery behavior is off-limits to broad refactor?
- What exact QA matrix is required before merge?

If any answer is unclear, read the linked docs before changing code rather than inventing a new interaction model.
