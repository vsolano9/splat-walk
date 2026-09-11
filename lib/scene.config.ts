// The only scan path. Local assets avoid CORS and third-party availability issues.
export const SPZ_URL = "/scenes/lion.v3.spz";
export const SPAWN_POSITION: [number, number, number] = [0, 0.42, 1.2];
export const LOOK_AT: [number, number, number] = [-0.025, 0.16, 0.05];
export const SCAN_ROTATION: [number, number, number] = [Math.PI, 0, 0];
export const MOVE_SPEED = 0.35; // scan units per second; Q down, E up
export const HOTSPOT_RADIUS = 0.16; // maximum distance from a picked splat surface
export const MARKER_SIZE = 0.023;

export const HOTSPOTS = [
  { position: [0, 0.37, 0.19], label: "Face to face", description: "A reconstructed cave lion, captured as thousands of soft, overlapping splats. Move closer to inspect the brow and eyes." },
  { position: [0.14, 0.19, 0.05], label: "Surface detail", description: "The coat's colour and texture belong to the capture. There is no hand-built mesh or lighting rig behind this view." },
  { position: [-0.1, 0.09, 0.3], label: "Fine whiskers", description: "Small, delicate details are part of the scan too. Look around the muzzle, then change height with Q and E to inspect the whiskers from another angle." },
] satisfies { position: [number, number, number]; label: string; description: string }[];
