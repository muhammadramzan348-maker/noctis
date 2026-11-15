// Gym: back / strength routine with Urdu poetry header and automatic muscle badges.
import * as store from "../store.js";
import { DEFAULT_PLAN, POETRY } from "../data.js";
import { MUSCLES, detectMuscles } from "../detector.js";
import { icon } from "../icons.js";
import { esc, dkey, addDays, num, uid } from "../util.js";
import { view, openSheet } from "../ui.js";

const plan = () => store.get().gym.plan || DEFAULT_PLAN;

export function badges(m) {
  if (!m.matched) return `<span class="badge g">General</span>`;
  const one = (id, cls) => {
    const x = MUSCLES[id];
    return `<span class="badge ${cls}" data-g="${x.group}">${x.label}</span>`;
  };
  return m.primary.map((i) => one(i, "p")).join("") + m.secondary.map((i) => one(i, "s")).join("");
}

function lastWeight(exId) {
  const log = store.get().gym.log;
  const t = dkey();
  const keys = Object.keys(log)
    .filter((k) => k < t)
    .sort()
    .reverse();
  for (const k of keys) {
    const w = log[k] && log[k][exId] && log[k][exId].w;
    if (w) return w;
  }
  return "";
}

function weekSessions(log) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = log[dkey(addDays(new Date(), -i))];
    if (d && Object.values(d).some((r) => r.sets.some(Boolean))) n++;
  }
  return n;
}

function exCard(ex, day) {
  const rec = day[ex.id] || { sets: [], w: "" };
  const m = detectMuscles(ex.name);
  const done = rec.sets.slice(0, ex.sets).filter(Boolean).length;
  const last = lastWeight(ex.id);
  const sets = Array.from(
    { length: ex.sets },
    (_, i) =>
      `<button class="set ${rec.sets[i] ? "on" : ""}" data-act="set" data-ex="${esc(ex.id)}" data-i="${i}" aria-label="Set ${i + 1}" aria-pressed="${!!rec.sets[i]}">${i + 1}</button>`
  ).join("");
  return `<div class="card ex ${done === ex.sets ? "complete" : ""}">
    <div class="ex-top"><div class="ex-name">${esc(ex.name)}</div><div class="ex-target">${ex.sets} × ${esc(ex.reps)}</div></div>
    <div class="badges">${badges(m)}</div>
    <div class="sets">${sets}</div>
    <div class="wt"><label>Weight <input type="number" inputmode="decimal" step="0.5" min="0" max="2000" data-w="${esc(ex.id)}" value="${esc(rec.w)}" placeholder="0"> kg</label>${last ? `<span class="hint">Last: ${esc(last)} kg</span>` : ""}</div>
  </div>`;
}

export function render() {
  const S = store.get();
  const p = plan();
  const day = S.gym.log[dkey()] || {};
  const total = p.reduce((a, e) => a + e.sets, 0);
  const done = p.reduce((a, e) => a + ((day[e.id] && day[e.id].sets.slice(0, e.sets).filter(Boolean).length) || 0), 0);
  const wk = weekSessions(S.gym.log);
  return `
  <header class="top"><div class="brand"><b>N</b>OCTIS</div><h1 class="h1">Gym <span class="ur">جم</span></h1></header>
  <section class="banner poem">
    <div class="ur">${POETRY[0]}</div>
    <div class="ur">${POETRY[1]}</div>
  </section>
  <section class="card">
    <div class="row-between"><div><div class="eyebrow">Back &amp; strength day</div><div class="sum-big">${done}/${total} sets</div></div>
    <button class="btn sm" data-act="custom">${icon("sliders", 16)} Customize</button></div>
    <div class="bar"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i></div>
    <div class="bar-l">${icon("flame", 14)} ${wk} session${wk === 1 ? "" : "s"} in the last 7 days</div>
  </section>
  ${p.length ? p.map((e) => exCard(e, day)).join("") : '<p class="empty">No exercises yet. Tap Customize to add some.</p>'}`;
}

export function click(act, el) {
  if (act === "set") {
    const id = el.dataset.ex;
    const i = Number(el.dataset.i);
    const ex = plan().find((x) => x.id === id);
    if (!ex || !(i >= 0 && i < ex.sets)) return;
    store.set((s) => {
      const t = dkey();
      const day = s.gym.log[t] || (s.gym.log[t] = {});
      const rec = day[id] || (day[id] = { sets: [], w: "" });
      while (rec.sets.length < ex.sets) rec.sets.push(false);
      rec.sets[i] = !rec.sets[i];
    });
    view.refresh();
  } else if (act === "custom") openCustomize();
}

export function change(el) {
  if (!el.matches("[data-w]")) return;
  const id = el.dataset.w;
  const v = num(el.value);
  const w = v >= 0 && v <= 2000 ? String(v) : "";
  store.set((s) => {
    const t = dkey();
    const day = s.gym.log[t] || (s.gym.log[t] = {});
    const rec = day[id] || (day[id] = { sets: [], w: "" });
    rec.w = w;
  });
  el.value = w;
}

function openCustomize() {
  let list = plan().map((x) => ({ ...x }));
  const persist = () =>
    store.set((s) => {
      s.gym.plan = list.map((x) => ({ ...x }));
    });
  const body = () => `
    <h3 class="sheet-title">Customize routine</h3>
    <div class="cz-list">${
      list.length
        ? list
            .map(
              (x, i) => `<div class="cz-row"><div><div class="cz-name">${esc(x.name)}</div><div class="badges">${badges(detectMuscles(x.name))}</div><div class="p-rak">${x.sets} × ${esc(x.reps)}</div></div><button class="icon-btn" data-rm="${i}" aria-label="Remove ${esc(x.name)}">${icon("trash", 20)}</button></div>`
            )
            .join("")
        : '<p class="empty">No exercises yet.</p>'
    }</div>
    <div class="cz-add">
      <label class="field"><span>New exercise</span><input data-n placeholder="e.g. Wide Grip Lat Pull-Down" maxlength="60" autocomplete="off"></label>
      <div class="badges prev" data-prev><span class="hint">Muscle badges appear automatically as you type</span></div>
      <div class="grid2"><label class="field"><span>Sets</span><input data-s inputmode="numeric" value="3" maxlength="2"></label><label class="field"><span>Reps</span><input data-r value="10-12" maxlength="14"></label></div>
      <button class="btn primary wide" data-add>Add exercise</button>
    </div>
    <div class="btn-row"><button class="btn ghost" data-reset>Reset to back day</button><button class="btn" data-done>Done</button></div>`;
  const sh = openSheet(body(), { onClose: () => view.refresh() });
  const paint = () => {
    sh.el.innerHTML = body();
  };
  sh.el.addEventListener("input", (e) => {
    if (!e.target.matches("[data-n]")) return;
    const nm = e.target.value.trim();
    sh.el.querySelector("[data-prev]").innerHTML = nm
      ? badges(detectMuscles(nm))
      : '<span class="hint">Muscle badges appear automatically as you type</span>';
  });
  sh.el.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.rm !== undefined) {
      list.splice(Number(b.dataset.rm), 1);
      persist();
      paint();
    } else if ("add" in b.dataset) {
      const name = sh.el.querySelector("[data-n]").value.trim();
      if (!name) return;
      const sets = Math.min(12, Math.max(1, parseInt(sh.el.querySelector("[data-s]").value, 10) || 3));
      const reps = sh.el.querySelector("[data-r]").value.trim().slice(0, 14) || "10";
      list.push({ id: uid(), name: name.slice(0, 60), sets, reps });
      persist();
      paint();
    } else if ("reset" in b.dataset) {
      list = DEFAULT_PLAN.map((x) => ({ ...x }));
      persist();
      paint();
    } else if ("done" in b.dataset) sh.close();
  });
}
