"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { GaussianSplat } from "three/addons/objects/GaussianSplat.js";
import { SPZLoader } from "three/addons/loaders/SPZLoader.js";
import { createFlyControls, type FlyControls } from "@/lib/controls";
import { HOTSPOTS, HOTSPOT_RADIUS, LOOK_AT, MARKER_SIZE, SCAN_ROTATION, SPAWN_POSITION, SPZ_URL } from "@/lib/scene.config";

type Phase = "loading" | "ready" | "unsupported" | "unavailable" | "error";

export default function SplatScene() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<FlyControls | null>(null);
  const cardClose = useRef<HTMLButtonElement>(null);
  const restoreFocusTarget = useRef<HTMLElement | null>(null);
  const selectedRef = useRef<number | null>(null);
  const targetedRef = useRef<number | null>(null);
  const visitedRef = useRef<ReadonlySet<number>>(new Set());
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("Preparing WebGPU…");
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [targeted, setTargeted] = useState<number | null>(null);
  const [visited, setVisited] = useState<ReadonlySet<number>>(() => new Set());
  const [locked, setLocked] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hint, setHint] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [lockError, setLockError] = useState(false);
  const controlsVisible = selected === null && (hint || lockError);

  useEffect(() => {
    if (phase !== "ready" || !hint || selected !== null) return;
    const timer = window.setTimeout(() => setHint(false), 4000);
    return () => window.clearTimeout(timer);
  }, [phase, hint, selected]);

  useEffect(() => {
    selectedRef.current = selected;
    if (selected !== null) cardClose.current?.focus({ preventScroll: true });
  }, [selected]);
  useEffect(() => { targetedRef.current = targeted; }, [targeted]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let active = true;
    // Set by release(): a device that disappears because we tore it down is not a GPU fault.
    let disposed = false;
    let renderer: THREE.WebGPURenderer | undefined;
    let splats: GaussianSplat | undefined;
    let geometry: THREE.BufferGeometry | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let fly: FlyControls | undefined;
    let removeVisibility: (() => void) | undefined;
    const request = new AbortController();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111411");
    const camera = new THREE.PerspectiveCamera(50, 1, 0.005, 30);
    camera.position.fromArray(SPAWN_POSITION);
    camera.lookAt(...LOOK_AT);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const positions = HOTSPOTS.map((hotspot) => new THREE.Vector3(...hotspot.position));
    const projectedHotspot = new THREE.Vector3();
    const markerGeometry = new THREE.RingGeometry(0.55, 1, 40);
    const markerMaterials = positions.map(() => new THREE.MeshBasicMaterial({ color: "#dcebb1", side: THREE.DoubleSide, depthTest: false, transparent: true, opacity: 0.82, toneMapped: false }));
    const markers = positions.map((position, index) => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterials[index]);
      marker.position.copy(position);
      marker.scale.setScalar(MARKER_SIZE);
      marker.userData.hotspotIndex = index;
      marker.renderOrder = 10;
      return marker;
    });
    let lastPick: { source: string; index: number; point?: number[] } | null = null;
    const markVisited = (index: number) => {
      setVisited((current) => {
        if (current.has(index)) return current;
        const next = new Set(current);
        next.add(index);
        visitedRef.current = next;
        return next;
      });
    };
    const selectHotspot = (index: number) => {
      if (!renderer) return;
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      restoreFocusTarget.current = renderer.domElement;
      selectedRef.current = index;
      setSelected(index);
      setTargeted(null);
      markVisited(index);
    };
    const updateTarget = (x: number, y: number, centered: boolean, coarse: boolean) => {
      if (!renderer) return;
      const canvas = renderer.domElement;
      const bounds = canvas.getBoundingClientRect();
      const targetX = centered ? bounds.left + bounds.width / 2 : x;
      const targetY = centered ? bounds.top + bounds.height / 2 : y;
      const radius = coarse ? 76 : 34;
      let nearest = -1;
      let nearestDistance = radius * radius;
      camera.updateMatrixWorld();
      positions.forEach((position, index) => {
        projectedHotspot.copy(position).project(camera);
        if (projectedHotspot.z < -1 || projectedHotspot.z > 1) return;
        const screenX = bounds.left + (projectedHotspot.x + 1) / 2 * bounds.width;
        const screenY = bounds.top + (1 - projectedHotspot.y) / 2 * bounds.height;
        const distance = (screenX - targetX) ** 2 + (screenY - targetY) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      });
      if (targetedRef.current === nearest) return;
      targetedRef.current = nearest === -1 ? null : nearest;
      setTargeted(targetedRef.current);
    };
    const pick = (x: number, y: number, centered: boolean) => {
      if (!renderer || !splats) return false;
      const canvas = renderer.domElement;
      const bounds = canvas.getBoundingClientRect();
      pointer.set(centered ? 0 : (x - bounds.left) / bounds.width * 2 - 1, centered ? 0 : -(y - bounds.top) / bounds.height * 2 + 1);
      camera.updateMatrixWorld();
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      // Native r186 ellipsoid raycasting. Only run on a deliberate click, never per frame.
      const surface = raycaster.intersectObject(splats, false)[0];
      if (surface) {
        let nearest = -1;
        let distance = HOTSPOT_RADIUS * HOTSPOT_RADIUS;
        positions.forEach((position, index) => {
          const candidate = surface.point.distanceToSquared(position);
          if (candidate < distance) { distance = candidate; nearest = index; }
        });
        if (nearest !== -1) {
          lastPick = { source: "splat", index: nearest, point: surface.point.toArray() };
          selectHotspot(nearest);
          return true;
        }
      }
      const marker = raycaster.intersectObjects(markers, false)[0];
      if (marker) {
        const index = marker.object.userData.hotspotIndex as number;
        lastPick = { source: "marker", index };
        selectHotspot(index);
        return true;
      }
      if (selectedRef.current !== null) {
        selectedRef.current = null;
        targetedRef.current = null;
        restoreFocusTarget.current = canvas;
        setSelected(null);
        setTargeted(null);
        canvas.focus({ preventScroll: true });
        return true;
      }
      return false;
    };
    const release = () => {
      if (disposed) return;
      disposed = true;
      request.abort();
      removeVisibility?.();
      resizeObserver?.disconnect();
      fly?.dispose();
      if (controls.current === fly) controls.current = null;
      renderer?.setAnimationLoop(null);
      splats?.geometry.dispose();
      splats?.material.dispose();
      geometry?.dispose();
      markerGeometry.dispose();
      markerMaterials.forEach((material) => material.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
    async function start() {
      setPhase("loading");
      setMessage("Preparing WebGPU…");
      setLoadProgress(null);
      setSceneVisible(false);
      selectedRef.current = null;
      targetedRef.current = null;
      setSelected(null);
      setTargeted(null);
      setResetting(false);
      setLockError(false);
      setLocked(false);
      if (!navigator.gpu) {
        release();
        setPhase("unsupported");
        setMessage("This capture needs WebGPU. Use a supported browser on HTTPS or localhost, with graphics acceleration available.");
        return;
      }
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!active) return;
        if (!adapter) {
          release();
          setPhase("unavailable");
          setMessage("WebGPU is present, but this browser could not access a graphics adapter. Check your browser's graphics settings or try another supported browser, then retry.");
          return;
        }
        const coarsePointer = matchMedia("(pointer: coarse)").matches;
        const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
        renderer = new THREE.WebGPURenderer({ antialias: false, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarsePointer ? 1.5 : 2));
        await renderer.init();
        if (!active) { renderer.dispose(); return; }
        if (!("isWebGPUBackend" in renderer.backend) || renderer.backend.isWebGPUBackend !== true) throw new Error("A WebGPU device could not start. Try a supported browser with hardware acceleration enabled.");
        // A device can vanish for reasons three.js forwards (driver reset, GPU process crash) and
        // for one it deliberately swallows: an explicit destroy(). Report every loss we did not
        // cause, exactly once, so the canvas never freezes with no way back.
        const reportDeviceLoss = () => {
          if (!active || disposed) return;
          // Loss ends this attempt, including pending loading and visibility callbacks.
          release();
          // dispose() removes the lock listener before it releases the mouse.
          setLocked(false);
          setResetting(false);
          setSceneVisible(false);
          setPhase("error");
          setMessage("The GPU connection was interrupted. Reload the capture to continue.");
        };
        renderer.onDeviceLost = reportDeviceLoss;
        // three.js keeps the device out of its public backend surface, and its `lost` promise is the
        // only loss signal that also covers a destroyed device, which WebGPUBackend returns early on.
        const backend: unknown = renderer.backend;
        const device: unknown = backend && typeof backend === "object" && "device" in backend ? backend.device : undefined;
        if (device && typeof device === "object" && "lost" in device && device.lost instanceof Promise) {
          void device.lost.then(reportDeviceLoss);
        }
        const canvas = renderer.domElement;
        canvas.tabIndex = 0;
        canvas.setAttribute("aria-label", coarsePointer
          ? "Cave lion 3D scan. Drag the left side to move, drag the right side to look, and tap a ring for details."
          : "Cave lion 3D scan. WASD to move, Q and E for height, arrow keys or mouse to look. Press Escape to release the mouse.");
        container!.appendChild(canvas);
        const resize = () => {
          if (!renderer) return;
          const width = container!.clientWidth;
          const height = container!.clientHeight;
          camera.aspect = width / height;
          // Preserve the subject's horizontal framing on narrow touch screens.
          camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(25)) * Math.max(1, 0.8 / camera.aspect)));
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container!);
        resize();
        setMessage("Streaming the capture…");
        const response = await fetch(SPZ_URL, { signal: request.signal });
        if (!active || disposed) return;
        if (!response.ok) throw new Error(`The scan could not load (HTTP ${response.status}). Check SPZ_URL and try again.`);
        // Progress needs Content-Length from this same response. A separate HEAD probe adds a
        // second request without adding information: when the transfer is compressed neither
        // response declares a length, and the bar then stays indeterminate.
        const declaredBytes = Number(response.headers.get("content-length"));
        const totalBytes = Number.isFinite(declaredBytes) && declaredBytes > 0 ? declaredBytes : null;
        setLoadProgress(totalBytes ? 0 : null);
        let buffer: ArrayBuffer;
        if (!response.body) {
          buffer = await response.arrayBuffer();
        } else {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let received = 0;
          let reported = -1;
          while (true) {
            const { done, value } = await reader.read();
            if (!active || disposed) return;
            if (done) break;
            chunks.push(value);
            received += value.byteLength;
            if (totalBytes) {
              const progress = Math.min(99, Math.floor(received / totalBytes * 100));
              if (progress !== reported) { reported = progress; setLoadProgress(progress); }
            }
          }
          const bytes = new Uint8Array(received);
          let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
          buffer = bytes.buffer;
        }
        if (!active || disposed) return;
        setLoadProgress(100);
        setMessage("Building the splats…");
        geometry = await new SPZLoader().parse(buffer);
        if (!active || disposed) { geometry.dispose(); return; }
        if (!geometry.getAttribute("position")?.count) throw new Error("This scan is empty. Choose a non-empty SPZ capture.");
        splats = new GaussianSplat(geometry);
        splats.rotation.set(...SCAN_ROTATION);
        scene.add(splats, ...markers);
        fly = createFlyControls({
          camera,
          canvas,
          onPick: pick,
          onTarget: updateTarget,
          onTargetClear: () => {
            if (targetedRef.current === null) return;
            targetedRef.current = null;
            setTargeted(null);
          },
          onLock: setLocked,
          onLockError: () => setLockError(true),
          onResetChange: setResetting,
          reduceMotion,
        });
        controls.current = fly;
        let previousTime = performance.now();
        const animate = (time: number) => {
          if (!active || disposed || !renderer) return;
          const delta = Math.min((time - previousTime) / 1000, 0.05);
          previousTime = time;
          fly?.update(delta);
          if (document.pointerLockElement === canvas) updateTarget(0, 0, true, false);
          markers.forEach((marker, index) => {
            marker.quaternion.copy(camera.quaternion);
            const activeMarker = selectedRef.current === index;
            const targetedMarker = targetedRef.current === index;
            const visitedMarker = visitedRef.current.has(index);
            const wave = reduceMotion || visitedMarker ? 0 : Math.sin(time * 0.0022 + index * 1.9);
            const stateScale = activeMarker ? 1.13 : targetedMarker ? 1.08 : visitedMarker ? 0.88 : 1;
            marker.scale.setScalar(MARKER_SIZE * stateScale * (1 + wave * 0.055));
            markerMaterials[index].opacity = activeMarker || targetedMarker ? 1 : visitedMarker ? 0.54 : reduceMotion ? 0.82 : 0.78 + wave * 0.12;
          });
          renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animate);
        const visibility = () => {
          if (!active || disposed) return;
          if (document.hidden) renderer?.setAnimationLoop(null);
          else { previousTime = performance.now(); renderer?.setAnimationLoop(animate); }
        };
        document.addEventListener("visibilitychange", visibility);
        removeVisibility = () => document.removeEventListener("visibilitychange", visibility);
        if (process.env.NODE_ENV === "development") {
          Object.defineProperty(window, "__splatWalk", { configurable: true, get: () => ({
            revision: THREE.REVISION,
            backend: "WebGPU",
            camera: camera.position.toArray(),
            rotation: camera.rotation.toArray(),
            splatCount: geometry?.getAttribute("position").count,
            lastPick,
            targeted: targetedRef.current,
            visited: [...visitedRef.current],
            hotspots: positions.map((position, index) => {
              const screen = position.clone().project(camera);
              return { index, x: (screen.x + 1) / 2 * canvas.clientWidth, y: (1 - screen.y) / 2 * canvas.clientHeight };
            }),
          }) });
        }
        setPhase("ready");
        setHint(true);
        window.requestAnimationFrame(() => {
          if (!active || disposed) return;
          setSceneVisible(true);
          // A retry removes its focused button. Restore keyboard access without stealing focus.
          if (attempt > 0 && document.activeElement === document.body) canvas.focus({ preventScroll: true });
        });
      } catch (error) {
        if (!active || disposed) return;
        release();
        setPhase("error");
        setMessage(error instanceof Error ? error.message : "The capture could not open. Please retry.");
      }
    }
    void start();
    return () => {
      active = false;
      release();
      if (process.env.NODE_ENV === "development") Reflect.deleteProperty(window, "__splatWalk");
    };
  }, [attempt]);

  const closeCard = (focusTarget: HTMLElement | null = restoreFocusTarget.current) => {
    selectedRef.current = null;
    targetedRef.current = null;
    setSelected(null);
    setTargeted(null);
    window.requestAnimationFrame(() => {
      const canvas = host.current?.querySelector("canvas");
      const target = focusTarget?.isConnected ? focusTarget : canvas;
      target?.focus({ preventScroll: true });
    });
  };
  const openFromDock = (index: number, button: HTMLButtonElement) => {
    restoreFocusTarget.current = button;
    selectedRef.current = index;
    targetedRef.current = null;
    setSelected(index);
    setTargeted(null);
    setVisited((current) => {
      if (current.has(index)) return current;
      const next = new Set(current);
      next.add(index);
      visitedRef.current = next;
      return next;
    });
  };
  return <>
    <div
      ref={host}
      className={`scene-surface absolute inset-0 ${sceneVisible ? "scene-visible" : ""}`}
      data-phase={phase}
      data-resetting={resetting || undefined}
    />
    <div className="scene-atmosphere pointer-events-none absolute inset-0" aria-hidden="true" />
    <header className="scene-header pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4">
      <div className="scene-title-panel rounded-lg bg-canvas">
        <h1 className="scene-heading font-medium">Splat Walk<span className="scene-name text-subtle">/ Cave lion</span></h1>
        <div className="scene-title-meta">
          <p className="scene-tagline text-subtle">A captured world, up close.</p>
          {phase === "ready" && <p
            className={`discovery-progress ${visited.size === HOTSPOTS.length ? "is-complete" : ""}`}
            data-discovery-progress
            data-all-found={visited.size === HOTSPOTS.length || undefined}
            aria-live="polite"
          >{visited.size} / {HOTSPOTS.length} found</p>}
        </div>
      </div>
      {phase === "ready" && <div className="scene-actions pointer-events-auto flex gap-2">
        <button
          className="hud-button"
          data-resetting={resetting || undefined}
          disabled={resetting}
          onClick={() => {
            controls.current?.reset();
            closeCard(host.current?.querySelector("canvas") ?? null);
          }}
        >{resetting ? "Resetting…" : "Reset view"}</button>
        <button className="hud-button desktop-explore primary-action" onClick={() => {
          closeCard(host.current?.querySelector("canvas") ?? null);
          setLockError(false);
          void controls.current?.lock();
        }}>Explore</button>
      </div>}
    </header>

    {phase !== "ready" && <div className="loading-shell absolute inset-0 grid place-items-center p-6">
      <section className="loading-card max-w-md rounded-xl bg-panel p-6" role="status" aria-live="polite">
        <h2 className="mb-3 text-xl">{phase === "loading" ? "Loading the scan" : phase === "unsupported" ? "WebGPU required" : phase === "unavailable" ? "WebGPU unavailable" : "Let's try that again"}</h2>
        <p className="text-base leading-relaxed text-subtle">{message}</p>
        {phase === "loading" && <div className="loading-progress-wrap mt-5">
          <div className={`loading-track ${loadProgress === null ? "loading-indeterminate" : ""}`} role="progressbar" aria-label="Scan loading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadProgress ?? undefined}>
            <span className="loading-fill" style={loadProgress === null ? undefined : { width: `${loadProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-subtle" aria-hidden="true">{loadProgress === null ? "Connecting to capture" : `${loadProgress}% loaded`}</p>
        </div>}
        {phase !== "loading" && <button className="hud-button mt-4 border border-line" onClick={() => setAttempt((value) => value + 1)}>Reload capture</button>}
      </section>
    </div>}

    {phase === "ready" && <>
      {locked && <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true"><span className="scene-crosshair" /></div>}
      {targeted !== null && selected === null && <div
        className={`hotspot-label pointer-events-none absolute ${visited.has(targeted) ? "is-visited" : ""}`}
        data-hotspot-label
        data-hotspot-index={targeted}
        role="status"
      >
        <span>{HOTSPOTS[targeted].label}</span>
        <small>{visited.has(targeted) ? "Found" : "Inspect"}</small>
      </div>}
      {selected === null && <div id="scan-controls" className={`scan-hint hint pointer-events-none absolute mx-auto rounded-lg bg-panel text-center text-sm text-subtle ${hint || lockError ? "opacity-100" : "opacity-0"}`} aria-hidden={!hint && !lockError}>
        <p className="desktop-hint">Click to explore · WASD move · Q/E height<br />Mouse or arrows look · Esc releases · Aim at a ring for its label</p>
        <p className="touch-hint">Drag left to move · Drag right to look<br />Move near a ring to reveal it · Tap to discover</p>
        {lockError && <p className="mt-2 text-ink">Mouse capture was unavailable. Drag to look, or try Explore again.</p>}
      </div>}
      {selected !== null && <section
        aria-labelledby="hotspot-title"
        role="dialog"
        aria-modal="false"
        onKeyDown={(event) => { if (event.key === "Escape") closeCard(); }}
        className="detail-card absolute overflow-auto rounded-xl bg-panel"
        data-hotspot-detail={selected}
      >
        <span className="detail-sheet-handle" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <h2 id="hotspot-title" className="detail-title font-medium">{HOTSPOTS[selected].label}</h2>
          <button ref={cardClose} className="hud-button detail-close" onClick={() => closeCard()} aria-label="Close detail">Close</button>
        </div>
        <p className="detail-copy text-subtle">{HOTSPOTS[selected].description}</p>
      </section>}
      <nav aria-label="Scan details" className="detail-nav absolute">
        {HOTSPOTS.map((hotspot, index) => {
          const isVisited = visited.has(index);
          return <button
            key={hotspot.label}
            className={`hud-button detail-button text-sm ${selected === index ? "is-selected" : ""} ${isVisited ? "is-visited" : ""}`}
            data-hotspot-button={index}
            data-visited={isVisited || undefined}
            aria-label={`${hotspot.label}${isVisited ? ", found" : ""}`}
            aria-pressed={selected === index}
            onFocus={() => setTargeted(index)}
            onBlur={() => setTargeted((current) => current === index ? null : current)}
            onMouseEnter={() => setTargeted(index)}
            onMouseLeave={() => setTargeted((current) => current === index ? null : current)}
            onClick={(event) => openFromDock(index, event.currentTarget)}
          >
            <span className="visited-mark" aria-hidden="true">✓</span>
            {hotspot.label}
          </button>;
        })}
        <button
          className="hud-button detail-button controls-button text-sm"
          aria-expanded={controlsVisible}
          aria-controls={selected === null ? "scan-controls" : undefined}
          onClick={(event) => {
            if (selected !== null) closeCard(event.currentTarget);
            setLockError(false);
            setHint(!controlsVisible);
          }}
        >Controls</button>
      </nav>
    </>}
    <footer className="scene-footer pointer-events-none absolute text-xs text-subtle">
      <p className="tech-label rounded bg-canvas px-2 py-1">three.js r186 native WebGPU splats</p>
      <p className="attribution pointer-events-auto rounded bg-canvas px-2 py-1">
        Lion: <a className="underline" href="https://superspl.at/scene/56155c3f" target="_blank" rel="noreferrer">Renaud / Joanna Kobierska</a>
        <span aria-hidden="true"> · </span><a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
        <span aria-hidden="true"> · </span><a className="source-link" href="https://github.com/vsolano9/splat-walk" target="_blank" rel="noreferrer">Source ↗</a>
      </p>
    </footer>
  </>;
}
