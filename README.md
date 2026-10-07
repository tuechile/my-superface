# my-superface

Turn any image into your face (or any other target) by rearranging its pixels. Inspired by [obamify](https://github.com/Spu7Nix/obamify).

No pixel is created or recolored. Every pixel in the source image is moved to a new position so that, together, they look like the target. You can also animate the pixels flying from where they started to where they end up.

## How it works

1. Load the source and target images and resize both to the same `N x N` grid.
2. Treat each image as a list of `N*N` pixels, each with a color and a position.
3. Find a one-to-one assignment from source pixels to target positions that minimizes
   `|color_src - color_tgt|^2 + spatial_weight * |pos_src - pos_tgt|^2`.
4. Build the output by putting each source pixel at its assigned target position.
5. Optionally animate by interpolating every pixel from its start to its end position.

Step 3 is a linear assignment problem. The exact solver (Hungarian) took 25s at 64x64 and 4 min at 96x96, so we solve it approximately instead. Every pixel starts where it already is. Then we repeatedly pick pairs of nearby spots and swap the pixels on them whenever that lowers the cost. The search radius shrinks from half the image down to 1px. With the default `spatial_weight=2`, pixels move about 5% of the image width on average, so the animation stays subtle, like obamify.

## Try it

Everything runs in your browser, with no server and no uploads. Serve the repo locally (opening the file directly can't load the default face):

```bash
python3 -m http.server 8001
```

Then open http://localhost:8001/web/, pick a source image and click Transform. It morphs into `web/face.jpg` by default; open "change face" to use a different target. Sample images are in `samples/`.

Options: Size (grid size, default 128, max 256) and Spatial weight (how strongly pixels stay near where they started, default 2; lower gives a sharper target but longer travel).

## Deploy

`.github/workflows/pages.yml` publishes `web/` to GitHub Pages on every push to `main`. In the repo on GitHub, set Settings → Pages → Source to "GitHub Actions" once.

## Python version

`superface/` is the same algorithm in numpy, for experiments and gif export:

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install -e ".[dev]"
```

```bash
.venv/bin/python -m superface samples/textured.png samples/smiley.png out.png --gif out.gif
```

## Layout

```
web/
  index.html    page
  face.jpg      default target (square crop)
  superface.js  load, assign, animate (the app)
superface/
  core.py       numpy version of the same algorithm
  __main__.py   CLI
samples/        demo images
tests/          Python tests
.github/workflows/pages.yml
```

## Roadmap

- [x] Local swap assignment (short pixel travel)
- [x] CLI with gif export
- [x] Runs fully in the browser
- [ ] Face auto-crop on the target
- [ ] Fill the small gaps mid-animation
- [ ] Web Worker so big grids don't freeze the page
