# Decision log

This file records accepted decisions for the next Splat Walk iteration. Add a new entry when a material decision changes. Do not silently rewrite old entries without noting the superseding decision.

## D-001 — Cave lion uses object mode

**Status:** accepted 2026-09-15

The cave-lion sample is an isolated hero asset and should use subject-centered object inspection as its default interaction model.

Reason: the current free-flight camera lets the subject leave the composition and makes the experience feel like a spectator/FPS camera rather than an exhibit.

Consequence: ordinary desktop/mobile interaction becomes orbit + zoom around an authored target.

## D-002 — Preserve free flight as environment mode

**Status:** accepted 2026-09-15

Do not delete the current fly controls. They remain appropriate for room-scale/environment captures.

Reason: Splat Walk should support both object inspection and walkthrough use cases without forcing one control model onto both.

Consequence: scene configuration gains an explicit `object | environment` mode.

## D-003 — Separate concrete controllers

**Status:** accepted 2026-09-15

Prefer a dedicated `createObjectControls` implementation alongside the existing `createFlyControls` rather than one large controller with mode conditionals.

Reason: the two interaction models have different invariants and input semantics. A small shared interface is sufficient.

Consequence: no generalized controls framework is required.

## D-004 — Object mode does not use pointer lock

**Status:** accepted 2026-09-15

Object mode should not require pointer lock or a center crosshair.

Reason: drag-to-orbit is the familiar convention and preserves cursor/UI interaction.

Consequence: pointer lock remains environment-only unless a future decision provides a strong reason otherwise.

## D-005 — User zoom changes camera radius, not primarily FOV

**Status:** accepted 2026-09-15

Wheel/trackpad/pinch input should dolly the camera by changing radius around the subject target.

Reason: it preserves object-viewer spatial behavior and avoids the visual character of lens/FOV zoom.

Consequence: FOV remains available for projection/aspect framing but is not the main user zoom state.

## D-006 — Hotspots own authored presentation poses

**Status:** accepted 2026-09-15

A hotspot may define an authored camera pose in addition to its spatial picking position.

Reason: the point used to identify a feature is not necessarily the correct camera target/angle/distance for presenting it.

Consequence: selecting a hotspot can move the camera to a verified composition while preserving native splat picking.

## D-007 — Direct input can interrupt camera transitions

**Status:** accepted 2026-09-15

Reset/hotspot focus motion must not lock the user out. Orbit/zoom input should take control immediately.

Reason: the viewer should feel directly manipulable, not like a blocking cinematic.

## D-008 — Keep the current exhibition visual language

**Status:** accepted 2026-09-15

The dark museum HUD, typography, translucent panels, and overall aesthetic remain the base design.

Reason: the main deficiency is camera/interaction, not visual identity.

Consequence: UI work should simplify/recompose rather than broadly redesign.

## D-009 — Preserve proven renderer/recovery systems

**Status:** accepted 2026-09-15

Camera work must not trigger an opportunistic rewrite of loading, SPZ parsing, WebGPU initialization, device-loss recovery, native raycasting, or resource cleanup.

Reason: these systems already have concrete QA evidence and carry higher regression risk than the requested interaction improvement.

## D-010 — Reduced motion removes nonessential camera animation

**Status:** accepted 2026-09-15

Direct camera control remains available, but authored settling, long reset/focus tweens, idle orbit, and decorative motion are skipped or made near-immediate under reduced motion.

## D-011 — Idle orbit is optional polish, not a core requirement

**Status:** accepted 2026-09-15

Do not implement idle orbit until direct orbit/zoom and hotspot focus are visually correct.

Reason: automatic movement can mask bad interaction tuning and creates additional motion/accessibility complexity.

## D-012 — Pan is secondary

**Status:** accepted 2026-09-15

Ship object orbit + zoom before adding pan. Add pan only if real inspection use demonstrates a need.

Reason: pan creates another path for losing the subject and complicates touch gestures.

## D-013 — Detail UI should recompose around the subject

**Status:** accepted 2026-09-15

When detail UI occupies screen space, the camera/framing should keep the selected feature visible in the remaining viewport.

Reason: UI must not hide the feature it is explaining.

## D-014 — Discovery remains session-only

**Status:** accepted 2026-09-15

Keep the existing behavior: reset/home preserves discoveries, refresh starts a new session.

Reason: persistence is unrelated to the camera iteration and would require product/backend decisions outside scope.

## D-015 — Historical QA remains immutable evidence

**Status:** accepted 2026-09-15

Existing `design/reference/2026-09-11-*` records remain attached to the builds they tested.

Reason: old evidence cannot validate a newer camera implementation.

Consequence: new work gets a new dated evidence directory and exact candidate SHA.
