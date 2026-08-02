# -*- coding: utf-8 -*-
"""Extrai SODIO e GORDURA SATURADA da TACO 4a edicao (NEPA/Unicamp, 2011),
a partir do PDF oficial que o CFN hospeda, e confere o resultado contra a
base de alimentos que ja existe na plataforma.

POR QUE ESTE SCRIPT EXISTE
O app "No mercado" julga rotulo por acucar, gordura saturada e sodio. O
extrato da TACO que a plataforma ja usava trazia so kcal, carboidrato,
proteina, lipideo e fibra -- faltavam justamente sodio e saturada. Em vez de
copiar numero de site de terceiro, eles saem da publicacao oficial.

DUAS PARTICULARIDADES DO PDF QUE DITAM O CODIGO
1. As paginas de tabela sao ROTACIONADAS 90 graus. O que na folha impressa e
   uma COLUNA aparece na extracao com um mesmo `y`, e cada LINHA avanca no
   `x`. Os eixos estao trocados em relacao ao que a intuicao pede.
2. Celula vazia nao existe na extracao. Contar "o 5o valor da linha" erraria
   em todo alimento com buraco -- e a TACO tem muitos. Cada valor e ancorado
   na coordenada do TITULO da coluna.

CONVENCOES DA TACO, PRESERVADAS
   "Tr" = traco (desprezivel, mas medido) -> 0.0
   "NA" = nao analisado                   -> ausente (None), NUNCA zero
   "*"  = ver nota de rodape              -> ausente
A diferenca entre "zero" e "nao analisado" e o erro que este projeto ja
cometeu uma vez com a Open Food Facts: dado que falta virava nota boa.

Uso:  python extrai_taco.py            (espera taco4.pdf na pasta)
Saida: taco_sodio_saturada.json
"""
import json
import re
import sys
import unicodedata

import fitz

PDF = "taco4.pdf"
FONTE = "https://cfn.org.br/wp-content/uploads/2017/03/taco_4_edicao_ampliada_e_revisada.pdf"
PAGS_TABELA1 = range(28, 69)    # centesimal, minerais (tem Sodio)
PAGS_TABELA2 = range(69, 101)   # acidos graxos (tem Saturados)
BASE_APP = (r"h:/Meu Drive/NUTRI ANA LUISA ROCHA/Plataforma Nutri"
            r"/prototipo/assets/js/alimentos-data.js")


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def y_do_titulo(pg, rotulo):
    """y (= coluna, pagina rotacionada) do titulo `rotulo`."""
    alvo = sem_acento(rotulo).lower()
    for x0, y0, x1, y1, w, *_ in pg.get_text("words"):
        if sem_acento(w).lower() == alvo:
            return (y0 + y1) / 2
    return None


def linhas_da_pagina(pg):
    """Agrupa as palavras em LINHAS da tabela impressa.

    Agrupa por PROXIMIDADE de x, sem grade fixa: arredondar x por um passo
    constante juntava duas linhas vizinhas na borda do arredondamento (foi
    assim que "Merluza, file, frito" e "Pescada, branca, crua" viraram uma
    linha so, com os numeros embaralhados).
    """
    palavras = [((y0 + y1) / 2, x0, w)
                for x0, y0, x1, y1, w, *_ in pg.get_text("words") if x0 >= 150]
    linhas, atual, x_ref = [], [], None
    for y, x, w in sorted(palavras, key=lambda t: t[1]):
        if x_ref is not None and abs(x - x_ref) > 4.0:
            linhas.append(atual)
            atual, x_ref = [], None
        atual.append((y, w))
        if x_ref is None:
            x_ref = x
    if atual:
        linhas.append(atual)
    return linhas


def numero(tok):
    t = tok.strip()
    if t in ("Tr", "tr"):
        return 0.0
    if t in ("NA", "na", "*", "-", "**"):
        return None
    if not re.fullmatch(r"\d+(?:,\d+)?", t):
        return None
    return float(t.replace(",", "."))


def extrai_coluna(doc, paginas, titulo, tol=6.0):
    """{numero_do_alimento: valor} para a coluna `titulo`."""
    achados, linhas_lidas = {}, 0
    for p in paginas:
        pg = doc[p]
        y_col, y_num = y_do_titulo(pg, titulo), y_do_titulo(pg, "Número")
        if y_col is None or y_num is None:
            continue
        for itens in linhas_da_pagina(pg):
            num = val = None
            for y, tok in itens:
                if abs(y - y_num) <= tol and re.fullmatch(r"\d{1,3}", tok):
                    num = int(tok)
                elif abs(y - y_col) <= tol:
                    val = numero(tok)
            if num is not None:
                linhas_lidas += 1
                if val is not None:
                    achados[num] = val
    return achados, linhas_lidas


def extrai_nomes(doc, paginas, tol=6.0):
    """{numero: descricao} — serve para PROVAR que o numero da TACO e o
    mesmo id usado na base da plataforma."""
    nomes = {}
    for p in paginas:
        pg = doc[p]
        y_num, y_desc = y_do_titulo(pg, "Número"), y_do_titulo(pg, "Descrição")
        if y_num is None or y_desc is None:
            continue
        for itens in linhas_da_pagina(pg):
            num = None
            for y, tok in itens:
                if abs(y - y_num) <= tol and re.fullmatch(r"\d{1,3}", tok):
                    num = int(tok)
            if num is None:
                continue
            partes = [(y, t) for y, t in itens if y_desc - 95 < y < y_num - 8]
            if partes:
                nomes[num] = " ".join(t for _, t in sorted(partes, key=lambda i: -i[0]))
    return nomes


def carrega_base_app():
    js = open(BASE_APP, encoding="utf-8").read()
    i = js.index("[", js.index("window.ALIMENTOS"))
    return json.loads(js[i:js.rindex("]") + 1])


def palavras_norm(s):
    s = sem_acento(s).lower()
    return " ".join(re.sub(r"[^a-z0-9 ]", " ", s).split())


def main():
    doc = fitz.open(PDF)
    sodio, n1 = extrai_coluna(doc, PAGS_TABELA1, "Sódio")
    # Na Tabela 2 o titulo vem hifenizado em duas linhas ("Sa-" / "turados");
    # a segunda metade e a ancora estavel.
    satur, n2 = extrai_coluna(doc, PAGS_TABELA2, "turados", tol=10.0)
    nomes = extrai_nomes(doc, PAGS_TABELA1)
    doc.close()

    print(f"Tabela 1: {n1} linhas -> sodio de {len(sodio)} alimentos")
    print(f"Tabela 2: {n2} linhas -> saturada de {len(satur)} alimentos")

    # ---- validacao: o numero da TACO e o id da base do app? ----
    base = carrega_base_app()
    ok = divergente = 0
    problemas = []
    for a in base:
        t = nomes.get(a["id"])
        if t is None:
            continue
        if palavras_norm(a["nome"]).startswith(palavras_norm(t)):
            ok += 1
        else:
            divergente += 1
            problemas.append((a["id"], a["nome"], t))

    print(f"\nAlinhamento id x numero TACO: {ok} confirmados, {divergente} divergentes")
    for i, x, y in problemas[:10]:
        print(f"  #{i}\n    base do app: {x}\n    PDF da TACO: {y}")

    if divergente:
        print("\nABORTADO: com id desalinhado o sodio iria para o alimento errado.")
        sys.exit(1)

    json.dump({"_fonte": FONTE,
               "_tabela": "TACO 4a edicao ampliada e revisada, NEPA/Unicamp, 2011",
               "_unidades": {"sodio": "mg/100g", "saturada": "g/100g"},
               "sodio": sodio, "saturada": satur},
              open("taco_sodio_saturada.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\ntaco_sodio_saturada.json gravado.")


if __name__ == "__main__":
    main()
