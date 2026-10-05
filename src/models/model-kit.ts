import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { V3 } from '../math';
export const modelIds = [
  'winged-skeleton',
  'cyber-scout',
  'cyber-engineer',
  'cyber-guardian',
  'robot-assault',
  'robot-sentry',
  'robot-engineer',
  'ship-hauler',
  'ship-freighter',
  'ship-explorer',
  'industrial-robot',
  'industrial-hangar',
  'plant-cell',
  'timber-house',
] as const;
export type ModelId = (typeof modelIds)[number];
/** Models are authored here from the reference silhouette. No author mesh is copied. */
export function createModel(id: ModelId): T.Group {
  const root = new T.Group();
  root.name = id;
  root.userData.modelId = id;
  root.userData.provenance = 'weisiwu reference-based simplified reconstruction';
  const materials = new Map<number, T.MeshStandardMaterial>();
  const mat = (c: number) => {
    if (!materials.has(c))
      materials.set(
        c,
        new T.MeshStandardMaterial({
          color: c,
          metalness:
            id.includes('skeleton') || id === 'plant-cell' || id === 'timber-house' ? 0.08 : 0.62,
          roughness: 0.38,
        }),
      );
    return materials.get(c)!;
  };
  const group = (p: T.Object3D, name: string, pos: V3 = [0, 0, 0]) => {
    const g = new T.Group();
    g.name = name;
    g.position.set(...pos);
    p.add(g);
    return g;
  };
  const mesh = (p: T.Object3D, geo: T.BufferGeometry, pos: V3, c: number) => {
    const m = new T.Mesh(geo, mat(c));
    m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  };
  const box = (p: T.Object3D, size: V3, pos: V3, c: number) =>
    mesh(p, new T.BoxGeometry(...size), pos, c);
  const orb = (p: T.Object3D, size: V3, pos: V3, c: number) => {
    const m = mesh(p, new T.SphereGeometry(1, 20, 12), pos, c);
    m.scale.set(...size);
    return m;
  };
  const cyl = (p: T.Object3D, r: number, h: number, pos: V3, c: number, r2 = r, seg = 16) =>
    mesh(p, new T.CylinderGeometry(r2, r, h, seg), pos, c);
  const bar = (p: T.Object3D, a: V3, b: V3, r: number, c: number, r2 = r) => {
    const av = new T.Vector3(...a),
      bv = new T.Vector3(...b),
      dir = bv.clone().sub(av);
    const m = cyl(p, r, dir.length(), av.add(bv).multiplyScalar(0.5).toArray() as V3, c, r2, 10);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    return m;
  };
  const ring = (p: T.Object3D, r: number, t: number, pos: V3, c: number) =>
    mesh(p, new T.TorusGeometry(r, t, 8, 32), pos, c);
  const curve = (p: T.Object3D, pts: V3[], r: number, c: number) =>
    mesh(
      p,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(pts.map((v) => new T.Vector3(...v))),
        32,
        r,
        8,
        false,
      ),
      [0, 0, 0],
      c,
    );
  const plate = (p: T.Object3D, pts: [number, number][], d: number, pos: V3, c: number) => {
    const shape = new T.Shape();
    pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    return mesh(
      p,
      new T.ExtrudeGeometry(shape, {
        depth: d,
        bevelEnabled: true,
        bevelSize: 0.035,
        bevelThickness: 0.025,
        bevelSegments: 1,
        curveSegments: 2,
      }),
      pos,
      c,
    );
  };
  const bone = 0xc0b29b,
    metal = 0xd3d9d9,
    dark = 0x17252c;
  if (id === 'winged-skeleton') {
    const spine = group(root, 'spine');
    for (let i = 0; i < 15; i++) {
      const x = -1.3 + i * 0.19;
      orb(spine, [0.16, 0.12, 0.16], [x, 2.9 + Math.sin(i * 0.2) * 0.08, 0], bone);
      bar(spine, [x, 2.95, 0], [x - 0.06, 3.22, 0], 0.045, bone, 0.01);
    }
    const ribs = group(root, 'ribcage');
    for (let i = 0; i < 12; i++)
      for (const s of [-1, 1]) {
        const x = -1.12 + i * 0.2;
        curve(
          ribs,
          [
            [x, 2.95, 0],
            [x, 2.8, s * 0.55],
            [x, 2.25, s * 0.66],
            [x + 0.05, 1.99, s * 0.17],
          ],
          0.043,
          bone,
        );
      }
    bar(ribs, [-1, 2.02, 0], [1.2, 2.02, 0], 0.07, bone);
    const tail = group(root, 'tail');
    for (let i = 0; i < 25; i++) {
      const t = i / 24;
      const p: V3 = [-1.4 - t * 2.2, 2.87 + 2.05 * t * t, Math.sin(t * 4) * 0.16];
      orb(tail, [0.14 - t * 0.08, 0.12 - t * 0.055, 0.13 - t * 0.075], p, bone);
      bar(tail, [p[0], p[1], p[2]], [p[0] - 0.12, p[1] + 0.22 - t * 0.1, p[2]], 0.035, bone, 0.008);
    }
    const neck = group(root, 'neck');
    curve(
      neck,
      [
        [1.3, 2.9, 0],
        [1.7, 3.28, 0],
        [1.88, 3.6, 0],
        [2.12, 3.82, 0],
      ],
      0.12,
      bone,
    );
    for (let i = 0; i < 6; i++)
      orb(neck, [0.16, 0.12, 0.19], [1.4 + i * 0.12, 3 + i * 0.14, 0], bone);
    const skull = group(root, 'skull');
    orb(skull, [0.4, 0.33, 0.28], [2.22, 3.88, 0], bone);
    orb(skull, [0.47, 0.17, 0.21], [2.58, 3.67, 0], bone);
    for (const s of [-1, 1]) {
      const eye = ring(skull, 0.16, 0.052, [2.35, 3.91, s * 0.23], bone);
      eye.rotation.y = 0.35 * s;
      orb(skull, [0.12, 0.11, 0.035], [2.35, 3.91, s * 0.255], 0x27211b);
      curve(
        skull,
        [
          [2.02, 4.01, s * 0.15],
          [1.83, 4.45, s * 0.22],
          [1.62, 4.7, s * 0.31],
        ],
        0.08,
        bone,
      );
      curve(
        skull,
        [
          [2.11, 3.57, s * 0.18],
          [2.37, 3.39, s * 0.21],
          [2.77, 3.43, s * 0.16],
        ],
        0.058,
        bone,
      );
      for (let j = 0; j < 8; j++) {
        const tooth = cyl(skull, 0.031, 0.14, [2.27 + j * 0.065, 3.53, s * 0.17], bone, 0, 6);
        tooth.rotation.z = Math.PI;
      }
    }
    for (const s of [-1, 1]) {
      const wings = group(root, s < 0 ? 'left-wing' : 'right-wing');
      const a: V3 = [0.75, 2.97, s * 0.3],
        b: V3 = [0.08, 3.7, s * 1.05],
        d: V3 = [0.36, 4.26, s * 2.05];
      bar(wings, a, b, 0.1, bone, 0.07);
      bar(wings, b, d, 0.075, bone, 0.05);
      orb(wings, [0.15, 0.15, 0.15], b, bone);
      for (let j = 0; j < 4; j++) {
        const elbow: V3 = [-1.08 - j * 0.27, 3.93 - j * 0.09, s * (2.22 + j * 0.28)],
          tip: V3 = [-1.91 - j * 0.25, 3.2 - j * 0.13, s * (1.8 + j * 0.32)];
        bar(wings, d, elbow, 0.043, bone, 0.025);
        bar(wings, elbow, tip, 0.027, bone, 0.012);
      }
      plate(
        wings,
        [
          [0, 0],
          [0.62, 0.34],
          [0.5, -0.48],
        ],
        0.055,
        [0.45, 2.83, s * 0.33],
        bone,
      );
      const legs = group(root, s < 0 ? 'left-leg' : 'right-leg');
      for (const x of [-1.13, 1.07]) {
        const a: V3 = [x, 2.76, s * 0.39],
          b: V3 = [x + 0.23, 1.61, s * 0.63],
          d: V3 = [x - 0.15, 0.49, s * 0.83];
        bar(legs, a, b, 0.12, bone, 0.08);
        bar(legs, b, d, 0.075, bone, 0.055);
        bar(legs, [b[0] - 0.12, b[1], b[2]], [d[0] - 0.07, d[1], d[2]], 0.04, bone);
        for (const p of [a, b, d]) orb(legs, [0.13, 0.13, 0.13], p, bone);
        for (let j = 0; j < 4; j++) {
          const k: V3 = [x - 0.05 + j * 0.11, 0.18, s * (0.88 + j * 0.045)];
          bar(legs, d, k, 0.035, bone, 0.022);
          bar(legs, k, [x + 0.26 + j * 0.13, 0.14, s * (1 + j * 0.06)], 0.025, bone, 0.008);
        }
      }
    }
  } else if (id.startsWith('cyber-') || id.startsWith('robot-') || id === 'industrial-robot') {
    const heavy = id === 'robot-assault' || id === 'cyber-guardian',
      slim = id === 'cyber-scout' || id === 'industrial-robot',
      handy = id === 'robot-engineer';
    const tint = id.startsWith('cyber-')
      ? ((
          {
            'cyber-scout': 0x99bd38,
            'cyber-engineer': 0x8d56a7,
            'cyber-guardian': 0x3f8ec1,
          } as Record<string, number>
        )[id] ?? 0x99bd38)
      : ((
          {
            'robot-assault': 0xd0473e,
            'robot-sentry': 0x5072a0,
            'robot-engineer': 0xec9d32,
          } as Record<string, number>
        )[id] ?? 0xd6dcdd);
    if (handy) {
      const body = group(root, 'hover-body');
      orb(body, [0.73, 0.67, 0.6], [0, 2.4, 0], metal);
      ring(body, 0.43, 0.11, [0, 2.52, 0.51], dark);
      orb(body, [0.16, 0.16, 0.045], [0, 2.52, 0.64], 0x79c9c7);
      cyl(body, 0.39, 0.4, [0, 1.55, 0], dark);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const arm = group(root, 'tool-' + i);
        const x = Math.cos(a),
          z = Math.sin(a);
        bar(arm, [x * 0.6, 2.3, z * 0.6], [x * 1.05, 1.86, z * 1.05], 0.14, tint);
        bar(arm, [x * 1.05, 1.86, z * 1.05], [x * 1.15, 1.1, z * 1.15], 0.1, metal);
        for (const s of [-1, 1])
          bar(arm, [x * 1.15, 1.1, z * 1.15], [x * 1.15 + s * 0.15, 0.88, z * 1.15], 0.04, dark);
      }
    } else {
      const torso = group(root, 'torso');
      orb(torso, [heavy ? 0.72 : 0.57, 0.68, 0.34], [0, 2.52, 0], dark);
      plate(
        torso,
        [
          [-0.58, 0.27],
          [-0.45, -0.21],
          [0, -0.4],
          [0.45, -0.21],
          [0.58, 0.27],
          [0, 0.15],
        ],
        0.16,
        [-0, 2.97, 0.23],
        tint,
      );
      for (const s of [-1, 1]) {
        const p = plate(
          torso,
          [
            [-0.27, 0.18],
            [0.24, 0.12],
            [0.17, -0.19],
            [-0.19, -0.1],
          ],
          0.09,
          [s * 0.3, 2.91, 0.41],
          metal,
        );
        p.rotation.z = s * 0.22;
      }
      for (let i = 0; i < 4; i++)
        plate(
          torso,
          [
            [-0.33 + i * 0.035, 0],
            [0.33 - i * 0.035, 0],
            [0.21, -0.13],
            [-0.21, -0.13],
          ],
          0.08,
          [0, 2.36 - i * 0.16, 0.29],
          i % 2 ? metal : tint,
        );
      box(torso, [0.79, 0.22, 0.53], [0, 1.79, 0], dark);
      box(torso, [0.22, 0.21, 0.15], [0, 1.77, 0.36], tint);
      const head = group(root, 'head', [0, 3.4, 0]);
      cyl(head, 0.13, 0.24, [0, -0.05, 0], metal);
      orb(head, [0.3, 0.36, 0.25], [0, 0.3, 0], dark);
      plate(
        head,
        [
          [-0.3, 0.2],
          [-0.2, -0.2],
          [0.2, -0.2],
          [0.3, 0.2],
        ],
        0.18,
        [0, 0.4, -0.06],
        metal,
      );
      box(head, [0.5, 0.1, 0.12], [0, 0.44, 0.25], dark);
      box(head, [0.35, 0.065, 0.05], [0, 0.44, 0.325], 0x83c8bc);
      plate(
        head,
        [
          [-0.22, 0],
          [0, -0.18],
          [0.22, 0],
        ],
        0.07,
        [0, 0.23, 0.25],
        tint,
      );
      for (const s of [-1, 1]) {
        box(head, [0.12, 0.32, 0.25], [s * 0.3, 0.3, 0], tint);
        bar(head, [s * 0.27, 0.54, 0], [s * 0.31, 0.84, -0.08], 0.025, tint);
      }
      if (id === 'cyber-engineer') {
        orb(head, [0.37, 0.43, 0.33], [0, 0.32, -0.12], tint);
        box(head, [0.42, 0.1, 0.12], [0, 0.43, 0.25], dark);
        box(torso, [0.9, 0.85, 0.42], [0, 2.53, -0.53], tint);
        for (const s of [-1, 1]) cyl(torso, 0.12, 0.9, [s * 0.38, 2.56, -0.68], metal);
      }
      if (heavy)
        for (const s of [-1, 1]) {
          box(torso, [0.44, 0.8, 0.45], [s * 0.4, 2.73, -0.48], tint);
          for (let j = 0; j < 3; j++)
            cyl(torso, 0.07, 0.12, [s * 0.4 + (j - 1) * 0.11, 3.17, -0.48], dark);
        }
      for (const s of [-1, 1]) {
        const shoulder = group(root, s < 0 ? 'arm-left' : 'arm-right', [
          s * (heavy ? 0.76 : 0.68),
          3.0,
          0,
        ]);
        orb(shoulder, [heavy ? 0.4 : 0.31, 0.28, 0.32], [0, 0, 0], tint);
        const joint = cyl(shoulder, 0.2, 0.19, [s * 0.15, -0.09, 0], dark);
        joint.rotation.z = Math.PI / 2;
        bar(shoulder, [0, -0.14, 0], [s * 0.16, -0.67, 0], 0.15, dark);
        plate(
          shoulder,
          [
            [-0.17, 0],
            [0.17, 0],
            [0.2, -0.48],
            [-0.16, -0.46],
          ],
          0.24,
          [s * 0.09, -0.17, -0.1],
          metal,
        );
        const fore = group(shoulder, 'elbow-' + (s < 0 ? 'left' : 'right'), [s * 0.16, -0.76, 0]);
        orb(fore, [0.18, 0.18, 0.19], [0, 0, 0], dark);
        box(fore, [heavy ? 0.5 : 0.35, 0.5, 0.36], [s * 0.04, -0.34, 0.04], tint);
        box(fore, [0.29, 0.24, 0.28], [s * 0.07, -0.75, 0.07], dark);
        for (let j = 0; j < 4; j++) {
          bar(
            fore,
            [s * 0.07 + (j - 1.5) * 0.063, -0.84, 0.18],
            [s * 0.07 + (j - 1.5) * 0.063, -1.03, 0.2],
            0.027,
            metal,
          );
        }
        if (id === 'robot-assault' || id === 'robot-sentry') {
          const gun = group(fore, 'weapon', [s * 0.05, -0.4, 0.44]);
          cyl(gun, 0.25, 0.42, [0, 0, 0.06], tint).rotation.x = Math.PI / 2;
          for (let j = 0; j < (id === 'robot-assault' ? 6 : 1); j++) {
            const a = (j * Math.PI) / 3,
              r = id === 'robot-assault' ? 0.14 : 0;
            bar(
              gun,
              [Math.cos(a) * r, Math.sin(a) * r, 0.2],
              [Math.cos(a) * r, Math.sin(a) * r, 1.1],
              id === 'robot-assault' ? 0.047 : 0.14,
              dark,
            );
          }
          ring(gun, 0.23, 0.04, [0, 0, 0.88], metal);
          fore.rotation.x = -0.6;
        }
        shoulder.rotation.z = (s < 0 ? -1 : 1) * (id === 'cyber-scout' ? 1.65 : 0.14);
        if (id === 'cyber-scout') fore.rotation.z = -s * 0.78;
        const leg = group(root, s < 0 ? 'leg-left' : 'leg-right', [s * 0.32, 1.68, 0]);
        bar(leg, [0, 0, 0], [s * 0.13, -0.69, 0.03], 0.17, dark);
        orb(leg, [0.24, 0.42, 0.26], [s * 0.07, -0.29, 0], metal);
        plate(
          leg,
          [
            [-0.2, 0.15],
            [0.2, 0.15],
            [0.18, -0.35],
            [0, -0.46],
            [-0.18, -0.35],
          ],
          0.12,
          [s * 0.08, -0.2, 0.18],
          tint,
        );
        orb(leg, [0.18, 0.18, 0.18], [s * 0.13, -0.76, 0.04], dark);
        box(leg, [0.31, 0.26, 0.16], [s * 0.13, -0.76, 0.25], tint);
        bar(leg, [s * 0.13, -0.85, 0], [s * 0.17, -1.38, 0], 0.13, dark);
        plate(
          leg,
          [
            [-0.17, 0.26],
            [0.17, 0.26],
            [0.22, -0.24],
            [0, -0.39],
            [-0.22, -0.24],
          ],
          0.22,
          [s * 0.16, -1.08, -0.04],
          tint,
        );
        box(leg, [0.44, 0.19, 0.66], [s * 0.18, -1.54, 0.16], metal);
      }
      if (id === 'robot-sentry') {
        box(torso, [1.55, 0.23, 0.65], [0, 3.17, -0.2], tint);
        box(head, [0.62, 0.24, 0.45], [0, 0.56, -0.1], tint);
      }
      if (slim) root.scale.x = 0.91;
    }
  } else if (id.startsWith('ship-')) {
    const freight = id === 'ship-freighter',
      explore = id === 'ship-explorer',
      tint = explore ? 0x4b8fa8 : 0xe99140;
    const hull = group(root, 'hull');
    box(hull, [4.05, 1.35, 1.6], [0, 2, 0], 0xd8dbd6);
    box(hull, [1.04, 1.39, 1.65], [-1.23, 2, 0], tint);
    const cabin = group(root, 'cockpit');
    plate(
      cabin,
      [
        [-0.85, -0.5],
        [-1.08, 0.03],
        [-0.55, 0.66],
        [0.12, 0.69],
        [0.42, 0.35],
        [0.42, -0.5],
      ],
      1.26,
      [-2.0, 2, -0.63],
      0x456170,
    );
    for (const s of [-1, 1]) {
      curve(
        cabin,
        [
          [-2.9, 1.53, s * 0.69],
          [-3.07, 2.05, s * 0.68],
          [-2.51, 2.66, s * 0.68],
          [-1.59, 2.7, s * 0.68],
        ],
        0.065,
        metal,
      );
      bar(cabin, [-2.91, 2.06, s * 0.7], [-1.63, 2.06, s * 0.7], 0.045, metal);
      bar(cabin, [-2.55, 1.53, s * 0.7], [-2.55, 2.59, s * 0.7], 0.035, metal);
    }
    for (let i = 0; i < 5; i++) {
      box(hull, [0.65, 1.05, 0.055], [-0.52 + i * 0.62, 2, 0.83], i === 1 ? tint : 0xe7e7df);
      box(hull, [0.45, 0.06, 0.063], [-0.52 + i * 0.62, 2.25, 0.869], 0x8c959b);
      for (let j = 0; j < 3; j++)
        box(hull, [0.07, 0.1, 0.035], [-0.64 + i * 0.62 + j * 0.13, 1.68, 0.89], dark);
    }
    for (const s of [-1, 1]) {
      box(hull, [0.7, 0.9, 0.07], [0.17, 2, s * 0.88], tint);
      for (let i = 0; i < 4; i++)
        bar(
          hull,
          [-0.11 + i * 0.13, 2.35, s * 0.93],
          [-0.11 + i * 0.13, 1.8, s * 0.93],
          0.023,
          metal,
        );
      const engine = group(root, s < 0 ? 'engine-left' : 'engine-right', [
        0.69,
        2,
        s * (explore ? 1.9 : 1.35),
      ]);
      cyl(engine, 0.5, 1.75, [0, 0, 0], metal).rotation.z = Math.PI / 2;
      cyl(engine, 0.52, 0.6, [0.12, 0, 0], tint).rotation.z = Math.PI / 2;
      for (const x of [-0.84, 0.75]) {
        const ringPart = ring(engine, 0.43, 0.095, [x, 0, 0], dark);
        ringPart.rotation.y = Math.PI / 2;
      }
      const intake = cyl(engine, 0.35, 0.08, [-0.9, 0, 0], 0x69808b);
      intake.rotation.z = Math.PI / 2;
      for (let j = 0; j < 10; j++) {
        const a = (j * Math.PI) / 5;
        box(engine, [0.95, 0.047, 0.09], [0.1, Math.cos(a) * 0.5, Math.sin(a) * 0.5], metal);
      }
      const glow = cyl(engine, 0.29, 0.1, [0.97, 0, 0], 0x5ebcdc);
      glow.rotation.z = Math.PI / 2;
      glow.name = 'exhaust';
      box(hull, [0.55, 0.23, 0.6], [0.6, 1.1, s * 0.8], tint);
      box(hull, [0.25, 0.25, 0.35], [1.65, 1.3, s * 0.57], dark);
    }
    for (let i = 0; i < 7; i++) {
      box(hull, [0.36, 0.08, 1.3], [-0.9 + i * 0.4, 2.72, 0], 0xa3afb1);
      box(hull, [0.3, 0.16, 0.23], [-0.9 + i * 0.4, 2.81, 0], i % 2 ? tint : metal);
    }
    for (const x of [-1.24, 0.8]) bar(hull, [x, 2.8, 0], [x, 3.42, 0], 0.024, dark);
    if (freight)
      for (let i = 0; i < 3; i++) {
        const crate = group(root, 'cargo-' + i, [i * 1.13 - 0.9, 1.0, 0]);
        box(crate, [1.04, 0.7, 1.45], [0, 0, 0], tint);
        for (const z of [-0.75, 0.75])
          for (let j = 0; j < 5; j++) box(crate, [0.04, 0.69, 0.04], [(j - 2) * 0.18, 0, z], dark);
      }
    if (explore) {
      for (const s of [-1, 1]) {
        const wing = plate(
          hull,
          [
            [-1, 0],
            [1.5, 0],
            [0.8, -0.5],
          ],
          0.08,
          [0.3, 1.73, s * 0.65],
          tint,
        );
        wing.rotation.x = (s * Math.PI) / 2;
        wing.scale.y = 3;
      }
      box(hull, [1.35, 0.27, 0.7], [0.86, 2.95, 0], dark);
    }
    // Geometry decals stay self contained in the exported GLB.
    for (let i = 0; i < 16; i++) {
      const x = -1.68 + i * 0.23;
      box(hull, [0.055, 0.03, 0.02], [x, 1.44 + (i % 3) * 0.05, 0.845], 0x8f8275);
    }
  } else if (id === 'industrial-hangar') {
    const shell = group(root, 'structure');
    box(shell, [12, 0.13, 18], [0, -0.15, 0], 0x27383e);
    box(shell, [12, 7, 0.15], [0, 3.5, -8.8], 0x182a33);
    for (const s of [-1, 1])
      for (let i = 0; i < 7; i++) {
        const z = -7 + i * 2.25,
          bay = group(root, 'bay-' + s + '-' + i);
        box(bay, [0.24, 6.8, 0.3], [s * 5.8, 3.35, z], 0x3d535a);
        box(bay, [0.1, 3.4, 1.9], [s * 5.95, 2.6, z + 0.95], 0x253b43);
        for (let j = 0; j < 4; j++)
          bar(bay, [s * 5.5, 1 + j * 0.74, z], [s * 5.5, 1 + j * 0.74, z + 1.85], 0.065, 0x839191);
        box(bay, [0.3, 0.16, 1.2], [s * 5.56, 5.16, z + 0.6], 0xe38f2e);
        box(bay, [0.85, 0.14, 1.5], [s * 4.84, 1.22, z + 0.58], 0x56696d);
        const screen = box(bay, [0.07, 0.66, 0.9], [s * 5.12, 1.83, z + 0.56], 0x3b91a0);
        screen.rotation.z = -s * 0.18;
        for (let j = 0; j < 4; j++)
          box(bay, [0.08, 0.036, 0.57], [s * 5.065, 1.66 + j * 0.1, z + 0.56], 0x8bc8bd);
        box(bay, [0.85, 1, 0.65], [s * 4.8, 0.52, z - 0.3], 0x5e6d6e);
      }
    for (let i = 0; i < 8; i++) {
      const z = -8 + i * 2.25;
      box(shell, [11.8, 0.22, 0.28], [0, 6.76, z], 0x4d6065);
      for (const x of [-3.8, 0, 3.8]) {
        box(shell, [1.1, 0.05, 1.6], [x, 6.6, z + 0.75], 0x77898d);
        box(shell, [0.85, 0.06, 0.24], [x, 6.55, z + 0.75], 0xbccbc5);
      }
    }
    for (const x of [-3.3, 3.3]) {
      box(shell, [2.1, 3.6, 0.1], [x, 1.8, -8.61], 0x496169);
      for (let i = 0; i < 6; i++)
        box(shell, [1.9, 0.045, 0.1], [x, 0.3 + i * 0.55, -8.49], 0x859496);
    }
    const pad = group(root, 'display-pad');
    cyl(pad, 2, 0.23, [0, 0.02, 0], 0x52616a);
    for (const r of [1.6, 1.8, 1.95])
      ring(pad, r, 0.035, [0, 0.15, 0], r === 1.8 ? 0xc99743 : 0x8a9d9d).rotation.x = Math.PI / 2;
    for (const s of [-1, 1])
      for (let i = 0; i < 20; i++) {
        const m = box(
          shell,
          [0.3, 0.012, 0.11],
          [s * 2.35, 0.012, -6.8 + i * 0.65],
          i % 2 ? 0xd5ab43 : dark,
        );
        m.rotation.y = s * 0.5;
      }
  } else if (id === 'plant-cell') {
    const outline: [number, number][] = [
      [-3.5, -1.2],
      [-2.7, -2.4],
      [0.35, -2.65],
      [2.5, -1.9],
      [3.55, -0.45],
      [2.7, 1.8],
      [0.5, 2.5],
      [-2.6, 2.2],
    ];
    const shell = group(root, 'shell');
    const shape = new T.Shape();
    outline.forEach(([x, z], i) => (i ? shape.lineTo(x, z) : shape.moveTo(x, z)));
    shape.closePath();
    const inner = new T.Path();
    outline
      .slice()
      .reverse()
      .forEach(([x, z], i) =>
        i ? inner.lineTo(x * 0.89, z * 0.89) : inner.moveTo(x * 0.89, z * 0.89),
      );
    inner.closePath();
    shape.holes.push(inner);
    const wall = mesh(
      shell,
      new T.ExtrudeGeometry(shape, {
        depth: 0.9,
        bevelEnabled: true,
        bevelSize: 0.12,
        bevelThickness: 0.1,
        bevelSegments: 2,
        curveSegments: 2,
      }),
      [0, 1.08, 0],
      0x738b38,
    );
    wall.rotation.x = Math.PI / 2;
    const floorShape = new T.Shape();
    outline.forEach(([x, z], i) =>
      i ? floorShape.lineTo(x * 0.9, z * 0.9) : floorShape.moveTo(x * 0.9, z * 0.9),
    );
    floorShape.closePath();
    const floor = mesh(
      root,
      new T.ExtrudeGeometry(floorShape, { depth: 0.15, bevelEnabled: false }),
      [0, 0.95, 0],
      0xb5bf61,
    );
    floor.rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++)
      curve(
        shell,
        [...outline, outline[0]].map(
          ([x, z]) => [x * (0.91 + k * 0.035), 1.15 + k * 0.09, z * (0.91 + k * 0.035)] as V3,
        ),
        0.038,
        0x9fac53,
      );
    const vac = group(root, 'vacuole');
    orb(vac, [1.76, 0.47, 1.03], [-0.83, 1.47, 0.16], 0x65aeb8);
    orb(vac, [1.64, 0.15, 0.92], [-0.87, 1.83, 0.16], 0x83c2c8);
    const nucleus = group(root, 'nucleus');
    orb(nucleus, [0.87, 0.79, 0.82], [1, 1.81, -0.83], 0x8652a4);
    orb(nucleus, [0.29, 0.29, 0.29], [1.02, 2.45, -0.71], 0x623184);
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI) / 9;
      ring(
        nucleus,
        0.032,
        0.012,
        [1 + Math.cos(a) * 0.84, 1.84 + Math.sin(a) * 0.7, -0.22],
        0xbd8bc5,
      );
    }
    const er = group(root, 'endoplasmic-reticulum');
    for (let k = 0; k < 6; k++)
      curve(
        er,
        Array.from(
          { length: 28 },
          (_, i) =>
            [
              1 + Math.cos(i * 0.21) * (1.01 + k * 0.075),
              1.5 + k * 0.065,
              -0.83 + Math.sin(i * 0.21) * (1.02 + k * 0.07),
            ] as V3,
        ),
        0.055,
        k % 2 ? 0x9260ac : 0xaf7bc1,
      );
    const chlor = group(root, 'organelle-1');
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        x = Math.cos(a) * 2.55,
        z = Math.sin(a) * 1.8;
      orb(chlor, [0.49, 0.23, 0.31], [x, 1.36, z], 0x3e792e).rotation.y = -a;
      for (let j = 0; j < 5; j++) {
        const x2 = x + Math.cos(a) * (j - 2) * 0.13,
          z2 = z + Math.sin(a) * (j - 2) * 0.13;
        const stack = cyl(chlor, 0.13, 0.16, [x2, 1.55, z2], 0x8da74b);
        stack.scale.z = 0.8;
      }
    }
    const mitochondria = group(root, 'organelle-2');
    for (const [x, z, a] of [
      [1.8, 1.25, 0.6],
      [-2.18, 0.95, -0.7],
      [0.42, 1.88, 0],
    ]) {
      orb(mitochondria, [0.5, 0.23, 0.29], [x, 1.39, z], 0xc2894a).rotation.y = a;
      curve(
        mitochondria,
        Array.from(
          { length: 14 },
          (_, j) => [x + (j / 13 - 0.5) * 0.72, 1.57, z + Math.sin(j * 1.9) * 0.13] as V3,
        ),
        0.032,
        0xecc073,
      );
    }
    const golgi = group(root, 'golgi');
    for (let j = 0; j < 5; j++)
      curve(
        golgi,
        [
          [1.61 + j * 0.04, 1.4 + j * 0.07, 0.42],
          [1.9 + j * 0.05, 1.4 + j * 0.07, 0.18],
          [2.2 + j * 0.03, 1.4 + j * 0.07, 0.38],
        ],
        0.075,
        0xd28857,
      );
    const ribosomes = group(root, 'ribosomes');
    for (let i = 0; i < 32; i++) {
      const a = i * 2.4,
        r = 1.6 + (i % 4) * 0.23;
      orb(
        ribosomes,
        [0.047, 0.047, 0.047],
        [Math.cos(a) * r, 1.3, Math.sin(a) * r * 0.7],
        i % 2 ? 0xc390b6 : 0xe1b881,
      );
    }
  } else if (id === 'timber-house') {
    for (let l = 0; l < 3; l++)
      for (let i = 0; i < 3 - l; i++) {
        const room = group(root, 'part-' + root.children.length, [
          i * 2.7 - 2.7,
          0.2 + l * 1.75,
          (l % 2) * 1.6,
        ]);
        room.userData.baseY = room.position.y;
        box(room, [2.6, 0.14, 2.6], [0, 0, 0], 0x9d794b);
        for (let j = 0; j < 12; j++)
          box(room, [0.19, 0.035, 2.6], [-1.2 + j * 0.22, 0.09, 0], j % 2 ? 0xac8a58 : 0xb79362);
        for (const x of [-1.18, 1.18])
          for (const z of [-1.18, 1.18]) box(room, [0.12, 1.73, 0.12], [x, 0.87, z], 0x755638);
        for (const z of [-1.18, 1.18]) box(room, [2.6, 0.11, 0.13], [0, 1.73, z], 0x85653e);
        box(room, [2.65, 0.12, 2.65], [0, 1.8, 0], 0x88794e);
        box(room, [2.25, 1.45, 0.05], [0, 0.82, -1.18], 0xa6bcb0);
        for (const x of [-0.73, 0.73]) box(room, [0.04, 1.46, 0.07], [x, 0.83, -1.14], 0x6b7468);
        for (const z of [-1.29, 1.29]) {
          bar(room, [-1.25, 0.7, z], [1.25, 0.7, z], 0.028, 0x75654e);
          for (let j = 0; j < 12; j++)
            bar(room, [-1.2 + j * 0.22, 0, z], [-1.2 + j * 0.22, 0.7, z], 0.014, 0x8b7960);
        }
        if (l === 0) {
          box(room, [0.8, 0.32, 0.52], [0, 0.22, 0], 0xcac2ad);
          for (const x of [-0.75, 0.75]) box(room, [0.45, 0.3, 0.5], [x, 0.2, 0], 0x7c987b);
        }
        for (let j = 0; j < 5; j++) {
          box(room, [0.38, 0.14, 0.32], [-1 + j * 0.5, 0.17, 1.06], 0x776345);
          orb(room, [0.2, 0.27, 0.2], [-1 + j * 0.5, 0.39, 1.06], j % 2 ? 0x8fa664 : 0x74944d);
        }
      }
    const stairs = group(root, 'stairs');
    for (let j = 0; j < 12; j++)
      box(stairs, [0.8, 0.12, 0.24], [4.1, 0.1 + j * 0.14, -1.35 + j * 0.22], 0x9d794b);
  }
  // Merge static meshes per semantic part/material. Pivots remain separate nodes.
  root.traverse((o) => {
    const sets = new Map<T.Material, T.Mesh[]>();
    for (const child of [...o.children])
      if (child instanceof T.Mesh && !child.name) {
        const mat = child.material as T.Material;
        const row = sets.get(mat) ?? [];
        row.push(child);
        sets.set(mat, row);
      }
    for (const [m, items] of sets) {
      if (items.length < 2) continue;
      const geometries = items.map((item) => {
        item.updateMatrix();
        const geo = item.geometry.clone().applyMatrix4(item.matrix);
        if (geo.index) {
          const flat = geo.toNonIndexed();
          geo.dispose();
          return flat;
        }
        return geo;
      });
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      const combined = new T.Mesh(merged, m);
      combined.castShadow = true;
      combined.receiveShadow = true;
      o.add(combined);
      for (const item of items) {
        item.geometry.dispose();
        o.remove(item);
      }
    }
  });
  return root;
}
export function animateModel(root: T.Object3D, time: number, rate = 1) {
  const id = root.userData.modelId as string;
  if (id?.startsWith('cyber-') || id?.startsWith('robot-') || id === 'industrial-robot') {
    for (const side of ['left', 'right']) {
      const arm = root.getObjectByName('arm-' + side);
      if (arm) {
        const sign = side === 'left' ? -1 : 1;
        arm.rotation.z =
          sign * ((id === 'cyber-scout' ? 1.65 : 0.14) + Math.sin(time * rate * 0.8) * 0.08);
      }
    }
    const hover = root.getObjectByName('hover-body');
    if (hover) hover.position.y = Math.sin(time * 0.8) * 0.08;
  }
}
