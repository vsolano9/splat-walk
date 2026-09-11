"use client";

import SplatScene from "@/components/SplatScene";

export default function Home() {
  return (
    <main
      className="relative h-dvh min-h-96 overflow-hidden"
      onKeyDownCapture={(event) => {
        if (event.key !== "Escape" || event.defaultPrevented || document.pointerLockElement) return;
        const detail = event.currentTarget.querySelector<HTMLElement>("[data-hotspot-detail]");
        const closeButton = detail?.querySelector<HTMLButtonElement>('button[aria-label="Close detail"]');
        if (!closeButton) return;
        event.preventDefault();
        event.stopPropagation();
        closeButton.click();
      }}
    >
      <SplatScene />
    </main>
  );
}
