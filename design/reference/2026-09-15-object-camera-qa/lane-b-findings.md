# Lane B — responsive / touch / reduced-motion QA

Date: 2026-09-15  
Lane: ResponsiveTouchQA2  
Repo worktree: `/Volumes/Extreme Pro/Documents/Work/demos/splat-walk-object-camera-qa`  
Branch: `feat/object-camera-exhibit-2026-09-15`  
Starting SHA: `d57086bc156f5327d5484893ecc16169813f463e`  
Surface: local production `http://localhost:3007` (Vercel preview alias is SSO-gated; not used)  
Browser: headed Google Chrome 153 (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`), native WebGPU adapter `apple` / `metal-3`, not a fallback adapter. Tab name `splat-b`.  
WebGPU proof: `navigator.gpu` true, scene `data-phase="ready"`, `data-scene-mode="object"`, 195k-class splat lion visibly rendered before any judgment.

ObjectCamQA landed mid-session source fixes on `:3007` (label `bottom:auto`, narrow `camera.setViewOffset` into the header–sheet band, hint no longer restarts after a detail, landscape card remains `overflow-auto`). **Postfix shots are the acceptance set.** Pre-fix shots are retained as the defect record.

No code, git, or `npm run check` from this lane.

## Verdict

| Path | Result |
|---|---|
| Responsive 1440×900 | **PASS** |
| Responsive 390×844 portrait | **PASS** after view-offset / label / hint fixes |
| Responsive 320×568 | **PASS** after view-offset / label / hint fixes |
| Responsive 844×390 landscape (extra) | **PASS** with notes (tour controls below fold, reachable by card scroll) |
| Touch | **PASS** on emulated coarse-pointer Chrome. **Not run on a physical phone.** |
| Reduced motion | **PASS** |

GO for this lane on the postfix local production, with the explicit limitation that touch was **not** verified on hardware.

## Surface and limitations

- Touch was **CDP-emulated** on desktop Chrome: `Emulation.setDeviceMetricsOverride` (mobile), `Emulation.setTouchEmulationEnabled`, `Emulation.setEmitTouchEventsForMouse`, and `Input.dispatchTouchEvent`. That is **not** a physical iPhone/iPad. Victor’s iPhone (iOS 26.6.2) was connected over USB, but the candidate was `localhost:3007` on the Mac and was not opened in device Safari.
- The Eval browser façade initially attached both lanes to one Chrome target. Viewport / `pointer: coarse` emulation from this lane contaminated ObjectCamQA’s desktop session. After serialization, this lane used Chrome pid 76249 / profile `/tmp/splat-qa-a2-profile-20260915`.
- Authored overview is a **three-quarter** lion, not a frontal shot. Comparing Overview to a frontal ideal is wrong.
- Console / page errors on this lane’s loads and interactions: **none observed**.
- Emulation was reset at the end of the reduced-motion pass (`pointer: fine`, `prefers-reduced-motion: no-preference`, device metrics cleared, 1440×900).

## Responsive

Questions at each size: lion cropped by header/dock/detail? labels inside the viewport? detail sheet hiding the described feature? controls tappable/readable? completion colliding with dock/footer? Overview and tour usable?

### 1440×900 (pointer fine, original capture)

| Check | Result | Evidence |
|---|---|---|
| Overview lion not cropped by HUD | PASS | `responsive-1440x900-overview.png` |
| Projected label inside viewport | PASS after keyframe/`bottom:auto` | `responsive-1440x900-hotspot-label.png` — 145×36 at y=232 |
| Face to face feature visible with card | PASS — brow/eyes clear of the right card | `responsive-1440x900-detail-face.png` |
| Surface detail feature visible | PASS — coat/cheek visible; tight authored crop clips the left of the head by camera pose, not by the card | `responsive-1440x900-detail-surface.png` |
| Fine whiskers feature visible | PASS — muzzle visible; card on the right | `responsive-1440x900-detail-whiskers.png` |
| Overview / dock tappable | PASS — Overview 90×42, dock buttons ≥38px | layout probe |
| Completion vs dock | PASS — no DOM overlap with dock/footer | `responsive-1440x900-completion.png` (ObjectCamQA separately notes the card covering chin on desktop; not a dock collision) |

Postfix 1440 overview (`responsive-1440x900-overview-postfix.png`) keeps the same lion composition after `setViewOffset` (1440 is a no-op). That capture still had leftover `pointer: coarse`, so the HUD showed the touch hint; subject framing is the check.

### 390×844 portrait (coarse, postfix)

| Check | Result | Evidence |
|---|---|---|
| Overview | PASS — lion in the mid band, not under header/dock | `responsive-390x844-overview-postfix.png` |
| Label | PASS after `bottom:auto` — 145×36 at y=281, above the brow ring, no header overlap | `touch-390x844-hotspot-label.png` (pre-fix `responsive-390x844-hotspot-label.png` was 145×401 at y=−85) |
| Face sheet | PASS — eyes/brow sit in the header–sheet band | `responsive-390x844-detail-face-postfix.png` |
| Whiskers sheet | PASS — muzzle/whiskers above the sheet | `responsive-390x844-detail-whiskers-postfix.png` |
| Controls | PASS — Overview 84×40; dock 38× ~88–98px at 11.2px | tappable |
| Completion | PASS — hint opacity 0 (does not restart); card y=592 h=140; no dock overlap; face remains | `responsive-390x844-completion-postfix.png` |

Pre-fix 390 Face/Whiskers already showed the features; the view-offset fix made the band intentional rather than lucky.

### 320×568 (coarse, postfix)

| Check | Result | Evidence |
|---|---|---|
| Overview | PASS | `responsive-320x568-overview-postfix.png` |
| Face sheet | PASS after view-offset — eyes now in the ~92px header-to-sheet band (was ears-only) | `responsive-320x568-detail-face-postfix.png` vs pre-fix `responsive-320x568-detail-face.png` |
| Whiskers sheet | PASS after view-offset — muzzle/whiskers visible (was forehead-only) | `responsive-320x568-detail-whiskers-postfix.png` |
| Label | Pre-fix stretched; postfix seek via hover failed because `hover: none`. Compact label proven on 390 touch. | |
| Dock | PASS — all four actions visible, height 38px. Tagline wraps so `close.` sits on its own line next to `0 / 3 found` — readable, cramped. | |
| Completion | PASS without extra CSS — hint gone; card y=316 h=140 covers the lower muzzle; **eyes remain**. Agreed with ObjectCamQA not to shrink the panel. | `responsive-320x568-completion-postfix.png` |

### 844×390 landscape (coarse, postfix)

| Check | Result | Evidence |
|---|---|---|
| Overview | PASS | `responsive-844x390-overview.png` |
| Face feature | PASS — eyes visible; card on the right | `responsive-844x390-detail-face-postfix.png` |
| Tour Previous/Next | In the DOM, below the card fold (`scrollHeight` 225 vs height 176). `scrollTop` 51 brings them on screen. Reachable, not inaccessible. | `responsive-844x390-detail-face-scrolled.png` |
| Completion | Eyes remain; card covers muzzle. No dock collision. | `responsive-844x390-completion-postfix.png` |

## Touch (emulated 390×844)

| Check | Result | Evidence |
|---|---|---|
| One-finger drag orbits | PASS — pose changes vs the starting three-quarter overview | `touch-390x844-before-orbit.png`, `touch-390x844-one-finger-orbit.png` |
| Two-finger pinch zooms | PASS — radius changes, including a near-min macro where the header can cover an eye | `touch-390x844-pinch-zoom.png` |
| Pinch does not select a hotspot | PASS — `selected` stayed null through pinch | layout probe |
| Pinch → one-finger | PASS — no accidental selection | `touch-390x844-pinch-to-one-finger.png` |
| Tap selects without orbit | PASS when tapping the **ring edge** (Face at ~212.5, 330.7). Hollow-center taps miss, as ObjectCamQA warned. | `touch-390x844-tap-select.png` — Face sheet, `1 / 3 found` |
| Page does not scroll or browser-zoom | PASS — `scrollY` 0, `visualViewport.scale` 1 | probes during orbit/pinch/tap |
| Overview after touch | PASS — closes detail, does not clear `1 / 3`. Authored overview is three-quarter, not frontal. | `touch-390x844-overview-after.png` |

Physical iPhone 12 Pro–class coverage from 2026-09-11 is **not** reused and was not repeated for object mode.

## Reduced motion

CDP `Emulation.setEmulatedMedia` `prefers-reduced-motion: reduce`, then a hard reload (the controller reads the media query at init).

| Check | Result | Evidence |
|---|---|---|
| Media query honored | PASS — `matchMedia("(prefers-reduced-motion: reduce)")` true; `.scene-surface` / `.scan-hint` `transition: none`; transform none | probe |
| Direct orbit still works | PASS — ArrowRight after canvas focus yaws off overview | `reduced-motion-1440x900-orbit.png` |
| Hotspot focus skips long animation | PASS — detail open immediately; `data-resetting` never set | `reduced-motion-1440x900-hotspot-focus.png` |
| Overview snaps | PASS — button never shows `Returning…`; `data-resetting` null | `reduced-motion-1440x900-overview-after-focus.png` |
| Nothing inaccessible | PASS — dock, Close, Overview, keyboard orbit all worked | |
| Idle / decorative camera | N/A — idle orbit and initial settle are not implemented | STATUS.md / DECISIONS D-011 |

The reduced-motion 1440 HUD still showed the touch hint because `pointer: coarse` had not been fully cleared for that reload. Product CSS under reduce is still `transition: none`. Emulation was cleared afterward.

## Defects reported to ObjectCamQA

1. **B1 stretched mobile labels** (pre-fix): coarse `.hotspot-label { bottom: 7rem }` plus inline `top` produced a 401px-tall box overflowing y=−85. **Fixed** (`bottom: auto` on the object-mode inline style). Confirmed 145×36.
2. **320 Face / Whiskers sheet hid the described feature** (pre-fix). **Fixed** with narrow-only `setViewOffset` into the real header–sheet band. Confirmed on postfix shots.
3. **Hint restarted after closing a detail** if the 4s timer had been interrupted. **Fixed**. 390/320 completion postfix have hint opacity 0.
4. Landscape Previous/Next below fold: **not a blocker** — card scroll reveals them.
5. 320 completion covering the muzzle: **not a blocker** after the hint fix; eyes remain. No compact-completion CSS requested.

## Screenshots produced by this lane

Prefixed `responsive-`, `touch-`, or `reduced-motion-` under `design/reference/2026-09-15-object-camera-qa/`. Canonical postfix / touch / reduced-motion set:

- `responsive-1440x900-overview.png`
- `responsive-1440x900-hotspot-label.png`
- `responsive-1440x900-detail-face.png`
- `responsive-1440x900-detail-surface.png`
- `responsive-1440x900-detail-whiskers.png`
- `responsive-1440x900-completion.png`
- `responsive-390x844-overview-postfix.png`
- `responsive-390x844-detail-face-postfix.png`
- `responsive-390x844-detail-whiskers-postfix.png`
- `responsive-390x844-completion-postfix.png`
- `responsive-320x568-overview-postfix.png`
- `responsive-320x568-detail-face-postfix.png`
- `responsive-320x568-detail-whiskers-postfix.png`
- `responsive-320x568-completion-postfix.png`
- `responsive-844x390-overview.png`
- `responsive-844x390-detail-face-postfix.png`
- `responsive-844x390-detail-face-scrolled.png`
- `responsive-844x390-completion-postfix.png`
- `touch-390x844-before-orbit.png`
- `touch-390x844-one-finger-orbit.png`
- `touch-390x844-pinch-zoom.png`
- `touch-390x844-pinch-to-one-finger.png`
- `touch-390x844-hotspot-label.png`
- `touch-390x844-tap-select.png`
- `touch-390x844-overview-after.png`
- `reduced-motion-1440x900-overview.png`
- `reduced-motion-1440x900-hotspot-focus.png`
- `reduced-motion-1440x900-overview-after-focus.png`
- `reduced-motion-1440x900-orbit.png`

Pre-fix 390/320/844 files without `-postfix` remain in the same folder as the defect record. ObjectCamQA owns desktop-*.png.

## Console

Zero page errors and zero console error/warning messages on the loads this lane instrumented (1440 first ready, 390/320/844 postfix matrix, touch reload, reduced-motion reload).
