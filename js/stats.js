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
    dock: "docked", hide: "left tab", back: "came back", "pitch-read": "read pitch to", "pitch-section": "pitch section", human: "real gesture"
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

  /* ---- (v10.1) robot or person, and could it be the nba process? ----
     the tracker can't see the ip, so this reads the traces a visit leaves.
     robot: flagged by the tracker, or the fingerprints of a datacenter
     browser (clock set to utc/unknown, no language, the 800×600 default
     window, a city that is a google/meta/aws server farm). person: a real
     gesture (the "human" event, from 11 nov 2026) or a click that only a
     hand makes. nba: a person, from the usa / an american clock / american
     english, or arriving from a job platform or an nba / take-two host. */
  var DC_CITIES = /^(council bluffs|prineville|the dalles|boardman|ashburn|quincy|forest city|altoona|lenoir|moncks corner|mayes county|pryor|eemshaven|st\. ghislain|hamina|mountain view)$/i;
  var ATS = /greenhouse|lever\.co|workday|myworkdayjobs|ashbyhq|smartrecruiters|icims|taleo|successfactors|jobvite|bamboohr|linkedin|indeed|teamtailor|nba\.com|take2|2k\.com|nbat2/i;
  var HAND = ["human", "anchor", "nav", "cv", "mail", "phone", "linkedin", "out", "dock", "video", "video-lang", "toggle", "skip-sea", "contact"];

  function robotWhy(r) {
    var why = [];
    if (r.is_bot) why.push("flagged by the tracker");
    if (!r.tz || r.tz === "UTC" || r.tz === "Etc/Unknown" || /^Etc\//.test(r.tz)) why.push("clock " + (r.tz || "missing"));
    if (!r.lang) why.push("no language");
    if (r.viewport === "800x600") why.push("800×600 default window");
    if (r.city && DC_CITIES.test(r.city)) why.push(r.city.toLowerCase() + " is a server farm");
    return why;
  }
  function handWhy(r) {
    var ks = [];
    (r.events || []).forEach(function (e) {
      if (HAND.indexOf(e.k) >= 0) {
        var lbl = e.k === "human" ? "real " + (e.d || "gesture") : (LABEL[e.k] || e.k);
        if (ks.indexOf(lbl) < 0) ks.push(lbl);
      }
    });
    return ks;
  }
  function nbaWhy(r) {
    var why = [];
    if (r.country === "US") why.push("usa" + (r.region ? " (" + r.region.toLowerCase() + ")" : ""));
    if (r.tz && /^America\//.test(r.tz)) why.push("american clock " + r.tz.slice(8).toLowerCase());
    if (r.lang && /^en-us/.test(r.lang) && r.country !== "ES") why.push("american english");
    if (r.referrer && ATS.test(r.referrer)) why.push("came from " + shortRef(r.referrer));
    if (r.utm && ATS.test(r.utm)) why.push("tagged " + r.utm);
    return why;
  }
  function classify(r) {
    if (r.__c) return r.__c;
    var rob = robotWhy(r), hand = handWhy(r), nba = nbaWhy(r);
    var robot = rob.length > 0 && !(hand.length && !r.is_bot && rob.length === 1);
    var level = "none";
    if (!r.is_me && !robot && nba.length) level = hand.length ? "likely" : "maybe";
    r.__c = { robot: robot, rob: rob, hand: hand, nba: nba, level: level };
    return r.__c;
  }

  function renderNba() {
    var others = rows.filter(function (r) { return !r.is_me; });
    var hits = others.filter(function (r) { return classify(r).level !== "none"; });
    var likely = hits.filter(function (r) { return classify(r).level === "likely"; });
    var usBots = others.filter(function (r) { return classify(r).robot && (r.country === "US" || nbaWhy(r).length); });
    var box = $("st-nba");
    box.className = "st-nba" + (likely.length ? " hot" : hits.length ? " warm" : "");
    var head;
    if (likely.length) head = "<strong>" + likely.length + "</strong> possible nba visit" + (likely.length > 1 ? "s" : "") + " — a person, from the usa side, who did something with the page.";
    else if (hits.length) head = "<strong>" + hits.length + "</strong> visit" + (hits.length > 1 ? "s" : "") + " from the usa side that don't look like robots, but never touched the page. could be someone glancing — can't be sure.";
    else head = "no sign of anyone from the nba process yet.";
    var list = hits.map(function (r) {
      var c = classify(r);
      return "<li><b>" + (c.level === "likely" ? "likely a person" : "maybe") + "</b> · " + esc(fmtWhen(r.first_seen)) +
        " · " + esc([r.city, r.country].filter(Boolean).join(", ")) + " · " + fmtDur(r.active_ms) +
        "<br><span>why: " + esc(c.nba.concat(c.hand).join(" · ")) + "</span></li>";
    }).join("");
    var bots = usBots.length
      ? '<p class="st-nba-bots">+ ' + usBots.length + " robot check" + (usBots.length > 1 ? "s" : "") +
        " from the usa (link scanners / previews: a company's system opened your link — it can mean the link is moving, never that someone read it). " +
        "their time and 0% scroll mean nothing.</p>"
      : "";
    box.innerHTML = '<p class="st-nba-k">nba watch</p><p class="st-nba-h">' + head + "</p>" +
      (list ? '<ul class="st-nba-list">' + list + "</ul>" : "") + bots +
      '<p class="st-nba-note">person = a real gesture (tracked since 11 nov) or a click on something. ' +
      "a pdf opened straight from /cv/ is invisible to this log.</p>";
  }

  function filtered() {
    return rows.filter(function (r) {
      if ($("f-me").checked && r.is_me) return false;
      if ($("f-bot").checked && classify(r).robot) return false;
      if ($("f-us").checked && r.country !== "US") return false;
      if ($("f-short").checked && (r.active_ms || 0) < 5000) return false;
      return true;
    });
  }

  function render() {
    renderNba();
    var list = filtered();
    var real = rows.filter(function (r) { return !r.is_me && !classify(r).robot; });
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
      var c = classify(r);
      var cls = "st-row" + (r.country === "US" && !c.robot ? " us" : "") + (r.is_me ? " me" : "") + (c.robot ? " bot" : "") + (c.level !== "none" ? " nba" : "");
      var where = [r.city, r.region && r.country === "US" ? r.region : null, COUNTRY[r.country] || (r.country || "?").toLowerCase()].filter(Boolean).join(", ");
      var badges = (r.country === "US" ? '<span class="st-badge us">usa</span>' : "") +
        (c.level === "likely" ? '<span class="st-badge nba">possible nba</span>' : c.level === "maybe" ? '<span class="st-badge nba">nba?</span>' : "") +
        (r.is_me ? '<span class="st-badge">you</span>' : "") +
        (c.robot ? '<span class="st-badge" title="' + esc(c.rob.join(" · ")) + '">robot</span>' : c.hand.length && !r.is_me ? '<span class="st-badge person">person</span>' : "");
      /* compact: the deepest section read per pitch, and every case that
         scrolled past folded into one pill */
      var raw = (r.events || []).filter(function (e) { return ["hide", "back", "mode"].indexOf(e.k) < 0; });
      var deepest = {}, seenIds = [];
      raw.forEach(function (e) {
        if (e.k === "pitch-read" && e.d) deepest[e.d.split(" · ")[0]] = e;
        if (e.k === "seen" && e.d && seenIds.indexOf(e.d) < 0) seenIds.push(e.d);
      });
      var list2 = raw.filter(function (e) {
        if (e.k === "pitch-read") return deepest[(e.d || "").split(" · ")[0]] === e;
        return e.k !== "seen";
      });
      if (seenIds.length) list2.push({ k: "seen", d: seenIds.join(", ") });
      var evs = list2.map(function (e) {
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
        (r.lang ? " · " + esc(r.lang) : "") + (r.tz ? " · " + esc(r.tz) : "") +
        (c.robot ? " · <b>robot because: " + esc(c.rob.join(", ")) + "</b>" : "") + "</p>" +
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
