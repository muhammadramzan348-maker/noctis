// Finance: manual USDT <-> PKR converter (Binance P2P style) + income / expense ledger.
import * as store from "../store.js";
import { convert, spread } from "../convert.js";
import { CATS, inMonth, summarize, groupByDay } from "../finance.js";
import { icon } from "../icons.js";
import { esc, dkey, mkey, fromKey, num, fmt, uid, niceDate } from "../util.js";
import { view, openSheet, confirmBox, toast } from "../ui.js";

let tab = "conv";
let month = mkey();
const conv = { dir: "usdt2pkr", amount: "" };

const money = (n, cur) => (cur === "USDT" ? fmt(n, 2) : fmt(n, n % 1 ? 2 : 0));

function convHTML(f) {
  const usd = conv.dir === "usdt2pkr";
  const quick = usd ? [10, 50, 100, 500, 1000] : [1000, 5000, 10000, 50000, 100000];
  return `
  <section class="card">
    <div class="eyebrow">Your rates · entered manually</div>
    <div class="grid2">
      <label class="field"><span>Buy rate <em>PKR per USDT</em></span><input data-rate="buy" inputmode="decimal" placeholder="0.00" value="${f.buy || ""}" autocomplete="off"></label>
      <label class="field"><span>Sell rate <em>PKR per USDT</em></span><input data-rate="sell" inputmode="decimal" placeholder="0.00" value="${f.sell || ""}" autocomplete="off"></label>
    </div>
    <label class="field"><span>Fee % <em>optional · taken from what you receive</em></span><input data-rate="fee" inputmode="decimal" placeholder="0" value="${f.fee || ""}" autocomplete="off"></label>
    <div class="note" data-spread></div>
  </section>
  <section class="card conv">
    <div class="cv-box"><span class="cv-l">You ${usd ? "sell" : "pay"}</span>
      <div class="cv-row"><input class="cv-in" data-conv inputmode="decimal" placeholder="0" value="${esc(conv.amount)}" autocomplete="off"><b>${usd ? "USDT" : "PKR"}</b></div></div>
    <button class="swap" data-act="swap" aria-label="Swap direction">${icon("swap", 22)}</button>
    <div class="cv-box out"><span class="cv-l">You get</span>
      <div class="cv-row"><div class="cv-out" data-out>—</div><b>${usd ? "PKR" : "USDT"}</b></div>
      <div class="note" data-used></div></div>
    <div class="chips q">${quick.map((v) => `<button class="chip" data-act="q" data-v="${v}">${fmt(v)}</button>`).join("")}</div>
  </section>`;
}

function calc() {
  const out = document.querySelector("[data-out]");
  if (!out) return;
  const f = store.get().fin;
  const usd = conv.dir === "usdt2pkr";
  const r = convert({ amount: num(conv.amount), dir: conv.dir, buy: f.buy, sell: f.sell, fee: f.fee });
  out.textContent = Number.isFinite(r) ? fmt(r, usd ? 2 : 4) : "—";
  const rate = usd ? f.sell : f.buy;
  document.querySelector("[data-used]").textContent =
    rate > 0
      ? `Using ${usd ? "sell" : "buy"} rate ${fmt(rate, 2)}${f.fee > 0 ? ` · fee ${f.fee}%` : ""}`
      : `Enter your ${usd ? "sell" : "buy"} rate above`;
  const sp = spread(f.buy, f.sell);
  document.querySelector("[data-spread]").textContent = sp
    ? `Spread ${fmt(sp.abs, 2)} PKR per USDT (${sp.pct.toFixed(2)}%)`
    : "Enter both rates to see your spread.";
}

function ledgerHTML(S) {
  const f = S.fin;
  const list = inMonth(f.entries, month);
  const s = summarize(list);
  const d = fromKey(month + "-01");
  const hasUsdt = s.USDT.in + s.USDT.out > 0;
  const netPkr = s.PKR.in - s.PKR.out;
  const netUsdt = s.USDT.in - s.USDT.out;
  const est = f.sell > 0 ? netPkr + netUsdt * f.sell : null;
  const groups = groupByDay(list)
    .map(
      ([day, es]) => `<div class="tx-day">${esc(niceDate(fromKey(day), { weekday: "short", day: "numeric", month: "short" }))}</div>` +
        es
          .map(
            (e) => `<div class="card tx"><div class="tx-l"><div class="tx-cat">${esc(e.cat || "Other")}</div>${e.note ? `<div class="tx-note">${esc(e.note)}</div>` : ""}</div>
            <div class="amt ${e.t}">${e.t === "in" ? "+" : "−"} ${e.cur} ${money(e.amt, e.cur)}</div>
            <button class="icon-btn" data-act="del" data-id="${esc(e.id)}" aria-label="Delete entry">${icon("trash", 18)}</button></div>`
          )
          .join("")
    )
    .join("");
  return `
  <div class="datenav">
    <button class="icon-btn" data-act="month" data-d="-1" aria-label="Previous month">${icon("chev_l", 22)}</button>
    <div class="dn-mid"><div class="dn-date">${esc(d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }))}</div></div>
    <button class="icon-btn" data-act="month" data-d="1" aria-label="Next month" ${month >= mkey() ? "disabled" : ""}>${icon("chev_r", 22)}</button>
  </div>
  <section class="card sumcard">
    <div class="sum3"><div><div class="eyebrow">Income</div><div class="amt in">${money(s.PKR.in, "PKR")}</div></div>
    <div><div class="eyebrow">Expense</div><div class="amt out">${money(s.PKR.out, "PKR")}</div></div>
    <div><div class="eyebrow">Net PKR</div><div class="amt ${netPkr >= 0 ? "in" : "out"}">${netPkr < 0 ? "−" : ""}${money(Math.abs(netPkr), "PKR")}</div></div></div>
    ${hasUsdt ? `<div class="usdt-line">USDT · in ${fmt(s.USDT.in, 2)} · out ${fmt(s.USDT.out, 2)} · net ${fmt(netUsdt, 2)}</div>` : ""}
    ${hasUsdt && est !== null ? `<div class="usdt-line">Est. total in PKR at sell rate: ${est < 0 ? "−" : ""}${fmt(Math.abs(est), 0)}</div>` : ""}
  </section>
  <button class="btn primary wide add-btn" data-act="add">${icon("plus", 18)} Add entry</button>
  ${groups || '<p class="empty">No entries this month.</p>'}`;
}

export function render() {
  const S = store.get();
  return `
  <header class="top"><div class="brand"><b>N</b>OCTIS</div><h1 class="h1">Finance <span class="ur">مالیات</span></h1></header>
  <div class="seg big" data-seg-tab>
    <button class="${tab === "conv" ? "on" : ""}" data-act="tab" data-v="conv">USDT ⇄ PKR</button>
    <button class="${tab === "ledger" ? "on" : ""}" data-act="tab" data-v="ledger">Ledger</button>
  </div>
  ${tab === "conv" ? convHTML(S.fin) : ledgerHTML(S)}`;
}

export function mount() {
  if (tab === "conv") calc();
}

export function input(el) {
  if (el.matches("[data-rate]")) {
    const k = el.dataset.rate;
    let v = num(el.value);
    if (!(v >= 0)) v = 0;
    if (k === "fee") v = Math.min(v, 100);
    store.set((s) => {
      s.fin[k] = v;
    });
    calc();
  } else if (el.matches("[data-conv]")) {
    conv.amount = el.value;
    calc();
  }
}

export async function click(act, el) {
  if (act === "tab") {
    tab = el.dataset.v === "ledger" ? "ledger" : "conv";
    view.refresh();
  } else if (act === "swap") {
    conv.dir = conv.dir === "usdt2pkr" ? "pkr2usdt" : "usdt2pkr";
    view.refresh();
  } else if (act === "q") {
    conv.amount = el.dataset.v;
    const inp = document.querySelector("[data-conv]");
    if (inp) inp.value = conv.amount;
    calc();
  } else if (act === "month") {
    const d = fromKey(month + "-01");
    d.setMonth(d.getMonth() + Number(el.dataset.d));
    const nm = mkey(d);
    if (nm > mkey()) return;
    month = nm;
    view.refresh();
  } else if (act === "add") openAdd();
  else if (act === "del") {
    const id = el.dataset.id;
    const e = store.get().fin.entries.find((x) => x.id === id);
    if (!e) return;
    const ok = await confirmBox({
      title: "Delete this entry?",
      body: `${e.t === "in" ? "Income" : "Expense"} · ${e.cat || "Other"} · ${e.cur} ${money(e.amt, e.cur)}`,
      ok: "Delete",
      danger: true,
    });
    if (!ok) return;
    store.set((s) => {
      s.fin.entries = s.fin.entries.filter((x) => x.id !== id);
    });
    view.refresh();
  }
}

function openAdd() {
  let type = "out";
  let cur = "PKR";
  const sh = openSheet(`
    <h3 class="sheet-title">New entry</h3>
    <div class="seg" data-seg="t"><button class="on" data-v="out">Expense</button><button data-v="in">Income</button></div>
    <label class="field"><span>Amount</span><input data-f="amt" inputmode="decimal" placeholder="0" autocomplete="off"></label>
    <div class="seg" data-seg="cur"><button class="on" data-v="PKR">PKR</button><button data-v="USDT">USDT</button></div>
    <label class="field"><span>Category</span><select data-f="cat"></select></label>
    <label class="field"><span>Note <em>optional</em></span><input data-f="note" maxlength="80" placeholder="e.g. lunch" autocomplete="off"></label>
    <label class="field"><span>Date</span><input type="date" data-f="d" value="${dkey()}"></label>
    <div class="btn-row"><button class="btn ghost" data-cancel>Cancel</button><button class="btn primary" data-save>Save</button></div>`);
  const q = (s) => sh.el.querySelector(s);
  const fillCats = () => {
    q("[data-f=cat]").innerHTML = CATS[type].map((c) => `<option>${esc(c)}</option>`).join("");
  };
  fillCats();
  sh.el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const seg = b.closest("[data-seg]");
    if (seg) {
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      if (seg.dataset.seg === "t") {
        type = b.dataset.v;
        fillCats();
      } else cur = b.dataset.v;
    } else if ("cancel" in b.dataset) sh.close();
    else if ("save" in b.dataset) {
      const amt = num(q("[data-f=amt]").value);
      if (!(amt > 0)) return toast("Enter a valid amount");
      let d = q("[data-f=d]").value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) d = dkey();
      store.set((s) => {
        s.fin.entries.push({
          id: uid(),
          t: type,
          amt: Math.round(amt * 100) / 100,
          cur,
          cat: q("[data-f=cat]").value,
          note: q("[data-f=note]").value.trim().slice(0, 80),
          d,
          ts: Date.now(),
        });
      });
      month = d.slice(0, 7) > mkey() ? mkey() : d.slice(0, 7);
      sh.close();
      toast("Saved");
      view.refresh();
    }
  });
}
