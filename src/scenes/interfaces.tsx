import * as T from 'three';
import React, { createContext, memo, useContext, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { COLORS as C, box, sphere, rod, setRod, line, mark, clear, cylinder } from '../graphics';
import {
  TAU,
  zScore,
  sceneCommand,
  parseCircuit,
  solveCircuit,
  type SceneObject,
  type Circuit,
  type V3,
} from '../math';
import type { SceneContext, Experiment } from '../types';

export const interfaceIds = new Set([
  'customizable-dashboard',
  'state-management',
  'visibility-dashboard',
  'network-management',
  'scene-builder',
  'anomaly-monitor',
  'smart-home',
  'interactive-map',
  'futuristic-interface',
  'reactor-diagnostics',
  'circuit-builder',
]);
function button(panel: HTMLElement, label: string, run: () => void) {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = run;
  panel.append(b);
  return b;
}
function note(panel: HTMLElement, text: string) {
  const p = document.createElement('p');
  p.textContent = text;
  panel.append(p);
  return p;
}
function editor(panel: HTMLElement, label: string, value: unknown) {
  const l = document.createElement('label');
  l.textContent = label;
  const t = document.createElement('textarea');
  t.setAttribute('aria-label', label);
  t.value = JSON.stringify(value, null, 2);
  t.spellcheck = false;
  l.append(t);
  panel.append(l);
  return t;
}

export function interfaces(ctx: SceneContext): Experiment {
  const { group: g, state: s, spec, panel, report } = ctx;
  if (spec.slug === 'state-management') return stateLaboratory(ctx);
  if (spec.slug === 'scene-builder') {
    let objects: SceneObject[] = [],
      dirty = true;
    const holder = new T.Group();
    g.add(holder);
    const t = editor(panel, '场景指令', {
      op: 'add',
      objects: [{ id: 'object-1', type: 'box', position: [0, 1.5, 0], size: 1, color: '#57dfdd' }],
    });
    button(panel, '准备清空指令', () => {
      t.value = JSON.stringify({ op: 'clear' });
    });
    return {
      update() {
        if (dirty) {
          clear(holder);
          for (const o of objects) {
            const color = Number.parseInt(o.color.slice(1), 16);
            const m =
              o.type === 'box'
                ? box(holder, [o.size, o.size, o.size], o.position, color)
                : o.type === 'sphere'
                  ? sphere(holder, o.size * 0.5, o.position, color)
                  : cylinder(holder, o.size * 0.5, o.size, o.position, color);
            mark(m, o.id);
          }
          dirty = false;
        }
        holder.rotation.y = s.time * 0.08;
        report({
          物体数量: objects.length,
          指令状态: s.status,
          执行边界: '白名单 JSON / 无脚本执行',
        });
      },
      action() {
        try {
          objects = sceneCommand(t.value, objects);
          dirty = true;
          s.status = '指令已应用';
          const id = 'object-' + (objects.length + 1);
          t.value = JSON.stringify(
            {
              op: 'add',
              objects: [
                {
                  id,
                  type: 'sphere',
                  position: [objects.length * 1.4 - 2, 1.5, 0],
                  size: s.parameter,
                  color: '#f2c37c',
                },
              ],
            },
            null,
            2,
          );
        } catch (e) {
          s.status = (e as Error).message;
        }
      },
      parameter(value) {
        try {
          const cmd = JSON.parse(t.value);
          if (cmd.op === 'add') {
            cmd.objects.forEach((o: SceneObject) => (o.size = value));
            t.value = JSON.stringify(cmd, null, 2);
          }
        } catch {}
      },
    };
  }
  if (spec.slug === 'circuit-builder') {
    let circuit: Circuit = {
      nodes: ['0', 'in', 'out'],
      parts: [
        { id: 'V1', type: 'voltage-source', pins: ['in', '0'], value: 12 },
        { id: 'R1', type: 'resistor', pins: ['in', 'out'], value: 1000 },
        { id: 'R2', type: 'resistor', pins: ['out', '0'], value: 1000 },
      ],
    };
    const t = editor(panel, '电路网表', circuit),
      holder = new T.Group();
    g.add(holder);
    let voltages = solveCircuit(circuit),
      dirty = true;
    const apply = () => {
      try {
        const next = parseCircuit(t.value),
          solved = solveCircuit(next);
        circuit = next;
        voltages = solved;
        dirty = true;
        s.status = '网表已求解';
      } catch (e) {
        s.status = (e as Error).message;
      }
    };
    return {
      update() {
        if (dirty) {
          clear(holder);
          const pos = new Map(
            circuit.nodes.map((id, i) => [
              id,
              [
                Math.cos((i * TAU) / circuit.nodes.length) * 3,
                2,
                Math.sin((i * TAU) / circuit.nodes.length) * 3,
              ] as V3,
            ]),
          );
          for (const [id, p] of pos)
            mark(sphere(holder, 0.24, p, id === '0' ? C.dark : C.gold), id);
          circuit.parts.forEach((p) =>
            rod(
              holder,
              pos.get(p.pins[0])!,
              pos.get(p.pins[1])!,
              0.08,
              p.type === 'resistor' ? C.cyan : C.red,
            ),
          );
          dirty = false;
        }
        report({
          ...Object.fromEntries(
            Object.entries(voltages).map(([id, v]) => ['节点 ' + id + '（V）', v.toFixed(4)]),
          ),
          器件数量: circuit.parts.length,
          网表状态: s.status,
          求解模型: '线性直流 MNA',
        });
      },
      action: apply,
      parameter(value) {
        const next = structuredClone(circuit);
        const v = next.parts.find((p) => p.type === 'voltage-source');
        if (v) v.value = value;
        t.value = JSON.stringify(next, null, 2);
        apply();
      },
    };
  }
  if (spec.slug === 'customizable-dashboard') {
    const key = 'threejs-demo.dashboard.v1';
    let ids = ['revenue', 'orders', 'traffic'],
      dirty = true;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (
        Array.isArray(stored) &&
        stored.length <= 6 &&
        new Set(stored).size === stored.length &&
        stored.every((v) => typeof v === 'string' && v.length < 40)
      )
        ids = stored;
    } catch {
      localStorage.removeItem(key);
    }
    const holder = new T.Group();
    g.add(holder);
    const list = document.createElement('div');
    list.className = 'widget-list';
    panel.append(list);
    const rebuild = () => {
      clear(holder);
      list.replaceChildren();
      ids.forEach((id, i) => {
        const b = box(
          holder,
          [1.3, (i + 1) * s.parameter, 0.8],
          [(i - (ids.length - 1) / 2) * 1.8, ((i + 1) * s.parameter) / 2, 0],
          i % 2 ? C.gold : C.cyan,
        );
        mark(b, id);
        const row = document.createElement('div');
        row.className = 'widget-row';
        row.append(document.createTextNode(id));
        button(row, '上移 ' + id, () => {
          if (i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
          dirty = true;
        });
        button(row, '删除 ' + id, () => {
          ids = ids.filter((v) => v !== id);
          dirty = true;
        });
        list.append(row);
      });
      dirty = false;
    };
    button(panel, '添加图表', () => {
      if (ids.length < 6) {
        let i = 1;
        while (ids.includes('metric-' + i)) i++;
        ids.push('metric-' + i);
        dirty = true;
      }
    });
    return {
      update() {
        if (dirty) rebuild();
        report({ 图表数量: ids.length, 顺序: ids.join(' → '), 保存状态: s.status });
      },
      parameter() {
        dirty = true;
      },
      action() {
        localStorage.setItem(key, JSON.stringify(ids));
        s.status = '布局已保存';
      },
    };
  }
  if (spec.slug === 'visibility-dashboard') {
    const card = document.createElement('div');
    card.className = 'sampling-card';
    card.textContent = '可见时采样';
    panel.append(card);
    let visible = true,
      hidden = false,
      count = 0,
      acc = 0;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    observer.observe(card);
    const bars = Array.from({ length: 12 }, (_, i) =>
      box(g, [0.4, 0.2, 0.6], [i * 0.6 - 3.3, 0.1, 0], C.cyan),
    );
    return {
      update(dt) {
        acc += dt;
        if (visible && !hidden && document.visibilityState === 'visible' && acc >= s.parameter) {
          acc = 0;
          count++;
          bars.forEach((b, i) => {
            b.scale.y = 1 + Math.abs(Math.sin(count * 0.3 + i)) * 15;
            b.position.y = b.scale.y * 0.1;
          });
        }
        card.textContent = `可见时采样 · ${count}`;
        report({
          样本数: count,
          采样门: visible && !hidden && document.visibilityState === 'visible' ? '打开' : '关闭',
          '采样周期（秒）': s.parameter,
        });
      },
      action() {
        hidden = !hidden;
        card.style.visibility = hidden ? 'hidden' : 'visible';
        s.status = hidden ? '采样卡片已隐藏' : '采样卡片已恢复';
      },
      dispose() {
        observer.disconnect();
      },
    };
  }
  if (spec.slug === 'network-management') {
    const devices = Array.from({ length: 16 }, (_, i) => ({
      id: 'device-' + (i + 1),
      enabled: i !== 2,
      revision: 0,
      locked: i === 2,
      mesh: mark(
        box(g, [0.7, 0.45, 0.7], [((i % 4) - 1.5) * 1.6, 0.8, Math.floor(i / 4) * 1.4 - 2]),
        'device-' + (i + 1),
      ),
    }));
    const selected = new Set<string>();
    const seen = new Set<number>();
    let success = 0,
      failed = 0;
    devices.forEach((d) => {
      const label = document.createElement('label');
      label.className = 'check-row';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('aria-label', d.id);
      input.onchange = () => (input.checked ? selected.add(d.id) : selected.delete(d.id));
      label.dataset.device = d.id;
      label.append(input, document.createTextNode(d.id + (d.locked ? ' · 锁定' : '')));
      panel.append(label);
    });
    return {
      update() {
        devices.forEach((d, i) => {
          d.mesh.scale.y = d.enabled ? 1 : 0.35;
          d.mesh.visible = i < Math.round(s.parameter);
          panel.querySelector<HTMLElement>('[data-device="' + d.id + '"]')!.hidden =
            !d.mesh.visible;
          if (!d.mesh.visible) {
            selected.delete(d.id);
            panel.querySelector<HTMLInputElement>('[aria-label="' + d.id + '"]')!.checked = false;
          }
        });
        report({
          已选设备: selected.size,
          成功回执: success,
          失败回执: failed,
          '操作 ID 数': seen.size,
          显示设备数: Math.round(s.parameter),
        });
      },
      action() {
        if (!selected.size) {
          s.status = '请先选择设备';
          return;
        }
        if (seen.has(s.operations)) return;
        seen.add(s.operations);
        success = 0;
        failed = 0;
        devices.forEach((d) => {
          if (selected.has(d.id)) {
            if (d.locked) failed++;
            else {
              d.enabled = !d.enabled;
              d.revision++;
              success++;
            }
          }
        });
        s.status = `批次 ${s.operations}：${success} 成功 / ${failed} 锁定`;
      },
    };
  }
  if (spec.slug === 'anomaly-monitor') {
    const series = Array.from({ length: 36 }, (_, i) => 20 + Math.sin(i * 0.7) * 2);
    const bars = series.map((v, i) =>
      box(g, [0.18, v * 0.1, 0.4], [(i - 17.5) * 0.25, v * 0.05, 0], C.cyan),
    );
    let score = 0,
      alerts = 0,
      lastId = '无';
    return {
      update() {
        score = zScore(series.slice(0, -1), series.at(-1)!);
        bars.forEach((b, i) => {
          b.scale.y = series[i] / (20 + Math.sin(i * 0.7) * 2);
          b.position.y = series[i] * 0.05;
        });
        (bars.at(-1)!.material as T.MeshStandardMaterial).color.setHex(
          score > s.parameter ? C.red : C.cyan,
        );
        report({
          最后样本: series.at(-1)!.toFixed(2),
          'Z 分数': score.toFixed(3),
          阈值: s.parameter,
          告警数: alerts,
          '最后告警 ID': lastId,
        });
      },
      action() {
        series.push(45 + alerts * 4);
        series.shift();
        score = zScore(series.slice(0, -1), series.at(-1)!);
        if (score > s.parameter) {
          alerts++;
          lastId = 'alert-' + s.operations;
          s.status = '异常已记录：' + lastId;
        } else s.status = '本次样本未越过阈值';
      },
    };
  }
  if (spec.slug === 'smart-home') {
    const rooms = ['客厅', '厨房', '卧室', '书房'].map((name, i) => {
      const room = new T.Group();
      room.position.set(((i % 2) - 0.5) * 4, 0, (Math.floor(i / 2) - 0.5) * 4);
      g.add(room);
      box(room, [3.6, 0.2, 3.6], [0, 0.1, 0], C.dark);
      rod(room, [-1.8, 0.2, -1.8], [-1.8, 2, -1.8], 0.08, C.white);
      const lamp = sphere(room, 0.3, [0, 2, 0], C.gold);
      return { id: 'room-' + i, name, on: i !== 2, revision: 0, lamp };
    });
    s.selection = 'room-0';
    rooms.forEach((r) =>
      button(panel, r.name, () => {
        s.selection = r.id;
      }),
    );
    return {
      update() {
        rooms.forEach((r) => {
          const mat = r.lamp.material as T.MeshStandardMaterial;
          mat.emissive.setHex(r.on ? C.gold : 0);
          mat.emissiveIntensity = r.on ? s.parameter : 0;
          r.lamp.scale.setScalar(r.on ? 1 : 0.5);
        });
        const r = rooms.find((r) => r.id === s.selection)!;
        report({
          房间: r.name,
          灯光: r.on ? '开' : '关',
          设备修订号: r.revision,
          模拟回执: s.status,
          真实设备连接: '无',
        });
      },
      select(id) {
        if (rooms.some((r) => r.id === id)) s.selection = id;
      },
      action() {
        const r = rooms.find((r) => r.id === s.selection)!;
        r.on = !r.on;
        r.revision++;
        s.status = `op-${s.operations} 已确认`;
      },
    };
  }
  if (spec.slug === 'interactive-map') {
    const nodes = Array.from({ length: 16 }, (_, i) => ({
      id: 'node-' + i,
      kind: i % 2,
      position: [((i % 4) - 1.5) * 2, 1, (Math.floor(i / 4) - 1.5) * 2] as V3,
      mesh: sphere(
        g,
        0.2,
        [((i % 4) - 1.5) * 2, 1, (Math.floor(i / 4) - 1.5) * 2],
        i % 2 ? C.gold : C.cyan,
      ),
    }));
    nodes.forEach((n) => mark(n.mesh, n.id));
    for (let i = 0; i < 12; i++) rod(g, nodes[i].position, nodes[i + 4].position, 0.025, C.dark);
    nodes.slice(0, 8).forEach((n) =>
      button(panel, n.id, () => {
        s.selection = n.id;
      }),
    );
    return {
      update() {
        nodes.forEach(
          (n) => (n.mesh.visible = s.variant % 3 === 0 || n.kind === (s.variant % 3) - 1),
        );
        g.scale.setScalar(s.parameter);
        report({
          筛选: ['全部', '青色节点', '金色节点'][s.variant % 3],
          可见节点: nodes.filter((n) => n.mesh.visible).length,
          '选中 ID': s.selection || '无',
          地图尺度: s.parameter,
        });
      },
      select(id) {
        if (nodes.some((n) => n.id === id)) s.selection = id;
      },
      action() {
        s.variant++;
        s.status = '筛选已更新';
      },
    };
  }
  if (spec.slug === 'futuristic-interface') {
    const ring = new T.Group();
    g.add(ring);
    for (let i = 0; i < 40; i++)
      box(
        ring,
        [0.15, 0.12, 0.55],
        [Math.cos((i * TAU) / 40) * 3, 2.5, Math.sin((i * TAU) / 40) * 3],
        i % 4 ? C.cyan : C.gold,
      );
    const scanner = rod(g, [0, 0.3, 0], [0, 4.8, 0], 0.08, C.gold);
    let elapsed = 0,
      running = false;
    return {
      update(dt) {
        if (running) {
          elapsed += dt;
          if (elapsed >= s.parameter) {
            elapsed = s.parameter;
            running = false;
            s.status = '扫描完成';
          }
        }
        ring.rotation.y = (elapsed * TAU) / Math.max(s.parameter, 0.1);
        scanner.rotation.z = Math.sin(elapsed) * 0.3;
        report({
          阶段: running ? '扫描中' : elapsed ? '完成' : '待命',
          进度: Math.round((elapsed / s.parameter) * 100) + '%',
          完成任务: s.variant,
        });
      },
      action() {
        if (!running) {
          running = true;
          elapsed = 0;
          s.variant++;
          s.status = '扫描任务已启动';
        }
      },
    };
  }
  // 诊断面板使用可重复的遥测样本；故障与事件属于同一个快照。
  const core = cylinder(g, 1.3, 3, [0, 2, 0], C.cyan);
  const pipes = Array.from({ length: 6 }, (_, i) =>
    rod(
      g,
      [Math.cos((i * TAU) / 6) * 1.4, 1, Math.sin((i * TAU) / 6) * 1.4],
      [Math.cos((i * TAU) / 6) * 2.5, 0.4, Math.sin((i * TAU) / 6) * 2.5],
      0.12,
      C.gold,
    ),
  );
  let fault = false;
  return {
    update() {
      const temperature = 40 + s.parameter * 35 + (fault ? 55 : 0);
      (core.material as T.MeshStandardMaterial).color.setHex(temperature > 100 ? C.red : C.cyan);
      core.rotation.y = s.time * 0.15;
      report({
        负载: s.parameter.toFixed(2),
        '温度（示例值）': temperature.toFixed(1),
        故障: fault ? '冷却失效' : '无',
        事件版本: s.variant,
        诊断: '规则阈值 / 无模型调用',
      });
    },
    action() {
      fault = !fault;
      s.variant++;
      s.status = fault ? '故障事件已注入' : '故障事件已清除';
    },
  };
}

const CounterContext = createContext(0);
function stateLaboratory(ctx: SceneContext): Experiment {
  const { group: g, panel, report, state: s } = ctx;
  const tiles = Array.from({ length: 4 }, (_, i) =>
    box(g, [1.2, 0.4, 1.2], [(i - 1.5) * 1.8, 0.4, 0], i % 2 ? C.gold : C.cyan),
  );
  let value = 0,
    listeners = new Set<() => void>(),
    parentRenders = 0;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };
  const snapshot = () => value;
  const counts = { plain: 0, memo: 0, context: 0, store: 0 };
  function Plain({ value }: { value: number }) {
    counts.plain++;
    return <output>普通组件：{value}</output>;
  }
  const Memo = memo(function Memo({ value }: { value: number }) {
    counts.memo++;
    return <output>memo 组件：{value}</output>;
  });
  function Context() {
    counts.context++;
    return <output>Context：{useContext(CounterContext)}</output>;
  }
  const contextChild = <Context />;
  function Store() {
    counts.store++;
    return <output>订阅组件：{useSyncExternalStore(subscribe, snapshot)}</output>;
  }
  const mount = document.createElement('div');
  mount.className = 'state-lab';
  panel.append(mount);
  const root = createRoot(mount);
  let increment = () => {},
    noise = () => {};
  function Lab() {
    const [n, setN] = useState(0),
      [v, setV] = useState(0);
    increment = () => {
      value++;
      setV(value);
      listeners.forEach((cb) => cb());
    };
    noise = () => setN((v) => v + 1);
    parentRenders++;
    return (
      <CounterContext.Provider value={v}>
        <button onClick={increment}>增加计数</button>
        <button onClick={noise}>无关父级更新</button>
        <p>父级噪声 {n}</p>
        <Plain value={v} />
        <Memo value={v} />
        {contextChild}
        <Store />
      </CounterContext.Provider>
    );
  }
  root.render(<Lab />);
  note(
    panel,
    '先增加计数，再触发无关父级更新。观察 memo 与 Context 的渲染次数；计数来自本次挂载。',
  );
  return {
    update() {
      tiles.forEach((t, i) => {
        const n = Object.values(counts)[i];
        t.scale.y = 1 + n * 0.15;
        t.position.y = t.scale.y * 0.2;
      });
      report({
        计数值: value,
        父级渲染: parentRenders,
        普通组件渲染: counts.plain,
        'memo 渲染': counts.memo,
        'Context 渲染': counts.context,
        订阅组件渲染: counts.store,
        有效订阅数: listeners.size,
      });
    },
    action() {
      increment();
      s.status = '状态已递增';
    },
    parameter() {
      noise();
    },
    dispose() {
      root.unmount();
      listeners.clear();
    },
  };
}
