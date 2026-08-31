#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IMPORTADOR OPEN FOOD FACTS -> base local do RotuLens.

POR QUE ESPELHAR EM VEZ DE CONSULTAR AO VIVO:
a API de BUSCA da Open Food Facts limita a ~10 requisicoes por minuto e devolve
503 acima disso. Como todas as edge functions da Supabase saem por poucos IPs
compartilhados, duas pessoas no mercado ao mesmo tempo ja derrubariam a busca de
alternativas. Espelhando o recorte brasileiro no Postgres da Ana, a busca vira
uma query SQL local: instantanea, sem limite e imune a OFF estar fora do ar.

RECORTE: nao sao os 35 mil produtos do Brasil, e sim as categorias que a pessoa
de fato pega na prateleira do supermercado (lista CATEGORIAS abaixo), e so os
que tem tabela nutricional utilizavel -- produto sem acucar/sodio declarado nao
serve para comparar, entao entraria so para poluir o ranking.

SAIDA: produtos.jsonl (uma linha por produto), consumido por gerar_sql.py.

Uso:  python importar_off.py [--paginas 3]
      python importar_off.py --somente olive-oils,honeys --anexar

A OFF derruba requisicao com 503 quando esta sob carga, e uma categoria
pode voltar vazia sem ter acabado. Dai o --somente: repassar so nas que
falharam, sem refazer a importacao inteira. Com --anexar o arquivo de
saida e complementado em vez de reescrito.
"""
import json, os, sys, time, urllib.request, urllib.parse, urllib.error

UA = "NoMercadoNutriAna/1.0 (nutrianalrocha@gmail.com; app de leitura de rotulo)"
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "produtos.jsonl")

# Intervalo entre buscas. A OFF documenta 10 req/min; 7s da margem para nao
# levar 503 no meio da importacao e ter de recomecar.
INTERVALO = 7.0

# Categorias da OFF (tags em ingles) mapeadas para o nome que a pessoa usa.
# O nome em portugues e o que a IA recebe para classificar o produto fotografado,
# entao precisa soar como prateleira de mercado, nao como taxonomia.
CATEGORIAS = [
    ("biscuits",                      "Biscoitos e bolachas"),
    ("breakfast-cereals",             "Cereais matinais"),
    ("granolas",                      "Granolas"),
    ("cereal-bars",                   "Barras de cereal"),
    ("protein-bars",                  "Barras de proteina"),
    ("yogurts",                       "Iogurtes"),
    ("cheeses",                       "Queijos"),
    ("milks",                         "Leites"),
    ("plant-based-milk-alternatives", "Bebidas vegetais"),
    ("breads",                        "Paes"),
    ("pastas",                        "Massas e macarrao"),
    ("rices",                         "Arroz"),
    ("beans",                         "Feijao e leguminosas"),
    ("flours",                        "Farinhas"),
    ("oats",                          "Aveia"),
    ("tapiocas",                      "Tapioca e goma"),
    ("chocolates",                    "Chocolates"),
    ("candies",                       "Balas e doces"),
    ("ice-creams",                    "Sorvetes"),
    ("snacks",                        "Salgadinhos e petiscos"),
    ("crisps",                        "Batata frita de pacote"),
    ("sodas",                         "Refrigerantes"),
    ("fruit-juices",                  "Sucos"),
    ("energy-drinks",                 "Energeticos"),
    ("sweeteners",                    "Adocantes"),
    ("sugars",                        "Acucares"),
    ("jams",                          "Geleias"),
    ("honeys",                        "Meis"),
    ("peanut-butters",                "Pasta de amendoim"),
    ("coffees",                       "Cafes"),
    ("teas",                          "Chas"),
    ("butters",                       "Manteigas"),
    ("margarines",                    "Margarinas"),
    ("vegetable-oils",                "Oleos vegetais"),
    ("olive-oils",                    "Azeites"),
    ("mayonnaises",                   "Maioneses"),
    ("ketchup",                       "Ketchup"),
    ("sauces",                        "Molhos"),
    ("canned-tuna",                   "Atum e sardinha em lata"),
    ("sausages",                      "Salsichas e linguicas"),
    ("hams",                          "Presunto e frios"),
    ("frozen-foods",                  "Congelados"),
    ("pizzas",                        "Pizzas"),
    ("instant-noodles",               "Macarrao instantaneo"),
    ("soups",                         "Sopas"),
    ("eggs",                          "Ovos"),
    ("salts",                         "Sais"),
]

CAMPOS = ",".join([
    "code", "product_name", "product_name_pt", "brands", "quantity",
    "categories_tags", "labels_tags", "additives_tags", "nova_group",
    "nutriscore_grade", "ingredients_text_pt", "ingredients_text", "nutriments",
])


def buscar(tag, pagina):
    q = urllib.parse.urlencode({
        "countries_tags_en": "brazil",
        "categories_tags_en": tag,
        "fields": CAMPOS,
        "page_size": 100,
        "page": pagina,
    })
    url = "https://world.openfoodfacts.org/api/v2/search?" + q
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # 503 e a OFF pedindo calma. Espera progressivamente mais.
            if e.code in (429, 503):
                time.sleep(INTERVALO * (tentativa + 2))
                continue
            return None
        except Exception:
            time.sleep(INTERVALO)
    return None


def util(p):
    """So entra produto que da para COMPARAR: precisa de nome, e de energia,
    acucar e sodio por 100 g. Sem esses tres nao ha ranking possivel -- e uma
    alternativa sem tabela seria a Ana recomendando as cegas."""
    n = p.get("nutriments") or {}
    nome = (p.get("product_name_pt") or p.get("product_name") or "").strip()
    if len(nome) < 3:
        return None
    if n.get("energy-kcal_100g") is None or n.get("sugars_100g") is None:
        return None
    sodio = n.get("sodium_100g")
    if sodio is None and n.get("salt_100g") is not None:
        sodio = float(n["salt_100g"]) / 2.5     # sal -> sodio
    if sodio is None:
        return None
    return {
        "code": str(p.get("code") or "").strip(),
        "nome": nome[:180],
        "marca": (p.get("brands") or "").strip()[:120],
        "quantidade": (p.get("quantity") or "").strip()[:60],
        "nova": p.get("nova_group"),
        "nutriscore": (p.get("nutriscore_grade") or "").strip()[:2],
        "ingredientes": (p.get("ingredients_text_pt") or p.get("ingredients_text") or "").strip()[:2000],
        "aditivos": len(p.get("additives_tags") or []),
        "labels": [t for t in (p.get("labels_tags") or [])][:12],
        "kcal": n.get("energy-kcal_100g"),
        "ptn": n.get("proteins_100g"),
        "cho": n.get("carbohydrates_100g"),
        "acucar": n.get("sugars_100g"),
        "fibra": n.get("fiber_100g"),
        "lip": n.get("fat_100g"),
        "sat": n.get("saturated-fat_100g"),
        "sodio": sodio,
    }


def main():
    paginas = 3
    if "--paginas" in sys.argv:
        paginas = int(sys.argv[sys.argv.index("--paginas") + 1])

    alvo = CATEGORIAS
    if "--somente" in sys.argv:
        quais = set(sys.argv[sys.argv.index("--somente") + 1].split(","))
        alvo = [c for c in CATEGORIAS if c[0] in quais]
        if not alvo:
            print("Nenhuma categoria conhecida em --somente")
            return

    modo = "a" if "--anexar" in sys.argv else "w"

    # Ja no arquivo: evita regravar produto que veio na primeira passada.
    vistos = set()
    if modo == "a" and os.path.exists(SAIDA):
        with open(SAIDA, encoding="utf-8") as f:
            for l in f:
                l = l.strip()
                if l:
                    try:
                        vistos.add(json.loads(l)["code"])
                    except Exception:
                        pass

    total = 0
    with open(SAIDA, modo, encoding="utf-8") as out:
        for tag, nome_pt in alvo:
            guardados = 0
            for pg in range(1, paginas + 1):
                d = buscar(tag, pg)
                time.sleep(INTERVALO)
                if not d:
                    print("  ! %s pagina %d: falhou" % (tag, pg), flush=True)
                    break
                prods = d.get("products") or []
                for p in prods:
                    r = util(p)
                    if not r or not r["code"] or r["code"] in vistos:
                        continue
                    vistos.add(r["code"])
                    r["categoria_tag"] = tag
                    r["categoria"] = nome_pt
                    out.write(json.dumps(r, ensure_ascii=False) + "\n")
                    guardados += 1
                    total += 1
                if len(prods) < 100:
                    break
            print("%-28s (%-30s) -> %4d utilizaveis" % (nome_pt, tag, guardados), flush=True)
    print("\nTOTAL: %d produtos em %s" % (total, SAIDA))


if __name__ == "__main__":
    main()
