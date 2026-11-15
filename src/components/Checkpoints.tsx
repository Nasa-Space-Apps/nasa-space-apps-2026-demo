"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "@/lib/game";
import { stopGuide } from "@/lib/guide";
import { playNarration, preloadNarration, stopNarration } from "@/lib/narration";
import type { Checkpoint } from "@/lib/checkpoints";
import type { TerrainData } from "@/lib/terrain";

/** Flat ribbon that hugs the terrain: shows the trigger area on the ground. */
function groundRing(ter: TerrainData, cx: number, cz: number, r: number, width: number) {
  const N = 72;
  const pos = new Float32Array(N * 2 * 3);
  const idx: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    [r - width, r].forEach((rr, k) => {
      const x = cx + Math.cos(a) * rr;
      const z = cz + Math.sin(a) * rr;
      pos.set([x, ter.heightAt(x, z) + 0.4, z], (i * 2 + k) * 3);
    });
    const a0 = i * 2, a1 = i * 2 + 1, b0 = ((i + 1) % N) * 2, b1 = ((i + 1) % N) * 2 + 1;
    idx.push(a0, a1, b0, a1, b1, b0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

/**
 * Beacons (pole + gem + ground ring) for the mission's checkpoints, plus the proximity check that
 * publishes `game.active` / `game.visited` (read by the info card, the timeline and the minimap).
 */
export default function Checkpoints({
  checkpoints,
  radius,
  terrain,
  colors,
}: {
  checkpoints: Checkpoint[];
  radius: number;
  terrain: TerrainData;
  colors: { pending: string; active: string; done: string }; // beacon colour: not reached yet / the vehicle is inside / already reached
}) {
  const height = radius * 1.6;
  const gemR = radius * 0.14;

  const items = useMemo(
    () =>
      checkpoints.map((c) => ({
        c,
        y: terrain.heightAt(c.x, c.z),
        ring: groundRing(terrain, c.x, c.z, radius, Math.max(0.5, radius * 0.035)),
        mat: new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, color: colors.pending }),
        gemMat: new THREE.MeshBasicMaterial({ transparent: true, color: colors.active }),
      })),
    [checkpoints, terrain, radius, colors.pending, colors.active],
  );
  const gems = useRef<(THREE.Mesh | null)[]>([]);
  const target = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    preloadNarration(checkpoints); // download the clips up front so they start instantly on arrival
    return () => stopNarration(); // mission switch / unmount: silence
  }, [checkpoints]);

  useFrame((state, dtRaw) => {
    if (!game.terrain) return; // mission still (re)starting
    const dist = (c: Checkpoint) => Math.hypot(game.x - c.x, game.z - c.z);

    // proximity: enter at `radius`, leave at 1.15x so the card does not flicker at the edge
    if (game.active && !game.hold) {
      const cur = checkpoints.find((c) => c.id === game.active);
      if (!cur || dist(cur) > radius * 1.15) {
        game.active = null;
        stopNarration();
      }
    }
    if (!game.active && !game.hold) {
      // (game.hold: the story's comic pages are on top: the first checkpoint opens, with its narration, when they leave)
      for (const c of checkpoints) {
        if (dist(c) < radius) {
          if (game.travel !== null && game.checkpoints[game.travel]?.id !== c.id) {
            game.visited.add(c.id); // autopilot driving through on its way to another checkpoint: counts as passed, no card or narration
            continue;
          }
          game.active = c.id;
          game.visited.add(c.id);
          stopGuide(); // the narration owns the channel while the rover is inside
          void playNarration(c); // no-op if narration is switched off
          break;
        }
      }
    }

    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-4 * Math.min(dtRaw, 0.05)); // colour and opacity glide to their target (never snap)
    items.forEach(({ c, y, mat, gemMat }, i) => {
      const inside = game.active === c.id;
      const reached = game.visited.has(c.id);
      const fade = reached && !inside ? 0.55 : 1; // reached beacons fade back
      target.set(reached && !inside ? colors.done : colors.pending);
      mat.color.lerp(target, k);
      mat.opacity += (fade - mat.opacity) * k;
      target.set(reached && !inside ? colors.done : colors.active); // the gem is the only orange
      gemMat.color.lerp(target, k);
      gemMat.opacity += (fade - gemMat.opacity) * k;
      const gem = gems.current[i];
      if (gem) {
        gem.rotation.y = t * 1.4;
        gem.position.y = y + height + gemR * 1.6 + Math.sin(t * 2 + i) * gemR * 0.3;
      }
    });
  });

  return (
    <>
      {items.map(({ c, y, ring, mat, gemMat }, i) => (
        <group key={c.id}>
          <mesh geometry={ring} material={mat} />
          <mesh position={[c.x, y + height / 2, c.z]} material={mat}>
            <cylinderGeometry args={[radius * 0.008, radius * 0.008, height, 8]} />
          </mesh>
          <mesh
            ref={(m) => {
              gems.current[i] = m;
            }}
            position={[c.x, y + height + gemR * 1.6, c.z]}
            material={gemMat}
          >
            <octahedronGeometry args={[gemR * 1.4, 0]} />
          </mesh>
        </group>
      ))}
    </>
  );
}
