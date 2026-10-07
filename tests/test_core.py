import numpy as np

from superface.core import animate, assign, grid, render


def total_cost(source, target, owner, w=2.0):
    pos = grid(source.shape[0])
    return ((source.reshape(-1, 3)[owner] - target.reshape(-1, 3)) ** 2).sum() + w * ((pos[owner] - pos) ** 2).sum()


def pair(seed=0):
    rng = np.random.default_rng(seed)
    return rng.random((16, 16, 3), dtype=np.float32), rng.random((16, 16, 3), dtype=np.float32)


def test_assign_is_permutation():
    owner, _ = assign(*pair())
    assert np.array_equal(np.sort(owner), np.arange(256))


def test_render_keeps_source_pixels():
    source, target = pair()
    out = render(source, assign(source, target)[0])
    assert np.array_equal(np.sort(out.reshape(-1, 3), 0), np.sort(source.reshape(-1, 3), 0))


def test_swaps_reduce_cost():
    source, target = pair()
    owner, _ = assign(source, target)
    assert total_cost(source, target, owner) < total_cost(source, target, np.arange(256))


def test_identical_images_stay_put():
    source, _ = pair(1)
    owner, swaps = assign(source, source)
    assert np.array_equal(owner, np.arange(256))
    assert sum(len(pa) for pa, _ in swaps) == 0


def test_swaps_are_between_neighbors():
    _, swaps = assign(*pair())
    for pa, pb in swaps:
        assert (np.abs(pa // 16 - pb // 16) <= 1).all() and (np.abs(pa % 16 - pb % 16) <= 1).all()


def test_animation_ends_on_result():
    source, target = pair()
    owner, swaps = assign(source, target)
    frames = animate(source, swaps, frames=10)
    assert len(frames) == 15
    final = np.asarray(frames[9]).reshape(16, 32, 16, 32, 3)[:, 0, :, 0]
    assert np.array_equal(final, (render(source, owner) * 255).astype(np.uint8))
