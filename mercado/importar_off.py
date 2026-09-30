#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IMPORTADOR OPEN FOOD FACTS -> base local do app "No mercado com a Nutri Ana".

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
      python importar_off.py --marcas flormel,hey-mu --anexar

--marcas busca pela MARCA em vez da categoria: e o jeito de garantir na base
as marcas que a Ana indica no consultorio (MARCAS_DA_NUTRI na edge function
analisar-rotulo), que a busca por categoria pode nao alcancar. O produto
entra na primeira categoria da lista abaixo que a OFF atribuir a ele; doce
sem categoria conhecida (doce de leite, brigadeiro) entra em "candies".

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
#
# O TERCEIRO CAMPO SAO SINONIMOS DA OFF (26/08/2026). A taxonomia deles nem
# sempre e a prateleira: "beans" no Brasil tem 6 produtos e
# "legumes-and-their-products" tem 183; "oats" tem 1 e "oat-flakes" tem 41.
# Os sinonimos sao importados JUNTO e gravados com a tag da categoria da
# casa -- a IA continua escolhendo entre as mesmas categorias de sempre, e
# quem muda e so de onde vem o produto.
CATEGORIAS = [
    # A ORDEM IMPORTA, e foi ela que deixou seis categorias vazias ate
    # 26/08/2026. Um codigo de barras entra UMA vez (a chave da
    # mercado_produtos e o codigo), entao a primeira categoria que o
    # reivindica fica com ele -- e a edge function procura alternativa com
    # `.eq("categoria_tag", ...)`, sem plano B. Com "breakfast-cereals" antes
    # de "granolas", as 59 granolas da base foram todas arquivadas como
    # cereal matinal: a pessoa fotografava uma granola, o modelo classificava
    # como "Granolas", e a categoria estava vazia. O mesmo com azeite dentro
    # de oleo vegetal, mel dentro de adocante e aveia dentro de farinha.
    #
    # Por isso as ESPECIFICAS vem primeiro. Regra ao acrescentar categoria:
    # se ela e um recorte de outra que ja esta na lista, entra ACIMA dela.
    ("granolas",                      "Granolas"),
    ("olive-oils",                    "Azeites"),
    ("honeys",                        "Meis"),
    ("sugars",                        "Acucares"),
    ("oats",                          "Aveia", ["oat-flakes", "rolled-oats"]),
    # Amendoim e leguminosa: 32 dos 39 produtos de "peanut-butters"
    # vinham em "legumes-and-their-products" e a pasta de amendoim
    # ficava zerada com o feijao. Especifica acima da ampla.
    ("peanut-butters",                "Pasta de amendoim"),
    ("beans",                         "Feijao e leguminosas",
     ["legumes-and-their-products", "canned-beans"]),
    ("biscuits",                      "Biscoitos e bolachas"),
    ("breakfast-cereals",             "Cereais matinais"),
    ("cereal-bars",                   "Barras de cereal"),
    ("protein-bars",                  "Barras de proteina"),
    ("yogurts",                       "Iogurtes"),
    ("cheeses",                       "Queijos"),
    ("milks",                         "Leites"),
    ("plant-based-milk-alternatives", "Bebidas vegetais"),
    ("breads",                        "Paes"),
    # Macarrao instantaneo tambem e massa: 15 dos 38 caiam em "pastas".
    ("instant-noodles",               "Macarrao instantaneo"),
    ("pastas",                        "Massas e macarrao"),
    ("rices",                         "Arroz"),
    ("flours",                        "Farinhas"),
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
    ("jams",                          "Geleias"),
    ("coffees",                       "Cafes"),
    ("teas",                          "Chas"),
    ("butters",                       "Manteigas"),
    ("margarines",                    "Margarinas"),
    ("vegetable-oils",                "Oleos vegetais"),
    ("mayonnaises",                   "Maioneses"),
    ("ketchup",                       "Ketchup"),
    ("sauces",                        "Molhos"),
    ("canned-tuna",                   "Atum e sardinha em lata"),
    ("sausages",                      "Salsichas e linguicas"),
    ("hams",                          "Presunto e frios"),
    # Pizza congelada e congelado: com "frozen-foods" antes, Pizzas ficava
    # com 6 dos 22 da OFF. Terceiro caso da mesma regra (ver o topo).
    ("pizzas",                        "Pizzas", ["frozen-pizzas"]),
    ("frozen-foods",                  "Congelados"),
    # Sopas e a UNICA categoria que nao alcanca 3 marcas uteis (4 linhas,
    # 2 marcas em 26/08/2026). "instant-soups" e "dehydrated-soups" sao
    # sopa de pacote, a mesma prateleira. Caldo em cubo (broths/bouillons)
    # ficou de FORA de proposito: e sodio quase puro e nunca passaria no
    # ranking -- entraria so para engordar a contagem.
    ("soups",                         "Sopas", ["instant-soups", "dehydrated-soups"]),
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


def buscar_marca(marca, pagina):
    q = urllib.parse.urlencode({
        "countries_tags_en": "brazil",
        "brands_tags": marca,
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
            if e.code in (429, 503):
                time.sleep(INTERVALO * (tentativa + 2))
                continue
            return None
        except Exception:
            time.sleep(INTERVALO)
    return None


def categoria_do_produto(p):
    tags = [t.split(":", 1)[-1] for t in (p.get("categories_tags") or [])]
    # A tupla local tem mais campos (sinonimos): so os dois primeiros servem aqui.
    for cat in CATEGORIAS:
        if cat[0] in tags:
            return cat[0], cat[1]
    return "candies", "Balas e doces"


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


def sinonimos(c):
    """(tag, nome) ou (tag, nome, [sinonimos]) -> as tags da OFF a buscar."""
    return [c[0]] + (list(c[2]) if len(c) > 2 else [])


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

    marcas = []
    if "--marcas" in sys.argv:
        marcas = [m for m in sys.argv[sys.argv.index("--marcas") + 1].split(",") if m]
        alvo = []

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
    vazias = []
    with open(SAIDA, modo, encoding="utf-8") as out:

        def importar(cat):
            """Devolve quantos produtos entraram nesta categoria DA CASA."""
            tag, nome_pt = cat[0], cat[1]
            guardados = 0
            for off in sinonimos(cat):
                for pg in range(1, paginas + 1):
                    d = buscar(off, pg)
                    time.sleep(INTERVALO)
                    if not d:
                        print("  ! %s pagina %d: falhou" % (off, pg), flush=True)
                        break
                    prods = d.get("products") or []
                    for p in prods:
                        r = util(p)
                        if not r or not r["code"] or r["code"] in vistos:
                            continue
                        vistos.add(r["code"])
                        # Sempre a tag DA CASA, nunca a do sinonimo: e por ela
                        # que a edge function procura as alternativas.
                        r["categoria_tag"] = tag
                        r["categoria"] = nome_pt
                        out.write(json.dumps(r, ensure_ascii=False) + "\n")
                        guardados += 1
                    if len(prods) < 100:
                        break
            return guardados

        for cat in alvo:
            n = importar(cat)
            total += n
            if n == 0:
                vazias.append(cat)
            print("%-28s (%-30s) -> %4d utilizaveis" % (cat[1], cat[0], n), flush=True)

        # SEGUNDA PASSADA. A OFF devolve 503 sem aviso e sem padrao, e a
        # categoria volta VAZIA como se nao houvesse produto nenhum -- foi
        # assim que granolas, azeites, meis e acucares ficaram um mes fora,
        # com o app lendo o rotulo e sem ter o que oferecer no lugar.
        # Categoria zerada e sempre suspeita, entao se repassa.
        if vazias:
            print("\nRepassando %d categoria(s) que voltaram vazias..." % len(vazias), flush=True)
            time.sleep(INTERVALO * 3)
            ainda = []
            for cat in vazias:
                n = importar(cat)
                total += n
                if n == 0:
                    ainda.append(cat[0])
                print("  %-26s -> %4d" % (cat[1], n), flush=True)
            if ainda:
                print("\n  ATENCAO: seguem sem produto: %s" % ", ".join(ainda))
                print("  Conferir se a tag ainda existe na OFF antes de aceitar o zero.")

        for marca in marcas:
            guardados = 0
            for pg in range(1, paginas + 1):
                d = buscar_marca(marca, pg)
                time.sleep(INTERVALO)
                if not d:
                    print("  ! marca %s pagina %d: falhou" % (marca, pg), flush=True)
                    break
                prods = d.get("products") or []
                for p in prods:
                    r = util(p)
                    if not r or not r["code"] or r["code"] in vistos:
                        continue
                    vistos.add(r["code"])
                    r["categoria_tag"], r["categoria"] = categoria_do_produto(p)
                    out.write(json.dumps(r, ensure_ascii=False) + "\n")
                    guardados += 1
                    total += 1
                if len(prods) < 100:
                    break
            print("marca %-22s -> %4d utilizaveis" % (marca, guardados), flush=True)
    print("\nTOTAL: %d produtos em %s" % (total, SAIDA))


if __name__ == "__main__":
    main()
