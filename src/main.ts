import catalog from './catalog.json';
import type { DemoSpec } from './types';
import { mountExperiment } from './runtime';
import './style.css';
const demos = catalog as DemoSpec[],
  categories = [...new Set(demos.map((d) => d.category))];
const root = document.querySelector<HTMLElement>('#app')!;
let dispose: (() => void) | undefined;
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const repo = 'https://github.com/weisiwu/threejs-demo',
  base = import.meta.env.BASE_URL;
function nav() {
  return `<nav class="topnav"><a class="brand" href="#/">THREE<span>·</span>LAB</a><span class="nav-note">可操作的图形实验</span><a href="${repo}" target="_blank" rel="noreferrer">GitHub ↗</a></nav>`;
}
function gallery() {
  root.innerHTML =
    nav() +
    `<main><header class="gallery-hero"><div><p class="eyebrow">GEOMETRY / MOTION / SYSTEMS</p><h1>让原理<br><span>在屏幕上运转。</span></h1><p class="lead">43 个 Three.js 实验。转动机构、修改网表、调节参数，观察每一次操作如何改变场景。</p><a class="primary" href="#/demo/strandbeest">打开连杆实验 <span>↗</span></a></div><div class="hero-art" aria-hidden="true"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><div class="core"></div><span class="art-label">LIVE MECHANISMS<br>43 EXPERIMENTS</span></div></header><section class="catalogue"><div class="section-title"><h2>实验目录 <small>43</small></h2><label class="search">搜索实验<input id="search" placeholder="例如：连杆、电路、蛋白质" type="search"></label></div><div class="filters"><button class="active" data-filter="全部">全部</button>${categories.map((c) => `<button data-filter="${c}">${c}</button>`).join('')}</div><div id="cards" class="cards"></div><p id="empty" hidden>没有符合条件的实验。</p></section><footer>原创机制复现 · 每篇说明保留来源和验证范围 · <a href="https://imgen.baoganai.com/knowledge/read/dilum-sanjaya-analysis-index">阅读专题文章 ↗</a></footer></main>`;
  let selected = '全部';
  const search = document.querySelector<HTMLInputElement>('#search')!;
  const draw = () => {
    const items = demos.filter(
      (d) =>
        (selected === '全部' || d.category === selected) &&
        `${d.title} ${d.slug} ${d.subtitle}`.toLowerCase().includes(search.value.toLowerCase()),
    );
    document.querySelector('#cards')!.innerHTML = items
      .map(
        (d) =>
          `<a class="demo-card tone-${categories.indexOf(d.category)}" href="#/demo/${d.slug}"><div class="card-image"><img src="${base}previews/${d.slug}.png" alt="" loading="lazy" onerror="this.remove()"><div class="card-diagram" aria-hidden="true"><i></i><i></i><i></i></div><span>${d.slug.toUpperCase().replaceAll('-', ' / ')}</span></div><div class="card-text"><p>${d.category}</p><h3>${escape(d.title)} <span>↗</span></h3><p class="subtitle">${escape(d.subtitle)}</p></div></a>`,
      )
      .join('');
    document.querySelector<HTMLElement>('#empty')!.hidden = items.length > 0;
  };
  search.oninput = draw;
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.filter!;
        document
          .querySelectorAll('[data-filter]')
          .forEach((c) => c.classList.toggle('active', c === b));
        draw();
      }),
  );
  draw();
}
function detail(spec: DemoSpec) {
  document.title = spec.title + ' · Three.js 实验室';
  root.innerHTML =
    nav() +
    `<main class="detail"><header class="detail-header"><a class="back" href="#/">← 实验目录</a><p class="eyebrow">${escape(spec.category)} / ${escape(spec.slug)}</p><h1>${escape(spec.title)}</h1><p>${escape(spec.subtitle)}</p><div class="links"><a href="${repo}/blob/main/docs/${spec.slug}.md" target="_blank" rel="noreferrer">源码与研究记录 ↗</a>${spec.article ? `<a href="https://imgen.baoganai.com/knowledge/read/${spec.article}" target="_blank" rel="noreferrer">相关文章 ↗</a>` : ''}</div></header><section class="workbench"><div class="stage"><div class="stage-bar"><span class="live-dot"></span><span>交互场景</span><span id="clock">0.00 s</span></div><div id="viewport"></div><p class="stage-help">拖动旋转 · 滚轮缩放 · 点击可选部件</p></div><aside class="controls"><p class="eyebrow">CONTROLS</p><label for="parameter">${escape(spec.parameter.label)} <output id="parameter-value"></output></label><input id="parameter" type="range" min="${spec.parameter.min}" max="${spec.parameter.max}" step="${spec.parameter.step}" value="${spec.parameter.value}"><button id="action" class="primary">${escape(spec.action)}</button><div class="button-row"><button id="pause">暂停</button><button id="step">推进 1 秒</button><button id="reset">重置</button></div><div class="status-box"><span>操作回执</span><output id="status" aria-live="polite">就绪</output></div><div id="experiment-panel" class="experiment-panel"></div></aside></section><section class="readouts"><div><p class="eyebrow">LIVE READOUTS</p><h2>运行读数</h2></div><dl id="metrics"></dl></section><section class="research"><div><p class="eyebrow">HOW IT WORKS</p><h2>实现与边界</h2></div><div><p class="mechanism">${escape(spec.mechanism)}</p>${spec.research.map((p) => `<p>${escape(p)}</p>`).join('')}<p class="limit">${escape(spec.limit)}</p><div class="sources">${spec.sources.map((s) => `<a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)} ↗</a>`).join('')}</div></div></section><footer><a href="#/">返回 43 个实验</a> · <a href="${repo}">公开源码</a></footer></main>`;
  try {
    dispose = mountExperiment(spec);
    document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
      dispose?.();
      detail(spec);
    };
  } catch (e) {
    document.querySelector('#viewport')!.textContent = '场景加载失败：' + (e as Error).message;
    throw e;
  }
}
function route() {
  dispose?.();
  dispose = undefined;
  const slug = location.hash.match(/^#\/demo\/([\w-]+)$/)?.[1],
    spec = demos.find((d) => d.slug === slug);
  if (spec) detail(spec);
  else {
    document.title = 'Three.js 实验室';
    gallery();
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
