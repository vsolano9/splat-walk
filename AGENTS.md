# Splat Walk

Updated: 2026-11-10

## Purpose and status

Public browser showcase for real Gaussian-splat captures using native three.js r186 WebGPU `GaussianSplat`/`SPZLoader`, Next.js and Tailwind. `D:/Work/PROJECTS.md` records 100%, complete for the accepted showcase; the final ledger closes known implementation/release blockers while retaining nonblocking hardware limits. The November 8 portfolio decision gives accepted studies a maintenance boundary, without automatic scope expansion.

## Where things are

- `app/page.tsx`, `layout.tsx`, `globals.css`: page, metadata and museum HUD styling; `components/SplatScene.tsx`: GPU lifecycle, source loading, camera and accessible UI integration.
- `lib/object-controls.ts`: orbit/dolly camera; `lib/controls.ts`: preserved environment/free-flight controller; `lib/scene.config.ts`: mode, framing and hotspots; `lib/scan-source.ts`: file/URL sources and framing.
- `public/scenes/lion.v3.spz`: bundled capture; `public/og.png`, `icon.svg`, `app/apple-icon.png`: share/icons.
- `tests/`, `playwright.config.ts`: native-WebGPU browser checks. `.next/`: generated build; `design/reference/`, `docs/evidence/`, local `_receipts/`: dated acceptance evidence.
- Public deployment: `https://splat-walk.vercel.app`; source: `vsolano9/splat-walk`.

## Commands

Run from this root with Node 22+ and npm.

```powershell
npm ci
npm run dev
npm run typecheck
npm run lint
heavy run -- npm run build
npm start
npm run test:e2e
```

README's aggregate `npm run check` runs typecheck, lint and build. Use the separate commands above to reserve the heavy slot for compilation. Browser regressions run AFTER the production build, outside that slot; they start/stop their own server at `127.0.0.1:3107` and require installed Google Chrome with a usable native WebGPU adapter. `SPLAT_WALK_BASE_URL` selects an existing deployment; `SPLAT_WALK_TEST_OUTPUT` selects retained evidence. Vercel uses the root Next.js preset and `npm run build`; no app credentials are required.

## Guardrails

- Preserve native splat rendering/raycasting and source-resource cleanup. No proxy mesh or substitute renderer; no backend/auth/uploads. Opened local files remain in the browser.
- Lion uses subject-centered object mode; custom scans hide lion-specific annotations. Keep explicit environment mode/free-flight behavior and distinguish unsupported WebGPU, no adapter, load failure and GPU-loss recovery.
- MIT covers application code; the lion asset is separately CC BY 4.0. Preserve Renaud/Joanna Kobierska attribution and its unchanged-source qualification.
- Do not enable unsafe/software GPU flags to obtain a pass. Simulator fallback-shell evidence does not prove rendering, pinch or orbit on physical Safari/touch hardware.
- Keep private `_receipts` and workspace handoff records out of this public repo. Generated Next output is not hand-edited source.

## Current state

As of 2026-11-10, HEAD `b94defe` aligns the Next ESLint plugin with Next 16.4.2 and adds the changelog; `b40f747` records the October dependency security update. Accepted September scope includes orbit/tour, custom SPZ files/drop/links, automatic framing, narrow layouts and error recovery. Fourteen custom-source browser regressions passed for the recorded September candidate locally and on production, not freshly on today's tree.

Hardware Safari/current object-camera touch and Android remain nonblocking coverage limits. Apple Simulator exposed WebGPU but no usable adapter. Next work is a concrete maintenance defect or deliberate coverage request. The changelog's remaining lint-only `braces` advisory is a dated finding; recheck it when changing dependencies.

## Docs

- `README.md`: controls, commands, scan integration, lifecycle and license attribution.
- `docs/STATUS.md`: accepted scope and current coverage limits; `docs/QA-ACCEPTANCE.md`: release/browser matrix.
- `docs/evidence/final-closeout-2026-09-27.md`: bounded final acceptance and deployment-evidence pointers.
- `docs/DECISIONS.md`: technical choices; `CHANGELOG.md`: later dependency/security maintenance.
