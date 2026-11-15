// Toasts, bottom sheets and a confirm dialog. `view` lets screens ask the app shell to redraw.
import { $, esc } from "./util.js";

export const view = { refresh() {}, lock() {} };

let toastTimer = 0;
export function toast(msg, ms = 2400) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), ms);
}

let current = null;

export function openSheet(html, { onClose } = {}) {
  closeSheet();
  const layer = $("#layer");
  layer.innerHTML = `<div class="backdrop" data-close></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><div class="sheet-body">${html}</div></div>`;
  layer.classList.add("open");
  const el = layer.querySelector(".sheet-body");
  const api = {
    el,
    close() {
      if (current !== api) return;
      current = null;
      layer.classList.remove("open");
      layer.innerHTML = "";
      if (onClose) onClose();
    },
  };
  layer.querySelector("[data-close]").addEventListener("click", api.close);
  current = api;
  return api;
}

export function closeSheet() {
  if (current) current.close();
}

export function confirmBox({ title, body = "", ok = "Confirm", cancel = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    let res = false;
    const sh = openSheet(
      `<h3 class="sheet-title">${esc(title)}</h3><p class="sheet-text">${esc(body)}</p>
       <div class="btn-row"><button class="btn ghost" data-no>${esc(cancel)}</button><button class="btn ${danger ? "danger" : "primary"}" data-yes>${esc(ok)}</button></div>`,
      { onClose: () => resolve(res) }
    );
    sh.el.querySelector("[data-yes]").addEventListener("click", () => {
      res = true;
      sh.close();
    });
    sh.el.querySelector("[data-no]").addEventListener("click", () => sh.close());
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });
}
