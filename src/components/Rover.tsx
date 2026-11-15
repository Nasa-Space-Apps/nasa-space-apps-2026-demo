"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bindKeyboard, game, input } from "@/lib/game";
import type { RoverConfig } from "@/lib/missions";
import { buildVehicle } from "@/lib/vehicles";

const damp = THREE.MathUtils.damp;
const DECEL = 28; // braking used to stop exactly on a checkpoint (units/s²)
const STILL_RATE = 360; // a stationary vehicle: how fast the story cursor glides from moment to moment (virtual units/s; moments are 100 apart)

export default function Rover({ config }: { config: RoverConfig }) {
  const rig = useMemo(() => buildVehicle(config.model, config.palette), [config]);
  useEffect(() => () => rig.dispose(), [rig]);
  const body = useRef<THREE.Group>(null);
  const align = useRef<THREE.Group>(null);
  const st = useMemo(
    () => ({ y: NaN, pitch: 0, roll: 0, accel: 0, prevSpeed: 0, locked: false, goal: null as number | null, pt: { x: 0, z: 0, heading: 0 } }),
    [],
  );
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => bindKeyboard(), []);
  useEffect(() => {
    game.wheels = rig.wheels.map(() => new THREE.Vector3());
  }, [rig]);

  useFrame((state, dtRaw) => {
    const ter = game.terrain;
    const route = game.route;
    const b = body.current;
    const a = align.current;
    if (!ter || !route || !b || !a) return;
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;

    // ---- driving: advance along the route ----
    // Space held = go to the next checkpoint and stop there (release and press again to continue);
    // a timeline click (game.travel) = autopilot to that checkpoint, forward or backward, passing the ones in between.
    const stops = route.stops;
    if (game.stationary) {
      // a vehicle that never moves: `game.s` is a cursor on a virtual route (one stop per moment of its story). It glides to the target moment; the vehicle stays put
      if (game.hold) game.travel = null;
      game.speed = 0;
      game.boost = false;
      if (game.travel !== null) {
        const goal = stops[game.travel];
        const step = Math.min(Math.abs(goal - game.s), STILL_RATE * dt);
        game.s += Math.sign(goal - game.s) * step;
        if (Math.abs(goal - game.s) < 0.01) {
          game.s = goal;
          game.travel = null;
        }
      }
    } else {
    const go = input.go && !game.hold; // the scene can wait behind the comic pages of the story
    if (!go) {
      st.locked = false;
      st.goal = null;
    }
    let goal = 0;
    let dir = 0;
    let cruise = config.maxSpeed;
    if (game.travel !== null) {
      goal = stops[game.travel];
      dir = Math.sign(goal - game.s);
      cruise = config.boostSpeed;
      if (dir === 0) game.travel = null;
    } else if (go && !st.locked) {
      st.goal ??= stops.find((x) => x > game.s + 0.5) ?? null; // fixed until we get there (it must not jump to the next stop while braking)
      if (st.goal !== null) {
        goal = st.goal;
        dir = 1;
      }
    }
    game.boost = game.travel !== null;

    let target = 0;
    let acc = 40; // coasting to a halt after Space is released
    if (dir !== 0) {
      const left = Math.abs(goal - game.s);
      target = dir * Math.min(cruise, Math.sqrt(2 * DECEL * left)); // brake so that the speed reaches 0 at the checkpoint
      acc = Math.abs(target) < Math.abs(game.speed) ? 60 : game.boost ? 40 : 26;
    }
    const dv = target - game.speed;
    game.speed += Math.sign(dv) * Math.min(Math.abs(dv), acc * dt);
    game.s = THREE.MathUtils.clamp(game.s + game.speed * dt, 0, route.length);

    if (dir !== 0 && (goal - game.s) * dir <= 0.05) {
      game.s = goal; // arrived: snap onto the checkpoint
      game.speed = 0;
      game.travel = null;
      st.locked = go;
      st.goal = null;
    }
    }

    route.at(game.s, st.pt);
    game.x = st.pt.x;
    game.z = st.pt.z;
    const dh = Math.atan2(Math.sin(st.pt.heading - game.heading), Math.cos(st.pt.heading - game.heading));
    game.heading += dh * (1 - Math.exp(-10 * dt));

    // ---- terrain conforming ----
    const sh = Math.sin(game.heading);
    const ch = Math.cos(game.heading);
    const L = rig.halfLen;
    const W = rig.halfWid;
    const H = (f: number, l: number) => ter.heightAt(game.x + sh * f + ch * l, game.z + ch * f - sh * l);
    const hFL = H(L, W);
    const hFR = H(L, -W);
    const hBL = H(-L, W);
    const hBR = H(-L, -W);
    const tY = (hFL + hFR + hBL + hBR) / 4 - 0.1 + rig.hover; // hover > 0: a helicopter, it floats above the ground
    const tPitch = Math.atan2((hFL + hFR) / 2 - (hBL + hBR) / 2, 2 * L);
    const tRoll = Math.atan2((hFL + hBL) / 2 - (hFR + hBR) / 2, 2 * W);
    if (Number.isNaN(st.y)) {
      st.y = tY;
      st.pitch = tPitch;
      st.roll = tRoll;
    }
    st.y = damp(st.y, tY, 12, dt);
    st.pitch = damp(st.pitch, tPitch, 8, dt);
    st.roll = damp(st.roll, tRoll, 8, dt);

    // ---- body animation: lean on acceleration + engine rumble ----
    const accel = (game.speed - st.prevSpeed) / Math.max(dt, 1e-3);
    st.prevSpeed = game.speed;
    st.accel = damp(st.accel, accel, 6, dt);
    const sr = Math.min(1, Math.abs(game.speed) / config.maxSpeed);
    const flying = rig.hover > 0;
    const extraPitch = THREE.MathUtils.clamp(st.accel * 0.0022 * (flying ? 3 : 1), flying ? -0.18 : -0.06, flying ? 0.18 : 0.06);
    const rumble = sr * (game.boost ? 1.6 : 1);
    const vibP = rumble * (Math.sin(t * 47) * 0.004 + Math.sin(t * 31) * 0.003);
    const vibY = flying ? Math.sin(t * 1.7) * 0.22 : rumble * Math.abs(Math.sin(t * 23)) * 0.05; // a helicopter bobs instead of rumbling

    game.y = st.y;
    b.position.set(game.x, st.y + vibY, game.z);
    b.rotation.set(-(st.pitch + extraPitch) + vibP, game.heading, st.roll - vibP, "YXZ");
    b.updateMatrixWorld(true);
    game.quaternion.copy(b.quaternion);

    // ---- wheel spin: distance rolled / radius (forward = +z = positive rotation about x) ----
    for (const w of rig.spinners) w.obj.rotation.x += (game.speed * dt) / w.radius;
    for (const r of rig.rotors) r.obj.rotation.y += r.rate * (0.6 + 0.4 * sr) * dt;

    // ---- wheel world positions (for dust / tracks) ----
    for (let i = 0; i < rig.wheels.length; i++) {
      a.localToWorld(tmp.copy(rig.wheels[i]));
      game.wheels[i]?.set(tmp.x, ter.heightAt(tmp.x, tmp.z) + 0.12, tmp.z);
    }
  });

  return (
    <group ref={body}>
      <group ref={align}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}
