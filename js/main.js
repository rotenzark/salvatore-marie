/* ============================================================
   SALVATORE + MARIE — main.js
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce-motion');

  /* ---------- INTRO ---------- */
  (function intro () {
    var el = document.getElementById('intro');
    if (!el || reduce) { root.classList.add('intro-done'); return; }
    var done = false;
    function finish () {
      if (done) return; done = true;
      root.classList.add('intro-done');
      window.removeEventListener('scroll', finish);
      window.removeEventListener('keydown', finish);
      el.removeEventListener('click', finish);
    }
    setTimeout(finish, 2500);
    window.addEventListener('scroll', finish, { passive: true });
    window.addEventListener('keydown', finish);
    el.addEventListener('click', finish);
  })();

  /* ---------- HEADER ---------- */
  var head = document.querySelector('.site-head');
  function onScroll () { head.classList.toggle('scrolled', window.scrollY > 12); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- MOBILE NAV ---------- */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mobile-nav');
  function openNav () {
    mnav.hidden = false;
    requestAnimationFrame(function () { mnav.classList.add('open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Chiudi menu');
    document.body.classList.add('nav-open');
  }
  function closeNav () {
    mnav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Apri menu');
    document.body.classList.remove('nav-open');
    setTimeout(function () { if (!mnav.classList.contains('open')) mnav.hidden = true; }, 420);
    burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') closeNav(); else openNav();
    });
    mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && burger.getAttribute('aria-expanded') === 'true') closeNav();
    });
  }

  /* ---------- REVEALS + watchdog ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll () { reveals.forEach(function (r) { r.classList.add('is-visible'); }); }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (r) { io.observe(r); });
    var fired = false;
    var probe = new IntersectionObserver(function () { fired = true; probe.disconnect(); });
    probe.observe(document.body);
    setTimeout(function () { if (!fired) showAll(); }, 1500);
  }

  /* ---------- DYNAMIC HOURS (Europe/Rome, split windows) ---------- */
  // each day: array of [open,close] windows (minutes) or null.
  // Tue-Sat: 10:30-13:00 (630-780) & 15:30-19:30 (930-1170)
  var W = [[630, 780], [930, 1170]];
  var HOURS = { 0: null, 1: null, 2: W, 3: W, 4: W, 5: W, 6: W };

  function romeNow () {
    try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' })); }
    catch (e) { return new Date(); }
  }
  function fmt (mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  }
  function updateHours (lang) {
    var now = romeNow(), day = now.getDay(), cur = now.getHours() * 60 + now.getMinutes();
    var box = document.getElementById('hours-now'), label = document.getElementById('hours-status');
    if (!box || !label) return;
    var t = I18N_HOURS[lang] || I18N_HOURS.it, open = false, msg = '';
    var today = HOURS[day], i, w;
    // open now?
    if (today) {
      for (i = 0; i < today.length; i++) {
        w = today[i];
        if (cur >= w[0] && cur < w[1]) { open = true; msg = t.openUntil.replace('{t}', fmt(w[1])); break; }
      }
    }
    if (!open) {
      // next window today?
      var found = null;
      if (today) {
        for (i = 0; i < today.length; i++) { if (cur < today[i][0]) { found = { t: today[i][0], same: true, off: 0 }; break; } }
      }
      if (!found) {
        for (var k = 1; k <= 7; k++) {
          var d = (day + k) % 7, hw = HOURS[d];
          if (hw) { found = { t: hw[0][0], same: false, off: k, d: d }; break; }
        }
      }
      if (found) {
        var dayName = found.same ? t.today : (found.off === 1 ? t.tomorrow : t.days[found.d]);
        msg = t.closedOpens.replace('{day}', dayName).replace('{t}', fmt(found.t));
      } else { msg = t.closed; }
    }
    box.classList.toggle('is-open', open);
    box.classList.toggle('is-closed', !open);
    label.textContent = msg;
    document.querySelectorAll('.hours__table tr').forEach(function (tr) {
      tr.classList.toggle('today', parseInt(tr.getAttribute('data-day'), 10) === day);
    });
  }
  var I18N_HOURS = {
    it: { openUntil: 'Aperto ora · chiude alle {t}', closedOpens: 'Chiuso · apre {day} alle {t}', closed: 'Chiuso',
      today: 'oggi', tomorrow: 'domani', days: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'] },
    en: { openUntil: 'Open now · closes at {t}', closedOpens: 'Closed · opens {day} at {t}', closed: 'Closed',
      today: 'today', tomorrow: 'tomorrow', days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }
  };

  /* ---------- I18N (EN overlay; IT is the DOM default) ---------- */
  var EN = {
    'nav.story': 'Story', 'nav.find': 'What you find', 'nav.window': 'The window', 'nav.reviews': 'Reviews',
    'nav.where': 'Find us', 'nav.faq': 'FAQ',
    'cta.dm': 'Message us', 'cta.dmFull': 'Message us on Instagram', 'cta.instagram': 'See it on Instagram', 'cta.visit': 'Come and see us',

    'hero.eyebrow': 'Concept store · since 1989 · Navigli, Milan',
    'hero.t1': 'A collection', 'hero.t2': 'of', 'hero.t3': 'wonders.',
    'hero.lead': "Since 1989, on the Navigli, a fashion-and-design shop like no other: jewellery, tailored clothing, ceramics and wearable art objects, chosen piece by piece by two designers. Things you'll only find here in Milan.",
    'hero.m1': 'on the Navigli ever since', 'hero.m2': 'on Google', 'hero.m3s': 'Unique', 'hero.m3': 'pieces picked by hand',
    'hero.cap': 'The window, Via Vigevano 33', 'hero.scroll': 'Enter',

    'story.kicker': 'The story',
    'story.t1': 'Two designers,', 'story.t2': 'one idea of beauty', 'story.t3': 'that never goes out of fashion.',
    'story.p1': 'Salvatore + Marie opened in 1989 on Via Vigevano and has been a landmark ever since for anyone who loves special clothes and accessories. Not just a boutique: a personal, hand-picked collection where every piece is chosen because it has a story.',
    'story.p2': "Artist jewellery, ceramics, tailored clothing, bags, small design objects. People who come in — devoted Milanese and travellers from all over the world — usually leave with something in their suitcase. 'The most interesting and inspiring store I came across in Italy,' they write. We just call it home.",
    'story.b1': 'Since 1989', 'story.b2': 'Unique pieces', 'story.b3': 'Fashion + design', 'story.b4': 'Loved worldwide',

    'find.kicker': 'What you find', 'find.t1': 'Five ways', 'find.t2': 'to be surprised.',
    'find.c1t': 'Jewellery &amp; bijoux', 'find.c1d': "Earrings, necklaces and brooches by artists: resin, stones, ceramic, brass. Jewellery that's really tiny sculpture to wear.",
    'find.c2t': 'Tailored clothing', 'find.c2d': "Special, sought-after pieces, fabrics and prints you won't see elsewhere: kimonos, jackets, embroidered shirts, uniquely cut dresses.",
    'find.c3t': 'Ceramics &amp; objects', 'find.c3d': 'Vases, cups, lamps and small handmade design objects: the same care we put into fashion, for your home.',
    'find.c4t': 'Bags &amp; accessories', 'find.c4d': "Hand-woven bags, macramé, hats, belts, scarves: the accessory that changes everything, and that you'll remember.",
    'find.c5t': 'Wearable art', 'find.c5d': "The thread that ties it all together: pieces chosen for their soul, not for the season. To gift, or to keep for yourself.",
    'find.note': 'The collections change constantly: what you see today might be gone tomorrow. Follow us on Instagram for what’s new.',
    'find.follow': 'Follow us on Instagram',

    'win.kicker': 'The window', 'win.t1': 'People stop', 'win.t2': 'just to look at it.',
    'win.lead': "The Salvatore + Marie window is almost an installation: colours, shapes and objects that change with the seasons and the mood of the moment. You walk past, you stop, you come in. It's worked like this for over thirty years.",

    'rev.kicker': 'Reviews', 'rev.t1': 'Milan and the world,', 'rev.t2': 'agree.',
    'rev.gg': '19 reviews on Google',
    'rev.1': '“Most interesting and inspiring store I came across in Italy, highly recommend.”',
    'rev.2': '“An absolute gem of a shop. Beautiful, unique pieces. Customer service was fabulous. Will definitely be back!”',
    'rev.3': '“A landmark in the city for anyone who loves special clothing and truly unique accessories, jewellery included. Bravi!”',
    'rev.note': 'Real reviews quoted verbatim from Google.',

    'src.google': 'Google',

    'where.kicker': 'Find us', 'where.t1': 'Via Vigevano 33,', 'where.t2': 'heart of the Navigli.',
    'where.zone': 'Navigli', 'where.metro': 'Porta Genova metro (M2) a few minutes away · tram 10 along Via Vigevano.',
    'where.checking': 'Checking hours…', 'where.closed': 'Closed',

    'day.mon': 'Monday', 'day.tue': 'Tuesday', 'day.wed': 'Wednesday', 'day.thu': 'Thursday',
    'day.fri': 'Friday', 'day.sat': 'Saturday', 'day.sun': 'Sunday',

    'faq.kicker': 'FAQ', 'faq.t1': 'Before', 'faq.t2': 'you drop by.',
    'faq.q1': 'What do you sell at Salvatore + Marie?',
    'faq.a1': 'Artisan jewellery and bijoux, tailored clothing, ceramics and design objects, bags and accessories: special, one-off pieces chosen by two designers. A fashion-and-design shop, not a chain.',
    'faq.q2': 'Where are you and how do I get there?',
    'faq.a2': 'Via Vigevano 33, on the Navigli. Porta Genova metro (M2) a few minutes away and tram 10 along Via Vigevano.',
    'faq.q3': 'What are your opening hours?',
    'faq.a3': 'Tuesday to Saturday: 10:30–13:00 and 15:30–19:30. Closed Monday and Sunday.',
    'faq.q4': 'How long have you been around?',
    'faq.a4': 'Since 1989: a Navigli landmark for anyone looking for truly unique clothes and accessories.',
    'faq.q5': 'How do I contact you for information?',
    'faq.a5': 'The fastest way is to DM us on Instagram (@salvatoremarieshop). You can also call us on 02 8942 2152 during opening hours or write to salvatoremarie@faswebnet.it.',

    'foot.tag': 'Art &amp; design concept store — Navigli, Milan, since 1989',
    'foot.visit': 'Come and see us', 'foot.contact': 'Contact', 'foot.follow': 'Follow',
    'foot.demo': 'Demo website by Bespoke Studio · public data (Google, Instagram). Photos © Salvatore + Marie.',
    'foot.up': 'Back to top ↑',

    'bar.call': 'Call', 'bar.ig': 'Instagram', 'bar.where': 'Find us'
  };

  var i18nEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  i18nEls.forEach(function (el) { el.dataset.it = el.innerHTML; });
  var lang = 'it';
  function setLang (l) {
    lang = l;
    i18nEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (l === 'en' && EN[key] != null) el.innerHTML = EN[key];
      else el.innerHTML = el.dataset.it;
    });
    root.setAttribute('lang', l);
    var btn = document.getElementById('lang');
    if (btn) {
      btn.querySelector('.lang__it').classList.toggle('is-on', l === 'it');
      btn.querySelector('.lang__en').classList.toggle('is-on', l === 'en');
    }
    updateHours(l);
  }
  var langBtn = document.getElementById('lang');
  if (langBtn) langBtn.addEventListener('click', function () { setLang(lang === 'it' ? 'en' : 'it'); });

  updateHours('it');
  setInterval(function () { updateHours(lang); }, 60000);
})();
