import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Kit to build the procedural vehicles in the flat illustration style (docs/design.md): every surface is one of THREE tones of one hue, chosen by
 * the angle to a fixed light, or pinned to one tone (windows, tyres, solar cells, lenses...). No outlines, textures or gradients.
 *
 * A vehicle is drawn with primitives (boxes, cylinders, tubes, prisms, lofts...) that are baked into ONE mesh for the body and ONE per wheel:
 * the tone of each triangle travels in a vertex attribute, so a detailed model still costs a handful of draw calls.
 * Units are scene units; the vehicle drives along +z, its wheels touch y = 0 and it is centred on x/z.
 */

export type VehiclePalette = { dark: string; mid: string; light: string; bg: string };

export type VehicleRig = {
  root: THREE.Group;
  wheels: THREE.Vector3[]; // ground contact points (local space)
  spinners: { obj: THREE.Object3D; radius: number }[]; // wheel pivots: rotate about x by distance / radius
  halfLen: number; // wheelbase half-length / half-track (to follow the terrain)
  halfWid: number;
  hover: number; // height above the ground the whole vehicle floats at (helicopters); 0 = on its wheels
  rotors: { obj: THREE.Object3D; rate: number }[]; // pivots that turn about y at `rate` rad/s (negative = the other way)
  size: THREE.Vector3;
  center: THREE.Vector3; // centre of the bounding box (to frame the vehicle in the card)
  dispose: () => void;
};

/** Tone of a surface: LIT follows the light (dark / mid / light by angle); the others pin it. */
export const LIT = -1;
export const DARK = 0;
export const MID = 1;
export const LIGHT = 2;
export type Tone = -1 | 0 | 1 | 2;

export type V3 = [number, number, number];
type Axis = "x" | "y" | "z";
type Opt = { tone?: Tone; rot?: V3 };

/** Fixed light that decides the tone of each face (world space, so the shading changes as the vehicle turns). */
const SUN = new THREE.Vector3(0.55, 0.75, 0.4).normalize();

export function toon(p: VehiclePalette) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uDark: { value: new THREE.Color(p.dark) },
      uMid: { value: new THREE.Color(p.mid) },
      uLight: { value: new THREE.Color(p.light) },
      uL: { value: SUN },
    },
    vertexShader: `
      attribute float tone;
      varying vec3 vN;
      varying float vTone;
      void main() {
        vN = mat3(modelMatrix) * normal;
        vTone = tone;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uDark; uniform vec3 uMid; uniform vec3 uLight; uniform vec3 uL;
      varying vec3 vN;
      varying float vTone;
      void main() {
        float d = dot(normalize(gl_FrontFacing ? vN : -vN), uL);
        float t = vTone > -0.5 ? vTone : (d > 0.65 ? 2.0 : (d > 0.45 ? 1.0 : 0.0));
        vec3 c = t > 1.5 ? uLight : (t > 0.5 ? uMid : uDark);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

const AXIS_ROT: Record<Axis, (g: THREE.BufferGeometry) => void> = {
  x: (g) => g.rotateZ(-Math.PI / 2), // +y → +x
  y: () => {},
  z: (g) => g.rotateX(Math.PI / 2), // +y → +z
};

export class Kit {
  wheels: THREE.Vector3[] = [];
  private stack: THREE.Matrix4[] = [new THREE.Matrix4()];
  private body: THREE.BufferGeometry[] = [];
  private target = this.body;
  private spun: { x: number; z: number; r: number; geos: THREE.BufferGeometry[] }[] = [];
  private turning: { pos: V3; rate: number; geos: THREE.BufferGeometry[] }[] = [];

  private palette: VehiclePalette;

  constructor(palette: VehiclePalette) {
    this.palette = palette;
  }

  // ---- transforms -------------------------------------------------------------------------------------------------------------------

  private xf(x: number, y: number, z: number, rot?: V3) {
    const m = new THREE.Matrix4();
    if (rot) m.makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], "YXZ"));
    return m.setPosition(x, y, z);
  }

  /** Draw a sub-assembly in its own frame (position + YXZ rotation), e.g. a tilted dish or a camera head. */
  at(pos: V3, rot: V3 | null, draw: () => void) {
    this.stack.push(this.stack[this.stack.length - 1].clone().multiply(this.xf(pos[0], pos[1], pos[2], rot ?? undefined)));
    draw();
    this.stack.pop();
  }

  private put(geo: THREE.BufferGeometry, tone: Tone, local?: THREE.Matrix4) {
    let g = geo;
    if (g.index) {
      g = geo.toNonIndexed();
      geo.dispose();
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    const m = this.stack[this.stack.length - 1];
    g.applyMatrix4(local ? m.clone().multiply(local) : m);
    g.setAttribute("tone", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(tone), 1));
    this.target.push(g);
  }

  // ---- primitives -------------------------------------------------------------------------------------------------------------------

  /** Box centred on (x, y, z). `r` rounds its edges (the curved tone boundaries of the illustration style). */
  box(w: number, h: number, d: number, x: number, y: number, z: number, o: Opt & { r?: number } = {}) {
    const r = Math.min(o.r ?? 0, w / 2, h / 2, d / 2);
    this.put(r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d), o.tone ?? LIT, this.xf(x, y, z, o.rot));
  }

  /** Cylinder along an axis, centred on (x, y, z). `r2` = radius at the +axis end (cone / frustum); `seg` = sides (6 = hexagon). */
  cyl(r: number, len: number, axis: Axis, x: number, y: number, z: number, o: Opt & { r2?: number; seg?: number } = {}) {
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, len, o.seg ?? 20);
    AXIS_ROT[axis](g);
    this.put(g, o.tone ?? LIT, this.xf(x, y, z, o.rot));
  }

  /** Strut from a to b (a cylinder between two points), `r2` = radius at b. */
  tube(a: V3, b: V3, r: number, o: { tone?: Tone; r2?: number; seg?: number } = {}) {
    const va = new THREE.Vector3(...a);
    const dir = new THREE.Vector3(...b).sub(va);
    const len = dir.length();
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, len, o.seg ?? 10);
    const m = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    m.setPosition(va.addScaledVector(dir, len / 2));
    this.put(g, o.tone ?? LIT, m);
  }

  /** Sphere (or ellipsoid with `s`). */
  ball(r: number, x: number, y: number, z: number, o: Opt & { s?: V3 } = {}) {
    const g = new THREE.SphereGeometry(r, 18, 12);
    if (o.s) g.scale(o.s[0], o.s[1], o.s[2]);
    this.put(g, o.tone ?? LIT, this.xf(x, y, z, o.rot));
  }

  /** Ring (torus) around an axis: R = radius of the ring, r = radius of its tube. */
  ring(R: number, r: number, axis: Axis, x: number, y: number, z: number, o: Opt & { seg?: number } = {}) {
    const g = new THREE.TorusGeometry(R, r, 8, o.seg ?? 28);
    if (axis === "x") g.rotateY(Math.PI / 2);
    if (axis === "y") g.rotateX(Math.PI / 2);
    this.put(g, o.tone ?? LIT, this.xf(x, y, z, o.rot));
  }

  private extrude(pts: [number, number][], depth: number) {
    const shape = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  }

  /** Flat plate: polygon [x, z][] on the ground plane, from height y up to y + h (decks, solar panels). */
  prism(pts: [number, number][], y: number, h: number, o: Opt = {}) {
    const g = this.extrude(pts.map(([x, z]) => [x, -z]), h);
    g.rotateX(-Math.PI / 2);
    this.put(g, o.tone ?? LIT, this.xf(0, y, 0, o.rot));
  }

  /** Side profile: polygon [z, y][] extruded across the vehicle, `w` wide and centred on x (bodies, brackets, fins). */
  slab(pts: [number, number][], x: number, w: number, o: Opt = {}) {
    const g = this.extrude(pts.map(([z, y]) => [-z, y]), w);
    g.rotateY(Math.PI / 2);
    this.put(g, o.tone ?? LIT, this.xf(x - w / 2, 0, 0, o.rot));
  }

  /** Front profile: polygon [x, y][] extruded along z, `d` deep and centred on z. */
  panel(pts: [number, number][], z: number, d: number, o: Opt = {}) {
    this.put(this.extrude(pts, d), o.tone ?? LIT, this.xf(0, 0, z - d / 2, o.rot));
  }

  /** Solid of revolution about +y from a profile [radius, y][] (dishes, domes, nozzles). */
  lathe(profile: [number, number][], x: number, y: number, z: number, o: Opt & { seg?: number } = {}) {
    const g = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), o.seg ?? 24);
    this.put(g, o.tone ?? LIT, this.xf(x, y, z, o.rot));
  }

  /**
   * Skin over a list of closed rings with the same number of points (hulls, fairings): smooth normals, one tone per quad
   * (`paint(ring, segment)` lets windows be painted on the hull). The two ends are closed with flat caps.
   */
  loft(rings: V3[][], o: { tone?: Tone; paint?: (i: number, j: number) => Tone; caps?: [Tone | null, Tone | null] } = {}) {
    const n = rings.length;
    const m = rings[0].length;
    const P = rings.map((ring) => ring.map((p) => new THREE.Vector3(...p)));
    const N = P.map((ring, i) =>
      ring.map((_, j) => {
        const du = P[Math.min(i + 1, n - 1)][j].clone().sub(P[Math.max(i - 1, 0)][j]);
        const dv = ring[(j + 1) % m].clone().sub(ring[(j + m - 1) % m]);
        return dv.cross(du).normalize();
      }),
    );
    const byTone = new Map<Tone, { pos: number[]; nrm: number[] }>();
    const bucket = (t: Tone) => byTone.get(t) ?? byTone.set(t, { pos: [], nrm: [] }).get(t)!;
    const tri = (t: Tone, a: [number, number], b: [number, number], c: [number, number]) => {
      const out = bucket(t);
      for (const [i, j] of [a, b, c]) {
        out.pos.push(...P[i][j].toArray());
        out.nrm.push(...N[i][j].toArray());
      }
    };
    for (let i = 0; i < n - 1; i++)
      for (let j = 0; j < m; j++) {
        const t = o.paint ? o.paint(i, j) : (o.tone ?? LIT);
        const k = (j + 1) % m;
        tri(t, [i, j], [i + 1, k], [i + 1, j]); // wound like the normals (dv × du), so the front face is the outside
        tri(t, [i, j], [i, k], [i + 1, k]);
      }
    for (const [t, { pos, nrm }] of byTone) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
      this.put(g, t);
    }
    (o.caps ?? [LIT, LIT]).forEach((t, e) => {
      if (t === null) return;
      const ring = P[e === 0 ? 0 : n - 1];
      const c = ring.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / m);
      const pos: number[] = [];
      for (let j = 0; j < m; j++) pos.push(...c.toArray(), ...ring[j].toArray(), ...ring[(j + 1) % m].toArray());
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      this.put(g, t);
    });
  }

  // ---- wheels -----------------------------------------------------------------------------------------------------------------------

  /**
   * A wheel of radius r touching the ground at (x, 0, z). `draw` builds it centred on the origin with its axle along x and its OUTER face
   * towards +x (left wheels are turned round, so details like hub caps always face out). It becomes one mesh that spins about x.
   */
  wheel(x: number, z: number, r: number, draw: () => void) {
    const geos: THREE.BufferGeometry[] = [];
    const [stack, target] = [this.stack, this.target];
    this.stack = [x < 0 ? new THREE.Matrix4().makeRotationY(Math.PI) : new THREE.Matrix4()];
    this.target = geos;
    draw();
    this.stack = stack;
    this.target = target;
    this.spun.push({ x, z, r, geos });
    this.wheels.push(new THREE.Vector3(x, 0, z));
  }

  /** A part that turns about the vertical axis through `pos` at `rate` rad/s (rotors). `draw` builds it centred on the origin of that pivot. */
  rotor(pos: V3, rate: number, draw: () => void) {
    const geos: THREE.BufferGeometry[] = [];
    const [stack, target] = [this.stack, this.target];
    this.stack = [new THREE.Matrix4()];
    this.target = geos;
    draw();
    this.stack = stack;
    this.target = target;
    this.turning.push({ pos, rate, geos });
  }

  /** Generic tyre: dark tread with `cleats` raised bars (a toothed silhouette), a recessed mid-tone rim and a light hub with spokes. */
  tyre(r: number, w: number, o: { cleats?: number; spokes?: number; hub?: number; curved?: boolean } = {}) {
    const cleats = o.cleats ?? 16;
    const spokes = o.spokes ?? 6;
    const hub = o.hub ?? 0.3;
    this.cyl(r * 0.94, w, "x", 0, 0, 0, { tone: DARK, seg: 28 }); // tread
    for (let i = 0; i < cleats; i++) {
      const a = (i / cleats) * Math.PI * 2;
      this.box(w, r * 0.1, r * 0.16, 0, Math.cos(a) * r * 0.955, Math.sin(a) * r * 0.955, { tone: DARK, rot: [a, 0, 0] });
    }
    this.cyl(r * 0.74, 0.06, "x", w / 2 - 0.02, 0, 0, { tone: MID, seg: 28 }); // rim, set into the tyre
    this.cyl(r * 0.74, 0.06, "x", -w / 2 + 0.02, 0, 0, { tone: MID, seg: 28 });
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const lean = o.curved ? 0.55 : 0;
      const len = r * (0.74 - hub * 0.6);
      const mid = r * (hub * 0.5 + 0.37);
      this.box(0.1, len, r * 0.13, w / 2 + 0.02, Math.cos(a) * mid, Math.sin(a) * mid, { tone: LIGHT, rot: [a + lean, 0, 0] });
    }
    this.cyl(r * hub, 0.16, "x", w / 2 + 0.04, 0, 0, { tone: LIGHT, seg: 16 }); // hub cap
    this.cyl(r * hub * 0.45, 0.1, "x", w / 2 + 0.14, 0, 0, { tone: MID, seg: 12 });
  }

  // ---- result -----------------------------------------------------------------------------------------------------------------------

  finish(o: { halfLen?: number; halfWid?: number; hover?: number } = {}): VehicleRig {
    const material = toon(this.palette);
    const root = new THREE.Group();
    const made: THREE.BufferGeometry[] = [];
    const mesh = (geos: THREE.BufferGeometry[]) => {
      const g = mergeGeometries(geos);
      geos.forEach((x) => x.dispose());
      made.push(g);
      const m = new THREE.Mesh(g, material);
      m.castShadow = true;
      return m;
    };
    root.add(mesh(this.body));
    const spinners: VehicleRig["spinners"] = [];
    for (const w of this.spun) {
      const pivot = new THREE.Group();
      pivot.position.set(w.x, w.r, w.z);
      pivot.add(mesh(w.geos));
      root.add(pivot);
      spinners.push({ obj: pivot, radius: w.r });
    }
    const rotors: VehicleRig["rotors"] = [];
    for (const t of this.turning) {
      const pivot = new THREE.Group();
      pivot.position.set(...t.pos);
      pivot.add(mesh(t.geos));
      root.add(pivot);
      rotors.push({ obj: pivot, rate: t.rate });
    }
    const box = new THREE.Box3().setFromObject(root);
    const ext = (a: number[]) => (Math.max(...a) - Math.min(...a)) / 2;
    return {
      root,
      wheels: this.wheels,
      spinners,
      halfLen: o.halfLen ?? ext(this.wheels.map((w) => w.z)),
      halfWid: o.halfWid ?? ext(this.wheels.map((w) => w.x)),
      hover: o.hover ?? 0,
      rotors,
      size: box.getSize(new THREE.Vector3()),
      center: box.getCenter(new THREE.Vector3()),
      dispose: () => {
        made.forEach((g) => g.dispose());
        material.dispose();
      },
    };
  }
}

/** Cut a convex polygon [x, z][] into rows along z, `gap` apart (rows of solar cells). */
export function rows(poly: [number, number][], step: number, gap: number): [number, number][][] {
  const zs = poly.map((p) => p[1]);
  const z0 = Math.min(...zs);
  const z1 = Math.max(...zs);
  const n = Math.max(1, Math.round((z1 - z0) / step));
  const h = (z1 - z0) / n;
  const clip = (pts: [number, number][], z: number, above: boolean) => {
    const out: [number, number][] = [];
    const inside = (p: [number, number]) => (above ? p[1] >= z : p[1] <= z);
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      if (inside(p)) out.push(p);
      if (inside(p) !== inside(q)) {
        const t = (z - p[1]) / (q[1] - p[1]);
        out.push([p[0] + (q[0] - p[0]) * t, z]);
      }
    });
    return out;
  };
  const out: [number, number][][] = [];
  for (let i = 0; i < n; i++) {
    const band = clip(clip(poly, z0 + i * h + gap / 2, true), z0 + (i + 1) * h - gap / 2, false);
    if (band.length >= 3) out.push(band);
  }
  return out;
}
