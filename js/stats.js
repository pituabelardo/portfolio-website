/* stats.js — renders jorge's private logbook from /api/stats.
   the key comes from #k=… (then it's stored on this device and wiped from
   the address bar) or from the form. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var KEY_LS = "ja_stats_key";
  var key = "";
  var rows = [];

  var m = location.hash.match(/[#&]k=([^&]+)/);
  if (m) {
    key = decodeURIComponent(m[1]);
    try { localStorage.setItem(KEY_LS, key); } catch (e) { /* noop */ }
    history.replaceState(null, "", location.pathname);
  } else {
    try { key = localStorage.getItem(KEY_LS) || ""; } catch (e) { /* noop */ }
  }
  /* looking at the logbook is not a visit to log */
  try { localStorage.setItem("ja_me", "1"); } catch (e) { /* noop */ }

  var COUNTRY = { US: "usa", ES: "spain", GB: "uk", FR: "france", DE: "germany", NL: "netherlands", IT: "italy", PT: "portugal", CA: "canada", MX: "mexico", IE: "ireland", BR: "brazil", AR: "argentina" };
  var LABEL = {
    view: "landed", case: "opened case", seen: "scrolled past", pitch: "pitch", contact: "contact panel",
    cv: "cv", mail: "email", phone: "phone", linkedin: "linkedin", out: "link", nav: "page", anchor: "jump",
    "skip-sea": "skipped the sea", toggle: "toggle", mode: "mode", video: "played video", "video-lang": "video lang",
    dock: "docked", hide: "left tab", back: "came back", "pitch-read": "read pitch to", "pitch-section": "pitch section"
  };

  function fmtDur(ms) {
    var s = Math.round((ms || 0) / 1000);
    if (s < 60) return s + "s";
    var mnt = Math.floor(s / 60), r = s % 60;
    return mnt + "m " + (r < 10 ? "0" : "") + r + "s";
  }
  function fmtWhen(iso) {
    try {
      return new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function shortRef(r) {
    if (!r) return "direct / typed / app";
    try { var u = new URL(r); return u.host + (u.pathname.length > 1 ? u.pathname.slice(0, 40) : ""); } catch (e) { return r.slice(0, 60); }
  }

  function filtered() {
    return rows.filter(function (r) {
      if ($("f-me").checked && r.is_me) return false;
      if ($("f-bot").checked && r.is_bot) return false;
      if ($("f-us").checked && r.country !== "US") return false;
      if ($("f-short").checked && (r.active_ms || 0) < 5000) return false;
      return true;
    });
  }

  function render() {
    var list = filtered();
    var real = rows.filter(function (r) { return !r.is_me && !r.is_bot; });
    var us = real.filter(function (r) { return r.country === "US"; });
    var usTime = us.reduce(function (a, r) { return a + (r.active_ms || 0); }, 0);
    var countries = {};
    real.forEach(function (r) { var c = r.country || "?"; countries[c] = (countries[c] || 0) + 1; });
    var topC = Object.keys(countries).sort(function (a, b) { return countries[b] - countries[a]; }).slice(0, 4)
      .map(function (c) { return (COUNTRY[c] || c.toLowerCase()) + " " + countries[c]; }).join(" · ");
    var opened = real.filter(function (r) { return (r.events || []).some(function (e) { return e.k === "case" || e.k === "pitch" || e.k === "pitch-read"; }); }).length;

    $("st-kpis").innerHTML =
      '<div class="st-kpi' + (us.length ? " hot" : "") + '"><strong>' + us.length + '</strong><span>visits from the usa</span></div>' +
      '<div class="st-kpi' + (us.length ? " hot" : "") + '"><strong>' + fmtDur(usTime) + '</strong><span>time spent by usa visits</span></div>' +
      '<div class="st-kpi"><strong>' + real.length + '</strong><span>visits (not you, not bots)</span></div>' +
      '<div class="st-kpi"><strong>' + opened + '</strong><span>opened a case or pitch</span></div>' +
      '<div class="st-kpi"><strong style="font-size:18px;line-height:1.25">' + esc(topC || "—") + '</strong><span>where from</span></div>';

    if (!list.length) {
      $("st-list").innerHTML = '<li class="st-empty">no visits match. the sea is quiet.</li>';
      return;
    }
    $("st-list").innerHTML = list.map(function (r) {
      var cls = "st-row" + (r.country === "US" ? " us" : "") + (r.is_me ? " me" : "") + (r.is_bot ? " bot" : "");
      var where = [r.city, r.region && r.country === "US" ? r.region : null, COUNTRY[r.country] || (r.country || "?").toLowerCase()].filter(Boolean).join(", ");
      var badges = (r.country === "US" ? '<span class="st-badge us">usa</span>' : "") +
        (r.is_me ? '<span class="st-badge">you</span>' : "") + (r.is_bot ? '<span class="st-badge">bot</span>' : "");
      var evs = (r.events || []).filter(function (e) { return ["hide", "back", "mode"].indexOf(e.k) < 0; }).map(function (e) {
        var t = "";
        try { t = new Date(e.at).toLocaleTimeString("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }); } catch (x) { /* noop */ }
        return '<span class="st-ev k-' + esc(e.k) + '" title="' + esc(t) + '">' + esc(LABEL[e.k] || e.k) + (e.d ? " · " + esc(e.d) : "") + "</span>";
      }).join("");
      return '<li class="' + cls + '">' +
        '<div class="st-top"><span class="st-where">' + esc(where) + "</span>" + badges +
        '<span class="st-when">' + esc(fmtWhen(r.first_seen)) + "</span>" +
        '<span class="st-dur" title="time with the tab in use">' + fmtDur(r.active_ms) + "</span></div>" +
        '<p class="st-meta">from ' + esc(shortRef(r.referrer)) + " · landed on " + esc(r.landing || "/") +
        (r.utm ? " · " + esc(r.utm) : "") + " · " + esc([r.device, r.browser, r.viewport].filter(Boolean).join(" · ")) +
        " · scrolled " + (r.max_scroll || 0) + "%" + (r.pages && r.pages.length > 1 ? " · pages: " + esc(r.pages.join(", ")) : "") +
        (r.lang ? " · " + esc(r.lang) : "") + (r.tz ? " · " + esc(r.tz) : "") + "</p>" +
        (evs ? '<div class="st-evs">' + evs + "</div>" : "") +
        "</li>";
    }).join("");
  }

  function load() {
    $("st-err").textContent = "";
    return fetch("/api/stats", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
      body: JSON.stringify({ k: key, days: +$("f-days").value })
    }).then(function (res) {
      if (res.status === 403) throw new Error("wrong key");
      if (!res.ok) throw new Error("couldn't reach the logbook (" + res.status + ")");
      return res.json();
    }).then(function (data) {
      rows = Array.isArray(data) ? data : [];
      $("st-login").hidden = true;
      $("st-main").hidden = false;
      $("st-at").textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
      render();
    }).catch(function (err) {
      $("st-main").hidden = true;
      $("st-login").hidden = false;
      $("st-err").textContent = err.message;
    });
  }

  $("st-login").addEventListener("submit", function (e) {
    e.preventDefault();
    key = $("st-key").value.trim();
    try { localStorage.setItem(KEY_LS, key); } catch (x) { /* noop */ }
    load();
  });
  ["f-me", "f-bot", "f-us", "f-short"].forEach(function (id) { $(id).addEventListener("change", render); });
  $("f-days").addEventListener("change", load);
  $("f-refresh").addEventListener("click", load);
  $("st-forget").addEventListener("click", function () {
    try { localStorage.removeItem(KEY_LS); } catch (e) { /* noop */ }
    key = ""; rows = [];
    $("st-main").hidden = true; $("st-login").hidden = false;
  });

  if (key) load(); else $("st-login").hidden = false;
  setInterval(function () { if (key && !document.hidden && !$("st-main").hidden) load(); }, 60000);
})();
