// The only scan path. Local assets avoid CORS and third-party availability issues.
export const SPZ_URL = "/scenes/lion.v3.spz";

export type SceneMode = "object" | "environment";
export type CameraPose = {
  target: [number, number, number];
  yaw: number;
  pitch: number;
  radius: number;
};
export type ObjectCameraProfile = CameraPose & {
  minRadius: number;
  maxRadius: number;
  minPitch: number;
  maxPitch: number;
};
export type Hotspot = {
  position: [number, number, number];
  label: string;
  description: string;
  camera?: CameraPose;
  framing?: {
    desktopOffset?: [number, number];
    mobileOffset?: [number, number];
  };
};

// The bundled lion is an object-scale capture. Keep fly controls available for room/environment scans.
export const SCENE_MODE: SceneMode = "object";

// Legacy environment-mode spawn/look values remain the canonical fly-camera start pose.
export const SPAWN_POSITION: [number, number, number] = [0, 0.42, 1.2];
export const LOOK_AT: [number, number, number] = [-0.025, 0.16, 0.05];
export const SCAN_ROTATION: [number, number, number] = [Math.PI, 0, 0];

// Object-mode overview derived from the proven lion spawn/look composition, then constrained so the
// subject remains dominant instead of allowing the camera to fly away from it.
export const OBJECT_CAMERA: ObjectCameraProfile = {
  target: [-0.025, 0.16, 0.05],
  yaw: 0.022,
  pitch: 0.222,
  radius: 1.179,
  minRadius: 0.52,
  maxRadius: 1.62,
  minPitch: -0.72,
  maxPitch: 0.82,
};

// Input tuning is explicit so alternate scans can be calibrated without touching control code.
export const KEYBOARD_MOVE_SPEED = 0.35; // scan units per second
export const TOUCH_MOVE_SPEED = 0.32; // scan units per second
export const MOUSE_LOOK_SENSITIVITY = 0.0018; // radians per pointer pixel
export const TOUCH_LOOK_SENSITIVITY = 0.0034; // radians per drag pixel
export const KEYBOARD_LOOK_SPEED = 1.15; // radians per second
export const TOUCH_MOVE_DRAG_DISTANCE = 60; // pixels to reach full movement speed
export const CAMERA_RESET_DURATION = 0.4; // seconds

export const OBJECT_MOUSE_ORBIT_SENSITIVITY = 0.004;
export const OBJECT_TOUCH_ORBIT_SENSITIVITY = 0.0044;
export const OBJECT_ZOOM_SENSITIVITY = 0.0018;
export const OBJECT_KEYBOARD_ORBIT_SPEED = 1.05; // radians per second
export const OBJECT_KEYBOARD_ZOOM_SPEED = 0.85; // proportional radius change per second
export const OBJECT_DAMPING = 14; // delta-time-aware exponential damping strength

export const HOTSPOT_RADIUS = 0.16; // maximum distance from a picked splat surface
export const MARKER_SIZE = 0.023;

export const HOTSPOTS = [
  {
    position: [0, 0.37, 0.19],
    label: "Face to face",
    description: "A reconstructed cave lion, captured as thousands of soft, overlapping splats. Move closer to inspect the brow and eyes.",
    camera: { target: [0, 0.29, 0.16], yaw: 0.015, pitch: 0.11, radius: 0.74 },
    framing: { desktopOffset: [-0.12, 0], mobileOffset: [0, -0.08] },
  },
  {
    position: [0.14, 0.19, 0.05],
    label: "Surface detail",
    description: "The coat's colour and texture belong to the capture. There is no hand-built mesh or lighting rig behind this view.",
    camera: { target: [0.115, 0.205, 0.07], yaw: 0.34, pitch: 0.075, radius: 0.62 },
    framing: { desktopOffset: [-0.14, 0.02], mobileOffset: [0, -0.1] },
  },
  {
    position: [-0.1, 0.09, 0.3],
    label: "Fine whiskers",
    description: "Small, delicate details are part of the scan too. Orbit around the muzzle and zoom in to inspect the whiskers from another angle.",
    camera: { target: [-0.075, 0.105, 0.255], yaw: -0.3, pitch: -0.025, radius: 0.58 },
    framing: { desktopOffset: [-0.13, 0.02], mobileOffset: [0, -0.11] },
  },
] satisfies Hotspot[];
