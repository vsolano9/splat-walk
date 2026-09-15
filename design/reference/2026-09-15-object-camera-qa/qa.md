# Splat Walk object-camera QA record

Date: 2026-09-15
Branch: `feat/object-camera-exhibit-2026-09-15`
Pull request: #6
Base: `main` at `a237a5c27540edd5001d1ba2631950fa2e41a247`

This record separates completed automated/deployment verification from the rendered input/visual checks that still must happen before merge. Historical 2026-09-11 screenshots are not reused as evidence for the new controller.

## Implemented candidate

The branch changes the bundled lion from free flight to explicit object inspection while preserving the legacy controller for `environment` mode.

Behavior under review:

- subject-centered target/yaw/pitch/radius camera model;
- mouse/trackpad drag orbit;
- wheel/trackpad radius zoom;
- one-finger touch orbit;
- two-finger pinch zoom;
- arrow-key orbit, `+`/`-` zoom and Home overview reset;
- authored pitch/radius constraints and delta-time-aware damping;
- authored camera poses for all three hotspots;
- cyclic Previous/Next guided detail navigation that keeps the activated control focusable;
- marker-adjacent labels;
- all-details completion acknowledgement;
- no object-mode pointer lock/crosshair/WASD requirement;
- unchanged environment-mode fly controller apart from shared interface alignment.

## Automated / deployment evidence

### Post-review full release check

After the final source review fix, commit `a65a7ffdf3ee67f01cbc2c41551a92a67e0ec028` temporarily added a preview-only Vercel build override to execute the repository's normal release command against source commit `2db6cf376323631276aa2ed9cea4577f2eae0d68` plus the temporary config:

```text
npm run check
> npm run typecheck && npm run lint && npm run build

> tsc --noEmit
PASS

> eslint .
PASS

> next build
Next.js 16.3.4 (Turbopack)
Compiled successfully
TypeScript finished
Static pages generated 4/4
Build completed
```

Vercel deployment: `dpl_Hi1GnBLy5s6axu1ARW55j7dipCxR`

The temporary `vercel.json` was removed immediately afterwards in commit `3161e331c8dd6ee99ef7b519a945865d3d029baf`. It is not part of the intended product configuration. The removal changes deployment configuration only; the checked application source is unchanged.

An earlier full-check deployment at `864abf85c20c7e3602ed8a78e8dc975474e42618` also passed before the later review/focus fix. The post-review result above supersedes it for release-check purposes.

### Normal preview builds

The branch has repeatedly passed Vercel's normal `npm run build`, including Next compilation, TypeScript and static prerender. A normal preview was triggered again after removal of the final temporary build override so the branch returns to its intended configuration.

### Preview route

A candidate preview returned HTTP 200 and its prerendered HTML contained:

```html
data-scene-mode="object"
```

This proves the intended scene mode is wired into the rendered app shell. It does not prove WebGPU camera motion, touch gestures or visual composition.

## Review fixes made after the first implementation pass

- added `lostpointercapture` cleanup and explicit pointer-capture release on object-controller disposal;
- removed a stale React-state capture from the renderer effect's target-clear helper;
- expanded the object-mode canvas accessibility label to include keyboard orbit/zoom controls;
- made Previous/Next tour navigation cyclic so keyboard focus never lands on a control that becomes disabled after activation;
- corrected metadata that still described the lion as "Move freely";
- reconciled README/docs so free-flight claims are scoped to environment mode rather than the lion.

## Renderer/recovery scope review

The implementation deliberately leaves these proven systems structurally intact:

- native WebGPU adapter/backend setup;
- one SPZ GET per load attempt;
- streamed byte progress;
- SPZ parse + `GaussianSplat` construction;
- explicit GPU-loss teardown/retry path;
- hidden-tab animation-loop pause/resume;
- native Gaussian ellipsoid raycasting on deliberate pick;
- marker fallback raycasting;
- discovery state;
- DPR caps;
- geometry/material/renderer/listener cleanup.

The integration change in `SplatScene.tsx` selects `createObjectControls` or `createFlyControls` from `SCENE_MODE`; it does not replace the renderer lifecycle.

## Outstanding rendered UI/input gate

**NOT RUN in this record:**

- actual WebGPU lion frame on the final candidate;
- desktop mouse drag orbit feel;
- real wheel/high-resolution trackpad zoom feel;
- physical/coarse-pointer one-finger orbit;
- physical/coarse-pointer two-finger pinch;
- visual inspection of the three authored hotspot shots;
- feature visibility with desktop detail card open;
- feature visibility above the portrait bottom sheet;
- responsive composition at desktop and narrow portrait;
- reduced-motion camera behavior on a rendered surface;
- exact-candidate console/runtime-error pass after interactive use.

Reason: the Work/OMP local browser/device bridge became unavailable during the implementation session. An isolated Chromium fallback existed locally but could not reach external network, so it could not render the Vercel preview. No substitute claim is made from code inspection, HTTP output or historical screenshots.

## Merge gate

PR #6 is **not release-approved by this record alone**. Before merge:

1. run the outstanding rendered UI/input checks against the exact current PR head;
2. tune camera/hotspot pose constants only where actual evidence shows a problem;
3. rerun `npm run check` if source changes;
4. record screenshots/notes here or in sibling files;
5. merge only after the visual/input gate passes;
6. verify the production deployment at `https://splat-walk.vercel.app` after merge.
