/* ============================================================
   SUPABASE CLIENT (sem build) — carrega a UMD do supabase-js pela
   CDN e expõe:
     window.NutriDB       -> client já criado (quando pronto)
     window.NutriDBReady  -> Promise que resolve com o client
   Inclua ANTES dos scripts que usam o banco (app.js, auth-guard.js).
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://btsqrpxzlkmucrfvsytl.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_WinaFUxjvv0ODjSs7sT2dQ_k7GlLLxh";
  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  window.NutriDBReady = new Promise(function (resolve, reject) {
    function make() {
      try {
        window.NutriDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
        resolve(window.NutriDB);
      } catch (e) { reject(e); }
    }
    if (window.supabase && window.supabase.createClient) { make(); return; }
    var s = document.createElement("script");
    s.src = CDN;
    s.onload = make;
    s.onerror = function () { reject(new Error("Falha ao carregar supabase-js (offline?)")); };
    document.head.appendChild(s);
  });

  /* Meu perfil, e só o meu.

     `from("profiles").select(...).maybeSingle()` SEM filtro parece certo
     porque a RLS "cada um vê o seu" já resolveria — mas a conta ADMIN também
     enxerga todos os perfis pela policy de curadoria. Aí o maybeSingle()
     devolve "multiple (or no) rows returned", vira erro, e todo `.catch`
     silencioso da casa engole: a tela some sem dizer por quê, e só para a Ana.

     Esta função pega o uid da sessão e filtra. Use-a sempre que a consulta
     for "o meu perfil"; `.eq("id", …)` escrito à mão volta a divergir. */
  window.NutriMeuPerfil = function (c, colunas) {
    return c.auth.getUser().then(function (u) {
      var uid = u && u.data && u.data.user && u.data.user.id;
      if (!uid) return { data: null, error: null };
      return c.from("profiles").select(colunas).eq("id", uid).maybeSingle();
    });
  };
})();
