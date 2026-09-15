# Splat Walk object-camera release gate

Review target: implementation. Date: 2026-09-15.

**Rendered verdict: GO**, with the hardware/browser limitations below. The lion now behaves as an inspectable object: ordinary dragging keeps it in view, the three guided shots show their named features, and narrow-screen sheets no longer hide those features completely. This is a clear improvement over free flight for this bust. It is not a claim that the scan itself is artifact-free or that physical touch feel has been validated.

## Exact candidate and surface

- PR #6 was **OPEN**, head `d57086bc156f5327d5484893ecc16169813f463e`, after `git fetch --all --prune`.
- The original checkout was actually on dirty `fix/spz-single-fetch`, HEAD `2b3d6a1aa8de981bef64abe588c9440b17145e21`. Its `.gitignore` modification and unrelated evidence were preserved. Testing and edits used the isolated same-volume worktree `splat-walk-object-camera-qa`, branch `feat/object-camera-exhibit-2026-09-15`.
- Initial rendered candidate: `d57086bc156f5327d5484893ecc16169813f463e`.
- **Final tested application-source commit: `6147250e5e6005172a261cebc695d73b1a62ca37`.** The subsequent evidence-only commit contains this record; it does not change application code.
- The Vercel preview alias redirected to SSO. Tests used a real local **production** build at `http://localhost:3007`, not a dev server or static substitute. Production was rebuilt and restarted after source changes.
- Headed Google Chrome **153.0.8010.37**, `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, Apple M4 Mac, macOS/Darwin 25.6.0. Desktop: **1440×900, DPR 1**. Responsive: **390×844, 320×568, 844×390** using Chrome/CDP emulation.
- WebGPU was active: `navigator.gpu`, an intercepted successful application `GPUAdapter.requestDevice`, Apple `metal-3`, `fallback: false`, and **17,534 actual GPU queue submissions** in the final receipt. A visible splat lion, `data-engine="three.js r186 webgpu"`, `data-phase="ready"`, object mode, and one canvas corroborate the device probe. See `desktop-runtime.json`.
- Both lanes initially attached to one Chrome target despite different tab names. Concurrent emulation contaminated some early captures. Work was serialized, a separate Chrome profile was opened, and affected checks were repeated. Lane B marks its corrected acceptance captures `-postfix`; A's `*-final.png` captures are the final desktop/narrow supplement.

The release command is `npm run check` (TypeScript, ESLint, production build). Its captured output is **`final-check.txt`**. Only a successful exit permits the evidence commit and branch push. No merge, main push, or production deployment is part of this gate.

## Desktop/input and tour results

| Path exercised | Result and evidence |
|---|---|
| Initial load / deliberate overview | PASS. Centered three-quarter lion, clear silhouette, quiet HUD. `desktop-overview-final.png`. The authored overview is not frontal. |
| Horizontal/vertical drag | PASS. Native browser mouse input orbits around the lion rather than looking away. `desktop-orbit.png`, `desktop-pitch-low.png`, `desktop-pitch-high.png`. |
| Repeated yaw rotations | PASS. Two full turns retained the subject without accumulated framing drift. `desktop-two-full-orbits.png`. |
| Wheel / high-resolution wheel | PASS. Discrete ±1200 deltas and a stream of 3px deltas change radius smoothly. `desktop-high-resolution-wheel.png`. These were injected browser events, not a physical trackpad. |
| Minimum / maximum zoom | PASS. Repeated aggressive input stops at the authored limits. Minimum is an extreme exterior macro crop, not a camera cut through the surface; maximum keeps a readable bust. `desktop-zoom-min.png`, `desktop-zoom-max.png`. |
| Pitch limits / damping | PASS. Both pitch extremes retain a coherent bust without a flip. Direct manipulation responds promptly and settles without prolonged drift. No benchmark or physical-device tactile claim. |
| Object-mode exclusions / copy | PASS. No pointer lock, crosshair, WASD/QE dependency or free-flight hint. Canvas accessible name also explains arrows and +/- zoom. |
| Overview / Home / keyboard | PASS. Arrow keys orbit, +/- zoom, Home restores overview with canvas focus. A discovered Home/card mismatch was fixed: Home now also closes detail and clears narrow framing, including reduced motion. `desktop-keyboard-orbit.png`, `desktop-keyboard-zoom.png`, `desktop-home-detail-fixed.png`, `desktop-320-home-reduced-final.png`. Discovery is retained. |
| Ring hover / focus | PASS. All three projected hover labels are readable and attached to their markers. Keyboard dock buttons remain labeled and focusable; selecting moves focus to Close. Final label clearance measured in desktop and 320px touch. `desktop-label-fixed.png`, `desktop-320-label-final.png`. |
| Face to face | PASS through ring edge, nearby eligible surface and dock. Brow/eyes visible with card. `desktop-face-final.png`; lane B's 320/390 face `-postfix` captures. |
| Surface detail | PASS through ring edge, nearby eligible surface and dock. Coat is visible at useful scale. The shot deliberately crops the front of the head; blue/dark capture artifacts are part of the scan. `desktop-surface-final.png`, `desktop-native-surface-pick.png`. |
| Fine whiskers | PASS through ring edge, nearby eligible surface and dock. Muzzle/individual whisker strands visible outside the card. `desktop-whiskers-final.png`, `desktop-320-whiskers-final.png`, lane B's 390 whisker `-postfix` capture. |
| Surface picking | PASS. Outside-ring clicks selected Face at (709,293), Surface at (856,458), and Whiskers at (606,586) from desktop overview. A random nearby point need not be eligible. Production does not expose internal `lastPick`; marker-fallback internals were not separately instrumented. |
| Transition interruption / close | PASS. Direct drag during a focus transition takes control while preserving selected detail. Escape and Close dismiss; closing leaves a usable detail pose. Ring-origin close restores canvas focus; dock-origin close restores that button. `desktop-interrupted-focus.png`. |
| Previous / Next | PASS. Previous 1→3 and Next 3→1 cycle, change camera/detail, and keep the activated control focused. Repeated selection does not inflate discovery. |
| Completion / Replay / free explore | PASS. All three visited states reach 3/3. Escape reveals “All details discovered”; Replay opens the first guided shot; Explore freely dismisses acknowledgement and orbit remains usable. Desktop acknowledgement now occupies the right-hand empty column. `desktop-completion-final.png`. |

### Desktop framing was preserved

The overview image comparison found **422/1,296,000 changed pixels (0.0326%, comparison threshold 0.1)**. All highlighted differences are in the pulsing hotspot rings; the lion silhouette, geometry framing and HUD do not move. See `desktop-overview-diff.png`. The new camera view offset is a strict no-op at widths ≥640px. No target/yaw/pitch/radius or input-feel constant changed.

## Responsive, touch and reduced motion

Lane B's full record is `lane-b-findings.md`. Its final summary was received before release validation/commits.

| Surface | Result |
|---|---|
| 390×844 | PASS after fixes. Face and muzzle sit above their sheets; compact projected label is 145×36px rather than the previous 401px-tall box. Hint no longer restarts after closing detail. |
| 320×568 | PASS with a cramped-layout note. Eyes and whisker strands are now visible in the small header-to-sheet band; the rest of the head can be obscured. A measured touch label was 144.66×35.59px at x97.1/y159.5, wholly inside the viewport. Home clears detail and the view offset. |
| 844×390 coarse landscape | PASS with a scroll note. Face remains visible beside the right-hand card. Previous/Next sit below its initial fold but are reachable by card scroll (scrollTop 51). Completion can cover part of the muzzle; eyes and actions remain visible. |
| One-finger orbit / pinch | PASS in CDP-emulated Chrome. Pose/radius change, pinch does not select, pinch→one-finger does not accidentally select, page scroll remains 0 and visualViewport scale remains 1. |
| Touch detail / Overview | PASS. Ring-edge tap opens Face and marks 1/3. Overview restores the authored three-quarter pose without clearing discovery. Hollow ring centers are not guaranteed surface hits. |
| Reduced motion | PASS. Reload with `prefers-reduced-motion: reduce`; focus and Overview snap, direct keyboard orbit remains functional, CSS transitions are removed. A separately tested 320px Home path closes detail and clears framing. No idle orbit is implemented. |

**Physical touch was not tested.** Lane B reports a USB-connected iPhone, but did not open the local candidate in its Safari. Chrome touch emulation does not certify iPhone rendering, native gesture feel or actual trackpad feel. Historical iPhone evidence was not reused.

## Fixes and tuning

| Defect | Before → after |
|---|---|
| Hover label animation overrode placement | `hotspot-label-in` animated transform from `translate(-50%, 4px)` to `translateX(-50%)` → opacity-only animation. The existing inline above-marker transform now wins. Desktop label bottom **317.03 → 267.45px** for marker y281.45; required 14px clearance changed FAIL→PASS. |
| Coarse projected label stretched over header | Coarse `bottom: 7rem` combined with inline `top` → object-only CSS `bottom: auto`. 390px label **145×401 at y−85 → 145×36 at y281**. Environment label positioning is unchanged. |
| 320px detail sheet hid the named feature | No projection offset → narrow-only `setViewOffset` using existing `mobileOffset` plus the actual safe band between header bottom and sheet top. Existing 640px CSS breakpoint; 16px clearance above/below the band. Offset clears on deselect/Home and recomputes on resize; desktop remains untouched. No radius or semantic target changes. |
| Hint restarted when closing detail | Four-second timer was canceled/restarted by `selected` changes → timer runs through a detail visit. **4000ms remains 4000ms**. Controls can still explicitly reveal the hint. |
| Desktop completion covered chin | Centered `left:50%`, translated, `bottom:7rem`, width up to22rem → at ≥640px, `left:auto; right:2rem; bottom:8rem; width:20.5rem`, no translate. Final desktop panel has clear space from muzzle and whiskers. |
| Home left the detail/card offset active | Controller reset alone → canvas-host Home handler also calls the existing close-card path. Controller still owns camera reset; no new controller interface or lifecycle changes. Tested normal desktop and reduced-motion 320px. |

All camera profile values, hotspot poses, orbit/zoom sensitivities, damping, pitch/radius limits and asset data are unchanged. The temporary environment-mode test was restored to object mode before the final source commit. Changed application files: `app/globals.css`, `components/SplatScene.tsx` only.

## Renderer/recovery and environment regression

- PASS: reload returns discovery to 0/3; each ready/retry state has one canvas; interaction remains responsive after reload/retry.
- PASS: native browser background/return produced actual `visibilityState` hidden→visible and a usable rendered scene afterward (`desktop-background-return.png`). A separate controlled visibility probe held submissions at **34,934** while paused and advanced to **35,178** after resume.
- PASS: explicitly destroyed GPU device showed recovery UI, and Reload capture created a fresh rendering device/canvas with keyboard focus restored. `desktop-gpu-loss.png`, `desktop-gpu-recovered.png`.
- PASS: intercepted HTTP503 showed the specific scan-load error and retry recovered. The isolated stable-viewport run recorded exactly **one SPZ GET per attempt**, two total including successful retry. `desktop-http-failure.png`, `desktop-http-recovered.png`.
- PARTIAL: temporarily built the real `environment` mode. Keyboard forward/height movement, arrow/mouse-drag look, reset, hotspot selection and CDP touch move/look split remained usable. `desktop-environment-*.png`, `touch-environment-split-regression.png`. Native pointer-lock acquisition was denied by this automation surface with **`WrongDocumentError: The root document of this element is not valid for pointer lock.`** The app displayed its existing drag fallback and remained usable; successful captured-mouse operation is not claimed.
- Not rerun: missing-WebGPU/no-adapter simulations, every streamed/indeterminate progress variant, a memory-growth benchmark, Safari, or physical iPhone Safari. Those are explicit coverage gaps, not inferred passes.

## Console and evidence integrity

Application console warnings/page errors: **none observed** in the instrumented loads and interactions. The deliberate HTTP503 tests emitted exactly three resource errors across two fault-injection runs (the first also overlapped a viewport-triggered navigation):

```text
Failed to load resource: the server responded with a status of 503 (Service Unavailable)
```

No unplanned GPU/renderer warnings were observed. The pointer-lock rejection above was caught by the application; it was inspected separately. Browser-facade timeouts, shared-target collisions and a failed QA probe are tooling limitations, not application console errors. `desktop-runtime.json` preserves the runtime receipt.

Canonical final desktop captures: `desktop-overview-final.png`, `desktop-face-final.png`, `desktop-surface-final.png`, `desktop-whiskers-final.png`, `desktop-completion-final.png`, plus the named input/recovery captures. Narrow acceptance uses lane B's `-postfix` files and A's final 320px supplement. Earlier failure captures remain labeled as before/pre-fix evidence. No old 2026-09-11 frame is presented as current proof.

The product has one authored dark exhibit theme; no alternate light theme was added or claimed. The four supplied camera/tour/acceptance documents were the design contract; no root `DESIGN.md` was present in this target branch.
