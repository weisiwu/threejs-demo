import * as T from 'three';
import { COLORS as C, box, sphere, rod, setRod, cylinder, torus, mark, clear } from '../graphics';
import { TAU, lerp, astar, type V3 } from '../math';
import type { SceneContext, Experiment } from '../types';
export const spaceIds = new Set([
  'skeleton-explorer',
  'character-selection',
  'ship-selection',
  'world-environment',
  'robot-roster',
  'biological-structure',
  'schematic-transition',
  'warehouse-strategy',
]);
function choices(
  panel: HTMLElement,
  items: { id: string; name: string }[],
  select: (id: string) => void,
) {
  items.forEach((o) => {
    const b = document.createElement('button');
    b.textContent = o.name;
    b.dataset.select = o.id;
    b.onclick = () => select(o.id);
    panel.append(b);
  });
}
function humanoid(parent: T.Object3D, i: number) {
  const g = new T.Group();
  parent.add(g);
  const c = [C.cyan, C.gold, C.purple][i % 3];
  box(g, [0.9, 1.3, 0.6], [0, 2.4, 0], c);
  sphere(g, 0.4, [0, 3.5, 0], c);
  for (const side of [-1, 1]) {
    rod(g, [side * 0.55, 2.8, 0], [side * 0.85, 1.6, 0.1], 0.12, C.white);
    rod(g, [side * 0.3, 1.8, 0], [side * 0.4, 0.3, 0], 0.15, c);
  }
  return g;
}

export function spaces(ctx: SceneContext): Experiment {
  const { group: g, state: s, spec, panel, report } = ctx;
  if (spec.slug === 'character-selection' || spec.slug === 'robot-roster') {
    const ids = ['scout', 'engineer', 'guardian'],
      names = ['侦察型', '工程型', '守卫型'];
    const models = ids.map((id, i) => {
      const model = humanoid(g, i);
      model.position.x = (i - 1) * 3.2;
      if (spec.slug === 'robot-roster') {
        box(model, [1.3, 0.3, 0.8], [0, 2.8, 0], C.dark);
        torus(model, 0.38, 0.08, [0, 3.5, 0.3], C.gold);
      }
      mark(model, id);
      return model;
    });
    let confirmed = '无';
    s.selection = ids[0];
    choices(
      panel,
      ids.map((id, i) => ({ id, name: names[i] })),
      (id) => (s.selection = id),
    );
    return {
      update() {
        models.forEach((m, i) => {
          m.rotation.y = s.time * 0.16;
          m.scale.setScalar(ids[i] === s.selection ? 1.08 : 0.85);
          if (spec.slug === 'robot-roster')
            m.traverse((o) => {
              const mat = (o as T.Mesh).material as T.MeshStandardMaterial;
              if (mat?.roughness !== undefined) mat.roughness = s.parameter;
            });
          else m.rotation.y *= s.parameter;
        });
        report({
          '预览 ID': s.selection,
          '已确认 ID': confirmed,
          资源来源: '程序化几何',
          材质粗糙度: spec.slug === 'robot-roster' ? s.parameter : '默认',
        });
      },
      select(id) {
        if (ids.includes(id)) s.selection = id;
      },
      action() {
        confirmed = s.selection;
        s.status = '选择已确认：' + confirmed;
      },
    };
  }
  if (spec.slug === 'ship-selection') {
    const ids = ['arrow', 'freighter', 'drifter'];
    const thrusters = new Map<string, T.Mesh[]>();
    const models = ids.map((id, i) => {
      const m = new T.Group();
      m.position.x = (i - 1) * 3.8;
      g.add(m);
      box(m, [1.2, 0.45, 2.8], [0, 2, 0], [C.cyan, C.gold, C.purple][i]);
      const nose = sphere(m, 0.5, [0, 2, -1.4], C.white);
      nose.scale.z = 1.5;
      box(m, [2.8, 0.12, 0.9], [0, 1.9, 0.5], C.dark);
      const parts = [sphere(m, 0.25, [-0.4, 2, 1.6], C.red), sphere(m, 0.25, [0.4, 2, 1.6], C.red)];
      thrusters.set(id, parts);
      mark(m, id);
      return m;
    });
    const equipment = new Map(ids.map((id) => [id, true]));
    s.selection = ids[0];
    choices(
      panel,
      ids.map((id, i) => ({ id, name: ['箭形艇', '货运艇', '漂移艇'][i] })),
      (id) => (s.selection = id),
    );
    return {
      update() {
        models.forEach((m, i) => {
          m.rotation.y = s.time * s.parameter;
          m.scale.setScalar(ids[i] === s.selection ? 1 : 0.75);
          thrusters.get(ids[i])!.forEach((t) => (t.visible = equipment.get(ids[i])!));
        });
        report({
          '飞船 ID': s.selection,
          推进器: equipment.get(s.selection) ? '装备' : '卸下',
          装备记录: Array.from(equipment)
            .map(([id, on]) => id + ':' + (on ? '1' : '0'))
            .join(' / '),
        });
      },
      select(id) {
        if (ids.includes(id)) s.selection = id;
      },
      action() {
        equipment.set(s.selection, !equipment.get(s.selection));
        s.status = '装备状态已更新';
      },
    };
  }
  if (spec.slug === 'world-environment') {
    const terrain = new T.Mesh(
      new T.PlaneGeometry(16, 16, 48, 48),
      new T.MeshStandardMaterial({ color: 0x315352, roughness: 1, side: T.DoubleSide }),
    );
    terrain.rotation.x = -Math.PI / 2;
    g.add(terrain);
    const actor = humanoid(g, 0);
    actor.scale.setScalar(0.55);
    actor.position.set(0, 0, 0);
    const trees = Array.from({ length: 16 }, (_, i) => {
      const x = ((i % 4) - 1.5) * 3.5,
        z = (Math.floor(i / 4) - 1.5) * 3.5;
      const t = new T.Group();
      t.position.set(x, 0, z);
      g.add(t);
      cylinder(t, 0.15, 1.1, [0, 0.55, 0], C.gold);
      const crown = new T.Mesh(
        new T.ConeGeometry(0.65, 1.8, 8),
        new T.MeshStandardMaterial({ color: 0x6eaa8d }),
      );
      crown.position.y = 1.9;
      t.add(crown);
      return t;
    });
    const height = (x: number, z: number) => Math.sin(x * 0.55) * Math.cos(z * 0.4) * s.parameter;
    let old = NaN;
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).matches('input,textarea')) return;
        if (
          ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
        ) {
          keys.add(e.key);
          e.preventDefault();
        }
      },
      up = (e: KeyboardEvent) => keys.delete(e.key),
      blur = () => keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    panel.textContent =
      '使用 W A S D 或方向键移动。角色脚底与地形使用同一个高度函数，树木有圆形碰撞范围。';
    return {
      update(dt) {
        if (old !== s.parameter) {
          old = s.parameter;
          const p = terrain.geometry.getAttribute('position');
          for (let i = 0; i < p.count; i++) p.setZ(i, height(p.getX(i), -p.getY(i)));
          p.needsUpdate = true;
          terrain.geometry.computeVertexNormals();
          trees.forEach((t) => (t.position.y = height(t.position.x, t.position.z)));
        }
        const dx =
            (Number(keys.has('d') || keys.has('ArrowRight')) -
              Number(keys.has('a') || keys.has('ArrowLeft'))) *
            dt *
            2,
          dz =
            (Number(keys.has('s') || keys.has('ArrowDown')) -
              Number(keys.has('w') || keys.has('ArrowUp'))) *
            dt *
            2;
        const x = Math.max(-7.4, Math.min(7.4, actor.position.x + dx)),
          z = Math.max(-7.4, Math.min(7.4, actor.position.z + dz));
        if (!trees.some((t) => Math.hypot(x - t.position.x, z - t.position.z) < 0.7)) {
          actor.position.x = x;
          actor.position.z = z;
        }
        actor.position.y = height(actor.position.x, actor.position.z);
        (terrain.material as T.MeshStandardMaterial).color.setHex(
          s.variant % 2 ? 0x1e333e : 0x315352,
        );
        report({
          '角色 X': actor.position.x.toFixed(2),
          '角色 Z': actor.position.z.toFixed(2),
          地面高度: actor.position.y.toFixed(2),
          场景: s.variant % 2 ? '夜间色调' : '日间色调',
          素材: '程序化 / 无图像生成调用',
        });
      },
      action() {
        s.variant++;
        s.status = '环境色调已切换';
      },
      dispose() {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
        window.removeEventListener('blur', blur);
      },
    };
  }
  if (spec.slug === 'skeleton-explorer') {
    const parts: { id: string; mesh: T.Object3D; base: T.Vector3; offset: T.Vector3 }[] = [];
    const add = (id: string, m: T.Object3D, offset: T.Vector3) => {
      mark(m, id);
      parts.push({ id, mesh: m, base: m.position.clone(), offset });
    };
    add('skull', sphere(g, 0.5, [0, 4.9, 0], C.white), new T.Vector3(0, 1, 0));
    for (let i = 0; i < 8; i++)
      add('vertebra-' + i, sphere(g, 0.16, [0, 2 + i * 0.32, 0], C.gold), new T.Vector3(0, 0, 0.4));
    for (let i = 0; i < 6; i++) {
      const rib = torus(g, 0.65 - i * 0.04, 0.055, [0, 3.2 + i * 0.18, 0], C.white);
      rib.rotation.x = Math.PI / 2;
      rib.scale.z = 0.6;
      add('rib-' + i, rib, new T.Vector3(0, 0, 1));
    }
    for (const side of [-1, 1]) {
      const id = side < 0 ? 'left' : 'right';
      add(
        id + '-arm',
        rod(g, [side * 0.7, 4.4, 0], [side * 1.1, 2.3, 0], 0.1, C.white),
        new T.Vector3(side, 0, 0),
      );
      add(
        id + '-leg',
        rod(g, [side * 0.3, 2, 0], [side * 0.45, 0.3, 0], 0.14, C.white),
        new T.Vector3(side * 0.5, -0.3, 0),
      );
    }
    choices(
      panel,
      parts.slice(0, 9).map((o) => ({ id: o.id, name: o.id })),
      (id) => (s.selection = id),
    );
    return {
      update() {
        parts.forEach((p) => p.mesh.position.copy(p.base).addScaledVector(p.offset, s.parameter));
        report({
          部件数: parts.length,
          选中部件: s.selection || '无',
          模式: s.variant % 2 ? '仅选中' : '整体',
          结构范围: '教学几何 / 非医学模型',
        });
        parts.forEach((p) => (p.mesh.visible = s.variant % 2 === 0 || p.id === s.selection));
      },
      select(id) {
        s.selection = id;
      },
      action() {
        if (!s.selection) s.selection = 'skull';
        s.variant++;
        s.status = '显示范围已切换';
      },
    };
  }
  if (spec.slug === 'biological-structure') {
    const parts = [
      {
        id: 'shell',
        name: '外膜',
        mesh: sphere(g, 2, [0, 2.5, 0], C.cyan),
        offset: [0, 0, 0] as V3,
      },
      {
        id: 'nucleus',
        name: '核区',
        mesh: sphere(g, 0.75, [0, 2.5, 0], C.purple),
        offset: [-2, 0, 0] as V3,
      },
      {
        id: 'organelle-1',
        name: '细胞器 A',
        mesh: sphere(g, 0.5, [1, 2.1, 0.4], C.gold),
        offset: [2, 0, 0] as V3,
      },
      {
        id: 'organelle-2',
        name: '细胞器 B',
        mesh: sphere(g, 0.45, [-0.7, 2.8, 0.8], C.red),
        offset: [0, 1.5, 0] as V3,
      },
    ];
    const shell = parts[0].mesh.material as T.MeshStandardMaterial;
    shell.transparent = true;
    shell.opacity = 0.18;
    shell.depthWrite = false;
    const bases = parts.map((p) => p.mesh.position.clone());
    parts.forEach((p) => mark(p.mesh, p.id));
    choices(panel, parts, (id) => (s.selection = id));
    return {
      update() {
        parts.forEach((p, i) =>
          p.mesh.position
            .copy(bases[i])
            .add(new T.Vector3(...p.offset).multiplyScalar(s.parameter)),
        );
        parts[0].mesh.visible = s.variant % 2 === 0;
        report({
          结构: s.selection || '整体',
          拆解比例: s.parameter,
          外膜: s.variant % 2 ? '隐藏' : '显示',
          数据来源: '原创概念几何 / 未接实验数据',
        });
      },
      select(id) {
        s.selection = id;
      },
      action() {
        s.variant++;
        s.status = '外膜显示已切换';
      },
    };
  }
  if (spec.slug === 'schematic-transition') {
    const positions: V3[] = [
      [-3, 2, 0],
      [-1, 2, 0],
      [1, 2, 0],
      [3, 2, 0],
      [-1, 0.6, 0],
      [1, 0.6, 0],
    ];
    const target: V3[] = [
      [-3, 1, 0],
      [-1, 3, -1],
      [1, 3, 1],
      [3, 1, 0],
      [-1, 0.6, 2],
      [1, 0.6, -2],
    ];
    const nodes = positions.map((p, i) =>
      mark(box(g, [0.7, 0.5, 0.6], p, i % 2 ? C.gold : C.cyan), 'part-' + i),
    );
    const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [2, 5],
      ],
      connections = edges.map(() => rod(g, [0, 0, 0], [0, 1, 0], 0.055, C.white));
    let goal: number | null = null;
    return {
      update(dt) {
        if (goal !== null) {
          s.parameter = lerp(s.parameter, goal, Math.min(1, dt * 3));
          if (Math.abs(s.parameter - goal) < 0.005) {
            s.parameter = goal;
            goal = null;
          }
        }
        nodes.forEach((m, i) =>
          m.position.set(...(positions[i].map((v, j) => lerp(v, target[i][j], s.parameter)) as V3)),
        );
        edges.forEach(([a, b], i) =>
          setRod(
            connections[i],
            nodes[a].position.toArray() as V3,
            nodes[b].position.toArray() as V3,
          ),
        );
        report({
          视图插值: s.parameter.toFixed(3),
          '稳定部件 ID': nodes.length,
          连接数: edges.length,
          选择: s.selection || '无',
        });
      },
      parameter() {
        goal = null;
      },
      select(id) {
        s.selection = id;
      },
      action() {
        goal = s.parameter > 0.5 ? 0 : 1;
        s.status = '视图转换已启动';
      },
    };
  }
  return warehouse(ctx);
}

function warehouse(ctx: SceneContext): Experiment {
  const { group: g, state: s, panel, report } = ctx;
  const blocked = new Set<string>();
  for (const x of [3, 6, 9])
    for (let y = 2; y < 9; y++) {
      blocked.add(x + ',' + y);
      box(g, [0.65, 1.3, 0.65], [x * 0.7 - 4, 0.65, y * 0.7 - 4], C.dark);
    }
  const world = ([x, y]: [number, number]): V3 => [x * 0.7 - 4, 0.3, y * 0.7 - 4];
  const robot = box(g, [0.55, 0.45, 0.55], world([0, 0]), C.cyan);
  const cargo = box(g, [0.4, 0.4, 0.4], world([11, 11]), C.gold);
  const dock = sphere(g, 0.25, world([0, 11]), C.green);
  let current: [number, number] = [0, 0],
    path: [number, number][] = [current],
    segment = 0,
    fraction = 0,
    stage = '待命',
    delivered = 0,
    reserved = false;
  const completed = new Set<string>();
  let task = '无';
  const preview = new T.Group();
  g.add(preview);
  const setPath = (goal: [number, number]) => {
    const next = astar(12, 12, blocked, current, goal);
    if (!next) {
      s.status = '目标不可达，保留库存';
      return false;
    }
    path = next;
    segment = 0;
    fraction = 0;
    clear(preview);
    next.forEach((p) => sphere(preview, 0.04, world(p), C.gold));
    return true;
  };
  panel.textContent =
    '货架占据离散网格。取货和送货各规划一次；库存只在卸货完成后增加。相同任务 ID 不会重复结算。';
  return {
    update(dt) {
      if (stage === '取货中' || stage === '送货中') {
        fraction += dt * s.parameter;
        while (fraction >= 1 && segment < path.length - 1) {
          fraction--;
          segment++;
          current = path[segment];
        }
        const a = world(path[segment]),
          b = world(path[Math.min(segment + 1, path.length - 1)]);
        robot.position.set(...(a.map((v, i) => lerp(v, b[i], fraction)) as V3));
        if (stage === '送货中') cargo.position.copy(robot.position).add(new T.Vector3(0, 0.55, 0));
        if (segment === path.length - 1) {
          if (stage === '取货中') {
            stage = '送货中';
            setPath([0, 11]);
          } else {
            if (!completed.has(task)) {
              completed.add(task);
              delivered++;
            }
            reserved = false;
            stage = '已完成';
            cargo.position.copy(dock.position).add(new T.Vector3(0.6, 0, 0));
            s.status = task + ' 已交付';
          }
        }
      }
      report({
        '任务 ID': task,
        机器人状态: stage,
        送达库存: delivered,
        货物预约: reserved ? '已预约' : '无',
        路径格数: path.length,
        '完成任务 ID 数': completed.size,
      });
    },
    action() {
      if (reserved) {
        s.status = '已有任务，重复命令未派发';
        return;
      }
      task = 'task-' + s.operations;
      cargo.position.set(...world([11, 11]));
      if (setPath([11, 11])) {
        reserved = true;
        stage = '取货中';
        s.status = task + ' 已派发';
      }
    },
  };
}
