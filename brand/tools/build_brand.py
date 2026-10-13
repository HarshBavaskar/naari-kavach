"""Usage: pip install fonttools brotli uharfbuzz && python brand/tools/build_brand.py brand
"""
"""Generates the Naari Kavach identity: mark, lockups, app icons, brand sheet assets."""
import io, math, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

OUT = sys.argv[1]
FONTS = os.path.join(os.path.dirname(__file__), '..', '..', 'node_modules', '@fontsource-variable', 'anek-devanagari', 'files') + os.sep
os.makedirs(OUT, exist_ok=True)

INDIGO, DEEP, RED, INK, MIST, NIGHT = '#4152D9', '#2B3699', '#E5364F', '#18213F', '#F3F5FA', '#0E1330'

# ------------------------------------------------------------------ mark geometry
N, RO, R, SHIFT, GAP = 8, 29.5, 16.5, 6.2, 1.6
BODY = ('M50 44.2C44.6 44.2 42.1 48 41.6 52.2C41.1 57.2 39.5 63.4 37.6 69.4Q37.3 70.6 38.5 70.6H61.5'
        'Q62.7 70.6 62.4 69.4C60.5 63.4 58.9 57.2 58.4 52.2C57.9 48 55.4 44.2 50 44.2Z')
P1 = 'M42.2 48.6C49.6 52.4 55.6 59.6 59.2 69.2'
P2 = 'M41.6 53.0C47.6 56.2 52.4 62 55.2 69.4'
HEAD = (50, 36.4, 5.4)


def crescent_path(i):
    """Outer circle minus inward-shifted circle, as an exact two-arc path."""
    a = math.radians(-90 + 360 * i / N)
    ux, uy = math.cos(a), math.sin(a)
    c1 = (50 + RO * ux, 50 + RO * uy)
    c2 = (50 + (RO - SHIFT) * ux, 50 + (RO - SHIFT) * uy)
    # intersections of two equal circles: midpoint ± h along the perpendicular
    mx, my = (c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2
    h = math.sqrt(R * R - (SHIFT / 2) ** 2)
    px, py = -uy, ux
    p = (mx + h * px, my + h * py)
    q = (mx - h * px, my - h * py)
    # outer arc on c1 (major, away from centre), inner arc on c2 back (minor)
    return (f'M{p[0]:.3f} {p[1]:.3f}A{R} {R} 0 1 0 {q[0]:.3f} {q[1]:.3f}'
            f'A{R} {R} 0 0 1 {p[0]:.3f} {p[1]:.3f}Z')


def mark_svg(ink=INDIGO, deep=DEEP, red=RED, uid='nk', simple=False, size=None, bg=None, inner=None):
    """True-transparent mark. Each crescent is knocked out where its next neighbour
    passes over it, so the weave reads on any background."""
    gap = 1.2 if simple else GAP
    paths = [crescent_path(i) for i in range(N)]
    defs = []
    for i in range(N):
        a = math.radians(-90 + 360 * ((i + 1) % N) / N)
        nx, ny = 50 + RO * math.cos(a), 50 + RO * math.sin(a)
        defs.append(f'<mask id="{uid}-c{i}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
                    f'<rect width="100" height="100" fill="#fff"/>'
                    f'<circle cx="{nx:.3f}" cy="{ny:.3f}" r="{R + gap:.3f}" fill="#000"/></mask>')
    pw = 2.6 if simple else 2.0
    fig_mask = (f'<mask id="{uid}-f" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
                f'<rect width="100" height="100" fill="#fff"/>'
                f'<path d="{P1}" fill="none" stroke="#000" stroke-width="{pw}" stroke-linecap="round"/>'
                + ('' if simple else f'<path d="{P2}" fill="none" stroke="#000" stroke-width="0.9" stroke-linecap="round"/>')
                + '</mask>')
    defs.append(fig_mask)
    body = ''.join(f'<path d="{p}" fill="{(ink, deep)[i % 2]}" mask="url(#{uid}-c{i})"/>' for i, p in enumerate(paths))
    body += (f'<g transform="translate(50 53) scale(1.16) translate(-50 -53)">'
             f'<path d="{BODY}" fill="{inner or ink}" mask="url(#{uid}-f)"/>'
             f'<circle cx="{HEAD[0]}" cy="{HEAD[1]}" r="{HEAD[2]}" fill="{red}"/></g>')
    return f'<defs>{"".join(defs)}</defs>{body}'


def wrap(inner, w, h, vb=None, bg=None, title='Naari Kavach'):
    vb = vb or f'0 0 {w} {h}'
    bgr = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}" role="img">'
            f'<title>{title}</title>{bgr}{inner}</svg>')


# ------------------------------------------------------------------ text to outlines
_font_cache = {}


def font(subset, wght, wdth):
    key = (subset, wght, wdth)
    if key in _font_cache:
        return _font_cache[key]
    f = TTFont(FONTS + f'anek-devanagari-{subset}-standard-normal.woff2')
    inst = instancer.instantiateVariableFont(f, {'wght': wght, 'wdth': wdth})
    buf = io.BytesIO()
    inst.flavor = None
    inst.save(buf)
    data = buf.getvalue()
    tt = TTFont(io.BytesIO(data))
    _font_cache[key] = (tt, hb.Font(hb.Face(data)))
    return _font_cache[key]


def text_path(s, subset, size, x, y, wght=640, wdth=100, tracking=0, color=INK):
    """Shape with HarfBuzz (handles Devanagari conjuncts and matras), emit outlines."""
    tt, hbf = font(subset, wght, wdth)
    upm = tt['head'].unitsPerEm
    buf = hb.Buffer()
    buf.add_str(s)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {'kern': True, 'liga': True})
    gs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    scale = size / upm
    pen_x = 0.0
    out = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        sp = SVGPathPen(gs)
        tp = TransformPen(sp, (scale, 0, 0, -scale, x + (pen_x + pos.x_offset) * scale, y - pos.y_offset * scale))
        gs[name].draw(tp)
        d = sp.getCommands()
        if d:
            out.append(d)
        pen_x += pos.x_advance + tracking * upm / 1000
    width = pen_x * scale
    return f'<path d="{" ".join(out)}" fill="{color}"/>', width


# ------------------------------------------------------------------ files
def save(name, svg):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        f.write(svg)


# Mark variants (100 x 100 artboard)
save('mark.svg', wrap(mark_svg(uid='m'), 100, 100))
save('mark-simple.svg', wrap(mark_svg(uid='ms', simple=True), 100, 100))
save('mark-mono.svg', wrap(mark_svg(ink=INDIGO, deep=INDIGO, red=INDIGO, uid='mm'), 100, 100))
save('mark-black.svg', wrap(mark_svg(ink=INK, deep=INK, red=INK, uid='mb'), 100, 100))
save('mark-reverse.svg', wrap(mark_svg(ink='#FFFFFF', deep='#C3CAFF', red=RED, uid='mr'), 100, 100, bg=INDIGO))
save('mark-night.svg', wrap(mark_svg(ink='#EEF1FF', deep='#9AA4D8', red=RED, uid='mn'), 100, 100, bg=NIGHT))

# App icon: white mark on indigo, rounded square (export PNGs from this)
icon_inner = (f'<rect width="100" height="100" rx="23" fill="{INDIGO}"/>'
              f'<g transform="translate(50 50) scale(0.8) translate(-50 -50)">{mark_svg(ink="#FFFFFF", deep="#C3CAFF", red=RED, uid="ai")}</g>')
save('app-icon.svg', wrap(icon_inner, 512, 512, vb='0 0 100 100'))
fav_inner = (f'<rect width="100" height="100" rx="24" fill="{INDIGO}"/>'
             f'<g transform="translate(50 50) scale(0.86) translate(-50 -50)">{mark_svg(ink="#FFFFFF", deep="#C3CAFF", red=RED, uid="fv", simple=True)}</g>')
save('favicon.svg', wrap(fav_inner, 64, 64, vb='0 0 100 100'))


def lockup_h(theme='light'):
    ink = INK if theme == 'light' else '#EEF1FF'
    sub = '#4E5778' if theme == 'light' else '#AEB6DA'
    m_ink, m_deep = (INDIGO, DEEP) if theme == 'light' else ('#EEF1FF', '#9AA4D8')
    en, w_en = text_path('Naari Kavach', 'latin', 46, 124, 58, wght=660, wdth=104, tracking=-8, color=ink)
    dv, w_dv = text_path('नारी कवच', 'devanagari', 27, 125, 96, wght=560, wdth=100, color=sub)
    W = 124 + max(w_en, w_dv) + 8
    inner = (f'<g transform="translate(0 8) scale(1.04)">{mark_svg(ink=m_ink, deep=m_deep, uid="lh" + theme)}</g>' + en + dv)
    return wrap(inner, round(W), 120, bg=None if theme == 'light' else NIGHT)


def lockup_v(theme='light'):
    ink = INK if theme == 'light' else '#EEF1FF'
    sub = '#4E5778' if theme == 'light' else '#AEB6DA'
    m_ink, m_deep = (INDIGO, DEEP) if theme == 'light' else ('#EEF1FF', '#9AA4D8')
    en, w_en = text_path('Naari Kavach', 'latin', 40, 0, 0, wght=660, wdth=104, tracking=-8, color=ink)
    dv, w_dv = text_path('नारी कवच', 'devanagari', 24, 0, 0, wght=560, color=sub)
    W = max(w_en, w_dv, 140) + 40
    inner = (f'<g transform="translate({(W - 140) / 2} 6) scale(1.4)">{mark_svg(ink=m_ink, deep=m_deep, uid="lv" + theme)}</g>'
             f'<g transform="translate({(W - w_en) / 2} 196)">{en}</g>'
             f'<g transform="translate({(W - w_dv) / 2} 232)">{dv}</g>')
    return wrap(inner, round(W), 252, bg=None if theme == 'light' else NIGHT)


save('lockup-horizontal.svg', lockup_h('light'))
save('lockup-horizontal-night.svg', lockup_h('night'))
save('lockup-stacked.svg', lockup_v('light'))
save('lockup-stacked-night.svg', lockup_v('night'))

# Geometry export for the React component (exact crescent paths)
with open(os.path.join(OUT, 'geometry.json'), 'w') as f:
    import json
    json.dump({'crescents': [crescent_path(i) for i in range(N)], 'body': BODY, 'pallu': [P1, P2], 'head': HEAD,
               'construction': {'n': N, 'orbit': RO, 'radius': R, 'shift': SHIFT, 'gap': GAP}}, f, indent=1)
print('ok')

# ------------------------------------------------------------------ construction drawing
def construction():
    g = []
    g.append(f'<circle cx="50" cy="50" r="{RO}" fill="none" stroke="{RED}" stroke-width="0.35" stroke-dasharray="1.4 1.2"/>')
    for i in range(N):
        a = math.radians(-90 + 360 * i / N)
        c1 = (50 + RO * math.cos(a), 50 + RO * math.sin(a))
        c2 = (50 + (RO - SHIFT) * math.cos(a), 50 + (RO - SHIFT) * math.sin(a))
        g.append(f'<circle cx="{c1[0]:.2f}" cy="{c1[1]:.2f}" r="{R}" fill="none" stroke="#8790AE" stroke-width="0.3"/>')
        g.append(f'<circle cx="{c2[0]:.2f}" cy="{c2[1]:.2f}" r="{R}" fill="none" stroke="#8790AE" stroke-width="0.25" stroke-dasharray="0.8 0.8"/>')
        g.append(f'<line x1="50" y1="50" x2="{50 + 47 * math.cos(a):.2f}" y2="{50 + 47 * math.sin(a):.2f}" stroke="#C9CEDF" stroke-width="0.25"/>')
        g.append(f'<circle cx="{c1[0]:.2f}" cy="{c1[1]:.2f}" r="0.7" fill="{RED}"/>')
    return f'<g opacity="0.9">{"".join(g)}</g>' + f'<g opacity="0.35">{mark_svg(uid="cx")}</g>'

save('construction.svg', wrap(construction(), 100, 100))
print('construction ok')
