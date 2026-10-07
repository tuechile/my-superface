import numpy as np
from PIL import Image


def load(file, size):
    img = Image.open(file).convert("RGB")
    w, h = img.size
    s = min(w, h)
    box = ((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)
    img = img.crop(box).resize((size, size), Image.LANCZOS)
    return np.asarray(img, dtype=np.float32) / 255


def grid(size):
    ys, xs = np.mgrid[0:size, 0:size]
    return np.stack([ys.ravel(), xs.ravel()], 1).astype(np.float32) / size


def assign(source, target, spatial_weight=2.0, iterations=2000, seed=0):
    rng = np.random.default_rng(seed)
    size = source.shape[0]
    n = size * size
    src = source.reshape(-1, 3)
    tgt = target.reshape(-1, 3)
    pos = grid(size)
    owner = np.arange(n)
    idx = owner.reshape(size, size)
    ys, xs = np.mgrid[0:size, 0:size]

    def cost(o, p):
        return ((src[o] - tgt[p]) ** 2).sum(1) + spatial_weight * ((pos[o] - pos[p]) ** 2).sum(1)

    for i in range(iterations):
        radius = max(1, int(size / 2 * (1 - i / iterations)))
        dy = rng.integers(1, radius + 1)
        dx = rng.integers(-radius, radius + 1)
        phase = rng.integers(0, 2 * dy)
        view = idx.T if rng.random() < 0.5 else idx
        mask = ((ys + phase) // dy % 2 == 0) & (ys + dy < size) & (xs + dx >= 0) & (xs + dx < size)
        ay, ax = ys[mask], xs[mask]
        pa, pb = view[ay, ax], view[ay + dy, ax + dx]
        oa, ob = owner[pa], owner[pb]
        better = cost(oa, pb) + cost(ob, pa) < cost(oa, pa) + cost(ob, pb)
        owner[pa[better]], owner[pb[better]] = ob[better], oa[better]

    dest = np.empty(n, np.int64)
    dest[owner] = np.arange(n)
    return dest


def render(source, dest):
    size = source.shape[0]
    src = source.reshape(-1, 3)
    out = np.empty_like(src)
    out[dest] = src
    return out.reshape(size, size, 3)


def animate(source, dest, frames=40):
    size = source.shape[0]
    scale = max(1, 512 // size)
    colors = (source.reshape(-1, 3) * 255).astype(np.uint8)
    start = grid(size) * size
    end = start[dest]
    images = []
    for t in np.linspace(0, 1, frames):
        e = t * t * (3 - 2 * t)
        p = np.rint((start + (end - start) * e) * scale).astype(int)
        canvas = np.zeros((size * scale, size * scale, 3), np.uint8)
        for dy in range(scale):
            for dx in range(scale):
                canvas[p[:, 0] + dy, p[:, 1] + dx] = colors
        images.append(Image.fromarray(canvas))
    return images + [images[-1]] * (frames // 2)


def to_image(arr):
    scale = max(1, 512 // arr.shape[0])
    img = Image.fromarray((arr * 255).astype(np.uint8))
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def save_gif(images, file, duration=40):
    images[0].save(file, format="GIF", save_all=True, append_images=images[1:], duration=duration, loop=0)
