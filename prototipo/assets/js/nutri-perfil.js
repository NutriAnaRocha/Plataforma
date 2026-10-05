/* ============================================================
   nutri-perfil.js — a página pública de uma nutricionista.

   O endereço bonito é /nutri/<slug>, reescrito pelo .htaccess para
   nutri.html?slug=<slug>. Ler o slug da query resolve os dois casos,
   mas quando o .htaccess não está no ar (abrir o arquivo local, por
   exemplo) o último segmento do caminho ainda salva a página.

   Título e meta description são reescritos aqui porque o HTML é
   estático e o conteúdo é de cada profissional. O robô do Google
   executa JS e lê o resultado; o do WhatsApp não — enquanto a
   pré-renderização não existir, o card do WhatsApp mostra o texto
   genérico da NutriPlat, e isso é melhor do que mostrar errado.
   ============================================================ */
(function () {
  "use strict";

  var D = window.Diretorio;
  var alvo = document.getElementById("perfil");

  function slugDaUrl() {
    var q = new URLSearchParams(location.search).get("slug");
    if (q) return q.toLowerCase();
    var m = location.pathname.match(/\/nutri\/([^/?#]+)/i);
    return m ? decodeURIComponent(m[1]).toLowerCase() : "";
  }

  function erro(titulo, texto) {
    alvo.innerHTML = '<div class="wrap" style="padding:var(--sp-7) 0">' +
      '<div class="aviso"><strong>' + D.esc(titulo) + "</strong>" + D.esc(texto) +
      '<p style="margin-top:var(--sp-4)"><a class="btn btn--primario" href="/encontre-sua-nutri">Ver todas as nutricionistas</a></p>' +
      "</div></div>";
  }

  function bloco(titulo, texto) {
    if (!texto) return "";
    // Quebras de linha digitadas pela nutri viram parágrafo visível.
    return "<h2>" + D.esc(titulo) + "</h2><p>" + D.esc(texto).replace(/\n/g, "<br>") + "</p>";
  }

  function desenhar(n) {
    document.title = n.nome + " · Nutricionista · NutriPlat";
    var desc = (n.apresentacao || "Perfil profissional na NutriPlat.").slice(0, 155);
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    var can = document.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute("href", "https://nutriplat.com.br/nutri/" + n.slug);

    var local = [n.atende_presencial ? n.bairro : "", n.cidade, n.estado].filter(Boolean).join(" · ");
    var areas = Array.isArray(n.area_atuacao) ? n.area_atuacao : [];
    var chips = areas.map(function (a) { return '<span class="chip">' + D.esc(a) + "</span>"; })
      .concat(D.modalidades(n).map(function (m) { return '<span class="chip">' + m + "</span>"; }));

    var formacao = [n.formacao, n.ano_formatura ? "Formada em " + n.ano_formatura : ""]
      .filter(Boolean).join(" · ");
    var tempo = n.atuacao_desde ? "Atua desde " + n.atuacao_desde : "";
    var pos = Array.isArray(n.pos_graduacao) ? n.pos_graduacao.filter(Boolean) : [];
    var linhasFormacao = [formacao].concat(pos, [tempo]).filter(Boolean);

    var redes = [];
    // Perfis antigos guardaram o link inteiro do Instagram.
    var ig = D.usuarioIg(n.instagram);
    if (ig) {
      redes.push('<a class="perfil__rede" href="https://instagram.com/' + D.esc(ig) + '" target="_blank" rel="noopener nofollow">' +
        D.ICO_IG + '<span>Instagram · @' + D.esc(ig) + "</span></a>");
    }
    if (n.site) {
      var href = /^https?:\/\//i.test(n.site) ? n.site : "https://" + n.site;
      redes.push('<a class="perfil__rede" href="' + D.esc(href) + '" target="_blank" rel="noopener nofollow">' +
        D.ICO_SITE + '<span>Site · ' + D.esc(D.siteRotulo(n.site)) + "</span></a>");
    }

    var preco = D.preco(n.preco_consulta_cents);

    alvo.innerHTML =
      '<section class="perfil__capa"><div class="wrap"><div class="perfil__topo">' +
        D.foto(n, "perfil__foto") +
        "<div><h1 class=\"perfil__nome\">" + D.esc(n.nome) + "</h1>" +
        '<p class="perfil__meta">' + D.esc([n.crn ? "CRN " + n.crn : "", local].filter(Boolean).join(" · ")) + "</p>" +
        (chips.length ? '<div class="chips">' + chips.join("") + "</div>" : "") +
        "</div></div></div></section>" +

      '<div class="wrap secao"><div class="perfil__corpo">' +
        '<div class="perfil__texto">' +
          (n.apresentacao ? "<p style=\"font-size:1.05rem\">" + D.esc(n.apresentacao) + "</p>" : "") +
          bloco("Quem eu atendo", n.publico_atendido) +
          bloco("Como funciona a consulta", n.como_funciona) +
          bloco("Sobre mim", n.bio) +
          (linhasFormacao.length
            ? "<h2>Formação</h2><p>" + linhasFormacao.map(D.esc).join("<br>") + "</p>"
            : "") +
          (redes.length ? "<h2>Onde encontrar</h2><div class=\"perfil__redes\">" + redes.join("") + "</div>" : "") +
        "</div>" +

        '<aside class="perfil__lado">' +
          (preco ? '<div class="preco">' + preco + "</div><small>por consulta, definido pela profissional</small>" : "") +
          (n.aceita_novos === false
            ? '<p class="chip chip--modo" style="text-align:center">Agenda fechada no momento</p>'
            : '<a class="btn btn--primario btn--bloco" href="' + D.linkWhats(n.nome) + '" target="_blank" rel="noopener">Solicitar atendimento</a>') +
          "<small>Você fala com a equipe da NutriPlat, que encaminha o seu contato para " +
            D.esc(String(n.nome).split(" ")[0]) + ". O atendimento, os valores e os horários são combinados diretamente com ela.</small>" +
        "</aside>" +
      "</div></div>";
  }

  var slug = slugDaUrl();
  if (!slug) { erro("Perfil não informado", "O endereço veio sem o nome da profissional."); return; }

  D.perfil(slug)
    .then(function (r) { desenhar(r.nutri); })
    .catch(function (e) {
      if (e.status === 404) {
        erro("Perfil não encontrado", "Este endereço não existe ou o perfil ainda não foi publicado na busca.");
      } else {
        erro("Não consegui carregar o perfil", "Verifique a conexão e tente de novo em instantes.");
      }
    });
})();
