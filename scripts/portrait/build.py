"""
Portrait of the "Created by" card, step 1: photo -> flat layers (binary masks, painted back to front).

    python scripts/portrait/build.py <photo> <workdir>     # needs pillow, numpy, scipy
    node scripts/portrait/trace.mjs <workdir> <person-id>  # step 2: masks -> src/lib/portraits/<person-id>.ts

Writes <workdir>/masks/*.png, layers.json, preview.png and side.png (photo | result: check the likeness there before tracing).
Silhouettes and shading planes come from the photo (luminance thresholds, blur + threshold to round them); the wall outline of the face,
the opening of the jacket and the eyes / brows / lips are shapes measured on the photo. ALL COORDINATES BELOW BELONG TO ONE PHOTO
(this one: Jackson): for another person, set CROP so the head sits like here and re-measure the shapes. See docs/design.md.
"""
import json, os, sys
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage as ndi

photo, out = sys.argv[1], sys.argv[2]
CROP = (50, 200, 910, 1275)  # box of the photo that becomes the 800x1000 work canvas
W, H = 800, 1000
E = lambda k, d: float(os.environ.get(k, d))
os.makedirs(out, exist_ok=True)
im = Image.open(photo).convert("RGB").crop(CROP).resize((W, H), Image.LANCZOS)
a = np.asarray(im).astype(float)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
L = 0.299 * R + 0.587 * G + 0.114 * B
yy, xx = np.mgrid[0:H, 0:W]
blur = ndi.gaussian_filter


def poly(pts):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 0


def smooth(m, s=3.0, t=0.5):
    return blur(m.astype(float), s) > t


def biggest(m, n=1):
    lab, k = ndi.label(m)
    if k == 0:
        return m
    sizes = ndi.sum(m, lab, range(1, k + 1))
    return np.isin(lab, np.argsort(sizes)[::-1][:n] + 1)


def drop_small(m, area):
    lab, k = ndi.label(m)
    if k == 0:
        return m
    sizes = ndi.sum(m, lab, range(1, k + 1))
    return np.isin(lab, np.nonzero(sizes >= area)[0] + 1)


L2, L4 = blur(L, 2), blur(L, 4)


def close(m, it):
    """binary closing that doesn't eat the mask at the image border"""
    p = np.pad(m, it + 2, mode="edge")
    return ndi.binary_closing(p, iterations=it)[it + 2:-(it + 2), it + 2:-(it + 2)]

# ---- hair
hair_zone = poly([(200, 462), (190, 110), (610, 110), (604, 250), (584, 300), (580, 350), (574, 400), (562, 440), (546, 462),
                  (538, 455), (543, 400), (545, 350), (540, 300), (531, 275), (516, 252), (495, 235), (400, 235), (288, 265), (268, 292), (254, 320), (249, 360),
                  (249, 400), (251, 440), (246, 462)])
hair = ((L2 < 50) | ((L2 < 85) & (yy < 215))) & hair_zone
hair = ndi.binary_fill_holes(close(hair, 4))
hair = smooth(biggest(hair), 3)
hair_light = smooth(drop_small(hair & (L4 > E("T_HAIRL", 40)) & ndi.binary_erosion(hair, iterations=5), 500), 3.5)

# ---- jacket and tee
opening = poly([(288, 546), (298, 572), (301, 600), (303, 640), (320, 665), (340, 702), (352, 737), (362, 770), (372, 810), (382, 870),
                (392, 850), (410, 820), (440, 800), (470, 790), (472, 742), (456, 702), (490, 645), (499, 600), (503, 570), (508, 545),
                (400, 500)])
above_right = poly([(508, 545), (540, 566), (600, 592), (700, 645), (760, 690), (800, 760), (800, 400), (508, 400)])  # wall shadow
jacket = ((L2 < 70) & (xx < 330) | (L2 < 50) & (xx >= 330)) & (yy > 525) & ~opening & ~above_right
jacket = ndi.binary_fill_holes(close(jacket, 5))
jacket = smooth(biggest(jacket, 2), 3)
jacket_light = biggest(smooth(jacket & (blur(L, 16) > E("T_JL", 30)), 9), 1)
jacket_dark = smooth(ndi.binary_dilation(opening, iterations=13) & jacket & (xx > 420), 2.5)
tee = smooth((L2 > 105) & poly([(345, 726), (400, 742), (460, 718), (478, 745), (476, 800), (430, 812), (395, 870), (370, 870), (350, 760)]), 2.5)

# ---- skin (face, ears, neck)
skin = poly([(250, 430), (240, 300), (300, 180), (500, 180), (560, 300), (549, 430), (552, 455), (550, 480), (543, 505), (531, 528),
             (516, 545), (505, 556), (500, 800), (300, 800), (290, 556), (282, 546), (270, 528), (262, 505), (258, 482), (252, 468),
             (248, 450)])
skin = smooth(skin, 3)
face = skin & ~hair & ~jacket & ~tee

# shading planes: real light, partly flattened so the lit side doesn't wash out and the far side doesn't go all dark
Ls = blur(L, 5)
big = blur(np.where(face, L, np.nan_to_num(L[face].mean())), 60)
Lf = Ls - E("FLAT", 0.45) * (big - L[face].mean())
ratio = blur(L, 1.5) / (blur(L, 22) + 1)
ratio4 = blur(L, 4) / (blur(L, 30) + 1)
shade = drop_small(smooth(face & ((Lf < E("T_SHADE", 100)) | (ratio4 < E("R_SHADE", 0.80)) & (yy > 300) & (yy < 560)), 4.5), 200)
deep_shade = drop_small(smooth(face & (Lf < E("T_DEEP", 66)), 4.5), 500)
light = smooth(drop_small(face & (Lf > E("T_LIGHT", 160)), 300), 4)

# ---- features: darkness relative to the surrounding skin (independent of the side lighting)
inner = ndi.binary_erosion(skin & ~ndi.binary_dilation(hair, iterations=5) & ~ndi.binary_dilation(jacket, iterations=6), iterations=3)
z = lambda x0, y0, x1, y1: (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
nostrils = (ratio < E("R_NOSE", 0.55)) & z(345, 410, 455, 458)
feat = smooth(drop_small(nostrils & inner, 40), 1.5)
feat = drop_small(feat, 80)


def spline(pts, closed=True, n=12):
    """Catmull-Rom through the control points -> dense polyline."""
    P = np.array(pts, float)
    k = len(P)
    res = []
    rng = range(k) if closed else range(k - 1)
    for i in rng:
        p0 = P[(i - 1) % k] if closed or i > 0 else P[i]
        p1, p2 = P[i], P[(i + 1) % k]
        p3 = P[(i + 2) % k] if closed or i + 2 < k else P[i + 1]
        for t in np.linspace(0, 1, n, endpoint=False):
            res.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    if not closed:
        res.append(P[-1])
    return [tuple(p) for p in res]


SS = 4  # supersample hand shapes


def shape(pts):
    m = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(m).polygon([(x * SS, y * SS) for x, y in spline(pts)], fill=255)
    return np.asarray(m.resize((W, H), Image.LANCZOS)) > 127


def stroke(pts, w0, w1=None):
    """Open curve drawn as a tapered band: width w0 in the middle, w1 at the ends."""
    w1 = w0 if w1 is None else w1
    c = np.array(spline(pts, closed=False))
    d = np.gradient(c, axis=0)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
    t = np.linspace(0, 1, len(c))
    w = (w1 + (w0 - w1) * np.sin(np.pi * t) ** 0.7)[:, None] / 2
    ring = np.concatenate([c + nrm * w, (c - nrm * w)[::-1]])
    m = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(m).polygon([(x * SS, y * SS) for x, y in ring], fill=255)
    return np.asarray(m.resize((W, H), Image.LANCZOS)) > 127


def circle(cx, cy, r):
    return (xx - cx) ** 2 + (yy - cy) ** 2 < r * r


# left eye (viewer's left)
lashL = [(300.5, 361.5), (309, 355.5), (320, 351.5), (337, 350.2), (353, 353.2), (365, 361)]
lowL = [(350, 366), (334, 368), (317, 366.5)]
whiteL = shape(lashL + lowL)
irisL = circle(335, 357.5, 10.5) & whiteL
lidL = stroke(lashL, 7, 2.5)
creaseL = stroke([(302, 354), (315, 344), (331.5, 340.5), (348, 345), (361.5, 357)], 2.6, 1.2)
browL = shape([(297, 325), (304, 316), (317, 310), (335, 307.5), (355, 308.5), (372, 314), (371, 323.5), (355, 320.5), (336, 319.5), (318, 320.5), (306, 324)])
# right eye
lashR = [(437, 361), (444, 355), (455, 351), (471.5, 349.6), (488, 352.8), (503, 362)]
lowR = [(490, 367.5), (470, 368.5), (453, 366)]
whiteR = shape(lashR + lowR)
irisR = circle(467, 357.2, 11) & whiteR
lidR = stroke(lashR, 7, 2.5)
creaseR = stroke([(440.5, 352.5), (453, 342.5), (470, 338.8), (487, 342.5), (501.5, 351.5)], 2.6, 1.2)
browR = shape([(427, 312), (442, 308), (459, 306.5), (480, 308), (500, 312.5), (517, 324), (508, 323.5), (490, 320.5), (467, 320), (446, 321.5), (428, 322)])
whites = whiteL | whiteR
upper_lip = shape([(345, 503.5), (360, 494), (378, 487.5), (391, 485.5), (400, 488.5), (410, 485.5), (424, 488), (442, 495), (457, 503.5), (430, 504.5), (400, 506.5), (370, 504.5)])
drawn = irisL | irisR | lidL | lidR | browL | browR | upper_lip
creases = creaseL | creaseR
lower_lip = shape([(352, 503), (372, 505), (400, 507), (430, 505), (451, 503), (444, 516), (426, 526.5), (400, 529.5), (376, 526.5), (359, 516)])
jaw = stroke([(284, 549), (300, 572), (325, 589), (356, 598), (392, 602)], 13, 2) & skin

layers = [
    ("skin", skin, "skin"),
    ("shade", shade & skin, "skinShade"),
    ("deepShade", deep_shade & skin, "skinDeep"),
    ("jaw", jaw, "skinShade"),
    ("light", light & skin & ~jaw, "skinLight"),
    ("lowerLip", lower_lip, "skinDeep"),
    ("eyeWhite", whites, "eye"),
    ("crease", creases, "skinDeep"),
    ("features", feat | drawn, "deep"),
    ("jacket", jacket, "jacket"),
    ("jacketLight", jacket_light & jacket, "jacketLight"),
    ("jacketDark", jacket_dark & jacket, "deep"),
    ("tee", tee, "shirt"),
    ("hair", hair, "deep"),
    ("hairLight", hair_light & hair, "hairLight"),
]
# preview colours only: the real ones are THEME.portrait (src/lib/themes.ts)
PAL = {"bg": "#DADADA", "skin": "#6A9FD6", "skinShade": "#4A86D8", "skinDeep": "#3674CF", "skinLight": "#86B2E6", "deep": "#0D47A8",
       "hairLight": "#1F5FC4", "jacket": "#1F5FC4", "jacketLight": "#2F6FCB", "shirt": "#C6C9D3", "eye": "#93BBEA"}
hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
canvas = np.zeros((H, W, 3), np.uint8)
canvas[:] = hexrgb(PAL["bg"])
os.makedirs(out + "/masks", exist_ok=True)
for name, m, tok in layers:
    canvas[m] = hexrgb(PAL[tok])
    Image.fromarray(np.where(m, 0, 255).astype(np.uint8)).save(f"{out}/masks/{name}.png")
json.dump([[n, t] for n, _, t in layers], open(out + "/layers.json", "w"))
VY = 60  # final square window: x 0..800, y VY..VY+800
prev = Image.fromarray(canvas).crop((0, VY, 800, VY + 800))
prev.save(out + "/preview.png")
side = Image.new("RGB", (1600, 800))
side.paste(im.crop((0, VY, 800, VY + 800)), (0, 0))
side.paste(prev, (800, 0))
side.save(out + "/side.png")
