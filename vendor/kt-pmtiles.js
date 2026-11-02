/* Minimal PMTiles v3 reader for Kartalar's own tile archives, registered as the MapLibre protocol "kt://".
   Tile URL: kt://<archive>/{z}/{x}/{y}; archives live in tiles/<archive>.pmtiles. An archive name can map to
   several files by zoom (see KT_ARCHIVES). Directories and tiles may be gzip-compressed; HTTP range requests fetch
   only the header, the directories needed and each tile. */
(function () {
  const BASE = (window.KT_TILE_BASE || "tiles/");
  const ARCHIVES = window.KT_ARCHIVES || {};
  const cache = new Map();          // file -> Promise<archive>

  function zxyToId(z, x, y) {
    let acc = 0; for (let i = 0; i < z; i++) acc += 4 ** i;
    const n = 2 ** z; let d = 0;
    for (let s = n / 2; s >= 1; s /= 2) {
      const rx = (x & s) ? 1 : 0, ry = (y & s) ? 1 : 0;
      d += s * s * ((3 * rx) ^ ry);
      if (ry === 0) { if (rx === 1) { x = n - 1 - x; y = n - 1 - y; } const t = x; x = y; y = t; }
    }
    return acc + d;
  }
  async function range(url, off, len, signal) {
    const r = await fetch(url, { headers: { Range: `bytes=${off}-${off + len - 1}` }, signal });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    const b = await r.arrayBuffer();
    if (r.status === 200 && b.byteLength > len) return b.slice(off, off + len);   // server ignored the range
    return b;
  }
  async function gunzip(buf) {
    const ds = new DecompressionStream("gzip");
    return await new Response(new Blob([buf]).stream().pipeThrough(ds)).arrayBuffer();
  }
  const dec = (buf, c) => c === 2 ? gunzip(buf) : Promise.resolve(buf);
  function u64(dv, o) { return dv.getUint32(o, true) + dv.getUint32(o + 4, true) * 4294967296; }
  function readDir(buf) {
    const b = new Uint8Array(buf); let i = 0;
    const vi = () => { let v = 0, m = 1, c; do { c = b[i++]; v += (c & 0x7f) * m; m *= 128; } while (c & 0x80); return v; };
    const n = vi(), ids = new Array(n), runs = new Array(n), lens = new Array(n), offs = new Array(n);
    let last = 0;
    for (let k = 0; k < n; k++) { last += vi(); ids[k] = last; }
    for (let k = 0; k < n; k++) runs[k] = vi();
    for (let k = 0; k < n; k++) lens[k] = vi();
    for (let k = 0; k < n; k++) { const v = vi(); offs[k] = (v === 0 && k > 0) ? offs[k - 1] + lens[k - 1] : v - 1; }
    return { ids, runs, lens, offs };
  }
  function find(dir, id) {
    let lo = 0, hi = dir.ids.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (dir.ids[m] < id) lo = m + 1; else if (dir.ids[m] > id) hi = m - 1; else return m; }
    if (hi >= 0) { if (dir.runs[hi] === 0) return hi; if (id - dir.ids[hi] < dir.runs[hi]) return hi; }
    return -1;
  }
  function open(file) {
    if (cache.has(file)) return cache.get(file);
    const p = (async () => {
      const url = BASE + file;
      const head = await range(url, 0, 16384);
      const dv = new DataView(head);
      const h = { rootOff: u64(dv, 8), rootLen: u64(dv, 16), leafOff: u64(dv, 40), dataOff: u64(dv, 56),
                  ic: dv.getUint8(97), tc: dv.getUint8(98), type: dv.getUint8(99), url, leaves: new Map() };
      h.root = readDir(await dec(head.slice(h.rootOff, h.rootOff + h.rootLen), h.ic));
      return h;
    })();
    cache.set(file, p); p.catch(() => cache.delete(file));
    return p;
  }
  async function tile(file, z, x, y, signal) {
    const a = await open(file); const id = zxyToId(z, x, y);
    let dir = a.root;
    for (let depth = 0; depth < 4; depth++) {
      const k = find(dir, id); if (k < 0) return null;
      if (dir.runs[k] > 0) {
        const raw = await range(a.url, a.dataOff + dir.offs[k], dir.lens[k], signal);
        return await dec(raw, a.tc);
      }
      const key = dir.offs[k];
      if (!a.leaves.has(key)) a.leaves.set(key, range(a.url, a.leafOff + dir.offs[k], dir.lens[k]).then(b => dec(b, a.ic)).then(readDir));
      dir = await a.leaves.get(key);
    }
    return null;
  }
  /* Terrain above the archive's top zoom (KT_DEM_MAXZOOM, 11). MapLibre shades each DEM tile on its own and does not
     blend the shade across tile edges, so a z11 tile drawn at z13-17 (each terrain pixel 8-64 screen px wide) showed a
     hard step along every tile edge. Tiles from z12 up (the dem source's maxzoom in app.js) are made here from the
     z11 tile and its neighbours by a smooth cubic B-spline upsample, so the edges fall on small, smooth pixels and the
     steps go. Heights are scaled by 2^(0.3*(z-11)) to cancel MapLibre's zoom factor in the hillshade, so the shading
     keeps the z11 look. These tiles are only for the hillshade: never read heights from them. */
  const DEM_Z = window.KT_DEM_MAXZOOM || 11;
  const demCache = new Map();          // "file/x/y" -> Promise<Float32Array(256*256) | null>
  function canvas(w, h) {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
    const c = document.createElement("canvas"); c.width = w; c.height = h; return c;
  }
  function demPixels(file, x, y) {
    const key = file + "/" + x + "/" + y;
    if (demCache.has(key)) { const v = demCache.get(key); demCache.delete(key); demCache.set(key, v); return v; }
    const p = (async () => {
      const data = await tile(file, DEM_Z, x, y);
      if (!data) return null;
      const b = new Uint8Array(data);
      const type = b[0] === 0x52 && b[1] === 0x49 ? "image/webp" : b[0] === 0x89 ? "image/png" : "image/jpeg";
      const bmp = await createImageBitmap(new Blob([data], { type }), { premultiplyAlpha: "none", colorSpaceConversion: "none" });
      if (bmp.width !== 256 || bmp.height !== 256) throw new Error("terrain tiles must be 256 px");
      const g = canvas(256, 256).getContext("2d", { willReadFrequently: true });
      g.drawImage(bmp, 0, 0); bmp.close && bmp.close();
      const px = g.getImageData(0, 0, 256, 256).data, e = new Float32Array(65536);
      for (let i = 0, j = 0; i < 65536; i++, j += 4) e[i] = px[j] * 256 + px[j + 1] + px[j + 2] / 256 - 32768;
      return e;
    })();
    demCache.set(key, p); p.catch(() => demCache.delete(key));
    while (demCache.size > 64) demCache.delete(demCache.keys().next().value);
    return p;
  }
  function cubicW(t) {                 // cubic B-spline weights for samples at -1, 0, 1, 2 (smooth slopes: no creases)
    const t2 = t * t, t3 = t2 * t, u = 1 - t;
    return [u * u * u / 6, (3 * t3 - 6 * t2 + 4) / 6, (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, t3 / 6];
  }
  async function demTile(file, z, x, y) {
    const s = 2 ** (z - DEM_Z), px = Math.floor(x / s), py = Math.floor(y / s);
    const sub = 256 / s, ox = (x - px * s) * sub, oy = (y - py * s) * sub;
    const centre = await demPixels(file, px, py);
    if (!centre) return null;
    // the parent pixels this tile needs, with a 2 px margin from the neighbouring z11 tiles (edge pixels where none)
    const W = sub + 4, grid = new Float32Array(W * W), tiles = {};
    const need = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      if ((dx < 0 && ox > 0) || (dx > 0 && ox + sub < 256) || (dy < 0 && oy > 0) || (dy > 0 && oy + sub < 256)) continue;
      need.push(demPixels(file, px + dx, py + dy).catch(() => null).then(e => { tiles[dx + "," + dy] = e; }));
    }
    await Promise.all(need);
    for (let r = 0; r < W; r++) {
      const v = oy - 2 + r, ty = v < 0 ? -1 : v > 255 ? 1 : 0;
      for (let c = 0; c < W; c++) {
        const u = ox - 2 + c, tx = u < 0 ? -1 : u > 255 ? 1 : 0;
        const t = (tx || ty) ? tiles[tx + "," + ty] : centre;
        grid[r * W + c] = t ? t[(v - ty * 256) * 256 + (u - tx * 256)]
                            : centre[Math.min(255, Math.max(0, v)) * 256 + Math.min(255, Math.max(0, u))];
      }
    }
    const k = 2 ** (0.3 * (z - DEM_Z)), out = new Uint8ClampedArray(256 * 256 * 4);
    const cu = new Int32Array(256), wu = new Array(256);
    for (let i = 0; i < 256; i++) { const u = (i + 0.5) / s - 0.5 + 2, u0 = Math.floor(u); cu[i] = u0 - 1; wu[i] = cubicW(u - u0); }
    for (let j = 0; j < 256; j++) {
      const v = (j + 0.5) / s - 0.5 + 2, v0 = Math.floor(v), wv = cubicW(v - v0), r0 = (v0 - 1) * W;
      for (let i = 0; i < 256; i++) {
        const w = wu[i], c0 = cu[i]; let h = 0;
        for (let m = 0; m < 4; m++) {
          const o = r0 + m * W + c0;
          h += wv[m] * (w[0] * grid[o] + w[1] * grid[o + 1] + w[2] * grid[o + 2] + w[3] * grid[o + 3]);
        }
        const val = h * k + 32768, q = (j * 256 + i) * 4, f = Math.floor(val);
        out[q] = f >> 8; out[q + 1] = f & 255; out[q + 2] = Math.floor((val - f) * 256); out[q + 3] = 255;
      }
    }
    const cv = canvas(256, 256);
    cv.getContext("2d").putImageData(new ImageData(out, 256, 256), 0, 0);
    const blob = cv.convertToBlob ? await cv.convertToBlob({ type: "image/png" }) : await new Promise(res => cv.toBlob(res, "image/png"));
    return await blob.arrayBuffer();
  }
  window.ktTile = (file, z, x, y) => tile(file, z, x, y).then(d => d ? d.byteLength : null);   // for debugging
  maplibregl.addProtocol("kt", async (params, abort) => {
    const m = params.url.match(/^kt:\/\/([^/]+)\/(\d+)\/(\d+)\/(\d+)/);
    if (!m) throw new Error("bad kt url " + params.url);
    const name = m[1], z = +m[2], x = +m[3], y = +m[4];
    const pick = ARCHIVES[name]; const file = (typeof pick === "function" ? pick(z) : pick) || name + ".pmtiles";
    const data = name.startsWith("dem") && z > DEM_Z ? await demTile(file, z, x, y)
                                                     : await tile(file, z, x, y, abort && abort.signal);
    if (!data && name.startsWith("dem")) throw new Error("no terrain tile " + params.url);
    return { data: data ? new Uint8Array(data) : new Uint8Array(0) };
  });
})();
