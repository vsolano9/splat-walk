# Final closeout

Date: 2026-09-27

## Completion

Splat Walk is complete for the accepted showcase scope. There are no known release blockers, active implementation items or open pull requests at the start of this closeout.

The released product includes the native three.js WebGPU splat viewer, the subject-centered cave-lion object camera and guided details, preserved environment/free-flight mode, custom SPZ file/drop/link loading, automatic custom-capture framing, recovery handling, responsive HUD behavior, and the custom-scan hardening covered by PR #9.

Final closeout: [PR #11](https://github.com/vsolano9/splat-walk/pull/11). Its release comment records the final documentation-only merge and Vercel deployment identity.

## Verification carried forward

No runtime source changed during this final closeout, so the already-completed release gates were not rerun merely to accumulate confidence.

- PR #9 implementation commit `c9dcdeca1a694de9cd6561dbd001faa11e1f24e0` passed TypeScript, ESLint and the production build.
- Its 14 native-WebGPU Chrome regressions passed locally and again against production.
- Production source-switch, malformed-link, error-recovery and long-filename screens were visually inspected.
- PR #10 records iPhone/iPad Safari Simulator fallback-shell coverage. Apple Simulator cannot provide the WebGPU feature level required to qualify the rendered splat experience.

See `custom-scan-hardening-2026-09-27.md` and `safari-simulator-2026-09-27.md` for exact environments, limits and evidence.

## Repository cleanup

Completed remote development branches were removed after preservation checks:

- `feat/showcase-phase-2` — PR #1 head tree equals its merged tree; GitHub pull ref preserved.
- `feat/showcase-phase-3` — PR #2 head tree equals its merged tree; GitHub pull ref preserved.
- `docs/object-camera-direction-2026-09-15` — PR #5 head tree equals its merged tree; GitHub pull ref preserved.
- `fix/fit-narrow-fov` — PR #8 head is an ancestor of main; GitHub pull ref preserved.

After cleanup, `main` is the only normal remote development branch.

Two previously untracked historical packages were moved out of the repository rather than deleted:

- old local handoffs → `Work/_local/evidence/splat-walk/archive/repo-untracked-handoffs-20260927/`;
- 2026-09-11 chat package → `Work/_local/evidence/splat-walk/archive/2026-09-11-chatgpt-chat/`.

They remain available as local evidence without keeping the Git worktree dirty or presenting stale handoffs as current truth.

## Non-blocking limits

- Current hardware Safari/WebGPU and real-touch behavior are not qualified; Apple Simulator cannot substitute for hardware WebGPU.
- Android hardware is not qualified.
- Arbitrary custom scans intentionally use object mode only. Environment-mode selection for them, panning, idle orbit, collision, LOD/streaming, multiplayer, auth and CMS are outside the accepted showcase scope.

These are coverage boundaries or explicit non-goals, not unfinished release work. Reopen Splat Walk only for a concrete defect, an intentional new feature, or a requested hardware-coverage pass.
