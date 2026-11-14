"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "@/lib/game";

const MAX = 2600;
const SPACING = 1.3;

export default function Tracks({ color, opacity }: { color: string; opacity: number }) {
  const s = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1.0, 1.5);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: "#4e2412",
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, MAX);
    mesh.frustumCulled = false;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX; i++) mesh.setMatrixAt(i, zero);
    return {
      mesh,
      last: [] as THREE.Vector3[],
      cursor: 0,
      m: new THREE.Matrix4(),
      one: new THREE.Vector3(1, 1, 1),
    };
  }, []);

  useEffect(() => {
    const m = s.mesh.material as THREE.MeshBasicMaterial;
    m.color.set(color);
    m.opacity = opacity;
  }, [s, color, opacity]);

  useFrame(() => {
    if (Math.abs(game.speed) < 1) return;
    let dirty = false;
    game.wheels.forEach((w, i) => {
      const last = (s.last[i] ??= new THREE.Vector3(1e9, 0, 1e9));
      if (last.distanceTo(w) < SPACING) return;
      last.copy(w);
      s.m.compose(w, game.quaternion, s.one);
      s.mesh.setMatrixAt(s.cursor, s.m);
      s.cursor = (s.cursor + 1) % MAX;
      dirty = true;
    });
    if (dirty) s.mesh.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={s.mesh} />;
}
