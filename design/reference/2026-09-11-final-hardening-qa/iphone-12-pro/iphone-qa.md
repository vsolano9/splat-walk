# Splat Walk — physical iPhone 12 Pro QA (verification only)

Date: 2026-09-11
Target: **live production** <https://splat-walk.vercel.app/> — deployed `main` @ `0ccea82`
(not this branch; `fix/spz-single-fetch` is unmerged).
Lane: `SplatWalkIphoneQA` — verification only. No product code was touched.

## Device and software (read from the device, not assumed)

| | |
|---|---|
| Device | Victor's iPhone — iPhone 12 Pro (`iPhone13,3`), `704E2BAF-F5A2-55E0-BA3C-61162668D158` |
| iOS | 26.6.1 (as reported by Safari's Develop menu, `11-develop-menu-device.png`) |
| Safari UA | `Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1` |
| Layout viewport | `innerWidth` **390** × `innerHeight` **699** CSS px, `devicePixelRatio` **3** (`<body>` box model 390 × 699 in `12-inspector-elements-390x699.png`) |
| WebGPU | `navigator.gpu` → **true** on real iOS 26 Safari |
| Host | macOS 26.6.2, Apple M4 |

## Capture method (what is real, and how)

1. **Launch** — `xcrun devicectl device process launch --device <id> --payload-url https://splat-walk.vercel.app/ com.apple.mobilesafari`.
   Succeeded this time because the phone was unlocked; the same command was denied
   (`FBSOpenApplicationServiceErrorDomain error 1 / RequestDenied`) in the earlier locked attempt.
2. **Pixels + input** — macOS **iPhone Mirroring**, screenshotted and driven through the OS-level
   `computer` facade. Clicks and click-drags into that window arrive on the phone as **real
   single-finger taps and drags**; no synthetic DOM events, no pointer shims, no test doubles.
   Mirror frames are 407 × 896 px (downscaled from the window's 632 × 1392 backing store).
3. **DOM / console / network** — macOS Safari **Web Inspector** attached over USB to the
   on-device page (`Develop ▸ Victor's iPhone ▸ Safari ▸ splat-walk.vercel.app`). Every value in
   the tables below was read from the live device page; the geometry numbers come from
   `getBoundingClientRect()` on the device, not from measuring screenshots.

Two capture routes were **unavailable**, which is why the above was used:

* `xcrun devicectl device screenshot` **does not exist** — this `devicectl` exposes only
  `copy | info | notification | orientation | process | reboot | sysdiagnose | install | uninstall`.
* `xcrun devicectl device orientation get/set` → `The capability "Device Orientation" is not
  supported by this device (com.apple.dt.CoreDeviceError error 1001)` on `iPhone13,3`.

## 1. Matrix

| # | Check | Result | Evidence | Notes |
|---|---|---|---|---|
| a | Loading state and progress bar | **PASS** | `02-loading-progress.png` | Card reads **"Loading the scan"** / **"Streaming the capture…"** / partially filled progress bar / **"Connecting to capture"**. Header shows title + subtitle but **no** discovery counter yet. |
| b | Reaches `ready`, lion visible, `0 / 3 found` | **PASS** | `01-ready-portrait.png`, `18-controls-hint-toggled.png`, `13-inspector-console-probe.png`, `15-inspector-state-after-reload.png` | `.scene-surface` `data-phase` = `ready`; header innerText = `Splat Walk \| / Cave lion \| A captured world, up close. \| 0 / 3 found \| Reset`. Lion renders with 3 hotspot rings. **No unsupported card and no retry card** — `navigator.gpu` is true, so the iOS-26 WebGPU path is the one that ran. |
| c | Portrait 390-class layout: HUD, dock, Controls hint, no overlaps | **PASS** | `12-inspector-elements-390x699.png`, `03-ready-controls-hint.png`, `18-controls-hint-toggled.png` | On-device rects in a 390 × 699 viewport: `HEADER.scene-header` @0,0 390×101 · `DIV.scan-hint` @12,102 366×60 (`P.touch-hint` @26,115 338×36) · `NAV.detail-nav` @12,595 366×51 · `FOOTER.scene-footer` @12,670 366×21. Bands are 0–101, 102–162, 595–646, 670–691 inside 699: **zero overlap, nothing clipped**. |
| c2 | Mobile Controls hint copy | **PASS** | `03-ready-controls-hint.png`, `18-controls-hint-toggled.png` | Touch-specific copy, not the desktop text: **"Drag left to move · Drag right to look"** / **"Move near a ring to reveal it · Tap to discover"**. Shown on load and re-shown by the dock `Controls` button. |
| d | Tap a hotspot ring → bottom sheet with Close; Close works; counter `1/3` | **PASS** | `04-detail-sheet-open.png`, `05-detail-closed.png` | Real tap on the brow ring opened the sheet **"Face to face"** with body copy and a focused **Close**; counter went `0 / 3` → **`1 / 3 found`** and the dock button became **`✓ Face to face`**. Sheet sits above the dock with no overlap. Real tap on **Close** dismissed it; counter and checkmark persisted. |
| e | Touch move (left-half drag) and look (right-half drag) change the view | **PASS** | `06-touch-move.png`, `07-touch-look.png` | Left-half upward drag moved the camera forward — the lion fills noticeably more of the frame. Right-half leftward drag yawed the view: the lion swung to the right edge and the sky-blue background came in. |
| f | Rotate to landscape → short-landscape layout, then rotate back | **NOT CAPTURED** | — | No available route: `devicectl` reports `Device Orientation` unsupported on `iPhone13,3`, iPhone Mirroring renders portrait only and has no rotate control, and nothing on macOS can physically turn the handset. The only remaining route is Settings ▸ Accessibility ▸ Touch ▸ AssistiveTouch ▸ Device ▸ Rotate Screen, i.e. changing an accessibility setting on Victor's personal phone; that was asked for and not authorised in this window. **No landscape claim is made.** |
| g | Reset returns to spawn | **PASS** | `08-after-reset.png` vs `01-ready-portrait.png` / `05-detail-closed.png` | Real tap on `Reset` restored the spawn framing pixel-for-pixel after the move+look excursion. |
| h | Background the app and return → still ready, not frozen | **PASS** | `09-resume-after-background.png`, `10-resume-still-live.png` | `⌘1` (Home) → 5 s on the Home screen → `⌘2` App Switcher → tap Safari: page still `ready`, spawn framing intact, counter still `1 / 3`. **Proved live rather than a stale frame**: a further right-half drag immediately moved the camera. It also survived a second, ~4-minute background trip through Settings and came back rendering. |
| i | Console errors in Web Inspector | **PASS — zero** | `14-inspector-console-clean-after-reload.png` | With the inspector attached, the device page was fully reloaded and left ~8 s: the console is **empty** — no Errors, no Warnings, no Logs. `performance.now()` = 20 263 ms at probe time with `phase: "ready"` and the counter reset to `0 / 3`, so the reload really happened (`15-inspector-state-after-reload.png`). |
| j (bonus) | SPZ request shape on the real device | **PASS — one body download** | `16-inspector-network-spz.png`, `17-inspector-network-spz-head.png`, `19-inspector-resource-timing-spz.png` | `/scenes/lion.v3.spz` appears twice in the Network tab: request 1 is `:method: HEAD` → `200`, 193 B transferred; request 2 carries the payload, 4.31 MB in 852 ms. Device resource timing agrees: `#0 init=fetch transfer=300 enc=0 dec=0 dur=31ms` and `#1 init=fetch transfer=4305881 enc=4305581 dec=4303196 dur=851ms`, `total_spz_entries=2`. So on `0ccea82` iOS Safari downloads the **body exactly once**; the extra request is a zero-body HEAD size probe. |

## 2. Findings

| id | Severity | Finding |
|---|---|---|
| P1 | Info (product question, not a bug) | `Reset` restores the spawn pose but **does not clear discoveries**: after finding "Face to face" the counter stayed `1 / 3 found` and the dock kept `✓ Face to face` across a Reset (`08-after-reset.png`). That is defensible ("Reset" = reset the camera), but the button is unqualified, so decide whether it should also reset progress or be labelled `Reset view`. |
| — | None | No defect was found on the real device in: load/progress copy, the WebGPU path, portrait layout and spacing, hotspot tap → sheet → Close, the discovery counter, touch move, touch look, Reset, or backgrounding and resuming. Zero console messages across a full load. |

Finding **F3** from `device-qa.md` (a no-WebGPU-adapter device lands on the retry copy) is **not
reachable on this hardware** — real iOS 26 Safari has `navigator.gpu`, so the phone takes the
normal WebGPU path. F3 remains simulator-only.

## 3. Harness caveats (not app behaviour)

* **C4 — iPhone Mirroring only accepts input while it is the active application.** With Safari
  frontmost, `delivery: "foreground"` clicks into the mirror were silently dropped (a Settings
  toggle did not flip, `00-device-web-inspector-enabled.png` needed a retry). Activating the app
  first (`open -a "iPhone Mirroring"`) makes ordinary background clicks land. Every interaction
  result above was taken with the mirror active.
* **C5 — mirrored iOS system lists do not scroll from synthetic input.** Neither wheel scroll nor
  click-drag scrolled Settings; the Safari ▸ Advanced pane had to be reached with
  `--payload-url "prefs:root=SAFARI&path=ADVANCED"`. In-page WebKit drags worked fine, which is why
  checks (e) are valid.
* **C6 — Web Inspector console typing mangles arrow functions.** Typed `e=>{` arrived as `e={`
  (one SyntaxError visible in `13-inspector-console-probe.png`). All later probes were put on the
  clipboard and pasted, and were `function(){}`-only.
* **C7 — two Safari windows split key focus.** With both the page window and the inspector open,
  window-scoped keystrokes fail with `BackgroundUnavailable`; the working pattern is
  `open -a Safari` then desktop-level `computer.press`.

## 4. Settings touched, and restored

Both were **off** before this lane and were turned **off again** afterwards:

* macOS Safari ▸ Settings ▸ Advanced ▸ **Show features for web developers** (needed for the
  Develop menu).
* iPhone ▸ Settings ▸ Apps ▸ Safari ▸ Advanced ▸ **Web Inspector**
  (`00-device-web-inspector-enabled.png`).

Nothing else on the phone was changed. No credentials, accounts, or personal data were read.

## 5. Files

```
design/reference/2026-09-11-final-hardening-qa/iphone-12-pro/
  iphone-qa.md                              this report
  00-device-web-inspector-enabled.png       iPhone Settings ▸ Safari ▸ Advanced ▸ Web Inspector on
  01-ready-portrait.png                     ready, lion + 3 rings, HUD "0 / 3 found", dock
  02-loading-progress.png                   "Loading the scan" / "Streaming the capture…" + progress bar
  03-ready-controls-hint.png                touch Controls hint on load
  04-detail-sheet-open.png                  ring tap → "Face to face" sheet, Close focused, 1 / 3
  05-detail-closed.png                      after Close: sheet gone, 1 / 3 kept, ✓ on the dock
  06-touch-move.png                         after a real left-half drag: camera moved forward
  07-touch-look.png                         after a real right-half drag: view yawed
  08-after-reset.png                        Reset restored the spawn framing
  09-resume-after-background.png            back from Home + App Switcher: still ready
  10-resume-still-live.png                  a drag after resume still moves the camera (not frozen)
  11-develop-menu-device.png                Develop ▸ Victor's iPhone (iOS 26.6.1) ▸ splat-walk
  12-inspector-elements-390x699.png         device <body> box model 390 × 699
  13-inspector-console-probe.png            viewport / dpr / navigator.gpu / phase / HUD / UA
  14-inspector-console-clean-after-reload.png  empty console after a full device reload
  15-inspector-state-after-reload.png       phase ready, counter back to 0 / 3, performance.now()
  16-inspector-network-spz.png              Network tab: HEAD 193 B + 4.31 MB payload
  17-inspector-network-spz-head.png         request 1 headers: :method HEAD, status 200
  19-inspector-resource-timing-spz.png      device resource timing: enc=0 probe + 4 305 581 B body
```

(`18-controls-hint-toggled.png` — dock `Controls` re-shows the touch hint after a reload, counter `0 / 3`.)
