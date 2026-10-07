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

## Stack

- Python 3.11+
- numpy, pillow for the core
- FastAPI + uvicorn for the API
- A single static HTML page for the frontend

## Setup

```bash
python3 -m venv .venv
```

```bash
source .venv/bin/activate
```

```bash
pip install -e ".[dev]"
```

## Run

Command line:

```bash
.venv/bin/python -m superface samples/gradient.png samples/smiley.png out.png --gif out.gif
```

Web demo, then open http://localhost:8000 (add `--port 8001` if 8000 is taken):

```bash
.venv/bin/uvicorn superface.api:app --reload
```

Options: `--size` (grid size, default 128, max 256 in the web demo) and `--spatial` (how strongly pixels stay near where they started, default 2; lower means a sharper target but longer travel).

## Layout

```
superface/
  core.py      load, assign, render, animate
  __main__.py  CLI
  api.py       FastAPI app, serves web/index.html
web/
  index.html   upload source + target, show result
samples/       demo images
tests/
```

## Roadmap

- [x] Local swap assignment (short pixel travel)
- [x] CLI with gif export
- [x] API endpoint + simple web page
- [ ] Face auto-crop on the target
- [ ] mp4 export / smoother animation
- [ ] Faster solver for 256+ grids
