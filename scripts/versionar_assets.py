#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Carimba ?v=<hash> nos <script src> e <link href> de assets locais dos HTMLs
do prototipo.

Por que: a Hostinger serve os assets com max-age de 7 dias, tem CDN na
frente e o portal ainda roda um service worker. Sem mudar a URL, publicar
uma correcao nao chega em quem ja abriu o app — nem para a Ana. Com o
hash no fim da URL, arquivo novo = URL nova, e nao ha cache velho para
servir. Arquivo que nao mudou mantem o mesmo hash e continua cacheado.

Uso:  python scripts/versionar_assets.py [--check]
      --check  so diz o que mudaria (nao escreve)
"""
import hashlib
import io
import os
import re
import sys

RAIZ = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prototipo")
# src="assets/js/x.js"  ou  href="assets/css/x.css"  (com ou sem ?v= antigo)
PADRAO = re.compile(r'((?:src|href)=")(assets/(?:js|css)/[A-Za-z0-9._\-/]+\.(?:js|css))(\?v=[A-Za-z0-9]+)?(")')


def hash_do(caminho):
    with open(caminho, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def main():
    check = "--check" in sys.argv
    cache = {}
    mudados, faltando = [], []

    for nome in sorted(os.listdir(RAIZ)):
        if not nome.endswith(".html"):
            continue
        caminho = os.path.join(RAIZ, nome)
        orig = io.open(caminho, encoding="utf-8").read()

        def troca(m):
            rel = m.group(2)
            alvo = os.path.join(RAIZ, rel.replace("/", os.sep))
            if not os.path.exists(alvo):
                faltando.append((nome, rel))
                return m.group(0)
            if rel not in cache:
                cache[rel] = hash_do(alvo)
            return m.group(1) + rel + "?v=" + cache[rel] + m.group(4)

        novo = PADRAO.sub(troca, orig)
        if novo != orig:
            mudados.append(nome)
            if not check:
                io.open(caminho, "w", encoding="utf-8", newline="").write(novo)

    for nome, rel in faltando:
        print("  ! nao encontrei", rel, "(citado em", nome + ")")
    print(("[check] " if check else "") + "%d HTML(s) %s, %d asset(s) distintos"
          % (len(mudados), "mudariam" if check else "atualizados", len(cache)))
    for n in mudados:
        print("   -", n)


if __name__ == "__main__":
    main()
