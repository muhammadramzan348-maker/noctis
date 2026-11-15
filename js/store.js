// All app data lives in one localStorage record on this device. Nothing is ever sent anywhere.
import { PRAYERS, STATUS, JUMMAH } from "./data.js";

const KEY = "noctis.v1";
const PREV = "noctis.prev"; // safety copy kept before a restore
const BAD = "noctis.corrupt";
const ATT = "noctis.att";

const defaults = () => ({
  v: 1,
  namaz: {}, // { "YYYY-MM-DD": { fajr: "done" | "jamaat" | "qaza", ... } }
  jummah: {}, // { "YYYY-MM-DD": { itemId: true } }
  gym: { plan: null, log: {} }, // log: { date: { exId: { sets: [bool], w: "40" } } }
  fin: { buy: 0, sell: 0, fee: 0, entries: [] },
  sec: { pin: null, auto: 30 },
});

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const str = (v, max) => String(v ?? "").slice(0, max);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PIDS = new Set(PRAYERS.map((p) => p.id));
const SIDS = new Set(STATUS.map((s) => s.id));
const JIDS = new Set(JUMMAH.flatMap((g) => g.items.map((i) => i.id)));

// Coerce anything (old data, imported files) into a safe, well-formed state object.
export function normalize(raw, { keepSec = true } = {}) {
  const out = defaults();
  if (!isObj(raw)) return out;

  if (isObj(raw.namaz))
    for (const [k, v] of Object.entries(raw.namaz)) {
      if (!DATE.test(k) || !isObj(v)) continue;
      const day = {};
      for (const [p, s] of Object.entries(v)) if (PIDS.has(p) && SIDS.has(s)) day[p] = s;
      if (Object.keys(day).length) out.namaz[k] = day;
    }

  if (isObj(raw.jummah))
    for (const [k, v] of Object.entries(raw.jummah)) {
      if (!DATE.test(k) || !isObj(v)) continue;
      const day = {};
      for (const [id, on] of Object.entries(v)) if (JIDS.has(id) && on === true) day[id] = true;
      if (Object.keys(day).length) out.jummah[k] = day;
    }

  if (isObj(raw.gym)) {
    if (Array.isArray(raw.gym.plan)) {
      const plan = raw.gym.plan
        .filter(isObj)
        .slice(0, 30)
        .map((x) => ({
          id: str(x.id, 24) || Math.random().toString(36).slice(2, 8),
          name: str(x.name, 60).trim(),
          sets: Math.min(12, Math.max(1, parseInt(x.sets, 10) || 3)),
          reps: str(x.reps, 14) || "10",
        }))
        .filter((x) => x.name);
      out.gym.plan = plan.length ? plan : null;
    }
    if (isObj(raw.gym.log))
      for (const [k, day] of Object.entries(raw.gym.log)) {
        if (!DATE.test(k) || !isObj(day)) continue;
        const d = {};
        for (const [exId, rec] of Object.entries(day)) {
          if (!isObj(rec)) continue;
          const sets = Array.isArray(rec.sets) ? rec.sets.slice(0, 12).map(Boolean) : [];
          d[str(exId, 24)] = { sets, w: str(rec.w, 8) };
        }
        if (Object.keys(d).length) out.gym.log[k] = d;
      }
  }

  if (isObj(raw.fin)) {
    const n = (v) => (Number.isFinite(+v) && +v >= 0 ? +v : 0);
    out.fin.buy = n(raw.fin.buy);
    out.fin.sell = n(raw.fin.sell);
    out.fin.fee = Math.min(100, n(raw.fin.fee));
    if (Array.isArray(raw.fin.entries))
      out.fin.entries = raw.fin.entries
        .filter(isObj)
        .slice(0, 20000)
        .map((e) => ({
          id: str(e.id, 24) || Math.random().toString(36).slice(2, 8),
          t: e.t === "in" ? "in" : "out",
          amt: +e.amt,
          cur: e.cur === "USDT" ? "USDT" : "PKR",
          cat: str(e.cat, 30),
          note: str(e.note, 120),
          d: DATE.test(e.d) ? e.d : "",
          ts: Number.isFinite(+e.ts) ? +e.ts : 0,
        }))
        .filter((e) => Number.isFinite(e.amt) && e.amt > 0 && e.d);
  }

  if (keepSec && isObj(raw.sec)) {
    const p = raw.sec.pin;
    if (isObj(p) && typeof p.salt === "string" && typeof p.hash === "string" && (p.len === 4 || p.len === 6))
      out.sec.pin = { salt: p.salt.slice(0, 64), hash: p.hash.slice(0, 128), len: p.len };
    if ([0, 30, 300, -1].includes(raw.sec.auto)) out.sec.auto = raw.sec.auto;
  }
  return out;
}

let state = defaults();

export function init() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    if (raw) state = normalize(JSON.parse(raw));
  } catch (e) {
    // keep the unreadable record around instead of silently overwriting it
    try {
      if (raw) localStorage.setItem(BAD, raw);
    } catch (_) {}
    state = defaults();
  }
}

export const get = () => state;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export function set(fn) {
  fn(state);
  return save();
}

// Replace everything except the current PIN settings (a backup never carries the PIN).
export function replace(data) {
  try {
    localStorage.setItem(PREV, JSON.stringify(state));
  } catch (_) {}
  const sec = state.sec;
  state = normalize(data, { keepSec: false });
  state.sec = sec;
  return save();
}

export function wipe() {
  state = defaults();
  try {
    localStorage.removeItem(PREV);
    localStorage.removeItem(BAD);
    localStorage.removeItem(ATT);
  } catch (_) {}
  return save();
}

export function exportData() {
  const d = JSON.parse(JSON.stringify(state));
  delete d.sec;
  return d;
}

export function usageBytes() {
  try {
    return new Blob([localStorage.getItem(KEY) || ""]).size;
  } catch (_) {
    return 0;
  }
}
