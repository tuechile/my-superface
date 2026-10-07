# my-superface

Turn any image into your face (or any other target) by rearranging its pixels. Inspired by [obamify](https://github.com/Spu7Nix/obamify).

No pixel is created or recolored. Every pixel in the source image is moved to a new position so that, together, they look like the target. You can also animate the pixels flying from where they started to where they end up.

## How it works

1. Load the source and target images and resize both to the same `N x N` grid.
2. Treat each image as a list of `N*N` pixels, each with a color and a position.
3. Find a one-to-one assignment from source pixels to target positions that minimizes
   `|color_src - color_tgt|^2 + spatial_weight * |pos_src - pos_tgt|^2`.
4. Build the output by putting each source pixel at its assigned target position.
5. Animate by replaying the swaps in order.

Step 3 is a linear assignment problem. The exact solver (Hungarian) took 25s at 64x64 and 4 min at 96x96, so we solve it approximately instead. Every pixel starts where it already is. Then we repeatedly look at pairs of neighboring pixels and swap them whenever that makes the picture closer to the target. Pixels only ever trade places with an adjacent pixel, so they move about 4px on average at 128x128.

Every swap is recorded, and the animation replays them in order, so you watch neighbors trade places until the face appears. Every frame is a full grid of the original pixels, so there are no gaps.

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

- [x] Neighbor-swap assignment (short pixel travel)
- [x] Gap-free animation that replays the swaps
- [x] CLI with gif export
- [x] Runs fully in the browser
- [ ] Face auto-crop on the target
- [ ] Fill the small gaps mid-animation
- [ ] Web Worker so big grids don't freeze the page
