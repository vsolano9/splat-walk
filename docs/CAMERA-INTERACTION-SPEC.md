# Camera and interaction specification

Status: accepted direction for the next Splat Walk iteration. This document describes target behavior, not the currently shipped free-flight-only implementation.

## 1. Scene mode

Add an explicit scene interaction mode rather than inferring behavior from asset scale.

```ts
export type SceneMode = "object" | "environment";
```

The cave-lion sample is `object` mode.

`environment` mode keeps the current fly controller unless a later decision replaces it. Existing environment behavior must not be silently changed while implementing object mode.

## 2. Object-camera model

Object mode is an orbit/dolly camera around an authored subject target.

Canonical state:

```ts
type ObjectCameraState = {
  target: THREE.Vector3;
  yaw: number;
  pitch: number;
  radius: number;
};
```

Maintain separate target/current values for damped interaction:

```ts
type DampedObjectCameraState = {
  current: ObjectCameraState;
  desired: ObjectCameraState;
};
```

Each frame:

1. damp current yaw, pitch, radius, and target toward desired values;
2. derive camera position from spherical coordinates around `current.target`;
3. set a stable world-up vector;
4. point the camera at `current.target`;
5. render.

Do not accumulate arbitrary camera quaternion changes in object mode. The subject target is the invariant.

## 3. Authored overview

The current lion values provide the starting reference:

- current spawn: `[0, 0.42, 1.2]`;
- current look target: `[-0.025, 0.16, 0.05]`.

The implementation should convert these into authored object-camera parameters rather than preserving them as a free camera pose.

A scene profile should provide at minimum:

```ts
type ObjectCameraProfile = {
  target: [number, number, number];
  radius: number;
  yaw: number;
  pitch: number;
  minRadius: number;
  maxRadius: number;
  minPitch: number;
  maxPitch: number;
};
```

Use real fitted values from the lion in-browser. Do not guess final constraints from this document if visual verification shows a better range.

## 4. Desktop controls

### Primary mapping

- Left mouse drag: orbit around the target.
- Trackpad/mouse wheel: dolly/zoom by changing orbit radius.
- Reset/Home button: return to the authored overview.
- Optional Shift + drag: pan the target in camera-relative screen space.
- Optional double-click/tap on the scan: focus the picked surface point if this can be made reliable without complicating hotspot picking.

### Object-mode exclusions

- No pointer lock for ordinary object inspection.
- No center crosshair.
- No WASD/QE requirement.
- No raw free-look quaternion control.

Keyboard accessibility can expose equivalent orbit/zoom actions, but keyboard shortcuts must not become necessary to use the viewer.

## 5. Touch controls

### Primary mapping

- One-finger drag: orbit.
- Pinch: zoom/dolly by changing radius.
- Two-finger translation: optional target pan if it can be implemented without gesture ambiguity.
- Double tap: optional focus if reliable.
- Reset/Home button: authored overview.

Remove the current left-half move / right-half look split from object mode. Preserve it in `environment` mode.

Touch gestures must call `preventDefault` through the existing `touch-action: none` canvas behavior and must not trigger page scroll/zoom while interacting with the scene.

## 6. Input sensitivity

Keep tuning in scene/config constants rather than burying it in controller code.

Object-mode tuning should expose named values such as:

```ts
OBJECT_ORBIT_SENSITIVITY
OBJECT_ZOOM_SENSITIVITY
OBJECT_PAN_SENSITIVITY
OBJECT_DAMPING
OBJECT_IDLE_DELAY
OBJECT_IDLE_ORBIT_SPEED
```

The exact values are implementation tuning, not product constants. Tune against real mouse, trackpad, and physical touch input.

## 7. Damping

Direct manipulation should feel smooth but responsive.

Requirements:

- do not tie perceived damping to frame rate;
- use delta-time-aware exponential damping or equivalent;
- target roughly 100–250 ms perceptual settling for ordinary user input;
- authored hotspot transitions may take longer, typically about 400–700 ms when motion is enabled;
- user input immediately interrupts an authored transition unless the UI is intentionally modal;
- reduced motion skips or substantially shortens nonessential camera animation.

Avoid spring overshoot unless testing proves it improves the object-viewer feel. Default is critically damped/no overshoot.

## 8. Constraints

Object mode must make it difficult to lose or clip through the subject accidentally.

Required constraints:

- clamp radius to a scene-authored minimum and maximum;
- clamp pitch so the camera cannot flip upside down;
- maintain a stable world-up axis;
- do not introduce roll;
- prevent radius from crossing through the subject;
- keep the overview pose valid at supported viewport sizes;
- use soft-feeling input near limits even if the underlying values are hard-clamped.

Yaw may wrap continuously unless the specific scan has a reason to restrict its back side.

## 9. Zoom semantics

Prefer physical dolly/orbit-radius changes to FOV zoom for user interaction.

FOV remains a projection/framing tool and may still adapt to viewport aspect ratio. It should not be the primary user zoom state.

Wheel/trackpad zoom should:

- be smooth across high-resolution trackpads and discrete mouse wheels;
- normalize extremely large deltas;
- never jump through the minimum radius;
- keep the target visually stable.

Pinch zoom should map continuously to radius and remain stable if a finger is added/removed.

## 10. Panning

Panning is secondary. Ship orbit + zoom first.

If pan is included:

- move the target in camera-relative right/up screen axes;
- constrain the target to an authored region around the subject;
- Reset/Home must restore the authored target;
- hotspot focus transitions may temporarily replace the panned target.

Do not let pan become a second path to losing the subject.

## 11. Hotspot focus transitions

Each hotspot may provide an authored camera composition. Selecting a hotspot should:

1. stop idle motion;
2. set desired target/yaw/pitch/radius to the hotspot composition;
3. animate/damp toward it;
4. open/update the detail panel in coordination with camera movement;
5. end with the described feature visible and unobscured.

The user can interrupt the camera motion by dragging/zooming. The detail remains selected unless normal dismissal behavior closes it.

Do not make the camera transition a blocking animation.

See `HOTSPOTS-TOUR-SPEC.md` for data and UI behavior.

## 12. Detail-panel recomposition

Opening desktop detail UI changes the usable viewport even though the WebGL/WebGPU canvas size may remain unchanged.

Object mode should support a screen-space composition offset so the focused subject/detail sits in the unobscured region.

Preferred approach:

- preserve the 3D target used for orbit;
- apply an authored or computed screen-space framing offset while the panel is open;
- avoid permanently changing the semantic hotspot target just to compensate for UI.

On small portrait devices, the bottom sheet should leave the selected feature visible above it. The implementation may adjust radius/pitch/target slightly per breakpoint if a single composition cannot satisfy all supported aspect ratios.

## 13. Resize behavior

On resize/orientation/aspect change:

- preserve the current semantic focus: overview remains overview, selected hotspot remains selected;
- recompute projection/framing without snapping back to spawn;
- keep radius within constraints;
- ensure the subject does not become cropped by the header/dock/detail UI;
- do not restart entrance animation or clear discovery state.

The current narrow-screen FOV adaptation can be reused or replaced if the new camera produces a better verified result.

## 14. Idle motion

Idle motion is optional polish and must come after the core camera is correct.

If implemented:

- wait roughly 6–8 seconds after the last interaction;
- use an extremely slow, small orbit around the current overview/focus;
- stop immediately on pointer/touch/keyboard interaction;
- never run while a detail transition is active;
- never run when `prefers-reduced-motion: reduce` is active;
- do not change discovery state or semantic camera target.

The idle camera should make the capture feel alive, not demonstrate a cinematic reel.

## 15. Reduced motion

When reduced motion is requested:

- direct manipulation still works normally;
- reset/focus transitions should be immediate or very short;
- no idle orbit;
- no decorative camera settle on initial reveal;
- no behavior should become inaccessible because animation was removed.

## 16. Controller architecture

Prefer a second controller rather than turning the existing fly controller into a large conditional state machine.

Target shape:

```ts
export type SceneControls = {
  reset: () => void;
  update: (delta: number) => void;
  dispose: () => void;
  focusHotspot?: (index: number) => void;
};

createObjectControls(...): SceneControls
createFlyControls(...): SceneControls
```

`SplatScene.tsx` selects the controller from the explicit scene mode.

The shared contract should stay small. Do not build a generalized controls framework.

## 17. Existing systems that must remain intact

Camera work must preserve:

- single GET of the SPZ per loading attempt;
- streamed progress behavior;
- WebGPU support/unavailable/error distinctions;
- GPU-device-loss teardown and retry;
- tab visibility handling;
- renderer/resource cleanup;
- native Gaussian splat raycasting;
- hotspot discovery state;
- focus restoration and accessible buttons;
- reduced-motion support;
- DPR caps and hidden-tab rendering pause;
- current attribution/license behavior.

## 18. Completion criteria

Object-camera work is not done merely because orbit controls function.

It is done when:

- the lion remains the dominant composition through normal orbit/zoom use;
- a user cannot trivially fly away from it;
- mouse and touch controls feel native for an object viewer;
- Reset reliably restores the authored overview;
- each hotspot can present a useful authored shot;
- opening detail UI does not cover the feature being described;
- reduced-motion behavior is correct;
- environment mode still uses the existing fly behavior without regression.
