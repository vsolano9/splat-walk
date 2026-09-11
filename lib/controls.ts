"use client";

import { useCallback } from "react";
import { Euler, PerspectiveCamera, Vector3 } from "three/webgpu";
import { LOOK_AT, MOVE_SPEED, SPAWN_POSITION } from "./scene.config";

type ControlOptions = {
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  onPick: (x: number, y: number, centered: boolean) => boolean;
  onLock: (locked: boolean) => void;
  onLockError: () => void;
};
export type FlyControls = {
  lock: () => Promise<void>;
  reset: () => void;
  update: (delta: number) => void;
  dispose: () => void;
};
type Drag = { startX: number; startY: number; x: number; y: number; moved: boolean; role: "move" | "look" | "mouse" };

export function useFlyControls() {
  return useCallback(({ camera, canvas, onPick, onLock, onLockError }: ControlOptions): FlyControls => {
    const keys = new Set<string>();
    const drags = new Map<number, Drag>();
    const movement = new Vector3();
    const forward = new Vector3();
    const right = new Vector3();
    const rotation = new Euler(0, 0, 0, "YXZ");
    let touchX = 0;
    let touchY = 0;
    let lockPending = false;
    const signalController = new AbortController();
    const { signal } = signalController;
    const locked = () => document.pointerLockElement === canvas;
    const clear = () => { keys.clear(); drags.clear(); touchX = 0; touchY = 0; };
    const look = (x: number, y: number) => {
      rotation.setFromQuaternion(camera.quaternion);
      rotation.y -= x * 0.0025;
      rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, rotation.x - y * 0.0025));
      camera.quaternion.setFromEuler(rotation);
    };
    const lock = async () => {
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
      keys.add(event.code);
    }, { signal });
    window.addEventListener("keyup", (event) => { keys.delete(event.code); }, { signal });
    window.addEventListener("blur", clear, { signal });
    canvas.addEventListener("blur", clear, { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) clear(); }, { signal });
    document.addEventListener("pointerlockchange", () => { clear(); onLock(locked()); }, { signal });
    document.addEventListener("mousemove", (event) => { if (locked()) look(event.movementX, event.movementY); }, { signal });
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      canvas.focus({ preventScroll: true });
      const role = event.pointerType === "mouse" ? "mouse" : event.clientX < canvas.getBoundingClientRect().left + canvas.clientWidth / 2 ? "move" : "look";
      if (role !== "mouse" && [...drags.values()].some((drag) => drag.role === role)) return;
      drags.set(event.pointerId, { startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false, role });
      if (!locked()) canvas.setPointerCapture(event.pointerId);
    }, { signal });
    canvas.addEventListener("pointermove", (event) => {
      const drag = drags.get(event.pointerId);
      if (!drag) return;
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) drag.moved = true;
      if (drag.role === "look" || (drag.role === "mouse" && !locked() && drag.moved)) look(event.clientX - drag.x, event.clientY - drag.y);
      if (drag.role === "move" && drag.moved) {
        touchX = Math.max(-1, Math.min(1, (event.clientX - drag.startX) / 60));
        touchY = Math.max(-1, Math.min(1, (event.clientY - drag.startY) / 60));
      }
      drag.x = event.clientX;
      drag.y = event.clientY;
    }, { signal });
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
    canvas.addEventListener("pointercancel", endDrag, { signal });
    canvas.addEventListener("lostpointercapture", (event) => {
      const drag = drags.get(event.pointerId);
      if (drag?.role === "move") { touchX = 0; touchY = 0; }
      drags.delete(event.pointerId);
    }, { signal });
    return {
      lock,
      reset() { clear(); camera.position.fromArray(SPAWN_POSITION); camera.lookAt(...LOOK_AT); },
      update(delta: number) {
        const x = Number(keys.has("KeyD")) - Number(keys.has("KeyA")) + touchX;
        const z = Number(keys.has("KeyW")) - Number(keys.has("KeyS")) - touchY;
        const y = Number(keys.has("KeyE")) - Number(keys.has("KeyQ"));
        const lookX = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
        const lookY = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
        if (lookX || lookY) look(lookX * delta * 400, lookY * delta * 400);
        if (!x && !y && !z) return;
        camera.getWorldDirection(forward);
        right.setFromMatrixColumn(camera.matrix, 0);
        movement.copy(forward).multiplyScalar(z).addScaledVector(right, x);
        movement.y += y;
        const length = movement.length();
        if (length > 1) movement.divideScalar(length);
        camera.position.addScaledVector(movement, MOVE_SPEED * delta);
      },
      dispose() {
        signalController.abort();
        clear();
        if (locked()) document.exitPointerLock();
      },
    };
  }, []);
}
