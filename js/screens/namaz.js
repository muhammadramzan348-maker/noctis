// Namaz tracker + Friday / Jummah routine.
import * as store from "../store.js";
import { PRAYERS, STATUS, AYAT, JUMMAH, JUMMAH_AYAH, JUMMAH_HADITH } from "../data.js";
import { icon } from "../icons.js";
import { esc, dkey, fromKey, addDays, dayOfYear, fridayFor, niceDate } from "../util.js";
import { view } from "../ui.js";

let viewDate = dkey();
let seen = dkey();

const jumIds = JUMMAH.flatMap((g) => g.items.map((i) => i.id));

function streak() {
  const S = store.get();
  const full = (k) => {
    const d = S.namaz[k];
    return !!d && PRAYERS.every((p) => d[p.id]);
  };
  let d = new Date();
  let n = 0;
  if (!full(dkey(d))) d = addDays(d, -1);
  while (n < 3650 && full(dkey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

function ring(done, total) {
  const C = 2 * Math.PI * 34;
  const off = C * (1 - done / total);
  return `<svg class="ring" viewBox="0 0 80 80" aria-label="${done} of ${total} prayers"><circle cx="40" cy="40" r="34" class="ring-bg"/><circle cx="40" cy="40" r="34" class="ring-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 40 40)"/><text x="40" y="46" text-anchor="middle" class="ring-t">${done}/${total}</text></svg>`;
}

function prayerCard(p, day) {
  const st = day[p.id] || "";
  const lab = STATUS.find((s) => s.id === st);
  const chips = STATUS.map(
    (s) =>
      `<button class="chip ${st === s.id ? "on" : ""}" data-act="pray" data-p="${p.id}" data-s="${s.id}" aria-pressed="${st === s.id}">${s.en}<span class="ur xs">${s.ur}</span></button>`
  ).join("");
  return `<div class="card prayer" data-st="${st}">
    <div class="p-head">
      <div><div class="p-name">${p.en}<span class="ur sm">${p.ur}</span></div><div class="p-rak">${p.rak}</div></div>
      <div class="p-state ${st ? "on" : ""}">${lab ? lab.en : "Pending"}</div>
    </div>
    <div class="chips">${chips}</div>
  </div>`;
}

function jummahCard(S) {
  const now = new Date();
  const fri = fridayFor(now);
  const fk = dkey(fri);
  const diff = Math.round((fri - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  const rec = S.jummah[fk] || {};
  const n = jumIds.filter((id) => rec[id]).length;
  const when =
    diff === 0 ? "Today is Jummah" : diff < 0 ? "Yesterday was Jummah" : `Jummah in ${diff} day${diff === 1 ? "" : "s"}`;
  const groups = JUMMAH.map(
    (g) => `<div class="j-group">${esc(g.g)}</div>` +
      g.items
        .map(
          (i) => `<div class="j-item ${rec[i.id] ? "on" : ""}">
            <div class="j-txt"><div>${esc(i.en)}</div><div class="ur xs">${esc(i.ur)}</div></div>
            <button class="done-btn ${rec[i.id] ? "on" : ""}" data-act="jum" data-id="${i.id}" aria-pressed="${!!rec[i.id]}">${rec[i.id] ? icon("check", 16) + " Done" : "Done"}</button>
          </div>`
        )
        .join("")
  ).join("");
  return `<section class="card jum ${diff === 0 ? "live" : ""}">
    <div class="eyebrow">${icon("moon", 14)} ${when} · ${esc(niceDate(fri, { weekday: "short", day: "numeric", month: "short" }))}</div>
    <div class="ar j-ayah">${JUMMAH_AYAH.ar}</div>
    <div class="ur sm dim">${JUMMAH_AYAH.ur}</div>
    <div class="ref">${JUMMAH_AYAH.ref}</div>
    <div class="j-hadith"><span class="ar">${JUMMAH_HADITH.ar}</span><span class="ur xs dim"> ${JUMMAH_HADITH.ur}</span><span class="ref"> ${JUMMAH_HADITH.ref}</span></div>
    <div class="bar"><i style="width:${Math.round((n / jumIds.length) * 100)}%"></i></div>
    <div class="bar-l">${n}/${jumIds.length} Jummah sunnah done</div>
    ${groups}
  </section>`;
}

export function render() {
  const t = dkey();
  if (t !== seen) {
    seen = t;
    viewDate = t;
  }
  const S = store.get();
  const day = S.namaz[viewDate] || {};
  const done = PRAYERS.filter((p) => day[p.id]).length;
  const a = AYAT[dayOfYear() % AYAT.length];
  const isToday = viewDate === t;
  const st = streak();
  return `
  <header class="top"><div class="brand"><b>N</b>OCTIS</div><h1 class="h1">Namaz <span class="ur">نماز</span></h1></header>
  <section class="banner">
    <div class="ar">${a.ar}</div>
    <div class="ur ur-tr">${a.ur}</div>
    <div class="ref">${a.ref}</div>
  </section>
  <div class="datenav">
    <button class="icon-btn" data-act="day" data-d="-1" aria-label="Previous day">${icon("chev_l", 22)}</button>
    <div class="dn-mid"><div class="dn-date">${esc(niceDate(fromKey(viewDate)))}</div>${isToday ? '<div class="dn-sub">Today</div>' : '<button class="link" data-act="today">Back to today</button>'}</div>
    <button class="icon-btn" data-act="day" data-d="1" aria-label="Next day" ${isToday ? "disabled" : ""}>${icon("chev_r", 22)}</button>
  </div>
  <section class="card summary">
    ${ring(done, PRAYERS.length)}
    <div class="sum-txt"><div class="sum-big">${done === PRAYERS.length ? "All prayers done" : `${PRAYERS.length - done} remaining`}</div>
    <div class="sum-sub">${icon("flame", 16)} ${st} day streak</div></div>
  </section>
  ${PRAYERS.map((p) => prayerCard(p, day)).join("")}
  ${jummahCard(S)}`;
}

export function click(act, el) {
  if (act === "pray") {
    const { p, s } = el.dataset;
    store.set((x) => {
      const day = x.namaz[viewDate] || (x.namaz[viewDate] = {});
      if (day[p] === s) delete day[p];
      else day[p] = s;
      if (!Object.keys(day).length) delete x.namaz[viewDate];
    });
    view.refresh();
  } else if (act === "day") {
    const nd = dkey(addDays(fromKey(viewDate), Number(el.dataset.d)));
    if (nd > dkey()) return;
    viewDate = nd;
    view.refresh();
  } else if (act === "today") {
    viewDate = dkey();
    view.refresh();
  } else if (act === "jum") {
    const fk = dkey(fridayFor(new Date()));
    const id = el.dataset.id;
    if (!jumIds.includes(id)) return;
    store.set((x) => {
      const rec = x.jummah[fk] || (x.jummah[fk] = {});
      if (rec[id]) delete rec[id];
      else rec[id] = true;
      if (!Object.keys(rec).length) delete x.jummah[fk];
    });
    view.refresh();
  }
}
