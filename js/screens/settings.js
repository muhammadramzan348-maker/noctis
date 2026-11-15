// Vault: PIN, auto-lock, backup / restore, erase. Admin actions ask for the PIN when one is set.
import * as store from "../store.js";
import * as sec from "../security.js";
import { downloadBackup, readBackupFile, stats } from "../backup.js";
import { icon } from "../icons.js";
import { fmt } from "../util.js";
import { view, toast, confirmBox } from "../ui.js";

const AUTO = [
  [0, "Immediately"],
  [30, "After 30 seconds"],
  [300, "After 5 minutes"],
  [-1, "Never"],
];

export function render() {
  const S = store.get();
  const pin = sec.hasPin();
  const kb = store.usageBytes() / 1024;
  const st = stats(store.exportData());
  return `
  <header class="top"><div class="brand"><b>N</b>OCTIS</div><h1 class="h1">Vault <span class="ur">حفاظت</span></h1></header>
  <section class="card">
    <div class="eyebrow">${icon("lock", 14)} Security</div>
    <div class="set-row"><div><div class="set-t">${pin ? "PIN lock is ON" : "No PIN set"}</div><div class="set-s">${pin ? "Backup, restore, erase and PIN changes ask for it." : "Set a PIN to lock the app and protect admin actions."}</div></div></div>
    <div class="btn-row"><button class="btn primary" data-act="pin-set">${pin ? "Change PIN" : "Set PIN"}</button>${pin ? '<button class="btn" data-act="pin-off">Remove</button>' : ""}</div>
    ${
      pin
        ? `<div class="btn-row"><button class="btn" data-act="lock">${icon("lock", 16)} Lock now</button></div>
    <label class="field"><span>Auto-lock</span><select data-auto>${AUTO.map(([v, l]) => `<option value="${v}" ${S.sec.auto === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>`
        : ""
    }
  </section>
  <section class="card">
    <div class="eyebrow">${icon("download", 14)} Backup &amp; restore</div>
    <div class="set-s">Everything stays on this phone. A backup is a plain JSON file you keep yourself (it never includes your PIN).</div>
    <div class="btn-row"><button class="btn" data-act="export">${icon("download", 16)} Export backup</button><button class="btn" data-act="import">${icon("upload", 16)} Restore</button></div>
    <input type="file" accept="application/json,.json" data-file hidden>
    <div class="set-s">Stored: ${st.namaz} namaz days · ${st.gym} gym days · ${st.entries} ledger entries · ${fmt(kb, 1)} KB</div>
  </section>
  <section class="card">
    <div class="eyebrow">Danger zone</div>
    <button class="btn danger wide" data-act="wipe">${icon("trash", 16)} Erase all data</button>
  </section>
  <p class="foot">NOCTIS works offline. Data is kept in this browser only: clearing site data deletes it, so export a backup now and then.</p>`;
}

export async function click(act, el) {
  switch (act) {
    case "pin-set": {
      if (sec.hasPin() && !(await sec.requirePin("Enter current PIN"))) return;
      if (await sec.setupPin()) toast("PIN saved");
      view.refresh();
      return;
    }
    case "pin-off": {
      if (!(await sec.requirePin("Enter PIN to remove it"))) return;
      sec.removePin();
      toast("PIN removed");
      view.refresh();
      return;
    }
    case "lock":
      view.lock();
      return;
    case "export": {
      if (!(await sec.requirePin("Enter PIN to export"))) return;
      try {
        const r = await downloadBackup();
        if (r !== "cancelled") toast("Backup ready");
      } catch (e) {
        toast("Could not create the backup");
      }
      return;
    }
    case "import":
      el.closest(".card").querySelector("[data-file]").click();
      return;
    case "wipe": {
      const ok = await confirmBox({
        title: "Erase all data?",
        body: "This deletes prayers, gym logs and the ledger from this device. Export a backup first if you might need it.",
        ok: "Erase",
        danger: true,
      });
      if (!ok) return;
      if (!(await sec.requirePin("Enter PIN to erase"))) return;
      store.wipe();
      toast("All data erased");
      view.refresh();
    }
  }
}

export async function change(el) {
  if (el.matches("[data-auto]")) {
    sec.setAuto(Number(el.value));
    toast("Auto-lock updated");
    return;
  }
  if (!el.matches("[data-file]")) return;
  const file = el.files && el.files[0];
  el.value = "";
  if (!file) return;
  try {
    const { data, exportedAt } = await readBackupFile(file);
    const st = stats(data);
    const when = exportedAt ? new Date(exportedAt).toLocaleString("en-GB") : "unknown date";
    const ok = await confirmBox({
      title: "Restore this backup?",
      body: `Backup from ${when}\n${st.namaz} namaz days · ${st.gym} gym days · ${st.entries} ledger entries\n\nThis replaces everything currently on this device.`,
      ok: "Restore",
      danger: true,
    });
    if (!ok) return;
    if (!(await sec.requirePin("Enter PIN to restore"))) return;
    store.replace(data);
    toast("Backup restored");
    view.refresh();
  } catch (e) {
    toast(e && e.message ? e.message : "Could not read that file");
  }
}
