/* ============================================================
   GRAVADOR DA CONSULTA — o áudio vira texto e desaparece.

   Fluxo: consentimento → grava → transcreve por segmento →
   nota de prontuário → a nutri aplica na anamnese (ou descarta).

   Três decisões que explicam o código:

   1. NENHUM áudio é guardado. Cada segmento sobe para a edge function
      transcrever-consulta, vira texto e morre no request. Não há Storage,
      não há blob em IndexedDB, e ao encerrar os blobs locais são soltos.
      Voz de consulta é dado sensível de saúde — o texto entrega o mesmo
      sem o passivo.

   2. GRAVA EM SEGMENTOS de 5 minutos, cada um com seu MediaRecorder.
      Não é capricho: chunk de webm no meio de uma gravação não é
      decodificável sozinho, então "fatiar depois" não funciona. Parar e
      recomeçar o recorder produz arquivos válidos e independentes — e de
      quebra a transcrição vai aparecendo durante a consulta, e uma queda
      de conexão custa um trecho, não a consulta inteira.

   3. NADA é escrito na ficha sem clique. A nota abre no editor da
      anamnese; salvar continua sendo gesto da nutri.

   window.ConsultaAudio = { render, wire }
   ============================================================ */
(function () {
  "use strict";

  var SEGMENTO_MS = 5 * 60 * 1000;   // 5 min por arquivo
  var BITRATE = 24000;               // 24 kbps opus: fala limpa, 60 min ≈ 10 MB

  var atual = null;    // { p, ctx }
  var ligado = false;

  // Estado da sessão em curso. Zerado por encerrar() e por wire().
  var ses = null;
  /* ses = {
       id, stream, mr, timerSeg, timerRelogio,
       t0, pausadoEm, acumuladoMs,
       partes: [String],        // transcrição por segmento, em ordem
       enviando: Promise,       // fila sequencial de upload
       pendentes: int,
       gravando: bool, pausado: bool,
       nota: Object|null
     } */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function nl2br(s) { return esc(s).replace(/\n/g, "<br>"); }

  function toast(msg, erro) {
    if (atual && atual.ctx && atual.ctx.toast) atual.ctx.toast(msg, erro);
    else if (erro) alert(msg);
  }

  function el(id) { return document.getElementById(id); }

  function mmss(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  /* ---------- Suporte do navegador ----------
     Safari não faz webm; aceita mp4. A extensão do arquivo precisa bater
     com o mime, senão a OpenAI recusa o upload. */
  function formato() {
    if (typeof MediaRecorder === "undefined") return null;
    var opcoes = [
      { mime: "audio/webm;codecs=opus", ext: "webm" },
      { mime: "audio/webm", ext: "webm" },
      { mime: "audio/mp4", ext: "m4a" },
      { mime: "audio/ogg;codecs=opus", ext: "ogg" }
    ];
    for (var i = 0; i < opcoes.length; i++) {
      if (MediaRecorder.isTypeSupported(opcoes[i].mime)) return opcoes[i];
    }
    return null;
  }

  function suportado() {
    return !!(formato() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /* ---------- Chamadas à edge function ---------- */

  async function chamarNota(transcricao) {
    var db = await window.NutriDBReady;
    var res = await db.functions.invoke("transcrever-consulta", {
      body: { acao: "nota", transcricao: transcricao }
    });
    if (res.error) {
      var msg = res.error.message || "IA indisponível.";
      try {
        var det = await res.error.context.json();
        if (det && det.error) msg = det.error;
      } catch (_) { /* sem corpo JSON */ }
      throw new Error(msg);
    }
    var d = res.data || {};
    if (d.error) throw new Error(d.error);
    return d;
  }

  // O áudio sobe como multipart. O functions.invoke reconhece FormData e
  // deixa o corpo passar intacto (só JSON-ifica objeto comum), então dá
  // para reusar o mesmo caminho autenticado das outras chamadas.
  async function enviarSegmento(blob, ext) {
    var db = await window.NutriDBReady;
    var fd = new FormData();
    fd.append("audio", blob, "consulta." + ext);
    fd.append("gravacao_id", ses.id);

    var res = await db.functions.invoke("transcrever-consulta", { body: fd });
    if (res.error) {
      var msg = res.error.message || "Falha ao transcrever o trecho.";
      try {
        var det = await res.error.context.json();
        if (det && det.error) msg = det.error;
      } catch (_) { /* sem corpo JSON */ }
      if (msg === "consentimento_ausente") {
        msg = "O registro de consentimento não foi encontrado. Encerre e comece de novo.";
      }
      throw new Error(msg);
    }
    var d = res.data || {};
    if (d.error) throw new Error(d.error);
    return String(d.texto || "");
  }

  /* ---------- Fila de envio ----------
     Sequencial de propósito: mantém a ordem dos segmentos (que é a ordem
     da consulta) e não dispara cinco uploads juntos numa conexão de
     consultório. */
  function enfileirar(blob, ext, indice) {
    ses.pendentes++;
    pintar();
    ses.enviando = ses.enviando.then(function () {
      return enviarSegmento(blob, ext).then(function (texto) {
        ses.partes[indice] = texto;
      }).catch(function (e) {
        // Um trecho perdido não derruba a consulta: marca o buraco e segue.
        ses.partes[indice] = "[trecho não transcrito]";
        toast("Um trecho não foi transcrito. " + (e.message || ""), true);
      });
    }).then(function () {
      ses.pendentes--;
      pintar();
    });
    return ses.enviando;
  }

  /* ---------- Ciclo do MediaRecorder ---------- */

  function novoSegmento() {
    if (!ses || !ses.gravando || ses.pausado) return;
    var f = formato();
    var pedacos = [];
    var indice = ses.partes.length;
    ses.partes.push("");   // reserva o lugar: a ordem importa

    var mr;
    try {
      mr = new MediaRecorder(ses.stream, { mimeType: f.mime, audioBitsPerSecond: BITRATE });
    } catch (e) {
      mr = new MediaRecorder(ses.stream);
    }
    ses.mr = mr;

    mr.ondataavailable = function (ev) {
      if (ev.data && ev.data.size > 0) pedacos.push(ev.data);
    };
    mr.onstop = function () {
      var blob = pedacos.length ? new Blob(pedacos, { type: f.mime }) : null;
      pedacos = [];                     // solta a memória do áudio já fechado
      if (blob && blob.size > 1000) enfileirar(blob, f.ext, indice);
      else ses.partes[indice] = "";     // segmento vazio (silêncio ou clique rápido)
      // Encadeia o próximo enquanto a gravação seguir de pé.
      if (ses && ses.gravando && !ses.pausado) novoSegmento();
    };

    mr.start();
    // Fecha o segmento no tempo certo; o onstop abre o seguinte.
    ses.timerSeg = setTimeout(function () {
      if (mr.state !== "inactive") mr.stop();
    }, SEGMENTO_MS);
  }

  function pararSegmentoAtual() {
    if (ses.timerSeg) { clearTimeout(ses.timerSeg); ses.timerSeg = null; }
    if (ses.mr && ses.mr.state !== "inactive") ses.mr.stop();
  }

  function decorrido() {
    if (!ses) return 0;
    if (ses.pausado) return ses.acumuladoMs;
    return ses.acumuladoMs + (Date.now() - ses.t0);
  }

  /* ---------- Ações ---------- */

  async function comecar(btn) {
    if (!atual || !atual.p) return;
    if (!suportado()) {
      toast("Este navegador não grava áudio. Use o Chrome ou o Edge no computador.", true);
      return;
    }
    var chk = el("cau-consent");
    if (!chk || !chk.checked) {
      toast("Confirme o consentimento da paciente antes de gravar.", true);
      if (chk) chk.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Abrindo o microfone…";

    var stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "🎙️ Gravar consulta";
      toast(e && e.name === "NotAllowedError"
        ? "O navegador bloqueou o microfone. Libere o acesso e tente de novo."
        : "Não foi possível abrir o microfone.", true);
      return;
    }

    // O consentimento é gravado ANTES do microfone valer alguma coisa:
    // é esta linha que a edge function exige para aceitar o áudio.
    var id;
    try {
      var db = await window.NutriDBReady;
      var ins = await db.from("consulta_gravacoes").insert({
        paciente_id: atual.p.id,
        consentimento_modo: "verbal"
      }).select("id").single();
      if (ins.error) throw new Error(ins.error.message);
      id = ins.data.id;
    } catch (e) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      btn.disabled = false;
      btn.textContent = "🎙️ Gravar consulta";
      toast("Não foi possível registrar o consentimento. " + (e.message || ""), true);
      return;
    }

    ses = {
      id: id, stream: stream, mr: null, timerSeg: null, timerRelogio: null,
      t0: Date.now(), acumuladoMs: 0,
      partes: [], enviando: Promise.resolve(), pendentes: 0,
      gravando: true, pausado: false, nota: null
    };

    ses.timerRelogio = setInterval(function () {
      var r = el("cau-relogio");
      if (r) r.textContent = mmss(decorrido());
    }, 500);

    novoSegmento();
    pintar();

    // Fechar a aba no meio da consulta perde o que ainda não subiu.
    window.addEventListener("beforeunload", avisarSaida);
  }

  function avisarSaida(ev) {
    if (ses && ses.gravando) { ev.preventDefault(); ev.returnValue = ""; return ""; }
  }

  function pausar() {
    if (!ses || !ses.gravando || ses.pausado) return;
    // Fecha o segmento em vez de usar mr.pause(): assim o trecho já sobe e
    // o arquivo fica válido, mesmo que a pausa dure a consulta inteira.
    ses.pausado = true;
    ses.acumuladoMs += Date.now() - ses.t0;
    pararSegmentoAtual();
    pintar();
  }

  function retomar() {
    if (!ses || !ses.gravando || !ses.pausado) return;
    ses.pausado = false;
    ses.t0 = Date.now();
    novoSegmento();
    pintar();
  }

  async function encerrar() {
    if (!ses || !ses.gravando) return;
    ses.gravando = false;
    if (!ses.pausado) ses.acumuladoMs += Date.now() - ses.t0;
    var duracao = Math.round(ses.acumuladoMs / 1000);

    if (ses.timerRelogio) { clearInterval(ses.timerRelogio); ses.timerRelogio = null; }
    window.removeEventListener("beforeunload", avisarSaida);

    pararSegmentoAtual();
    ses.stream.getTracks().forEach(function (t) { t.stop(); });
    pintar();

    // Espera a fila drenar — inclusive o segmento que acabou de fechar.
    await new Promise(function (r) { setTimeout(r, 250); });
    await ses.enviando;

    var transcricao = ses.partes.filter(Boolean).join(" ").trim();
    var gid = ses.id;

    try {
      var db = await window.NutriDBReady;
      await db.from("consulta_gravacoes").update({
        encerrada_em: new Date().toISOString(), duracao_seg: duracao
      }).eq("id", gid);
    } catch (_) { /* o registro é auditoria; não travar a nutri por ele */ }

    if (transcricao.replace(/\s/g, "").length < 80) {
      ses.transcricao = transcricao;
      ses.estado = "curta";
      pintar();
      return;
    }

    ses.transcricao = transcricao;
    ses.estado = "montando";
    pintar();

    try {
      ses.nota = await chamarNota(transcricao);
      ses.estado = "pronta";
    } catch (e) {
      ses.estado = "erro";
      ses.erro = e.message || "Não foi possível montar a nota.";
    }
    pintar();
  }

  function descartar() {
    if (ses && ses.gravando) {
      ses.gravando = false;
      if (ses.timerRelogio) clearInterval(ses.timerRelogio);
      pararSegmentoAtual();
      try { ses.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (_) {}
      window.removeEventListener("beforeunload", avisarSaida);
    }
    ses = null;
    pintar();
  }

  /* ---------- Aplicar na anamnese ----------
     Abre o editor do campo (o mesmo do botão Editar) com a nota anexada ao
     que já estava lá. Salvar continua sendo clique da nutri. */
  function aplicar() {
    if (!ses || !ses.nota) return;
    var texto = notaTexto(ses.nota);
    var ta = el("fedit-anamnese");
    if (!ta) {
      var btn = document.querySelector('[data-edit-campo="anamnese"]');
      if (btn) btn.click();
      ta = el("fedit-anamnese");
    }
    if (!ta) { toast("Abra a Anamnese inicial para inserir a nota.", true); return; }
    ta.value = (ta.value.trim() ? ta.value.trim() + "\n\n" : "") + texto;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    ta.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Nota inserida. Confira e clique em Salvar.");
    ses = null;
    pintar();
  }

  function notaTexto(n) {
    var linhas = [];
    if (n.queixa) linhas.push("Queixa principal: " + n.queixa);
    if (n.nota) linhas.push(n.nota);
    if (n.combinados && n.combinados.length) {
      linhas.push("Combinado nesta consulta:\n" + n.combinados.map(function (c) {
        return "- " + c;
      }).join("\n"));
    }
    return linhas.join("\n\n");
  }

  /* ---------- Render ---------- */

  function render(p) {
    if (!suportado()) {
      return '<section class="fsec cau-card">' +
        '<div class="fsec__head"><h2 class="fsec__title">🎙️ Gravar consulta</h2></div>' +
        '<p class="cau__sub">Este navegador não grava áudio. Abra a plataforma no ' +
        'Chrome ou no Edge, no computador, para usar a gravação.</p></section>';
    }
    return '<section class="fsec cau-card">' +
      '<div class="fsec__head"><h2 class="fsec__title">🎙️ Gravar consulta</h2>' +
        '<span class="cau__tag">o áudio não é guardado</span></div>' +
      '<div class="cau__box" id="cau-box"></div>' +
      "</section>";
  }

  function pintar() {
    var box = el("cau-box");
    if (!box) return;

    // Sem sessão: o convite + a trava de consentimento.
    if (!ses) {
      box.innerHTML =
        '<p class="cau__sub">A IA escuta a consulta, transcreve e devolve uma nota de ' +
          'prontuário para você revisar. O áudio é transcrito e descartado na hora — ' +
          'nada de voz fica salvo na plataforma.</p>' +
        '<label class="cau__consent">' +
          '<input type="checkbox" id="cau-consent" />' +
          '<span>Informei a paciente sobre a gravação e ela <strong>consentiu</strong>. ' +
            'Este aceite fica registrado com data e hora.</span>' +
        '</label>' +
        '<div class="cau__acoes">' +
          '<button class="btn btn--primary" type="button" data-cau-gravar>🎙️ Gravar consulta</button>' +
        '</div>';
      return;
    }

    // Gravando (ou pausada).
    if (ses.gravando) {
      var fila = ses.pendentes > 0
        ? '<span class="cau__fila">transcrevendo ' + ses.pendentes + ' trecho' +
          (ses.pendentes > 1 ? "s" : "") + "…</span>"
        : "";
      box.innerHTML =
        '<div class="cau__ao-vivo">' +
          '<span class="cau__dot' + (ses.pausado ? " is-off" : "") + '"></span>' +
          '<span class="cau__relogio" id="cau-relogio">' + mmss(decorrido()) + "</span>" +
          '<span class="cau__estado">' + (ses.pausado ? "pausada" : "gravando") + "</span>" +
          fila +
        "</div>" +
        '<div class="cau__acoes">' +
          (ses.pausado
            ? '<button class="btn btn--outline" type="button" data-cau-retomar>▶️ Retomar</button>'
            : '<button class="btn btn--outline" type="button" data-cau-pausar>⏸️ Pausar</button>') +
          '<button class="btn btn--primary" type="button" data-cau-encerrar>⏹️ Encerrar e transcrever</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-cau-descartar>Descartar</button>' +
        "</div>" +
        '<p class="cau__hint">Não feche esta aba durante a consulta.</p>';
      return;
    }

    if (ses.estado === "montando") {
      box.innerHTML = '<div class="cau__load">Montando a nota de prontuário…</div>';
      return;
    }

    if (ses.estado === "curta") {
      box.innerHTML =
        '<div class="cau__vazio">A gravação saiu curta demais para virar nota ' +
          "(o microfone pode não ter captado). Nada foi salvo.</div>" +
        '<div class="cau__acoes"><button class="btn btn--outline" type="button" ' +
          "data-cau-descartar>Começar de novo</button></div>";
      return;
    }

    if (ses.estado === "erro") {
      box.innerHTML =
        '<div class="cau__erro">' + esc(ses.erro) + "</div>" +
        (ses.transcricao ? transcricaoHTML(ses.transcricao) : "") +
        '<div class="cau__acoes">' +
          '<button class="btn btn--outline" type="button" data-cau-descartar>Descartar</button>' +
        "</div>";
      return;
    }

    if (ses.estado === "pronta" && ses.nota) {
      var n = ses.nota;
      var partes = "";
      if (n.queixa) {
        partes += '<div class="cau__bloco"><h4>Queixa principal</h4><p>' + nl2br(n.queixa) + "</p></div>";
      }
      if (n.nota) {
        partes += '<div class="cau__bloco"><h4>Nota de prontuário</h4><p>' + nl2br(n.nota) + "</p></div>";
      }
      if (n.combinados && n.combinados.length) {
        partes += '<div class="cau__bloco"><h4>Combinado nesta consulta</h4><ul>' +
          n.combinados.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") +
          "</ul></div>";
      }
      if (n.duvidas && n.duvidas.length) {
        partes += '<div class="cau__bloco cau__bloco--duvida"><h4>A IA não entendeu (confira você)</h4><ul>' +
          n.duvidas.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") +
          "</ul></div>";
      }
      // Sem queixa e sem nota não há o que inserir: oferecer o botão só
      // levaria texto vazio para a anamnese. Sobra a transcrição bruta,
      // que ainda pode servir para a nutri ler.
      var temConteudo = !!(n.nota || n.queixa);
      if (!temConteudo) {
        partes = '<div class="cau__vazio">A IA não encontrou conteúdo clínico nesta gravação. ' +
          "A transcrição bruta continua abaixo.</div>";
      }

      box.innerHTML =
        (temConteudo
          ? '<p class="cau__aviso">Rascunho gerado por IA a partir da consulta — revise antes de usar. ' +
            "A responsabilidade clínica é sua.</p>"
          : "") +
        partes +
        transcricaoHTML(ses.transcricao) +
        '<div class="cau__acoes">' +
          (temConteudo
            ? '<button class="btn btn--primary" type="button" data-cau-aplicar>Inserir na anamnese</button>' +
              '<button class="btn btn--outline btn--sm" type="button" data-cau-copiar>Copiar</button>'
            : "") +
          '<button class="btn btn--ghost btn--sm" type="button" data-cau-descartar>Descartar</button>' +
        "</div>";
      return;
    }

    box.innerHTML = "";
  }

  function transcricaoHTML(t) {
    if (!t) return "";
    return '<details class="cau__transcricao"><summary>Ver a transcrição bruta (' +
      t.length + " caracteres)</summary><p>" + nl2br(t) + "</p></details>";
  }

  /* ---------- Eventos ---------- */

  function instalar() {
    if (ligado) return;
    ligado = true;
    document.addEventListener("click", function (ev) {
      var b;
      b = ev.target.closest("[data-cau-gravar]");
      if (b) { comecar(b); return; }

      if (ev.target.closest("[data-cau-pausar]")) { pausar(); return; }
      if (ev.target.closest("[data-cau-retomar]")) { retomar(); return; }
      if (ev.target.closest("[data-cau-encerrar]")) { encerrar(); return; }
      if (ev.target.closest("[data-cau-aplicar]")) { aplicar(); return; }

      b = ev.target.closest("[data-cau-descartar]");
      if (b) {
        if (ses && ses.gravando && !window.confirm("Descartar esta gravação? O que já foi transcrito se perde.")) return;
        descartar();
        return;
      }

      b = ev.target.closest("[data-cau-copiar]");
      if (b && ses && ses.nota) {
        var alvo = b;
        navigator.clipboard.writeText(notaTexto(ses.nota)).then(function () {
          var t0 = alvo.textContent;
          alvo.textContent = "✓ Copiado";
          setTimeout(function () { alvo.textContent = t0; }, 1500);
        }).catch(function () { toast("Não consegui copiar automaticamente.", true); });
        return;
      }
    });
  }

  function wire(p, ctx) {
    // Trocar de paciente no meio de uma gravação seria registrar a consulta
    // de uma na ficha da outra. Se há gravação viva, ela é encerrada.
    if (ses && ses.gravando && (!atual || !atual.p || atual.p.id !== p.id)) descartar();
    atual = { p: p, ctx: ctx || {} };
    instalar();
    pintar();
  }

  window.ConsultaAudio = { render: render, wire: wire };
})();
