import argparse

from superface.core import animate, assign, load, render, save_gif, to_image

parser = argparse.ArgumentParser(prog="superface")
parser.add_argument("source")
parser.add_argument("target")
parser.add_argument("out")
parser.add_argument("--size", type=int, default=128)
parser.add_argument("--spatial", type=float, default=2.0)
parser.add_argument("--gif")
args = parser.parse_args()

source = load(args.source, args.size)
dest = assign(source, load(args.target, args.size), args.spatial)
to_image(render(source, dest)).save(args.out)
if args.gif:
    save_gif(animate(source, dest), args.gif)
