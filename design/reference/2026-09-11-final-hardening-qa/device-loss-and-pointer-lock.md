# WebGPU device-loss recovery — local verification

Date: 2026-09-11. Branch `fix/spz-single-fetch`, local production build
(`npm run build` + `npm start`, http://localhost:3000).
Browser: Chrome for Testing 152.0.7977.75, headed 1440x900 window, throwaway profile,
`--enable-unsafe-webgpu`, driven over raw CDP on 127.0.0.1:9333.
This is a native WebGPU renderer, so WebGL context-loss emulation does not apply; both
checks below destroy the real GPU device the renderer is using.

The test harness wraps `GPUAdapter.prototype.requestDevice` from
`Page.addScriptToEvaluateOnNewDocument` to keep a reference to the exact `GPUDevice` the app
obtained, and records how its `lost` promise resolves. No application code is stubbed.

## 1. Pre-fix behaviour (the residual)

`window.__qaDevice.destroy()` on the device the renderer uses:

```
{"step":"ready before loss","phase":"ready","deviceCaptured":true,"hud":"0 / 3 found"}
{"step":"4s after device.destroy()","phase":"ready","lost":{"reason":"destroyed","message":"Device was destroyed."},"message":null,"retryButton":null}
{"shot":"device-loss-a-destroy.png 1481KB"}
```

The device really was lost (`reason: "destroyed"`) but the app stayed in `phase="ready"` with a
frozen canvas and no message or retry. Cause: `WebGPUBackend` subscribes to `device.lost` and
returns early when `info.reason === 'destroyed'` (three r186,
`src/renderers/webgpu/WebGPUBackend.js:266-279`), so `renderer.onDeviceLost` — the only hook the
app had — never fired. Screenshot: `device-loss-a-destroy.png` (HUD still live, canvas frozen).

## 2. Fix

`components/SplatScene.tsx` now reports every loss the app did not cause, once, from a single
`reportDeviceLoss()` used by both `renderer.onDeviceLost` and a direct subscription to the
backend device's own `lost` promise. A new effect-local `disposed` flag, set by `release()`,
keeps our own teardown (unmount, retry, and the error path that disposes the renderer) from
being reported as a GPU fault.

## 3. Post-fix: explicit `device.destroy()`

```
{"step":"ready before loss","phase":"ready","deviceCaptured":true}
{"step":"after device.destroy()","phase":"error","lost":{"reason":"destroyed","message":"Device was destroyed."},"heading":"Let's try that again","message":"The GPU connection was interrupted. Reload the capture to continue.","retryButton":"Reload capture"}
{"shot":"device-loss-destroy-lost-state.png 1075KB"}
{"step":"after Reload capture","phase":"ready","hud":"0 / 3 found","canvasCount":1,"sceneVisible":true,"newDeviceLost":null}
{"shot":"device-loss-destroy-recovered.png 1480KB"}
{"consoleMessages":[]}
```

- Lost state: heading "Let's try that again", message "The GPU connection was interrupted.
  Reload the capture to continue.", button "Reload capture" — `device-loss-destroy-lost-state.png`.
- "Reload capture" returned to `phase="ready"`, `0 / 3 found`, exactly 1 canvas in the host
  (no leaked canvas from the dead renderer), scene faded in — `device-loss-destroy-recovered.png`.
- Console/log/page-error messages across loss and recovery: 0.

## 4. Post-fix: real GPU process crash (`Browser.crashGpuProcess`)

This is the faithful production case: the GPU process dies under the page and the device is lost
with `reason: "unknown"`, which three does forward to `renderer.onDeviceLost`.

```
{"step":"ready before crash","phase":"ready","deviceCaptured":true}
{"step":"after Browser.crashGpuProcess","phase":"error","lost":{"reason":"unknown","message":"A valid external Instance reference no longer exists."},"heading":"Let's try that again","message":"The GPU connection was interrupted. Reload the capture to continue.","retryButton":"Reload capture"}
{"shot":"device-loss-gpu-crash-lost-state.png 474KB"}
{"step":"after Reload capture","phase":"ready","hud":"0 / 3 found","canvasCount":1,"sceneVisible":true,"message":null}
{"shot":"device-loss-gpu-crash-recovered.png 1480KB"}
{"consoleMessages":["log.warning: A valid external Instance reference no longer exists."]}
```

- Lost state reached the same error card — `device-loss-gpu-crash-lost-state.png`.
- "Reload capture" recovered to `phase="ready"`, `0 / 3 found`, 1 canvas, scene visible —
  `device-loss-gpu-crash-recovered.png`.
- The only message logged was a browser-emitted `warning` ("A valid external Instance reference
  no longer exists."), not an application console error.
- Both loss paths are idempotent: `reportedLoss` means the double subscription cannot double-report.

## 5. Regression guard: the failure path must keep its own message

`release()` disposes the renderer on the load-failure path, which destroys the device. Without
the `disposed` flag the new device-loss reporting would overwrite the real error message. Forced
the SPZ to HTTP 500 with `Fetch.fulfillRequest`:

```
{"step":"SPZ forced to HTTP 500","phase":"error","heading":"Let's try that again","message":"The scan could not load (HTTP 500). Check SPZ_URL and try again."}
{"step":"5s later (device disposed by the failure path)","message":"The scan could not load (HTTP 500). Check SPZ_URL and try again.","lost":{"reason":"destroyed","message":"Device was destroyed."}}
{"shot":"regression-spz-http-500-message.png 472KB"}
{"step":"retry after failure removed","phase":"ready","hud":"0 / 3 found","canvasCount":1}
```

The device was indeed destroyed by that path (`lost.reason: "destroyed"`) and the message stayed
"The scan could not load (HTTP 500). Check SPZ_URL and try again." for the whole wait —
`regression-spz-http-500-message.png`. Removing the induced failure and pressing "Reload capture"
returned to `ready` with 1 canvas.

## 6. Real pointer lock (bonus: closes the stubbed check from the previous phase)

The previous phase could only prove the pointer-lock branch by overriding
`document.pointerLockElement`. In this headed Chrome, pointer lock is granted for real once the
window is the active OS window (`osascript … activate`, then `Page.bringToFront`):

```
{"step":"locked","pointerLockElement":"CANVAS","crosshair":true}
{"step":"after 4 relative moves","pointerLockElement":"CANVAS"}
{"step":"after Escape","pointerLockElement":"CANVAS","crosshair":true,"detailOpen":false,"phase":"ready"}
```

- Clicking `Explore` with the window activated produced `document.pointerLockElement === CANVAS`,
  the crosshair rendered, and no "Mouse capture was unavailable" text —
  `after-fix-pointer-lock-real.png`. Relative mouse motion under the lock kept it held.
- Without OS activation the same click is refused by Chrome and the app degrades exactly as
  designed, showing "Mouse capture was unavailable. Drag to look, or try Explore again." —
  `after-fix-pointer-lock.png`.
- Still not reachable from automation: Escape-to-release is handled by the browser itself, and a
  CDP-synthesised Escape does not trigger it (the lock stayed held). The app never calls
  `exitPointerLock()` for Escape, so that part remains browser behaviour rather than app code.
  The lock also drops whenever the window loses OS focus between automation steps.
