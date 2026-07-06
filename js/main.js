/* main.js — boot, capability detection, mode switching, overlays.
   the 3d bundle (three.js + world.js) is lazy-loaded so the content
   layer paints first and crawlers never wait on webgl. */

(function () {
  "use strict";

  var cfg = window.PORTFOLIO_CONFIG || {};
  var body = document.body;
  var toggleBtn = document.getElementById("view-toggle");
  var loader = document.getElementById("loader");
  var hud = document.getElementById("hud");
  var worldStarted = false;
  var worldReady = false;

  document.getElementById("year").textContent = new Date().getFullYear();
  body.classList.add("js");

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

  /* no webgl → stay in content mode forever, no toggle */
  if (tier === "none") return;

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
    var el = document.getElementById(id);
    if (!el) return;
    closeCase();
    openCaseEl = el;
    el.classList.add("open");
    body.classList.add("case-open");
    el.scrollTop = 0;
    if (window.WORLD) window.WORLD.setPaused(true);
  }
  function closeCase() {
    var wasOpen = !!openCaseEl;
    if (openCaseEl) {
      openCaseEl.classList.remove("open");
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
      .then(function () { return loadScript("js/world.js"); })
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
        loader.hidden = true;
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
        loader.hidden = true;
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
    window.addEventListener("load", function () {
      setTimeout(function () { setMode("sea"); }, 350);
    });
  }
})();
