import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
im = Image.open('src/LofotenNorwayUnsplas.jpg').convert('RGB')
W, H = 960, 640
a = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(np.float64) / 255
lum = a @ np.array([0.2126, 0.7152, 0.0722])
g = nd.gaussian_filter(lum, 1.2)
edge = nd.binary_dilation(np.hypot(nd.sobel(g, 1), nd.sobel(g, 0)) > 0.09, iterations=1)
lab, n = nd.label(~edge)
sky = nd.binary_fill_holes(lab == lab[5, 480])
sky = nd.binary_closing(sky, iterations=2)
# water polygon, drawn by eye in the 1400x933 view, scaled
pts = [(0, 612), (150, 628), (300, 642), (420, 640), (600, 640), (800, 640), (870, 655), (855, 668),
       (900, 672), (1100, 682), (1300, 688), (1400, 688), (1400, 742), (1250, 730), (1100, 748),
       (900, 768), (760, 762), (640, 728), (520, 703), (450, 690), (300, 652), (150, 628), (0, 612)]
sx, sy = W / 1400, H / 933
poly = Image.new('L', (W, H), 0)
ImageDraw.Draw(poly).polygon([(x * sx, y * sy) for x, y in pts], fill=255)
water = (np.asarray(poly) > 128) & ~sky
# refine: water is brighter than the dark hills; drop dark pixels near the polygon edge
water &= nd.gaussian_filter(lum, 1.5) > 0.26
water = nd.binary_opening(nd.binary_closing(water, iterations=3), iterations=1)
water = nd.binary_erosion(water, iterations=1)
# the moon and the evening star belong to the sky
yy, xx = np.mgrid[0:H, 0:W]
sky |= ((xx - 0.128 * W) ** 2 + (yy - 0.117 * H) ** 2) < 14 ** 2
sky |= ((xx - 0.537 * W) ** 2 + (yy - 0.40 * H) ** 2) < 6 ** 2
# borders: copy the nearest inner column/row so edges never read as 'land'
for arr in (sky, water):
    arr[:, :4] = arr[:, 4:5]; arr[:, -4:] = arr[:, -5:-4]; arr[:4, :] = arr[4:5, :]
out = np.zeros((H, W, 3), np.uint8)
out[..., 0] = (nd.gaussian_filter(sky.astype(float), 0.8) * 255).astype(np.uint8)
out[..., 1] = (nd.gaussian_filter(water.astype(float), 1.2) * 255).astype(np.uint8)
# blue channel: horizon distance helper (0 at horizon row, 1 at top)
Image.fromarray(out).save('mask_first_light.png')
viz = (a * 255).astype(np.uint8).copy()
viz[sky] = (viz[sky] * 0.5 + np.array([255, 0, 0]) * 0.5).astype(np.uint8)
viz[water] = (viz[water] * 0.4 + np.array([0, 255, 0]) * 0.6).astype(np.uint8)
Image.fromarray(viz).save('mask_viz.jpg')
print('horizon row (fraction):', 640 / 933)
