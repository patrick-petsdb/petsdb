/* PetsDB — Pets Deserve Better
   Cat & dog health and welfare records organised around the Five Domains Model.
   Vanilla JS, offline-first, all data stays on the device (IndexedDB). */
(function () {
  'use strict';

  const C = window.PETSDB_CONTENT;
  const I18N = window.PETSDB_I18N;
  const DOMAINS = C.domains;
  const DOM = {};
  DOMAINS.forEach((d) => { DOM[d.id] = d; });
  const FACTOR_DOMAINS = ['nutrition', 'environment', 'health', 'behaviour'];
  const COLLECTIONS = ['weights', 'medical', 'treatments', 'activities', 'moods', 'assessments'];
  const LB = 2.20462;

  /* ================= Utilities ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const toDate = (s) => { if (!s) return null; const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
  const byDateAsc = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.created || 0) - (b.created || 0));
  const byDateDesc = (a, b) => -byDateAsc(a, b);
  const round = (v, d = 1) => { const f = Math.pow(10, d); return Math.round(v * f) / f; };
  const find = (list, id) => (list || []).find((x) => String(x.id) === String(id));
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);

  /* ================= State & i18n ================= */
  let state = null;
  const ui = { wRange: '1y', treatFilter: 'all', energy: {}, draft: null, lastRoute: '', charts: {}, expanded: {}, sheet: null, photoDraft: undefined, lastW: 0 };

  const lang = () => (state && state.settings.lang) || 'en';
  function t(key, vars) {
    const dict = I18N[lang()] || I18N.en;
    let s = dict[key] ?? I18N.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }
  const L = (o) => (o == null ? '' : typeof o === 'object' && !Array.isArray(o) ? (o[lang()] ?? o.en) : o);
  const locale = () => (lang() === 'zh' ? 'zh-HK' : 'en-GB');

  function fmtDate(s, opts) {
    const d = toDate(s);
    if (!d || isNaN(d)) return '';
    return new Intl.DateTimeFormat(locale(), opts || { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }
  const fmtShortDate = (s) => fmtDate(s, { day: 'numeric', month: 'short' });
  const fmtNum = (v, d = 1) => Number(v).toLocaleString(locale(), { maximumFractionDigits: d });
  const unit = () => state.settings.unit || 'kg';
  const kgToDisp = (kg) => (unit() === 'lb' ? kg * LB : kg);
  const dispToKg = (v) => (unit() === 'lb' ? v / LB : v);
  function fmtW(kg, withUnit = true) {
    if (kg == null || isNaN(kg)) return '–';
    const s = fmtNum(kgToDisp(kg), 2);
    return withUnit ? `${s} ${unit()}` : s;
  }

  function ageParts(dob) {
    const b = toDate(dob);
    if (!b) return null;
    const n = new Date();
    let m = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
    if (n.getDate() < b.getDate()) m--;
    if (m < 0) return null;
    return { y: Math.floor(m / 12), m: m % 12, total: m };
  }
  function fmtAge(dob) {
    const a = ageParts(dob);
    if (!a) return '';
    if (a.y === 0) return t('age_m', { m: a.m });
    if (a.m === 0) return t('age_y', { y: a.y });
    return t('age_ym', { y: a.y, m: a.m });
  }
  function lifeStage(pet) {
    const a = ageParts(pet.dob);
    if (!a) return null;
    const y = a.total / 12;
    if (pet.species === 'cat') return y < 1 ? 'kitten' : y < 7 ? 'adult' : y < 11 ? 'mature' : 'senior';
    return y < 1 ? 'puppy' : y < 7 ? 'adult' : 'senior';
  }

  const speciesName = (sp) => t(sp === 'dog' ? 'dog' : 'cat');
  function breedName(pet) {
    if (pet.breed === 'other' || !pet.breed) return pet.breedOther || '';
    const b = find(C.breeds[pet.species], pet.breed);
    return b ? L(b.name) : '';
  }
  const optName = (list, id) => { const o = find(list, id); return o ? L(o.name) : ''; };
  const sexIcon = (sex) => (sex === 'male' ? '<span class="sex m" aria-hidden="true">♂</span>' : sex === 'female' ? '<span class="sex f" aria-hidden="true">♀</span>' : '');
  function sexLabel(pet) {
    if (!pet.sex) return '';
    return t(pet.sex) + (pet.neutered ? ` · ${t('neutered')}` : '');
  }

  /* ================= Storage (IndexedDB with localStorage fallback) ================= */
  const Store = {
    db: null,
    open() {
      return new Promise((res) => {
        try {
          if (!('indexedDB' in window)) return res(null);
          const rq = indexedDB.open('petsdb', 1);
          rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
          rq.onsuccess = () => res(rq.result);
          rq.onerror = () => res(null);
          rq.onblocked = () => res(null);
        } catch (e) { res(null); }
      });
    },
    async load() {
      this.db = await this.open();
      if (this.db) {
        try {
          const v = await new Promise((res, rej) => {
            const g = this.db.transaction('kv', 'readonly').objectStore('kv').get('state');
            g.onsuccess = () => res(g.result);
            g.onerror = () => rej(g.error);
          });
          if (v) return v;
        } catch (e) { /* fall through */ }
      }
      try { const s = localStorage.getItem('petsdb-state'); if (s) return JSON.parse(s); } catch (e) { /* ignore */ }
      return null;
    },
    async write(data) {
      if (this.db) {
        try {
          await new Promise((res, rej) => {
            const tx = this.db.transaction('kv', 'readwrite');
            tx.objectStore('kv').put(data, 'state');
            tx.oncomplete = res;
            tx.onerror = () => rej(tx.error);
            tx.onabort = () => rej(tx.error);
          });
          return true;
        } catch (e) { /* fall through */ }
      }
      try { localStorage.setItem('petsdb-state', JSON.stringify(data)); return true; } catch (e) { return false; }
    }
  };
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const ok = await Store.write(JSON.parse(JSON.stringify(state)));
      if (!ok) toast(t('save_failed'), 'bad');
    }, 200);
  }

  function emptyState() {
    const nav = (navigator.language || '').toLowerCase();
    return {
      version: 1,
      settings: { lang: nav.startsWith('zh') ? 'zh' : 'en', unit: 'kg' },
      pets: [], weights: [], medical: [], treatments: [], activities: [], moods: [], assessments: []
    };
  }
  const PHOTO_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
  function normalize(s) {
    const base = emptyState();
    if (!s || typeof s !== 'object') return base;
    const out = Object.assign({}, base, s);
    out.settings = Object.assign({}, base.settings, s.settings || {});
    if (!['en', 'zh'].includes(out.settings.lang)) out.settings.lang = base.settings.lang;
    if (!['kg', 'lb'].includes(out.settings.unit)) out.settings.unit = 'kg';
    ['pets'].concat(COLLECTIONS).forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
    out.pets = out.pets.filter((p) => p && p.id && p.name);
    out.pets.forEach((p) => {
      if (p.photo && !PHOTO_RE.test(p.photo)) p.photo = null;
      if (!['cat', 'dog'].includes(p.species)) p.species = 'cat';
    });
    const ids = new Set(out.pets.map((p) => p.id));
    COLLECTIONS.forEach((k) => { out[k] = out[k].filter((r) => r && r.id && ids.has(r.petId) && /^\d{4}-\d{2}-\d{2}$/.test(r.date || '')); });
    return out;
  }

  /* ================= Data helpers ================= */
  const getPet = (id) => state.pets.find((p) => p.id === id);
  const recs = (col, petId) => state[col].filter((r) => r.petId === petId);
  const latest = (col, petId) => { const r = recs(col, petId).sort(byDateAsc); return r[r.length - 1] || null; };
  function upsert(col, rec) {
    const arr = state[col];
    const i = arr.findIndex((r) => r.id === rec.id);
    if (i >= 0) arr[i] = rec; else arr.push(rec);
    save();
  }
  function removeRec(col, id) { state[col] = state[col].filter((r) => r.id !== id); save(); }
  function currentPet() { const p = route(); return p[0] === 'pet' ? getPet(p[1]) : null; }

  function domainScore(ratings, d) {
    const vals = d.items.map((it) => ratings[it.id]).filter((v) => v >= 1 && v <= 5);
    if (!vals.length) return null;
    return Math.round(((sum(vals) / vals.length - 1) / 4) * 100);
  }
  function assessmentScores(a) {
    const s = {};
    DOMAINS.forEach((d) => { s[d.id] = domainScore(a.ratings || {}, d); });
    const f = FACTOR_DOMAINS.map((k) => s[k]).filter((v) => v != null);
    s.factors = f.length ? Math.round(sum(f) / f.length) : null;
    s.overall = s.mental;
    return s;
  }
  const grade = (score) => C.grades.find((g) => score >= g.min) || C.grades[C.grades.length - 1];
  const scoreClass = (v) => (v == null ? 'snone' : v >= 80 ? 's5' : v >= 60 ? 's4' : v >= 40 ? 's3' : v >= 20 ? 's2' : 's1');
  const petAssessments = (petId) => recs('assessments', petId).sort(byDateAsc);
  const latestAssessment = (petId) => { const a = petAssessments(petId); return a[a.length - 1] || null; };
  function prevAssessment(petId, a) {
    const all = petAssessments(petId);
    const i = all.findIndex((x) => x.id === a.id);
    return i > 0 ? all[i - 1] : null;
  }

  function reminders(petId) {
    const out = [];
    const pets = petId ? [getPet(petId)].filter(Boolean) : state.pets;
    pets.forEach((p) => {
      const groups = {};
      recs('treatments', p.id).forEach((r) => {
        const k = r.type + '|' + String(r.name || '').trim().toLowerCase();
        if (!groups[k] || byDateAsc(groups[k], r) < 0) groups[k] = r;
      });
      Object.values(groups).forEach((r) => { if (r.nextDue) out.push({ pet: p, rec: r, days: diffDays(today(), r.nextDue) }); });
    });
    return out.sort((a, b) => a.days - b.days);
  }
  function dueLabel(days) {
    if (days < 0) return t('overdue_by', { n: -days });
    if (days === 0) return t('due_today');
    return t('due_in', { n: days });
  }
  const dueClass = (days) => (days < 0 ? 'bad' : days <= 7 ? 'warn' : 'ok');

  function activityMinutes(petId, days) {
    const from = addDays(today(), -(days - 1));
    return sum(recs('activities', petId).filter((a) => a.date >= from && a.date <= today()).map((a) => +a.minutes || 0));
  }
  const actType = (id) => find(C.activityTypes, id) || C.activityTypes[C.activityTypes.length - 1];

  /* ================= Icons ================= */
  const ICONS = {
    paw: '<circle cx="6.5" cy="10" r="2"/><circle cx="10" cy="5.8" r="2"/><circle cx="14" cy="5.8" r="2"/><circle cx="17.5" cy="10" r="2"/><path d="M12 11.5c-2.9 0-5.5 3.3-5.5 5.6 0 1.6 1.3 2.4 2.7 2.4 1.2 0 1.8-.7 2.8-.7s1.6.7 2.8.7c1.4 0 2.7-.8 2.7-2.4 0-2.3-2.6-5.6-5.5-5.6Z"/>',
    book: '<path d="M3 5.5C5.5 4.2 9 4.2 12 6.5c3-2.3 6.5-2.3 9-1V19c-2.5-1.3-6-1.3-9 1-3-2.3-6.5-2.3-9-1Z"/><path d="M12 6.5V20"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    bowl: '<path d="M3 11.5h18a9 7.5 0 0 1-18 0Z"/><path d="M9 3.8c-.9.9.9 1.9 0 3M12.5 3.5c-.9.9.9 1.9 0 3.3M16 3.8c-.9.9.9 1.9 0 3"/>',
    house: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>',
    health: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8v8M8 12h8"/>',
    interact: '<circle cx="8.5" cy="8" r="3"/><path d="M3 19.5c0-3.1 2.5-5.5 5.5-5.5s5.5 2.4 5.5 5.5"/><circle cx="16.8" cy="9" r="2.4"/><path d="M15.6 14.3a4.8 4.8 0 0 1 5.4 5"/>',
    mind: '<circle cx="12" cy="12" r="8.5"/><path d="M8.6 14.2c1.9 2.1 4.9 2.1 6.8 0"/><path d="M9.2 9.6h.01M14.8 9.6h.01" stroke-width="2.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevL: '<path d="m15 5-7 7 7 7"/>',
    chevR: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9.5a5 5 0 0 1 8 0"/><path d="m12 10.5 1.4-2"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.3 3.7-8.8 1.9 1.4 2.4 3.1 2.4 4.6 1-.6 1.7-1.8 1.9-3.2 2.2 1.8 3.1 4.4 3.1 7.4 0 3.6-2.6 6.2-4.6 6.2Z"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"/>',
    pill: '<rect x="2.8" y="8.6" width="18.4" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/><path d="m8.6 8.6 6.8 6.8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    download: '<path d="M12 4v11M7 10.5 12 15.5l5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 13.5 12 8.5l5 5M5 4h14"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    arrowDown: '<path d="M12 4v15M6 13l6 6 6-6"/>',
    share: '<path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M6 11H5v9.5h14V11h-1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z"/>'
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  function avatar(pet, size = 'md') {
    const inner = pet.photo && PHOTO_RE.test(pet.photo)
      ? `<img src="${esc(pet.photo)}" alt="">`
      : `<span aria-hidden="true">${pet.species === 'dog' ? '🐶' : '🐱'}</span>`;
    return `<div class="avatar ${size}">${inner}</div>`;
  }
  const logoPicture = (kind, cls) => `<picture><source srcset="assets/logo-${kind}-dark.png" media="(prefers-color-scheme: dark)"><img src="assets/logo-${kind}.png" alt="PetsDB" class="${cls}"></picture>`;

  /* ================= Charts registry ================= */
  function chart(type, cfg, cls = '') {
    const id = 'c' + Object.keys(ui.charts).length;
    ui.charts[id] = { type, cfg };
    return `<div class="chart ${cls}" data-chart="${id}" style="height:${cfg.height || 200}px"></div>`;
  }
  function mountCharts() {
    $$('[data-chart]').forEach((el) => {
      const c = ui.charts[el.dataset.chart];
      if (c) { try { window.Charts[c.type](el, c.cfg); } catch (e) { console.error(e); } }
    });
  }
  function radarCfg(sc, ps, height) {
    return {
      values: DOMAINS.map((d) => sc[d.id]),
      prev: ps ? DOMAINS.map((d) => ps[d.id]) : null,
      labels: DOMAINS.map((d) => L(d.label)),
      colors: DOMAINS.map((d) => d.color),
      height: height || 260,
      label: t('domain_profile')
    };
  }
  const xDateFmt = (ms, span) => fmtDate(ymd(new Date(ms)), span > 300 * 864e5 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });

  /* ================= Small UI builders ================= */
  function segmented(act, opts, cur, extra = '') {
    return `<div class="seg ${extra}" role="tablist">${opts.map(([v, l]) => `<button type="button" class="${String(v) === String(cur) ? 'on' : ''}" data-act="${act}" data-v="${esc(v)}" role="tab" aria-selected="${String(v) === String(cur)}">${esc(l)}</button>`).join('')}</div>`;
  }
  function listWithMore(key, items, rowFn, limit = 6) {
    const open = !!ui.expanded[key];
    const shown = open ? items : items.slice(0, limit);
    let h = `<ul class="list">${shown.map(rowFn).join('')}</ul>`;
    if (items.length > limit) h += `<button class="more-btn" data-act="expand" data-key="${esc(key)}">${open ? t('show_less') : t('show_all_n', { n: items.length })}</button>`;
    return h;
  }
  function hbar(label, value, total, color, valueText) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return `<div class="hbar" style="--c:${color}"><span class="hb-l">${label}</span><span class="track"><i style="width:${pct}%"></i></span><span class="val">${valueText != null ? valueText : pct + '%'}</span></div>`;
  }
  const emptyLine = (msg) => `<p class="muted empty-line">${msg}</p>`;

  function modelDiagram() {
    const four = DOMAINS.slice(0, 4);
    const m = DOMAINS[4];
    return `<div class="model" aria-label="${esc(t('five_domains'))}">
      <div class="model-four">${four.map((d) => `<a class="model-box" style="--c:${d.color}" href="#/learn/${d.id}"><span class="mb-n">${d.n}</span>${icon(d.icon)}<span class="mb-name">${esc(L(d.name))}</span></a>`).join('')}</div>
      <div class="model-label">${t('physical_functional')}</div>
      <div class="model-arrow">${icon('arrowDown')}<span>${t('give_rise_to')}</span></div>
      <a class="model-box mental" style="--c:${m.color}" href="#/learn/mental"><span class="mb-n">5</span>${icon(m.icon)}<span class="mb-name">${esc(L(m.name))}</span><span class="mb-sub">${t('affective_experience')}</span></a>
      <div class="model-arrow">${icon('arrowDown')}</div>
      <div class="model-outcome">${t('welfare_state')}</div>
    </div>`;
  }

  /* ================= Router ================= */
  const route = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

  function resolve(p) {
    if (!p.length || p[0] === 'pets') return viewHome();
    if (p[0] === 'pet') {
      const pet = getPet(p[1]);
      if (!pet) return null;
      if (!p[2]) return viewPet(pet);
      if (p[2] === 'assess') {
        if (p[3] === 'new') return viewAssessForm(pet, null);
        const a = state.assessments.find((x) => x.id === p[3] && x.petId === pet.id);
        if (!a) return null;
        return p[4] === 'edit' ? viewAssessForm(pet, a) : viewAssessResult(pet, a);
      }
      if (DOM[p[2]]) return viewDomain(pet, DOM[p[2]]);
      return null;
    }
    if (p[0] === 'learn') return p[1] ? viewLearnTopic(p[1]) : viewLearn();
    if (p[0] === 'settings') return viewSettings();
    return null;
  }

  function render() {
    const parts = route();
    const key = parts.join('/');
    ui.charts = {};
    let v;
    try { v = resolve(parts); } catch (e) {
      console.error(e);
      v = { title: 'PetsDB', html: `<section class="card"><p>${esc(t('error_generic'))}</p><pre class="small muted">${esc(e.message)}</pre></section>` };
    }
    if (!v) { location.replace('#/'); return; }
    if (!key.includes('/assess/')) ui.draft = null;

    const sameRoute = key === ui.lastRoute;
    const sc = document.scrollingElement || document.documentElement;
    const y = sc.scrollTop;

    const title = $('#topbar-title');
    if (v.brand) title.innerHTML = `${logoPicture('mark', 'brand-mark')}<span>PetsDB</span>`;
    else title.textContent = v.title || 'PetsDB';
    $('#topbar').classList.toggle('brand', !!v.brand);
    $('#topbar-back').innerHTML = v.back ? `<a class="back-btn" href="${v.back}">${icon('chevL')}<span>${esc(v.backLabel || t('back'))}</span></a>` : '';
    $('#topbar-actions').innerHTML = v.actions || '';
    const view = $('#view');
    view.innerHTML = v.html;
    view.className = 'view ' + (v.cls || '');
    view.setAttribute('style', v.style || '');

    const tab = v.tab || 'pets';
    $$('[data-tab]').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
    renderSidebarPets(parts);
    document.title = v.brand || !v.title ? 'PetsDB' : `${v.title} · PetsDB`;
    document.documentElement.lang = lang() === 'zh' ? 'zh-Hant-HK' : 'en';

    mountCharts();
    if (v.after) v.after();
    if (sameRoute) sc.scrollTop = y; else window.scrollTo(0, 0);
    ui.lastRoute = key;
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }

  function renderChrome() {
    const nav = [['pets', '#/', 'paw', t('nav_pets')], ['learn', '#/learn', 'book', t('nav_learn')], ['settings', '#/settings', 'sliders', t('nav_settings')]];
    $('#tabbar').innerHTML = nav.map(([k, href, ic, label]) => `<a class="tab" data-tab="${k}" href="${href}">${icon(ic)}<span>${esc(label)}</span></a>`).join('');
    $('#sidebar').innerHTML = `
      <a class="sb-logo" href="#/">${logoPicture('mark', '')}<span><b>PetsDB</b><small>${esc(t('tagline'))}</small></span></a>
      <nav class="sb-nav">${nav.map(([k, href, ic, label]) => `<a data-tab="${k}" href="${href}">${icon(ic)}<span>${esc(label)}</span></a>`).join('')}</nav>
      <div class="sb-section">${esc(t('my_pets'))}</div>
      <div class="sb-pets" id="sb-pets"></div>
      <div class="sb-foot"><button class="pill-btn wide" data-act="toggleLang">${icon('globe')} ${lang() === 'zh' ? 'English' : '繁體中文'}</button></div>`;
  }
  function renderSidebarPets(parts) {
    const el = $('#sb-pets');
    if (!el) return;
    const cur = parts[0] === 'pet' ? parts[1] : null;
    el.innerHTML = state.pets.map((p) => `<a href="#/pet/${p.id}" class="${p.id === cur ? 'active' : ''}">${avatar(p, 'sm')}<span>${esc(p.name)}</span></a>`).join('') +
      `<a href="#/" class="sb-add" data-act="addPet">${icon('plus')}<span>${esc(t('add_pet'))}</span></a>`;
  }

  /* ================= View: Home ================= */
  function viewHome() {
    const actions = `<button class="pill-btn" data-act="toggleLang" aria-label="${esc(t('language'))}">${lang() === 'zh' ? 'EN' : '中'}</button><button class="icon-btn primary" data-act="addPet" aria-label="${esc(t('add_pet'))}">${icon('plus')}</button>`;
    if (!state.pets.length) return { brand: true, tab: 'pets', actions, html: homeEmpty() };

    const rem = reminders().filter((r) => r.days <= 30);
    let h = `<section class="hero card">
        <div class="kicker">${esc(t('tagline'))}</div>
        <h2>${esc(t('home_hero_title'))}</h2>
        <p>${esc(t('home_hero_body'))}</p>
        <div class="domain-chips">${DOMAINS.map((d) => `<a class="dchip" style="--c:${d.color}" href="#/learn/${d.id}">${icon(d.icon)}<span>${esc(L(d.label))}</span></a>`).join('')}</div>
      </section>`;
    if (rem.length) {
      h += `<section class="card"><div class="card-head"><h2>${icon('bell')} ${esc(t('upcoming_care'))}</h2><span class="muted small">${esc(t('next_30_days'))}</span></div>
        <ul class="list">${rem.map((r) => reminderRow(r, true)).join('')}</ul></section>`;
    }
    h += `<div class="section-head"><h2>${esc(t('my_pets'))}</h2><span class="muted">${state.pets.length}</span></div>`;
    h += `<div class="pet-grid">${state.pets.map(petCard).join('')}<button class="pet-card add" data-act="addPet">${icon('plus')}<span>${esc(t('add_pet'))}</span></button></div>`;
    h += tipOfDay();
    return { brand: true, tab: 'pets', actions, html: h };
  }

  function homeEmpty() {
    return `<section class="empty-hero">
        ${logoPicture('full', 'empty-logo')}
        <h2>${esc(t('welcome_title'))}</h2>
        <p>${esc(t('welcome_body'))}</p>
        <div class="btn-row center">
          <button class="btn primary" data-act="addPet">${icon('plus')} ${esc(t('add_first_pet'))}</button>
          <button class="btn" data-act="loadSample">${icon('spark')} ${esc(t('try_sample'))}</button>
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h2>${esc(t('five_domains'))}</h2><a class="link" href="#/learn/overview">${esc(t('learn_more'))} ${icon('chevR')}</a></div>
        <p class="muted small">${esc(t('model_intro_short'))}</p>
        ${modelDiagram()}
      </section>`;
  }

  function reminderRow(r, showPet) {
    const tt = find(C.treatmentTypes, r.rec.type);
    return `<li>
      <a class="row-link" href="#/pet/${r.pet.id}/health">
        <span class="row-icon">${tt ? tt.icon : '📋'}</span>
        <span class="row-main"><span class="row-title">${esc(r.rec.name)}</span><span class="row-sub">${showPet ? esc(r.pet.name) + ' · ' : ''}${esc(fmtDate(r.rec.nextDue))}</span></span>
        <span class="badge ${dueClass(r.days)}">${esc(dueLabel(r.days))}</span>
      </a>
      <button class="row-action" data-act="markDone" data-id="${r.rec.id}" aria-label="${esc(t('record_done'))}" title="${esc(t('record_done'))}">${icon('check')}</button>
    </li>`;
  }

  function domainMeters(sc) {
    return `<div class="dmeters" aria-hidden="true">${DOMAINS.map((d) => {
      const v = sc ? sc[d.id] : null;
      return `<span class="dm" style="--c:${d.color}"><i style="height:${v == null ? 0 : Math.max(8, v)}%"></i></span>`;
    }).join('')}</div>`;
  }

  function petCard(p) {
    const w = latest('weights', p.id);
    const a = latestAssessment(p.id);
    const sc = a ? assessmentScores(a) : null;
    return `<a class="pet-card" href="#/pet/${p.id}">
      ${avatar(p)}
      <div class="pc-main">
        <div class="pc-name">${esc(p.name)} ${sexIcon(p.sex)}</div>
        <div class="pc-sub">${esc(breedName(p) || speciesName(p.species))}${p.dob ? ' · ' + esc(fmtAge(p.dob)) : ''}</div>
        <div class="pc-stats">
          ${w ? `<span class="pc-stat">${icon('scale')} ${esc(fmtW(w.kg))}</span>` : ''}
          ${sc && sc.overall != null ? `<span class="score-chip ${scoreClass(sc.overall)}">${esc(t('welfare'))} ${sc.overall}</span>` : `<span class="muted small">${esc(t('no_check_yet'))}</span>`}
        </div>
        ${domainMeters(sc)}
      </div>
      ${icon('chevR', 'chev')}
    </a>`;
  }

  function tipOfDay() {
    const species = [...new Set(state.pets.map((p) => p.species))];
    const pool = [];
    DOMAINS.forEach((d) => species.forEach((sp) => L(d.tips[sp]).forEach((tip) => pool.push({ d, sp, tip }))));
    if (!pool.length) return '';
    const x = pool[Math.floor(Date.now() / 864e5) % pool.length];
    return `<section class="card tip" style="--c:${x.d.color}">
      <div class="tip-head">${icon(x.d.icon)}<span>${esc(t('tip_of_day'))}</span><span class="muted">· ${esc(L(x.d.label))} · ${esc(speciesName(x.sp))}</span></div>
      <p>${esc(x.tip)}</p>
      <a class="link" href="#/learn/${x.d.id}">${esc(t('learn_more'))} ${icon('chevR')}</a>
    </section>`;
  }

  /* ================= View: Pet hub ================= */
  function welfareSnapshot(pet, opts = {}) {
    const a = latestAssessment(pet.id);
    let h = `<section class="card welfare-snap"><div class="card-head"><h2>${icon('mind')} ${esc(t(opts.titleKey || 'welfare_snapshot'))}</h2></div>`;
    if (!a) {
      h += `<div class="empty-inline"><p>${esc(t('no_assessment_body'))}</p><a class="btn primary" href="#/pet/${pet.id}/assess/new">${icon('plus')} ${esc(t('start_welfare_check'))}</a></div></section>`;
      return h;
    }
    const sc = assessmentScores(a);
    const prev = prevAssessment(pet.id, a);
    const g = grade(sc.overall);
    const age = diffDays(a.date, today());
    h += `<div class="snap-grid">
        <div class="snap-chart">${chart('radar', radarCfg(sc, prev ? assessmentScores(prev) : null, 260))}</div>
        <div class="snap-info">
          <div class="kicker">${esc(t('overall_welfare'))}</div>
          <div class="score-big ${scoreClass(sc.overall)}"><span class="num">${sc.overall}</span><span class="of">/100</span><span class="grade-pill">${esc(L(g.name))}</span></div>
          <p class="muted small">${esc(L(g.desc))}</p>
          <div class="kv"><span>${esc(t('domains_1_4_avg'))}</span><b>${sc.factors ?? '–'}</b></div>
          <div class="kv"><span>${esc(t('assessed_on'))}</span><b>${esc(fmtDate(a.date))}</b></div>
          ${prev ? `<div class="legend"><span><i class="lg-cur"></i>${esc(t('latest'))}</span><span><i class="lg-prev"></i>${esc(t('previous'))} (${esc(fmtShortDate(prev.date))})</span></div>` : ''}
          ${age > 45 ? `<p class="note small">${esc(t('check_due_note', { n: age }))}</p>` : ''}
          <div class="btn-row">
            <a class="btn primary" href="#/pet/${pet.id}/assess/new">${icon('plus')} ${esc(t('new_welfare_check'))}</a>
            <a class="btn" href="#/pet/${pet.id}/assess/${a.id}">${esc(t('view_result'))}</a>
          </div>
        </div>
      </div></section>`;
    return h;
  }

  function domainStat(pet, id) {
    switch (id) {
      case 'nutrition': {
        const w = latest('weights', pet.id);
        if (!w) return esc(t('no_weight_yet'));
        return esc(fmtW(w.kg)) + (w.bcs ? ` · ${esc(t('bcs_short'))} ${w.bcs}/9` : '');
      }
      case 'environment': {
        const list = C.checklist[pet.species];
        const done = list.filter((i) => pet.envChecklist && pet.envChecklist[i.id]).length;
        return esc(t('checklist_n', { done, total: list.length }));
      }
      case 'health': {
        const active = recs('medical', pet.id).filter((m) => m.status && m.status !== 'resolved').length;
        const due = reminders(pet.id).filter((r) => r.days <= 30).length;
        return esc(t('health_stat', { a: active, d: due }));
      }
      case 'behaviour':
        return esc(t('minutes_week', { n: activityMinutes(pet.id, 7) }));
      case 'mental': {
        const m = latest('moods', pet.id);
        if (!m) return esc(t('no_mood_yet'));
        const md = C.moods[(m.mood || 3) - 1];
        return `${md.face} ${esc(L(md.name))} · ${esc(fmtShortDate(m.date))}`;
      }
    }
    return '';
  }

  function domainTile(pet, d, sc) {
    const v = sc ? sc[d.id] : null;
    return `<a class="domain-tile" style="--c:${d.color}" href="#/pet/${pet.id}/${d.id}">
      <div class="dt-top"><span class="dt-icon">${icon(d.icon)}</span><span class="dt-num">${esc(t('domain_n', { n: d.n }))}</span></div>
      <div class="dt-name">${esc(L(d.name))}</div>
      <div class="dt-stat">${domainStat(pet, d.id)}</div>
      <div class="meter"><i style="width:${v == null ? 0 : v}%"></i></div>
      <div class="dt-score">${v == null ? esc(t('not_assessed')) : esc(t('score_n', { n: v }))}</div>
    </a>`;
  }

  function viewPet(pet) {
    const a = latestAssessment(pet.id);
    const sc = a ? assessmentScores(a) : null;
    const stage = lifeStage(pet);
    const facts = [
      [t('species'), speciesName(pet.species)],
      [t('sex'), sexLabel(pet)],
      [t('age'), pet.dob ? fmtAge(pet.dob) : ''],
      [t('birthday'), pet.dob ? fmtDate(pet.dob) : ''],
      [t('life_stage'), stage ? t('stage_' + stage) : ''],
      [t('colour'), pet.color],
      [t('microchip'), pet.microchip]
    ].filter((f) => f[1]);
    let h = `<section class="card profile">
        <div class="profile-top">${avatar(pet, 'lg')}
          <div class="profile-name"><h2>${esc(pet.name)} ${sexIcon(pet.sex)}</h2><div class="muted">${esc(breedName(pet) || speciesName(pet.species))}</div></div>
        </div>
        <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </section>`;
    h += welfareSnapshot(pet);
    h += `<div class="section-head"><h2>${esc(t('five_domains'))}</h2><a class="link" href="#/learn/overview">${esc(t('what_is_this'))} ${icon('chevR')}</a></div>`;
    h += `<div class="domain-grid">${DOMAINS.map((d) => domainTile(pet, d, sc)).join('')}</div>`;
    if (pet.notes) h += `<section class="card"><h2>${esc(t('notes'))}</h2><p class="pre">${esc(pet.notes)}</p></section>`;
    return {
      title: pet.name, back: '#/', backLabel: t('my_pets'), tab: 'pets',
      actions: `<button class="text-btn" data-act="editPet" data-id="${pet.id}">${esc(t('edit'))}</button>`,
      html: h
    };
  }

  /* ================= View: Domain pages ================= */
  function viewDomain(pet, d) {
    const a = latestAssessment(pet.id);
    const v = a ? assessmentScores(a)[d.id] : null;
    let h = `<section class="domain-banner" style="--c:${d.color}">
        <div class="db-row">
          <span class="db-icon">${icon(d.icon)}</span>
          <div class="db-titles"><div class="kicker">${esc(pet.name)} · ${esc(t('domain_n', { n: d.n }))}</div><h2>${esc(L(d.name))}</h2></div>
          <div class="db-score ${scoreClass(v)}">${v == null ? '–' : v}<small>${esc(v == null ? t('not_assessed') : t('latest_score'))}</small></div>
        </div>
        <p>${esc(L(d.short))}</p>
        <a class="link" href="#/learn/${d.id}">${esc(t('learn_about_domain'))} ${icon('chevR')}</a>
      </section>`;
    const sections = { nutrition: secNutrition, environment: secEnvironment, health: secHealth, behaviour: secBehaviour, mental: secMental };
    h += sections[d.id](pet, d);
    h += experiencesCard(d);
    h += tipsCard(d, pet.species);
    return { title: L(d.label), back: `#/pet/${pet.id}`, backLabel: pet.name, tab: 'pets', html: h, style: `--c:${d.color}`, cls: 'domain-view' };
  }

  function experiencesCard(d) {
    return `<section class="card"><h2>${esc(t('experiences_title'))}</h2>
      <p class="muted small">${esc(t('experiences_intro'))}</p>
      <div class="two-col">
        <div class="exp neg"><h3>− ${esc(t('negative_experiences'))}</h3><ul>${L(d.negative).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="exp pos"><h3>+ ${esc(t('positive_experiences'))}</h3><ul>${L(d.positive).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div></section>`;
  }
  function tipsCard(d, sp) {
    return `<section class="card tips-card" style="--c:${d.color}"><h2>${icon('spark')} ${esc(t(sp === 'dog' ? 'tips_for_dogs' : 'tips_for_cats'))}</h2>
      <ul class="tip-list">${L(d.tips[sp]).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
  }

  /* ---- Domain 1: Nutrition ---- */
  function defaultFactor(pet) {
    const a = ageParts(pet.dob);
    if (a && a.total < 12) return pet.species === 'dog' && a.total < 4 ? 'puppy4' : 'young';
    return pet.neutered ? 'neutered' : 'intact';
  }
  function secNutrition(pet, d) {
    const ws = recs('weights', pet.id).sort(byDateAsc);
    const last = ws[ws.length - 1];
    const prev = ws[ws.length - 2];
    const hasRange = pet.targetMin > 0 && pet.targetMax > 0;
    let h = `<section class="card"><div class="card-head"><h2>${icon('scale')} ${esc(t('weight'))}</h2><button class="btn small primary" data-act="addRec" data-col="weights">${icon('plus')} ${esc(t('add'))}</button></div>`;
    if (!ws.length) {
      h += emptyLine(esc(t('no_weights_body')));
    } else {
      const delta = prev ? last.kg - prev.kg : null;
      let status = '';
      if (hasRange) {
        if (last.kg > pet.targetMax) status = `<span class="badge warn">${esc(t('above_range'))}</span>`;
        else if (last.kg < pet.targetMin) status = `<span class="badge warn">${esc(t('below_range'))}</span>`;
        else status = `<span class="badge ok">${esc(t('within_range'))}</span>`;
      }
      h += `<div class="stat-row">
          <div class="stat"><div class="stat-val">${esc(fmtW(last.kg))}</div><div class="stat-lbl">${esc(t('latest'))} · ${esc(fmtShortDate(last.date))}</div></div>
          ${delta != null ? `<div class="stat"><div class="stat-val ${Math.abs(delta) < 0.005 ? '' : delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${esc(fmtW(Math.abs(delta)))}</div><div class="stat-lbl">${esc(t('since_date', { d: fmtShortDate(prev.date) }))}</div></div>` : ''}
          <div class="stat"><div class="stat-val">${hasRange ? `${esc(fmtW(pet.targetMin, false))}–${esc(fmtW(pet.targetMax))}` : '–'}</div><div class="stat-lbl"><button class="link-btn" data-act="editTarget">${esc(t('ideal_range'))} ${icon('edit')}</button></div></div>
        </div>`;
      if (status) h += `<div class="status-line">${status}</div>`;
      const days = { '3m': 92, '6m': 183, '1y': 366, all: 1e6 }[ui.wRange];
      const cutoff = days > 1e5 ? '0000-00-00' : addDays(today(), -days);
      const shown = ws.filter((w) => w.date >= cutoff);
      h += segmented('wRange', [['3m', t('r_3m')], ['6m', t('r_6m')], ['1y', t('r_1y')], ['all', t('r_all')]], ui.wRange, 'compact');
      h += shown.length
        ? chart('line', {
          height: 220, label: t('weight'), nonNeg: true,
          series: [{ pts: shown.map((w) => ({ x: toDate(w.date).getTime(), y: round(kgToDisp(w.kg), 2), date: w.date })), color: d.color, area: true }],
          band: hasRange ? { lo: kgToDisp(pet.targetMin), hi: kgToDisp(pet.targetMax), label: t('ideal_range') } : null,
          yFmt: (v) => fmtNum(v, 1), xFmt: xDateFmt,
          tipFmt: (p) => `${esc(fmtDate(p.date))} · <b>${esc(fmtNum(p.y, 2))} ${unit()}</b>`
        })
        : emptyLine(esc(t('no_data_range')));
      if (!hasRange) h += `<p class="muted small">${esc(t('set_range_hint'))} <button class="link-btn" data-act="editTarget">${esc(t('set_ideal_range'))}</button></p>`;
    }
    h += `</section>`;

    // Body condition score
    const lastB = [...ws].reverse().find((w) => w.bcs);
    h += `<section class="card"><div class="card-head"><h2>${esc(t('bcs_title'))}</h2>${lastB ? `<span class="muted small">${esc(fmtShortDate(lastB.date))}</span>` : ''}</div>`;
    if (lastB) {
      const b = C.bcs[lastB.bcs - 1];
      h += `<div class="bcs-scale" role="img" aria-label="BCS ${lastB.bcs}/9">${C.bcs.map((x) => `<span class="bcs-seg ${x.group}${x.s === lastB.bcs ? ' on' : ''}">${x.s}</span>`).join('')}</div>
        <div class="bcs-legend"><span>${esc(t('bcs_under'))}</span><span>${esc(t('bcs_ideal'))}</span><span>${esc(t('bcs_over'))}</span></div>
        <div class="bcs-info"><b>${lastB.bcs}/9 · ${esc(L(b.name))}</b><p class="muted small">${esc(L(C.bcsGroups[b.group]))}</p></div>`;
    } else {
      h += emptyLine(esc(t('no_bcs_body')));
    }
    h += `<details class="disclosure"><summary>${esc(t('bcs_guide'))}</summary>
        <ul class="bcs-guide">${[['under', '1–3'], ['ideal', '4–5'], ['over', '6–7'], ['obese', '8–9']].map(([g, r]) => `<li class="${g}"><b>${r}</b><span>${esc(L(C.bcsGroups[g]))}</span></li>`).join('')}</ul>
        <p class="muted small">${esc(t('bcs_how'))}</p></details></section>`;

    // Weight records
    h += `<section class="card"><div class="card-head"><h2>${esc(t('weight_records'))}</h2><span class="muted small">${ws.length}</span></div>`;
    h += ws.length ? listWithMore('weights', [...ws].reverse(), (w) => `<li><button class="row-link" data-act="editRec" data-col="weights" data-id="${w.id}">
        <span class="row-main"><span class="row-title">${esc(fmtW(w.kg))}${w.bcs ? ` <span class="muted">· ${esc(t('bcs_short'))} ${w.bcs}/9</span>` : ''}</span>
        <span class="row-sub">${esc(fmtDate(w.date))}${w.note ? ' · ' + esc(w.note) : ''}</span></span>${icon('chevR', 'chev')}</button></li>`) : emptyLine(esc(t('none_yet')));
    h += `</section>`;

    // Feeding plan
    const f = pet.feeding || {};
    const rows = [[t('food'), f.food], [t('amount_per_day'), f.amount], [t('meals_per_day'), f.meals], [t('treats'), f.treats], [t('water'), f.water], [t('notes'), f.notes]].filter((r) => r[1]);
    h += `<section class="card"><div class="card-head"><h2>${icon('bowl')} ${esc(t('feeding_plan'))}</h2><button class="btn small" data-act="editFeeding">${icon('edit')} ${esc(t('edit'))}</button></div>`;
    h += rows.length ? `<dl class="kv-list">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : emptyLine(esc(t('no_feeding_body')));
    h += `</section>`;

    // Energy calculator
    const factors = C.energyFactors[pet.species];
    const fac = find(factors, ui.energy[pet.id] || defaultFactor(pet)) || factors[0];
    const ideal = hasRange ? (pet.targetMin + pet.targetMax) / 2 : null;
    const basisKg = fac.id === 'loss' && ideal ? ideal : last ? last.kg : null;
    h += `<section class="card"><div class="card-head"><h2>${icon('flame')} ${esc(t('energy_title'))}</h2></div>
      <label class="field"><span class="fl">${esc(t('life_stage_activity'))}</span>
        <select data-act-change="energyFactor">${factors.map((o) => `<option value="${o.id}"${o.id === fac.id ? ' selected' : ''}>${esc(L(o.name))} (×${o.f})</option>`).join('')}</select></label>`;
    if (basisKg) {
      const rer = 70 * Math.pow(basisKg, 0.75);
      const mer = rer * fac.f;
      h += `<div class="stat-row">
          <div class="stat"><div class="stat-val">${Math.round(mer)}<small> kcal</small></div><div class="stat-lbl">${esc(t('per_day_estimate'))}</div></div>
          <div class="stat"><div class="stat-val">${Math.round(rer)}<small> kcal</small></div><div class="stat-lbl">${esc(t('rer_label'))}</div></div>
        </div>
        <p class="muted small">${esc(t('energy_formula', { w: fmtNum(basisKg, 2) + ' kg', f: fac.f }))}${fac.id === 'loss' && !ideal ? ' ' + esc(t('energy_loss_hint')) : ''}</p>`;
    } else {
      h += emptyLine(esc(t('energy_need_weight')));
    }
    h += `<p class="note small">${esc(t('energy_disclaimer'))}</p></section>`;
    return h;
  }

  /* ---- Domain 2: Physical environment ---- */
  const LIVING = ['indoor', 'indoor_outdoor', 'outdoor'];
  const HOMES = ['flat', 'house', 'other'];
  function secEnvironment(pet) {
    const list = C.checklist[pet.species];
    const chk = pet.envChecklist || {};
    const done = list.filter((i) => chk[i.id]).length;
    const pct = Math.round((done / list.length) * 100);
    let h = `<section class="card"><div class="card-head"><h2>${icon('house')} ${esc(t('home_checklist'))}</h2><span class="score-chip ${scoreClass(pct)}">${done}/${list.length}</span></div>
      <p class="muted small">${esc(t(pet.species === 'dog' ? 'checklist_intro_dog' : 'checklist_intro_cat'))}</p>
      <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <ul class="checklist">${list.map((i) => `<li><label class="check"><input type="checkbox" data-act-change="envCheck" data-id="${i.id}"${chk[i.id] ? ' checked' : ''}><span class="box">${icon('check')}</span><span>${esc(L(i.name))}</span></label></li>`).join('')}</ul>
    </section>`;
    const e = pet.environment || {};
    const rows = [
      [t('living'), e.living ? t('living_' + e.living) : ''],
      [t('home_type'), e.home ? t('home_' + e.home) : ''],
      [t('hours_alone'), e.alone !== '' && e.alone != null ? t('hours_n', { n: e.alone }) : ''],
      [t('housemates'), e.housemates],
      [t('notes'), e.notes]
    ].filter((r) => r[1]);
    h += `<section class="card"><div class="card-head"><h2>${esc(t('living_situation'))}</h2><button class="btn small" data-act="editEnv">${icon('edit')} ${esc(t('edit'))}</button></div>
      ${rows.length ? `<dl class="kv-list">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : emptyLine(esc(t('no_env_body')))}
    </section>`;
    return h;
  }

  /* ---- Domain 3: Health ---- */
  const MED_ICON = { diagnosis: '🩺', checkup: '📋', surgery: '🩹', injury: '🦴', allergy: '🤧', lab: '🧪', other: '📄' };
  const STATUS_CLASS = { active: 'warn', chronic: 'info', monitoring: 'info', resolved: 'ok' };
  function secHealth(pet) {
    const meds = recs('medical', pet.id).sort(byDateDesc);
    const trs = recs('treatments', pet.id).sort(byDateDesc);
    const rem = reminders(pet.id);
    const remIds = new Set(rem.map((r) => r.rec.id));
    const active = meds.filter((m) => m.status && m.status !== 'resolved');
    const lastVisit = meds.find((m) => m.category === 'checkup');
    let h = `<div class="stat-tiles">
        <div class="stat-tile"><b>${active.length}</b><span>${esc(t('active_conditions'))}</span></div>
        <div class="stat-tile"><b>${rem.filter((r) => r.days <= 30).length}</b><span>${esc(t('due_30_days'))}</span></div>
        <div class="stat-tile"><b class="date">${lastVisit ? esc(fmtShortDate(lastVisit.date)) : '–'}</b><span>${esc(t('last_checkup'))}</span></div>
      </div>`;
    if (rem.length) h += `<section class="card"><div class="card-head"><h2>${icon('bell')} ${esc(t('upcoming_care'))}</h2></div><ul class="list">${rem.map((r) => reminderRow(r, false)).join('')}</ul></section>`;

    h += `<section class="card"><div class="card-head"><h2>${icon('clipboard')} ${esc(t('medical_history'))}</h2><button class="btn small primary" data-act="addRec" data-col="medical">${icon('plus')} ${esc(t('add'))}</button></div>`;
    h += meds.length ? listWithMore('medical', meds, (m) => `<li><button class="row-link" data-act="editRec" data-col="medical" data-id="${m.id}">
        <span class="row-icon">${MED_ICON[m.category] || '📄'}</span>
        <span class="row-main"><span class="row-title">${esc(m.title)}</span><span class="row-sub">${esc(fmtDate(m.date))} · ${esc(optName(C.medicalCategories, m.category))}${m.vet ? ' · ' + esc(m.vet) : ''}</span></span>
        ${m.status ? `<span class="badge ${STATUS_CLASS[m.status] || ''}">${esc(optName(C.medicalStatus, m.status))}</span>` : ''}</button></li>`) : emptyLine(esc(t('no_medical_body')));
    h += `</section>`;

    const types = C.treatmentTypes.filter((tt) => trs.some((r) => r.type === tt.id));
    if (ui.treatFilter !== 'all' && !types.some((tt) => tt.id === ui.treatFilter)) ui.treatFilter = 'all';
    const filtered = ui.treatFilter === 'all' ? trs : trs.filter((r) => r.type === ui.treatFilter);
    h += `<section class="card"><div class="card-head"><h2>${icon('pill')} ${esc(t('treatment_records'))}</h2><button class="btn small primary" data-act="addRec" data-col="treatments">${icon('plus')} ${esc(t('add'))}</button></div>`;
    if (types.length > 1) {
      h += `<div class="chips">${[['all', t('all')]].concat(types.map((tt) => [tt.id, `${tt.icon} ${L(tt.name)}`])).map(([v, l]) => `<button class="chip${ui.treatFilter === v ? ' on' : ''}" data-act="treatFilter" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
    }
    h += filtered.length ? listWithMore('treatments', filtered, (r) => {
      const tt = find(C.treatmentTypes, r.type);
      const sub = [fmtDate(r.date), r.dose, r.frequency].filter(Boolean).map(esc).join(' · ');
      let badge = '';
      if (r.nextDue && remIds.has(r.id)) { const dd = diffDays(today(), r.nextDue); badge = `<span class="badge ${dueClass(dd)}">${esc(t('next_short'))} ${esc(fmtShortDate(r.nextDue))}</span>`; }
      return `<li><button class="row-link" data-act="editRec" data-col="treatments" data-id="${r.id}">
        <span class="row-icon">${tt ? tt.icon : '📋'}</span>
        <span class="row-main"><span class="row-title">${esc(r.name)}</span><span class="row-sub">${sub}</span></span>${badge}</button></li>`;
    }) : emptyLine(esc(t('no_treatments_body')));
    h += `</section>`;
    return h;
  }

  /* ---- Domain 4: Behavioural interactions ---- */
  function secBehaviour(pet, d) {
    const acts = recs('activities', pet.id).sort(byDateDesc);
    const td = today();
    const days14 = [];
    for (let i = 13; i >= 0; i--) {
      const ds = addDays(td, -i);
      days14.push({ ds, v: sum(acts.filter((a) => a.date === ds).map((a) => +a.minutes || 0)) });
    }
    const week = activityMinutes(pet.id, 7);
    const from7 = addDays(td, -6);
    const sessions7 = acts.filter((a) => a.date >= from7 && a.date <= td).length;
    const activeDays = days14.slice(7).filter((x) => x.v > 0).length;
    let h = `<section class="card"><div class="card-head"><h2>${icon('interact')} ${esc(t('activity_title'))}</h2><button class="btn small primary" data-act="addRec" data-col="activities">${icon('plus')} ${esc(t('log'))}</button></div>
      <div class="stat-row">
        <div class="stat"><div class="stat-val">${week}<small> ${esc(t('min'))}</small></div><div class="stat-lbl">${esc(t('last_7_days'))}</div></div>
        <div class="stat"><div class="stat-val">${sessions7}</div><div class="stat-lbl">${esc(t('sessions'))}</div></div>
        <div class="stat"><div class="stat-val">${activeDays}<small>/7</small></div><div class="stat-lbl">${esc(t('active_days'))}</div></div>
      </div>
      ${chart('bars', {
        height: 170, color: d.color, label: t('activity_title'),
        data: days14.map((x) => ({ label: String(toDate(x.ds).getDate()), value: x.v, strong: x.ds === td, dim: x.ds < from7, title: `${fmtDate(x.ds)}: ${x.v} ${t('min')}` }))
      })}
      <p class="muted small center">${esc(t('minutes_per_day_14'))}</p>
    </section>`;

    const from30 = addDays(td, -29);
    const a30 = acts.filter((a) => a.date >= from30 && a.date <= td);
    const byWith = { environment: 0, animals: 0, humans: 0 };
    a30.forEach((a) => { const w = a.with || actType(a.type).with; byWith[w] = (byWith[w] || 0) + (+a.minutes || 0); });
    const total = sum(Object.values(byWith));
    const byType = C.activityTypes.map((at) => ({ at, m: sum(a30.filter((a) => a.type === at.id).map((a) => +a.minutes || 0)) })).filter((x) => x.m > 0).sort((a, b) => b.m - a.m);
    const wColor = { environment: DOM.environment.color, animals: DOM.nutrition.color, humans: DOM.behaviour.color };
    h += `<section class="card"><div class="card-head"><h2>${esc(t('interaction_balance'))}</h2><span class="muted small">${esc(t('last_30_days'))}</span></div>
      <p class="muted small">${esc(t('interaction_intro'))}</p>
      ${total ? C.interactionWith.map((w) => hbar(esc(L(w.name)), byWith[w.id] || 0, total, wColor[w.id], `${byWith[w.id] || 0} ${esc(t('min'))}`)).join('') : emptyLine(esc(t('no_activity_30')))}
      ${byType.length ? `<div class="sub-title">${esc(t('by_activity'))}</div>${byType.map((x) => hbar(`${x.at.icon} ${esc(L(x.at.name))}`, x.m, total, d.color, `${x.m} ${esc(t('min'))}`)).join('')}` : ''}
    </section>`;

    h += `<section class="card"><div class="card-head"><h2>${esc(t('activity_log'))}</h2><span class="muted small">${acts.length}</span></div>`;
    h += acts.length ? listWithMore('activities', acts, (a) => {
      const at = actType(a.type);
      const w = optName(C.interactionWith, a.with || at.with);
      return `<li><button class="row-link" data-act="editRec" data-col="activities" data-id="${a.id}">
        <span class="row-icon">${at.icon}</span>
        <span class="row-main"><span class="row-title">${esc(L(at.name))}${a.minutes ? ` <span class="muted">· ${a.minutes} ${esc(t('min'))}</span>` : ''}</span>
        <span class="row-sub">${esc(fmtDate(a.date))} · ${esc(t('with_x', { x: w }))}${a.note ? ' · ' + esc(a.note) : ''}</span></span>${icon('chevR', 'chev')}</button></li>`;
    }, 8) : emptyLine(esc(t('no_activity_body')));
    h += `</section>`;
    return h;
  }

  /* ---- Domain 5: Mental state ---- */
  function secMental(pet, d) {
    let h = welfareSnapshot(pet, { titleKey: 'welfare_outcome' });
    const as = petAssessments(pet.id);
    if (as.length >= 2) {
      const pts = as.map((a) => ({ a, s: assessmentScores(a) }));
      h += `<section class="card"><div class="card-head"><h2>${esc(t('welfare_trend'))}</h2></div>
        ${chart('line', {
          height: 200, yMin: 0, yMax: 100, yTicks: [0, 25, 50, 75, 100], label: t('welfare_trend'),
          series: [
            { pts: pts.filter((x) => x.s.mental != null).map((x) => ({ x: toDate(x.a.date).getTime(), y: x.s.mental, date: x.a.date })), color: d.color, area: true },
            { pts: pts.filter((x) => x.s.factors != null).map((x) => ({ x: toDate(x.a.date).getTime(), y: x.s.factors })), color: '#9a918b', dash: true, dots: false }
          ],
          xFmt: xDateFmt, yFmt: (v) => v,
          tipFmt: (p) => `${esc(fmtDate(p.date))} · <b>${p.y}</b>`
        })}
        <div class="legend"><span><i style="background:${d.color}"></i>${esc(L(d.name))}</span><span><i class="dash"></i>${esc(t('domains_1_4_avg'))}</span></div>
      </section>`;
    }
    if (as.length) {
      h += `<section class="card"><div class="card-head"><h2>${esc(t('assessment_history'))}</h2><span class="muted small">${as.length}</span></div>`;
      h += listWithMore('assessments', [...as].reverse(), (a) => {
        const s = assessmentScores(a);
        return `<li><a class="row-link" href="#/pet/${pet.id}/assess/${a.id}">
          <span class="row-icon score-chip ${scoreClass(s.overall)}">${s.overall ?? '–'}</span>
          <span class="row-main"><span class="row-title">${esc(L(grade(s.overall).name))}</span><span class="row-sub">${esc(fmtDate(a.date))} · ${esc(t('domains_1_4_avg'))} ${s.factors ?? '–'}</span></span>${icon('chevR', 'chev')}</a></li>`;
      }, 5);
      h += `</section>`;
    }

    const moods = recs('moods', pet.id).sort(byDateAsc);
    const todayMood = moods.find((m) => m.date === today());
    h += `<section class="card"><div class="card-head"><h2>${icon('mind')} ${esc(t('mood_diary'))}</h2><button class="btn small" data-act="addRec" data-col="moods">${icon('plus')} ${esc(t('add_entry'))}</button></div>
      <p class="muted small">${esc(t('mood_prompt', { name: pet.name }))}</p>
      <div class="mood-picker">${C.moods.map((m) => `<button class="mood-btn${todayMood && todayMood.mood === m.v ? ' on' : ''}" data-act="quickMood" data-v="${m.v}" aria-pressed="${!!(todayMood && todayMood.mood === m.v)}"><span class="face">${m.face}</span><span>${esc(L(m.name))}</span></button>`).join('')}</div>`;
    const from = addDays(today(), -59);
    const recent = moods.filter((m) => m.date >= from);
    if (recent.length >= 2) {
      h += chart('line', {
        height: 170, yMin: 0.6, yMax: 5.4, yTicks: [1, 2, 3, 4, 5], label: t('mood_diary'),
        series: [{ pts: recent.map((m) => ({ x: toDate(m.date).getTime(), y: m.mood, date: m.date })), color: d.color }],
        yFmt: (v) => C.moods[v - 1] ? C.moods[v - 1].face : '', xFmt: xDateFmt,
        tipFmt: (p) => `${esc(fmtDate(p.date))} · ${C.moods[p.y - 1].face} ${esc(L(C.moods[p.y - 1].name))}`
      });
      h += `<p class="muted small center">${esc(t('last_60_days'))}</p>`;
    }
    if (moods.length) {
      h += listWithMore('moods', [...moods].reverse(), (m) => {
        const md = C.moods[(m.mood || 3) - 1];
        return `<li><button class="row-link" data-act="editRec" data-col="moods" data-id="${m.id}">
          <span class="row-icon face">${md.face}</span>
          <span class="row-main"><span class="row-title">${esc(L(md.name))}</span><span class="row-sub">${esc(fmtDate(m.date))}${m.note ? ' · ' + esc(m.note) : ''}</span></span>${icon('chevR', 'chev')}</button></li>`;
      }, 5);
    }
    h += `</section>`;
    return h;
  }

  /* ================= View: Welfare check (form) ================= */
  function viewAssessForm(pet, a) {
    const key = a ? a.id : 'new:' + pet.id;
    if (!ui.draft || ui.draft.key !== key) {
      ui.draft = { key, date: a ? a.date : today(), ratings: a ? Object.assign({}, a.ratings) : {}, notes: a ? a.notes || '' : '' };
    }
    const dr = ui.draft;
    let h = `<section class="card assess-intro">
        <div class="kicker">${esc(t('five_domains'))}</div>
        <h2>${esc(t('welfare_check_for', { name: pet.name }))}</h2>
        <p>${esc(t('assess_intro'))}</p>
        <div class="scale-legend">${C.ratingScale.map((r) => `<span class="lg"><b class="r${r.v}">${r.v}</b>${esc(L(r.name))}</span>`).join('')}</div>
        <label class="field"><span class="fl">${esc(t('date'))}</span><input type="date" id="assess-date" value="${esc(dr.date)}" max="${today()}"></label>
      </section>`;
    DOMAINS.forEach((d) => {
      h += `<section class="card assess-domain" style="--c:${d.color}">
        <div class="ad-head"><span class="ad-icon">${icon(d.icon)}</span>
          <div class="ad-titles"><div class="kicker">${esc(t('domain_n', { n: d.n }))}</div><h3>${esc(L(d.name))}</h3></div>
          <div class="ad-score" id="ads-${d.id}">–</div></div>
        <p class="muted small">${esc(L(d.short))}</p>
        ${d.id === 'mental' ? '<div class="mental-hint" id="mental-hint"></div>' : ''}
        ${d.items.map((it) => `<div class="assess-item">
          <div class="ai-text">${esc(L(it.text))}</div>
          <div class="rating" role="radiogroup" aria-label="${esc(L(it.text))}">${[1, 2, 3, 4, 5].map((v) => `<button type="button" class="r r${v}${dr.ratings[it.id] === v ? ' on' : ''}" data-act="rate" data-item="${it.id}" data-v="${v}" role="radio" aria-checked="${dr.ratings[it.id] === v}" aria-label="${v} · ${esc(L(C.ratingScale[v - 1].name))}">${v}</button>`).join('')}</div>
          <div class="ai-sel" id="sel-${it.id}">${dr.ratings[it.id] ? esc(L(C.ratingScale[dr.ratings[it.id] - 1].name)) : ''}</div>
        </div>`).join('')}
      </section>`;
    });
    h += `<section class="card"><label class="field"><span class="fl">${esc(t('notes'))}</span><textarea id="assess-notes" rows="3" placeholder="${esc(t('assess_notes_ph'))}">${esc(dr.notes)}</textarea></label></section>`;
    h += `<div class="sticky-save"><div class="progress-text" id="assess-progress"></div><button class="btn primary" data-act="saveAssess" data-pet="${pet.id}" data-id="${a ? a.id : ''}" id="assess-save">${icon('check')} ${esc(t('save_check'))}</button></div>`;
    return {
      title: t('welfare_check'), back: a ? `#/pet/${pet.id}/assess/${a.id}` : `#/pet/${pet.id}`, backLabel: a ? t('result') : pet.name,
      tab: 'pets', html: h, after: updateAssessUI, cls: 'assess-view'
    };
  }
  function updateAssessUI() {
    const dr = ui.draft;
    if (!dr) return;
    let answered = 0; let total = 0;
    DOMAINS.forEach((d) => {
      total += d.items.length;
      d.items.forEach((it) => { if (dr.ratings[it.id]) answered++; });
      const s = domainScore(dr.ratings, d);
      const el = $('#ads-' + d.id);
      if (el) { el.textContent = s == null ? '–' : s; el.className = 'ad-score ' + scoreClass(s); }
    });
    const f = FACTOR_DOMAINS.map((k) => domainScore(dr.ratings, DOM[k]));
    const hint = $('#mental-hint');
    if (hint) {
      if (f.every((v) => v != null)) {
        const avg = Math.round(sum(f) / 4);
        hint.innerHTML = `${icon('info')}<span>${esc(t('mental_hint', { n: avg, g: L(grade(avg).name) }))}</span>`;
      } else {
        hint.innerHTML = `${icon('info')}<span>${esc(t('mental_hint_pending'))}</span>`;
      }
    }
    const pr = $('#assess-progress');
    if (pr) pr.innerHTML = `<b>${answered}/${total}</b> ${esc(t('answered'))}`;
    const btn = $('#assess-save');
    if (btn) btn.disabled = answered < total;
  }

  /* ================= View: Welfare check result ================= */
  function viewAssessResult(pet, a) {
    const sc = assessmentScores(a);
    const prevA = prevAssessment(pet.id, a);
    const ps = prevA ? assessmentScores(prevA) : null;
    const g = grade(sc.overall);
    const circ = 2 * Math.PI * 42;
    let h = `<section class="card result-head ${scoreClass(sc.overall)}">
        <div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="ring-bg"/><circle cx="50" cy="50" r="42" class="ring-fg" stroke-dasharray="${(circ * (sc.overall || 0)) / 100} ${circ}" transform="rotate(-90 50 50)"/></svg><span>${sc.overall ?? '–'}</span></div>
        <div class="rh-text"><div class="kicker">${esc(t('overall_welfare'))} · ${esc(pet.name)}</div><h2>${esc(L(g.name))}</h2><p>${esc(L(g.desc))}</p><div class="muted small">${esc(fmtDate(a.date))}</div></div>
      </section>`;
    h += `<section class="card"><div class="card-head"><h2>${esc(t('domain_profile'))}</h2></div>
        ${chart('radar', radarCfg(sc, ps, 300))}
        ${ps ? `<div class="legend center"><span><i class="lg-cur"></i>${esc(t('this_check'))}</span><span><i class="lg-prev"></i>${esc(t('previous'))} (${esc(fmtShortDate(prevA.date))})</span></div>` : ''}
        <ul class="score-list">${DOMAINS.map((d) => {
          const v = sc[d.id];
          const dv = ps && ps[d.id] != null && v != null ? v - ps[d.id] : null;
          return `<li style="--c:${d.color}"><a href="#/pet/${pet.id}/${d.id}">
            <span class="sl-icon">${icon(d.icon)}</span><span class="sl-name">${esc(L(d.name))}</span>
            <span class="sl-bar"><i style="width:${v || 0}%"></i></span><span class="sl-val">${v ?? '–'}</span>
            ${dv != null ? `<span class="delta ${dv > 0 ? 'up' : dv < 0 ? 'down' : ''}">${dv > 0 ? '+' : ''}${dv}</span>` : '<span class="delta"></span>'}</a></li>`;
        }).join('')}</ul>
        <p class="muted small">${esc(t('result_explainer', { f: sc.factors ?? '–' }))}</p>
      </section>`;

    const low = [];
    DOMAINS.forEach((d) => {
      const items = d.items.filter((it) => a.ratings[it.id] && a.ratings[it.id] <= 2);
      if (items.length || (sc[d.id] != null && sc[d.id] < 60)) low.push({ d, items });
    });
    h += `<section class="card"><div class="card-head"><h2>${icon('spark')} ${esc(t('suggestions'))}</h2></div>`;
    if (!low.length) h += `<p>${esc(t('no_suggestions'))}</p>`;
    low.forEach(({ d, items }) => {
      // Pick tips that match the weakest statements; fall back to the domain's first tips.
      const allTips = L(d.tips[pet.species]);
      const basis = items.length ? items : d.items.filter((it) => (a.ratings[it.id] || 5) <= 3);
      const idx = [...new Set(basis.flatMap((it) => (it.tips && it.tips[pet.species]) || []))].filter((i) => allTips[i]);
      [0, 1, 2].forEach((i) => { if (idx.length < 3 && !idx.includes(i)) idx.push(i); });
      h += `<div class="sugg" style="--c:${d.color}"><h3>${icon(d.icon)} ${esc(L(d.name))} <span class="score-chip ${scoreClass(sc[d.id])}">${sc[d.id]}</span></h3>
        ${items.length ? `<div class="sub-title">${esc(t('flagged_items'))}</div><ul class="flag-list">${items.map((it) => `<li><b class="rnum r${a.ratings[it.id]}">${a.ratings[it.id]}</b><span>${esc(L(it.text))}</span></li>`).join('')}</ul>` : ''}
        <div class="sub-title">${esc(t('try_these'))}</div>
        <ul class="tip-list">${idx.slice(0, 3).map((i) => `<li>${esc(allTips[i])}</li>`).join('')}</ul>
        <a class="link" href="#/learn/${d.id}">${esc(t('learn_about_domain'))} ${icon('chevR')}</a></div>`;
    });
    h += `</section>`;
    if (a.notes) h += `<section class="card"><h2>${esc(t('notes'))}</h2><p class="pre">${esc(a.notes)}</p></section>`;
    h += `<div class="btn-row center">
        <a class="btn" href="#/pet/${pet.id}/assess/${a.id}/edit">${icon('edit')} ${esc(t('edit'))}</a>
        <button class="btn danger" data-act="deleteAssess" data-id="${a.id}">${icon('trash')} ${esc(t('delete'))}</button>
      </div>`;
    return { title: t('welfare_result'), back: `#/pet/${pet.id}`, backLabel: pet.name, tab: 'pets', html: h };
  }

  /* ================= View: Learn ================= */
  function viewLearn() {
    let h = `<section class="card learn-hero">
        <div class="kicker">${esc(t('learn_kicker'))}</div>
        <h2>${esc(t('learn_title'))}</h2>
        <p>${esc(t('learn_intro'))}</p>
        ${modelDiagram()}
      </section>
      <div class="section-head"><h2>${esc(t('topics'))}</h2></div>
      <div class="topic-grid">${C.learn.map(topicCard).join('')}</div>`;
    return { title: t('nav_learn'), tab: 'learn', html: h };
  }
  function topicCard(tp) {
    if (tp.domain) {
      const d = DOM[tp.domain];
      return `<a class="topic-card domain" style="--c:${d.color}" href="#/learn/${tp.id}"><span class="t-emoji">${icon(d.icon)}</span>
        <span class="t-main"><span class="t-title">${esc(t('domain_n', { n: d.n }))}: ${esc(L(d.name))}</span><span class="t-sub">${esc(L(d.short))}</span></span>${icon('chevR', 'chev')}</a>`;
    }
    return `<a class="topic-card" href="#/learn/${tp.id}"><span class="t-emoji">${tp.emoji}</span>
      <span class="t-main"><span class="t-title">${esc(L(tp.title))}</span><span class="t-sub">${esc(L(tp.sub))}</span></span>${icon('chevR', 'chev')}</a>`;
  }
  function topicNav(id) {
    const i = C.learn.findIndex((x) => x.id === id);
    const name = (tp) => (tp.domain ? `${t('domain_n', { n: DOM[tp.domain].n })}: ${L(DOM[tp.domain].name)}` : L(tp.title));
    const prev = C.learn[i - 1];
    const next = C.learn[i + 1];
    return `<nav class="topic-nav">
      ${prev ? `<a href="#/learn/${prev.id}" class="tn prev">${icon('chevL')}<span><small>${esc(t('prev_topic'))}</small>${esc(name(prev))}</span></a>` : '<span></span>'}
      ${next ? `<a href="#/learn/${next.id}" class="tn next"><span><small>${esc(t('next_topic'))}</small>${esc(name(next))}</span>${icon('chevR')}</a>` : '<span></span>'}
    </nav>`;
  }
  function renderBlock(b) {
    if (b.p) return `<p>${esc(L(b.p))}</p>`;
    if (b.h) return `<h3>${esc(L(b.h))}</h3>`;
    if (b.list) return `<ul>${L(b.list).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (b.diagram) return `<div class="card inset">${modelDiagram()}</div>`;
    if (b.note) return `<p class="note">${icon('info')} ${esc(L(b.note))}</p>`;
    if (b.timeline) return `<ol class="timeline">${b.timeline.map((x) => `<li><div class="tl-year">${esc(x.y)}</div><div>${esc(L(x.t))}</div></li>`).join('')}</ol>`;
    if (b.table) {
      return `<div class="table-wrap"><table><thead><tr>${b.table.head.map((c) => `<th>${esc(L(c))}</th>`).join('')}</tr></thead>
        <tbody>${b.table.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(L(c))}</th>` : `<td>${esc(L(c))}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if (b.refs) return `<ol class="refs">${b.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`;
    if (b.mapping) {
      return `<ul class="mapping">${DOMAINS.map((d) => `<li style="--c:${d.color}"><span class="mp-icon">${icon(d.icon)}</span><span><b>${esc(t('domain_n', { n: d.n }))}: ${esc(L(d.name))}</b><span class="muted">${esc(t('map_' + d.id))}</span></span></li>`).join('')}</ul>`;
    }
    return '';
  }
  function viewLearnTopic(id) {
    const tp = C.learn.find((x) => x.id === id);
    if (!tp) return null;
    let h;
    if (tp.domain) {
      const d = DOM[tp.domain];
      h = `<article class="article">
        <section class="domain-banner" style="--c:${d.color}"><div class="db-row"><span class="db-icon">${icon(d.icon)}</span>
          <div class="db-titles"><div class="kicker">${esc(t('domain_n', { n: d.n }))}</div><h2>${esc(L(d.name))}</h2></div></div>
          <p>${esc(L(d.short))}</p></section>
        <section class="card"><p>${esc(L(d.desc))}</p></section>
        ${experiencesCard(d)}
        <section class="card"><div class="two-col">
          <div><h3>${esc(t('supports_welfare'))}</h3><ul>${L(d.goodConditions).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div><h3>${esc(t('compromises_welfare'))}</h3><ul>${L(d.poorConditions).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </div></section>
        ${d.interactionTypes ? `<section class="card"><h2>${esc(t('three_interactions'))}</h2><ul>${L(d.interactionTypes).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
        ${d.id === 'mental' ? `<section class="card"><h2>${esc(t('how_domains_connect'))}</h2><p>${esc(t('how_domains_connect_body'))}</p>${modelDiagram()}</section>` : ''}
        ${tipsCard(d, 'cat')}
        ${tipsCard(d, 'dog')}
        <section class="card"><h2>${esc(t('statements_in_app'))}</h2><p class="muted small">${esc(t('statements_intro'))}</p><ul>${d.items.map((it) => `<li>${esc(L(it.text))}</li>`).join('')}</ul>
          <p class="muted small">${esc(t('in_petsdb_' + d.id))}</p></section>
      </article>`;
      h += topicNav(id);
      return { title: L(d.label), back: '#/learn', backLabel: t('nav_learn'), tab: 'learn', html: h, style: `--c:${d.color}` };
    }
    h = `<article class="article card">
        <div class="article-head"><span class="a-emoji">${tp.emoji}</span><div><h2>${esc(L(tp.title))}</h2><p class="muted">${esc(L(tp.sub))}</p></div></div>
        ${tp.blocks.map(renderBlock).join('')}
      </article>${topicNav(id)}`;
    return { title: L(tp.title), back: '#/learn', backLabel: t('nav_learn'), tab: 'learn', html: h };
  }

  /* ================= View: Settings ================= */
  function viewSettings() {
    const nRecs = sum(COLLECTIONS.map((k) => state[k].length));
    const h = `<section class="card"><h2>${icon('globe')} ${esc(t('language'))}</h2>
        ${segmented('setLang', [['en', 'English'], ['zh', '繁體中文']], lang())}</section>
      <section class="card"><h2>${icon('scale')} ${esc(t('weight_unit'))}</h2>
        ${segmented('setUnit', [['kg', t('kilograms')], ['lb', t('pounds')]], unit())}</section>
      <section class="card"><h2>${esc(t('data_backup'))}</h2>
        <p class="muted small">${esc(t('backup_intro'))}</p>
        <div class="set-list">
          <button class="set-row" data-act="exportData">${icon('download')}<span><b>${esc(t('export_backup'))}</b><small>${esc(t('export_hint'))}</small></span></button>
          <label class="set-row">${icon('upload')}<span><b>${esc(t('import_backup'))}</b><small>${esc(t('import_hint'))}</small></span><input type="file" accept="application/json,.json" data-act-change="importData" class="visually-hidden"></label>
          <button class="set-row" data-act="loadSample">${icon('spark')}<span><b>${esc(t('load_sample'))}</b><small>${esc(t('load_sample_hint'))}</small></span></button>
          <button class="set-row danger" data-act="eraseAll">${icon('trash')}<span><b>${esc(t('erase_all'))}</b><small>${esc(t('erase_hint'))}</small></span></button>
        </div>
        <p class="muted small">${esc(t('storage_info', { p: state.pets.length, r: nRecs }))}</p>
      </section>
      <section class="card"><h2>${icon('share')} ${esc(t('install_title'))}</h2>
        <ol class="steps"><li>${esc(t('install_1'))}</li><li>${esc(t('install_2'))}</li><li>${esc(t('install_3'))}</li></ol>
        <p class="muted small">${esc(t('install_note'))}</p></section>
      <section class="card about">
        ${logoPicture('full', 'about-logo')}
        <p><b>PetsDB</b> · ${esc(t('version'))} 1.0</p>
        <p class="muted small">${esc(t('about_body'))}</p>
        <p class="note small">${esc(t('disclaimer'))}</p>
        <a class="link" href="#/learn/references">${esc(t('references'))} ${icon('chevR')}</a>
      </section>`;
    return { title: t('nav_settings'), tab: 'settings', html: h };
  }

  /* ================= Sheets & forms ================= */
  function openSheet({ title, html, onSave, onDelete, saveLabel, onMount }) {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="sheet-backdrop" data-act="closeSheet"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="sheet-head"><button type="button" class="text-btn" data-act="closeSheet">${esc(t('cancel'))}</button><h2>${esc(title)}</h2><button type="button" class="text-btn strong" data-act="sheetSave">${esc(saveLabel || t('save'))}</button></div>
        <form class="sheet-body" id="sheet-form" novalidate>${html}
          ${onDelete ? `<button type="button" class="btn danger block" data-act="sheetDelete">${icon('trash')} ${esc(t('delete'))}</button>` : ''}
          <button type="submit" hidden></button>
        </form>
      </div>`;
    root.classList.add('open');
    document.body.classList.add('sheet-open');
    ui.sheet = { onSave, onDelete };
    const form = $('#sheet-form');
    form.addEventListener('submit', (e) => { e.preventDefault(); sheetSave(); });
    if (onMount) onMount(form);
    requestAnimationFrame(() => requestAnimationFrame(() => { const s = root.querySelector('.sheet'); if (s) s.classList.add('in'); }));
  }
  function closeSheet() {
    const root = $('#sheet-root');
    root.classList.remove('open');
    root.innerHTML = '';
    document.body.classList.remove('sheet-open');
    ui.sheet = null;
    ui.photoDraft = undefined;
  }
  function sheetSave() {
    if (!ui.sheet) return;
    const res = ui.sheet.onSave($('#sheet-form'));
    if (res !== false) closeSheet();
  }

  function fld(f, val) {
    const v = val != null && val !== '' ? val : f.default != null ? f.default : '';
    const label = `<span class="fl">${esc(f.label)}${f.required ? ' <i class="req">*</i>' : ''}</span>`;
    const attrs = (f.required ? ' required' : '') + (f.step ? ` step="${f.step}"` : '') + (f.min != null ? ` min="${f.min}"` : '') + (f.max != null ? ` max="${f.max}"` : '');
    switch (f.type) {
      case 'textarea':
        return `<label class="field">${label}<textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea></label>`;
      case 'select':
        return `<label class="field" ${f.id ? `id="${f.id}"` : ''}>${label}<select name="${f.name}"${attrs}>${f.blank != null ? `<option value="">${esc(f.blank)}</option>` : ''}${f.options.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(v) ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select></label>`;
      case 'seg':
        return `<div class="field">${label}<div class="seg ${f.cls || ''}" data-seg="${f.name}">${f.options.map((o) => `<button type="button" class="${String(o.v) === String(v) ? 'on' : ''}" data-act="segPick" data-v="${esc(o.v)}">${esc(o.l)}</button>`).join('')}</div><input type="hidden" name="${f.name}" value="${esc(v)}"></div>`;
      case 'toggle':
        return `<label class="field toggle-row">${label}<input type="checkbox" name="${f.name}" class="switch"${v ? ' checked' : ''}></label>`;
      default:
        return `<label class="field" ${f.id ? `id="${f.id}"` : ''}${f.hidden ? ' hidden' : ''}>${label}<span class="input-wrap"><input type="${f.type || 'text'}" name="${f.name}" value="${esc(v)}"${attrs}${f.type === 'number' ? ' inputmode="decimal"' : ''} placeholder="${esc(f.ph || '')}" autocomplete="off">${f.suffix ? `<span class="suffix">${esc(f.suffix)}</span>` : ''}</span></label>`;
    }
  }
  function readForm(form) {
    const o = {};
    new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
    $$('input[type=checkbox][name]', form).forEach((c) => { o[c.name] = c.checked; });
    return o;
  }
  function validate(form) {
    let ok = true;
    $$('[required]', form).forEach((el) => {
      const field = el.closest('.field');
      if (field && field.hidden) return;
      const bad = !String(el.value || '').trim();
      if (field) field.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) toast(t('fill_required'), 'bad');
    return ok;
  }
  const opts = (list) => list.map((o) => ({ v: o.id, l: L(o.name) }));

  function schema(col, pet) {
    const date = { name: 'date', type: 'date', label: t('date'), required: true, max: col === 'treatments' || col === 'medical' ? null : today() };
    switch (col) {
      case 'weights': return [
        date,
        { name: 'weight', type: 'number', label: t('weight'), required: true, step: '0.01', min: 0, suffix: unit() },
        { name: 'bcs', type: 'select', label: t('bcs_title'), blank: t('not_recorded'), options: C.bcs.map((b) => ({ v: b.s, l: `${b.s} · ${L(b.name)}` })) },
        { name: 'note', label: t('note') }
      ];
      case 'medical': return [
        date,
        { name: 'category', type: 'select', label: t('category'), options: opts(C.medicalCategories) },
        { name: 'title', label: t('title_field'), required: true, ph: t('medical_title_ph') },
        { name: 'status', type: 'select', label: t('status'), options: opts(C.medicalStatus) },
        { name: 'vet', label: t('vet_clinic') },
        { name: 'notes', type: 'textarea', label: t('notes'), ph: t('medical_notes_ph') }
      ];
      case 'treatments': return [
        date,
        { name: 'type', type: 'select', label: t('type'), options: C.treatmentTypes.map((x) => ({ v: x.id, l: `${x.icon} ${L(x.name)}` })) },
        { name: 'name', label: t('treatment_name'), required: true, ph: t('treatment_name_ph') },
        { name: 'dose', label: t('dose'), ph: t('dose_ph') },
        { name: 'frequency', label: t('frequency'), ph: t('frequency_ph') },
        { name: 'vet', label: t('vet_clinic') },
        { name: 'cost', type: 'number', label: t('cost'), step: '0.01', min: 0 },
        { name: 'nextDue', type: 'date', label: t('next_due') },
        { name: 'notes', type: 'textarea', label: t('notes') }
      ];
      case 'activities': return [
        date,
        { name: 'type', type: 'select', label: t('activity_type'), options: C.activityTypes.map((a) => ({ v: a.id, l: `${a.icon} ${L(a.name)}` })) },
        { name: 'with', type: 'seg', label: t('interaction_with'), options: opts(C.interactionWith) },
        { name: 'minutes', type: 'number', label: t('duration'), suffix: t('min'), min: 0, step: '1' },
        { name: 'note', label: t('note'), ph: t('activity_note_ph') }
      ];
      case 'moods': return [
        date,
        { name: 'mood', type: 'seg', cls: 'mood-seg', label: t('mood'), options: C.moods.map((m) => ({ v: m.v, l: `${m.face} ${L(m.name)}` })), default: 4 },
        { name: 'note', type: 'textarea', label: t('note'), ph: t('mood_note_ph', { name: pet.name }) }
      ];
    }
    return [];
  }

  function openRecordForm(col, pet, rec, prefill) {
    const fields = schema(col, pet);
    const vals = rec ? Object.assign({}, rec) : Object.assign({ date: today() }, prefill || {});
    if (col === 'weights' && rec) vals.weight = round(kgToDisp(rec.kg), 2);
    if (col === 'activities' && !rec) {
      vals.type = vals.type || (pet.species === 'dog' ? 'walk' : 'play');
      vals.with = actType(vals.type).with;
    }
    if (col === 'activities' && rec && !rec.with) vals.with = actType(rec.type).with;
    if (col === 'medical' && !rec) { vals.category = 'diagnosis'; vals.status = 'active'; }
    openSheet({
      title: t((rec ? 'edit_' : 'add_') + col),
      html: fields.map((f) => fld(f, vals[f.name])).join(''),
      onMount: (form) => {
        if (col === 'activities') {
          const sel = form.querySelector('select[name=type]');
          sel.addEventListener('change', () => setSeg(form, 'with', actType(sel.value).with));
        }
      },
      onSave: (form) => {
        if (!validate(form)) return false;
        const d = readForm(form);
        const r = Object.assign({}, rec || { id: uid(), petId: pet.id, created: Date.now() }, d);
        if (col === 'weights') {
          const w = parseFloat(String(d.weight).replace(',', '.'));
          if (!(w > 0 && w < 200)) { toast(t('invalid_number'), 'bad'); return false; }
          r.kg = round(dispToKg(w), 3);
          delete r.weight;
          r.bcs = d.bcs ? +d.bcs : null;
        }
        if (col === 'activities') r.minutes = d.minutes ? Math.max(0, Math.round(+d.minutes)) : 0;
        if (col === 'moods') r.mood = Math.min(5, Math.max(1, +d.mood || 3));
        if (col === 'treatments') r.cost = d.cost !== '' && d.cost != null ? +d.cost : null;
        upsert(col, r);
        toast(t('saved'));
        render();
      },
      onDelete: rec ? () => {
        if (!confirm(t('confirm_delete'))) return false;
        removeRec(col, rec.id);
        toast(t('deleted'));
        render();
      } : null
    });
  }
  function setSeg(form, name, value) {
    const seg = form.querySelector(`[data-seg="${name}"]`);
    if (!seg) return;
    $$('button', seg).forEach((b) => b.classList.toggle('on', b.dataset.v === String(value)));
    const input = form.querySelector(`input[name="${name}"]`);
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function breedOptions(sp) { return C.breeds[sp].map((b) => ({ v: b.id, l: L(b.name) })); }
  function openPetForm(pet) {
    const p = pet || { species: 'cat', sex: 'female', neutered: false, breed: 'mixed' };
    ui.photoDraft = undefined;
    const html = `
      <div class="photo-field">
        <div class="photo-preview" id="photo-preview">${avatar(p, 'xl')}</div>
        <div class="photo-actions">
          <label class="btn small">${icon('camera')} ${esc(t('choose_photo'))}<input type="file" accept="image/*" id="photo-input" class="visually-hidden"></label>
          <button type="button" class="btn small ghost" data-act="removePhoto" id="photo-remove"${p.photo ? '' : ' hidden'}>${esc(t('remove'))}</button>
        </div>
      </div>
      ${fld({ name: 'name', label: t('pet_name'), required: true, ph: t('pet_name_ph') }, p.name)}
      ${fld({ name: 'species', type: 'seg', label: t('species'), options: [{ v: 'cat', l: '🐱 ' + t('cat') }, { v: 'dog', l: '🐶 ' + t('dog') }] }, p.species)}
      ${fld({ name: 'breed', type: 'select', label: t('breed'), options: breedOptions(p.species), id: 'breed-field' }, p.breed)}
      ${fld({ name: 'breedOther', label: t('breed_other'), ph: t('breed_other_ph'), id: 'breed-other', hidden: p.breed !== 'other' }, p.breedOther)}
      ${fld({ name: 'sex', type: 'seg', label: t('sex'), options: [{ v: 'female', l: '♀ ' + t('female') }, { v: 'male', l: '♂ ' + t('male') }] }, p.sex)}
      ${fld({ name: 'neutered', type: 'toggle', label: t('neutered_q') }, p.neutered)}
      ${fld({ name: 'dob', type: 'date', label: t('birthday'), max: today() }, p.dob)}
      ${fld({ name: 'color', label: t('colour'), ph: t('colour_ph') }, p.color)}
      ${fld({ name: 'microchip', label: t('microchip'), ph: t('microchip_ph') }, p.microchip)}
      ${fld({ name: 'notes', type: 'textarea', label: t('notes'), ph: t('pet_notes_ph') }, p.notes)}`;
    openSheet({
      title: pet ? t('edit_pet') : t('add_pet'),
      html,
      onMount: (form) => {
        const sp = form.querySelector('input[name=species]');
        const breedSel = form.querySelector('select[name=breed]');
        const other = form.querySelector('#breed-other');
        const syncOther = () => { other.hidden = breedSel.value !== 'other'; };
        sp.addEventListener('change', () => {
          breedSel.innerHTML = breedOptions(sp.value).map((o) => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('');
          breedSel.value = 'mixed';
          syncOther();
          const prevEl = $('#photo-preview .avatar span');
          if (prevEl) prevEl.textContent = sp.value === 'dog' ? '🐶' : '🐱';
        });
        breedSel.addEventListener('change', syncOther);
        $('#photo-input').addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          try {
            ui.photoDraft = await resizeImage(file, 640);
            $('#photo-preview').innerHTML = `<div class="avatar xl"><img src="${esc(ui.photoDraft)}" alt=""></div>`;
            $('#photo-remove').hidden = false;
          } catch (err) { toast(t('photo_failed'), 'bad'); }
        });
      },
      onSave: (form) => {
        if (!validate(form)) return false;
        const d = readForm(form);
        const target = pet || { id: uid(), created: Date.now(), envChecklist: {}, feeding: {}, environment: {} };
        Object.assign(target, {
          name: d.name, species: d.species === 'dog' ? 'dog' : 'cat', breed: d.breed, breedOther: d.breed === 'other' ? d.breedOther : '',
          sex: d.sex, neutered: !!d.neutered, dob: d.dob, color: d.color, microchip: d.microchip, notes: d.notes
        });
        if (ui.photoDraft !== undefined) target.photo = ui.photoDraft;
        if (!pet) {
          state.pets.push(target);
          save();
          toast(t('pet_added', { name: target.name }));
          go('#/pet/' + target.id);
        } else {
          save();
          toast(t('saved'));
          render();
        }
      },
      onDelete: pet ? () => {
        if (!confirm(t('confirm_delete_pet', { name: pet.name }))) return false;
        state.pets = state.pets.filter((x) => x.id !== pet.id);
        COLLECTIONS.forEach((k) => { state[k] = state[k].filter((r) => r.petId !== pet.id); });
        save();
        toast(t('deleted'));
        go('#/');
      } : null
    });
  }

  function resizeImage(file, max) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * s));
        const h = Math.max(1, Math.round(img.height * s));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  function openTargetForm(pet) {
    openSheet({
      title: t('ideal_range'),
      html: `<p class="muted small">${esc(t('ideal_range_help'))}</p>
        ${fld({ name: 'min', type: 'number', label: t('min_weight'), step: '0.01', min: 0, suffix: unit() }, pet.targetMin ? round(kgToDisp(pet.targetMin), 2) : '')}
        ${fld({ name: 'max', type: 'number', label: t('max_weight'), step: '0.01', min: 0, suffix: unit() }, pet.targetMax ? round(kgToDisp(pet.targetMax), 2) : '')}`,
      onSave: (form) => {
        const d = readForm(form);
        if (d.min === '' && d.max === '') { pet.targetMin = null; pet.targetMax = null; }
        else {
          const mn = parseFloat(d.min); const mx = parseFloat(d.max);
          if (!(mn > 0 && mx > 0 && mx >= mn)) { toast(t('range_invalid'), 'bad'); return false; }
          pet.targetMin = round(dispToKg(mn), 3); pet.targetMax = round(dispToKg(mx), 3);
        }
        save(); render();
      }
    });
  }
  function openFeedingForm(pet) {
    const f = pet.feeding || {};
    openSheet({
      title: t('feeding_plan'),
      html: [
        fld({ name: 'food', label: t('food'), ph: t('food_ph') }, f.food),
        fld({ name: 'amount', label: t('amount_per_day'), ph: t('amount_ph') }, f.amount),
        fld({ name: 'meals', type: 'number', label: t('meals_per_day'), min: 1, step: '1' }, f.meals),
        fld({ name: 'treats', label: t('treats'), ph: t('treats_ph') }, f.treats),
        fld({ name: 'water', label: t('water'), ph: t('water_ph') }, f.water),
        fld({ name: 'notes', type: 'textarea', label: t('notes'), ph: t('feeding_notes_ph') }, f.notes)
      ].join(''),
      onSave: (form) => { pet.feeding = readForm(form); save(); toast(t('saved')); render(); }
    });
  }
  function openEnvForm(pet) {
    const e = pet.environment || {};
    openSheet({
      title: t('living_situation'),
      html: [
        fld({ name: 'living', type: 'select', label: t('living'), blank: '—', options: LIVING.map((x) => ({ v: x, l: t('living_' + x) })) }, e.living),
        fld({ name: 'home', type: 'select', label: t('home_type'), blank: '—', options: HOMES.map((x) => ({ v: x, l: t('home_' + x) })) }, e.home),
        fld({ name: 'alone', type: 'number', label: t('hours_alone'), min: 0, step: '0.5', suffix: t('hours_short') }, e.alone),
        fld({ name: 'housemates', label: t('housemates'), ph: t('housemates_ph') }, e.housemates),
        fld({ name: 'notes', type: 'textarea', label: t('notes'), ph: t('env_notes_ph') }, e.notes)
      ].join(''),
      onSave: (form) => { pet.environment = readForm(form); save(); toast(t('saved')); render(); }
    });
  }

  /* ================= Actions ================= */
  function setLang(l) {
    state.settings.lang = l;
    save();
    renderChrome();
    render();
  }
  const actions = {
    toggleLang: () => setLang(lang() === 'zh' ? 'en' : 'zh'),
    setLang: (el) => setLang(el.dataset.v),
    setUnit: (el) => { state.settings.unit = el.dataset.v; save(); render(); },
    addPet: () => openPetForm(null),
    editPet: (el) => { const p = getPet(el.dataset.id); if (p) openPetForm(p); },
    addRec: (el) => { const p = currentPet(); if (p) openRecordForm(el.dataset.col, p, null); },
    editRec: (el) => {
      const r = state[el.dataset.col].find((x) => x.id === el.dataset.id);
      const p = r && getPet(r.petId);
      if (p) openRecordForm(el.dataset.col, p, r);
    },
    markDone: (el) => {
      const r = state.treatments.find((x) => x.id === el.dataset.id);
      const p = r && getPet(r.petId);
      if (!p) return;
      const interval = r.nextDue && r.date ? diffDays(r.date, r.nextDue) : 0;
      openRecordForm('treatments', p, null, {
        type: r.type, name: r.name, dose: r.dose, frequency: r.frequency, vet: r.vet,
        nextDue: interval > 0 ? addDays(today(), interval) : ''
      });
    },
    wRange: (el) => { ui.wRange = el.dataset.v; render(); },
    treatFilter: (el) => { ui.treatFilter = el.dataset.v; render(); },
    expand: (el) => { ui.expanded[el.dataset.key] = !ui.expanded[el.dataset.key]; render(); },
    quickMood: (el) => {
      const p = currentPet();
      if (!p) return;
      const v = +el.dataset.v;
      const ex = state.moods.find((m) => m.petId === p.id && m.date === today());
      if (ex) ex.mood = v; else state.moods.push({ id: uid(), petId: p.id, date: today(), mood: v, created: Date.now() });
      save();
      toast(t('mood_saved', { face: C.moods[v - 1].face }));
      render();
    },
    rate: (el) => {
      if (!ui.draft) return;
      const id = el.dataset.item; const v = +el.dataset.v;
      ui.draft.ratings[id] = v;
      $$(`.r[data-item="${id}"]`).forEach((b) => { const on = +b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      const sel = $('#sel-' + id);
      if (sel) sel.textContent = L(C.ratingScale[v - 1].name);
      updateAssessUI();
    },
    saveAssess: (el) => {
      const dr = ui.draft;
      const pet = getPet(el.dataset.pet);
      if (!dr || !pet) return;
      const total = sum(DOMAINS.map((d) => d.items.length));
      if (Object.keys(dr.ratings).length < total) { toast(t('answer_all'), 'bad'); return; }
      const ex = el.dataset.id ? state.assessments.find((x) => x.id === el.dataset.id) : null;
      const rec = Object.assign(ex || { id: uid(), petId: pet.id, created: Date.now() }, { date: dr.date || today(), ratings: Object.assign({}, dr.ratings), notes: dr.notes });
      upsert('assessments', rec);
      ui.draft = null;
      toast(t('check_saved'));
      go(`#/pet/${pet.id}/assess/${rec.id}`);
    },
    deleteAssess: (el) => {
      const a = state.assessments.find((x) => x.id === el.dataset.id);
      if (!a || !confirm(t('confirm_delete'))) return;
      removeRec('assessments', a.id);
      toast(t('deleted'));
      go(`#/pet/${a.petId}/mental`);
    },
    editTarget: () => { const p = currentPet(); if (p) openTargetForm(p); },
    editFeeding: () => { const p = currentPet(); if (p) openFeedingForm(p); },
    editEnv: () => { const p = currentPet(); if (p) openEnvForm(p); },
    closeSheet: () => closeSheet(),
    sheetSave: () => sheetSave(),
    sheetDelete: () => { if (ui.sheet && ui.sheet.onDelete && ui.sheet.onDelete() !== false) closeSheet(); },
    segPick: (el) => { const seg = el.closest('[data-seg]'); setSeg(seg.closest('form'), seg.dataset.seg, el.dataset.v); },
    removePhoto: () => {
      ui.photoDraft = null;
      const sp = $('#sheet-form input[name=species]');
      $('#photo-preview').innerHTML = avatar({ species: sp ? sp.value : 'cat' }, 'xl');
      $('#photo-remove').hidden = true;
    },
    exportData: () => exportData(),
    loadSample: () => {
      if (state.pets.length && !confirm(t('confirm_sample'))) return;
      addSampleData();
      save();
      toast(t('sample_loaded'));
      go('#/');
    },
    eraseAll: () => {
      if (!confirm(t('confirm_erase'))) return;
      const s = state.settings;
      state = emptyState();
      state.settings = s;
      save();
      toast(t('erased'));
      go('#/');
    }
  };
  const changeActions = {
    energyFactor: (el) => { const p = currentPet(); if (p) { ui.energy[p.id] = el.value; render(); } },
    envCheck: (el) => {
      const p = currentPet();
      if (!p) return;
      p.envChecklist = p.envChecklist || {};
      p.envChecklist[el.dataset.id] = el.checked;
      save();
      render();
    },
    importData: (el) => importData(el)
  };

  async function exportData() {
    const data = JSON.stringify(Object.assign({ app: 'PetsDB', exported: new Date().toISOString() }, state), null, 2);
    const name = `petsdb-backup-${today()}.json`;
    let file = null;
    try { file = new File([data], name, { type: 'application/json' }); } catch (e) { /* old browsers */ }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'PetsDB backup' }); toast(t('exported')); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file || new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(t('exported'));
  }
  function importData(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!obj || !Array.isArray(obj.pets)) throw new Error('format');
        const next = normalize(obj);
        if (!confirm(t('confirm_import', { n: next.pets.length }))) return;
        next.settings = state.settings;
        state = next;
        save();
        renderChrome();
        toast(t('imported'));
        go('#/');
      } catch (e) { toast(t('import_failed'), 'bad'); }
    };
    reader.readAsText(file);
  }

  /* ================= Sample data ================= */
  function addSampleData() {
    const zh = lang() === 'zh';
    const T = (en, z) => (zh ? z : en);
    const td = today();
    const ago = (n) => addDays(td, -n);
    const ahead = (n) => addDays(td, n);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const now = Date.now();
    const mk = (o) => Object.assign({ id: uid() + Math.floor(rnd() * 1e6).toString(36), created: now }, o);

    const cat = mk({
      name: 'Mochi', species: 'cat', breed: 'british', sex: 'female', neutered: true, dob: ago(3 * 365 + 130),
      color: T('Blue-grey', '藍灰色'), microchip: '985 141 000 123 456',
      notes: T('Loves sunny window spots. Shy with visitors; hides under the bed when the doorbell rings.', '喜歡在窗邊曬太陽。對訪客較害羞，門鐘一響便會躲到床底。'),
      targetMin: 4.0, targetMax: 4.6,
      feeding: { food: T('Complete wet food (pouches) + measured dry kibble', '完整濕糧（包裝）＋定量乾糧'), amount: T('1 pouch (85 g) + 35 g dry', '1 包濕糧（85 克）＋35 克乾糧'), meals: '3', treats: T('A few freeze-dried chicken pieces', '數粒凍乾雞肉'), water: T('Water fountain + 2 bowls', '循環飲水機＋2 個水碗'), notes: T('Puzzle feeder for the evening dry portion.', '晚上的乾糧以益智餵食器餵食。') },
      environment: { living: 'indoor', home: 'flat', alone: '8', housemates: T('2 adults, no other pets', '2 位成人，沒有其他寵物'), notes: T('Window netting installed in all rooms.', '所有房間的窗戶已安裝防護網。') },
      envChecklist: { c_litter: true, c_separate: true, c_scratch: true, c_vertical: true, c_hide: true, c_window: true, c_toxic: true, c_temp: true }
    });
    const dog = mk({
      name: 'Lucky', species: 'dog', breed: 'shiba', sex: 'male', neutered: true, dob: ago(6 * 365 + 40),
      color: T('Red', '赤色'), microchip: '985 141 000 654 321',
      notes: T('Very food-motivated. Dislikes having his paws handled.', '對食物非常有動力，不喜歡被觸碰腳掌。'),
      targetMin: 9.5, targetMax: 11,
      feeding: { food: T('Adult dry food, sensitive-skin formula', '成犬乾糧（皮膚敏感配方）'), amount: T('160 g dry per day', '每日 160 克乾糧'), meals: '2', treats: T('Training treats, counted into daily total', '訓練小食（計入每日總量）'), water: T('Bowl at home + travel bottle on walks', '家中水碗＋散步時攜帶水樽') },
      environment: { living: 'indoor_outdoor', home: 'flat', alone: '6', housemates: T('Family of 3', '一家三口'), notes: T('Walks at 7 am and 8 pm in summer to avoid the heat.', '夏天於早上 7 時及晚上 8 時散步，避開炎熱時段。') },
      envChecklist: { d_bed: true, d_retreat: true, d_water: true, d_heat: true, d_secure: true, d_walk: true, d_toys: true, d_clean: true }
    });
    state.pets.push(cat, dog);

    // Weights: monthly for ~14 months
    for (let i = 14; i >= 0; i--) {
      const date = ago(i * 30 + 3);
      const ck = 4.15 + (14 - i) * 0.05 + (rnd() - 0.5) * 0.08;
      state.weights.push(mk({ petId: cat.id, date, kg: round(ck, 2), bcs: i < 5 ? 6 : 5 }));
      const dk = 10.4 + Math.sin(i / 2) * 0.25 + (rnd() - 0.5) * 0.15;
      state.weights.push(mk({ petId: dog.id, date: ago(i * 30 + 9), kg: round(dk, 2), bcs: 5 }));
    }

    const med = (petId, date, category, title, status, vet, notes) => state.medical.push(mk({ petId, date, category, title, status, vet, notes }));
    const clinic = T('Harbour Animal Clinic', '海港動物診所');
    med(cat.id, ago(3 * 365), 'surgery', T('Spay (ovariohysterectomy)', '絕育手術（卵巢子宮切除）'), 'resolved', clinic, T('Recovered well.', '康復良好。'));
    med(cat.id, ago(205), 'checkup', T('Annual health check', '年度身體檢查'), 'resolved', clinic, T('Mild tartar. Weight trending up; vet advised portion control.', '有輕微牙石。體重有上升趨勢，獸醫建議控制份量。'));
    med(cat.id, ago(205), 'diagnosis', T('Mild gingivitis', '輕度牙齦炎'), 'monitoring', clinic, T('Start tooth brushing 3× per week.', '開始每星期刷牙 3 次。'));
    med(dog.id, ago(900), 'allergy', T('Atopic dermatitis (seasonal itch)', '異位性皮膚炎（季節性痕癢）'), 'chronic', clinic, T('Flares in humid months. Managed with diet and medication.', '潮濕月份會發作，以飲食及藥物控制。'));
    med(dog.id, ago(150), 'checkup', T('Annual check-up and blood test', '年度檢查及驗血'), 'resolved', clinic, T('All results normal.', '所有結果正常。'));
    med(dog.id, ago(420), 'injury', T('Torn dewclaw', '狼爪撕裂'), 'resolved', clinic, '');

    const tr = (petId, date, type, name, extra) => state.treatments.push(mk(Object.assign({ petId, date, type, name, vet: clinic }, extra || {})));
    tr(cat.id, ago(345), 'vaccination', T('FVRCP vaccine', '貓三合一疫苗'), { nextDue: ahead(20) });
    tr(cat.id, ago(95), 'parasite', T('Deworming tablet', '體內驅蟲藥'), { dose: T('1 tablet', '1 粒'), nextDue: ago(5) });
    tr(cat.id, ago(25), 'parasite', T('Flea spot-on', '滴頸驅蚤藥'), { frequency: T('Monthly', '每月'), nextDue: ahead(5) });
    tr(cat.id, ago(190), 'dental', T('Dental scale and polish', '洗牙及拋光'), { cost: 1800 });
    tr(dog.id, ago(300), 'vaccination', T('DHPPiL vaccine', '犬五合一疫苗'), { nextDue: ahead(65) });
    tr(dog.id, ago(300), 'vaccination', T('Rabies vaccine', '狂犬病疫苗'), { nextDue: ahead(65) });
    tr(dog.id, ago(22), 'parasite', T('Heartworm prevention chew', '心絲蟲預防咀嚼片'), { frequency: T('Monthly', '每月'), nextDue: ahead(8) });
    tr(dog.id, ago(80), 'parasite', T('Tick and flea tablet', '壁蝨及跳蚤口服藥'), { frequency: T('Every 3 months', '每 3 個月'), nextDue: ahead(10) });
    tr(dog.id, ago(30), 'medication', T('Anti-itch medication', '止痕藥'), { dose: T('1 tablet', '1 粒'), frequency: T('Once daily for 14 days', '每日 1 次，共 14 日') });

    // Activities (last 21 days)
    for (let i = 20; i >= 0; i--) {
      const date = ago(i);
      state.activities.push(mk({ petId: dog.id, date, type: 'walk', with: 'environment', minutes: 35 + Math.round(rnd() * 35), note: i % 6 === 0 ? T('Long sniffing walk in the park', '在公園慢慢嗅聞的長散步') : '' }));
      if (i % 3 === 0) state.activities.push(mk({ petId: dog.id, date, type: 'training', with: 'humans', minutes: 10, note: T('Paw-handling practice with treats', '以小食練習觸碰腳掌') }));
      if (i % 5 === 1) state.activities.push(mk({ petId: dog.id, date, type: 'social_animal', with: 'animals', minutes: 20, note: T('Play with neighbour\'s dog', '與鄰居的狗玩耍') }));
      if (i % 4 === 2) state.activities.push(mk({ petId: dog.id, date, type: 'enrichment', with: 'environment', minutes: 15 }));
      if (rnd() > 0.2) state.activities.push(mk({ petId: cat.id, date, type: 'play', with: 'humans', minutes: 10 + Math.round(rnd() * 10), note: i % 5 === 0 ? T('Wand toy, ended with a treat', '逗貓棒遊戲，最後給予小食') : '' }));
      if (i % 2 === 0) state.activities.push(mk({ petId: cat.id, date, type: 'enrichment', with: 'environment', minutes: 10 }));
      if (i % 7 === 3) state.activities.push(mk({ petId: cat.id, date, type: 'grooming', with: 'humans', minutes: 5 }));
    }

    // Moods (last 30 days)
    for (let i = 29; i >= 1; i--) {
      if (rnd() < 0.85) {
        const cm = i === 12 ? 2 : rnd() > 0.75 ? 3 : 4;
        state.moods.push(mk({ petId: cat.id, date: ago(i), mood: cm, note: i === 12 ? T('Workers in the flat, hid all day', '家中有工人，整天躲起來') : '' }));
      }
      if (rnd() < 0.85) state.moods.push(mk({ petId: dog.id, date: ago(i), mood: rnd() > 0.5 ? 5 : 4 }));
    }

    // Welfare checks
    const base = {
      cat: { n1: 4, n2: 4, n3: 2, n4: 3, e1: 5, e2: 5, e3: 4, e4: 5, e5: 4, h1: 4, h2: 3, h3: 3, h4: 4, h5: 5, b1: 4, b2: 4, b3: 3, b4: 4, b5: 4, m1: 4, m2: 4, m3: 3, m4: 4, m5: 4, m6: 4 },
      dog: { n1: 5, n2: 5, n3: 4, n4: 5, e1: 4, e2: 4, e3: 4, e4: 4, e5: 3, h1: 3, h2: 5, h3: 3, h4: 5, h5: 5, b1: 5, b2: 4, b3: 4, b4: 4, b5: 4, m1: 4, m2: 5, m3: 4, m4: 3, m5: 5, m6: 4 }
    };
    const vary = (r, delta) => { const o = {}; Object.keys(r).forEach((k) => { o[k] = Math.max(1, Math.min(5, r[k] + (rnd() < 0.35 ? delta : 0))); }); return o; };
    [[270, 1], [180, 1], [90, 0], [12, 0]].forEach(([d, delta], i) => {
      const r = i === 3 ? base.cat : vary(base.cat, delta);
      if (i < 2) { r.n3 = 3; }
      state.assessments.push(mk({ petId: cat.id, date: ago(d), ratings: r, notes: i === 3 ? T('Weight creeping up: more play, measured portions.', '體重慢慢上升：增加遊戲時間並定量餵食。') : '' }));
    });
    [[200, -1], [100, 0], [8, 0]].forEach(([d, delta], i) => {
      const r = i === 2 ? base.dog : vary(base.dog, delta);
      state.assessments.push(mk({ petId: dog.id, date: ago(d), ratings: r, notes: i === 2 ? T('Itchy again this month, otherwise happy and active.', '本月皮膚又再痕癢，其他方面開心活躍。') : '' }));
    });
  }

  /* ================= Toast ================= */
  let toastTimer = null;
  function toast(msg, kind = '') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2400);
  }

  /* ================= Init ================= */
  async function init() {
    const loaded = await Store.load();
    state = normalize(loaded);
    if (!loaded) save();
    renderChrome();
    window.addEventListener('hashchange', render);
    render();

    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const fn = actions[el.dataset.act];
      if (fn) { e.preventDefault(); fn(el, e); }
    });
    document.addEventListener('change', (e) => {
      const el = e.target.closest('[data-act-change]');
      if (!el) return;
      const fn = changeActions[el.dataset.actChange];
      if (fn) fn(el, e);
    });
    document.addEventListener('input', (e) => {
      if (!ui.draft) return;
      if (e.target.id === 'assess-notes') ui.draft.notes = e.target.value;
      if (e.target.id === 'assess-date') ui.draft.date = e.target.value;
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.sheet) closeSheet(); });

    ui.lastW = window.innerWidth;
    let rt = null;
    window.addEventListener('resize', () => {
      if (window.innerWidth === ui.lastW) return;
      ui.lastW = window.innerWidth;
      clearTimeout(rt);
      rt = setTimeout(mountCharts, 120);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && state) { clearTimeout(saveTimer); Store.write(JSON.parse(JSON.stringify(state))); }
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }

  init();
})();
