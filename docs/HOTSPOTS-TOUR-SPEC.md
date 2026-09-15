# Hotspots and guided tour specification

Status: target behavior for the next object-camera iteration.

## 1. Goal

Hotspots should do more than open copy. They should connect information to a specific visible feature by coordinating marker state, camera composition, and detail UI.

The existing three lion hotspots remain the content set:

1. `Face to face`
2. `Surface detail`
3. `Fine whiskers`

Their labels/descriptions may be lightly edited for clarity, but this iteration is primarily about spatial presentation.

## 2. Hotspot data

Extend the current hotspot configuration instead of creating a parallel tour database.

Target shape:

```ts
type CameraPose = {
  target: [number, number, number];
  yaw: number;
  pitch: number;
  radius: number;
};

type Hotspot = {
  position: [number, number, number];
  label: string;
  description: string;
  camera?: CameraPose;
  framing?: {
    desktopOffset?: [number, number];
    mobileOffset?: [number, number];
  };
};
```

`position` remains the spatial/raycast anchor. `camera` describes the preferred presentation shot. These are related but not interchangeable.

The final camera poses must be authored by visual inspection of the actual lion render. Do not guess them from hotspot coordinates alone.

## 3. Selection behavior

When a hotspot is selected:

1. mark it visited using the existing discovery state;
2. stop idle camera motion;
3. set the object camera’s desired pose to the hotspot pose if present;
4. animate/damp to the pose unless reduced motion is active;
5. open or update the detail panel;
6. preserve keyboard focus semantics and close behavior;
7. ensure the feature is visible outside the detail panel.

Selection via marker, nearby splat-surface raycast, or dock button must produce the same semantic state and camera destination.

## 4. Transition coordination

Camera and detail UI should feel coordinated without blocking input.

Preferred sequence:

- start camera transition immediately;
- reveal/update the detail card immediately or after a very short visual delay if that produces a cleaner composition;
- do not wait for the camera animation to finish before allowing close/next/previous;
- direct orbit/zoom input interrupts camera motion and gives control back to the user.

Reduced motion: snap or near-snap to the authored pose and show the detail immediately.

## 5. Marker presentation

Markers remain physically tied to their 3D positions and billboard toward the camera.

Recommended states:

- undiscovered: visible, subtle pulse if motion is allowed;
- targeted/hovered: brighter and slightly larger;
- selected: strongest emphasis;
- visited: reduced prominence but still discoverable;
- all-found free-explore state: optionally fade further so the scan can dominate.

Add numeric identity `01`, `02`, `03` only if it improves orientation without clutter. The marker itself should remain compact.

## 6. Labels

Object mode should place the hotspot label near the projected marker instead of relying on a center/crosshair-oriented label position.

Requirements:

- label tracks the selected/targeted marker in screen space;
- label stays inside safe viewport margins;
- avoid collision with header, dock, footer, and detail panel where practical;
- hide or reposition if the marker is behind the camera/out of view;
- visited state can be indicated with a check or subtle text treatment.

Do not build a generalized collision-layout engine. Use a small set of practical clamping rules.

## 7. Tour navigation

When a detail is open, provide a clear way to move through the set without closing first.

Preferred compact controls:

- `Previous`
- `2 of 3`
- `Next`

The existing dock may remain available, but the detail card should make sequence navigation obvious.

Sequence order follows the configured hotspot order unless product testing produces a better authored order.

Keyboard:

- Next/Previous buttons are real buttons;
- focus remains deterministic after changing detail;
- Escape closes the detail as today;
- do not hijack left/right arrow keys globally if they are also used for accessible camera control.

## 8. Completion state

When all hotspots are visited, acknowledge completion without covering the subject.

Target copy:

- `All details discovered`

Actions:

- `Explore freely` — dismisses/softens tour UI and leaves the current camera under direct manipulation;
- `Overview` or `Replay tour` — returns to the authored overview and makes the detail sequence easy to revisit.

Discovery remains session-only unless a separate persistence decision is made later.

Reset/Home does not clear discovery state. Full page refresh starts a new session, matching current behavior.

## 9. Detail panel composition

Each hotspot shot must be verified in these states:

- desktop with detail panel open;
- narrow portrait with bottom sheet open;
- short landscape/coarse pointer if supported by the test environment.

The camera should recompose so the feature stays visible. If one pose cannot serve all aspect ratios, allow small breakpoint-specific framing offsets rather than duplicating the entire pose.

## 10. Dismissal

Existing dismissal principles remain:

- Close button closes detail;
- Escape closes detail when pointer lock is not consuming Escape in environment mode;
- empty-canvas dismissal can remain if it does not conflict with orbit drag/click semantics;
- focus returns to the canvas or originating dock/tour control as appropriate;
- closing a detail does not automatically reset the camera unless user testing proves that is less confusing.

Preferred object-mode behavior after close: leave the camera at the detail composition so the user can continue examining the feature. Reset/Home is the explicit return to overview.

## 11. Raycasting

Preserve native Gaussian ellipsoid raycasting on deliberate selection. Do not introduce a fake proxy mesh solely for hotspot picking.

Marker raycasting remains the fallback when a surface hit is not near a configured hotspot.

Object-camera changes must not turn raycasting into a per-frame expensive operation. Projection for label/target display is acceptable; actual splat raycasting stays deliberate.

## 12. Acceptance criteria

The hotspot/tour work is complete when:

- every hotspot opens from marker/surface and dock/tour navigation;
- every path reaches the same selected/visited state;
- every selected hotspot has a useful camera composition;
- the described feature remains visible with detail UI open;
- previous/next navigation is deterministic;
- `3 / 3` completion has a clear payoff;
- close/reset/focus restoration remain accessible;
- reduced motion removes nonessential camera animation;
- no change weakens native splat picking or GPU/resource behavior.
