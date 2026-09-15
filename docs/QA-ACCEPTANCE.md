# QA and acceptance gate

Use this document for the object-camera iteration. Historical passes under `design/reference/` remain evidence for their named commits only.

## 1. Build / static gate

Required on the exact candidate commit:

```sh
npm ci
npm run check
```

`npm run check` must pass TypeScript, ESLint, and the production Next build.

No generated build output or temporary capture artifacts belong in the repository outside the established evidence folders.

## 2. Primary visual acceptance

The camera change fails product review if any of these are true even when tests pass:

- the lion can easily leave the viewport during ordinary orbit/zoom;
- normal drag feels like free-look instead of movement around the subject;
- zoom feels jumpy, reversed, or disproportionately sensitive;
- the camera clips through the lion during normal use;
- hotspot focus leaves the described feature obscured or off-screen;
- opening a detail panel covers the feature being described;
- mobile gestures feel like FPS controls rather than object inspection;
- the HUD competes with the capture more than the current release.

## 3. Desktop object-mode matrix

Verify in a current Chromium build and Safari where available.

### Load / overview

- scene reaches ready;
- lion begins in authored overview composition;
- all three markers are present and correctly attached;
- object-mode hint uses object controls, not WASD/QE/pointer-lock copy;
- no crosshair is visible;
- no pointer lock is requested during ordinary use.

### Orbit

- left drag rotates around the lion;
- horizontal drag preserves the subject as the visual anchor;
- vertical drag obeys pitch limits;
- no roll develops after repeated interaction;
- repeated full yaw rotations do not accumulate numerical/visual drift;
- releasing drag settles smoothly without excessive float.

### Zoom

- discrete mouse wheel zoom works;
- trackpad/high-resolution wheel deltas work if hardware is available;
- zoom direction is intuitive;
- min/max radius limits are respected;
- repeated aggressive wheel input cannot cross through the subject;
- subject remains anchored while radius changes.

### Reset

- reset returns position, target, yaw, pitch, and radius to authored overview;
- reset does not clear discovery state;
- user input can interrupt reset when motion is enabled;
- reduced motion returns immediately/near-immediately.

## 4. Touch matrix

Prefer a physical phone. Emulation may supplement but does not replace physical evidence for gesture quality.

Verify:

- one-finger orbit;
- pinch zoom;
- no accidental page scroll/browser zoom during canvas interaction;
- adding/removing a pinch finger does not cause a large camera jump;
- min/max radius limits work;
- Reset restores overview;
- detail selection works by tap;
- bottom sheet does not hide the selected feature;
- portrait layout remains readable;
- landscape/short-height is checked when the device/tooling allows it; otherwise record the gap explicitly.

If two-finger pan ships, verify it separately and confirm it does not conflict with pinch.

## 5. Hotspot / tour matrix

For each of the three hotspots, exercise all available entry paths:

- marker click/tap;
- nearby splat-surface click/tap;
- dock/tour button;
- Previous/Next if implemented.

Every path must:

- select the same hotspot index;
- mark discovery exactly once;
- reach the same authored camera composition;
- show the same detail content;
- preserve deterministic focus behavior.

Camera-pose checks:

- `Face to face`: face/eyes are intentionally framed;
- `Surface detail`: coat/surface area described by copy is visible at useful scale;
- `Fine whiskers`: muzzle/whisker feature is clearly visible and not hidden by UI.

Do not approve poses by coordinate inspection alone. Verify rendered frames.

## 6. Detail UI / focus

Desktop and mobile:

- opening detail moves focus to the intended control if that remains the design;
- Escape closes detail where browser semantics permit;
- Close button works with pointer/touch/keyboard;
- close restores focus to the logical origin/canvas;
- changing Previous/Next keeps focus usable;
- direct camera input can interrupt an in-progress focus transition without corrupting selection;
- closing a detail leaves the camera in a coherent state;
- Reset while a detail is open produces a defined, tested result.

## 7. Completion state

Reach `3 / 3` through real interactions.

Verify:

- all three visited states render correctly;
- completion acknowledgement appears once and does not block the lion;
- `Explore freely` works if shipped;
- `Overview`/`Replay tour` works if shipped;
- Reset does not clear the counter;
- page refresh returns to a fresh session (`0 / 3`) unless product behavior is deliberately changed and documented.

## 8. Responsive framing

At minimum verify representative viewports equivalent to the existing coverage:

- desktop around 1440×900;
- narrow portrait around 390×844 / real phone viewport;
- very narrow around 320×568;
- short/coarse landscape around 844×390 when available.

States to capture:

- initial overview;
- mid-orbit;
- min/near-min zoom;
- each hotspot detail;
- all-found/completion;
- reset in progress if animated;
- reduced-motion equivalent.

The subject must remain intentionally framed around header/dock/footer/detail overlays.

## 9. Reduced motion

With `prefers-reduced-motion: reduce`:

- orbit/zoom still directly tracks user input;
- reset skips/shortens tween;
- hotspot focus skips/shortens cinematic transition;
- initial settle is absent;
- idle orbit is absent;
- marker pulsing/other nonessential motion is removed where current behavior already supports this principle;
- no functionality is lost.

## 10. Renderer / loading regression matrix

Because integration touches `SplatScene.tsx`, rerun the behaviors most likely to regress:

- supported WebGPU load reaches ready;
- unsupported WebGPU copy remains correct;
- WebGPU-present/no-adapter state remains distinct;
- HTTP scan failure shows scan-load failure and retry works;
- one GET is made for the SPZ per attempt;
- streamed progress works when content length is available;
- indeterminate progress works without content length;
- background/foreground return remains live;
- hidden-tab rendering pauses/resumes as intended;
- reload/retry does not duplicate listeners or canvases;
- explicit GPU loss produces recovery UI if the existing reproduction path is available;
- retry creates a fresh renderer and controls instance;
- app-initiated cleanup does not report false GPU loss.

## 11. Raycast / marker regression

Verify:

- native Gaussian splat raycasting still runs only on deliberate selection;
- marker fallback picking still works;
- orbit drag does not accidentally trigger a click selection after meaningful movement;
- touch orbit does not accidentally discover a hotspot on pointer-up;
- target/hover labels track the correct marker after orbit and zoom;
- projected labels disappear or clamp correctly when a marker is out of view.

## 12. Performance sanity

No benchmark target is required unless a regression appears, but verify:

- interaction remains smooth on the existing M4 desktop baseline;
- physical iPhone used in prior QA remains usable if available;
- no per-frame splat raycasting was introduced;
- no unbounded React state update is triggered on every camera frame;
- DPR caps remain in place;
- no obvious memory/resource growth across repeated reset/detail/reload cycles.

## 13. Environment-mode regression

The existing fly controller is retained for `environment` mode. Exercise at least one temporary/local environment-mode configuration before merge:

- WASD/QE movement;
- mouse look / pointer lock;
- touch move/look split;
- reset;
- hotspot selection if configured;
- cleanup/reload.

This can use the lion temporarily for control-path verification; it does not imply the lion should ship in environment mode.

## 14. Evidence requirements

Create a new dated evidence folder, for example:

```text
design/reference/2026-09-XX-object-camera-qa/
```

Record:

- exact commit SHA;
- browser/device versions;
- viewport/device dimensions;
- which input was physical/real vs automation/emulation;
- screenshots for the important compositions;
- console/page-error status;
- any skipped matrix rows and why.

Do not overwrite or relabel the 2026-09-11 evidence.

## 15. Final GO criteria

GO requires all of the following:

1. exact candidate passes `npm run check`;
2. object camera passes visual/product acceptance;
3. desktop orbit + zoom + reset pass;
4. physical touch orbit + pinch pass when hardware is available, or the absence of physical evidence is explicitly called out before release approval;
5. all three hotspot shots are visually correct;
6. detail UI does not obscure its subject;
7. reduced-motion behavior passes;
8. renderer/loading/retry regressions are clear;
9. environment free-flight path still works;
10. evidence is committed for the exact candidate being approved.
