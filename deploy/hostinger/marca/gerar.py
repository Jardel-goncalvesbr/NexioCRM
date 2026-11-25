"""Gera as pecas da marca do Nexio CRM (SVG + PNG).

Simbolo: duas fitas que se cruzam formando o N (a roxa e a sua par girada 180 graus).
Pecas:
  - nexio-crm-logo-claro   -> telas brancas (fita par em azul-noite, texto escuro)
  - nexio-crm-logo-escuro  -> telas escuras (fita par em branco, texto branco)
  - nexio-crm-simbolo-*    -> so o N, nas duas versoes
  - nexio-crm-icone        -> icone da aba / app (512x512, fundo escuro arredondado)
"""
import subprocess
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

OUT = Path(__file__).parent / "saida"
OUT.mkdir(exist_ok=True)
FONTES = Path("/usr/share/fonts/truetype/google-fonts")

ROXO_A, ROXO_B = "#a259ff", "#6a12d1"   # degrade da fita roxa
NOITE = "#16112b"                       # azul-noite (fita par no claro e fundo do icone)

# Fita roxa no grid 100x100. A outra e a mesma girada 180 graus.
FITA = [(12, 12), (30, 12), (68, 50), (68, 64), (22, 18), (22, 64), (32, 54), (39, 61), (12, 88)]
FITA_PAR = [(100 - x, 100 - y) for x, y in FITA]


def poligono(pts):
    return "M" + " L".join(f"{x},{y}" for x, y in pts) + " Z"


def simbolo(cor_par_a, cor_par_b, uid):
    """<defs> + as duas fitas, no grid 0..100."""
    return f"""
  <defs>
    <linearGradient id="roxo{uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{ROXO_A}"/><stop offset="1" stop-color="{ROXO_B}"/>
    </linearGradient>
    <linearGradient id="par{uid}" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{cor_par_a}"/><stop offset="1" stop-color="{cor_par_b}"/>
    </linearGradient>
  </defs>
  <path d="{poligono(FITA_PAR)}" fill="url(#par{uid})"/>
  <path d="{poligono(FITA)}" fill="url(#roxo{uid})"/>"""


def texto_em_curvas(texto, fonte, tamanho, x, y_base, espaco=0.0):
    """Converte texto em <path> (nao depende de fonte instalada)."""
    f = TTFont(FONTES / fonte)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    escala = tamanho / f["head"].unitsPerEm
    partes, cx = [], x
    for ch in texto:
        nome = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[nome].draw(TransformPen(pen, (escala, 0, 0, -escala, cx, y_base)))
        d = pen.getCommands()
        if d:
            partes.append(d)
        cx += gs[nome].width * escala + espaco
    return " ".join(partes), cx


def logotipo(claro: bool):
    par = (NOITE, "#3b3566") if claro else ("#ffffff", "#c9c4dd")
    cor_nome = NOITE if claro else "#ffffff"
    cor_crm = "#6a12d1" if claro else "#b98bff"
    # simbolo 0..100 de altura; texto alinhado ao centro otico
    nome_d, fim = texto_em_curvas("Nexio", "Poppins-Bold.ttf", 58, 122, 71, -0.6)
    crm_d, fim2 = texto_em_curvas("CRM", "Poppins-Medium.ttf", 58, fim + 14, 71, 0.4)
    largura = round(fim2 + 6)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} 100" width="{largura * 4}" height="400">{simbolo(*par, "L" + str(int(claro)))}
  <path d="{nome_d}" fill="{cor_nome}"/>
  <path d="{crm_d}" fill="{cor_crm}"/>
</svg>
"""


def simbolo_solto(claro: bool):
    par = (NOITE, "#3b3566") if claro else ("#ffffff", "#c9c4dd")
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 92 92" width="512" height="512">{simbolo(*par, "S" + str(int(claro)))}
</svg>
"""


def icone():
    # fundo arredondado azul-noite; simbolo com respiro de ~18%
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#241a4a"/><stop offset="1" stop-color="{NOITE}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#fundo)"/>
  <g transform="translate(11 11) scale(0.78)">{simbolo("#ffffff", "#d9d4ec", "I")}
  </g>
</svg>
"""


pecas = {
    "nexio-crm-logo-claro": logotipo(True),
    "nexio-crm-logo-escuro": logotipo(False),
    "nexio-crm-simbolo-claro": simbolo_solto(True),
    "nexio-crm-simbolo-escuro": simbolo_solto(False),
    "nexio-crm-icone": icone(),
}
for nome, svg in pecas.items():
    s = OUT / f"{nome}.svg"
    s.write_text(svg)
    subprocess.run(["rsvg-convert", str(s), "-o", str(OUT / f"{nome}.png")], check=True)
    print(nome, "ok")
