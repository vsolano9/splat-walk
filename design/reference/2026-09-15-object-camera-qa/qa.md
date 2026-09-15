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
- Previous/Next guided detail navigation;
- marker-adjacent labels;
- all-details completion acknowledgement;
- no object-mode pointer lock/crosshair/WASD requirement;
- unchanged environment-mode fly controller apart from shared interface alignment.

## Automated / deployment evidence

### Full release check

Commit `864abf85c20c7e3602ed8a78e8dc975474e42618` temporarily added a preview-only Vercel build override to execute the repository's normal release command:

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

Vercel deployment: `dpl_62bfheH55iPfFRGnC93ccdHt8iXH`

The temporary `vercel.json` was then deleted in commit `3277fe1ae12aea30db96608b7cd68e3db1d099be`; it is not part of the intended product configuration.

### Normal preview build

Implementation commit `5edb98850733dc82d5b6990ea1de469d479776a7` also passed Vercel's normal `npm run build`, including Next compilation, TypeScript and static prerender.

Vercel deployment: `dpl_7qFcJBtiQi7WzTaYSjgkHzUUXEzF`

### Preview route

The full-check preview returned HTTP 200 and its prerendered HTML contained:

```html
data-scene-mode="object"
```

This proves the intended scene mode is wired into the rendered app shell. It does not prove WebGPU camera motion, touch gestures or visual composition.

## Review fixes made after the first implementation pass

- added `lostpointercapture` cleanup and explicit pointer-capture release on object-controller disposal;
- removed a stale React-state capture from the renderer effect's target-clear helper;
- expanded the object-mode canvas accessibility label to include keyboard orbit/zoom controls;
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

Reason: the Work/OMP local browser/device bridge became unavailable during the implementation session. No substitute claim is made from code inspection, HTTP output or historical screenshots.

## Merge gate

PR #6 is **not release-approved by this record alone**. Before merge:

1. run the outstanding rendered UI/input checks against the exact current PR head;
2. tune camera/hotspot pose constants only where actual evidence shows a problem;
3. rerun `npm run check` if source changes;
4. record screenshots/notes here or in sibling files;
5. merge only after the visual/input gate passes;
6. verify the production deployment at `https://splat-walk.vercel.app` after merge.
