import * as T from 'three';
import { COLORS as C, box, sphere, rod, setRod, cylinder, torus, mark, clear } from '../graphics';
import { TAU, lerp, astar, type V3 } from '../math';
import type { SceneContext, Experiment } from '../types';
import { createModel, type ModelId } from '../models/model-kit';
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
function markComponent(root: T.Object3D, id: string) {
  const copies = new Map<T.Material, T.Material>();
  root.traverse((o) => {
    const m = o as T.Mesh;
    if (!m.material) return;
    const clone = (mat: T.Material) => {
      if (!copies.has(mat)) copies.set(mat, mat.clone());
      return copies.get(mat)!;
    };
    m.material = Array.isArray(m.material) ? m.material.map(clone) : clone(m.material);
  });
  mark(root, id);
}

export function spaces(ctx: SceneContext): Experiment {
  const { group: g, state: s, spec, panel, report } = ctx;
  if (spec.slug === 'character-selection' || spec.slug === 'robot-roster') {
    const ids = ['scout', 'engineer', 'guardian'],
      names = ['侦察型', '工程型', '守卫型'];
    const assetIds: ModelId[] =
      spec.slug === 'robot-roster'
        ? ['robot-assault', 'robot-sentry', 'robot-engineer']
        : ['cyber-scout', 'cyber-engineer', 'cyber-guardian'];
    const models = ids.map((id, i) => {
      const model = createModel(assetIds[i]);
      g.add(model);
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
          资源来源: '本仓库简版模型 / 可下载 GLB',
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
    const thrusters = new Map<string, T.Object3D[]>();
    const assetIds: ModelId[] = ['ship-hauler', 'ship-freighter', 'ship-explorer'];
    const models = ids.map((id, i) => {
      const m = createModel(assetIds[i]);
      g.add(m);
      mark(m, id);
      thrusters.set(
        id,
        ['engine-left', 'engine-right'].map((name) => m.getObjectByName(name)!),
      );
      return m;
    });
    const equipment = new Map(ids.map((id) => [id, true]));
    s.selection = ids[0];
    choices(
      panel,
      ids.map((id, i) => ({ id, name: ['标准货运艇', '重载货运艇', '探索艇'][i] })),
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
    const actor = createModel('industrial-robot');
    g.add(actor);
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea')) return;
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keys.add(e.key);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key),
      blur = () => keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    panel.textContent = 'W A S D 或方向键移动。工业舱室的地板、展示台与工作台使用对应碰撞边界。';
    const height = (x: number, z: number) => (Math.hypot(x, z) < 1.8 ? 0.16 : 0);
    return {
      update(dt) {
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
        const x = Math.max(-5.15, Math.min(5.15, actor.position.x + dx)),
          z = Math.max(-7.5, Math.min(7.5, actor.position.z + dz));
        if (Math.abs(x) < 4.15) {
          actor.position.x = x;
          actor.position.z = z;
        }
        actor.position.y = height(actor.position.x, actor.position.z);
        if (dx || dz) actor.rotation.y = Math.atan2(dx, dz);
        report({
          '角色 X': actor.position.x.toFixed(2),
          '角色 Z': actor.position.z.toFixed(2),
          地面高度: actor.position.y.toFixed(2),
          场景: s.variant % 2 ? '夜间照明' : '日间照明',
          素材: '简版舱室与机器人 / 可下载 GLB',
        });
      },
      action() {
        s.variant++;
        s.status = '环境照明已切换';
      },
      dispose() {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
        window.removeEventListener('blur', blur);
      },
    };
  }
  if (spec.slug === 'skeleton-explorer') {
    const model = createModel('winged-skeleton');
    g.add(model);
    const offsets: Record<string, V3> = {
      skull: [1, 0.6, 0],
      neck: [0.45, 0.25, 0],
      spine: [0, 0.45, 0],
      ribcage: [0, 0, 0.55],
      tail: [-1, 0, 0],
      'left-wing': [0, 0.4, -1],
      'right-wing': [0, 0.4, 1],
      'left-leg': [0, -0.3, -0.5],
      'right-leg': [0, -0.3, 0.5],
    };
    const parts = model.children.map((mesh) => ({
      id: mesh.name,
      mesh,
      base: mesh.position.clone(),
      offset: new T.Vector3(...(offsets[mesh.name] ?? ([0, 0, 0] as V3))),
    }));
    parts.forEach((p) => markComponent(p.mesh, p.id));
    choices(
      panel,
      parts.map((p) => ({ id: p.id, name: p.id })),
      (id) => (s.selection = id),
    );
    return {
      update() {
        parts.forEach((p) => {
          p.mesh.position.copy(p.base).addScaledVector(p.offset, s.parameter);
          p.mesh.visible = s.variant % 2 === 0 || p.id === s.selection;
        });
        report({
          部件数: parts.length,
          选中部件: s.selection || '无',
          模式: s.variant % 2 ? '仅选中' : '整体',
          结构范围: '简版翼兽骨架 / 可下载 GLB / 非医学模型',
        });
      },
      select(id) {
        if (parts.some((p) => p.id === id)) s.selection = id;
      },
      action() {
        if (!s.selection) s.selection = 'skull';
        s.variant++;
        s.status = '显示范围已切换';
      },
    };
  }
  if (spec.slug === 'biological-structure') {
    const model = createModel('plant-cell');
    g.add(model);
    const names: Record<string, string> = {
      shell: '细胞壁',
      vacuole: '中央液泡',
      nucleus: '细胞核',
      'endoplasmic-reticulum': '内质网',
      'organelle-1': '叶绿体',
      'organelle-2': '线粒体',
      golgi: '高尔基体',
      ribosomes: '核糖体',
    };
    const parts = model.children
      .filter((m) => m instanceof T.Group)
      .map((mesh, i) => ({
        id: mesh.name,
        name: names[mesh.name],
        mesh,
        base: mesh.position.clone(),
        offset: new T.Vector3(Math.cos(i * 2.4) * 1.2, i === 0 ? 0 : 0.35, Math.sin(i * 2.4) * 1.2),
      }));
    parts.forEach((p) => markComponent(p.mesh, p.id));
    choices(panel, parts, (id) => (s.selection = id));
    return {
      update() {
        parts.forEach((p) => p.mesh.position.copy(p.base).addScaledVector(p.offset, s.parameter));
        model.getObjectByName('shell')!.visible = s.variant % 2 === 0;
        report({
          结构: names[s.selection] || '植物细胞',
          拆解比例: s.parameter,
          外膜: s.variant % 2 ? '隐藏' : '显示',
          部件数: parts.length,
          数据来源: '参考画面重建的简版 GLB / 非实验数据',
        });
      },
      select(id) {
        if (parts.some((p) => p.id === id)) s.selection = id;
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
