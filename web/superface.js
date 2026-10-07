async function loadPixels(file, size) {
  const img = await createImageBitmap(file);
  const s = Math.min(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const out = new Float32Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    out[i * 3] = data[i * 4] / 255;
    out[i * 3 + 1] = data[i * 4 + 1] / 255;
    out[i * 3 + 2] = data[i * 4 + 2] / 255;
  }
  return out;
}

function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function assign(src, tgt, size, spatialWeight = 2, iterations = 1000, radius = 1) {
  const n = size * size;
  const owner = new Int32Array(n);
  for (let i = 0; i < n; i++) owner[i] = i;
  const swaps = [];

  const cost = (o, p) => {
    const dr = src[o * 3] - tgt[p * 3];
    const dg = src[o * 3 + 1] - tgt[p * 3 + 1];
    const db = src[o * 3 + 2] - tgt[p * 3 + 2];
    const dy = (Math.floor(o / size) - Math.floor(p / size)) / size;
    const dx = ((o % size) - (p % size)) / size;
    return dr * dr + dg * dg + db * db + spatialWeight * (dy * dy + dx * dx);
  };

  for (let i = 0; i < iterations; i++) {
    const dy = randInt(1, radius);
    const dx = randInt(-radius, radius);
    const phase = randInt(0, 2 * dy - 1);
    const transpose = Math.random() < 0.5;
    for (let y = 0; y + dy < size; y++) {
      if (Math.floor((y + phase) / dy) % 2) continue;
      for (let x = Math.max(0, -dx); x < Math.min(size, size - dx); x++) {
        const pa = transpose ? x * size + y : y * size + x;
        const pb = transpose ? (x + dx) * size + y + dy : (y + dy) * size + x + dx;
        const oa = owner[pa];
        const ob = owner[pb];
        if (cost(oa, pb) + cost(ob, pa) < cost(oa, pa) + cost(ob, pb)) {
          owner[pa] = ob;
          owner[pb] = oa;
          swaps.push(pa, pb);
        }
      }
    }
  }

  return { owner, swaps };
}

function colors(src) {
  const out = new Uint32Array(src.length / 3);
  for (let i = 0; i < out.length; i++) {
    out[i] =
      0xff000000 |
      (Math.round(src[i * 3 + 2] * 255) << 16) |
      (Math.round(src[i * 3 + 1] * 255) << 8) |
      Math.round(src[i * 3] * 255);
  }
  return out;
}

function drawFrame(canvas, palette, owner, size) {
  const scale = Math.max(1, Math.floor(512 / size));
  const w = size * scale;
  if (canvas.width !== w) canvas.width = canvas.height = w;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(w, w);
  const buf = new Uint32Array(image.data.buffer);
  for (let p = 0; p < size * size; p++) {
    const color = palette[owner[p]];
    const y0 = Math.floor(p / size) * scale;
    const x0 = (p % size) * scale;
    for (let y = y0; y < y0 + scale; y++) buf.fill(color, y * w + x0, y * w + x0 + scale);
  }
  ctx.putImageData(image, 0, 0);
}

function play(canvas, palette, swaps, size, duration = 2500) {
  const owner = new Int32Array(size * size);
  for (let i = 0; i < owner.length; i++) owner[i] = i;
  const total = swaps.length / 2;
  let applied = 0;
  const id = (play.id = (play.id || 0) + 1);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const target = Math.round(t * t * (3 - 2 * t) * total);
    for (; applied < target; applied++) {
      const pa = swaps[applied * 2];
      const pb = swaps[applied * 2 + 1];
      const o = owner[pa];
      owner[pa] = owner[pb];
      owner[pb] = o;
    }
    drawFrame(canvas, palette, owner, size);
    if (t < 1 && play.id === id) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
