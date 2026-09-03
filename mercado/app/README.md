# RotuLens — "Instalar app" e tutorial do primeiro acesso

Dois arquivos soltos, sem dependência, para colar no app do RotuLens
(`Sites/site/mercado/`):

| Arquivo | O que faz |
|---|---|
| `pwa-rotulens.js` | O botão **"Instalar app"**, igual ao da plataforma |
| `tutorial-primeiro-acesso.js` | No primeiro acesso, escurece a tela e **aponta setas** para o que fazer |
| `exemplo.html` | Página de teste, para ver os dois funcionando |

> Estes arquivos moram aqui porque a sessão em que foram escritos não tinha
> acesso ao repositório `site`. **O lugar definitivo deles é
> `Sites/site/mercado/`** — depois de copiados para lá, esta pasta pode sair.

---

## Como ligar

No fim do `<body>` do app:

```html
<script src="pwa-rotulens.js"></script>
<script src="tutorial-primeiro-acesso.js"></script>
```

E marque nas telas o que as setas devem apontar:

```html
<button data-tour="foto">Fotografar rótulo</button>
<button data-tour="ingredientes">Fotografar ingredientes</button>
<div    data-tour="resultado">…a leitura…</div>
```

Passo sem elemento na página é **pulado em silêncio**: dá para marcar um
alvo por vez, e nada quebra quando uma tela muda. Se nenhum alvo existir,
aparece um cartão de boas-vindas no meio da tela, sem seta.

Depois da primeira leitura de rótulo, chame:

```js
RotuLensInstalar.oferecer();
```

## As duas decisões que explicam o resto

**1. O convite de instalar espera a primeira leitura.**
Na plataforma, quem abre a página é paciente da Ana e instalar de cara faz
sentido. No RotuLens, quem chega veio de um anúncio e ainda não viu o app
fazer nada — e quem dispensa o convite fica 7 dias sem vê-lo de novo. Então
o botão só aparece depois de `oferecer()`, ou sozinho depois de 45 s, para o
convite não deixar de existir por causa de uma chamada esquecida.

**2. O tutorial existe porque a primeira tela pede uma FOTO.**
Se a pessoa não entende em dois segundos o que fotografar, ela sai — e essa
saída custa o clique que foi pago no anúncio. Três passos curtos resolvem:
a tabela, os ingredientes, onde a resposta aparece.

## Detalhes que já estão resolvidos

- **iPhone** nunca mostra o balão de instalar: o botão abre o passo a passo
  de Compartilhar → Adicionar à Tela de Início. **Firefox e Samsung
  Internet** também não disparam nada e caem no passo a passo do menu.
- Alvo **mais alto que a tela** (a área de resultado é uma página inteira):
  a luz fica no começo dele, senão não sobraria tela para escurecer e a
  seta apontaria para fora do visível.
- Alvo **fora da tela**: rola até ele antes de apontar.
- Girar o celular e rolar a página **reposicionam** a seta.
- `prefers-reduced-motion`, `Esc` para fechar, `Enter`/`→` para avançar,
  e foco visível nos botões.
- Nada é escrito no `localStorage` sem `try/catch` (navegação privada
  no iOS lança exceção em vez de devolver vazio).

## Para gravar vídeo ou testar

```
.../mercado/?tutorial=1        abre o tutorial de novo
RotuLensTutorial.iniciar()     idem, pelo console
RotuLensTutorial.esquecer()    volta a ser "primeiro acesso"
RotuLensInstalar.forcar()      mostra o botão de instalar na hora
```

O `?tutorial=1` é o jeito de gravar a tela do tutorial quantas vezes
precisar — útil justo para o vídeo do roteiro
(`ROTEIRO-VIDEO-ROTULENS.md`), em que o app precisa aparecer como se fosse
o primeiro acesso da pessoa.

## Personalizar

```html
<script src="pwa-rotulens.js" data-cor="#0E4C5C"
        data-manifest="manifest.webmanifest" data-titulo="RotuLens"></script>
<script src="tutorial-primeiro-acesso.js" data-cor="#0E4C5C"></script>
```

Para trocar os textos dos passos, antes do primeiro acesso da pessoa:

```js
RotuLensTutorial.configurar([
  { alvo: '[data-tour="foto"]', titulo: "…", texto: "…" }
]);
```
