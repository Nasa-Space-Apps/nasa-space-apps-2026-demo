"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { game } from "@/lib/game";

const busy = () => Math.abs(game.speed) > 0.05 || game.travel !== null || game.boost;

/**
 * Drives a `frameloop="demand"` canvas: full rate (every animation frame) while the vehicle moves or travels, `idleFps` while it is stopped.
 * Saves GPU work when nothing meaningful changes on screen; motion is never throttled.
 *
 * Two parts: an animation-frame timer asks for a frame at `idleFps` (and starts the loop when motion begins), and while busy `useFrame` asks for
 * the next frame from inside the render, which is what keeps R3F's loop running at the display rate (invalidating only from outside it
 * renders every other frame).
 */
export default function FrameGovernor({ idleFps }: { idleFps: number }) {
  const invalidate = useThree((s) => s.invalidate);

  useFrame((state) => {
    if (busy()) state.invalidate();
  });

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (busy() || t - last >= 1000 / idleFps - 3) {
        last = t;
        invalidate();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, idleFps]);

  return null;
}
