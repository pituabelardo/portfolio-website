/* dryland.js — v4 presentation layer for the content mode.
   two pieces, both purely decorative (aria-hidden, pointer-events:none),
   injected by js so the semantic/SEO layer in index.html stays untouched:

   1. hero type field — the name "jorge antolín" repeated in undulating
      rows behind the hero (ref: p5aholic day/018, translated from
      "Deprecated" black-on-blue to whisper-quiet ink-on-cream). canvas
      2d, capped at 30fps, paused when offscreen / in sea mode, static
      frame under prefers-reduced-motion.

   2. flotsam — small nautical svg bits (paper boat, drop, fish, knot…)
      hanging in the page margins. they take a velocity kick from your
      scroll and settle back on a damped spring (ref: patrickheng.com's
      hanging physics). we deliberately did NOT rebuild the page as a
      horizontal physics scroller: the single vertical column is what
      keeps deep links, crawlers, screen readers and the no-js fallback
      identical to the js experience. the physics lives only in the
      decoration layer. reduced-motion gets static pins.
*/

(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  /* ============================================================
     0 · v6 — the menu IS the deep. you arrive here by diving off
     the canoe, so scrolling is descending: the page background is
     one continuous water column — luminous surface (cream → pale
     turquoise, god-rays), ultramarine at mid-page, abyss at the
     footer. pure decoration: one absolutely-positioned layer behind
     the content (aria-hidden), the semantic DOM untouched. the
     gradient is baked into the DOCUMENT height, so "linked to
     scroll" costs zero js per frame; reduced-motion keeps the
     static gradient and skips the particles.
     ============================================================ */
  var depthBg = document.createElement("div");
  depthBg.id = "depth-bg";
  depthBg.setAttribute("aria-hidden", "true");
  body.prepend(depthBg);

  // god-rays hugging the surface
  var rays = document.createElement("div");
  rays.className = "depth-rays";
  depthBg.appendChild(rays);

  // the abyssal local: a toon anglerfish minding the footer
  var angler = document.createElement("div");
  angler.className = "depth-angler";
  angler.innerHTML =
    '<svg viewBox="0 0 120 90" width="104" height="78">' +
    '<circle cx="86" cy="18" r="7" fill="#ffd23f" opacity=".95" class="angler-lure"/>' +
    '<circle cx="86" cy="18" r="14" fill="#ffd23f" opacity=".22" class="angler-lure"/>' +
    '<path d="M84 20 Q70 22 62 34" stroke="#2a3560" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<path d="M30 52 C40 34 74 34 88 50 C92 55 92 60 88 64 C74 78 40 76 30 62 L14 74 L20 57 L14 42 Z" fill="#2e3a6e"/>' +
    '<circle cx="72" cy="50" r="6.5" fill="#f6eedd"/><circle cx="74" cy="51" r="3" fill="#0a1230"/>' +
    '<path d="M52 64 Q60 70 70 66" stroke="#0a1230" stroke-width="2.5" fill="none"/>' +
    '<path d="M56 40 L60 30 L66 39" fill="#2e3a6e"/>' +
    "</svg>";
  depthBg.appendChild(angler);

  var bubbleWrap = null;
  function sizeDepth() {
    var docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    depthBg.style.height = docH + "px";
    angler.style.top = Math.max(docH - 300, 0) + "px";
    // deep-water bubbles: a slow, sparse column (skipped under reduced motion)
    if (!reduced) {
      if (bubbleWrap) bubbleWrap.remove();
      bubbleWrap = document.createElement("div");
      bubbleWrap.className = "depth-bubbles";
      var n = Math.min(16, Math.max(8, Math.round(docH / 700)));
      for (var i = 0; i < n; i++) {
        var s = document.createElement("span");
        var sz = 5 + seededRand(i, 11) * 14;
        s.style.left = (4 + seededRand(i, 12) * 92) + "vw";
        s.style.top = docH * (0.3 + seededRand(i, 13) * 0.68) + "px";
        s.style.width = s.style.height = sz.toFixed(0) + "px";
        s.style.animationDuration = (5 + seededRand(i, 14) * 6).toFixed(1) + "s";
        s.style.animationDelay = (-seededRand(i, 15) * 8).toFixed(1) + "s";
        bubbleWrap.appendChild(s);
      }
      depthBg.appendChild(bubbleWrap);
    }
  }
  // sized after layout settles (fonts/images can change document height)
  window.addEventListener("load", sizeDepth);
  setTimeout(sizeDepth, 0);

  /* ============================================================
     1 · hero type field
     ============================================================ */
  var hero = document.querySelector(".hero");
  if (hero) {
    var cv = document.createElement("canvas");
    cv.className = "hero-field";
    cv.setAttribute("aria-hidden", "true");
    hero.prepend(cv);
    var ctx = cv.getContext("2d");
    var heroVisible = true;
    var tf0 = performance.now();

    function sizeHero() {
      var r = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeHero();
    window.addEventListener("resize", function () { sizeHero(); if (reduced) drawField(0); });

    function drawField(tMs) {
      var w = cv.clientWidth || hero.clientWidth;
      var h = cv.clientHeight || hero.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var font = getComputedStyle(document.querySelector("h1")).fontFamily;
      var t = tMs * 0.00022;
      var rows = 7;
      var size = Math.max(54, Math.min(120, w * 0.085));
      ctx.textBaseline = "middle";
      for (var i = 0; i < rows; i++) {
        var k = i / (rows - 1);
        var y = h * (0.06 + k * 0.88);
        // perspective-ish: rows swell near the middle and breathe slowly
        var swell = 0.62 + Math.sin(k * Math.PI) * 0.5;
        var s = size * swell * (1 + Math.sin(t * 2 + i * 1.7) * 0.045);
        var x = w * 0.5 + Math.sin(t * 1.6 + i * 0.9) * w * 0.045 - (k - 0.5) * w * 0.06;
        ctx.font = "800 " + s.toFixed(1) + "px " + font;
        ctx.fillStyle = "rgba(20, 18, 15, " + (0.028 + Math.sin(k * Math.PI) * 0.03).toFixed(3) + ")";
        ctx.textAlign = "center";
        ctx.fillText("jorge antolín", x, y);
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }).observe(hero);
    }

    if (reduced) {
      // one quiet, static frame
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawField(0); });
      else drawField(0);
    } else {
      var lastDraw = 0;
      (function loopField(now) {
        requestAnimationFrame(loopField);
        if (!heroVisible || body.classList.contains("mode-sea")) return;
        if (now - lastDraw < 33) return;   // ~30fps is plenty for a whisper
        lastDraw = now;
        drawField(now - tf0);
      })(tf0);
    }
  }

  /* ============================================================
     2 · flotsam — margin dwellers with scroll springs
     ============================================================ */
  var INK = "#14120f", CREAM = "#f6eedd", CORAL = "#ff5a3c", SEA = "#2b47d9", YEL = "#ffd23f";
  var SHAPES = [
    // paper boat
    '<svg viewBox="0 0 64 44" width="58"><path d="M8 26 L56 26 L46 40 L18 40 Z" fill="' + CORAL + '" stroke="' + INK + '" stroke-width="2.5"/><path d="M32 4 L32 26 L14 26 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.5"/><path d="M32 10 L32 26 L46 26 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.5"/></svg>',
    // drop
    '<svg viewBox="0 0 34 46" width="26"><path d="M17 3 C24 15 30 22 30 31 A13 13 0 1 1 4 31 C4 22 10 15 17 3 Z" fill="' + SEA + '" stroke="' + INK + '" stroke-width="2.5"/><circle cx="12" cy="30" r="3.4" fill="' + CREAM + '"/></svg>',
    // little fish
    '<svg viewBox="0 0 60 34" width="52"><path d="M6 17 C16 5 34 4 44 12 L54 5 L51 17 L54 29 L44 22 C34 30 16 29 6 17 Z" fill="' + YEL + '" stroke="' + INK + '" stroke-width="2.5"/><circle cx="18" cy="15" r="2.6" fill="' + INK + '"/></svg>',
    // rope knot
    '<svg viewBox="0 0 52 52" width="42"><circle cx="26" cy="26" r="16" fill="none" stroke="#a9613a" stroke-width="7"/><circle cx="26" cy="26" r="16" fill="none" stroke="' + INK + '" stroke-width="1.6" stroke-dasharray="5 6"/><path d="M40 14 L52 2" stroke="#a9613a" stroke-width="7" stroke-linecap="round"/></svg>',
    // starfish
    '<svg viewBox="0 0 50 48" width="40"><path d="M25 2 L31 17 L47 18 L34 28 L39 44 L25 35 L11 44 L16 28 L3 18 L19 17 Z" fill="' + CORAL + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    // tiny buoy
    '<svg viewBox="0 0 40 52" width="32"><path d="M12 20 A11 14 0 0 1 28 20 L26 40 L14 40 Z" fill="' + CORAL + '" stroke="' + INK + '" stroke-width="2.5"/><rect x="11" y="24" width="18" height="7" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2"/><path d="M20 8 L20 14" stroke="' + INK + '" stroke-width="2.5"/><circle cx="20" cy="6" r="3" fill="' + YEL + '" stroke="' + INK + '" stroke-width="2"/></svg>',
    // shell
    '<svg viewBox="0 0 48 40" width="38"><path d="M24 36 C8 36 4 22 6 10 C14 16 18 16 24 8 C30 16 34 16 42 10 C44 22 40 36 24 36 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.5"/><path d="M24 10 L24 34 M14 14 L20 34 M34 14 L28 34" stroke="' + INK + '" stroke-width="1.8"/></svg>',
  ];

  var wrap = document.createElement("div");
  wrap.id = "flotsam";
  wrap.setAttribute("aria-hidden", "true");
  body.appendChild(wrap);

  var items = [];
  function seededRand(i, j) {
    var s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function placeFlotsam() {
    wrap.innerHTML = "";
    items = [];
    var docH = Math.max(document.documentElement.scrollHeight, 1200);
    var n = Math.min(9, Math.max(6, Math.round(docH / 900)));
    for (var i = 0; i < n; i++) {
      var el = document.createElement("div");
      el.className = "flot";
      el.innerHTML = SHAPES[i % SHAPES.length];
      var left = i % 2 === 0;
      var xPct = left ? 1.5 + seededRand(i, 1) * 6 : 90 + seededRand(i, 2) * 6;
      var yAbs = docH * (0.10 + (i + seededRand(i, 3)) / (n + 1) * 0.82);
      el.style.left = xPct + "vw";
      el.style.top = yAbs + "px";
      var baseRot = (seededRand(i, 4) - 0.5) * 24;
      el.style.transform = "rotate(" + baseRot + "deg)";
      wrap.appendChild(el);
      items.push({
        el: el, y: 0, v: 0, rot: 0, rv: 0, baseRot: baseRot,
        depth: 0.55 + seededRand(i, 5) * 0.9,   // how hard scroll kicks it
        ph: seededRand(i, 6) * 6.28,
      });
    }
  }
  placeFlotsam();
  window.addEventListener("resize", debounce(placeFlotsam, 300));
  window.addEventListener("resize", debounce(sizeDepth, 300));

  function debounce(fn, ms) {
    var tm; return function () { clearTimeout(tm); tm = setTimeout(fn, ms); };
  }

  if (!reduced) {
    var lastScroll = window.scrollY;
    var lastT = performance.now();
    window.addEventListener("scroll", function () {
      var dy = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      for (var i = 0; i < items.length; i++) {
        items[i].v += dy * 0.55 * items[i].depth;    // the kick
        items[i].rv += dy * (i % 2 ? 0.10 : -0.10) * items[i].depth;
      }
    }, { passive: true });

    (function loopFlotsam(now) {
      requestAnimationFrame(loopFlotsam);
      var dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      if (body.classList.contains("mode-sea")) return;
      var t = now * 0.001;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        // damped spring back to rest — hang, fall, settle
        it.v += (-it.y * 42 - it.v * 6.5) * dt;
        it.y += it.v * dt;
        it.rv += (-it.rot * 30 - it.rv * 5.5) * dt;
        it.rot += it.rv * dt;
        var sway = Math.sin(t * 0.9 + it.ph) * 2.2;
        it.el.style.transform =
          "translateY(" + it.y.toFixed(1) + "px) rotate(" + (it.baseRot + it.rot + sway).toFixed(2) + "deg)";
      }
    })(lastT);
  }
})();
