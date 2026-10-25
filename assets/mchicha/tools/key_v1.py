# green-screen key + despill, then split each sheet into separate sprites by connected regions
import numpy as np, os, sys, json
from PIL import Image
from scipy import ndimage
os.makedirs("cut", exist_ok=True)
out = {}
for name in ["blink", "hats", "actions", "portraits", "sheetB", "sheetA"]:
    im = np.asarray(Image.open(f"src/{name}.jpg").convert("RGB")).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mx = np.maximum(r, b)
    green = g - mx                       # how much greener than the other channels
    a = np.clip(1 - (green - 40) / 70, 0, 1)   # >110 greener = fully transparent, <40 = opaque
    # despill: pull green down to the other channels where the key bled into the edges
    g2 = np.where(green > 0, np.minimum(g, mx + 6), g)
    rgba = np.dstack([r, g2, b, a * 255]).astype(np.uint8)
    mask = a > 0.5
    mask = ndimage.binary_opening(mask, iterations=1)
    lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=6))
    objs = ndimage.find_objects(lab)
    items = []
    for i, sl in enumerate(objs):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h * w < 4000: continue
        pad = 4
        y0, y1 = max(0, sl[0].start - pad), min(rgba.shape[0], sl[0].stop + pad)
        x0, x1 = max(0, sl[1].start - pad), min(rgba.shape[1], sl[1].stop + pad)
        crop = rgba[y0:y1, x0:x1].copy()
        # keep only this region (neighbours may poke into the box)
        keep = (lab[y0:y1, x0:x1] == i + 1)
        crop[..., 3] = np.where(keep, crop[..., 3], 0)
        items.append((y0, x0, crop))
    items.sort(key=lambda t: (round(t[0] / 120), t[1]))
    for k, (y, x, crop) in enumerate(items):
        Image.fromarray(crop).save(f"cut/{name}_{k:02d}.png")
    out[name] = len(items)
print(json.dumps(out))
