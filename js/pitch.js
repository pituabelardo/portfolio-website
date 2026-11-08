/* pitch.js — the long-form pitch pages. three small jobs:
   1. a reading-progress hairline under the top bar,
   2. a lightbox for the deck slides and the pieces (<dialog>, so escape,
      focus and the backdrop are the browser's, not ours),
   3. tell the anonymous visit log (track.js) how far the reader got. */
(function () {
  "use strict";
  var page = document.body.getAttribute("data-pitch") || "pitch";
  var track = function (k, d, once) { if (window.JA_TRACK) window.JA_TRACK(k, d, once); };
  track("pitch", page, true);

  /* 1 · progress */
  var bar = document.querySelector(".pp-progress");
  if (bar) {
    var ticking = false;
    var paint = function () {
      ticking = false;
      var d = document.documentElement;
      var max = d.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 1).toFixed(4) + ")";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* 2 · lightbox */
  var lb = document.getElementById("lb");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("p");
    document.querySelectorAll("[data-full]").forEach(function (b) {
      b.addEventListener("click", function () {
        var img = b.querySelector("img");
        lbImg.src = b.getAttribute("data-full");
        lbImg.alt = img ? img.alt : "";
        lbCap.textContent = img ? img.alt : "";
        lb.showModal();
        track("pitch-zoom", page + ":" + (b.getAttribute("data-full") || "").split("/").pop());
      });
    });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || (e.target.closest && e.target.closest(".lb-close"))) lb.close();
    });
  } else {
    /* no <dialog>: the button just opens the image */
    document.querySelectorAll("[data-full]").forEach(function (b) {
      b.addEventListener("click", function () { window.open(b.getAttribute("data-full"), "_blank", "noopener"); });
    });
  }

  /* 3 · how far they read: each numbered band reports once, when its
     middle crosses the screen */
  if ("IntersectionObserver" in window) {
    var deepest = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = +en.target.getAttribute("data-sec-n") || 0;
        if (n > deepest) {
          deepest = n;
          track("pitch-read", page + " · " + en.target.getAttribute("data-sec"), false);
        }
        io.unobserve(en.target);
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    document.querySelectorAll("[data-sec]").forEach(function (el, i) {
      el.setAttribute("data-sec-n", i + 1);
      io.observe(el);
    });
  }
})();
