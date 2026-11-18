/* PetsDB — tiny dependency-free SVG charts (line, radar, bars). Works offline. */
window.Charts = (function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f1 = (n) => Math.round(n * 10) / 10;

  function niceStep(range, n) {
    if (!(range > 0)) return 1;
    const raw = range / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return step * mag;
  }

  /* ---------- Line chart ---------- */
  function line(el, cfg) {
    const W = Math.max(240, el.clientWidth || 320);
    const H = cfg.height || 200;
    const all = cfg.series.flatMap((s) => s.pts);
    if (!all.length) { el.innerHTML = `<div class="chart-empty">${esc(cfg.empty || '')}</div>`; return; }
    const m = { l: 42, r: 14, t: 14, b: 28 };
    let x0 = Math.min(...all.map((p) => p.x));
    let x1 = Math.max(...all.map((p) => p.x));
    if (x1 - x0 < 864e5 * 4) { x0 -= 864e5 * 7; x1 += 864e5 * 7; }

    const ys = all.map((p) => p.y);
    if (cfg.band) ys.push(cfg.band.lo, cfg.band.hi);
    let y0 = cfg.yMin != null ? cfg.yMin : Math.min(...ys);
    let y1 = cfg.yMax != null ? cfg.yMax : Math.max(...ys);
    let ticks;
    if (cfg.yTicks) {
      ticks = cfg.yTicks;
    } else {
      const span = (y1 - y0) || Math.max(0.5, Math.abs(y1) * 0.1);
      if (cfg.yMin == null) y0 -= span * 0.15;
      if (cfg.yMax == null) y1 += span * 0.15;
      if (cfg.nonNeg && y0 < 0) y0 = 0;
      const st = niceStep(y1 - y0, 4);
      if (cfg.yMin == null) y0 = Math.floor(y0 / st) * st;
      if (cfg.yMax == null) y1 = Math.ceil(y1 / st) * st;
      ticks = [];
      for (let v = y0; v <= y1 + st / 2; v += st) ticks.push(+v.toFixed(6));
    }
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (W - m.l - m.r);
    const Y = (y) => m.t + (1 - (y - y0) / (y1 - y0)) * (H - m.t - m.b);

    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(cfg.label || '')}">`;
    ticks.forEach((v) => {
      s += `<line class="ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${f1(Y(v))}" y2="${f1(Y(v))}"/>`;
      s += `<text class="ch-ylab" x="${m.l - 8}" y="${f1(Y(v))}" dy="0.35em" text-anchor="end">${esc(cfg.yFmt ? cfg.yFmt(v) : v)}</text>`;
    });
    if (cfg.band) {
      const top = Y(Math.min(cfg.band.hi, y1));
      const bot = Y(Math.max(cfg.band.lo, y0));
      if (bot > top) {
        s += `<rect class="ch-band" x="${m.l}" y="${f1(top)}" width="${W - m.l - m.r}" height="${f1(bot - top)}" rx="4"/>`;
        if (cfg.band.label) s += `<text class="ch-bandlab" x="${W - m.r - 6}" y="${f1(top + 13)}" text-anchor="end">${esc(cfg.band.label)}</text>`;
      }
    }
    const nx = clamp(Math.floor((W - m.l - m.r) / 84), 2, 6);
    for (let i = 0; i < nx; i++) {
      const x = x0 + ((x1 - x0) * i) / (nx - 1);
      s += `<text class="ch-xlab" x="${f1(X(x))}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === nx - 1 ? 'end' : 'middle'}">${esc(cfg.xFmt ? cfg.xFmt(x, x1 - x0) : '')}</text>`;
    }
    cfg.series.forEach((se, si) => {
      const ps = [...se.pts].sort((a, b) => a.x - b.x);
      if (!ps.length) return;
      const d = ps.map((p, i) => `${i ? 'L' : 'M'}${f1(X(p.x))},${f1(Y(p.y))}`).join('');
      if (se.area && ps.length > 1) {
        const gid = 'g' + si + Math.random().toString(36).slice(2, 7);
        s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.color}" stop-opacity="0.26"/><stop offset="1" stop-color="${se.color}" stop-opacity="0"/></linearGradient></defs>`;
        s += `<path d="${d}L${f1(X(ps[ps.length - 1].x))},${H - m.b}L${f1(X(ps[0].x))},${H - m.b}Z" fill="url(#${gid})"/>`;
      }
      if (ps.length > 1) s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"${se.dash ? ' stroke-dasharray="6 5"' : ''}/>`;
      if (se.dots !== false && ps.length <= 80) {
        ps.forEach((p) => { s += `<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="3.4" class="ch-dot" stroke="${se.color}"/>`; });
      }
    });
    s += `<g class="ch-hover" style="display:none"><line class="ch-cross" y1="${m.t}" y2="${H - m.b}"/><circle class="ch-hdot" r="5.5"/></g>`;
    s += `<rect class="ch-hit" x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent"/>`;
    s += `</svg><div class="ch-tip" hidden></div>`;
    el.innerHTML = s;

    // Tap / hover tooltip on the first series
    const prim = [...cfg.series[0].pts].sort((a, b) => a.x - b.x);
    const svg = el.querySelector('svg');
    const hov = svg.querySelector('.ch-hover');
    const tip = el.querySelector('.ch-tip');
    const cross = hov.querySelector('.ch-cross');
    const hdot = hov.querySelector('.ch-hdot');
    const show = (evt) => {
      const r = svg.getBoundingClientRect();
      const px = ((evt.clientX - r.left) / r.width) * W;
      let best = null; let bd = Infinity;
      prim.forEach((p) => { const dd = Math.abs(X(p.x) - px); if (dd < bd) { bd = dd; best = p; } });
      if (!best) return;
      hov.style.display = '';
      cross.setAttribute('x1', X(best.x)); cross.setAttribute('x2', X(best.x));
      hdot.setAttribute('cx', X(best.x)); hdot.setAttribute('cy', Y(best.y));
      hdot.setAttribute('fill', cfg.series[0].color);
      tip.hidden = false;
      tip.innerHTML = cfg.tipFmt ? cfg.tipFmt(best) : esc(best.y);
      tip.style.left = clamp((X(best.x) / W) * r.width, 60, r.width - 60) + 'px';
      tip.style.top = (Y(best.y) / H) * r.height + 'px';
    };
    const hide = () => { hov.style.display = 'none'; tip.hidden = true; };
    const hit = svg.querySelector('.ch-hit');
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
  }

  /* ---------- Radar (pentagon) chart ---------- */
  function radar(el, cfg) {
    const W = Math.max(160, el.clientWidth || 300);
    const H = cfg.height || 260;
    const n = cfg.values.length;
    const lab = cfg.labels && cfg.showLabels !== false;
    const cx = W / 2;
    const cy = H / 2 + (lab ? 6 : 0);
    const R = Math.max(30, Math.min(W / 2 - (lab ? 64 : 6), H / 2 - (lab ? 30 : 6)));
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const P = (i, v) => [cx + Math.cos(ang(i)) * R * (v / 100), cy + Math.sin(ang(i)) * R * (v / 100)];
    const pts = (vals) => vals.map((v, i) => P(i, v == null ? 0 : clamp(v, 0, 100)).map(f1).join(',')).join(' ');
    const idx = [...Array(n).keys()];

    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.label || '')}">`;
    [25, 50, 75, 100].forEach((v) => { s += `<polygon class="ch-ring${v === 50 ? ' mid' : ''}" points="${pts(idx.map(() => v))}"/>`; });
    idx.forEach((i) => { const [x, y] = P(i, 100); s += `<line class="ch-axis" x1="${cx}" y1="${cy}" x2="${f1(x)}" y2="${f1(y)}"/>`; });
    if (cfg.prev) s += `<polygon class="ch-prev" points="${pts(cfg.prev)}"/>`;
    s += `<polygon class="ch-area" points="${pts(cfg.values)}"/>`;
    idx.forEach((i) => {
      const v = cfg.values[i];
      const [x, y] = P(i, v == null ? 0 : v);
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${lab ? 5 : 3}" fill="${cfg.colors[i]}" class="ch-rdot"/>`;
    });
    if (lab) {
      idx.forEach((i) => {
        const a = ang(i);
        const x = cx + Math.cos(a) * (R + 14);
        const y = cy + Math.sin(a) * (R + 14);
        const c = Math.cos(a);
        const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
        const sin = Math.sin(a);
        const dy = sin < -0.6 ? -18 : sin > 0.6 ? 6 : -6;
        const v = cfg.values[i];
        s += `<text class="ch-rlab" x="${f1(x)}" y="${f1(y + dy)}" text-anchor="${anchor}">${esc(cfg.labels[i])}</text>`;
        s += `<text class="ch-rval" x="${f1(x)}" y="${f1(y + dy + 15)}" text-anchor="${anchor}" fill="${cfg.colors[i]}">${v == null ? '–' : v}</text>`;
      });
    }
    s += `</svg>`;
    el.innerHTML = s;
  }

  /* ---------- Bar chart ---------- */
  function bars(el, cfg) {
    const W = Math.max(240, el.clientWidth || 320);
    const H = cfg.height || 180;
    const m = { l: 36, r: 6, t: 16, b: 24 };
    const data = cfg.data;
    const max = Math.max(cfg.minMax || 10, ...data.map((d) => d.value));
    const st = niceStep(max, 3);
    const top = Math.ceil(max / st) * st;
    const n = data.length;
    const bw = (W - m.l - m.r) / n;
    const Y = (v) => m.t + (1 - v / top) * (H - m.t - m.b);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.label || '')}">`;
    for (let v = 0; v <= top + st / 2; v += st) {
      s += `<line class="ch-grid" x1="${m.l}" x2="${W - m.r}" y1="${f1(Y(v))}" y2="${f1(Y(v))}"/>`;
      s += `<text class="ch-ylab" x="${m.l - 6}" y="${f1(Y(v))}" dy="0.35em" text-anchor="end">${v}</text>`;
    }
    const every = Math.max(1, Math.ceil(30 / bw));
    data.forEach((d, i) => {
      const x = m.l + i * bw + bw * 0.16;
      const w = Math.max(2, bw * 0.68);
      if (d.value > 0) {
        const y = Y(d.value);
        s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(Y(0) - y)}" rx="${Math.min(4, w / 3)}" fill="${cfg.color}" opacity="${d.dim ? 0.45 : 1}"><title>${esc(d.title || '')}</title></rect>`;
        if (bw > 22) s += `<text class="ch-barval" x="${f1(x + w / 2)}" y="${f1(y - 4)}" text-anchor="middle">${d.value}</text>`;
      }
      if (i % every === (n - 1) % every) {
        s += `<text class="ch-xlab${d.strong ? ' strong' : ''}" x="${f1(x + w / 2)}" y="${H - 7}" text-anchor="middle">${esc(d.label)}</text>`;
      }
    });
    s += `</svg>`;
    el.innerHTML = s;
  }

  return { line, radar, bars };
})();
