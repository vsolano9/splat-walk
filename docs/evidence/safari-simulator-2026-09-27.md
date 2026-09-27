# Safari simulator qualification

Date: 2026-09-27

## Scope

This pass used Apple Simulator instead of a physical iPhone, per Victor's direction, against the public production site at `https://splat-walk.vercel.app`.

Production source under test: `e597b64ee36a2cfb37b9a62694555a5f94e516b3` (PR #9 merge).

Host and simulator:

- macOS 26.6.2
- Xcode 26.6
- SafariDriver included with Safari 26.6.2
- iPhone 17 Pro Simulator, iOS 26.5, Safari 26.5
- iPhone viewport: 402×714 CSS px at DPR 3
- iPad Pro 11-inch (M5) Simulator, iOS 26.5, Safari 26.5
- iPad viewport: 834×1124 CSS px at DPR 2

## Result

Apple Simulator cannot qualify Splat Walk's rendered WebGPU experience.

On both iPhone and iPad simulators, `navigator.gpu` exists but `navigator.gpu.requestAdapter()` returned `null` for the default, low-power and high-performance requests. Splat Walk therefore correctly entered its `unavailable` phase and displayed the **WebGPU unavailable** recovery card instead of creating a canvas.

This matches WebKit's documented platform limitation: WebGPU does not support Simulator on Apple platforms because WebGPU requires Apple GPU family 4 or newer while Simulator exposes Apple GPU family 2 capabilities. Apple also documents that Simulator GPU capabilities differ from physical hardware and can support fewer features.

References:

- https://bugs.webkit.org/show_bug.cgi?id=296931
- https://developer.apple.com/documentation/metal/developing-metal-apps-that-run-in-simulator
- https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios

## What the simulator did verify

### iPhone Safari shell

- production page loaded normally with title `Splat Walk | A captured world, up close`;
- `navigator.gpu === true`, but no usable adapter was available;
- the app showed the intended **WebGPU unavailable** state rather than a framework/browser failure;
- the unavailable-state page had no horizontal overflow at 402 CSS px (`documentElement.scrollWidth === 402`);
- the recovery button remained present after retry;
- a malformed linked filename such as `%GG.spz` remained literal and did not crash URI decoding;
- a deliberately long unbroken linked filename remained inside the 402-pixel document width; the full filename remained in DOM text while the visual title was constrained;
- `navigator.maxTouchPoints === 5` and the coarse-pointer media query matched.

### iPad Safari shell

- the same production page loaded at 834×1124 CSS px, DPR 2;
- `navigator.gpu === true`, but default/low-power/high-performance adapter requests all returned `null`;
- the app showed **WebGPU unavailable** with no horizontal overflow (`documentElement.scrollWidth === 834`);
- `navigator.maxTouchPoints === 5` and the coarse-pointer media query matched.

## Explicit limits

This simulator pass cannot verify:

- Gaussian-splat rendering;
- object-camera orbit;
- pinch zoom;
- hotspot selection/tour;
- local-file custom-scan parsing in the ready state;
- source switching while a rendered detail is open;
- WebGPU performance, GPU-loss behavior or visual fidelity;
- real iPhone/iPad GPU behavior.

The iOS Simulator WebDriver orientation endpoint returned 404 in this setup, so this pass does not add a native Safari landscape result. The existing Chromium 844×390 regression remains the current automated short-landscape evidence.

Therefore the simulator closes only Safari **fallback-shell compatibility** coverage. It does not replace hardware WebGPU qualification.

## Verdict

PASS for the Safari Simulator fallback/error shell.

NOT QUALIFIED for the rendered Splat Walk experience because Apple Simulator does not provide the WebGPU feature level the app requires. This is a simulator platform limitation, not a defect found in Splat Walk.
