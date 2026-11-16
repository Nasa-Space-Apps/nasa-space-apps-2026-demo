"use client";

import { useEffect, useRef } from "react";
import { fx } from "@/lib/home";
import { reducedMotion } from "@/lib/motion";

/**
 * The sparkle layer of the home page: a full-screen 2D canvas of flat four-point stars that twinkle and drift up (the night sky of the comic), a few that
 * follow the pointer, and a burst of confetti when something is clicked (`fx.burst`). Flat colours only (paper, accent, ink); the colours are read from
 * `colors` every frame, so they follow the world of the current story. Drawn at 30 fps.
 */
type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; kind: "star" | "dot"; c: 0 | 1 | 2; spin: number };

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.quadraticCurveTo(0, 0, 0, r);
  ctx.quadraticCurveTo(0, 0, -r, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r);
  ctx.fill();
  ctx.restore();
}

export default function Sparkles({ colors }: { colors: { paper: string; accent: string; ink: string } }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const palette = useRef(colors);
  useEffect(() => {
    palette.current = colors;
  }, [colors]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const calm = reducedMotion();
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ambient = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 2.5 + Math.random() * 5.5,
      sp: 0.4 + Math.random() * 1.4,
      ph: Math.random() * 6.28,
      c: (Math.random() < 0.7 ? 0 : 1) as 0 | 1,
      drift: 0.004 + Math.random() * 0.01,
    }));
    const parts: P[] = [];

    fx.burst = (x, y) => {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 140 + Math.random() * 360;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, r: 3 + Math.random() * 7, life: 0, max: 0.8 + Math.random() * 0.7, kind: Math.random() < 0.55 ? "star" : "dot", c: (Math.floor(Math.random() * 3) as 0 | 1 | 2), spin: (Math.random() - 0.5) * 8 });
      }
    };
    let lastTrail = 0;
    let lx = 0;
    let ly = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (calm || now - lastTrail < 70 || Math.hypot(e.clientX - lx, e.clientY - ly) < 26) return;
      lastTrail = now;
      lx = e.clientX;
      ly = e.clientY;
      parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, r: 3 + Math.random() * 4, life: 0, max: 0.7, kind: "star", c: Math.random() < 0.5 ? 0 : 1, spin: 1 });
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, a, canvas")) return; // buttons and the vehicle have their own feedback
      fx.burst(e.clientX, e.clientY);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("click", onClick);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 32) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = now / 1000;
      const col = [palette.current.paper, palette.current.accent, palette.current.ink];
      ctx.clearRect(0, 0, w, h);
      for (const s of ambient) {
        if (!calm) {
          s.y -= s.drift * dt;
          if (s.y < -0.02) s.y = 1.02;
        }
        const tw = calm ? 0.8 : 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        ctx.fillStyle = col[s.c];
        star(ctx, s.x * w, s.y * h, s.r * tw, 0);
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life >= p.max) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += 520 * dt * (p.kind === "dot" ? 1 : 0.5);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - 1.4 * dt;
        const k = 1 - p.life / p.max;
        ctx.fillStyle = col[p.c];
        if (p.kind === "dot") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * k, 0, Math.PI * 2);
          ctx.fill();
        } else star(ctx, p.x, p.y, p.r * 1.6 * k, p.life * p.spin);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      fx.burst = () => {};
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
