// Ledger helpers (pure). Entry: { id, t: "in"|"out", amt, cur: "PKR"|"USDT", cat, note, d: "YYYY-MM-DD", ts }

export const CATS = {
  out: ["Food", "Transport", "Bills", "Rent", "Shopping", "Health", "Gym", "Sadaqah", "Other"],
  in: ["Salary", "Business", "Trading", "Gift", "Other"],
};

export const inMonth = (entries, mk) => entries.filter((e) => e.d.startsWith(mk));

export function summarize(entries) {
  const s = { PKR: { in: 0, out: 0 }, USDT: { in: 0, out: 0 } };
  for (const e of entries) if (s[e.cur] && (e.t === "in" || e.t === "out")) s[e.cur][e.t] += e.amt;
  return s;
}

export function groupByDay(entries) {
  const sorted = [...entries].sort((a, b) => (a.d === b.d ? b.ts - a.ts : a.d < b.d ? 1 : -1));
  const map = new Map();
  for (const e of sorted) {
    if (!map.has(e.d)) map.set(e.d, []);
    map.get(e.d).push(e);
  }
  return [...map.entries()];
}
