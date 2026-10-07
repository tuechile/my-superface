import numpy as np

from superface.core import animate, assign, grid, render


def total_cost(source, target, dest, w=2.0):
    pos = grid(source.shape[0])
    return ((source.reshape(-1, 3) - target.reshape(-1, 3)[dest]) ** 2).sum() + w * ((pos - pos[dest]) ** 2).sum()


def test_assign_is_permutation():
    rng = np.random.default_rng(0)
    source = rng.random((16, 16, 3), dtype=np.float32)
    target = rng.random((16, 16, 3), dtype=np.float32)
    dest = assign(source, target)
    assert np.array_equal(np.sort(dest), np.arange(256))


def test_render_keeps_source_pixels():
    rng = np.random.default_rng(0)
    source = rng.random((16, 16, 3), dtype=np.float32)
    out = render(source, assign(source, rng.random((16, 16, 3), dtype=np.float32)))
    assert np.array_equal(np.sort(out.reshape(-1, 3), 0), np.sort(source.reshape(-1, 3), 0))


def test_swaps_reduce_cost():
    rng = np.random.default_rng(0)
    source = rng.random((16, 16, 3), dtype=np.float32)
    target = rng.random((16, 16, 3), dtype=np.float32)
    assert total_cost(source, target, assign(source, target)) < total_cost(source, target, assign(source, target, iterations=0))


def test_identical_images_stay_put():
    source = np.random.default_rng(1).random((16, 16, 3), dtype=np.float32)
    assert np.array_equal(assign(source, source), np.arange(256))


def test_animate_frame_count():
    source = np.zeros((4, 4, 3), np.float32)
    assert len(animate(source, np.arange(16), frames=10)) == 15
