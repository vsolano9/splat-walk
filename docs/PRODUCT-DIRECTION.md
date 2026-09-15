# Product direction

## Purpose

Splat Walk is an interactive WebGPU Gaussian-splat exhibit. Its value is not merely that it renders a capture; the experience should make a captured subject feel tangible, understandable, and worth exploring.

The current cave-lion demo already proves the renderer, loading/recovery behavior, input plumbing, responsive HUD, hotspot discovery, and real-device viability. The next iteration should focus on interaction quality rather than rebuilding those solved systems.

## Current problem

The shipped camera is a generic free-flight controller. That model works for rooms and large environments, but it is a poor default for a single hero object:

- looking sideways rotates away from the subject instead of moving around it;
- forward/sideways movement can destroy the intended composition;
- pointer lock and a center crosshair make the experience feel like an FPS/spectator camera;
- mobile split-screen move/look gestures are appropriate for navigation, not object inspection;
- hotspots explain details but do not guide the camera to those details;
- a user can easily leave the lion at the edge of the viewport or lose it completely.

The next version should feel closer to a polished museum/object viewer than a technical rendering demo.

## Product model

Splat Walk supports two scene interaction modes:

### `object`

For isolated subjects, sculptures, products, artifacts, heads/busts, small scenes, and similar captures.

Default behavior:

- the camera orbits a subject target;
- the subject remains the visual anchor;
- wheel/pinch controls distance;
- hotspot selection can animate to authored camera compositions;
- no pointer lock or center crosshair is required;
- movement is damped and constrained;
- the UI can recompose the subject around open detail panels.

The cave lion uses `object` mode.

### `environment`

For rooms, buildings, streets, large scans, and walkthroughs.

Default behavior:

- retain the existing free-flight controller initially;
- WASD + QE, mouse look, touch move/look, pointer lock, and reset remain valid;
- future walking/collision/gravity work can be added independently if a scene needs it.

Do not force one control model to serve both use cases.

## Experience principles

### 1. The capture is the interface

UI should support the scan, not dominate it. The lion should occupy the user’s attention before the HUD does.

### 2. Preserve orientation

A user should always understand where the subject is and how to return to the overview. Normal orbit/zoom interaction must not allow accidental loss of the object.

### 3. Motion should feel intentional

Use damping for direct manipulation and authored easing for focus transitions. Avoid both twitchy raw input and floaty cinematic inertia.

### 4. Details should be spatial

A hotspot is not just a modal trigger. Selecting a detail should move or recompose the camera so the described feature is clearly visible.

### 5. The demo should teach itself

Object-mode controls should follow familiar conventions:

- drag to orbit;
- wheel/trackpad or pinch to zoom;
- optional modified/two-finger pan;
- reset/home returns to the authored overview.

Avoid instructions that are only necessary because the controls are unusual.

### 6. Keep the proven technical foundation

Do not rewrite the renderer, loader, device-loss recovery, streamed progress, hotspot raycasting, or accessibility plumbing merely to implement the new camera.

## Target user journey

1. Page loads and streams the capture.
2. The lion resolves into the authored overview composition.
3. A short, subtle settling motion introduces depth if reduced motion is not requested.
4. Minimal instruction appears: `Drag to inspect · Scroll to zoom` or the touch equivalent.
5. User orbits and zooms while the lion remains centered/comfortably framed.
6. User hovers/targets a hotspot and sees a spatial label.
7. User selects it.
8. Camera smoothly focuses the relevant feature while the detail panel opens without covering it.
9. User moves between details using spatial markers or Previous/Next.
10. At `3 / 3`, the interface acknowledges completion and offers `Explore freely` and `Replay tour`/`Overview` without blocking the scene.

## Visual direction

Keep the existing dark exhibition aesthetic. The next iteration should be a refinement, not a redesign.

Preferred changes:

- remove object-mode pointer-lock affordances and crosshair;
- simplify the controls hint;
- fade nonessential HUD while actively orbiting, then restore it at rest;
- keep markers visually attached to the subject and labels close to their projected marker;
- recompose the subject when a detail card opens rather than placing a panel on top of the important feature;
- preserve current typography, palette, translucent surfaces, and loading/error visual language unless a concrete usability issue requires change.

## Non-goals for this iteration

- replacing the Gaussian-splat renderer;
- changing the sample asset;
- adding a backend, auth, accounts, CMS, multiplayer, or persistence;
- adding physics, gravity, or collision to object mode;
- building generalized editor tooling;
- large-scene LOD/streaming work;
- broad UI rebranding;
- adding dependencies when the behavior is small enough to implement cleanly in the existing codebase.

## Definition of success

The iteration is successful when a first-time user can inspect the lion naturally without thinking about camera controls, cannot accidentally lose the subject during ordinary interaction, can move through all three details with the camera helping rather than fighting them, and still has access to the proven free-flight model for environment-scale scenes.
