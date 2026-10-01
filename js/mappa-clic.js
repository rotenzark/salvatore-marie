/* mappa-clic.js — la mappa Google si carica solo dopo il clic: prima nessuna richiesta a Google (giro privacy 1/10/2026). */
(function () {
  'use strict';
  var T = {
    it: ['Mostra la mappa', 'La mappa è di Google: aprendola, Google riceve il tuo indirizzo IP e può usare i suoi cookie.'],
    en: ['Show the map', 'The map is provided by Google: opening it sends your IP address to Google, which may use its cookies.'],
    ar: ['اعرض الخريطة', 'الخريطة من Google: عند فتحها يتلقى Google عنوان IP الخاص بك وقد يستخدم ملفات تعريف الارتباط الخاصة به.']
  };
  function testi() {
    var l = (document.documentElement.getAttribute('lang') || 'it').slice(0, 2);
    var t = T[l] || T.it;
    document.querySelectorAll('[data-mappa-clic]').forEach(function (m) {
      var b = m.querySelector('.mappa-clic__btn'), n = m.querySelector('.mappa-clic__nota');
      if (b && b.textContent !== t[0]) b.textContent = t[0];
      if (n && n.textContent !== t[1]) n.textContent = t[1];
    });
  }
  document.querySelectorAll('[data-mappa-clic]').forEach(function (m) {
    var b = m.querySelector('.mappa-clic__btn');
    var tpl = m.querySelector('template');
    if (!b || !tpl || !tpl.content) return; /* senza <template> il bottone resta un link a Google Maps */
    b.addEventListener('click', function (e) {
      var f = tpl.content.querySelector('iframe');
      if (!f) return;
      e.preventDefault();
      f = document.importNode(f, true);
      f.removeAttribute('loading');
      m.parentNode.replaceChild(f, m);
    });
  });
  testi();
  if ('MutationObserver' in window) new MutationObserver(testi).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
