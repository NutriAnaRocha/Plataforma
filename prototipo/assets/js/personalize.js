/* ============================================================
   PERSONALIZE — modal "Quais áreas você atende?" (1º acesso)
   Salva as áreas em localStorage e expõe utilidades para o feed.
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "nutriplat.areas";

  // Áreas oferecidas no onboarding (chave + emoji)
  var AREAS = [
    { key: "Clínica", emoji: "🩺" },
    { key: "Esportiva", emoji: "🏃" },
    { key: "Saúde da Mulher", emoji: "👩‍⚕️" },
    { key: "Fertilidade", emoji: "🌸" },
    { key: "Comportamental", emoji: "🧠" },
    { key: "Pediatria", emoji: "👶" },
    { key: "Oncologia", emoji: "🎗️" },
    { key: "Renal", emoji: "💧" },
    { key: "Estética", emoji: "✨" },
    { key: "Funcional", emoji: "🌿" }
  ];

  function getAreas() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveAreas(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function hasOnboarded() { return getAreas() !== null; }

  // Monta as opções (checkbox cards) dentro do modal
  function renderOptions(container) {
    var selected = getAreas() || [];
    container.innerHTML = "";
    AREAS.forEach(function (a) {
      var label = document.createElement("label");
      label.className = "opt";
      label.innerHTML =
        '<input type="checkbox" value="' + a.key + '"' +
        (selected.indexOf(a.key) > -1 ? " checked" : "") + ' />' +
        '<span class="opt__box"></span>' +
        '<span class="opt__emoji">' + a.emoji + '</span>' +
        '<span>' + a.key + '</span>';
      container.appendChild(label);
    });
  }

  function readSelected(container) {
    return Array.prototype.slice
      .call(container.querySelectorAll("input:checked"))
      .map(function (i) { return i.value; });
  }

  // API pública
  window.Personalize = {
    STORAGE_KEY: STORAGE_KEY,
    AREAS: AREAS,
    get: getAreas,
    save: saveAreas,
    hasOnboarded: hasOnboarded,
    renderOptions: renderOptions,
    readSelected: readSelected
  };
})();
