# No mercado com a Nutri Ana

App gratuito e instalável em que a pessoa fotografa o rótulo de um produto no
supermercado e recebe, na hora: a leitura da tabela, a explicação dos
ingredientes que ninguém entende e — quando o produto não é boa escolha —
**pelo menos três marcas** para levar no lugar.

Onde cada pedaço mora:

| Parte | Caminho |
|---|---|
| App (telas, PWA) | `Sites/site/mercado/` |
| Chamada de IA + regras | `Plataforma Nutri/supabase/functions/analisar-rotulo/` |
| Banco (tabelas, RLS) | `Plataforma Nutri/supabase/migrations/0051_mercado_com_a_nutri.sql` |
| Base de produtos | esta pasta (`importar_off.py`, `carregar_produtos.py`) |
| Divulgação | seção `#app` em `Sites/site/index.html` |

Endereço: **https://nutrianarocha.github.io/site/mercado/**

---

## As três decisões que explicam o resto

**1. A foto não é guardada em lugar nenhum.**
Diferente do diário do prato (migração 0050), aqui não existe bucket. A imagem
vai em base64 no corpo da chamada, é lida pelo modelo e morre ali. Rótulo de
produto não tem valor clínico depois de lido, e o app aceita gente sem conta —
guardar foto de quem não tem `auth.uid()` criaria arquivo sem dono.

**2. As marcas vêm de uma base real, nunca da memória do modelo.**
A tabela `mercado_produtos` é um espelho do recorte brasileiro da
[Open Food Facts](https://br.openfoodfacts.org). O modelo apenas **escolhe**
dentro de uma lista que já existe na prateleira e escreve o porquê — ele nunca
inventa um produto. Num app que dá indicação de compra assinada por uma
nutricionista registrada, marca alucinada é risco profissional da Ana.

**3. A regra das três marcas está no código, não na boa vontade.**
Indicação de produto só se sustenta se não favorecer marca. Então: nunca menos
de três, sempre de **marcas diferentes**, e se a base não conseguir oferecer as
três, o app não indica nenhuma e diz isso em voz alta. A checagem acontece duas
vezes — antes de perguntar ao modelo e depois da resposta dele.

---

## De onde vem cada afirmação do app

Três camadas, com confiabilidade bem diferente. Vale ter isso claro porque é o
CRN da Ana que assina a tela.

| Camada | Fonte | Confiança |
|---|---|---|
| Regras e definições (diet, light, farinha enriquecida, limites "ALTO EM") | Legislação, escrita à mão no servidor | Alta — verificável, não passa pelo modelo |
| Números do produto | O modelo lendo a foto do rótulo | **Média — é o elo fraco, sem conferência** |
| Referência de alimento de verdade | TACO 4ª ed. (NEPA/Unicamp) | Alta — publicação oficial |
| Marcas alternativas | Open Food Facts (colaborativa) | Média — filtrada, ver abaixo |

**A TACO entrou como régua, não como substituta da OFF.** A Ana pediu a TACO
como base das respostas; ela não tem marca nem código de barras (é tabela de
alimento in natura e preparações), então não pode indicar produto de prateleira.
O que ela faz é dar o ponto de comparação oficial: quanto tem de sódio, saturada
e caloria o alimento de verdade equivalente. O mapa categoria → alimento está em
`REFERENCIA_TACO`, no topo de `analisar-rotulo/index.ts` — **são 26 escolhas de
nutricionista e a Ana deve revisá-las.**

Procedência: `mercado/extrai_taco.py` extrai sódio (Tabela 1) e gordura saturada
(Tabela 2) do PDF oficial hospedado pelo CFN, e **só grava depois de provar que o
número do alimento na TACO é o mesmo id da base da plataforma** (579 descrições
conferidas, 0 divergentes). Carregado pela migração `0052_taco_alimentos.sql`.
A TACO não tem campo de açúcar — traz carboidrato total —, então a comparação de
açúcar não aparece.

> Ao conferir a extração foi encontrado um erro antigo na base de alimentos da
> plataforma: o id 468 estava com o nome "Maria mole" e os macros de
> "Queijo, requeijão, cremoso". Corrigido em `alimentos-data.js`; afetava também
> o editor de plano alimentar.

## Por que a Open Food Facts precisa de filtro

A OFF é **colaborativa**: quem cadastra é usuário comum digitando o rótulo em
casa. Auditoria de 01/08/2026 nos 2.397 produtos da base:

- **Valores impossíveis**: 31 com sódio acima de 10 g/100 g, 13 acima de
  900 kcal/100 g, 4 com mais de 100 g de açúcar em 100 g de produto.
- **Dado faltando virando nota boa** — o pior, porque é silencioso. A função
  `penalidade()` lê ausência como zero: sem saturada declarada o produto pontua
  como se tivesse zero, e sem grupo NOVA pontua como se não fosse
  ultraprocessado (3 pontos, o mesmo peso de 15 g de açúcar). **56 dos 127
  primeiros colocados chegaram lá por falta de dado, não por serem melhores.**

Por isso `dadoConfiavel()` só deixa disputar quem tem tabela completa
(açúcar, saturada, sódio e NOVA) e plausível. Custo medido: **uma** categoria
(sopas) perde a sugestão por ficar com menos de 3 marcas; as outras 40 seguem.

---

## Por que espelhar a Open Food Facts em vez de consultar ao vivo

A API de **busca** da OFF limita a ~10 requisições por minuto e devolve `503`
acima disso (medido: metade das categorias falhou numa sondagem sem pausa). As
edge functions da Supabase saem por poucos IPs compartilhados, então duas
pessoas usando o app ao mesmo tempo já derrubariam a busca de alternativas.

Espelhado, a busca vira uma query SQL local: instantânea, sem limite e imune à
OFF sair do ar. O dump mundial (1,2 GB comprimido) foi descartado por peso — o
recorte por categoria entrega o que o app usa por uma fração disso.

## Atualizar a base de produtos

A OFF recebe produto novo toda semana. Para atualizar (dá para rodar quantas
vezes quiser — a chave é o código de barras e nada duplica):

```bash
cd "Plataforma Nutri/mercado"
python importar_off.py --paginas 3        # ~50 min, respeitando o limite da OFF
python carregar_produtos.py               # sobe para o Postgres
```

Se alguma categoria voltar com `0 utilizaveis`, foi `503` — repasse só nela:

```bash
python importar_off.py --somente olive-oils,honeys,granolas --anexar
python carregar_produtos.py
```

Só entra na base produto com **nome, energia, açúcar e sódio por 100 g**. Sem
esses números não há comparação possível, e uma alternativa sem tabela seria a
Ana recomendando às cegas.

## Limites diários (freio de custo)

A conta da OpenAI é da Ana e o app é grátis, então o teto é de sobrevivência,
não comercial. Ficam no topo de `analisar-rotulo/index.ts`:

| Quem | Leituras por dia |
|---|---|
| Visitante (sem entrar) | 3 |
| Paciente da Ana ou a própria nutri | 15 |
| Quem comprou um pacote | 25 (teto anti-vazamento, não é o saldo) |
| O app inteiro | 150 (quem pagou não esbarra nele) |

Quem tem acesso liberado é decidido pela função `mercado_acesso_liberado`, no
banco: tem ficha de paciente, ou é nutri.

## Pacote de leituras (o produto pago)

O app segue gratuito. Quem precisa de mais que o limite do dia compra **50
leituras por R$ 9,90**, que **não vencem**. Não é assinatura: cobrança
recorrente exigiria cadastro, cartão guardado, tela de cancelamento e régua de
inadimplência — peso demais para um produto de R$ 9,90, e o público está no
corredor do mercado, não querendo assinar nada.

**A identidade é um código, não um cadastro** (`R7QK-3M9F`). O `dispositivo` do
localStorage, que já governa o limite grátis, não serve para guardar uma
COMPRA: some quando a pessoa limpa o navegador ou troca de celular, e aí ela
pagou e perdeu. O código sobrevive a isso — ela anota, digita em qualquer
aparelho, e os créditos voltam.

Fluxo, ponta a ponta:

1. Botão de compra → link do InfinitePay (`LINK_COMPRA` em `mercado.js`), criado
   pela API com `redirect_url` de volta para o próprio app.
2. Depois de pagar, a InfinitePay devolve a pessoa ao app com
   `transaction_nsu`, `slug`, `order_nsu` e `receipt_url` na query string.
   **A volta não é automática**: confirmado na primeira compra real (05/08/2026),
   o checkout espera alguns segundos e mostra um botão de voltar para a página —
   quem fecha a aba antes de tocar nele paga e o código nunca nasce, porque os
   dados do pagamento só chegam nessa volta. É por isso que o passo a passo da
   tela de compra insiste nesse ponto.
3. `mercado.js` → `resgatarDaURL()` chama a edge function `mercado-creditos`
   com `acao:"resgatar"`.
4. A function pergunta ao **`payment_check` da InfinitePay** se aquele pagamento
   existe e foi pago, confere o valor contra a tabela `PACOTES`, e só então
   grava o pacote e devolve o código.

**Nada é criado antes do `payment_check` responder `paid:true`.** Os campos vêm
da barra de endereço, ou seja, de um navegador qualquer — sem essa conferência,
qualquer pessoa inventaria um `transaction_nsu` e ganharia 50 leituras.

Detalhes que não são acidentais:

- **`transaction_nsu` é UNIQUE** na tabela: recarregar a página de retorno dez
  vezes devolve o mesmo código, não dez pacotes.
- **O crédito é debitado depois da leitura dar certo**, não antes. Se a OpenAI
  falhar ou a foto não for um rótulo, a pessoa não paga pelo erro. O risco do
  outro lado (duas leituras simultâneas com o último crédito) custa uma leitura.
- **O débito é atômico** (`mercado_consumir_credito`): o `where creditos_usados
  < creditos_total` dentro do próprio UPDATE é o que impede a corrida. Ler o
  saldo e depois atualizar seria a versão com bug.
- **`mercado_creditos` é deny-all no RLS** — só service_role toca. É dinheiro.
- **O alfabeto do código não tem 0/O, 1/I/L nem 5/S**: são os pares que fazem
  alguém digitar errado e achar que foi roubada.
- **A conferência de valor aceita a MAIS, nunca a menos**: a InfinitePay repassa
  o juros do parcelado ao comprador, então quem paga em 3x manda mais centavos
  que o preço de tabela.

### Quando alguém perde o código

Não existe recuperação automática, **de propósito**. Depois de perder o código, a
única prova que a compradora tem é o comprovante do pagamento — e conferir
comprovante é trabalho de gente. Uma tela que devolvesse o código a quem
digitasse um e-mail entregaria as leituras de qualquer uma para qualquer uma, e
mandar o código por e-mail não é opção enquanto o envio do projeto não sair do
sandbox (ver `project-email-smtp-dominio`).

O app previne e, quando falha, encaminha:

- na tela de compra, um passo a passo diz **antes de pagar** que vai nascer um
  código e que é ele que guarda as leituras;
- na tela do código, o botão **Guardar meu código** abre o compartilhar do
  celular (WhatsApp, Notas) ou copia no desktop;
- os dois estados têm o link **"perdeu o código?"**, que abre o WhatsApp da Ana
  (`WHATS_ANA` em `mercado.js`) com a mensagem já escrita pedindo o comprovante.

Para atender, com a data e o valor do comprovante em mãos, no SQL Editor:

```sql
select codigo,
       creditos_total - creditos_usados as restam,
       valor_centavos,
       to_char(criado_em at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI') as quando
from mercado_creditos
order by criado_em desc
limit 20;
```

Poucas compras por dia: achar pela data e pelo valor é imediato. Se um dia o
volume crescer a ponto de haver duas compras do mesmo valor no mesmo minuto,
aí sim vale guardar um contato no resgate — é dado pessoal, então só quando
pagar por si.

Para mudar o preço ou criar outro pacote: edite `PACOTES` em
`mercado-creditos/index.ts`, crie o link novo na API de checkout e atualize
`LINK_COMPRA`/`PACOTE_*` em `mercado.js`. Pagamentos antigos continuam valendo
pelo que eram na época, porque o crédito é gravado no resgate.

## Conformidade (Res. CFN 856/2026)

- O app faz **orientação geral sobre leitura de rótulo** — não é avaliação
  nutricional individualizada nem prescrição. Está escrito na tela de resultado
  e na tela de conta.
- **Art. 37** (conteúdo com IA): declarado em toda leitura e no rodapé.
- **Indicação de marca**: nunca menos de três, sempre de marcas diferentes, com
  a origem do dado declarada e a informação de que a Ana não recebe de nenhuma.
- O prompt proíbe diagnosticar, prescrever, prometer resultado, falar em doença
  e moralizar comida ("veneno", "pecado", "engorda").
- As explicações fixas de **diet/light** são escritas no servidor, não pelo
  modelo — têm definição em lei (Portaria SVS/MS 29/1998 e RDC 54/2012) e num
  teste o modelo simplesmente ignorou a instrução de incluí-las.
