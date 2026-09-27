import { MathUtils, Vector3 } from "three/webgpu";
import type { GaussianSplat } from "three/addons/objects/GaussianSplat.js";
import { OBJECT_CAMERA, type ObjectCameraProfile } from "./scene.config";

// The bundled sample, a public HTTPS/same-origin `?scene=` URL, or a file opened from disk.
export type ScanSource =
  | { kind: "bundled" }
  | { kind: "url"; url: string; name: string }
  | { kind: "file"; file: File; name: string };

export const SCENE_PARAM = "scene";

// Only HTTPS or same-origin URLs: WebGPU already requires a secure page, and mixed content would fail.
export function readSceneParam(location: Location): ScanSource | null {
  const value = new URLSearchParams(location.search).get(SCENE_PARAM);
  if (!value) return null;
  let url: URL;
  try { url = new URL(value, location.href); } catch { return null; }
  if (url.protocol !== "https:" && url.origin !== location.origin) return null;
  const file = url.pathname.split("/").filter(Boolean).pop();
  return { kind: "url", url: url.href, name: file ? decodeURIComponent(file) : url.host };
}

// Samples at most this many splats; enough for stable percentiles on multi-million-splat captures.
const FRAME_SAMPLES = 40_000;
// Trims stray floaters that would otherwise push the camera far away from the subject.
const FRAME_PERCENTILE = 0.02;
// Half the minimum vertical field of view the scene camera uses (see SplatScene resize()).
const HALF_FOV = MathUtils.degToRad(25);

// Derives an object-camera profile from a loaded capture: target its robust centre and back off
// until its robust bounding sphere fills the view. Pitch limits keep the authored defaults.
export function fitObjectProfile(splats: GaussianSplat): ObjectCameraProfile {
  const source = splats.splatGeometry.getAttribute("position");
  const stride = Math.max(1, Math.ceil(source.count / FRAME_SAMPLES));
  const samples = Math.ceil(source.count / stride);
  const axes = [new Float32Array(samples), new Float32Array(samples), new Float32Array(samples)];
  const point = new Vector3();
  splats.updateMatrixWorld(true);
  for (let i = 0, n = 0; i < source.count; i += stride, n++) {
    point.set(source.getX(i), source.getY(i), source.getZ(i)).applyMatrix4(splats.matrixWorld);
    axes[0][n] = point.x;
    axes[1][n] = point.y;
    axes[2][n] = point.z;
  }
  const low = Math.floor((samples - 1) * FRAME_PERCENTILE);
  const high = Math.ceil((samples - 1) * (1 - FRAME_PERCENTILE));
  const bounds = axes.map((axis) => {
    axis.sort();
    return [axis[low], axis[high]] as const;
  });
  const target = bounds.map(([min, max]) => (min + max) / 2) as [number, number, number];
  const sphere = Math.max(1e-3, Math.hypot(...bounds.map(([min, max]) => (max - min) / 2)));
  const radius = sphere / Math.sin(HALF_FOV);
  return {
    target,
    yaw: 0,
    pitch: 0.2,
    radius,
    minRadius: radius * 0.3,
    maxRadius: radius * 1.6,
    minPitch: OBJECT_CAMERA.minPitch,
    maxPitch: OBJECT_CAMERA.maxPitch,
  };
}
