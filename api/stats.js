/* api/stats.js — read side of the visit log, for jorge's private /stats page.
   the key is checked inside supabase (portfolio_stats compares its sha-256
   with the one stored in portfolio.keys); nothing secret lives in this repo. */

const RPC = "https://fetqwujhpyjdccnlgicr.supabase.co/rest/v1/rpc/portfolio_stats";
const KEY = "sb_publishable_l-WfcfL8lbTPLQr9cwjGNA_gs1d3LyT";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(); }

  let p = req.body;
  if (Buffer.isBuffer(p)) p = p.toString("utf8");
  if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = null; } }
  const k = p && typeof p.k === "string" ? p.k.slice(0, 200) : "";
  const days = p && Number.isFinite(+p.days) ? Math.max(1, Math.min(365, +p.days)) : 60;

  try {
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY },
      body: JSON.stringify({ p_key: k, p_days: days }),
    });
    const text = await r.text();
    res.statusCode = r.ok ? 200 : (r.status === 403 || r.status === 401 ? 403 : 502);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(r.ok ? text : JSON.stringify({ error: r.status === 403 || r.status === 401 ? "wrong key" : "upstream" }));
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "upstream" }));
  }
};
