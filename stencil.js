// Convierte una matriz de QR en un SVG apto para plantilla (stencil):
// las zonas oscuras son huecos de corte y se añaden "puentes" finos para que
// ninguna isla de material (p. ej. el anillo interior de los 3 cuadrados
// grandes) quede suelta al cortar.
const D = [[0, 1], [1, 0], [0, -1], [-1, 0]];

function buildStencil(isDark, n, opts = {}) {
  const sizeCm = opts.sizeCm || 40, bridge = opts.bridge || 0.3, Q = 2, K = 10;
  const M = n + 2 * Q, F = M * K;
  const dark = (r, c) => r >= Q && c >= Q && r < Q + n && c < Q + n && !!isDark(r - Q, c - Q);
  const inside = (y, x) => y >= 0 && x >= 0 && y < M && x < M;

  // 1. Componentes de material (módulos claros unidos por sus lados)
  const comp = Array.from({ length: M }, () => new Array(M).fill(-1));
  let nc = 0;
  for (let r = 0; r < M; r++) for (let c = 0; c < M; c++) {
    if (dark(r, c) || comp[r][c] >= 0) continue;
    const st = [[r, c]]; comp[r][c] = nc;
    while (st.length) {
      const [y, x] = st.pop();
      for (const [dy, dx] of D) {
        const yy = y + dy, xx = x + dx;
        if (inside(yy, xx) && !dark(yy, xx) && comp[yy][xx] < 0) { comp[yy][xx] = nc; st.push([yy, xx]); }
      }
    }
    nc++;
  }

  // 2. Puentes: une cada isla con el resto cruzando la franja oscura más corta
  const parent = Array.from({ length: nc }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const main = comp[0][0];
  const bridges = [];
  for (;;) {
    let best = null;
    for (let r = 0; r < M; r++) for (let c = 0; c < M; c++) {
      if (comp[r][c] < 0 || find(comp[r][c]) === find(main)) continue;
      for (const [dy, dx] of D) {
        let y = r + dy, x = c + dx, len = 0;
        while (inside(y, x) && dark(y, x)) { y += dy; x += dx; len++; }
        if (len > 0 && inside(y, x) && find(comp[y][x]) !== find(comp[r][c]) && (!best || len < best.len))
          best = { r, c, dy, dx, len, to: comp[y][x] };
      }
    }
    if (!best) break;
    parent[find(comp[best.r][best.c])] = find(best.to);
    bridges.push(best);
  }

  // 3. Rejilla fina (10 subdivisiones por módulo): huecos y puentes
  const hole = new Uint8Array(F * F);
  for (let r = 0; r < M; r++) for (let c = 0; c < M; c++) if (dark(r, c))
    for (let i = 0; i < K; i++) hole.fill(1, (r * K + i) * F + c * K, (r * K + i) * F + c * K + K);
  const bw = Math.max(1, Math.round(bridge * K)), off = Math.floor((K - bw) / 2);
  for (const b of bridges) {
    const r0 = b.r + b.dy, c0 = b.c + b.dx, r1 = b.r + b.dy * b.len, c1 = b.c + b.dx * b.len;
    const rmin = Math.min(r0, r1), rmax = Math.max(r0, r1), cmin = Math.min(c0, c1), cmax = Math.max(c0, c1);
    let y0, y1, x0, x1;
    if (b.dy === 0) { y0 = b.r * K + off; y1 = y0 + bw; x0 = cmin * K; x1 = (cmax + 1) * K; }
    else { x0 = b.c * K + off; x1 = x0 + bw; y0 = rmin * K; y1 = (rmax + 1) * K; }
    for (let y = y0; y < y1; y++) hole.fill(0, y * F + x0, y * F + x1);
  }

  // 4. Comprobación: todo el material debe quedar unido a la plancha exterior
  let total = 0;
  for (let i = 0; i < hole.length; i++) if (!hole[i]) total++;
  const seen = new Uint8Array(F * F), st = [0];
  seen[0] = 1; let reached = 0;
  while (st.length) {
    const p = st.pop(); reached++;
    const y = (p / F) | 0, x = p % F;
    for (const [dy, dx] of D) {
      const yy = y + dy, xx = x + dx;
      if (yy < 0 || xx < 0 || yy >= F || xx >= F) continue;
      const q = yy * F + xx;
      if (!hole[q] && !seen[q]) { seen[q] = 1; st.push(q); }
    }
  }
  const connected = reached === total;

  // 5. Contorno de los huecos como un solo trazado (sin solapes)
  const H = (x, y) => x >= 0 && y >= 0 && x < F && y < F && hole[y * F + x] === 1;
  const out = new Map();
  const add = (x1, y1, x2, y2) => {
    const k = x1 * (F + 1) + y1;
    if (!out.has(k)) out.set(k, []);
    out.get(k).push([x2, y2]);
  };
  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
    if (!hole[y * F + x]) continue;
    if (!H(x, y - 1)) add(x, y, x + 1, y);
    if (!H(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!H(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!H(x - 1, y)) add(x, y + 1, x, y);
  }
  let d = '';
  for (const [k, list] of out) {
    const sx = Math.floor(k / (F + 1)), sy = k % (F + 1);
    while (list.length) {
      let [nx, ny] = list.pop();
      const pts = [[sx, sy]];
      while (!(nx === sx && ny === sy)) {
        pts.push([nx, ny]);
        [nx, ny] = out.get(nx * (F + 1) + ny).pop();
      }
      const keep = pts.filter((p, i) => {
        const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
        return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0;
      });
      d += 'M' + keep.map((p) => p[0] / K + ' ' + p[1] / K).join('L') + 'Z';
    }
  }
  const W = ((sizeCm * M) / n).toFixed(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}cm" height="${W}cm" viewBox="0 0 ${M} ${M}">\n<title>QR para plantilla (stencil)</title>\n<path id="corte" fill="#000" fill-rule="evenodd" d="${d}"/>\n</svg>`;
  return { svg, modules: n, bridges: bridges.length, connected, hole, F };
}

module.exports = { buildStencil };
