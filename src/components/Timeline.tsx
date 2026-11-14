"use client";

import { useEffect, useRef, useState } from "react";
import { game, travelTo } from "@/lib/game";
import type { Checkpoint } from "@/lib/checkpoints";
import type { Theme } from "@/lib/themes";
import { ease, ui } from "@/lib/ui";
import Reveal from "./Reveal";

/**
 * Route timeline (bottom centre): a hairline with one square marker per checkpoint, evenly spaced. The ink fill follows the
 * vehicle along the route (proportionally inside each leg). Only the markers are clickable: they send the vehicle to that
 * checkpoint (autopilot, forward or backward); there is no way to stop anywhere else. State is polled from `game` with a rAF loop,
 * The moving dot and the current marker take the vehicle colour (`accent`). React only re-renders when the checkpoint list, the visited set, the current stop or the status text change.
 */
export default function Timeline({ theme, accent }: { theme: Theme; accent: string }) {
  const [cps, setCps] = useState<Checkpoint[]>([]);
  const [reached, setReached] = useState<string[]>([]);
  const [at, setAt] = useState(-1); // index of the checkpoint the vehicle is stopped on (-1 = between two)
  const [status, setStatus] = useState("");
  const fill = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let seen: Checkpoint[] | null = null;
    let lastVisited = -1;
    let lastAt = -2;
    let lastStatus = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const route = game.route;
      const list = game.checkpoints;
      if (list !== seen) {
        seen = list;
        setCps(list);
        lastVisited = -1;
        lastAt = -2;
      }
      if (!route || route.stops.length < 2) return;
      const { stops } = route;
      const n = stops.length;

      // progress: markers are evenly spaced, the position inside a leg is proportional to the distance driven
      let i = 0;
      while (i < n - 2 && game.s >= stops[i + 1]) i++;
      const leg = stops[i + 1] - stops[i];
      const p = (i + (leg > 0 ? Math.min(1, Math.max(0, (game.s - stops[i]) / leg)) : 0)) / (n - 1);
      if (fill.current) fill.current.style.width = `${p * 100}%`;
      if (dot.current) dot.current.style.left = `${p * 100}%`;

      if (game.visited.size !== lastVisited) {
        lastVisited = game.visited.size;
        setReached([...game.visited]);
      }
      const stopIdx = stops.findIndex((x) => Math.abs(x - game.s) < 0.6);
      if (stopIdx !== lastAt) {
        lastAt = stopIdx;
        setAt(stopIdx);
      }
      let next: string;
      if (game.travel !== null) next = `Traveling to ${list[game.travel]?.name ?? ""}`;
      else {
        const k = stops.findIndex((x) => x > game.s + 0.6);
        next = k < 0 ? "End of the route" : `Next: ${list[k]?.name ?? ""}`;
      }
      if (next !== lastStatus) {
        lastStatus = next;
        setStatus(next);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { label, panel } = ui(theme);
  const n = cps.length;
  if (n < 2) return null;
  const pct = (i: number) => `${(i / (n - 1)) * 100}%`;
  const M = 9; // horizontal inset so the end markers stay inside the card

  return (
    <div aria-label="Route timeline" style={{ ...panel, padding: "14px 16px 12px", fontFamily: theme.font }} className="select-none">
      <div className="flex items-baseline justify-between gap-3">
        <Reveal theme={theme} key={status} rise={5} className="min-w-0">
          <span className="block truncate" style={{ fontSize: 17, fontWeight: 450, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            {status}
          </span>
        </Reveal>
        <span style={{ ...label, whiteSpace: "nowrap" }}>
          {reached.length}/{n} visited
        </span>
      </div>

      <div className="relative" style={{ height: 26, margin: `8px ${M}px 0` }}>
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: 2, background: theme.line }}>
          <div ref={fill} style={{ height: "100%", width: 0, background: theme.ink }} />
        </div>
        <div
          ref={dot}
          className="absolute top-1/2"
          style={{
            left: 0,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: 999,
            background: accent,
            pointerEvents: "none",
            zIndex: 1,
            opacity: at >= 0 ? 0 : 1,
            transition: ease(theme, ["opacity"]),
          }}
        />
        {cps.map((c, i) => {
          const here = at === i;
          const done = reached.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              disabled={here}
              title={here ? c.name : `Travel to ${c.name}`}
              aria-label={`${here ? "At" : "Travel to"} checkpoint ${i + 1}: ${c.name}`}
              onClick={(e) => {
                e.currentTarget.blur(); // keep Space for driving
                travelTo(i);
              }}
              className="ui-marker absolute top-1/2 block p-0"
              style={{
                left: pct(i),
                width: 12,
                height: 12,
                marginLeft: -6,
                marginTop: -6,
                borderRadius: 2,
                transform: here ? "scale(1.25)" : undefined,
                background: here ? accent : done ? theme.ink : theme.surface,
                border: `1.5px solid ${theme.ink}`,
                cursor: here ? "default" : "pointer",
                pointerEvents: "auto",
              }}
            />
          );
        })}
      </div>

      {/* room for the tallest name: with 6+ stops the labels are narrower and wrap to 3 lines, which must not touch the card edge */}
      <div className="relative" style={{ height: n > 5 ? 44 : 26, margin: `4px ${M}px 0` }}>
        {cps.map((c, i) => {
          const first = i === 0;
          const last = i === n - 1;
          return (
            <span
              key={c.id}
              className="absolute top-0"
              style={{
                ...label,
                fontSize: 10,
                left: last ? "auto" : pct(i),
                right: last ? 0 : "auto",
                transform: first || last ? "none" : "translateX(-50%)",
                textAlign: first ? "left" : last ? "right" : "center",
                maxWidth: `${(100 / (n - 1)) * 0.62}%`,
                color: at === i ? theme.ink : theme.muted,
                transition: ease(theme, ["color"]),
              }}
            >
              {c.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
