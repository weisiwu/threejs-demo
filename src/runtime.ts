import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clear, highlight } from './graphics';
import { present } from './presentation';
import { mechanics, mechanicsIds } from './scenes/mechanics';
import { science, scienceIds } from './scenes/science';
import { interfaces, interfaceIds } from './scenes/interfaces';
import { spaces, spaceIds } from './scenes/spaces';
import { clamp } from './math';
import type { DemoSpec, RuntimeState, Experiment } from './types';
import { sceneModels, modelNames } from './models/entries';

let renderer: T.WebGLRenderer | undefined;
let environment: T.Texture | undefined;
export function mountExperiment(spec: DemoSpec) {
  const host = document.querySelector<HTMLElement>('#viewport')!,
    panel = document.querySelector<HTMLElement>('#experiment-panel')!,
    metrics = document.querySelector<HTMLElement>('#metrics')!,
    slider = document.querySelector<HTMLInputElement>('#parameter')!,
    output = document.querySelector<HTMLOutputElement>('#parameter-value')!,
    status = document.querySelector<HTMLElement>('#status')!,
    clock = document.querySelector<HTMLElement>('#clock')!;
  if (!renderer) {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    const room = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 }).texture;
    room.dispose();
    pmrem.dispose();
  }
  const r = renderer;
  host.append(r.domElement);
  r.domElement.setAttribute('aria-label', spec.title + ' 三维场景');
  r.domElement.setAttribute('role', 'img');
  const scene = new T.Scene();
  scene.environment = environment!;
  scene.environmentIntensity = 0.7;
  scene.background = new T.Color(0x0d1924);
  const camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(10, 8, 12);
  const controls = new OrbitControls(camera, r.domElement);
  controls.target.set(0, spec.slug === 'black-hole' ? 0 : 2.4, 0);
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.88;
  controls.update();
  scene.add(new T.HemisphereLight(0xd3f7f0, 0x162a41, 2.5));
  const light = new T.DirectionalLight(0xffe1b2, 3.2);
  light.position.set(4, 10, 6);
  scene.add(light);
  const group = new T.Group();
  scene.add(group);
  const state: RuntimeState = {
    time: 0,
    parameter: spec.parameter.value,
    paused: false,
    selection: '',
    variant: 0,
    operations: 0,
    status: '就绪',
  };
  const fields = new Map<string, HTMLElement>();
  const report = (values: Record<string, string | number>) => {
    // 每次报告是一份完整快照，删除旧模式遗留的字段。
    for (const [key, cell] of fields) {
      if (!(key in values)) {
        cell.parentElement?.remove();
        fields.delete(key);
      }
    }
    for (const [key, value] of Object.entries(values)) {
      let cell = fields.get(key);
      if (!cell) {
        const row = document.createElement('div');
        row.className = 'metric';
        const label = document.createElement('dt');
        label.textContent = key;
        cell = document.createElement('dd');
        cell.dataset.metric = key;
        row.append(label, cell);
        metrics.append(row);
        fields.set(key, cell);
      }
      const text = String(value);
      if (cell.textContent !== text) cell.textContent = text;
    }
  };
  const context = { spec, scene, group, state, panel, report, camera, target: controls.target };
  let experiment: Experiment;
  if (mechanicsIds.has(spec.slug)) experiment = mechanics(context);
  else if (scienceIds.has(spec.slug)) experiment = science(context);
  else if (interfaceIds.has(spec.slug)) experiment = interfaces(context);
  else if (spaceIds.has(spec.slug)) experiment = spaces(context);
  else throw Error('未注册场景：' + spec.slug);
  experiment = present(context, experiment);
  const modelIds = sceneModels[spec.slug] ?? [];
  r.domElement.dataset.modelIds = modelIds.join(',');
  if (modelIds.length) {
    const links = document.createElement('p');
    links.className = 'model-downloads';
    links.append('本次重建的简版模型（GLB）：');
    for (const id of modelIds) {
      const a = document.createElement('a');
      a.href = import.meta.env.BASE_URL + 'models/' + id + '.glb';
      a.download = id + '.glb';
      a.textContent = modelNames[id];
      links.append(a);
    }
    panel.append(links);
  }
  controls.update();
  let frame = 0,
    alive = true,
    last = performance.now(),
    lastDraw = 0,
    renderDirty = true,
    raf = 0;
  const invalidate = () => {
    renderDirty = true;
  };
  const previousLoad = T.DefaultLoadingManager.onLoad;
  const loaded = () => {
    previousLoad?.();
    invalidate();
  };
  T.DefaultLoadingManager.onLoad = loaded;
  panel.addEventListener('click', invalidate);
  panel.addEventListener('input', invalidate);
  panel.addEventListener('change', invalidate);
  const resize = () => {
    const width = host.clientWidth,
      height = host.clientHeight;
    r.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const sync = () => {
    slider.value = String(state.parameter);
    output.value = state.parameter.toFixed(spec.parameter.step < 1 ? 2 : 0);
    status.textContent = state.status;
    status.dataset.operations = String(state.operations);
    clock.textContent = state.time.toFixed(2) + ' s';
    clock.dataset.time = String(state.time);
    r.domElement.dataset.frames = String(frame);
    r.domElement.dataset.calls = String(r.info.render.calls);
    r.domElement.dataset.geometries = String(r.info.memory.geometries);
    r.domElement.dataset.textures = String(r.info.memory.textures);
    const activeModels: string[] = [];
    group.traverse((o) => {
      if (!o.userData.modelId || o.userData.miniature) return;
      for (let p: T.Object3D | null = o; p; p = p.parent) if (!p.visible) return;
      activeModels.push(o.userData.modelId);
    });
    r.domElement.dataset.activeModels = activeModels.join(',');
    document.querySelector('#pause')!.textContent = state.paused ? '继续' : '暂停';
  };
  const step = (dt: number) => {
    state.time += dt;
    experiment.update(dt);
  };
  const render = (advanceControls = true) => {
    if (advanceControls) controls.update();
    highlight(group, state.selection);
    r.shadowMap.needsUpdate = renderDirty;
    r.render(scene, camera);
    frame++;
    renderDirty = false;
    sync();
  };
  const loop = (now: number) => {
    if (!alive) return;
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    if (!state.paused && document.visibilityState === 'visible') {
      step(dt);
      invalidate();
    } else experiment.update(0);
    const viewChanged = controls.update();
    if ((renderDirty || viewChanged) && (state.paused || now - lastDraw >= 1000 / 30)) {
      render(false);
      lastDraw = now;
    }
    raf = requestAnimationFrame(loop);
  };
  const resetClock = () => {
    last = performance.now();
    invalidate();
  };
  document.addEventListener('visibilitychange', resetClock);
  const choose = (id: string) => {
    state.selection = id;
    experiment.select?.(id);
    invalidate();
    if (['planet-explorer', 'solar-system-orbits'].includes(spec.slug)) {
      let obj: T.Object3D | undefined;
      group.traverse((o) => {
        if (o.userData.entityId === id) obj = o;
      });
      if (obj) {
        const p = obj.getWorldPosition(new T.Vector3());
        controls.target.copy(p);
        camera.position.copy(p).add(new T.Vector3(5, 4, 5));
      }
    }
  };
  const panelSelect = (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-select]');
    if (b) choose(b.dataset.select!);
  };
  panel.addEventListener('click', panelSelect);
  const raycaster = new T.Raycaster();
  let down: [number, number] = [0, 0];
  const pointerDown = (e: PointerEvent) => {
    down = [e.clientX, e.clientY];
  };
  const pointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const rect = r.domElement.getBoundingClientRect();
    raycaster.setFromCamera(
      new T.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const visible = (object: T.Object3D) => {
      for (let o: T.Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
      return true;
    };
    const hit = raycaster
      .intersectObject(group, true)
      .find((h) => h.object.userData.entityId && visible(h.object));
    if (hit) choose(hit.object.userData.entityId);
  };
  r.domElement.addEventListener('pointerdown', pointerDown);
  r.domElement.addEventListener('pointerup', pointerUp);
  slider.oninput = () => {
    state.parameter = clamp(Number(slider.value), spec.parameter.min, spec.parameter.max);
    experiment.parameter?.(state.parameter);
    experiment.update(0);
    invalidate();
    sync();
  };
  document.querySelector<HTMLButtonElement>('#action')!.onclick = () => {
    state.operations++;
    experiment.action();
    experiment.update(0);
    invalidate();
    if (spec.slug === 'solar-system-orbits') choose(state.selection);
    sync();
  };
  document.querySelector<HTMLButtonElement>('#pause')!.onclick = () => {
    state.paused = !state.paused;
    resetClock();
    sync();
  };
  document.querySelector<HTMLButtonElement>('#step')!.onclick = () => {
    state.paused = true;
    for (let i = 0; i < 20; i++) step(0.05);
    invalidate();
    render();
  };
  experiment.update(0);
  render();
  raf = requestAnimationFrame(loop);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    observer.disconnect();
    document.removeEventListener('visibilitychange', resetClock);
    panel.removeEventListener('click', panelSelect);
    panel.removeEventListener('click', invalidate);
    panel.removeEventListener('input', invalidate);
    panel.removeEventListener('change', invalidate);
    if (T.DefaultLoadingManager.onLoad === loaded) T.DefaultLoadingManager.onLoad = previousLoad;
    r.domElement.removeEventListener('pointerdown', pointerDown);
    r.domElement.removeEventListener('pointerup', pointerUp);
    controls.dispose();
    experiment.dispose?.();
    clear(scene);
    r.renderLists.dispose();
    panel.replaceChildren();
    r.domElement.remove();
  };
}
