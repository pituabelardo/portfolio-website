/* track.js — anonymous visit log (AGENTS §5.1).
   what it records: which page, where the visit came from (referrer / utm),
   coarse geo (added server-side by api/v.js, never the ip), device class,
   how long the tab was actually in use, how far you scrolled, and what you
   opened (cases, pitches, the contact panel, the cv, outbound links).
   what it doesn't: cookies, fingerprinting, anything that follows a person
   across visits — the id lives in sessionStorage and dies with the tab.
   jorge's own devices: open any page once with ?me=1 (?me=0 undoes it) and
   his visits are flagged so the stats page can hide them. */

(function () {
  "use strict";
  if (window.JA_TRACK) return;

  var ENDPOINT = "/api/v";
  var noop = function () {};
  window.JA_TRACK = noop;

  try {
    var qs = location.search;
    if (/[?&]me=1(&|$)/.test(qs)) localStorage.setItem("ja_me", "1");
    if (/[?&]me=0(&|$)/.test(qs)) localStorage.removeItem("ja_me");
  } catch (e) { /* storage blocked: fine */ }

  var me = false;
  try { me = localStorage.getItem("ja_me") === "1"; } catch (e) { /* noop */ }

  var sid = null;
  try {
    sid = sessionStorage.getItem("ja_sid");
    if (!sid) {
      var a = new Uint8Array(12);
      (window.crypto || window.msCrypto).getRandomValues(a);
      sid = Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      sessionStorage.setItem("ja_sid", sid);
      sessionStorage.setItem("ja_landing", location.pathname + location.search + location.hash);
      sessionStorage.setItem("ja_ref", document.referrer || "");
    }
  } catch (e) {
    sid = "nostore" + Math.random().toString(36).slice(2, 14);
  }

  var ua = navigator.userAgent || "";
  var bot = !!navigator.webdriver ||
    /bot\b|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|whatsapp|telegram|prerender/i.test(ua);

  var utm = (qs.match(/[?&](utm_[a-z]+=[^&#]*)/gi) || []).map(function (s) { return s.slice(1); }).join("&");
  var page = location.pathname.replace(/\.html$/, "") || "/";

  var queue = [];
  var seen = {};
  var activeMs = 0, lastTick = Date.now(), lastInput = Date.now();
  var maxScroll = 0;
  var IDLE_MS = 120000;   // two minutes without any input stops the clock

  function visible() { return document.visibilityState === "visible"; }

  function tick() {
    var now = Date.now();
    if (visible() && now - lastInput < IDLE_MS) activeMs += Math.min(now - lastTick, 5000);
    lastTick = now;
  }
  setInterval(tick, 1000);

  ["pointerdown", "keydown", "wheel", "touchstart", "scroll", "mousemove"].forEach(function (ev) {
    window.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true, capture: true });
  });

  function scrollPct() {
    var d = document.documentElement;
    var h = Math.max(d.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
    if (h <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((window.scrollY || d.scrollTop) / h * 100)));
  }
  /* (v10.1) proof of a person: the first real gesture — a tap, a click, a
     key, a wheel, or ~80px of pointer travel. link scanners and preview
     bots load the page and sit still, so a visit without this is a robot
     until proven otherwise. only the kind of gesture is sent, once. */
  var gestured = false, travel = 0, lastPX = null, lastPY = null;
  function gesture(kind) {
    if (gestured) return;
    gestured = true;
    track("human", kind, true);
    send(false, false);
  }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, function (e) { if (e.isTrusted !== false) gesture(ev === "pointerdown" ? (e.pointerType || "pointer") : ev); },
      { passive: true, capture: true });
  });
  window.addEventListener("pointermove", function (e) {
    if (gestured || e.isTrusted === false || e.pointerType !== "mouse") return;
    if (lastPX !== null) travel += Math.abs(e.clientX - lastPX) + Math.abs(e.clientY - lastPY);
    lastPX = e.clientX; lastPY = e.clientY;
    if (travel > 80) gesture("mouse");
  }, { passive: true, capture: true });

  window.addEventListener("scroll", function () {
    var p = scrollPct();
    if (p > maxScroll) maxScroll = p;
  }, { passive: true });

  function payload(withMeta) {
    var p = {
      sid: sid, page: page, me: me, bot: bot,
      active_ms: activeMs, scroll: maxScroll,
      events: queue.splice(0, 40)
    };
    if (withMeta) {
      var landing = "", ref = "";
      try { landing = sessionStorage.getItem("ja_landing") || ""; ref = sessionStorage.getItem("ja_ref") || ""; } catch (e) { /* noop */ }
      p.landing = landing || location.pathname + location.search + location.hash;
      p.ref = ref || document.referrer || "";
      p.utm = utm;
      p.lang = (navigator.language || "").toLowerCase();
      try { p.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { p.tz = ""; }
      p.vp = window.innerWidth + "x" + window.innerHeight;
    }
    return JSON.stringify(p);
  }

  function send(withMeta, final) {
    tick();
    var body = payload(withMeta);
    try {
      if (final && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
        return;
      }
      fetch(ENDPOINT, { method: "POST", body: body, keepalive: true, credentials: "omit",
        headers: { "Content-Type": "text/plain" } }).catch(noop);
    } catch (e) { /* noop */ }
  }

  function track(kind, detail, once) {
    var key = kind + "|" + (detail || "");
    if (once && seen[key]) return;
    seen[key] = 1;
    queue.push({ k: String(kind).slice(0, 40), d: detail == null ? null : String(detail).slice(0, 200) });
  }
  window.JA_TRACK = track;

  /* first beacon: the arrival itself */
  track("view", page + (location.hash || ""));
  send(true, false);

  /* flush what happened every 15s while there's news, and always on the way out */
  var lastSentActive = 0;
  setInterval(function () {
    tick();
    if (queue.length || activeMs - lastSentActive > 20000) {
      lastSentActive = activeMs;
      send(false, false);
    }
  }, 15000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { track("hide", Math.round(activeMs / 1000) + "s"); send(false, true); }
    else { lastInput = Date.now(); lastTick = Date.now(); track("back", null); }
  });
  window.addEventListener("pagehide", function () { send(false, true); });

  /* ---- what got opened ---- */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var a = t.closest("a[href]");
    if (a) {
      var href = a.getAttribute("href") || "";
      if (/^mailto:/i.test(href)) track("mail", href.slice(7, 60));
      else if (/^tel:/i.test(href)) track("phone", null);
      else if (/\/cv\/.*\.pdf/i.test(href)) track("cv", href.split("/").pop());
      else if (/linkedin\.com/i.test(href)) track("linkedin", null);
      else if (/^https?:/i.test(href) && a.host !== location.host) track("out", a.host + a.pathname.slice(0, 60));
      else if (href.charAt(0) === "#") track("anchor", href.slice(0, 60));
      else track("nav", href.slice(0, 80));
      return;
    }
    var b = t.closest("button");
    if (!b) return;
    if (b.id === "loader-skip") track("skip-sea", null);
    else if (b.id === "view-toggle") track("toggle", b.dataset.mode === "sea" ? "leave-sea" : "enter-sea");
    else if (b.classList.contains("yt-facade")) track("video", "capullos");
    else if (b.classList.contains("lang-chip")) track("video-lang", b.textContent);
    else if (b.id === "dock-btn") track("dock", null);
    else if (b.dataset.track) track(b.dataset.track, b.dataset.trackDetail || null);
  }, true);

  /* cases opened from the sea (class flips on the article) and the contact panel */
  function watchCases() {
    var cases = document.querySelectorAll(".case");
    if (!cases.length || !window.MutationObserver) return;
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        var el = m.target;
        if (el.classList && el.classList.contains("open") && !el.__jaOpen) { el.__jaOpen = 1; track("case", el.id); }
        else if (el.classList && !el.classList.contains("open")) el.__jaOpen = 0;
      });
    });
    cases.forEach(function (c) { mo.observe(c, { attributes: true, attributeFilter: ["class"] }); });

    var bmo = new MutationObserver(function () {
      var b = document.body.classList;
      if (b.contains("contact-open") && !document.body.__jaC) { document.body.__jaC = 1; track("contact", null); }
      if (!b.contains("contact-open")) document.body.__jaC = 0;
      var mode = b.contains("mode-sea") ? "sea" : "land";
      if (mode !== document.body.__jaMode) { document.body.__jaMode = mode; track("mode", mode); }
    });
    bmo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    /* on dry land: which cases actually crossed the screen (once each) */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && document.body.classList.contains("mode-content")) {
            track("seen", en.target.id, true);
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0, rootMargin: "-45% 0px -45% 0px" });   // crossed the middle of the screen
      document.querySelectorAll(".case, .about, [data-track-seen]").forEach(function (c) { io.observe(c); });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchCases);
  else watchCases();
})();
