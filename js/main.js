/* main.js — boot, capability detection, mode switching, overlays.
   the 3d bundle (three.js + world.js) is lazy-loaded so the content
   layer paints first and crawlers never wait on webgl. */

(function () {
  "use strict";

  /* v8.2.1 · BUILD stamps every js/css url (?v=) so browsers can cache hard
     but can never serve a stale bundle after a deploy. bump it on EVERY
     deploy that touches js or css (index.html tags + this constant). */
  var BUILD = "8.4";

  var cfg = window.PORTFOLIO_CONFIG || {};
  var body = document.body;
  var toggleBtn = document.getElementById("view-toggle");
  var loader = document.getElementById("loader");
  var hud = document.getElementById("hud");
  var worldStarted = false;
  var worldReady = false;

  document.getElementById("year").textContent = new Date().getFullYear();
  body.classList.add("js");

  /* ============================================================
     v8.2.1 · field debug — open /?debug=1 on any device and the
     overlay shows build, viewport, state machine and every js
     error, live. exists because a real iphone failed in ways no
     emulation reproduced; screenshot the panel and diagnosis is
     remote. pointer-events: none — it never eats input.
     ============================================================ */
  var DEBUG = /[?&]debug=1/.test(location.search);
  var dbgErrs = [];
  window.__ocLog = "";   // stamped by openCase
  if (DEBUG) {
    window.addEventListener("error", function (e) {
      dbgErrs.push((e.message || "script error") + " @" +
        String(e.filename || "").split("/").pop().split("?")[0] + ":" + e.lineno);
      if (dbgErrs.length > 4) dbgErrs.shift();
    });
    window.addEventListener("unhandledrejection", function (e) {
      dbgErrs.push("promise: " + String(e.reason).slice(0, 140));
      if (dbgErrs.length > 4) dbgErrs.shift();
    });
    var dbgEl = document.createElement("div");
    dbgEl.setAttribute("style",
      "position:fixed;top:64px;left:8px;max-width:88vw;z-index:99999;" +
      "background:rgba(0,0,0,.84);color:#7dffa8;font:10px/1.55 monospace;" +
      "padding:8px 10px;border-radius:8px;pointer-events:none;" +
      "white-space:pre-wrap;word-break:break-all;text-transform:none;");
    body.appendChild(dbgEl);
    setInterval(function () {
      var W = window.WORLD, st = null;
      try { st = W && W.getState ? W.getState() : null; } catch (err) { st = { err: String(err) }; }
      var openEl = document.querySelector(".case.open");
      var caseTxt = "none";
      if (openEl) {
        var cs = getComputedStyle(openEl), r = openEl.getBoundingClientRect();
        caseTxt = openEl.id + " display:" + cs.display + " " + Math.round(r.width) + "×" + Math.round(r.height) + " @" + Math.round(r.x) + "," + Math.round(r.y) +
          "\n  case op:" + cs.opacity + " vis:" + cs.visibility + " z:" + cs.zIndex +
          " tf:" + (cs.transform === "none" ? "none" : cs.transform.slice(0, 28)) +
          " anim:" + (cs.animationName || "none").slice(0, 12) +
          " surfacing:" + openEl.classList.contains("surfacing");
        /* v8.3: the definitive compositing probe — what does hit-testing
           actually find at the card's center? a descendant of the card
           means ios is compositing it; #stage/canvas/body means it isn't. */
        var hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        caseTxt += "\n  hit@center:" + (hit
          ? hit.tagName.toLowerCase() + (hit.id ? "#" + hit.id : "") +
            (hit.classList && hit.classList.length ? "." + hit.classList[0] : "") +
            (openEl.contains(hit) ? " (in card ✓)" : " (NOT in card ✗)")
          : "null");
      }
      var ccs = getComputedStyle(document.getElementById("content"));
      var contentCs = ccs.display + " op:" + ccs.opacity + " z:" + ccs.zIndex +
        " tf:" + (ccs.transform === "none" ? "none" : ccs.transform.slice(0, 22));
      var bcs = getComputedStyle(document.body);
      contentCs += " | body op:" + bcs.opacity + " tf:" + (bcs.transform === "none" ? "none" : "SET");
      var cvs = document.querySelector("#stage canvas");
      /* v8.3: computed compositing inputs of the webgl layer itself */
      var stageEl0 = document.getElementById("stage");
      var scs = getComputedStyle(stageEl0);
      var stageTxt = "z:" + scs.zIndex + " vis:" + scs.visibility +
        " tf:" + (scs.transform === "none" ? "none" : "SET") + " wc:" + scs.willChange;
      if (cvs) {
        var kcs = getComputedStyle(cvs);
        stageTxt += " | cv z:" + kcs.zIndex +
          " tf:" + (kcs.transform === "none" ? "none" : "SET") + " wc:" + kcs.willChange;
      }
      var nearest = "";
      if (st && cfg.ISLANDS) {
        var best = 1e9, name = "-";
        for (var i = 0; i < cfg.ISLANDS.length; i++) {
          var dx = st.x - cfg.ISLANDS[i].pos[0], dz = st.z - cfg.ISLANDS[i].pos[1];
          var d = Math.sqrt(dx * dx + dz * dz);
          if (d < best) { best = d; name = cfg.ISLANDS[i].id; }
        }
        nearest = name + " d=" + Math.round(best);
      }
      var vv = window.visualViewport;
      dbgEl.textContent =
        "build " + BUILD + " · tier " + (window.DEVICE_TIER || "?") + "\n" +
        "vp " + window.innerWidth + "×" + window.innerHeight +
        (vv ? " · vv " + Math.round(vv.width) + "×" + Math.round(vv.height) + " s" + vv.scale.toFixed(2) : "") +
        " · dpr " + (window.devicePixelRatio || 1) + "\n" +
        "canvas " + (cvs ? cvs.style.width + " " + cvs.style.height : "none") + "\n" +
        "body: " + body.className + "\n" +
        "world: " + (st ? JSON.stringify(st) : "not started") + "\n" +
        "nearest: " + nearest + "\n" +
        "#content: " + contentCs + "\n" +
        "#stage: " + stageTxt + "\n" +
        "case: " + caseTxt + "\n" +
        "openCase log: " + (window.__ocLog || "never") + "\n" +
        (dbgErrs.length ? "ERRORS:\n" + dbgErrs.join("\n") : "no js errors") + "\n" +
        "ua: " + navigator.userAgent.slice(0, 90);
    }, 500);
  }

  /* scroll reveals on dry land */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("inview");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".case, .about").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".case, .about").forEach(function (el) { el.classList.add("inview"); });
  }

  /* ---------- youtube embed ---------- */
  var ph = document.querySelector(".video-placeholder");
  if (ph && cfg.CAPULLOS_YOUTUBE_ID) {
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + cfg.CAPULLOS_YOUTUBE_ID;
    iframe.title = "capullos — liga u video campaign";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    ph.replaceWith(iframe);
  }

  /* ---------- social links ---------- */
  var social = document.getElementById("social");
  if (social && cfg.SOCIAL_LINKS && cfg.SOCIAL_LINKS.length) {
    cfg.SOCIAL_LINKS.forEach(function (s) {
      var a = document.createElement("a");
      a.href = s.url;
      a.textContent = s.label;
      a.target = "_blank";
      a.rel = "noopener";
      social.appendChild(a);
    });
  }

  /* ---------- capability detection ---------- */
  function webglOk() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  function deviceTier() {
    // crude but honest: cores + memory + touch
    var mem = navigator.deviceMemory || 4;
    var cores = navigator.hardwareConcurrency || 4;
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
    if (!webglOk()) return "none";
    if (mem <= 2 || cores <= 2) return "low";
    return mobile ? "mobile" : "high";
  }

  var tier = deviceTier();
  window.DEVICE_TIER = tier;

  /* v8.3: the loader ships visible in the initial html (loader-first boot,
     no menu flash). every path that doesn't keep it up must hide it. */
  function hideLoader() {
    if (loader.hidden) return;
    loader.classList.add("out");                 // opacity fade (css)
    setTimeout(function () {
      loader.hidden = true;
      loader.classList.remove("out");            // clean state for re-shows
    }, 520);
  }

  /* no webgl → stay in content mode forever, no toggle */
  if (tier === "none") { loader.hidden = true; return; }

  toggleBtn.hidden = false;

  /* ---------- close buttons for case overlays ---------- */
  document.querySelectorAll(".case").forEach(function (el) {
    // pick ink/cream for anything painted with this case's island color,
    // so the tinted UI never drops below AA contrast
    var dot = getComputedStyle(el).getPropertyValue("--dot").trim();
    if (/^#[0-9a-f]{6}$/i.test(dot)) {
      var r = parseInt(dot.slice(1, 3), 16), g = parseInt(dot.slice(3, 5), 16), b = parseInt(dot.slice(5, 7), 16);
      var yiq = (r * 299 + g * 587 + b * 114) / 1000;
      el.style.setProperty("--dot-text", yiq >= 140 ? "#14120f" : "#f6eedd");
    }
    var btn = document.createElement("button");
    btn.className = "close-case";
    btn.setAttribute("aria-label", "close case, back to the sea");
    btn.textContent = "×";
    btn.addEventListener("click", function () { closeCase(); });
    el.prepend(btn);
  });

  var openCaseEl = null;
  function openCase(id) {
    window.__ocLog = id + " @" + new Date().toISOString().slice(11, 19);
    var el = document.getElementById(id);
    if (!el) { window.__ocLog += " NO-EL"; return; }
    closeCase();
    openCaseEl = el;
    el.classList.add("open");
    body.classList.add("case-open");
    /* v8.2.2: the entry animation is applied only after the browser has
       committed display:block (double rAF) — ios can refuse or freeze an
       animation started in the same frame as a display flip, and the
       card's visibility must never hang on it. */
    el.classList.remove("surfacing");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (openCaseEl === el) el.classList.add("surfacing");
      });
    });
    el.scrollTop = 0;
    if (window.WORLD) window.WORLD.setPaused(true);
  }
  function closeCase() {
    var wasOpen = !!openCaseEl;
    if (openCaseEl) {
      openCaseEl.classList.remove("open", "surfacing");
      openCaseEl = null;
    }
    body.classList.remove("case-open");
    if (window.WORLD) {
      window.WORLD.setPaused(false);
      if (wasOpen && body.classList.contains("mode-sea") && window.WORLD.suggestNext) {
        setTimeout(function () { window.WORLD.suggestNext(); }, 600);
      }
    }
  }
  window.openCase = openCase;
  window.closeCase = closeCase;

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && body.classList.contains("mode-sea")) {
      if (openCaseEl) closeCase();
      else {
        setMode("content");
        if (typeof cleanupTransition === "function") cleanupTransition();
      }
    }
  });

  /* ---------- mode switching ---------- */
  function setMode(mode) {
    if (mode === "sea") {
      body.classList.remove("mode-content");
      body.classList.add("mode-sea");
      hud.hidden = false;
      toggleBtn.textContent = "abandon ship 🤿";
      toggleBtn.dataset.mode = "sea";
      startWorld();
    } else {
      closeCase();
      body.classList.remove("mode-sea");
      body.classList.add("mode-content");
      hud.hidden = true;
      toggleBtn.textContent = "enter the sea 🌊";
      toggleBtn.dataset.mode = "content";
      if (window.WORLD) window.WORLD.setPaused(true);
    }
  }

  /* v5: the head-first exit. the diver's splash hands over to an
     underwater veil (turquoise → deep ultramarine, bubbles, light rays)
     and the dry land rises from below it — the portfolio literally
     lives under the sea. escape stays instant; reduced motion skips
     the whole show. */
  var seaVeil = document.createElement("div");
  seaVeil.id = "sea-veil";
  seaVeil.setAttribute("aria-hidden", "true");
  var veilBubbles = "";
  for (var vb = 0; vb < 18; vb++) {
    var vl = (vb * 53.7) % 100;
    var vs = 6 + ((vb * 37) % 18);
    var vd = 1.1 + ((vb * 29) % 10) / 7;
    var vdel = ((vb * 41) % 14) / 10;
    veilBubbles += "<span class='bub' style='left:" + vl + "%;width:" + vs + "px;height:" + vs +
      "px;animation-duration:" + vd.toFixed(2) + "s;animation-delay:" + vdel.toFixed(2) + "s'></span>";
  }
  seaVeil.innerHTML = veilBubbles;
  document.body.appendChild(seaVeil);
  var diving = false;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cleanupTransition() {
    seaVeil.classList.remove("show");
    body.classList.remove("diving", "menu-below", "menu-anim", "boarding");
    diving = false;
  }

  function exitSea() {
    if (diving) return;
    if (!(window.WORLD && window.WORLD.diveOut && worldReady) || reducedMotion) {
      setMode("content");
      return;
    }
    diving = true;
    body.classList.add("diving");            // HUD fades out of the shot
    window.WORLD.diveOut(function () {       // fires at splashdown
      if (!body.classList.contains("mode-sea")) { cleanupTransition(); return; }   // escape won
      seaVeil.classList.add("show");         // we're under with him
      setTimeout(function () {
        body.classList.add("menu-below");    // park the menu 100vh down (no anim)
        setMode("content");                  // swap layers beneath the veil
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            body.classList.add("menu-anim");     // arm the spring…
            body.classList.remove("menu-below"); // …and let the menu surface
          });
        });
        setTimeout(function () { seaVeil.classList.remove("show"); }, 950);
        setTimeout(function () { cleanupTransition(); }, 1650);
      }, 520);
    });
  }

  toggleBtn.addEventListener("click", function () {
    if (toggleBtn.dataset.mode === "sea") exitSea();
    else enterSea();
  });

  /* v5: the way back — menu sinks away, we surface next to the canoe
     and watch him haul himself aboard (WORLD.boardIn). first visit
     keeps the classic loader + aerial intro. */
  function enterSea() {
    if (diving) return;
    if (!(window.WORLD && window.WORLD.boardIn && worldReady) || reducedMotion) {
      setMode("sea");
      return;
    }
    diving = true;
    seaVeil.classList.add("show");
    body.classList.add("menu-anim");         // transition armed
    requestAnimationFrame(function () {
      body.classList.add("menu-below");      // menu sinks out of view
    });
    /* v6: the menu's sink, the veil and the camera's rise all OVERLAP.
       the world takes the frame as soon as the veil is opaque (~450ms),
       renders its first surfacing frames underneath, and only then is
       revealed — no dead air between click and rowing (~2.75s total). */
    setTimeout(function () {
      setMode("sea");                        // world takes the frame under the veil
      body.classList.add("boarding");        // HUD stays hidden during the climb
      body.classList.remove("menu-below", "menu-anim");
      window.WORLD.boardIn(function () {
        body.classList.remove("boarding");
        diving = false;
      });
      setTimeout(function () { seaVeil.classList.remove("show"); }, 380);
    }, 450);
  }

  /* ---------- lazy 3d loading ---------- */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function startWorld() {
    if (worldStarted) {
      if (worldReady && window.WORLD) window.WORLD.setPaused(false);
      return;
    }
    worldStarted = true;
    loader.classList.remove("out");
    loader.hidden = false;
    var msgs = ["inflating the sea…", "waxing the canoe…", "bribing the seagulls…", "planting the capullos…", "hiding the easter eggs…"];
    var mi = 0;
    var loaderP = loader.querySelector("p");
    var msgTimer = setInterval(function () {
      if (loader.hidden) { clearInterval(msgTimer); return; }
      mi = (mi + 1) % msgs.length;
      loaderP.textContent = msgs[mi];
    }, 1300);
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
      .then(function () { return loadScript("js/world.js?v=" + BUILD); })
      .then(function () {
        return window.WORLD.init({
          container: document.getElementById("stage"),
          tier: tier,
          islands: cfg.ISLANDS,
          onDock: function (islandId) { openCase(islandId); },
        });
      })
      .then(function () {
        worldReady = true;
        hideLoader();   // v8.3: fade, not pop — the world is already rendering under it
        // cinematic title card over the intro swoop, first time only
        var tc = document.getElementById("title-card");
        if (tc && !tc.dataset.shown) {
          tc.dataset.shown = "1";
          tc.classList.add("show");
          setTimeout(function () {
            tc.classList.remove("show");
            showControlsCard();
          }, 3800);
        }
      })
      .catch(function (err) {
        console.error("3d failed, staying on dry land:", err);
        hideLoader();
        toggleBtn.hidden = true;
        setModeFallback();
      });
  }

  /* controls card: shown once, dismissed on first input or after 5s */
  function showControlsCard() {
    var cc = document.getElementById("controls-card");
    if (!cc || cc.dataset.shown) return;
    cc.dataset.shown = "1";
    var touch = navigator.maxTouchPoints > 1 || "ontouchstart" in window;
    cc.querySelector("[data-mode='keys']").hidden = touch;
    cc.querySelector("[data-mode='touch']").hidden = !touch;
    cc.classList.add("show");
    var hide = function () {
      cc.classList.remove("show");
      document.removeEventListener("keydown", hide);
      document.removeEventListener("pointerdown", hide);
    };
    setTimeout(hide, 5200);
    setTimeout(function () {
      document.addEventListener("keydown", hide);
      document.addEventListener("pointerdown", hide);
    }, 400);
  }

  function setModeFallback() {
    body.classList.remove("mode-sea");
    body.classList.add("mode-content");
    hud.hidden = true;
  }

  /* auto-enter the sea on capable devices, after content is painted.
     deep links (#capullos etc.) keep the content view so shared urls
     land directly on the case. */
  var hasHash = location.hash && document.querySelector(location.hash);
  if (!hasHash && (tier === "high" || tier === "mobile")) {
    /* auto-entering the sea: the loader (already on screen since first
       paint) simply stays up until the world is ready. */
    window.addEventListener("load", function () {
      setTimeout(function () { setMode("sea"); }, 350);
    });
  } else {
    /* v8.3: destination is the content view (deep link or low tier) —
       drop the loader now, synchronously, before/at first paint. */
    loader.hidden = true;
  }
})();
