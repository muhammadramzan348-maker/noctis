// Small helpers shared by every module. No DOM work at import time.
export const $ = (s, r = document) => r.querySelector(s);

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const p2 = (n) => String(n).padStart(2, "0");

// Local-time date keys (never toISOString: that would shift the day in Pakistan time)
export const dkey = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const mkey = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
export const fromKey = (k) => {
  const [y, m, d] = String(k).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
export const dayOfYear = (d = new Date()) =>
  Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 0)) / 864e5);

// The Friday that matters right now: today if Friday, yesterday's Friday if today is Saturday
// (so a late "Done" is still possible), otherwise the upcoming Friday.
export const fridayFor = (today = new Date()) => {
  const base = addDays(today, -1);
  return addDays(base, (5 - base.getDay() + 7) % 7);
};

export const niceDate = (d, opt) =>
  d.toLocaleDateString("en-GB", opt || { weekday: "long", day: "numeric", month: "short", year: "numeric" });

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
};

export const fmt = (n, dp = 0) =>
  Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }) : "—";
