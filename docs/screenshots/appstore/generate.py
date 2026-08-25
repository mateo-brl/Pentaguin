#!/usr/bin/env python3
"""Captures App Store Pentaguin.

Tout est tracé UNE fois à la résolution finale (1290x2796) : aucun
redimensionnement, donc aucun flou. Chaque carte est dimensionnée à partir du
texte réellement mesuré, jamais sur une hauteur devinée.
"""
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = "/home/user/orca/projects/Pentaguin"
OUT = "/tmp/shots/out"
os.makedirs(OUT, exist_ok=True)

AW, AH = 1290, 2796            # valeurs par défaut, réécrites par SIZES
DW = 995                       # largeur de l'écran d'app, en pixels finaux
DX, DY = (AW - DW) // 2, 618
SC = DW / 393.0                # points logiques -> pixels finaux
CW, CH = 393.0, 852.0          # iPhone en points

C = dict(bg="#0C0E1A", card="#14192C", card2="#1A2038", line="#29344F",
         txt="#EAF0FB", dim="#8695AE", dim2="#6E7C94",
         amber="#FBBE4B", amberSoft="#33270D", amberDark="#C08A22",
         mint="#2DE0A6", mintSoft="#0E2A22", ember="#EF9330",
         red="#E4655F", term="#05080F", onAmber="#14100A")

def hx(name, a=255):
    v = C.get(name, name).lstrip("#")
    return (int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16), a)

def mix(fg, bg, t):
    """Couleur opaque = `fg` posé à `t` sur `bg`. ImageDraw n'alpha-compose pas :
    on pré-mélange plutôt que de dessiner en semi-transparent."""
    f, b = hx(fg), hx(bg)
    return tuple(round(f[i] * t + b[i] * (1 - t)) for i in range(3)) + (255,)

FONTS = {"reg": "HankenGrotesk-Regular", "med": "HankenGrotesk-Medium",
         "semi": "HankenGrotesk-SemiBold", "bold": "HankenGrotesk-Bold",
         "mono": "JetBrainsMono-Regular", "monob": "JetBrainsMono-Bold"}
_fc = {}
def font(name, pt):
    """Police à une taille exprimée en points logiques (convertie en pixels)."""
    key = (name, round(pt * SC))
    if key not in _fc:
        _fc[key] = ImageFont.truetype(f"{ROOT}/assets/fonts/{FONTS[name]}.ttf", max(1, int(round(pt * SC))))
    return _fc[key]

# --- repère : on dessine en points, la conversion est centralisée -------------
class Pen:
    def __init__(self, img, ox, oy):
        self.img = img
        self.d = ImageDraw.Draw(img)
        self.ox, self.oy = ox, oy
    def X(self, x): return self.ox + x * SC
    def Y(self, y): return self.oy + y * SC
    def rr(self, box, r, fill=None, outline=None, w=1):
        self.d.rounded_rectangle([self.X(box[0]), self.Y(box[1]), self.X(box[2]), self.Y(box[3])],
                                 radius=r * SC, fill=fill, outline=outline, width=max(1, round(w * SC)))
    def ell(self, box, fill=None, outline=None, w=1):
        self.d.ellipse([self.X(box[0]), self.Y(box[1]), self.X(box[2]), self.Y(box[3])],
                       fill=fill, outline=outline, width=max(1, round(w * SC)))
    def arc(self, box, a0, a1, fill, w):
        self.d.arc([self.X(box[0]), self.Y(box[1]), self.X(box[2]), self.Y(box[3])], a0, a1,
                   fill=fill, width=max(1, round(w * SC)))
    def line(self, pts, fill, w=1):
        self.d.line([c for x, y in pts for c in (self.X(x), self.Y(y))], fill=fill,
                    width=max(1, round(w * SC)))
    def poly(self, pts, fill):
        self.d.polygon([c for x, y in pts for c in (self.X(x), self.Y(y))], fill=fill)
    def text(self, xy, s, f, pt, fill, anchor="la", ls=0):
        fnt = font(f, pt)
        x, y = self.X(xy[0]), self.Y(xy[1])
        if ls:
            gap = ls * SC
            w = sum(self.d.textlength(ch, font=fnt) + gap for ch in s) - gap
            if anchor[0] == "m": x -= w / 2
            elif anchor[0] == "r": x -= w
            for ch in s:
                self.d.text((x, y), ch, font=fnt, fill=fill, anchor="l" + anchor[1])
                x += self.d.textlength(ch, font=fnt) + gap
        else:
            self.d.text((x, y), s, font=fnt, fill=fill, anchor=anchor)
    def tw(self, s, f, pt):
        return self.d.textlength(s, font=font(f, pt)) / SC

def wrap(pen, s, f, pt, maxw):
    out, cur = [], ""
    for word in s.split():
        trial = (cur + " " + word).strip()
        if pen.tw(trial, f, pt) <= maxw:
            cur = trial
        else:
            if cur: out.append(cur)
            cur = word
    if cur: out.append(cur)
    return out

def para(pen, xy, s, f, pt, fill, maxw, lh, anchor="la"):
    x, y = xy
    for line in wrap(pen, s, f, pt, maxw):
        pen.text((x, y), line, f, pt, fill, anchor)
        y += lh
    return y

def para_h(pen, s, f, pt, maxw, lh):
    return len(wrap(pen, s, f, pt, maxw)) * lh

# --- mascotte : détourage du fond de l'icône --------------------------------
def _cutout():
    im = Image.open(f"{ROOT}/assets/images/icon.png").convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if (r - 10) ** 2 + (g - 15) ** 2 + (b - 28) ** 2 < 34 ** 2:
                px[x, y] = (r, g, b, 0)
    return im
PENGUIN = _cutout()

def penguin(pen, cx, cy, w):
    size = max(2, int(round(w * SC)))
    img = PENGUIN.resize((size, size), Image.LANCZOS)
    pen.img.alpha_composite(img, (int(pen.X(cx) - size / 2), int(pen.Y(cy) - size / 2)))

# --- pictogrammes vectoriels ------------------------------------------------
def check(pen, cx, cy, r, col, w=2.2):
    pen.line([(cx - r * .52, cy + r * .05), (cx - r * .12, cy + r * .5)], col, w)
    pen.line([(cx - r * .12, cy + r * .5), (cx + r * .6, cy - r * .5)], col, w)
def star(pen, cx, cy, R, col):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        r = R if k % 2 == 0 else R * .42
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    pen.poly(pts, col)
def shield(pen, cx, cy, r, col):
    pen.poly([(cx, cy - r), (cx + r * .82, cy - r * .48), (cx + r * .82, cy + r * .18),
              (cx, cy + r), (cx - r * .82, cy + r * .18), (cx - r * .82, cy - r * .48)], col)
def flame(pen, cx, cy, r, col):
    pen.poly([(cx, cy - r), (cx + r * .78, cy + r * .12), (cx + r * .48, cy + r * .88),
              (cx, cy + r), (cx - r * .48, cy + r * .88), (cx - r * .78, cy + r * .12)], col)
def chevron(pen, x, y, r, col, w=1.8, back=False):
    s = -1 if back else 1
    pen.line([(x - s * r * .5, y - r), (x + s * r * .5, y)], col, w)
    pen.line([(x + s * r * .5, y), (x - s * r * .5, y + r)], col, w)

def icon(pen, kind, cx, cy, col):
    if kind == "term":
        pen.rr((cx - 8.5, cy - 7, cx + 8.5, cy + 7), 3, outline=col, w=1.6)
        pen.line([(cx - 5, cy - 3), (cx - 2, cy)], col, 1.6)
        pen.line([(cx - 2, cy), (cx - 5, cy + 3)], col, 1.6)
        pen.line([(cx + .5, cy + 3.2), (cx + 5, cy + 3.2)], col, 1.6)
    elif kind == "anal":
        pen.ell((cx - 8, cy - 8, cx + 3, cy + 3), outline=col, w=1.8)
        pen.line([(cx + 2, cy + 2), (cx + 8, cy + 8)], col, 2)
    elif kind == "ord":
        pen.line([(cx - 5, cy - 6), (cx - 5, cy + 7)], col, 1.8)
        pen.poly([(cx - 5, cy - 8.5), (cx - 8.5, cy - 4), (cx - 1.5, cy - 4)], col)
        pen.line([(cx + 5, cy - 7), (cx + 5, cy + 6)], col, 1.8)
        pen.poly([(cx + 5, cy + 8.5), (cx + 1.5, cy + 4), (cx + 8.5, cy + 4)], col)
    elif kind == "flag":
        pen.line([(cx - 6, cy - 8), (cx - 6, cy + 8)], col, 1.8)
        pen.poly([(cx - 5, cy - 8), (cx + 8, cy - 3.5), (cx - 5, cy + 1)], col)
    else:  # scenario
        pen.ell((cx - 8, cy - 8.5, cx - 2.5, cy - 3), outline=col, w=1.8)
        pen.ell((cx + 2.5, cy + 3, cx + 8, cy + 8.5), outline=col, w=1.8)
        pen.ell((cx + 2.5, cy - 8.5, cx + 8, cy - 3), outline=col, w=1.8)
        pen.line([(cx - 5.2, cy - 3), (cx - 5.2, cy + 5.8)], col, 1.6)
        pen.line([(cx - 5.2, cy + 5.8), (cx + 2.5, cy + 5.8)], col, 1.6)
        pen.line([(cx - 5.2, cy - 5.8), (cx + 2.5, cy - 5.8)], col, 1.6)

DOMAIN = ["#4C74AD", "#4881AC", "#458DAB", "#4A98A9", "#579FA6", "#69A8AE", "#7EB1BC", "#93BCC9"]

# --- chrome iOS -------------------------------------------------------------
def statusbar(pen, t="9:41"):
    pen.rr((CW / 2 - 47, 11, CW / 2 + 47, 30), 10, fill=(0, 0, 0, 255))
    pen.text((24, 12.5), t, "semi", 13.5, hx("txt"))
    for i, h in enumerate([4, 6.5, 9, 11.5]):
        pen.rr((CW - 62 + i * 5.6, 22 - h, CW - 62 + i * 5.6 + 3.4, 22), 1, fill=hx("txt"))
    pen.rr((CW - 34, 12.5, CW - 15, 22.5), 3, outline=mix("txt", "bg", .75), w=1)
    pen.rr((CW - 32.4, 14.2, CW - 20, 20.8), 1.6, fill=hx("txt"))

def navbar(pen, title, pro=False):
    pen.ell((16, 44, 44, 72), fill=hx("card"))
    chevron(pen, 31, 58, 6.5, hx("txt"), 2.2, back=True)
    pen.text((CW / 2, 50), title, "bold", 16.5, hx("txt"), anchor="ma")
    if pro:
        w = pen.tw("PRO", "bold", 10.5) + 3 * 0.8 + 30
        pen.rr((CW - 16 - w, 47, CW - 16, 69), 11, fill=hx("amberSoft"), outline=mix("amber", "card", .55), w=1)
        star(pen, CW - 16 - w + 13, 58, 6, hx("amber"))
        pen.text((CW - 16 - w + 22, 51.5), "PRO", "bold", 10.5, hx("amber"), ls=0.8)

def tabbar(pen, active=0):
    y = CH - 68
    pen.line([(0, y), (CW, y)], mix("line", "bg", .5), 1)
    labels = ["Accueil", "Apprendre", "S'entraîner", "Profil"]
    for i, lab in enumerate(labels):
        cx = CW * (i + .5) / 4
        col = hx("amber") if i == active else hx("dim2")
        if i == 0:
            pen.poly([(cx, y + 13), (cx - 10, y + 22), (cx + 10, y + 22)], col)
            pen.rr((cx - 7.5, y + 21, cx + 7.5, y + 31), 2, outline=col, w=1.9)
        elif i == 1:
            pen.rr((cx - 9.5, y + 14, cx - .8, y + 30), 1.6, outline=col, w=1.9)
            pen.rr((cx + .8, y + 14, cx + 9.5, y + 30), 1.6, outline=col, w=1.9)
        elif i == 2:
            pen.ell((cx - 9.5, y + 13, cx + 9.5, y + 32), outline=col, w=1.9)
            pen.line([(cx, y + 22.5), (cx, y + 17)], col, 1.9)
        else:
            pen.ell((cx - 6.5, y + 13, cx + 6.5, y + 26), outline=col, w=1.9)
            pen.arc((cx - 10.5, y + 24, cx + 10.5, y + 39), 180, 360, col, 1.9)
        pen.text((cx, y + 40), lab, "semi", 10.5, col, anchor="ma")
    pen.rr((CW / 2 - 47, CH - 12, CW / 2 + 47, CH - 8.5), 2, fill=hx("dim2"))

def home_indicator(pen):
    pen.rr((CW / 2 - 47, CH - 12, CW / 2 + 47, CH - 8.5), 2, fill=hx("dim2"))

# ============================== 1. ACCUEIL ==================================
def s_home(pen):
    statusbar(pen)
    pen.text((22, 55), "PENTAGUIN", "bold", 11.5, hx("dim2"), ls=2.6)
    penguin(pen, 58, 121, 84)
    pen.text((106, 95), "Salut, Nova.", "bold", 23.5, hx("txt"))
    pen.text((106, 127), "Prêt pour aujourd'hui ?", "med", 14, hx("dim"))

    # Objectif du jour
    y0, y1 = 164, 268
    pen.rr((16, y0, CW - 16, y1), 17, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    cx, cy, r = 60, (y0 + y1) / 2, 30
    pen.ell((cx - r, cy - r, cx + r, cy + r), outline=hx("line"), w=5.5)
    pen.arc((cx - r, cy - r, cx + r, cy + r), -90, 270, hx("mint"), 5.5)
    check(pen, cx, cy, 12, hx("mint"), 3)
    pen.text((104, y0 + 16), "Objectif du jour", "semi", 13, hx("dim"))
    pen.text((104, y0 + 34), "30", "bold", 27, hx("mint"))
    pen.text((104 + pen.tw("30", "bold", 27) + 6, y0 + 45), "/ 30 XP", "semi", 14, hx("dim"))
    bw = pen.tw("Objectif atteint", "semi", 11) + 32
    pen.rr((104, y0 + 70, 104 + bw, y0 + 90), 10, fill=hx("mintSoft"))
    check(pen, 115, y0 + 80, 6, hx("mint"), 2)
    pen.text((125, y0 + 73.5), "Objectif atteint", "semi", 11, hx("mint"))
    shield(pen, CW - 46, y0 + 34, 12, hx("amber"))
    pen.text((CW - 46, y0 + 50), "×2", "bold", 11.5, hx("amber"), anchor="ma")

    # Semaine
    y0, y1 = 282, 368
    pen.rr((16, y0, CW - 16, y1), 17, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    pen.text((32, y0 + 16), "CETTE SEMAINE", "bold", 10.5, hx("dim2"), ls=1.5)
    pen.text((CW - 32, y0 + 16), "6/7 · 240 XP", "semi", 11.5, hx("dim"), anchor="ra")
    for i, lab in enumerate("LMMJVSD"):
        x = 32 + i * 47.4
        on = i < 6
        pen.rr((x, y0 + 38, x + 36, y0 + 66), 9,
               fill=hx("amberSoft") if on else hx("card2"),
               outline=hx("amber") if i == 6 else None, w=1.5)
        if on: check(pen, x + 18, y0 + 52, 7.5, hx("amber"), 2.2)
        else: pen.text((x + 18, y0 + 44), lab, "bold", 12, hx("dim2"), anchor="ma")

    # Reprendre — hauteur calculée sur le titre mesuré
    title = "Authentification, sessions et cookies"
    lines = wrap(pen, title, "bold", 18.5, CW - 64)
    y0 = 382
    y1 = y0 + 34 + len(lines) * 24 + 44
    pen.rr((16, y0, CW - 16, y1), 17, fill=hx("card"), outline=mix("amber", "card", .42), w=1.5)
    pen.poly([(34, y0 + 15), (34, y0 + 25), (42.5, y0 + 20)], hx("amber"))
    pen.text((48, y0 + 14), "REPRENDRE", "bold", 10.5, hx("amber"), ls=1.5)
    pen.text((CW - 32, y0 + 14), "ÉTAPE 5/8", "bold", 10.5, hx("dim2"), anchor="ra", ls=1.2)
    yy = y0 + 34
    for line in lines:
        pen.text((32, yy), line, "bold", 18.5, hx("txt")); yy += 24
    pen.text((32, yy + 4), "FONDAMENTAUX & HYGIÈNE · 6 MIN", "mono", 10, hx("dim2"))
    pen.rr((32, y1 - 14, CW - 32, y1 - 9), 3, fill=hx("card2"))
    pen.rr((32, y1 - 14, 32 + (CW - 64) * .62, y1 - 9), 3, fill=hx("amber"))

    # Tuiles
    y0 = y1 + 14
    pen.rr((16, y0, 196, y0 + 100), 17, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    pen.text((32, y0 + 17), "RANG", "bold", 10.5, hx("dim2"), ls=1.5)
    star(pen, 38, y0 + 53, 13, hx("amber"))
    pen.text((58, y0 + 39), "Or I", "bold", 23, hx("amber"))
    pen.text((32, y0 + 74), "Top 9 % des joueurs", "med", 11, hx("dim"))
    for i, (lab, val, col) in enumerate([("XP TOTAL", "4 930", hx("txt")), ("SÉRIE", "12 jours", hx("ember"))]):
        by = y0 + i * 52
        pen.rr((204, by, CW - 16, by + 48), 15, fill=hx("card"), outline=mix("line", "card", .62), w=1)
        pen.text((220, by + 11), lab, "bold", 10.5, hx("dim2"), ls=1.5)
        if lab == "SÉRIE":
            flame(pen, 227, by + 32, 8.5, hx("ember"))
            pen.text((240, by + 23), val, "bold", 17, col)
        else:
            pen.text((220, by + 23), val, "bold", 17, col)

    # CTA
    y0 = y0 + 114
    pen.rr((16, y0 + 4, CW - 16, y0 + 56), 14, fill=hx("amberDark"))
    pen.rr((16, y0, CW - 16, y0 + 52), 14, fill=hx("amber"))
    pen.text((CW / 2, y0 + 15), "Continuer ma leçon", "bold", 17, hx("onAmber"), anchor="ma")

    # À réviser
    y0 = y0 + 70
    pen.rr((16, y0, CW - 16, y0 + 74), 16, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    pen.text((32, y0 + 15), "À RÉVISER AUJOURD'HUI", "bold", 10.5, hx("dim2"), ls=1.5)
    pen.text((32, y0 + 33), "7 questions arrivent à échéance", "semi", 13.5, hx("txt"))
    pen.text((32, y0 + 53), "Révision espacée · 3 min", "med", 11.5, hx("dim"))
    chevron(pen, CW - 34, y0 + 37, 6, hx("amber"), 2)
    tabbar(pen, 0)

# ============================ 2. S'ENTRAÎNER ================================
def s_practice(pen):
    statusbar(pen); navbar(pen, "S'entraîner", pro=True)
    pen.text((20, 88), "Missions", "bold", 19.5, hx("txt"))
    pen.text((20, 114), "Des enquêtes complètes, étape par étape.", "med", 12.5, hx("dim"))
    missions = [("Quart de nuit au SOC", "Détecter, investiguer, répondre : une nuit de garde au SOC.", 5, True),
                ("Anatomie d'une attaque", "De la kill chain à la note de rançon.", 4, True),
                ("Pentest sous mandat", "Du cadre légal à la faille, dans les règles.", 7, False)]
    y = 138
    for title, sub, hue, done in missions:
        sub_lines = wrap(pen, sub, "med", 11.5, CW - 116)
        h = 20 + max(34, len(sub_lines) * 14 + 20) + 22
        pen.rr((16, y, CW - 16, y + h), 15, fill=hx("card"), outline=mix("line", "card", .62), w=1)
        pen.rr((30, y + 15, 62, y + 47), 9, fill=mix(DOMAIN[hue], "card", .2))
        if done: check(pen, 46, y + 31, 9, hx("mint"), 2.4)
        else: icon(pen, "flag", 46, y + 31, mix(DOMAIN[hue], "txt", .35))
        pen.text((72, y + 16), title, "bold", 14.5, hx("txt"))
        yy = y + 36
        for line in sub_lines:
            pen.text((72, yy), line, "med", 11.5, hx("dim")); yy += 14
        chevron(pen, CW - 32, y + 31, 6, hx("dim2"))
        pen.text((30, y + h - 19), "4 ÉTAPES · TERMINAL, LOGS, DÉCISION", "mono", 9.5, hx("dim2"))
        y += h + 10

    y += 8
    pen.text((20, y), "Exercices", "bold", 19.5, hx("txt"))
    pen.text((20, y + 26), "32 exercices, tous débloqués.", "med", 12.5, hx("dim"))
    y += 52
    exos = [("Audit des privilèges locaux (Linux)", "Terminal · Pour ton rang", 0, "term", True),
            ("L'événement critique noyé dans le bruit du SIEM", "Analyse d'artefact", 3, "anal", False),
            ("Le cycle de réponse à incident (SANS)", "Remise en ordre", 5, "ord", False),
            ("Ransomware en cours : décisions", "Scénario", 6, "scen", False),
            ("Inspecter un certificat avec openssl", "Terminal", 2, "term", False)]
    rows = []
    for title, sub, hue, kind, reco in exos:
        tl = wrap(pen, title, "semi", 13, CW - 116)
        rows.append((tl, sub, hue, kind, reco, 18 + len(tl) * 16 + 20))
    total = sum(r[5] for r in rows) + 12
    pen.rr((16, y, CW - 16, y + total), 15, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    yy = y + 6
    for i, (tl, sub, hue, kind, reco, h) in enumerate(rows):
        if i: pen.line([(72, yy), (CW - 16, yy)], mix("line", "card", .45), 1)
        pen.rr((30, yy + 12, 62, yy + 44), 9, fill=mix(DOMAIN[hue], "card", .2))
        icon(pen, kind, 46, yy + 28, mix(DOMAIN[hue], "txt", .35))
        ty = yy + 12
        for line in tl:
            pen.text((72, ty), line, "semi", 13, hx("txt")); ty += 16
        pen.text((72, ty + 2), sub, "med", 11, hx("amber") if reco else hx("dim"))
        chevron(pen, CW - 32, yy + h / 2, 6, hx("dim2"))
        yy += h
    tabbar(pen, 2)

# ============================== 3. TERMINAL =================================
def s_terminal(pen):
    statusbar(pen); navbar(pen, "Audit des privilèges locaux")
    pen.text((20, 88), "Étape 2/4", "mono", 13, hx("dim"))
    for i in range(4):
        cx = CW - 30 - (3 - i) * 17
        col = hx("mint") if i < 1 else (hx("amber") if i == 1 else hx("line"))
        pen.ell((cx - 5, 90, cx + 5, 100), fill=col)

    y = para(pen, (20, 118),
             "Tu mènes une revue de durcissement sur un serveur Linux. Objectif : cartographier "
             "la surface d'élévation de privilèges du compte courant, avec des commandes "
             "strictement en lecture seule et non destructives.",
             "med", 13, hx("dim"), CW - 40, 19)
    y = para(pen, (20, y + 12),
             "Liste les commandes que ce compte peut exécuter via sudo (une élévation est-elle possible ?).",
             "semi", 14, hx("txt"), CW - 40, 20)

    # Terminal : hauteur = contenu réel
    out = ["audit@srv01:~$ id",
           "uid=1004(audit) gid=1004(audit) groups=1004(audit),4(adm)",
           "",
           "audit@srv01:~$ sudo -l",
           "Matching Defaults entries for audit on srv01:",
           "    env_reset, mail_badpass",
           "",
           "User audit may run the following commands on srv01:",
           "    (root) NOPASSWD: /usr/bin/find"]
    ty = y + 16
    th = 16 + len(out) * 16 + 34
    pen.rr((16, ty, CW - 16, ty + th), 12, fill=hx("term"))
    ly = ty + 14
    for i, line in enumerate(out):
        pen.text((30, ly), line, "mono", 10, hx("amber") if i == 0 else hx("mint"))
        ly += 16
    ly += 6
    pen.text((30, ly), "audit@srv01:~$", "mono", 10.5, hx("amber"))
    cx = 30 + pen.tw("audit@srv01:~$ ", "mono", 10.5)
    for tok in ["sudo", "-l"]:
        w = pen.tw(tok, "mono", 10.5) + 11
        pen.rr((cx, ly - 3, cx + w, ly + 16), 4, fill=hx("card2"), outline=mix("amber", "term", .5), w=1)
        pen.text((cx + 5.5, ly), tok, "mono", 10.5, hx("txt"))
        cx += w + 5
    pen.rr((cx + 1, ly - 1, cx + 3, ly + 14), 1, fill=hx("amber"))

    py = ty + th + 18
    pen.text((20, py), "COMPOSE LA COMMANDE", "bold", 10.5, hx("dim2"), ls=1.5)
    pool = ["su", "-i", "visudo", "-v", "cat", "/etc/sudoers"]
    px, pyy = 20, py + 20
    for tok in pool:
        w = pen.tw(tok, "mono", 11.5) + 22
        if px + w > CW - 20:
            px = 20; pyy += 36
        pen.rr((px, pyy, px + w, pyy + 30), 8, fill=hx("card"), outline=hx("line"), w=1)
        pen.text((px + 11, pyy + 6), tok, "mono", 11.5, hx("txt"))
        px += w + 9
    hy = pyy + 48
    hint = "Un compte peut avoir le droit d'exécuter une commande précise en root. C'est ce droit que l'on cherche."
    hl = wrap(pen, hint, "med", 12, CW - 64)
    hh = 34 + len(hl) * 16 + 14
    pen.rr((16, hy, CW - 16, hy + hh), 12, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    pen.text((32, hy + 14), "INDICE", "bold", 10.5, hx("amber"), ls=1.5)
    ty2 = hy + 34
    for line in hl:
        pen.text((32, ty2), line, "med", 12, hx("dim")); ty2 += 16
    by = CH - 118
    pen.rr((16, by + 4, CW - 16, by + 56), 13, fill=hx("amberDark"))
    pen.rr((16, by, CW - 16, by + 52), 13, fill=hx("amber"))
    pen.text((CW / 2, by + 15), "Valider", "bold", 16.5, hx("onAmber"), anchor="ma")
    pen.text((CW / 2, by + 70), "Taper au clavier", "semi", 13.5, hx("amber"), anchor="ma")
    home_indicator(pen)

# ================================ 4. LEÇON ==================================
def s_lesson(pen):
    statusbar(pen); navbar(pen, "Authentification, sessions")
    pen.rr((0, 78, CW, 84), 0, fill=hx("card2"))
    pen.rr((0, 78, CW * .5, 84), 0, fill=hx("amber"))
    pen.text((20, 96), "6 min", "mono", 12, hx("dim2"))

    hook = ("2010 : l'extension Firefox Firesheep transforme n'importe qui en pirate. Sur un Wi-Fi "
            "ouvert, un clic suffisait pour voler la session Facebook ou Twitter des voisins de café : "
            "leurs cookies circulaient en clair.")
    lines = wrap(pen, hook, "med", 13.5, CW - 152)
    by0 = 122
    bh = 24 + len(lines) * 19
    pen.rr((88, by0, CW - 18, by0 + bh), 15, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    pen.poly([(88, by0 + bh / 2 - 8), (78, by0 + bh / 2), (88, by0 + bh / 2 + 8)], hx("card"))
    yy = by0 + 12
    for line in lines:
        pen.text((104, yy), line, "med", 13.5, hx("txt")); yy += 19
    penguin(pen, 48, by0 + bh / 2, 74)

    y = by0 + bh + 24
    w = pen.tw("À TON AVIS ?", "bold", 11) + 11 * 1.4 + 30
    pen.rr((16, y, 16 + w, y + 26), 9, fill=hx("amberSoft"))
    pen.text((31, y + 6), "À TON AVIS ?", "bold", 11, hx("amber"), ls=1.4)

    q = "Pourquoi un cookie de session doit-il porter l'attribut Secure ?"
    y = para(pen, (20, y + 42), q, "bold", 16.5, hx("txt"), CW - 40, 22) + 12

    answers = [("Pour qu'il ne parte jamais sur une connexion non chiffrée.", True),
               ("Pour qu'il expire automatiquement au bout d'une heure.", False),
               ("Pour empêcher JavaScript d'y accéder depuis la page.", False)]
    for text, good in answers:
        tl = wrap(pen, text, "med", 13, CW - 100)
        h = 20 + len(tl) * 18
        pen.rr((16, y, CW - 16, y + h), 13, fill=hx("mintSoft") if good else hx("card"),
               outline=hx("mint") if good else hx("line"), w=1.6 if good else 1)
        if good: check(pen, 38, y + h / 2, 8, hx("mint"), 2.4)
        else: pen.ell((29, y + h / 2 - 9, 47, y + h / 2 + 9), outline=hx("dim2"), w=1.5)
        ty = y + 10
        for line in tl:
            pen.text((58, ty), line, "med", 13, hx("txt")); ty += 18
        y += h + 10

    exp = ("Sans Secure, le navigateur renvoie le cookie même en HTTP : c'est exactement la brèche "
           "que Firesheep exploitait. HttpOnly, lui, bloque l'accès depuis JavaScript.")
    el = wrap(pen, exp, "med", 12.5, CW - 64)
    eh = 40 + len(el) * 17 + 14
    y += 8
    pen.rr((16, y, CW - 16, y + eh), 13, fill=hx("card"), outline=mix("mint", "card", .5), w=1.5)
    pen.text((32, y + 16), "BIEN VU", "bold", 10.5, hx("mint"), ls=1.5)
    pw = pen.tw("+15 XP", "bold", 11) + 22
    pen.rr((CW - 32 - pw, y + 12, CW - 32, y + 32), 9, fill=hx("mintSoft"))
    pen.text((CW - 32 - pw / 2, y + 15), "+15 XP", "bold", 11, hx("mint"), anchor="ma")
    ty = y + 38
    for line in el:
        pen.text((32, ty), line, "med", 12.5, hx("txt")); ty += 17
    by = CH - 104
    pen.rr((16, by + 4, CW - 16, by + 56), 13, fill=hx("amberDark"))
    pen.rr((16, by, CW - 16, by + 52), 13, fill=hx("amber"))
    pen.text((CW / 2, by + 15), "Continuer", "bold", 16.5, hx("onAmber"), anchor="ma")
    home_indicator(pen)

# ========================= 5. FIN DE LEÇON (QUIZ) ===========================
def s_quickcheck(pen):
    statusbar(pen); navbar(pen, "Post-exploitation et C2")
    pen.rr((0, 78, CW, 84), 0, fill=hx("card2"))
    pen.rr((0, 78, CW, 84), 0, fill=hx("mint"))
    pen.text((20, 100), "QUESTION RAPIDE", "bold", 11, hx("dim2"), ls=1.6)
    y = para(pen, (20, 122), "Qu'est-ce qu'un canal de command & control (C2) ?",
             "bold", 17, hx("txt"), CW - 40, 23) + 14

    answers = [("A", "Une fonction de hachage utilisée pour stocker les mots de passe", False),
               ("B", "Le canal par lequel l'attaquant pilote à distance les machines compromises", True),
               ("C", "Le pare-feu qui contrôle le trafic entrant sur le réseau", False),
               ("D", "Un protocole de chiffrement des e-mails entre deux serveurs", False)]
    for letter, text, good in answers:
        tl = wrap(pen, text, "med", 13, CW - 110)
        h = 20 + len(tl) * 18
        pen.rr((16, y, CW - 16, y + h), 13, fill=hx("mintSoft") if good else hx("card"),
               outline=hx("mint") if good else mix("line", "card", .62), w=1.8 if good else 1)
        pen.text((40, y + h / 2 - 8), letter, "semi", 13.5,
                 hx("mint") if good else hx("dim2"), anchor="ma")
        ty = y + 10
        for line in tl:
            pen.text((62, ty), line, "med", 13, hx("txt")); ty += 18
        y += h + 10

    exp = ("Le C2 est l'infrastructure et le canal par lesquels l'attaquant envoie des ordres aux "
           "machines compromises et récupère des résultats. Il se déguise souvent en trafic HTTPS ou "
           "DNS légitime, d'où l'intérêt de surveiller le trafic sortant (egress).")
    el = wrap(pen, exp, "med", 12.5, CW - 64)
    eh = 38 + len(el) * 17 + 14
    y += 8
    pen.rr((16, y, CW - 16, y + eh), 13, fill=hx("mintSoft"))
    pen.text((32, y + 16), "BONNE RÉPONSE", "bold", 10.5, hx("mint"), ls=1.5)
    ty = y + 38
    for line in el:
        pen.text((32, ty), line, "med", 12.5, hx("txt")); ty += 17
    y += eh + 12

    pen.rr((16, y, CW - 16, y + 74), 13, fill=hx("mintSoft"))
    pen.text((CW / 2, y + 16), "Leçon terminée", "bold", 16, hx("mint"), anchor="ma")
    pen.text((CW / 2, y + 44), "+20 XP, ça rentre.", "med", 13.5, hx("txt"), anchor="ma")

    by = y + 96
    pen.rr((16, by + 4, CW - 16, by + 56), 13, fill=hx("amberDark"))
    pen.rr((16, by, CW - 16, by + 52), 13, fill=hx("amber"))
    pen.text((CW / 2, by + 15), "Revenir aux leçons", "bold", 16.5, hx("onAmber"), anchor="ma")
    home_indicator(pen)

# =============================== 6. RANG ====================================
def s_rank(pen):
    statusbar(pen); navbar(pen, "Ton rang")
    y0 = 84
    pen.rr((16, y0, CW - 16, y0 + 176), 19, fill=hx("card"), outline=mix("amber", "card", .45), w=1.5)
    cx, cy = CW / 2, y0 + 66
    pen.ell((cx - 46, cy - 46, cx + 46, cy + 46), fill=hx("amberSoft"))
    pen.ell((cx - 46, cy - 46, cx + 46, cy + 46), outline=hx("amber"), w=2.2)
    for k in range(3):
        star(pen, cx - 23 + k * 23, cy - 6, 12, hx("amber"))
    pen.text((cx, cy + 12), "OR", "bold", 13, hx("amber"), anchor="ma", ls=2.2)
    pen.text((cx, y0 + 120), "Or I", "bold", 27, hx("txt"), anchor="ma")
    pen.text((cx, y0 + 152), "Rang 9 sur 15 · Top 9 %", "med", 12.5, hx("dim"), anchor="ma")

    y = y0 + 200
    pen.text((20, y), "PROGRESSION VERS PLATINE III", "bold", 10.5, hx("dim2"), ls=1.5)
    pen.rr((20, y + 22, CW - 20, y + 33), 6, fill=hx("card2"))
    pen.rr((20, y + 22, 20 + (CW - 40) * .68, y + 33), 6, fill=hx("amber"))
    pen.text((20, y + 41), "4 930 XP", "semi", 12, hx("txt"))
    pen.text((CW - 20, y + 41), "7 000 XP", "semi", 12, hx("dim"), anchor="ra")

    y += 82
    pen.text((20, y), "Classement de la semaine", "bold", 18, hx("txt"))
    pen.text((20, y + 26), "Ligue Or · 30 joueurs", "med", 12, hx("dim"))
    y += 52
    rows = [(1, "Kernel_Fox", "1 240", False), (2, "n0ct4mbule", "1 105", False),
            (3, "Nova", "980", True), (4, "packet_lily", "870", False),
            (5, "sudo_marin", "755", False), (6, "tcp_flynn", "690", False)]
    rh = 54
    pen.rr((16, y, CW - 16, y + len(rows) * rh + 12), 15, fill=hx("card"),
           outline=mix("line", "card", .62), w=1)
    for i, (rk, name, xp, me) in enumerate(rows):
        ly = y + 6 + i * rh
        if i: pen.line([(66, ly), (CW - 16, ly)], mix("line", "card", .45), 1)
        if me: pen.rr((22, ly + 2, CW - 22, ly + rh - 4), 11, fill=hx("amberSoft"))
        pen.text((44, ly + 16), str(rk), "bold", 16, hx("amber") if rk <= 3 else hx("dim"), anchor="ma")
        pen.ell((60, ly + 10, 94, ly + 44), fill=hx("card2"))
        pen.text((77, ly + 18), name[0].upper(), "bold", 14, hx("dim"), anchor="ma")
        pen.text((104, ly + 17), name, "bold" if me else "semi", 14,
                 hx("amber") if me else hx("txt"))
        pen.text((CW - 34, ly + 18), xp + " XP", "mono", 12, hx("dim"), anchor="ra")
    tabbar(pen, 3)



# ======================== PAYWALL (fiche abonnement) ========================
def s_paywall(pen):
    """Écran de vente, tel que rendu par src/app/(app)/paywall.tsx.
    Sert de capture de vérification pour l'abonnement dans App Store Connect."""
    statusbar(pen)
    pen.ell((CW - 60, 44, CW - 16, 88), fill=hx("card"), outline=mix("line", "card", .62), w=1)
    cx, cy = CW - 38, 66
    pen.line([(cx - 7, cy - 7), (cx + 7, cy + 7)], hx("txt"), 2.2)
    pen.line([(cx + 7, cy - 7), (cx - 7, cy + 7)], hx("txt"), 2.2)

    pen.text((CW / 2, 104), "Pentaguin Pro", "bold", 26, hx("txt"), anchor="ma")
    y = para(pen, (CW / 2, 146), "Beau parcours : 12 leçons terminées, rang Argent II.",
             "semi", 13, hx("txt"), CW - 48, 19, anchor="ma")
    y = para(pen, (CW / 2, y + 6),
             "Il te reste 6 thèmes et 36 leçons à débloquer, à ton rythme.",
             "med", 13, hx("dim"), CW - 48, 19, anchor="ma") + 16

    bullets = ["Les 8 thèmes, 64 leçons interactives",
               "514 questions avec explications détaillées",
               "3 examens blancs chronométrés, rejouables",
               "Missions scénarisées et pratique en situation"]
    lines = [wrap(pen, b, "med", 13, CW - 96) for b in bullets]
    bh = 24 + sum(len(l) * 18 for l in lines) + (len(bullets) - 1) * 10
    pen.rr((16, y, CW - 16, y + bh), 15, fill=hx("card"), outline=mix("line", "card", .62), w=1)
    by = y + 14
    for l in lines:
        pen.ell((32, by + 1, 48, by + 17), outline=hx("amber"), w=1.6)
        check(pen, 40, by + 9, 5, hx("amber"), 1.8)
        ty = by
        for line in l:
            pen.text((58, ty), line, "med", 13, hx("txt")); ty += 18
        by += len(l) * 18 + 10
    y += bh + 16

    pen.rr((16, y, CW - 16, y + 104), 15, fill=mix("amber", "bg", .13))
    pen.text((32, y + 16), "ABONNEMENT ANNUEL, SANS ENGAGEMENT", "bold", 10.5, hx("amber"), ls=1.4)
    pen.text((32, y + 40), "19,99 $", "bold", 24, hx("txt"))
    pen.text((32 + pen.tw("19,99 $", "bold", 24) + 10, y + 52), "par an", "med", 13, hx("dim"))
    pen.text((32, y + 76), "soit environ 1,67 $ par mois", "med", 12.5, hx("dim"))
    y += 120

    pen.rr((16, y + 4, CW - 16, y + 56), 13, fill=hx("amberDark"))
    pen.rr((16, y, CW - 16, y + 52), 13, fill=hx("amber"))
    pen.text((CW / 2, y + 15), "S'abonner", "bold", 16.5, hx("onAmber"), anchor="ma")
    y += 68
    pen.text((CW / 2, y + 12), "Restaurer mes achats", "semi", 14, hx("amber"), anchor="ma")
    y += 48

    legal = ("Renouvelé automatiquement chaque année sauf résiliation au moins 24 h avant la fin "
             "de la période. Tu gères ou résilies l'abonnement à tout moment depuis les réglages "
             "de ton compte App Store.")
    y = para(pen, (CW / 2, y), legal, "med", 11.5, hx("dim"), CW - 48, 17, anchor="ma") + 10
    sep = " · "
    w = pen.tw("Conditions d'utilisation", "med", 12) + pen.tw(sep, "med", 12) + pen.tw("Confidentialité", "med", 12)
    x = (CW - w) / 2
    pen.text((x, y), "Conditions d'utilisation", "med", 12, hx("amber"))
    x += pen.tw("Conditions d'utilisation", "med", 12)
    pen.text((x, y), sep, "med", 12, hx("dim"))
    x += pen.tw(sep, "med", 12)
    pen.text((x, y), "Confidentialité", "med", 12, hx("amber"))
    home_indicator(pen)


def build_raw(draw_screen, out_path, w, h):
    """Capture brute plein cadre, sans habillage marketing : c'est ce que
    demande App Store Connect pour la vérification de l'abonnement."""
    global AW, AH, DW, DX, DY, SC
    AW, AH, DW, DX, DY = w, h, w, 0, 0
    SC = w / 393.0
    _fc.clear()
    img = Image.new("RGBA", (w, h), hx("bg"))
    draw_screen(Pen(img, 0, 0))
    img.convert("RGB").save(out_path, optimize=True)

# ============================== MONTAGE =====================================
def glow(img, cx, cy, r, rgb, a):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r], fill=rgb + (a,))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r * 0.45)))

def parse(line):
    return [(chunk, i % 2 == 1) for i, chunk in enumerate(line.split("*")) if chunk]

def build(draw_screen, eyebrow, headline, out_path):
    img = Image.new("RGBA", (AW, AH), hx("bg"))
    glow(img, AW // 2, 300, 780, (251, 190, 75), 30)
    glow(img, AW // 2, 2600, 900, (45, 224, 166), 11)
    d = ImageDraw.Draw(img)

    fe = ImageFont.truetype(f"{ROOT}/assets/fonts/{FONTS['bold']}.ttf", 31)
    gap = 7
    w = sum(d.textlength(c, font=fe) + gap for c in eyebrow) - gap
    x = (AW - w) / 2
    for ch in eyebrow:
        d.text((x, 176), ch, font=fe, fill=hx("amber")); x += d.textlength(ch, font=fe) + gap

    fh = ImageFont.truetype(f"{ROOT}/assets/fonts/{FONTS['bold']}.ttf", 94)
    yy = 244
    for line in headline.split("\n"):
        parts = parse(line)
        tw = sum(d.textlength(s, font=fh) for s, _ in parts)
        x = (AW - tw) / 2
        for s, acc in parts:
            d.text((x, yy), s, font=fh, fill=hx("amber") if acc else hx("txt"))
            x += d.textlength(s, font=fh)
        yy += 106

    # ombre portée du téléphone
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [DX - 14, DY - 8, DX + DW + 14, DY + int(CH * SC) + 34], radius=84, fill=(0, 0, 0, 165))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(30)))
    # tranche du châssis
    ImageDraw.Draw(img).rounded_rectangle(
        [DX - 11, DY - 11, DX + DW + 11, DY + int(CH * SC) + 11], radius=82, fill=(32, 40, 60, 255))

    # écran : tracé une seule fois, à la résolution finale
    screen = Image.new("RGBA", (DW, int(CH * SC)), hx("bg"))
    draw_screen(Pen(screen, 0, 0))
    mask = Image.new("L", screen.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, screen.width - 1, screen.height - 1],
                                           radius=int(72 * SC / 2.53), fill=255)
    img.paste(screen, (DX, DY), mask)
    img.convert("RGB").save(out_path, optimize=True)

SIZES = [(1290, 2796, ""), (1320, 2868, "-69"), (1242, 2688, "-65")]

SHOTS = [
    (s_home, "APPRENDS EN JOUANT", "Ta cybersécurité,\n*5 minutes* par jour", "01-accueil"),
    (s_lesson, "LEÇONS INTERACTIVES", "Tu *paries*\navant d'apprendre", "02-lecon"),
    (s_terminal, "PRATIQUE EN SITUATION", "Un vrai terminal,\n*sans le clavier*", "03-terminal"),
    (s_quickcheck, "COMPRENDRE, PAS BACHOTER", "Chaque réponse\n*est expliquée*", "04-quiz"),
    (s_practice, "PENTAGUIN PRO", "Toute la pratique\n*débloquée*", "05-pratique"),
    (s_rank, "PROGRESSION", "15 rangs\nà *gravir*", "06-rang"),
]
for w, h, suffix in SIZES:
    AW, AH = w, h
    DW = round(AW * 0.7713)
    DX, DY = (AW - DW) // 2, round(AH * 0.2210)
    SC = DW / 393.0
    _fc.clear()
    for fn, eb, hd, name in SHOTS:
        build(fn, eb, hd, f"{OUT}/{name}{suffix}.png")
    print("ok", f"{AW}x{AH}", "->", len(SHOTS), "captures")

build_raw(s_paywall, f"{OUT}/paywall-review.png", 1290, 2796)
print("ok paywall-review 1290x2796")
