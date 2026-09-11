// The only scan path. Local assets avoid CORS and third-party availability issues.
export const SPZ_URL = "/scenes/lion.v3.spz";
export const SPAWN_POSITION: [number, number, number] = [0, 0.42, 1.2];
export const LOOK_AT: [number, number, number] = [-0.025, 0.16, 0.05];
export const SCAN_ROTATION: [number, number, number] = [Math.PI, 0, 0];
// Input tuning is explicit so alternate scans can be calibrated without touching control code.
export const KEYBOARD_MOVE_SPEED = 0.35; // scan units per second
export const TOUCH_MOVE_SPEED = 0.32; // scan units per second
export const MOUSE_LOOK_SENSITIVITY = 0.0018; // radians per pointer pixel
export const TOUCH_LOOK_SENSITIVITY = 0.0034; // radians per drag pixel
export const KEYBOARD_LOOK_SPEED = 1.15; // radians per second
export const TOUCH_MOVE_DRAG_DISTANCE = 60; // pixels to reach full movement speed
export const CAMERA_RESET_DURATION = 0.4; // seconds
export const HOTSPOT_RADIUS = 0.16; // maximum distance from a picked splat surface
export const MARKER_SIZE = 0.023;

export const HOTSPOTS = [
  { position: [0, 0.37, 0.19], label: "Face to face", description: "A reconstructed cave lion, captured as thousands of soft, overlapping splats. Move closer to inspect the brow and eyes." },
  { position: [0.14, 0.19, 0.05], label: "Surface detail", description: "The coat's colour and texture belong to the capture. There is no hand-built mesh or lighting rig behind this view." },
  { position: [-0.1, 0.09, 0.3], label: "Fine whiskers", description: "Small, delicate details are part of the scan too. Look around the muzzle, then change height with Q and E to inspect the whiskers from another angle." },
] satisfies { position: [number, number, number]; label: string; description: string }[];
