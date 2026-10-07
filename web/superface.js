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

function assign(src, tgt, size, spatialWeight = 2, iterations = 2000) {
  const n = size * size;
  const owner = new Int32Array(n);
  for (let i = 0; i < n; i++) owner[i] = i;

  const cost = (o, p) => {
    const dr = src[o * 3] - tgt[p * 3];
    const dg = src[o * 3 + 1] - tgt[p * 3 + 1];
    const db = src[o * 3 + 2] - tgt[p * 3 + 2];
    const dy = (Math.floor(o / size) - Math.floor(p / size)) / size;
    const dx = ((o % size) - (p % size)) / size;
    return dr * dr + dg * dg + db * db + spatialWeight * (dy * dy + dx * dx);
  };

  for (let i = 0; i < iterations; i++) {
    const radius = Math.max(1, Math.floor((size / 2) * (1 - i / iterations)));
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
        }
      }
    }
  }

  const dest = new Int32Array(n);
  for (let p = 0; p < n; p++) dest[owner[p]] = p;
  return dest;
}

function drawFrame(canvas, src, dest, size, t) {
  const scale = Math.max(1, Math.floor(512 / size));
  const w = size * scale;
  canvas.width = canvas.height = w;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(w, w);
  const buf = new Uint32Array(image.data.buffer);
  const e = t * t * (3 - 2 * t);
  const block = t > 0 && t < 1 ? scale + Math.ceil(scale / 2) : scale;
  for (let i = 0; i < size * size; i++) {
    const y0 = Math.floor(i / size);
    const x0 = i % size;
    const y1 = Math.floor(dest[i] / size);
    const x1 = dest[i] % size;
    const py = Math.round((y0 + (y1 - y0) * e) * scale);
    const px = Math.round((x0 + (x1 - x0) * e) * scale);
    const color =
      0xff000000 |
      (Math.round(src[i * 3 + 2] * 255) << 16) |
      (Math.round(src[i * 3 + 1] * 255) << 8) |
      Math.round(src[i * 3] * 255);
    for (let by = py; by < Math.min(w, py + block); by++) {
      for (let bx = px; bx < Math.min(w, px + block); bx++) buf[by * w + bx] = color;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function play(canvas, src, dest, size, duration = 2000) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    drawFrame(canvas, src, dest, size, t);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
