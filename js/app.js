// App shell: tab routing, lock handling, service worker.
import * as store from "./store.js";
import * as sec from "./security.js";
import { icon } from "./icons.js";
import { $ } from "./util.js";
import { view, closeSheet } from "./ui.js";
import * as namaz from "./screens/namaz.js";
import * as gym from "./screens/gym.js";
import * as finance from "./screens/finance.js";
import * as settings from "./screens/settings.js";

const TABS = [
  { id: "namaz", label: "Namaz", ic: "mosque", mod: namaz },
  { id: "gym", label: "Gym", ic: "dumbbell", mod: gym },
  { id: "finance", label: "Finance", ic: "wallet", mod: finance },
  { id: "settings", label: "Vault", ic: "shield", mod: settings },
];

let cur = "namaz";
try {
  const t = localStorage.getItem("noctis.tab");
  if (TABS.some((x) => x.id === t)) cur = t;
} catch (_) {}

let locked = false;
const tab = () => TABS.find((x) => x.id === cur);

function drawNav() {
  $("#nav").innerHTML = TABS.map(
    (t) =>
      `<button class="tab ${t.id === cur ? "on" : ""}" data-tab="${t.id}" aria-current="${t.id === cur}">${icon(t.ic, 24)}<span>${t.label}</span></button>`
  ).join("");
}

function draw(keepScroll) {
  const screen = $("#screen");
  const y = keepScroll ? window.scrollY : 0;
  document.body.dataset.tab = cur;
  try {
    screen.innerHTML = tab().mod.render();
    if (tab().mod.mount) tab().mod.mount(screen);
  } catch (e) {
    console.error(e);
    screen.innerHTML = '<div class="card"><div class="set-t">Something went wrong</div><div class="set-s">Please reload the app. Your data is safe.</div></div>';
  }
  drawNav();
  window.scrollTo(0, y);
}

view.refresh = () => draw(true);

async function lockNow() {
  if (locked || !sec.hasPin()) return;
  locked = true;
  closeSheet();
  $("#app").classList.add("hidden");
  await sec.showLock();
  locked = false;
  $("#app").classList.remove("hidden");
  draw(true);
}
view.lock = lockNow;

function wire() {
  const screen = $("#screen");
  screen.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (el && screen.contains(el) && !el.disabled && tab().mod.click) tab().mod.click(el.dataset.act, el, e);
  });
  screen.addEventListener("input", (e) => tab().mod.input && tab().mod.input(e.target, e));
  screen.addEventListener("change", (e) => tab().mod.change && tab().mod.change(e.target, e));
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b || b.dataset.tab === cur) return;
    cur = b.dataset.tab;
    try {
      localStorage.setItem("noctis.tab", cur);
    } catch (_) {}
    closeSheet();
    draw(false);
  });

  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      return;
    }
    const away = hiddenAt ? (Date.now() - hiddenAt) / 1000 : 0;
    hiddenAt = 0;
    if (locked) return;
    const auto = sec.autoSecs();
    if (sec.hasPin() && auto >= 0 && away >= auto) lockNow();
    else draw(true); // new day while the app was in the background
  });
}

async function boot() {
  store.init();
  wire();
  if (sec.hasPin()) {
    locked = true;
    await sec.showLock();
    locked = false;
  }
  $("#app").classList.remove("hidden");
  draw(false);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

boot();

if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
