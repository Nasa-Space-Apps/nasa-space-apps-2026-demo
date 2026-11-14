"use client";

import { useEffect, useRef } from "react";
import { game } from "@/lib/game";
import type { TerrainData } from "@/lib/terrain";
import type { Theme } from "@/lib/themes";
import { ease, ui } from "@/lib/ui";

const UNIT = 280; // reference width for marker sizing

/** Softened height grid at map resolution. */
function heightGrid(ter: TerrainData, w: number, h: number) {
  const W = ter.maxX - ter.minX;
  const H = ter.maxZ - ter.minZ;
  let hs = new Float32Array(w * h);
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++)
      hs[py * w + px] = ter.heightAt(ter.minX + (px / (w - 1)) * W, ter.minZ + (py / (h - 1)) * H);
  const r = Math.max(2, Math.round(w / 70));
  const blur = (src: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(src.length);
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        let sum = 0;
        for (let d = -r; d <= r; d++) {
          const xx = horizontal ? Math.min(w - 1, Math.max(0, px + d)) : px;
          const yy = horizontal ? py : Math.min(h - 1, Math.max(0, py + d));
          sum += src[yy * w + xx];
        }
        out[py * w + px] = sum / (2 * r + 1);
      }
    return out;
  };
  for (let n = 0; n < 2; n++) hs = blur(blur(hs, true), false);
  return hs;
}

// marching squares: case -> list of [edgeA, edgeB]; edges: 0 top, 1 right, 2 bottom, 3 left
const SEGS: number[][][] = [
  [], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 1], [3, 2]], [[0, 2]], [[0, 3]],
  [[0, 3]], [[0, 2]], [[0, 3], [2, 1]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], [],
];

function bakeContours(
  ctx: CanvasRenderingContext2D,
  hs: Float32Array,
  w: number,
  h: number,
  map: Theme["map"],
  inset: [number, number],
) {
  const u = w / UNIT;
  ctx.fillStyle = map.bg;
  ctx.fillRect(0, 0, w, h);

  const S = Math.max(2, Math.round(w / 170));
  const gw = Math.floor((w - 1) / S) + 1;
  const gh = Math.floor((h - 1) / S) + 1;
  const g = new Float32Array(gw * gh);
  let hi = -1e9;
  let lo = 1e9;
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const v = hs[Math.min(h - 1, j * S) * w + Math.min(w - 1, i * S)];
      g[j * gw + i] = v;
      // levels come from the interior only (borders are flattened and would crowd the lines)
      if (i * S > inset[0] && i * S < w - inset[0] && j * S > inset[1] && j * S < h - inset[1]) {
        if (v > hi) hi = v;
        if (v < lo) lo = v;
      }
    }

  const LEVELS = 16;
  const step = (hi - lo) / (LEVELS + 1);
  const minor = new Path2D();
  const major = new Path2D();
  for (let k = 1; k <= LEVELS; k++) {
    const L = lo + k * step;
    const path = k % map.every === 0 ? major : minor;
    for (let j = 0; j < gh - 1; j++) {
      for (let i = 0; i < gw - 1; i++) {
        const tl = g[j * gw + i];
        const tr = g[j * gw + i + 1];
        const br = g[(j + 1) * gw + i + 1];
        const bl = g[(j + 1) * gw + i];
        const c = (tl > L ? 8 : 0) | (tr > L ? 4 : 0) | (br > L ? 2 : 0) | (bl > L ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const pt = (e: number): [number, number] => {
          if (e === 0) return [(i + (L - tl) / (tr - tl)) * S, j * S];
          if (e === 1) return [(i + 1) * S, (j + (L - tr) / (br - tr)) * S];
          if (e === 2) return [(i + (L - bl) / (br - bl)) * S, (j + 1) * S];
          return [i * S, (j + (L - tl) / (bl - tl)) * S];
        };
        for (const [a, b] of SEGS[c]) {
          const [x1, y1] = pt(a);
          const [x2, y2] = pt(b);
          path.moveTo(x1, y1);
          path.lineTo(x2, y2);
        }
      }
    }
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(inset[0], inset[1], w - 2 * inset[0], h - 2 * inset[1]);
  ctx.clip();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = map.minor;
  ctx.lineWidth = map.minorW * u;
  ctx.stroke(minor);
  ctx.strokeStyle = map.major;
  ctx.lineWidth = map.majorW * u;
  ctx.stroke(major);
  ctx.restore();
}

function bakeMap(ter: TerrainData, w: number, h: number, map: Theme["map"]): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const hs = heightGrid(ter, w, h);
  bakeContours(ctx, hs, w, h, map, [(ter.fade / (ter.maxX - ter.minX)) * w, (ter.fade / (ter.maxZ - ter.minZ)) * h]);
  return cv;
}

export default function Minimap({ theme, title, accent }: { theme: Theme; title: string; accent: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const spd = useRef<HTMLSpanElement>(null);
  const pos = useRef<HTMLSpanElement>(null);
  const hdg = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let bg: HTMLCanvasElement | null = null;
    let ter: TerrainData | null = null;
    let lastHud = 0;
    let lastNow = 0;
    let veh = 1; // opacity of the vehicle dot + arrow (fades out while it is stopped on a checkpoint)
    const act: number[] = []; // how coloured each checkpoint square is (fades in while the vehicle is on it)

    const init = (t: TerrainData) => {
      ter = t;
      const aspect = (t.maxX - t.minX) / (t.maxZ - t.minZ);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = cv.clientWidth || 280;
      cv.width = Math.round(cssW * dpr);
      cv.height = Math.round((cssW / aspect) * dpr);
      cv.style.aspectRatio = String(aspect);
      bg = bakeMap(t, cv.width, cv.height, theme.map);
      if (wrap.current) {
        wrap.current.style.opacity = "1";
        wrap.current.style.transform = "none";
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (game.terrain !== ter) {
        // terrain changed (mission switch): rebake or wait
        if (game.terrain) init(game.terrain);
        else {
          ter = null;
          bg = null;
        }
      }
      if (!bg || !ter) return;
      const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      const k = 1 - Math.exp(-9 * dt);
      const w = cv.width;
      const h = cv.height;
      const u = w / UNIT;
      const W = ter.maxX - ter.minX;
      const H = ter.maxZ - ter.minZ;
      const toX = (x: number) => ((x - ter!.minX) / W) * w;
      const toY = (z: number) => ((z - ter!.minZ) / H) * h;
      const mx = toX(game.x);
      const my = toY(game.z);
      const { marker, trail } = theme;

      ctx.drawImage(bg, 0, 0);

      // route: the whole path faint and dashed, the part already driven solid
      const rt = game.route;
      if (rt && rt.points.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = trail.color;
        ctx.lineWidth = trail.width * u;
        ctx.globalAlpha = 0.35;
        ctx.setLineDash((trail.dash.length ? trail.dash : [4, 4]).map((d) => d * u));
        ctx.beginPath();
        ctx.moveTo(toX(rt.points[0].x), toY(rt.points[0].z));
        for (let i = 1; i < rt.points.length; i++) ctx.lineTo(toX(rt.points[i].x), toY(rt.points[i].z));
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        const done = Math.min(rt.points.length - 1, Math.floor(game.s / 4)); // points are ~4 units apart
        ctx.beginPath();
        ctx.moveTo(toX(rt.points[0].x), toY(rt.points[0].z));
        for (let i = 1; i <= done; i++) ctx.lineTo(toX(rt.points[i].x), toY(rt.points[i].z));
        ctx.lineTo(mx, my);
        ctx.stroke();
      }

      // checkpoints: numbered squares; dark once reached, vehicle-coloured while the vehicle is stopped on one (the vehicle marker then hides)
      const cp = theme.checkpoint;
      const cr = 8 * u;
      const stops = rt?.stops ?? [];
      const onStop = stops.findIndex((x) => Math.abs(x - game.s) < 0.6);
      veh += ((onStop >= 0 ? 0 : 1) - veh) * k;
      ctx.font = `500 ${8.5 * u}px ${getComputedStyle(cv).getPropertyValue("--font-mono") || "ui-monospace"}, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      game.checkpoints.forEach((c, i) => {
        const px = toX(c.x);
        const py = toY(c.z);
        const reached = game.visited.has(c.id);
        act[i] = (act[i] ?? 0) + ((onStop === i ? 1 : 0) - (act[i] ?? 0)) * k;
        ctx.beginPath();
        ctx.roundRect(px - cr, py - cr, cr * 2, cr * 2, 1.5 * u);
        ctx.fillStyle = reached ? cp.done : cp.pin;
        ctx.fill();
        if (act[i] > 0.01) {
          ctx.globalAlpha = act[i];
          ctx.fillStyle = accent; // the vehicle colour
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = cp.ring;
        ctx.lineWidth = 1.5 * u;
        ctx.stroke();
        ctx.fillStyle = act[i] > 0.5 ? cp.pin : reached ? cp.pin : cp.ring;
        ctx.fillText(String(i + 1), px, py + 0.5 * u);
      });

      if (veh > 0.02) {
        ctx.globalAlpha = veh;
        // heading arrow (map: x right, z down; forward = (sin h, cos h))
        const fa = Math.atan2(Math.cos(game.heading), Math.sin(game.heading));
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(fa);
        ctx.fillStyle = marker.arrow;
        ctx.beginPath();
        ctx.moveTo(15 * u, 0);
        ctx.lineTo(8 * u, -5 * u);
        ctx.lineTo(8 * u, 5 * u);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // rover dot
        ctx.fillStyle = accent;
        ctx.strokeStyle = marker.ring;
        ctx.lineWidth = 2.5 * u;
        ctx.beginPath();
        ctx.arc(mx, my, 5.5 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // HUD text (throttled)
      if (now - lastHud > 80) {
        lastHud = now;
        const deg = ((((Math.atan2(Math.sin(game.heading), Math.cos(game.heading)) * 180) / Math.PI) % 360) + 360) % 360;
        if (spd.current) spd.current.textContent = (Math.abs(game.speed) * 0.25).toFixed(1);
        if (pos.current) pos.current.textContent = `${game.x.toFixed(0)} · ${game.z.toFixed(0)}`;
        if (hdg.current) hdg.current.textContent = `${deg.toFixed(0)}°`;
        if (bar.current) bar.current.style.width = `${Math.min(100, (Math.abs(game.speed) / game.topSpeed) * 100)}%`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [theme, accent]);

  const { label, value, panel } = ui(theme);

  return (
    <div
      ref={wrap}
      style={{ fontFamily: theme.font, opacity: 0, transform: "translateY(18px)", transition: `${ease(theme, ["opacity"])}, ${ease(theme, ["transform"], theme.dur.slow)}` }}
      className="pointer-events-none fixed bottom-5 right-5 z-10 w-[clamp(220px,26vw,340px)] select-none"
    >
      <div style={{ ...panel, padding: 10 }}>
        <canvas ref={canvas} className="block w-full" style={{ background: theme.map.bg, borderRadius: theme.radius }} />
        <div className="px-1.5 pb-1">
          <div style={{ marginTop: 14, fontSize: 17, fontWeight: 450, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{title}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <span style={{ ...label, display: "block", fontSize: 10 }}>Pos X · Z</span>
              <span ref={pos} style={{ ...value, marginTop: 6, display: "block" }}>
                0 · 0
              </span>
            </div>
            <div>
              <span style={{ ...label, display: "block", fontSize: 10 }}>Heading</span>
              <span ref={hdg} style={{ ...value, marginTop: 6, display: "block" }}>
                0°
              </span>
            </div>
            <div>
              <span style={{ ...label, display: "block", fontSize: 10 }}>Speed m/s</span>
              <span ref={spd} style={{ ...value, marginTop: 6, display: "block" }}>
                0.0
              </span>
            </div>
          </div>
          <div className="mt-3.5 overflow-hidden" style={{ height: 2, background: theme.line }}>
            <div ref={bar} style={{ height: "100%", width: 0, background: theme.ink }} />
          </div>
        </div>
      </div>
    </div>
  );
}
