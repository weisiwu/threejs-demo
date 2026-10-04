import * as T from 'three';
import {
  COLORS as C,
  box,
  sphere,
  rod,
  setRod,
  cylinder,
  torus,
  line,
  tube,
  material,
  clear,
  mark,
} from '../graphics';
import { TAU, lerp, seeded, type V3 } from '../math';
import type { SceneContext, Experiment } from '../types';
import crambin from '../data/crambin.json';

export const scienceIds = new Set([
  'solar-system-basics',
  'solar-system-orbits',
  'planet-explorer',
  'dna-structure',
  'periodic-table',
  'aurora',
  'sales-timeline',
  'black-hole',
  'atomic-explorer',
  'molecular-structure',
  'protein-folding',
  'rule-universe',
]);
const elements = [
  'H',
  'He',
  'Li',
  'Be',
  'B',
  'C',
  'N',
  'O',
  'F',
  'Ne',
  'Na',
  'Mg',
  'Al',
  'Si',
  'P',
  'S',
  'Cl',
  'Ar',
];
export function science(ctx: SceneContext): Experiment {
  const { group: g, state: s, spec, report, panel } = ctx;
  let phase = 0;
  if (['solar-system-basics', 'solar-system-orbits', 'planet-explorer'].includes(spec.slug)) {
    const sun = sphere(g, 1, [0, 2, 0], C.gold);
    (sun.material as T.MeshStandardMaterial).emissive.setHex(0xae651e);
    const light = new T.PointLight(0xffcb8b, 55, 30);
    light.position.set(0, 2, 0);
    g.add(light);
    const planets = Array.from({ length: 6 }, (_, i) => {
      const a = 2 + i * 0.8,
        b = a * 0.8,
        r = 0.17 + i * 0.05;
      const mesh = sphere(g, r, [a, 2, 0], [C.cyan, C.blue, C.purple, C.red, C.green, C.white][i]);
      mark(mesh, 'planet-' + i, '行星 ' + String.fromCharCode(65 + i));
      const orbit = line(
        g,
        Array.from(
          { length: 96 },
          (_, k) => [a * Math.cos((k * TAU) / 96), 2, b * Math.sin((k * TAU) / 96)] as V3,
        ),
        0x34525f,
        true,
      );
      return { mesh, orbit, a, b, id: 'planet-' + i };
    });
    panel.innerHTML =
      '<div class="choices">' +
      planets
        .map((p, i) => `<button data-select="${p.id}">行星 ${String.fromCharCode(65 + i)}</button>`)
        .join('') +
      '</div>';
    return {
      update(dt) {
        phase += dt * (spec.slug === 'solar-system-basics' ? 0.15 : s.parameter);
        const scale =
          spec.slug === 'solar-system-basics'
            ? s.parameter
            : spec.slug === 'planet-explorer' && s.variant % 2
              ? 1.25
              : 1;
        planets.forEach((p, i) => {
          const angle = phase / (1 + i * 0.5) + i * 0.5;
          p.mesh.position.set(p.a * scale * Math.cos(angle), 2, p.b * scale * Math.sin(angle));
          p.mesh.rotation.y = phase * (0.4 + i * 0.1);
          p.orbit.scale.set(scale, 1, scale);
          if (spec.slug === 'solar-system-basics') p.orbit.visible = s.variant % 2 === 0;
        });
        sun.rotation.y = phase * 0.1;
        report({
          模拟时间: phase.toFixed(2),
          选择: s.selection || '未选择',
          行星数: 6,
          展示尺度: scale.toFixed(2),
        });
      },
      action() {
        s.variant++;
        if (spec.slug === 'solar-system-orbits') {
          s.selection = planets[s.variant % 6].id;
          ctx.camera.position.set(9, 7, 11);
          s.status = '已聚焦 ' + s.selection;
        } else s.status = '展示配置已切换';
      },
      select(id) {
        s.selection = id;
        s.status = '已选择 ' + id;
      },
    };
  }
  if (spec.slug === 'dna-structure') {
    const holder = new T.Group();
    g.add(holder);
    let points: T.Points, backbone: T.Group;
    let currentDensity = -1;
    function build() {
      clear(holder);
      const random = seeded(151),
        density = Math.round(s.parameter),
        count = density * 4000,
        xyz = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const f = random(),
          angle = f * TAU * 3 + (i % 2 ? TAU / 3 : 0),
          r = 1.3;
        let x = r * Math.cos(angle),
          z = r * Math.sin(angle);
        if (i % 5 === 0) {
          const t = random();
          x = lerp(r * Math.cos(angle), r * Math.cos(angle + TAU / 3), t);
          z = lerp(r * Math.sin(angle), r * Math.sin(angle + TAU / 3), t);
        }
        xyz[i * 3] = x + (random() - 0.5) * 0.14;
        xyz[i * 3 + 1] = f * 7 + 0.4 + (random() - 0.5) * 0.12;
        xyz[i * 3 + 2] = z + (random() - 0.5) * 0.14;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.BufferAttribute(xyz, 3));
      points = new T.Points(
        geometry,
        new T.PointsMaterial({ color: C.cyan, size: 0.035, transparent: true, opacity: 0.8 }),
      );
      holder.add(points);
      backbone = new T.Group();
      holder.add(backbone);
      for (let side = 0; side < 2; side++)
        tube(
          backbone,
          Array.from({ length: 100 }, (_, i) => {
            const f = i / 99,
              a = f * TAU * 3 + (side * TAU) / 3;
            return [1.3 * Math.cos(a), f * 7 + 0.4, 1.3 * Math.sin(a)] as V3;
          }),
          0.04,
          side ? C.gold : C.cyan,
        );
      for (let i = 0; i <= 18; i++) {
        const f = i / 18,
          a = f * TAU * 3;
        rod(
          backbone,
          [1.3 * Math.cos(a), f * 7 + 0.4, 1.3 * Math.sin(a)],
          [1.3 * Math.cos(a + TAU / 3), f * 7 + 0.4, 1.3 * Math.sin(a + TAU / 3)],
          0.027,
          C.purple,
        );
      }
      currentDensity = density;
    }
    build();
    return {
      update(dt) {
        phase += dt * 0.15;
        if (currentDensity !== Math.round(s.parameter)) build();
        holder.rotation.y = phase;
        points.visible = s.variant % 2 === 0;
        backbone.visible = s.variant % 2 === 1;
        report({
          展示点数: Math.round(s.parameter) * 4000,
          表示: s.variant % 2 ? '骨架' : '点云',
          数据语义: '展示几何',
        });
      },
      action() {
        s.variant++;
        s.status = '结构表示已切换';
      },
    };
  }
  if (spec.slug === 'periodic-table' || spec.slug === 'atomic-explorer') {
    const holder = new T.Group();
    g.add(holder);
    let number = spec.slug === 'atomic-explorer' ? Math.round(s.parameter) : 6,
      last = -1,
      lastVariant = -1;
    panel.innerHTML =
      '<div class="element-grid">' +
      elements
        .map(
          (symbol, i) =>
            `<button data-select="element-${i + 1}" title="原子序数 ${i + 1}"><small>${i + 1}</small>${symbol}</button>`,
        )
        .join('') +
      '</div>';
    const phaseShapes = new T.Group();
    g.add(phaseShapes);
    let electrons: T.Mesh[] = [];
    function build() {
      clear(holder);
      clear(phaseShapes);
      electrons = [];
      const nucleus = sphere(holder, 0.45, [0, 2.6, 0], C.gold);
      mark(nucleus, 'element-' + number, elements[number - 1]);
      let left = number;
      const capacities = [2, 8, 8];
      for (let shell = 0; left > 0 && shell < 3; shell++) {
        const count = Math.min(left, capacities[shell]),
          r = 1.1 + shell * 0.7,
          orbit = torus(holder, r, 0.02, [0, 2.6, 0], C.dark);
        orbit.rotation.x = Math.PI / 2;
        for (let j = 0; j < count; j++) {
          const e = sphere(holder, 0.09, [r, 2.6, 0], C.cyan);
          e.userData.radius = r;
          e.userData.offset = (j / count) * TAU;
          e.userData.shell = shell;
          electrons.push(e);
        }
        left -= count;
      }
      if (spec.slug === 'atomic-explorer' && s.variant % 2) {
        holder.visible = false;
        const random = seeded(number),
          xyz = new Float32Array(number * 150 * 3);
        for (let i = 0; i < xyz.length; i += 3) {
          const radius = 2.3 * Math.cbrt(random()),
            theta = random() * TAU,
            z = random() * 2 - 1;
          xyz[i] = radius * Math.sqrt(1 - z * z) * Math.cos(theta);
          xyz[i + 1] = 2.6 + radius * z;
          xyz[i + 2] = radius * Math.sqrt(1 - z * z) * Math.sin(theta);
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.BufferAttribute(xyz, 3));
        phaseShapes.add(
          new T.Points(
            geometry,
            new T.PointsMaterial({ size: 0.035, color: C.cyan, transparent: true, opacity: 0.6 }),
          ),
        );
      } else holder.visible = true;
      if (spec.slug === 'periodic-table') {
        const phase = s.variant % 3;
        if (phase === 0) box(phaseShapes, [1.5, 1, 1.5], [3, 1, 0], C.cyan);
        if (phase === 1) {
          const liquid = cylinder(phaseShapes, 0.8, 1, [3, 1, 0], C.blue);
          (liquid.material as T.MeshStandardMaterial).transparent = true;
          (liquid.material as T.MeshStandardMaterial).opacity = 0.65;
        }
        if (phase === 2)
          for (let i = 0; i < 5; i++)
            sphere(
              phaseShapes,
              0.15,
              [3 + Math.cos(i) * 0.7, 1.3 + Math.sin(i * 2) * 0.6, Math.sin(i) * 0.7],
              C.purple,
            );
      }
      last = number;
      lastVariant = s.variant;
    }
    return {
      update(dt) {
        phase += dt * (spec.slug === 'periodic-table' ? s.parameter : 0.4);
        if (spec.slug === 'atomic-explorer') number = Math.round(s.parameter);
        if (last !== number || lastVariant !== s.variant) build();
        electrons.forEach((e) => {
          const a = phase / (1 + e.userData.shell) + e.userData.offset;
          e.position.set(Math.cos(a) * e.userData.radius, 2.6, Math.sin(a) * e.userData.radius);
        });
        report({
          元素: elements[number - 1],
          原子序数: number,
          简化电子数: number,
          表示:
            spec.slug === 'periodic-table'
              ? ['固态图形', '液态图形', '气态图形'][s.variant % 3]
              : s.variant % 2
                ? '装饰点云'
                : '壳层示意',
        });
      },
      action() {
        s.variant++;
        s.status = '表示已切换';
      },
      select(id) {
        const n = Number(id.split('-')[1]);
        if (n >= 1 && n <= 18) {
          number = n;
          if (spec.slug === 'atomic-explorer') s.parameter = n;
          s.selection = id;
          s.status = '已选择 ' + elements[n - 1];
        }
      },
    };
  }
  if (spec.slug === 'aurora') {
    const earth = sphere(g, 1.5, [0, 2.3, 0], C.blue);
    const curtains = new T.Group();
    g.add(curtains);
    for (let j = 0; j < 8; j++) {
      const pts = Array.from({ length: 60 }, (_, i) => {
        const t = (i / 59) * TAU,
          r = 2.8 + Math.sin(t * 3 + j) * 0.15;
        return [r * Math.cos(t), 2 + j * 0.18 + Math.sin(t * 4) * 0.3, r * Math.sin(t)] as V3;
      });
      tube(curtains, pts, 0.055, j % 2 ? C.green : C.purple);
    }
    const paths = Array.from(
      { length: 8 },
      (_, j) =>
        new T.CatmullRomCurve3([
          new T.Vector3(-7, 2 + j * 0.12, -2 + j * 0.5),
          new T.Vector3(-3, 4, j * 0.2),
          new T.Vector3(0, 4.2, 1 + j * 0.12),
          new T.Vector3(2, 3.5, j * 0.2),
        ]),
    );
    paths.forEach((p) =>
      line(
        g,
        p.getPoints(60).map((q) => q.toArray() as V3),
        0x234757,
      ),
    );
    const particles = Array.from({ length: 24 }, (_, i) => sphere(g, 0.07, [-7, 2, 0], C.gold));
    return {
      update(dt) {
        phase += dt * s.parameter;
        const cycle = phase % 8,
          stage = Math.floor(cycle / 2);
        curtains.visible = stage >= 2;
        curtains.rotation.y = phase * 0.08;
        particles.forEach((m, i) =>
          m.position.copy(paths[i % 8].getPoint((cycle / 8 + i / 24) % 1)),
        );
        earth.rotation.y = phase * 0.07;
        report({
          阶段: ['太阳风开始', '到达路径', '极光显现', '循环恢复'][stage],
          时间轴: cycle.toFixed(2),
          风粒子: 24,
        });
      },
      action() {
        phase = (Math.floor(phase / 2) + 1) * 2;
        s.status = '已跳转下一阶段';
      },
    };
  }
  if (spec.slug === 'sales-timeline') {
    const bars = Array.from({ length: 20 }, (_, i) => {
      const m = box(g, [0.36, 1, 0.6], [(i - 9.5) * 0.45, 0.5, 0], i < 3 ? C.gold : C.cyan);
      return m;
    });
    const base = Array.from({ length: 20 }, (_, i) => ({
      id: 'game-' + i,
      value: 22 + (20 - i) * 2.7 + (i % 3) * 4,
    }));
    return {
      update() {
        const t = s.parameter;
        const values = base
          .map((p, i) => ({
            ...p,
            value: p.value * (0.2 + 0.08 * t) + (s.variant % 2 ? Math.sin(i + 1) * 8 : 0),
          }))
          .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
        bars.forEach((m, i) => {
          m.scale.y = Math.max(0.05, values[i].value / 14);
          m.position.y = m.scale.y * 0.5;
          mark(m, values[i].id, values[i].id);
        });
        report({
          帧编号: Math.floor(t * 30),
          数据年份: s.variant % 2 ? '样例 B' : '样例 A',
          '第 1 名': values[0].id,
          示例数值: values[0].value.toFixed(1),
          数据性质: '合成数据',
        });
      },
      action() {
        s.variant++;
        s.status = '数据快照已切换';
      },
    };
  }
  if (spec.slug === 'black-hole') {
    const geo = new T.PlaneGeometry(12, 12, 64, 64);
    geo.rotateX(-Math.PI / 2);
    const mesh = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({
        color: C.blue,
        wireframe: true,
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.75,
      }),
    );
    g.add(mesh);
    const disk = torus(g, 1.5, 0.15, [0, 0.4, 0], C.gold);
    disk.rotation.x = Math.PI / 2;
    sphere(g, 0.8, [0, 0.5, 0], 0x020507);
    const orbiters = Array.from({ length: 24 }, (_, i) => sphere(g, 0.04, [0, 0, 0], C.cyan));
    return {
      update(dt) {
        phase += dt * 0.4;
        const position = geo.getAttribute('position');
        for (let i = 0; i < position.count; i++) {
          const x = position.getX(i),
            z = position.getZ(i),
            r = Math.hypot(x, z);
          position.setY(i, 0.3 - s.parameter / Math.sqrt(Math.max(0.4, r * r)));
        }
        position.needsUpdate = true;
        geo.computeVertexNormals();
        (mesh.material as T.MeshStandardMaterial).wireframe = s.variant % 2 === 0;
        orbiters.forEach((m, i) => {
          const a = phase + (i * TAU) / 24,
            r = 2 + (i % 4) * 0.6;
          m.position.set(r * Math.cos(a), 0.4, r * Math.sin(a));
        });
        report({
          展示深度: s.parameter.toFixed(1),
          中心裁剪半径: '0.4（展示单位）',
          模型: '径向展示函数',
          物理求解: '未执行',
        });
      },
      action() {
        s.variant++;
        s.status = '网格表示已切换';
      },
    };
  }
  if (spec.slug === 'molecular-structure') return molecular(ctx);
  if (spec.slug === 'protein-folding') {
    const center = crambin.atoms
      .reduce((a, p) => a.map((x, i) => x + p.xyz[i]) as V3, [0, 0, 0] as V3)
      .map((x) => x / crambin.atoms.length) as V3;
    const folded = crambin.atoms.map(
        (p) => p.xyz.map((x, i) => (x - center[i]) * 0.15 + (i === 1 ? 3 : 0)) as V3,
      ),
      unfolded = folded.map((_, i) => [(i - 22.5) * 0.16, 3 + Math.sin(i * 0.25) * 0.4, 0] as V3);
    const dots = crambin.atoms.map((p, i) =>
      mark(
        sphere(g, 0.08, folded[i], i % 3 ? C.cyan : C.gold),
        'residue-' + p.id,
        p.residue + ' ' + p.id,
      ),
    );
    const bones = Array.from({ length: 45 }, (_, i) =>
      rod(g, folded[i], folded[i + 1], 0.035, C.purple),
    );
    panel.innerHTML =
      '<p class="caption">PDB 1CRN · 链 A · Cα · 46 残基</p><div class="choices"><button data-select="residue-1">残基 1</button><button data-select="residue-23">残基 23</button><button data-select="residue-46">残基 46</button></div>';
    return {
      update() {
        const pts = folded.map(
          (p, i) => p.map((x, j) => lerp(unfolded[i][j], x, s.parameter)) as V3,
        );
        dots.forEach((m, i) => {
          m.position.set(...pts[i]);
          m.visible = s.variant % 2 === 0;
        });
        bones.forEach((m, i) => {
          setRod(m, pts[i], pts[i + 1]);
          m.scale.x = m.scale.z = s.variant % 2 ? 2.5 : 1;
        });
        report({
          结构来源: 'PDB 1CRN',
          残基数: 46,
          过渡进度: s.parameter.toFixed(2),
          路径方法: '人工坐标插值',
          选择: s.selection || '未选择',
        });
      },
      action() {
        s.variant++;
        s.status = '链表示已切换';
      },
      select(id) {
        s.selection = id;
        s.status = '已定位 ' + id;
      },
    };
  }
  return graphScene(ctx);
}

const molecules = [
  {
    name: '水 H₂O',
    atoms: [
      { id: 'O1', element: 'O', p: [0, 3, 0] as V3 },
      { id: 'H1', element: 'H', p: [-0.85, 2.4, 0] as V3 },
      { id: 'H2', element: 'H', p: [0.85, 2.4, 0] as V3 },
    ],
    bonds: [
      [0, 1],
      [0, 2],
    ],
  },
  {
    name: '乙醇 C₂H₆O',
    atoms: [
      { id: 'C1', element: 'C', p: [-1, 3, 0] as V3 },
      { id: 'C2', element: 'C', p: [0.3, 3, 0] as V3 },
      { id: 'O1', element: 'O', p: [1.4, 3.6, 0] as V3 },
      ...Array.from({ length: 6 }, (_, i) => ({
        id: 'H' + (i + 1),
        element: 'H',
        p: [i < 3 ? -1.5 : 0.4, 3 + (i % 3 === 0 ? 1 : -0.7), ((i % 3) - 1) * 0.8] as V3,
      })),
    ],
    bonds: [
      [0, 1],
      [1, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 6],
      [1, 7],
      [2, 8],
    ],
  },
  {
    name: '苯 C₆H₆',
    atoms: [
      ...Array.from({ length: 6 }, (_, i) => ({
        id: 'C' + (i + 1),
        element: 'C',
        p: [Math.cos((i * TAU) / 6) * 1.3, 3 + Math.sin((i * TAU) / 6) * 1.3, 0] as V3,
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        id: 'H' + (i + 1),
        element: 'H',
        p: [Math.cos((i * TAU) / 6) * 2.1, 3 + Math.sin((i * TAU) / 6) * 2.1, 0] as V3,
      })),
    ],
    bonds: [
      ...Array.from({ length: 6 }, (_, i) => [i, (i + 1) % 6]),
      ...Array.from({ length: 6 }, (_, i) => [i, i + 6]),
    ],
  },
];
function molecular(ctx: SceneContext): Experiment {
  const { group: g, state: s, panel, report } = ctx;
  const holder = new T.Group();
  g.add(holder);
  let current = -1;
  let atoms: T.Object3D[] = [];
  let bonds: T.Mesh[] = [];
  const rebuild = () => {
    clear(holder);
    const m = molecules[s.variant % 3];
    atoms = m.atoms.map((a) =>
      mark(
        sphere(
          holder,
          a.element === 'H' ? 0.17 : 0.3,
          a.p,
          a.element === 'O' ? C.red : a.element === 'H' ? C.white : C.dark,
        ),
        'atom-' + a.id,
        a.element + ' ' + a.id,
      ),
    );
    bonds = m.bonds.map(([a, b]) => rod(holder, m.atoms[a].p, m.atoms[b].p, 0.055, C.cyan));
    current = s.variant;
    panel.innerHTML =
      '<div class="choices">' +
      m.atoms
        .slice(0, 6)
        .map((a) => `<button data-select="atom-${a.id}">${a.id}</button>`)
        .join('') +
      '</div>';
  };
  rebuild();
  return {
    update() {
      if (current !== s.variant) rebuild();
      const m = molecules[s.variant % 3],
        pts = m.atoms.map(
          (a) => [a.p[0] * s.parameter, 3 + (a.p[1] - 3) * s.parameter, a.p[2] * s.parameter] as V3,
        );
      atoms.forEach((a, i) => a.position.set(...pts[i]));
      bonds.forEach((b, i) => setRod(b, pts[m.bonds[i][0]], pts[m.bonds[i][1]]));
      report({
        分子: m.name,
        原子数: m.atoms.length,
        键记录数: m.bonds.length,
        选择: s.selection || '未选择',
        坐标性质: '教学摆放',
      });
    },
    action() {
      s.variant++;
      s.selection = '';
      s.status = '分子已切换';
    },
    select(id) {
      s.selection = id;
      s.status = '已选择 ' + id;
    },
  };
}
import { rewrite, type RewriteGraph } from '../math';
function graphScene(ctx: SceneContext): Experiment {
  const { group: g, state: s, report } = ctx;
  let graph: RewriteGraph = { nextId: 2, edges: [[0, 1]], steps: 0, trace: [] };
  const holder = new T.Group();
  g.add(holder);
  let dirty = true;
  return {
    update() {
      if (dirty) {
        clear(holder);
        const p = Array.from({ length: graph.nextId }, (_, i) => {
          const angle = i * 2.39996,
            r = Math.sqrt(i) * 0.55;
          return [
            r * Math.cos(angle),
            1.8 + (i / Math.max(1, graph.nextId - 1)) * 2,
            r * Math.sin(angle),
          ] as V3;
        });
        p.forEach((q, i) => mark(sphere(holder, 0.12, q, i === 0 ? C.gold : C.cyan), 'node-' + i));
        graph.edges.forEach(([a, b]) => rod(holder, p[a], p[b], 0.025, C.purple));
        dirty = false;
      }
      report({
        步数: graph.steps,
        节点数: graph.nextId,
        边记录数: graph.edges.length,
        最新匹配: graph.trace.at(-1) || '初始图',
      });
    },
    action() {
      try {
        graph = rewrite(graph, Math.round(s.parameter));
        dirty = true;
        s.status = '重写完成';
      } catch (e) {
        s.status = (e as Error).message;
      }
    },
    select(id) {
      s.selection = id;
      s.status = '已选择 ' + id;
    },
  };
}
