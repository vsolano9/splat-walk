"use client";

import { PerspectiveCamera, Vector3 } from "three/webgpu";
import type { SceneControls } from "./controls";
import {
  HOTSPOTS,
  OBJECT_CAMERA,
  OBJECT_DAMPING,
  OBJECT_KEYBOARD_ORBIT_SPEED,
  OBJECT_KEYBOARD_ZOOM_SPEED,
  OBJECT_MOUSE_ORBIT_SENSITIVITY,
  OBJECT_TOUCH_ORBIT_SENSITIVITY,
  OBJECT_ZOOM_SENSITIVITY,
  type CameraPose,
} from "./scene.config";

type ObjectControlOptions = {
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  onPick: (x: number, y: number, centered: boolean) => boolean;
  onTarget: (x: number, y: number, centered: boolean, coarse: boolean) => void;
  onTargetClear: () => void;
  onResetChange: (resetting: boolean) => void;
  reduceMotion: boolean;
};

type ObjectState = {
  target: Vector3;
  yaw: number;
  pitch: number;
  radius: number;
};

type PointerState = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
  pointerType: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createObjectControls({
  camera,
  canvas,
  onPick,
  onTarget,
  onTargetClear,
  onResetChange,
  reduceMotion,
}: ObjectControlOptions): SceneControls {
  const signalController = new AbortController();
  const { signal } = signalController;
  const pointers = new Map<number, PointerState>();
  const keys = new Set<string>();
  const overview = makeState(OBJECT_CAMERA);
  const current = cloneState(overview);
  const desired = cloneState(overview);
  let resetting = false;
  let pinchDistance = 0;
  let pinchRadius = desired.radius;
  let hadMultitouch = false;

  camera.up.set(0, 1, 0);
  applyCamera();

  const cancelReset = () => {
    if (!resetting) return;
    resetting = false;
    onResetChange(false);
  };

  const setDesiredPose = (pose: CameraPose) => {
    desired.target.set(...pose.target);
    desired.yaw = pose.yaw;
    desired.pitch = clamp(pose.pitch, OBJECT_CAMERA.minPitch, OBJECT_CAMERA.maxPitch);
    desired.radius = clamp(pose.radius, OBJECT_CAMERA.minRadius, OBJECT_CAMERA.maxRadius);
    if (reduceMotion) {
      copyState(current, desired);
      applyCamera();
    }
  };

  const orbit = (dx: number, dy: number, sensitivity: number) => {
    cancelReset();
    desired.yaw -= dx * sensitivity;
    desired.pitch = clamp(desired.pitch - dy * sensitivity, OBJECT_CAMERA.minPitch, OBJECT_CAMERA.maxPitch);
  };

  const zoomByWheel = (deltaY: number) => {
    cancelReset();
    const normalized = clamp(deltaY, -120, 120);
    desired.radius = clamp(
      desired.radius * Math.exp(normalized * OBJECT_ZOOM_SENSITIVITY),
      OBJECT_CAMERA.minRadius,
      OBJECT_CAMERA.maxRadius,
    );
  };

  const reset = () => {
    onTargetClear();
    keys.clear();
    copyState(desired, overview);
    if (reduceMotion) {
      cancelReset();
      copyState(current, overview);
      applyCamera();
      return;
    }
    if (!resetting) {
      resetting = true;
      onResetChange(true);
    }
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    cancelReset();
    canvas.focus({ preventScroll: true });
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      pointerType: event.pointerType,
    });
    canvas.setPointerCapture(event.pointerId);
    const touchPointers = [...pointers.values()].filter((pointer) => pointer.pointerType !== "mouse");
    if (touchPointers.length >= 2) {
      hadMultitouch = true;
      pinchDistance = distance(touchPointers[0], touchPointers[1]);
      pinchRadius = desired.radius;
      touchPointers.forEach((pointer) => { pointer.moved = true; });
    }
  }, { signal });

  canvas.addEventListener("pointermove", (event) => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) {
      onTarget(event.clientX, event.clientY, false, event.pointerType !== "mouse");
      return;
    }

    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 5) pointer.moved = true;

    const touchPointers = [...pointers.values()].filter((candidate) => candidate.pointerType !== "mouse");
    if (touchPointers.length >= 2) {
      hadMultitouch = true;
      touchPointers.forEach((candidate) => { candidate.moved = true; });
      const nextDistance = Math.max(1, distance(touchPointers[0], touchPointers[1]));
      if (pinchDistance <= 0) {
        pinchDistance = nextDistance;
        pinchRadius = desired.radius;
      }
      desired.radius = clamp(
        pinchRadius * (pinchDistance / nextDistance),
        OBJECT_CAMERA.minRadius,
        OBJECT_CAMERA.maxRadius,
      );
      onTargetClear();
      return;
    }

    if (pointer.moved) {
      orbit(dx, dy, pointer.pointerType === "mouse" ? OBJECT_MOUSE_ORBIT_SENSITIVITY : OBJECT_TOUCH_ORBIT_SENSITIVITY);
      onTargetClear();
    } else {
      onTarget(event.clientX, event.clientY, false, event.pointerType !== "mouse");
    }
  }, { signal });

  const finishPointer = (event: PointerEvent, allowPick: boolean) => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    const shouldPick = allowPick && !pointer.moved && !hadMultitouch;
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

    const remainingTouches = [...pointers.values()].filter((candidate) => candidate.pointerType !== "mouse");
    if (remainingTouches.length === 1) {
      const remaining = remainingTouches[0];
      remaining.startX = remaining.x;
      remaining.startY = remaining.y;
      remaining.moved = true;
      pinchDistance = 0;
    } else if (remainingTouches.length === 0) {
      pinchDistance = 0;
      hadMultitouch = false;
    }

    if (shouldPick) onPick(event.clientX, event.clientY, false);
  };

  canvas.addEventListener("pointerup", (event) => finishPointer(event, true), { signal });
  canvas.addEventListener("pointercancel", (event) => {
    onTargetClear();
    finishPointer(event, false);
  }, { signal });
  canvas.addEventListener("pointerleave", () => {
    if (pointers.size === 0) onTargetClear();
  }, { signal });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    onTargetClear();
    zoomByWheel(event.deltaY);
  }, { passive: false, signal });

  const supportedKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Equal", "Minus", "NumpadAdd", "NumpadSubtract", "Home"]);
  window.addEventListener("keydown", (event) => {
    if (document.activeElement !== canvas || !supportedKeys.has(event.code)) return;
    event.preventDefault();
    if (event.code === "Home") {
      reset();
      return;
    }
    cancelReset();
    keys.add(event.code);
  }, { signal });
  window.addEventListener("keyup", (event) => { keys.delete(event.code); }, { signal });
  window.addEventListener("blur", () => keys.clear(), { signal });
  document.addEventListener("visibilitychange", () => { if (document.hidden) keys.clear(); }, { signal });

  return {
    reset,
    focusHotspot(index: number) {
      const pose = HOTSPOTS[index]?.camera;
      if (!pose) return;
      cancelReset();
      onTargetClear();
      setDesiredPose(pose);
    },
    update(delta: number) {
      const orbitX = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
      const orbitY = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
      const zoomIn = Number(keys.has("Equal") || keys.has("NumpadAdd"));
      const zoomOut = Number(keys.has("Minus") || keys.has("NumpadSubtract"));
      if (orbitX || orbitY) {
        desired.yaw -= orbitX * OBJECT_KEYBOARD_ORBIT_SPEED * delta;
        desired.pitch = clamp(
          desired.pitch - orbitY * OBJECT_KEYBOARD_ORBIT_SPEED * delta,
          OBJECT_CAMERA.minPitch,
          OBJECT_CAMERA.maxPitch,
        );
      }
      if (zoomIn || zoomOut) {
        desired.radius = clamp(
          desired.radius * Math.exp((zoomOut - zoomIn) * OBJECT_KEYBOARD_ZOOM_SPEED * delta),
          OBJECT_CAMERA.minRadius,
          OBJECT_CAMERA.maxRadius,
        );
      }

      const alpha = reduceMotion ? 1 : 1 - Math.exp(-OBJECT_DAMPING * delta);
      current.target.lerp(desired.target, alpha);
      current.yaw += (desired.yaw - current.yaw) * alpha;
      current.pitch += (desired.pitch - current.pitch) * alpha;
      current.radius += (desired.radius - current.radius) * alpha;
      applyCamera();

      if (resetting && stateDistance(current, desired) < 0.0015) {
        copyState(current, desired);
        applyCamera();
        resetting = false;
        onResetChange(false);
      }
    },
    dispose() {
      signalController.abort();
      keys.clear();
      pointers.clear();
      if (resetting) onResetChange(false);
    },
  };

  function applyCamera() {
    const horizontal = current.radius * Math.cos(current.pitch);
    camera.position.set(
      current.target.x + horizontal * Math.sin(current.yaw),
      current.target.y + current.radius * Math.sin(current.pitch),
      current.target.z + horizontal * Math.cos(current.yaw),
    );
    camera.lookAt(current.target);
  }
}

function makeState(pose: CameraPose): ObjectState {
  return {
    target: new Vector3(...pose.target),
    yaw: pose.yaw,
    pitch: pose.pitch,
    radius: pose.radius,
  };
}

function cloneState(state: ObjectState): ObjectState {
  return {
    target: state.target.clone(),
    yaw: state.yaw,
    pitch: state.pitch,
    radius: state.radius,
  };
}

function copyState(target: ObjectState, source: ObjectState) {
  target.target.copy(source.target);
  target.yaw = source.yaw;
  target.pitch = source.pitch;
  target.radius = source.radius;
}

function distance(a: PointerState, b: PointerState) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function stateDistance(a: ObjectState, b: ObjectState) {
  return Math.max(
    a.target.distanceTo(b.target),
    Math.abs(a.yaw - b.yaw),
    Math.abs(a.pitch - b.pitch),
    Math.abs(a.radius - b.radius),
  );
}
