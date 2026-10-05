import * as T from 'three';
import { box, sphere, rod, cylinder, torus, line, tube, mark, material } from '../graphics';
import { softBox, ellipsoid, glass, label, gear } from './helpers';
import { frame, ground, hide, type Appearance } from '../presentation';
import { TAU, lerp, type V3 } from '../math';
import type { SceneContext } from '../types';
function robot(parent: T.Object3D, color: number) {
  const g = new T.Group();
  parent.add(g);
  const metal = 0xe0e3df,
    dark = 0x202930;
  ellipsoid(g, [0.63, 0.65, 0.33], [0, 2.65, 0], dark);
  const chest = softBox(g, [1.14, 0.56, 0.48], [0, 2.9, 0.11], color, 0.16);
  chest.rotation.z = 0.02;
  for (const side of [-1, 1]) {
    const p = softBox(g, [0.4, 0.36, 0.19], [side * 0.32, 2.74, 0.4], metal, 0.1);
    p.rotation.z = side * 0.3;
    ellipsoid(g, [0.39, 0.28, 0.36], [side * 0.76, 2.97, 0], color);
    torus(g, 0.21, 0.045, [side * 0.77, 2.98, 0.3], metal);
    rod(g, [side * 0.82, 2.8, 0], [side * 1.01, 2.13, 0.08], 0.17, dark);
    ellipsoid(g, [0.24, 0.4, 0.24], [side * 0.93, 2.47, 0.05], metal);
    sphere(g, 0.18, [side * 1.02, 2.04, 0.09], dark);
    softBox(g, [0.38, 0.55, 0.37], [side * 1.1, 1.72, 0.08], color, 0.1);
    softBox(g, [0.33, 0.23, 0.3], [side * 1.12, 1.33, 0.15], dark, 0.08);
    for (let j = 0; j < 4; j++)
      rod(
        g,
        [side * 1.1 + j * 0.06 - 0.08, 1.32, 0.3],
        [side * 1.1 + j * 0.06 - 0.08, 1.12, 0.3],
        0.035,
        metal,
      );
    const hip = [side * 0.3, 1.75, 0] as V3,
      knee = [side * 0.48, 0.96, 0.06] as V3,
      foot = [side * 0.55, 0.17, 0.13] as V3;
    rod(g, hip, knee, 0.2, dark);
    ellipsoid(g, [0.28, 0.45, 0.25], [side * 0.41, 1.42, 0], metal);
    softBox(g, [0.37, 0.29, 0.28], knee, color, 0.07);
    rod(g, knee, foot, 0.17, dark);
    softBox(g, [0.38, 0.59, 0.35], [side * 0.53, 0.54, 0.06], color, 0.1);
    softBox(g, [0.47, 0.18, 0.7], [side * 0.55, 0.13, 0.25], metal, 0.08);
  }
  for (let i = 0; i < 4; i++)
    softBox(
      g,
      [0.6 - i * 0.07, 0.13, 0.33],
      [0, 2.22 - i * 0.13, 0.21],
      i % 2 ? color : metal,
      0.06,
    );
  softBox(g, [0.82, 0.28, 0.46], [0, 1.83, 0], dark, 0.09);
  rod(g, [0, 3.19, 0], [0, 3.4, 0], 0.12, metal);
  ellipsoid(g, [0.31, 0.38, 0.29], [0, 3.65, 0], metal);
  softBox(g, [0.53, 0.12, 0.06], [0, 3.72, 0.27], 0x364d56, 0.025);
  softBox(g, [0.35, 0.09, 0.055], [0, 3.72, 0.32], 0x8ed9c7, 0.025);
  softBox(g, [0.35, 0.24, 0.22], [0, 3.45, 0.14], color, 0.07);
  g.traverse((o) => {
    if (o instanceof T.Mesh && o.material instanceof T.MeshStandardMaterial) {
      o.material.metalness = 0.65;
      o.material.roughness = 0.26;
      o.userData.armor = o.material.color.getHex() === color;
    }
  });
  return g;
}
function hauler(p: T.Object3D, tint = 0xf2924f) {
  const g = new T.Group();
  p.add(g);
  softBox(g, [4.1, 1.5, 1.7], [0, 2.2, 0], 0xe5e4dd, 0.2);
  softBox(g, [1.1, 1.4, 1.74], [-1.15, 2.2, 0], tint, 0.1);
  const cabin = ellipsoid(g, [0.92, 0.7, 0.8], [-2.12, 2.21, 0], 0x686f83);
  (cabin.material as T.MeshStandardMaterial).metalness = 0.8;
  (cabin.material as T.MeshStandardMaterial).roughness = 0.2;
  for (const z of [-0.67, 0.67]) rod(g, [-2.69, 1.95, z], [-1.55, 2.74, z], 0.04, 0xe3ded1);
  for (let i = 0; i < 12; i++)
    softBox(g, [0.22, 0.21, 0.035], [i * 0.29 - 1.35, 2.55, 0.88], i % 4 ? 0xaba9a7 : tint, 0.03);
  for (const side of [-1, 1]) {
    const e = new T.Group();
    e.position.set(0.7, 2.07, side * 1.35);
    g.add(e);
    cylinder(e, 0.56, 1.5, [0, 0, 0], 0xe1ded7).rotation.z = Math.PI / 2;
    cylinder(e, 0.58, 0.22, [-0.78, 0, 0], tint).rotation.z = Math.PI / 2;
    torus(e, 0.38, 0.1, [-0.91, 0, 0], 0x676a7a).rotation.y = Math.PI / 2;
    const glow = sphere(e, 0.23, [1, 0, 0], 0x69b3d7);
    (glow.material as T.MeshStandardMaterial).emissive.setHex(0x156285);
    softBox(g, [0.6, 0.38, 0.6], [0.7, 1.27, side * 0.75], tint);
  }
  for (let i = 0; i < 4; i++)
    softBox(g, [0.5, 0.15, 0.55], [i * 0.85 - 1.1, 3.01, 0], 0xb5b5bd, 0.05);
  for (const x of [-1.4, 1.4]) rod(g, [x, 3, 0], [x, 3.65, 0], 0.028, 0x878d98);
  return g;
}
function tree(p: T.Object3D, pos: V3, scale = 1) {
  const g = new T.Group();
  p.add(g);
  g.position.set(...pos);
  g.scale.setScalar(scale);
  rod(g, [0, 0, 0], [0, 1.65, 0], 0.09, 0x947452);
  for (let i = 0; i < 3; i++) {
    const m = new T.Mesh(
      new T.IcosahedronGeometry(0.72, 1),
      new T.MeshStandardMaterial({ color: [0xa5bf6d, 0xb0c878, 0x86a961][i], flatShading: true }),
    );
    m.position.set((i - 1) * 0.34, 1.65 + (i % 2) * 0.3, 0);
    g.add(m);
  }
  return g;
}
export function spatialAppearance(c: SceneContext): Appearance | undefined {
  const { spec, state: s, group: g } = c;
  if (spec.slug === 'skeleton-explorer') {
    hide(c);
    frame(c, [10, 6, 12], [0, 2.2, 0], 0x080808);
    const bone = 0xc8bfa9;
    const root = new T.Group();
    g.add(root);
    const spine: V3[] = Array.from({ length: 14 }, (_, i) => [
      i * 0.19 - 1.3,
      2.8 + 0.12 * Math.sin(i * 0.25),
      0,
    ]);
    tube(root, spine, 0.075, bone);
    spine.forEach((p) => ellipsoid(root, [0.16, 0.1, 0.14], p, bone));
    for (let i = 0; i < 11; i++) {
      const x = -1.1 + i * 0.21;
      for (const side of [-1, 1])
        tube(
          root,
          [
            [x, 2.8, 0],
            [x, 2.65, side * 0.52],
            [x, 2.1, side * 0.64],
            [x, 1.85, side * 0.15],
          ],
          0.038,
          bone,
        );
    }
    for (let i = 0; i < 15; i++) {
      const t = i / 14,
        p: [number, number, number] = [
          -1.4 - t * 2.5,
          2.7 + t * 0.8 + Math.sin(t * 3) * 0.4,
          Math.sin(t * 3) * 0.25,
        ];
      ellipsoid(root, [0.13 - t * 0.06, 0.09, 0.12 - t * 0.06], p, bone);
    }
    tube(
      root,
      [
        [1.3, 2.8, 0],
        [1.65, 3.1, 0],
        [1.8, 3.5, 0],
        [2.0, 3.8, 0],
      ],
      0.11,
      bone,
    );
    ellipsoid(root, [0.48, 0.4, 0.3], [2.15, 3.8, 0], bone);
    ellipsoid(root, [0.34, 0.23, 0.23], [2.5, 3.6, 0], bone);
    for (const side of [-1, 1]) {
      sphere(root, 0.095, [2.34, 3.86, side * 0.25], 0x0e0d0d);
      tube(
        root,
        [
          [2, 4, 0.1 * side],
          [1.8, 4.4, side * 0.26],
          [1.95, 4.7, side * 0.15],
        ],
        0.07,
        bone,
      );
      rod(root, [2.08, 3.38, side * 0.2], [2.68, 3.37, side * 0.2], 0.055, bone);
      for (let j = 0; j < 6; j++) {
        const tooth = new T.Mesh(new T.ConeGeometry(0.026, 0.11, 7), material(bone));
        tooth.position.set(2.22 + j * 0.067, 3.46, side * 0.17);
        tooth.rotation.z = Math.PI;
        root.add(tooth);
      }
    }
    for (const x of [-1.0, 1.05])
      for (const side of [-1, 1]) {
        const a = [x, 2.7, side * 0.45] as V3,
          b = [x + 0.25, 1.65, side * 0.65] as V3,
          d = [x - 0.1, 0.65, side * 0.8] as V3;
        rod(root, a, b, 0.07, bone);
        rod(root, b, d, 0.055, bone);
        sphere(root, 0.12, b, bone);
        for (let j = 0; j < 3; j++)
          tube(
            root,
            [d, [x - 0.1 + j * 0.09, 0.25, side * 0.9], [x + 0.2 + j * 0.12, 0.17, side * 1.2]],
            0.032,
            bone,
          );
      }
    for (const side of [-1, 1]) {
      const a = [0.8, 2.9, side * 0.3] as V3,
        b = [-0.2, 3.8, side * 1.1] as V3,
        d = [0.5, 4.25, side * 2] as V3;
      rod(root, a, b, 0.09, bone);
      rod(root, b, d, 0.065, bone);
      for (let j = 0; j < 4; j++)
        tube(
          root,
          [
            d,
            [-0.8 - j * 0.35, 3.7, side * (2.1 + j * 0.2)],
            [-1.5 - j * 0.25, 2.95, side * (1.4 + j * 0.2)],
          ],
          0.03,
          bone,
        );
    }
    return {
      update() {
        root.rotation.y = s.time * 0.12;
        root.scale.setScalar(0.9 + s.parameter * 0.05);
      },
    };
  }
  if (spec.slug === 'character-selection' || spec.slug === 'robot-roster') {
    hide(c);
    const roster = spec.slug === 'robot-roster';
    frame(c, [8, 4.8, 12], [0, 1.9, 0], roster ? 0xdeddf0 : 0xd1d2d8);
    ground(c, roster ? 0xc7c4e5 : 0xc7c8cf);
    const model = robot(g, roster ? 0xc74d46 : 0x96bc42);
    mark(model, 'scout');
    model.scale.setScalar(1.35);
    const colors = [0x91b545, 0x48a1c8, 0xaa5dd0];
    const ids = ['scout', 'engineer', 'guardian'];
    const mini = ids.map((id, i) => {
      const m = robot(g, colors[i]);
      m.position.set(-4.2 + i * 1.1, 0.1, 1);
      m.scale.setScalar(0.35);
      mark(m, id);
      softBox(g, [0.85, 1.8, 0.08], [-4.2 + i * 1.1, 1, 0.8], 0xeeeeed);
      return m;
    });
    model.position.x = 0.8;
    const armPivots = [-1, 1].map((side) => {
      const pivot = new T.Group();
      pivot.position.set(side * 0.72, 2.97, 0);
      for (const child of [...model.children])
        if (child.position.x * side > 0.69 && child.position.y > 1.0 && child.position.y < 3.25) {
          model.remove(child);
          child.position.sub(pivot.position);
          pivot.add(child);
        }
      model.add(pivot);
      return pivot;
    });
    return {
      update() {
        armPivots.forEach(
          (p, i) =>
            (p.rotation.z = (i === 0 ? -1 : 1) * (0.12 + Math.sin(s.time * 0.8 + i) * 0.16)),
        );
        model.rotation.y = -0.25 + Math.sin(s.time * 0.35) * 0.12;
        const i = Math.max(0, ids.indexOf(s.selection));
        model.traverse((o) => {
          const m = o as T.Mesh;
          if (m.material instanceof T.MeshStandardMaterial && o.userData.armor)
            m.material.color.setHex(roster ? [0xc74d46, 0x728fc2, 0xd88d48][i] : colors[i]);
        });
        mini.forEach((m, i) => m.scale.setScalar(ids[i] === s.selection ? 0.4 : 0.33));
      },
    };
  }
  if (spec.slug === 'ship-selection') {
    hide(c);
    frame(c, [-9, 6, 12], [0, 2.2, 0], 0xdeddef);
    ground(c, 0xd0cfe6);
    const m = hauler(g);
    mark(m, 'arrow');
    m.scale.setScalar(1.22);
    const ids = ['arrow', 'freighter', 'drifter'];
    const mini = ids.map((id, i) => {
      const m = hauler(g, [0xf2924f, 0x87a9b5, 0xc76454][i]);
      m.position.set((i - 1) * 2.8, 0, 3.9);
      m.scale.setScalar(0.3);
      mark(m, id);
      return m;
    });
    return {
      update() {
        m.rotation.y = Math.sin(s.time * s.parameter) * 0.2;
        m.scale.setScalar(s.selection === 'freighter' ? 1.4 : 1.22);
        mini.forEach((o, i) => (o.position.y = ids[i] === s.selection ? 0.15 : 0));
      },
    };
  }
  if (spec.slug === 'world-environment') {
    const old = hide(c);
    frame(c, [7, 4.3, 11], [0, 2, 0], 0x0c161c);
    ground(c, 0x242e32, 28);
    const actor = robot(g, 0xd7dcda);
    actor.scale.setScalar(1.05);
    const platform = cylinder(g, 2, 0.25, [0, 0.1, 0], 0x3b423f);
    torus(g, 1.7, 0.055, [0, 0.26, 0], 0xd19747).rotation.x = Math.PI / 2;
    for (const side of [-1, 1])
      for (let i = 0; i < 7; i++) {
        const x = side * 5.7,
          z = -7 + i * 2.2;
        box(g, [0.16, 7, 0.24], [x, 3.5, z], 0x39464b);
        box(g, [0.16, 0.13, 2.1], [x, 1.6, z + 0.9], 0x607278);
        softBox(g, [0.2, 0.22, 0.75], [x - side * 0.08, 4.9, z], 0xe89131);
        for (let j = 0; j < 4; j++)
          rod(
            g,
            [x - side * 0.2, 0.8 + j * 0.8, z],
            [x - side * 0.2, 0.8 + j * 0.8, z + 1.8],
            0.045,
            0x607078,
          );
        softBox(g, [0.08, 0.65, 0.75], [x - side * 0.12, 2.7, z], 0x386b77);
      }
    for (let i = 0; i < 8; i++) {
      const z = i * 2 - 8;
      box(g, [11.6, 0.18, 0.22], [0, 6.8, z], 0x354750);
      for (const x of [-4.5, 0, 4.5]) box(g, [0.6, 0.035, 1.3], [x, 6.7, z], 0xa0adb0);
    }
    box(g, [11, 7, 0.25], [0, 3.5, -8.4], 0x1b282e);
    for (const x of [-3.2, 3.2]) box(g, [2, 4, 0.08], [x, 2.2, -8.2], 0x33474f);
    const light = new T.PointLight(0xf99b49, 35, 12);
    light.position.set(-3, 4, 0);
    g.add(light);
    return {
      update() {
        actor.position.x = old[1].position.x;
        actor.position.z = old[1].position.z;
        actor.position.y = 0.22;
        light.intensity = s.variant % 2 ? 8 : 35;
        platform.rotation.y = s.time * 0.015;
      },
    };
  }
  if (spec.slug === 'biological-structure') {
    hide(c);
    frame(c, [9, 8, 12], [0, 2, 0], 0xf1ead8);
    ground(c, 0xece3cc);
    const cell = new T.Group();
    g.add(cell);
    const wall = ellipsoid(cell, [3.7, 0.8, 2.8], [0, 0.95, 0], 0x7f973c);
    const inside = ellipsoid(cell, [3.45, 0.66, 2.56], [0, 1.34, 0], 0xbcc762);
    ellipsoid(cell, [1.5, 0.42, 1.05], [-0.9, 1.87, 0.1], 0x6cadb5);
    glass(cell, [2.2, 0.1, 1.25], [-0.9, 2.18, 0.1], 0x70bdc6, 0.6);
    const nucleus = ellipsoid(cell, [1, 0.84, 0.9], [1.05, 2.12, -0.6], 0x8862ae);
    sphere(cell, 0.36, [1.12, 2.65, -0.45], 0x6a3792);
    for (let i = 0; i < 16; i++) {
      const a = (i * TAU) / 16;
      const p: V3 = [1.05 + Math.cos(a) * 0.92, 2.1 + Math.sin(a) * 0.6, -0.6];
      sphere(cell, 0.055, p, 0xc08ed0);
    }
    for (let k = 0; k < 5; k++)
      tube(
        cell,
        Array.from(
          { length: 20 },
          (_, i) =>
            [
              0.2 + Math.cos(i * 0.35) * (0.7 + k * 0.1),
              1.8 + k * 0.06,
              -0.6 + Math.sin(i * 0.35) * (0.9 + k * 0.1),
            ] as V3,
        ),
        0.045,
        0xab76b3,
      );
    for (let i = 0; i < 7; i++) {
      const a = (i * TAU) / 7,
        x = Math.cos(a) * 2.4,
        z = Math.sin(a) * 1.75;
      const o = ellipsoid(cell, [0.52, 0.24, 0.32], [x, 1.7, z], i % 2 ? 0x80943a : 0xb37e45);
      o.rotation.y = -a;
      for (let j = 0; j < 5; j++) {
        const stripe = torus(cell, 0.17, 0.027, [x, 1.94, z], 0xd6c875);
        stripe.scale.x = 1.6;
        stripe.rotation.x = Math.PI / 2;
        stripe.position.x += Math.cos(a) * ((j - 2) * 0.12);
        stripe.position.z += Math.sin(a) * ((j - 2) * 0.12);
      }
    }
    for (let i = 0; i < 25; i++) {
      const a = i * 2.39,
        r = 1.5 + (i % 4) * 0.35;
      sphere(cell, 0.06, [Math.cos(a) * r, 1.82, Math.sin(a) * r * 0.65], 0xc3ad84);
    }
    return {
      update() {
        cell.rotation.y = s.time * 0.05 * s.parameter;
        nucleus.visible = s.variant % 2 === 0;
        wall.visible = s.variant % 2 === 0;
        inside.visible = true;
      },
    };
  }
  if (spec.slug === 'schematic-transition') {
    hide(c);
    frame(c, [12, 10, 14], [0, 2.2, 0], 0xcec7b1);
    ground(c, 0xc4bfa8, 24);
    const modules: T.Group[] = [];
    for (let l = 0; l < 3; l++)
      for (let i = 0; i < 3 - l; i++) {
        const root = new T.Group();
        root.position.set(i * 2.7 - 2.7, l * 1.75 + 0.2, (l % 2) * 1.6);
        g.add(root);
        root.userData.baseY = root.position.y;
        root.userData.partId = 'part-' + modules.length;
        modules.push(root);
        for (let j = 0; j < 12; j++) box(root, [0.2, 0.1, 2.55], [j * 0.22 - 1.2, 0, 0], 0x9d794c);
        for (const x of [-1.15, 1.15])
          for (const z of [-1.15, 1.15]) rod(root, [x, 0, z], [x, 1.7, z], 0.06, 0x6f5133);
        for (let j = 0; j < 12; j++)
          box(root, [0.18, 0.1, 2.6], [j * 0.22 - 1.2, 1.7, 0], 0x8b693f);
        for (const z of [-1.25, 1.25]) {
          rod(root, [-1.25, 0.7, z], [1.25, 0.7, z], 0.035, 0x524837);
          for (let j = 0; j < 12; j++)
            rod(root, [j * 0.22 - 1.2, 0, z], [j * 0.22 - 1.2, 0.7, z], 0.016, 0x7e7055);
        }
        glass(root, [2.15, 1.45, 0.04], [0, 0.78, -1.11], 0xa9c0a9, 0.25);
        for (let j = 0; j < 6; j++) {
          const leaf = new T.Mesh(new T.IcosahedronGeometry(0.26, 1), material(0x8caa69));
          leaf.position.set(-1.1 + j * 0.41, 0.38, 1.1);
          root.add(leaf);
        }
        mark(root, root.userData.partId);
      }
    for (let i = 0; i < 8; i++) tree(g, [-5 + (i % 2) * 10, 0, -4 + Math.floor(i / 2) * 2.6], 0.6);
    return {
      update() {
        const f = s.parameter;
        modules.forEach((m, i) => {
          m.position.y = m.userData.baseY + f * (i * 0.13);
          m.traverse((o) => {
            const m = o as T.Mesh;
            if (m.material instanceof T.MeshStandardMaterial) m.material.wireframe = f > 0.85;
          });
        });
        c.camera.position.set(lerp(12, 0, f), lerp(10, 20, f), lerp(14, 0.01, f));
        c.target.set(0, 2.2, 0);
      },
    };
  }
  if (spec.slug === 'warehouse-strategy') {
    const old = hide(c);
    frame(c, [11, 10, 13], [0, 0.9, 0], 0xe5ecf7);
    ground(c, 0xe4e9f0, 26);
    const site = new T.Group();
    g.add(site);
    for (let n = 0; n < 3; n++) {
      const x = -2 + n * 2.2;
      softBox(site, [1.65, 1.6, 5.4], [x, 0.8, 0], 0x2874df);
      box(site, [1.82, 0.15, 5.6], [x, 1.7, 0], 0x4c91f5);
      for (let j = 0; j < 20; j++)
        box(site, [1.8, 0.025, 0.035], [x, 1.8, j * 0.27 - 2.6], 0x2165be);
      for (const z of [-2.76, 2.76]) {
        softBox(site, [1.1, 1.3, 0.06], [x, 0.7, z], 0xeae2be);
        for (let j = 0; j < 9; j++)
          box(site, [1.05, 0.022, 0.08], [x, 0.16 + j * 0.14, z + 0.045], 0xcacbc6);
      }
      label(site, 'WARETRACK', [x, 1.48, 2.8], 1.2, '#ecf5ff', '#2874df');
    }
    for (let n = 0; n < 8; n++) {
      const x = -4 + (n % 2) * 8,
        z = -3 + Math.floor(n / 2) * 2;
      for (let j = 0; j < 3; j++)
        softBox(site, [0.65, 0.55, 0.62], [x, 0.3 + j * 0.56, z], 0xbfa173, 0.045);
      box(site, [0.9, 0.08, 0.85], [x, 0.03, z], 0xa88953);
    }
    for (let i = 0; i < 7; i++)
      tree(g, [-5.3 + (i % 2) * 10.6, 0, -5 + Math.floor(i / 2) * 3], 0.6);
    const forklift = new T.Group();
    g.add(forklift);
    softBox(forklift, [0.55, 0.4, 0.85], [0, 0.2, 0], 0xeebf2e);
    for (const x of [-0.25, 0.25])
      for (const z of [-0.28, 0.28])
        torus(forklift, 0.13, 0.06, [x, 0.08, z], 0x242c31).rotation.y = Math.PI / 2;
    for (const x of [-0.23, 0.23]) rod(forklift, [x, 0.2, -0.25], [x, 1, -0.25], 0.035, 0x2c3a44);
    box(forklift, [0.55, 0.07, 0.55], [0, 1, 0], 0x34434b);
    for (const x of [-0.2, 0.2]) rod(forklift, [x, 0.05, 0.4], [x, 0.05, 0.9], 0.035, 0x374049);
    const load = softBox(g, [0.46, 0.42, 0.46], [0, 0, 0], 0xcaa67b);
    return {
      update() {
        forklift.position.copy(old[21].position);
        forklift.position.y = 0.1;
        load.position.copy(old[22].position);
        load.position.y += 0.3;
        old[24].visible = true;
      },
    };
  }
  return undefined;
}
