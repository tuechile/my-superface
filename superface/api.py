import base64
import io
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from superface.core import animate, assign, load, render, save_gif, to_image

INDEX = Path(__file__).parent.parent / "web" / "index.html"
MAX_SIZE = 256

app = FastAPI()


def data_url(write, mime):
    buf = io.BytesIO()
    write(buf)
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()


@app.get("/")
def index():
    return FileResponse(INDEX)


@app.post("/transform")
def transform(
    source: Annotated[UploadFile, File()],
    target: Annotated[UploadFile, File()],
    size: Annotated[int, Form()] = 128,
    spatial: Annotated[float, Form()] = 2.0,
):
    if not 8 <= size <= MAX_SIZE:
        raise HTTPException(400, f"size must be between 8 and {MAX_SIZE}")
    src = load(source.file, size)
    dest = assign(src, load(target.file, size), spatial)
    return {
        "image": data_url(lambda b: to_image(render(src, dest)).save(b, format="PNG"), "image/png"),
        "animation": data_url(lambda b: save_gif(animate(src, dest), b), "image/gif"),
    }
