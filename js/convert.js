// USDT <-> PKR maths. Pure functions, rates are entered manually by the user.
// Selling USDT uses the SELL rate, buying USDT uses the BUY rate.
// Fee % is deducted from whatever you receive.

export function convert({ amount, dir, buy, sell, fee }) {
  const a = amount === "" || amount === null || amount === undefined ? NaN : Number(amount);
  if (!(a >= 0)) return NaN;
  const f = 1 - Math.min(Math.max(Number(fee) || 0, 0), 100) / 100;
  if (dir === "usdt2pkr") return sell > 0 ? a * sell * f : NaN;
  return buy > 0 ? (a / buy) * f : NaN;
}

export function spread(buy, sell) {
  if (!(buy > 0 && sell > 0)) return null;
  return { abs: sell - buy, pct: ((sell - buy) / buy) * 100 };
}
