"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "@/lib/game";
import type { DustConfig } from "@/lib/missions";

const N = 1600;

const vert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
uniform float uScale;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(uColor, a * vAlpha);
}`;

export default function Dust({ config }: { config: DustConfig }) {
  const sim = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const aSize = new Float32Array(N);
    const aAlpha = new Float32Array(N);
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: { uScale: { value: 1 }, uColor: { value: new THREE.Color("#e2ab80") } },
    });
    return {
      geometry,
      material,
      pos,
      aSize,
      aAlpha,
      vel: new Float32Array(N * 3),
      age: new Float32Array(N).fill(1e9),
      life: new Float32Array(N).fill(1),
      size0: new Float32Array(N),
      cursor: 0,
      acc: [] as number[],
    };
  }, []);

  useEffect(() => {
    sim.material.uniforms.uColor.value.set(config.color);
  }, [sim, config.color]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const { pos, vel, age, life, size0, aSize, aAlpha } = sim;
    const cam = state.camera as THREE.PerspectiveCamera;
    sim.material.uniforms.uScale.value =
      (state.size.height * state.viewport.dpr * 0.5) / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);

    // spawn
    const sp = Math.abs(game.speed);
    const rate = Math.max(0, sp - 1.5) * (game.boost ? 2.6 : 1.5);
    const sign = Math.sign(game.speed || 1);
    const dirX = Math.sin(game.heading) * sign;
    const dirZ = Math.cos(game.heading) * sign;
    game.wheels.forEach((w, i) => {
      sim.acc[i] = (sim.acc[i] ?? 0) + rate * dt;
      while (sim.acc[i] >= 1) {
        sim.acc[i] -= 1;
        const k = sim.cursor;
        sim.cursor = (k + 1) % N;
        const r = () => Math.random() - 0.5;
        pos[k * 3] = w.x + r() * 0.8;
        pos[k * 3 + 1] = w.y + 0.1;
        pos[k * 3 + 2] = w.z + r() * 0.8;
        vel[k * 3] = -dirX * sp * 0.1 + r() * 2.4;
        vel[k * 3 + 1] = (1.2 + Math.random() * 2.4) * config.up;
        vel[k * 3 + 2] = -dirZ * sp * 0.1 + r() * 2.4;
        age[k] = 0;
        life[k] = (1 + Math.random() * 1.1) * config.life;
        size0[k] = (1.4 + Math.random() * 1.8) * config.size;
      }
    });

    // update
    const drag = Math.exp(-config.drag * dt);
    for (let k = 0; k < N; k++) {
      if (age[k] >= life[k]) {
        aSize[k] = 0;
        aAlpha[k] = 0;
        continue;
      }
      age[k] += dt;
      const t = age[k] / life[k];
      vel[k * 3] *= drag;
      vel[k * 3 + 1] = vel[k * 3 + 1] * drag + config.lift * dt;
      vel[k * 3 + 2] *= drag;
      pos[k * 3] += vel[k * 3] * dt;
      pos[k * 3 + 1] += vel[k * 3 + 1] * dt;
      pos[k * 3 + 2] += vel[k * 3 + 2] * dt;
      aSize[k] = size0[k] * (0.6 + 2.2 * t);
      aAlpha[k] = Math.min(1, age[k] / 0.08) * Math.pow(1 - t, 1.6) * config.alpha;
    }
    const g = sim.geometry.attributes;
    g.position.needsUpdate = true;
    g.aSize.needsUpdate = true;
    g.aAlpha.needsUpdate = true;
  });

  return <points geometry={sim.geometry} material={sim.material} frustumCulled={false} renderOrder={5} />;
}
