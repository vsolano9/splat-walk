# Custom-scan hardening qualification

Date: 2026-09-27

## Source and scope

- Review baseline: `3ef6873213fbc9b9d0e5ff24594639c43aa4b5b3`, previously live on production.
- Exact tested implementation and browser-test commit: `c9dcdeca1a694de9cd6561dbd001faa11e1f24e0`.
- Release: [PR #9](https://github.com/vsolano9/splat-walk/pull/9). Documentation-only commits after the tested implementation do not change its code, dependency or test files.
- Findings closed: **3/3** in this bounded hardening scope. No universal project/device completion percentage is inferred.

The production audit reproduced an undefined-hotspot page crash when opening/dropping a scan from an open lion detail; a URI decoding page crash from a malformed filename; and clipped mobile controls when the filename consumed the header width.

The fixes reset source-dependent UI atomically with source selection, guard hotspot consumers, keep undecodable display filenames literal, and constrain filename layout while retaining full DOM text. No authored camera poses, controllers, renderer implementation, sample asset or runtime dependency versions changed.

## Local verification

Environment: Windows PC, Node 24.12.0, installed Google Chrome 154.0.8037.58, Playwright 1.63.0. Browser plugin was not available; regular Playwright ran headed Chrome with native WebGPU and no unsafe flags. The production server ran at `http://127.0.0.1:3107`.

| Check | Result |
|---|---|
| TypeScript, ESLint and production build (`npm run check`) | PASS |
| Browser regressions (`npm run test:e2e`) | 14/14 PASS, 51.5 seconds, one worker, zero retries |
| Native file chooser from each of three selected details | PASS |
| Browser-dispatched drops from open/focused details and rapid replacement | PASS |
| Invalid-file retry and return to fresh lion/tour state | PASS |
| Malformed percent/UTF-8 names and valid Unicode/percent names | PASS |
| Header/footer/control bounds and clicks at four viewport sizes | PASS |
| Uncaught page errors and unexpected console errors/warnings | None |

Viewport matrix: 1440×900, 390×844, 320×568 and 844×390. Layout tests use both a realistic export filename and an unbroken 214-character filename. URL error tests intentionally fulfill the scan request with HTTP 404; their expected browser network messages are not hidden as application failures. Rendering and local-file parsing use the actual WebGPU and SPZ implementations.

## Visual inspection and retained evidence

Desktop custom scan, 320-pixel portrait, 844×390 landscape, selected-detail source switching, malformed-link recovery, and the bundled 320-pixel overview were opened and visually inspected. The capture remains visible; Overview/Open scan, return/navigation and Source stay within the viewport. Malformed links show the ordinary retry/return card rather than the framework failure screen.

Runs were captured under the system-temp `splat-walk-hardening-20260927` directory. Logs and screenshots are retained outside the repository under Work-relative `_local/evidence/splat-walk/2026-09-27/custom-scan-hardening/` at closeout; no browser profiles, generated build output or copied assets belong in Git. The committed test suite reproduces the checks.

Selected local screenshot SHA-256 values:

- 320-pixel long filename: `fe4bdafdc7a1f176b079fcdc4b48c4f141e4ab326b10c461dbb9bbf38f024175`
- Selected-detail switch: `4fe61a36b8b7293f0bea51595fe53dbfa96e68f420ede7ccc1c5939e98fae034`
- Malformed-link recovery: `74c054d449b166e0c721824d55ae1acb6488c9953c64753bd217ec4ef43af7f7`

## Release verification

Local acceptance above is not a claim that production was already updated. The PR #9 release comment is the durable post-merge record: exact merge SHA, Vercel READY deployment and public alias, public-site browser regression result, visual check, and cleanup. Check that record before treating the changes as shipped.

## Coverage limits

Touch viewports are desktop emulation. This run does not qualify physical phone gestures, Safari, Android/tablets or physical OS file dragging. Historical GPU-loss, environment-mode, orbit/zoom tuning and device records remain tied to their original runs; those unaffected matrices were not relabelled as rerun. Optional environment controls for custom scans, panning and idle orbit remain outside this change.
