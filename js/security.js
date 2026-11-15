// PIN lock + PIN-gated admin actions.
// The PIN is stored only as a salted PBKDF2 hash. It locks the app screen; it does NOT encrypt
// the data in localStorage (anyone with full access to the browser profile could still read it).
import * as store from "./store.js";
import { icon } from "./icons.js";
import { $ } from "./util.js";
import { openSheet, confirmBox } from "./ui.js";

const enc = new TextEncoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const randHex = (n) => {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return hex(a);
};
const ATT = "noctis.att";

async function derive(pin, salt) {
  if (globalThis.crypto && crypto.subtle) {
    const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 150000 },
      key,
      256
    );
    return "p" + hex(bits);
  }
  // Fallback for non-HTTPS contexts where WebCrypto is unavailable (weaker, but never plaintext)
  let h = 0x811c9dc5;
  const s = salt + ":" + pin;
  for (let r = 0; r < 4000; r++)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
  return "f" + h.toString(16);
}

export const hasPin = () => !!store.get().sec.pin;
export const autoSecs = () => {
  const a = store.get().sec.auto;
  return typeof a === "number" ? a : 30;
};
export async function makeRecord(pin) {
  const salt = randHex(16);
  return { salt, hash: await derive(pin, salt), len: pin.length };
}

const readAtt = () => {
  try {
    return JSON.parse(localStorage.getItem(ATT)) || { n: 0, until: 0 };
  } catch (_) {
    return { n: 0, until: 0 };
  }
};
const writeAtt = (a) => {
  try {
    localStorage.setItem(ATT, JSON.stringify(a));
  } catch (_) {}
};
export const waitLeft = () => Math.max(0, Math.ceil((readAtt().until - Date.now()) / 1000));

// 5 wrong tries in a row -> 60 s lockout, doubling each further miss up to 15 min
export async function tryPin(pin) {
  const w = waitLeft();
  if (w > 0) return { ok: false, wait: w };
  const rec = store.get().sec.pin;
  if (!rec) return { ok: true };
  if ((await derive(pin, rec.salt)) === rec.hash) {
    writeAtt({ n: 0, until: 0 });
    return { ok: true };
  }
  const a = readAtt();
  a.n += 1;
  if (a.n >= 5) a.until = Date.now() + Math.min(900, 60 * 2 ** (a.n - 5)) * 1000;
  writeAtt(a);
  return { ok: false, wait: a.n >= 5 ? waitLeft() : 0, left: Math.max(0, 5 - a.n) };
}

/* ---------- keypad ---------- */
export function padHTML(title, sub, len, cancel) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join("");
  return `<div class="pad"><div class="pad-title">${title}</div><div class="pad-sub" data-sub>${sub || ""}</div>
    <div class="dots" data-dots>${"<i></i>".repeat(len)}</div>
    <div class="keys">${keys}${cancel ? `<button class="ghost" data-k="c">Cancel</button>` : "<span></span>"}<button data-k="0">0</button><button class="ghost" data-k="b" aria-label="Delete">${icon("backspace", 22)}</button></div></div>`;
}

function mountPad(root, { len, verify, onDone, onCancel, guard = true }) {
  let buf = "";
  let busy = false;
  let timer = 0;
  const dots = [...root.querySelectorAll("[data-dots] i")];
  const sub = root.querySelector("[data-sub]");
  const baseSub = sub.textContent;
  const paint = () => dots.forEach((d, i) => d.classList.toggle("on", i < buf.length));
  const say = (t, bad) => {
    sub.textContent = t;
    sub.classList.toggle("bad", !!bad);
  };
  const tick = () => {
    const w = waitLeft();
    if (w > 0) say(`Too many attempts · try again in ${w}s`, true);
    else {
      clearInterval(timer);
      timer = 0;
      say(baseSub);
    }
  };
  const blocked = () => {
    if (!guard || waitLeft() === 0) return false;
    tick();
    if (!timer) timer = setInterval(tick, 1000);
    return true;
  };
  function destroy() {
    clearInterval(timer);
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  }
  async function press(k) {
    if (busy) return;
    if (k === "c") return onCancel && onCancel();
    if (blocked()) return;
    if (k === "b") {
      buf = buf.slice(0, -1);
      paint();
      return;
    }
    if (buf.length >= len) return;
    buf += k;
    paint();
    if (buf.length < len) return;
    busy = true;
    const r = await verify(buf);
    if (r.ok) {
      destroy();
      onDone(buf);
      return;
    }
    const box = root.querySelector(".pad");
    box.classList.remove("shake");
    void box.offsetWidth;
    box.classList.add("shake");
    if (navigator.vibrate) navigator.vibrate(60);
    buf = "";
    paint();
    busy = false;
    if (r.wait) {
      tick();
      if (!timer) timer = setInterval(tick, 1000);
    } else
      say(r.msg || (r.left != null ? `Wrong PIN · ${r.left} ${r.left === 1 ? "try" : "tries"} left` : "Wrong PIN"), true);
  }
  function onClick(e) {
    const b = e.target.closest("[data-k]");
    if (b && root.contains(b)) press(b.dataset.k);
  }
  function onKey(e) {
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") press("b");
  }
  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  return { destroy };
}

/* ---------- lock screen ---------- */
export function showLock() {
  return new Promise((resolve) => {
    const root = $("#lock");
    const len = store.get().sec.pin.len;
    root.innerHTML = `<div class="lock-in"><div class="lock-brand">${icon("moon", 30)}<span>NOCTIS</span></div>
      ${padHTML("Enter PIN", "Private · stored only on this device", len, false)}
      <button class="link" data-forgot>Forgot PIN?</button></div>`;
    root.classList.remove("hidden");
    const finish = () => {
      root.classList.add("hidden");
      root.innerHTML = "";
      resolve();
    };
    const ctl = mountPad(root, { len, verify: tryPin, onDone: finish });
    root.querySelector("[data-forgot]").addEventListener("click", async () => {
      const ok = await confirmBox({
        title: "Erase everything?",
        body: "Without the PIN, the only way back in is to erase all NOCTIS data on this device. You can restore from a backup file afterwards.",
        ok: "Erase all data",
        danger: true,
      });
      if (!ok) return;
      ctl.destroy();
      store.wipe();
      finish();
    });
  });
}

/* ---------- admin gate ---------- */
export function requirePin(title = "Enter PIN") {
  const rec = store.get().sec.pin;
  if (!rec) return Promise.resolve(true);
  return new Promise((resolve) => {
    let ok = false;
    let ctl;
    const sh = openSheet(padHTML(title, "Admin control", rec.len, true), {
      onClose: () => {
        if (ctl) ctl.destroy();
        resolve(ok);
      },
    });
    ctl = mountPad(sh.el, {
      len: rec.len,
      verify: tryPin,
      onDone: () => {
        ok = true;
        sh.close();
      },
      onCancel: () => sh.close(),
    });
  });
}

/* ---------- set / remove PIN ---------- */
function chooseLen() {
  return new Promise((resolve) => {
    let v = 0;
    const sh = openSheet(
      `<h3 class="sheet-title">PIN length</h3><p class="sheet-text">How many digits should your PIN have?</p>
       <div class="btn-row"><button class="btn" data-l="4">4 digits</button><button class="btn" data-l="6">6 digits</button></div>`,
      { onClose: () => resolve(v) }
    );
    sh.el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-l]");
      if (b) {
        v = Number(b.dataset.l);
        sh.close();
      }
    });
  });
}

function collect(title, sub, len, must) {
  return new Promise((resolve) => {
    let val = null;
    let ctl;
    const sh = openSheet(padHTML(title, sub, len, true), {
      onClose: () => {
        if (ctl) ctl.destroy();
        resolve(val);
      },
    });
    ctl = mountPad(sh.el, {
      len,
      guard: false,
      verify: async (p) => (must != null && p !== must ? { ok: false, msg: "PINs don't match" } : { ok: true }),
      onDone: (p) => {
        val = p;
        sh.close();
      },
      onCancel: () => sh.close(),
    });
  });
}

export async function setupPin() {
  const len = await chooseLen();
  if (!len) return false;
  const a = await collect("Choose a PIN", `${len} digits`, len, null);
  if (a == null) return false;
  const b = await collect("Confirm PIN", "Enter it once more", len, a);
  if (b == null) return false;
  const rec = await makeRecord(a);
  store.set((s) => {
    s.sec.pin = rec;
  });
  writeAtt({ n: 0, until: 0 });
  return true;
}

export function removePin() {
  store.set((s) => {
    s.sec.pin = null;
  });
  writeAtt({ n: 0, until: 0 });
}

export function setAuto(v) {
  store.set((s) => {
    s.sec.auto = v;
  });
}
