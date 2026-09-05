---
name: post-instagram
description: Cria post/carrossel para o Instagram da Ana Luisa Rocha Nutricionista, no padrão visual do feed (fundo creme, títulos itálicos magenta, caixa magenta, faixa em onda com a assinatura Ana). Use sempre que ela pedir um post, carrossel, card, reels ou legenda para o Instagram.
---

# Post de Instagram — padrão do feed

Sempre gerar as artes como um arquivo HTML de cards quadrados e publicar como Artifact,
partindo de `conteudo/instagram/_modelo-post.html`. Salvar o post novo em
`conteudo/instagram/<assunto>.html` e commitar.

## Identidade visual (não improvisar)

- **Fundo:** degradê creme `#FCF6E9` → `#F5EADA`.
- **Título:** Merienda 900 (fonte da marca, em `prototipo/assets/img/fonts/Merienda-VariableFont_wght.ttf`,
  embutida no HTML como @font-face base64), magenta `#7C1150`, quebrando em 2 linhas.
- **Texto:** Montserrat, cinza `#54524F`, com os termos-chave em magenta e negrito.
- **Caixa de tópicos:** retângulo magenta arredondado, texto creme, para listas práticas.
- **Faixa inferior:** onda magenta baixa (`height:9.5cqw`), só acabamento — nunca deve
  encostar no texto (o card usa `padding-bottom:17cqw`).
- **Assinatura:** `conteudo/instagram/img/ana-logo.png` em **branco**
  (`filter:brightness(0) invert(1)`), pequena, no canto inferior esquerdo, dentro da faixa.
  **A capa não leva assinatura nem faixa.**

## Formato

Feed vertical **1080×1350** (4:5) — ocupa mais tela no feed.

## Estrutura padrão do carrossel

Máximo de 4 a 5 cards — ela prefere post curto e escaneável.

1. **Capa** — imagem ocupando o card inteiro, sem corte e sem faixa. Se a imagem for
   horizontal, preencher o quadrado com a mesma imagem desfocada ao fundo (`.capa .fundo`)
   e a imagem inteira por cima em `object-fit:contain`.
2. **Conteúdo/mitos** — lista numerada com título curto em magenta e explicação em 1–2 linhas.
3. **Nutrição** — sempre incluir a parte prática do prato, com a caixa magenta.
   Foto de comida entra como fundo bem clarinho (`opacity:.32`, saturação baixa) sob o texto.
4. **CTA** — fecha lembrando que comida não substitui acompanhamento, e pede o comentário
   com uma palavra-chave.

## Regras de conteúdo

- Português do Brasil, tom direto e acolhedor, sem jargão sem explicação.
- Nutrição sempre presente e com o mecanismo explicado em linguagem simples
  (ex.: menos pico de insulina → menos estímulo androgênico).
- Nunca prometer cura; reforçar acompanhamento profissional.
- Entregar também a legenda pronta com hashtags, em arquivo `.md` ao lado.

## Exportar em PNG

Renderizar os cards com Playwright (Chromium em `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`),
fotografando cada `.frame` em 1080×1350 (feed vertical, `aspect-ratio:1080/1350`). Incluir `<meta charset="utf-8">` na cópia usada para
renderizar, senão os acentos saem quebrados. **Conferir cada PNG depois de qualquer mudança de
layout** — alterar altura de imagem reposiciona as marcações em vermelho.

## Imagens

Claude não gera imagens nesta configuração. Deixar molduras tracejadas com o prompt
descrito no estilo do feed (still life fotorrealista em mesa clara com luz suave, ou
aquarela pastel) e encaixar os arquivos quando a Ana enviar — sempre embutidos em
base64 no HTML, para o Artifact renderizar.

## Checar antes de publicar

- Nenhum texto cortado ou por baixo da faixa.
- Assinatura no lugar (regras de `position` não podem ser anuladas por
  `.foto>*{position:relative}` — usar seletores específicos).
- Imagem da capa inteira, sem cortar palavras.
