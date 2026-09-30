/* ============================================================
   cadastro-paciente.js — cadastro público do paciente em
   /cadastro-paciente (15/09/2026).

   Um formulário só: nome, e-mail, telefone, CPF, foto opcional e o
   objetivo com a nutrição. Quem cria a conta é a edge function
   `criar-conta-paciente`; esta página abre sem login e não usa
   supabase-client.js, como o cadastro da nutri.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/";
  var ANON = "sb_publishable_WinaFUxjvv0ODjSs7sT2dQ_k7GlLLxh";

  var OBJETIVOS = [
    "Emagrecer",
    "Ganhar massa muscular",
    "Engravidar",
    "Gestação e amamentação",
    "Saúde intestinal",
    "Melhorar exames",
    "Tratar uma doença",
    "Comer melhor no dia a dia",
    "Outro"
  ];

  var estado = { foto: null };

  function $(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function campo(id, rotulo, attrs, dica) {
    return '<label class="campo"><span class="campo__rot">' + esc(rotulo) + "</span>" +
      '<input id="' + id + '" ' + attrs + " />" +
      (dica ? '<span class="campo__dica">' + esc(dica) + "</span>" : "") + "</label>";
  }

  function soDigitos(v) { return String(v || "").replace(/\D/g, ""); }

  function mascaraCpf(v) {
    var d = soDigitos(v).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }

  function mascaraTel(v) {
    var d = soDigitos(v).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  /* Mesmo cálculo da function: o erro aparece antes do envio. */
  function cpfValido(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    function dv(base, peso) {
      var soma = 0;
      for (var i = 0; i < base.length; i++) soma += Number(base[i]) * (peso - i);
      var r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    }
    return dv(cpf.slice(0, 9), 10) === Number(cpf[9]) && dv(cpf.slice(0, 10), 11) === Number(cpf[10]);
  }

  function desenhar() {
    $("#cadastro-form").innerHTML =
      '<div class="cn-campos">' +
        campo("cp-nome", "Nome completo", 'type="text" autocomplete="name" maxlength="80"') +
        campo("cp-email", "E-mail", 'type="email" autocomplete="email" maxlength="120"',
              "É com ele que você entra.") +
        campo("cp-tel", "Telefone (WhatsApp)", 'type="tel" autocomplete="tel" inputmode="numeric" maxlength="16" placeholder="(21) 99999-9999"') +
        campo("cp-cpf", "CPF", 'type="text" inputmode="numeric" maxlength="14" placeholder="000.000.000-00"') +
        '<div class="campo"><span class="campo__rot">Foto (opcional)</span>' +
          '<div class="cp-foto">' +
            '<img class="cp-foto__prev" id="cp-foto-prev" alt="" hidden />' +
            '<input id="cp-foto" type="file" accept="image/*" />' +
            '<label for="cp-foto" class="btn btn--contorno">Escolher foto</label>' +
          "</div></div>" +
        '<label class="campo"><span class="campo__rot">Seu objetivo com a nutrição</span>' +
          '<select id="cp-objetivo"><option value="">Escolha</option>' +
            OBJETIVOS.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("") +
          "</select></label>" +
        '<label class="campo" id="cp-outro-wrap" hidden><span class="campo__rot">Qual?</span>' +
          '<input id="cp-outro" type="text" maxlength="100" /></label>' +
        campo("cp-senha", "Crie uma senha", 'type="password" autocomplete="new-password" minlength="6"',
              "Mínimo de 6 caracteres.") +
        // O texto vai num <span>: a .opcao é flex, e solto cada link virava uma coluna.
        '<label class="opcao" style="margin-top:8px"><input type="checkbox" id="cp-aceite" /> ' +
          '<span>Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de uso</a> e a ' +
          '<a href="/privacidade" target="_blank" rel="noopener">Política de privacidade</a>.</span></label>' +
      "</div>" +
      '<p class="cn-erro" id="cp-erro" hidden></p>' +
      '<div class="cn-acoes"><span></span>' +
        '<button type="button" class="btn btn--primario" id="cp-enviar">Criar minha conta</button>' +
      "</div>";

    var cpf = $("#cp-cpf"), tel = $("#cp-tel");
    cpf.addEventListener("input", function () { cpf.value = mascaraCpf(cpf.value); });
    tel.addEventListener("input", function () { tel.value = mascaraTel(tel.value); });

    $("#cp-objetivo").addEventListener("change", function () {
      $("#cp-outro-wrap").hidden = this.value !== "Outro";
    });

    $("#cp-foto").addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) return;
      window.FotoUpload.ler(f).then(function (url) {
        estado.foto = url;
        var prev = $("#cp-foto-prev");
        prev.src = url;
        prev.hidden = false;
        erro("");
      }).catch(function () {
        estado.foto = null;
        erro("Não consegui ler essa imagem. Tente outra foto.");
      });
    });

    $("#cp-enviar").addEventListener("click", enviar);
  }

  function erro(msg) {
    var e = $("#cp-erro");
    e.textContent = msg;
    e.hidden = !msg;
  }

  function ler() {
    var objetivo = $("#cp-objetivo").value;
    if (objetivo === "Outro") objetivo = $("#cp-outro").value.trim() || "";
    var d = {
      nome: $("#cp-nome").value.trim(),
      email: $("#cp-email").value.trim().toLowerCase(),
      telefone: soDigitos($("#cp-tel").value),
      cpf: soDigitos($("#cp-cpf").value),
      objetivo: objetivo,
      foto: estado.foto,
      senha: $("#cp-senha").value,
      aceite: $("#cp-aceite").checked
    };
    if (!d.nome) return [null, "Escreva o seu nome completo."];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return [null, "Confira o e-mail."];
    if (d.telefone.length < 10) return [null, "Confira o telefone, com DDD."];
    if (!cpfValido(d.cpf)) return [null, "Confira o CPF."];
    if (!d.objetivo) return [null, "Conte o seu objetivo com a nutrição."];
    if (d.senha.length < 6) return [null, "A senha precisa de pelo menos 6 caracteres."];
    if (!d.aceite) return [null, "É preciso aceitar os termos."];
    return [d, null];
  }

  var MENSAGENS = {
    email_em_uso: "Já existe uma conta com esse e-mail. Entre pela tela inicial ou use \"Esqueci minha senha\".",
    cpf_em_uso: "Já existe uma conta com esse CPF. Entre pela tela inicial ou use \"Esqueci minha senha\".",
    cpf_invalido: "Confira o CPF.",
    telefone_invalido: "Confira o telefone, com DDD.",
    senha_curta: "A senha precisa de pelo menos 6 caracteres."
  };

  function enviar() {
    var r = ler();
    if (r[1]) { erro(r[1]); return; }
    erro("");

    var botao = $("#cp-enviar");
    botao.disabled = true;
    botao.textContent = "Criando…";

    fetch(BASE + "criar-conta-paciente", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + ANON },
      body: JSON.stringify(r[0])
    }).then(function (resp) {
      return resp.json().then(function (j) { return { ok: resp.ok, j: j }; });
    }).then(function (res) {
      if (!res.ok) {
        botao.disabled = false;
        botao.textContent = "Criar minha conta";
        erro(MENSAGENS[res.j.error] || "Não consegui criar a conta agora. Tente de novo em instantes.");
        return;
      }
      concluido(r[0].email);
    }).catch(function () {
      botao.disabled = false;
      botao.textContent = "Criar minha conta";
      erro("Sem conexão com o servidor. Tente de novo.");
    });
  }

  function concluido(email) {
    var alvo = $("#cadastro-form");
    alvo.innerHTML =
      '<div class="cn-fim">' +
        "<h3>Conta criada 🌿</h3>" +
        "<p>Entre com <strong>" + esc(email) + "</strong> e a senha que você acabou de criar.</p>" +
        "<p>Ainda não tem nutricionista? Depois de entrar, você encontra a profissional certa para o seu objetivo.</p>" +
        '<p><a class="btn btn--primario" href="/">Entrar</a></p>' +
      "</div>";
    var link = document.querySelector(".cp-entrar");
    if (link) link.hidden = true;
    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.addEventListener("DOMContentLoaded", desenhar);
})();
