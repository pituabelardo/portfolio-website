/* api/v.js — anonymous visit beacon for jorge.eus (AGENTS §5.1).
   the browser (js/track.js) posts a small json; this function adds the
   coarse geo vercel already knows (country / region / city — never the ip)
   and hands it to supabase's portfolio_track rpc. no cookies, no ip stored.
   the key below is supabase's PUBLISHABLE key: safe in a public repo — the
   rpc is the only thing it can reach, and it can only append visits. */

const RPC = "https://fetqwujhpyjdccnlgicr.supabase.co/rest/v1/rpc/portfolio_track";
const KEY = "sb_publishable_l-WfcfL8lbTPLQr9cwjGNA_gs1d3LyT";
const ORIGINS = /^https:\/\/(jorge\.eus|www\.jorge\.eus|[a-z0-9-]+\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function dec(v) {
  if (!v) return null;
  try { return decodeURIComponent(String(v)); } catch (e) { return String(v); }
}

function uaInfo(ua) {
  ua = ua || "";
  const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|iPhone|Android/i.test(ua) ? "mobile" : "desktop";
  const browser =
    /Edg\//.test(ua) ? "edge" :
    /OPR\//.test(ua) ? "opera" :
    /Firefox\//.test(ua) ? "firefox" :
    /CriOS|Chrome\//.test(ua) ? "chrome" :
    /Safari\//.test(ua) ? "safari" : "other";
  const os =
    /iPhone|iPad|iPod/.test(ua) ? "ios" :
    /Android/.test(ua) ? "android" :
    /Mac OS X/.test(ua) ? "mac" :
    /Windows/.test(ua) ? "windows" :
    /Linux/.test(ua) ? "linux" : "other";
  const bot = /bot\b|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|python|curl|wget/i.test(ua);
  return { device, browser: browser + " · " + os, bot };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }

  const origin = req.headers.origin || "";
  if (origin && !ORIGINS.test(origin)) { res.statusCode = 403; return res.end(); }

  let p = req.body;
  if (Buffer.isBuffer(p)) p = p.toString("utf8");
  if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = null; } }
  if (!p || typeof p !== "object" || Array.isArray(p)) { res.statusCode = 400; return res.end(); }

  const h = req.headers;
  const ua = uaInfo(h["user-agent"]);
  const payload = {
    sid: p.sid,
    page: p.page,
    landing: p.landing,
    ref: p.ref,
    utm: p.utm,
    lang: p.lang,
    tz: p.tz,
    vp: p.vp,
    me: !!p.me,
    bot: !!p.bot || ua.bot,
    active_ms: p.active_ms,
    scroll: p.scroll,
    events: Array.isArray(p.events) ? p.events.slice(0, 40) : [],
    device: ua.device,
    browser: ua.browser,
    country: h["x-vercel-ip-country"] || null,
    region: dec(h["x-vercel-ip-country-region"]),
    city: dec(h["x-vercel-ip-city"]),
  };

  try {
    await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY },
      body: JSON.stringify({ p: payload }),
    });
  } catch (e) { /* a lost beacon is fine; a broken page is not */ }

  res.statusCode = 204;
  res.end();
};
