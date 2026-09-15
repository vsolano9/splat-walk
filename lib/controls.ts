"use client";

import { Euler, PerspectiveCamera, Quaternion, Vector3 } from "three/webgpu";
import {
  CAMERA_RESET_DURATION,
  KEYBOARD_LOOK_SPEED,
  KEYBOARD_MOVE_SPEED,
  MOUSE_LOOK_SENSITIVITY,
  SPAWN_POSITION,
  TOUCH_LOOK_SENSITIVITY,
  TOUCH_MOVE_DRAG_DISTANCE,
  TOUCH_MOVE_SPEED,
} from "./scene.config";

export type SceneControls = {
  reset: () => void;
  update: (delta: number) => void;
  dispose: () => void;
  lock?: () => Promise<void>;
  focusHotspot?: (index: number) => void;
};

type ControlOptions = {
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  onPick: (x: number, y: number, centered: boolean) => boolean;
  onTarget: (x: number, y: number, centered: boolean, coarse: boolean) => void;
  onTargetClear: () => void;
  onLock: (locked: boolean) => void;
  onLockError: () => void;
  onResetChange: (resetting: boolean) => void;
  reduceMotion: boolean;
};
export type FlyControls = SceneControls & {
  lock: () => Promise<void>;
};
type Drag = { startX: number; startY: number; x: number; y: number; moved: boolean; role: "move" | "look" | "mouse" };

export function createFlyControls({
  camera,
  canvas,
  onPick,
  onTarget,
  onTargetClear,
  onLock,
  onLockError,
  onResetChange,
  reduceMotion,
}: ControlOptions): FlyControls {
  const keys = new Set<string>();
  const drags = new Map<number, Drag>();
  const movement = new Vector3();
  const forward = new Vector3();
  const right = new Vector3();
  const rotation = new Euler(0, 0, 0, "YXZ");
  const resetStartPosition = new Vector3();
  const resetStartQuaternion = new Quaternion();
  const spawnPosition = new Vector3(...SPAWN_POSITION);
  const spawnQuaternion = camera.quaternion.clone();
  let touchX = 0;
  let touchY = 0;
  let lockPending = false;
  let resetting = false;
  let resetElapsed = 0;
  const signalController = new AbortController();
  const { signal } = signalController;
  const locked = () => document.pointerLockElement === canvas;
  const clear = () => { keys.clear(); drags.clear(); touchX = 0; touchY = 0; };
  const cancelReset = () => {
    if (!resetting) return;
    resetting = false;
    onResetChange(false);
  };
  const look = (x: number, y: number, sensitivity: number) => {
    rotation.setFromQuaternion(camera.quaternion);
    rotation.y -= x * sensitivity;
    rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, rotation.x - y * sensitivity));
    camera.quaternion.setFromEuler(rotation);
  };
  const lock = async () => {
    cancelReset();
    canvas.focus({ preventScroll: true });
    if (locked() || lockPending) return;
    lockPending = true;
    try { await canvas.requestPointerLock(); }
    catch { onLockError(); }
    finally { lockPending = false; }
  };
  const supportedKeys: Record<string, true> = { KeyW: true, KeyA: true, KeyS: true, KeyD: true, KeyQ: true, KeyE: true, ArrowUp: true, ArrowDown: true, ArrowLeft: true, ArrowRight: true };
  window.addEventListener("keydown", (event) => {
    if ((!locked() && document.activeElement !== canvas) || !supportedKeys[event.code]) return;
    event.preventDefault();
    cancelReset();
    keys.add(event.code);
  }, { signal });
  window.addEventListener("keyup", (event) => { keys.delete(event.code); }, { signal });
  window.addEventListener("blur", clear, { signal });
  canvas.addEventListener("blur", clear, { signal });
  document.addEventListener("visibilitychange", () => { if (document.hidden) clear(); }, { signal });
  document.addEventListener("pointerlockchange", () => { clear(); onLock(locked()); }, { signal });
  document.addEventListener("mousemove", (event) => {
    if (!locked()) return;
    cancelReset();
    look(event.movementX, event.movementY, MOUSE_LOOK_SENSITIVITY);
    onTarget(event.clientX, event.clientY, true, false);
  }, { signal });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    cancelReset();
    canvas.focus({ preventScroll: true });
    const role = event.pointerType === "mouse" ? "mouse" : event.clientX < canvas.getBoundingClientRect().left + canvas.clientWidth / 2 ? "move" : "look";
    if (role !== "mouse" && [...drags.values()].some((drag) => drag.role === role)) return;
    drags.set(event.pointerId, { startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false, role });
    if (!locked()) canvas.setPointerCapture(event.pointerId);
  }, { signal });
  canvas.addEventListener("pointermove", (event) => {
    onTarget(event.clientX, event.clientY, locked(), event.pointerType !== "mouse");
    const drag = drags.get(event.pointerId);
    if (!drag) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) drag.moved = true;
    if (drag.role === "look" || (drag.role === "mouse" && !locked() && drag.moved)) {
      look(event.clientX - drag.x, event.clientY - drag.y, drag.role === "look" ? TOUCH_LOOK_SENSITIVITY : MOUSE_LOOK_SENSITIVITY);
    }
    if (drag.role === "move" && drag.moved) {
      touchX = Math.max(-1, Math.min(1, (event.clientX - drag.startX) / TOUCH_MOVE_DRAG_DISTANCE));
      touchY = Math.max(-1, Math.min(1, (event.clientY - drag.startY) / TOUCH_MOVE_DRAG_DISTANCE));
    }
    drag.x = event.clientX;
    drag.y = event.clientY;
  }, { signal });
  canvas.addEventListener("pointerleave", () => { if (!locked()) onTargetClear(); }, { signal });
  const endDrag = (event: PointerEvent) => {
    const drag = drags.get(event.pointerId);
    if (!drag) return;
    drags.delete(event.pointerId);
    if (drag.role === "move") { touchX = 0; touchY = 0; }
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (event.type !== "pointerup" || drag.moved) return;
    const picked = onPick(event.clientX, event.clientY, locked());
    if (!picked && drag.role === "mouse" && !locked()) void lock();
  };
  canvas.addEventListener("pointerup", endDrag, { signal });
  canvas.addEventListener("pointercancel", (event) => { onTargetClear(); endDrag(event); }, { signal });
  canvas.addEventListener("lostpointercapture", (event) => {
    const drag = drags.get(event.pointerId);
    if (drag?.role === "move") { touchX = 0; touchY = 0; }
    drags.delete(event.pointerId);
  }, { signal });
  return {
    lock,
    reset() {
      clear();
      onTargetClear();
      if (reduceMotion) {
        cancelReset();
        camera.position.copy(spawnPosition);
        camera.quaternion.copy(spawnQuaternion);
        return;
      }
      resetStartPosition.copy(camera.position);
      resetStartQuaternion.copy(camera.quaternion);
      resetElapsed = 0;
      if (!resetting) {
        resetting = true;
        onResetChange(true);
      }
    },
    update(delta: number) {
      if (resetting) {
        resetElapsed += delta;
        const progress = Math.min(1, resetElapsed / CAMERA_RESET_DURATION);
        const eased = 1 - (1 - progress) ** 3;
        camera.position.lerpVectors(resetStartPosition, spawnPosition, eased);
        camera.quaternion.slerpQuaternions(resetStartQuaternion, spawnQuaternion, eased);
        if (progress >= 1) {
          resetting = false;
          onResetChange(false);
        }
        return;
      }
      const keyX = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
      const keyZ = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
      const x = keyX + touchX;
      const z = keyZ - touchY;
      const y = Number(keys.has("KeyE")) - Number(keys.has("KeyQ"));
      const lookX = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
      const lookY = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
      if (lookX || lookY) look(lookX * delta * KEYBOARD_LOOK_SPEED, lookY * delta * KEYBOARD_LOOK_SPEED, 1);
      if (!x && !y && !z) return;
      camera.getWorldDirection(forward);
      right.setFromMatrixColumn(camera.matrix, 0);
      movement.copy(forward).multiplyScalar(z).addScaledVector(right, x);
      movement.y += y;
      const length = movement.length();
      if (length > 1) movement.divideScalar(length);
      camera.position.addScaledVector(movement, (touchX || touchY ? TOUCH_MOVE_SPEED : KEYBOARD_MOVE_SPEED) * delta);
    },
    dispose() {
      signalController.abort();
      clear();
      if (locked()) document.exitPointerLock();
    },
  };
}
