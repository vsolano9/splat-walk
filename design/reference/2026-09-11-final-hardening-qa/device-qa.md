# Splat Walk — device / runtime QA (verification only)

Date: 2026-09-11
Target: **live production** <https://splat-walk.vercel.app/> (HTTP 200, deployed `main` @ `0ccea82`)
Lane: `SplatWalkDeviceQA` — verification only. No repo code was edited, nothing was committed.
Host: macOS 26.6.2 (25G83), Apple M4.

All input described as "real" was delivered by the OS-level `computer` facade (native
CGEvent mouse/keyboard into a specific window). Where CDP (DevTools protocol) input was used
instead, it is called out explicitly. No pointer-lock stub, shim, or test double was used:
every lock claim below is `document.pointerLockElement === <canvas>` read from the live page,
corroborated by the app's `.scene-crosshair`, which is rendered **only** while `locked === true`.

---

## 1. Matrix

| # | Platform / version | Check | Result | Evidence |
|---|---|---|---|---|
| 1.1 | Chrome 153.0.8010.37 (headed, OMP dedicated profile, 1512×896 window, viewport 1512×809 @dpr2) | Scene reaches `ready`, lion + 3 rings + HUD render | PASS | `desktop-chrome-idle.png` |
| 1.2 | Chrome 153 | **Real** OS click on `Explore` → `document.pointerLockElement === canvas` | PASS (`locked: true`, `lockTag: "CANVAS"`, `activeElement` = canvas, no lock-error text) | `pointerlock-locked.png` (crosshair at canvas centre) |
| 1.3 | Chrome 153 | Control: real `m` keypress delivered to the same window while locked | PASS — keydown observed on canvas, lock **persisted** | inline log: `m@CANVAS:…`, `locked: true` |
| 1.4 | Chrome 153 | Control: 1.5 s idle while locked | PASS — lock persisted | inline snapshot |
| 1.5 | Chrome 153 | **Real** `Escape` (background delivery, no window/focus shuffle) releases pointer lock | PASS — `locked: false`; Escape keydown never reaches the page (consumed by Chrome) | `pointerlock-escape-released.png` |
| 1.6 | Chrome 153 | Escape changes **nothing else** | PASS — detail card stayed closed, discovery counter unchanged, `activeElement` still the canvas, no "Mouse capture was unavailable" | same snapshot; crosshair centre patch max luminance 225 → 19 |
| 1.7 | Chrome 153 | WASD moves while locked (`W` held 600 ms) | PASS — lit-pixel count 570 802 → 927 046 (+62 %), scene centroid advanced | `pointerlock-move.png` |
| 1.8 | Chrome 153 | Mouse look while locked (15 × +10 px, measured delivery `movementX` total exactly +150, `movementY` 0) | PASS — scene centroid shifted left 499 px (1477.7 → 979.0), matching a 0.27 rad yaw | `pointerlock-move.png`, see caveat C1 |
| 1.9 | Chrome 153 | Dock `Face to face` opens detail | PASS — card opens, counter `0/3` → `1/3`, focus moves to `Close detail` | `dock-detail-open.png` |
| 1.10 | Chrome 153 | Re-click same dock button | PASS — card stays open, focus on the dock button (`Face to face, found`) | inline snapshot |
| 1.11 | Chrome 153 | `Escape` with focus on the dock button closes the detail and leaves focus on that dock button | PASS — `detailOpen: false`, `activeElement` = `BUTTON \| Face to face, found`; card region max luminance 244 → 20 | `dock-detail-escape.png` |
| 1.12 | Chrome 153 | `Reset` restores the spawn pose | PASS — real click sets `data-resetting` and the framing returns to spawn | `pointerlock-locked.png` (post-reset, locked) |
| 2.1 | Safari 26.6.2 (21624.5.1.11.3) | WebGPU renders on real Safari | PASS — lion, 3 rings, HUD, `three.js r186 native WebGPU splats`, `0 / 3 found`; **no** unsupported card | `safari-desktop-idle.png` |
| 2.2 | Safari 26.6.2 | Controls hint | PASS — shows on load ("Click to explore · WASD move · Q/E height / Mouse or arrows look · Esc releases · Aim at a ring for its label") and again via the `Controls` dock button | `safari-desktop-idle.png` |
| 2.3 | Safari 26.6.2 | `Explore` → pointer lock | PASS — Safari's own banner "Your mouse pointer is hidden. Press Esc (Escape) once to dismiss this banner. Press Esc again to reveal your mouse pointer." **and** the app crosshair at canvas centre | `safari-desktop-pointerlock.png` |
| 2.4 | Safari 26.6.2 | `Escape` releases | PASS with nuance — Esc #1 dismisses Safari's banner, lock persists (crosshair still drawn); Esc #2 releases (crosshair gone). Counter and detail state unchanged throughout | `safari-desktop-pointerlock-released.png`, finding F1 |
| 2.5 | Safari 26.6.2 | Detail open, then close by keyboard | PASS — dock click opens card and moves AX focus to `Close detail`; **real** `Escape` closes it (card region max luminance 244 → 18) and AX focus lands on the dock button `Face to face, found` | `safari-desktop-detail.png`, `safari-desktop-detail-escape-closed.png` |
| 2.6 | Safari 26.6.2 | Keyboard activation of a dock button | PASS — AX-focused `Show controls` + real `Return` toggled the hint (focus ring visible) | inline (`focused: button:Show controls`) |
| 2.7 | Safari 26.6.2 | Reduced motion via System Settings | NOT RUN (optional in scope) | — |
| 3.1 | iPhone 12 Pro (iPhone13,3), iOS 26.6.1 (23G83), paired, booted, developer mode on | Open live URL in mobile Safari | **BLOCKED — device locked.** `devicectl device process launch --payload-url … com.apple.mobilesafari` → `FBSOpenApplicationServiceErrorDomain error 1 / RequestDenied`: "Unable to launch com.apple.mobilesafari because the device was not, or could not be, unlocked." | inline error text |
| 3.2 | same | Orientation control | **UNSUPPORTED** — `devicectl device orientation get` → `The capability "Device Orientation" is not supported by this device` | inline error text |
| 3.3 | same | idle portrait / detail sheet / landscape / orientation change / touch move+look / loading state | **NOT COVERED — no physical-device coverage was obtained.** Nothing on real iOS hardware is claimed. | — |
| 4.1 | iOS Simulator, iPhone 17 Pro, iOS 26.5 (fallback for 3.x) | Live URL in simulator Safari; record no-WebGPU fallback | PASS — header/branding render, then the error card: heading **"Let's try that again"**, body **"No WebGPU adapter is available. Enable hardware acceleration, then retry."**, button **"Reload capture"**. No crash, no blank page | `sim-ios26-webgpu-fallback.png` |
| 4.2 | iOS Simulator | Rotation / landscape | NOT RUN by choice — rotating needs keystrokes to the Simulator app, whose key window could have been another lane's in-flight capture device (`Sortes Captures 2026-09-11`). Not worth the collision risk for a screen that only shows the no-WebGPU card | — |
| 5.1 | Android | `adb devices` | **No Android device available** — `adb` is not installed and there is no `~/Library/Android/sdk/platform-tools` | inline |

Simulator hygiene: one sibling simulator was already booted; I booted exactly one more
(stock `iPhone 17 Pro`, `79B134B3-…`), stayed at the 2-booted cap, verified no build/test
process was attached, and shut mine down afterwards. The sibling device was never touched.

---

## 2. Findings

| id | Severity | Finding |
|---|---|---|
| F1 | Low (browser-imposed) | In Safari the **first** `Escape` after locking only dismisses Safari's own "your mouse pointer is hidden" banner; the second one releases the pointer. The in-app hint reads "Esc releases", which is accurate on Chrome but takes two presses on Safari's first lock. No code change required; if you want copy parity, say "Esc releases (twice in Safari)". App state is untouched by either press. |
| F2 | Info | Safari's default "Press Tab to highlight each item on a webpage" is **off**, so `Tab`/`Shift-Tab` walks canvas → address bar and never reaches the dock buttons. The markup is correct (real `<button>`s with `aria-label`/`aria-pressed`; AX reports them and `Return` activates them), so this is a Safari preference, not an app defect — but Safari keyboard-only users need full keyboard access / `Option-Tab` to reach the dock. |
| F3 | Info | An environment with no WebGPU adapter (simulator Safari) lands on the retry phase copy ("Let's try that again" + "No WebGPU adapter is available. Enable hardware acceleration, then retry." + `Reload capture`) rather than the `WebGPU required` unsupported copy. Both branches are graceful; recording which one a no-adapter device actually hits. |
| — | None | No defect was found in the pointer-lock lifecycle, the Escape semantics, the dock open/re-click/Escape flow, focus restoration, WASD movement, or mouse look. Zero console messages and zero page errors were captured during a load/interaction window in Chrome. |

## 3. Harness caveats (not app behaviour)

* **C1 — mouse look had to be driven through CDP.** OS-synthesized cursor moves
  (`computer.move` / `window.move`, both foreground and desktop-level) deliver **no**
  `movementX/movementY` to a pointer-locked Chrome, so the OS-level mouse cannot exercise
  mouse-look. Mouse look was therefore exercised with CDP-dispatched trusted `mousemove`
  events, whose delivery was measured in-page (total `movementX` exactly +150 px, `movementY` 0)
  — while the lock itself and every `Escape`/keypress were real OS input. Additionally, the
  *first* CDP `mouse.move` after a lock delivers one large spurious delta (observed
  `movementX −741`, `movementY +348`) because the driver's cached cursor position differs from
  the lock anchor; that single event spins the camera and is a harness artifact.
* **C2 — occluded Chrome windows stop rendering.** While the Chrome window was backgrounded /
  occluded, Chrome produced no new frames, so screenshots repeated the last composited frame
  and camera changes appeared to "do nothing". Raising the window resumed rendering
  immediately. Every result above was taken with the window raised and focused.
* **C3 — Safari has no DOM access here.** An `osascript … do JavaScript` probe triggered the
  macOS "Terminal wants access to control Safari" automation prompt; I **declined** it (no
  permission was granted), so all Safari evidence is real input + pixels + the accessibility
  tree, never page JavaScript.

## 4. Files (this lane)

```
design/reference/2026-09-11-final-hardening-qa/
  device-qa.md                              this report
  desktop-chrome-idle.png                   Chrome 153, ready state, HUD + dock
  pointerlock-locked.png                    locked (pointerLockElement === canvas) + crosshair
  pointerlock-move.png                      after mouse look + W while locked
  pointerlock-escape-released.png           after real Escape: unlocked, crosshair gone, nothing else changed
  dock-detail-open.png                      dock "Face to face" detail open, counter 1/3
  dock-detail-escape.png                    after Escape: detail closed, focus back on the dock button
  safari-desktop-idle.png                   Safari 26.6.2 WebGPU render + controls hint
  safari-desktop-pointerlock.png            Safari pointer lock (Safari banner + app crosshair)
  safari-desktop-pointerlock-released.png   Safari after Esc ×2: lock released
  safari-desktop-detail.png                 Safari detail card open (focus on Close detail)
  safari-desktop-detail-escape-closed.png   Safari after real Escape: card closed, focus on dock button
  sim-ios26-webgpu-fallback.png             iOS 26.5 Simulator Safari: no-WebGPU fallback card
```

Other files in this directory (`after-fix-*`, `device-loss-*`, `regression-*`, `spz-requests-*`,
`device-loss-and-pointer-lock.md`) belong to the `SplatWalkSpzFix` lane, not to this report.

---

## 5. Physical iPhone 12 Pro (added 2026-09-11, lane `SplatWalkIphoneQA`)

Rows **3.1–3.3** above are **superseded**: the phone was unlocked later the same day and a real
handheld pass was obtained against the same live production build (`main` @ `0ccea82`).
Full matrix, findings and caveats: **`iphone-12-pro/iphone-qa.md`**.

Device: iPhone 12 Pro (`iPhone13,3`), **iOS 26.6.1**, Safari
`Version/26.6.1 Mobile/15E148`, layout viewport **390 × 699** CSS px at `devicePixelRatio` 3.

Capture method — `xcrun devicectl device process launch --payload-url …` to open the URL in
mobile Safari (now permitted, the device being unlocked); **macOS iPhone Mirroring** screenshotted
and driven through the OS-level `computer` facade for **real taps and single-finger drags**; and
**macOS Safari Web Inspector** attached over USB for DOM, console and network truth.
`devicectl` has **no** `screenshot` subcommand, and `devicectl device orientation` is
unsupported on `iPhone13,3`.

| # | Check | Result | Evidence (`iphone-12-pro/`) |
|---|---|---|---|
| 5.1 | Loading state + progress bar | PASS — "Loading the scan" / "Streaming the capture…" / filled bar / "Connecting to capture" | `02-loading-progress.png` |
| 5.2 | Reaches `ready`, lion + 3 rings, `0 / 3 found`; **no** unsupported/retry card | PASS — `navigator.gpu` **true** on real iOS 26 Safari, `data-phase="ready"` | `01-ready-portrait.png`, `13-inspector-console-probe.png` |
| 5.3 | Portrait layout, no overlaps | PASS — on-device rects in 390 × 699: header 0–101, hint 102–162, dock 595–646, footer 670–691 | `12-inspector-elements-390x699.png`, `03-ready-controls-hint.png` |
| 5.4 | Touch Controls hint copy | PASS — "Drag left to move · Drag right to look" / "Move near a ring to reveal it · Tap to discover", on load and via the dock `Controls` button | `03-ready-controls-hint.png`, `18-controls-hint-toggled.png` |
| 5.5 | Real tap on a hotspot ring → bottom sheet + Close; counter `1/3` | PASS — sheet "Face to face" with focused `Close`, counter `0 / 3` → `1 / 3`, dock `✓ Face to face`; `Close` dismisses and state persists | `04-detail-sheet-open.png`, `05-detail-closed.png` |
| 5.6 | Real left-half drag moves, right-half drag looks | PASS — camera advanced; view yawed so the lion swung to the right edge | `06-touch-move.png`, `07-touch-look.png` |
| 5.7 | Landscape / short-landscape layout | **NOT CAPTURED** — `Device Orientation` unsupported on `iPhone13,3`, iPhone Mirroring is portrait-only with no rotate control, and the only remaining route (AssistiveTouch ▸ Rotate Screen) means changing an accessibility setting on a personal phone, which was not authorised in this window. No landscape claim is made. | — |
| 5.8 | `Reset` returns to spawn | PASS — spawn framing restored after the move+look excursion | `08-after-reset.png` |
| 5.9 | Background (Home) and return | PASS — still `ready`, spawn framing and counter intact, and a further drag still moves the camera, so it is live rather than a stale frame; also survived a ~4-minute background trip | `09-resume-after-background.png`, `10-resume-still-live.png` |
| 5.10 | Console errors | PASS — **zero** messages (no errors, warnings or logs) across a full device reload with the inspector attached | `14-inspector-console-clean-after-reload.png`, `15-inspector-state-after-reload.png` |
| 5.11 | SPZ request shape on device (bonus) | PASS — `/scenes/lion.v3.spz` body downloaded **once**: `HEAD 200` (193 B, `enc=0`) then the 4.31 MB payload (`enc=4305581`, 851 ms) | `16-inspector-network-spz.png`, `17-inspector-network-spz-head.png`, `19-inspector-resource-timing-spz.png` |

New finding **P1 (Info, product question)**: `Reset` restores the spawn pose but does **not** clear
discoveries — the counter stayed `1 / 3 found` and the dock kept `✓ Face to face` across a Reset.
Defensible as a camera reset; decide whether the label should be `Reset view`.
No other defect was found on real hardware.

Finding **F3** (no-WebGPU-adapter copy) is unreachable on this device and remains simulator-only.

Two developer settings were turned on for this pass and **turned back off** afterwards: macOS
Safari ▸ Advanced ▸ "Show features for web developers", and iPhone ▸ Safari ▸ Advanced ▸
"Web Inspector".
