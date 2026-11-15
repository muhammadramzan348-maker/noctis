// Local JSON backup / restore. The file never leaves the device unless the user shares it.
import * as store from "./store.js";
import { dkey } from "./util.js";

const MAX_BYTES = 8 * 1024 * 1024;

export function buildBackup() {
  return { app: "NOCTIS", format: 1, exportedAt: new Date().toISOString(), data: store.exportData() };
}

export function stats(data) {
  const d = store.normalize(data, { keepSec: false });
  return {
    namaz: Object.keys(d.namaz).length,
    gym: Object.keys(d.gym.log).length,
    entries: d.fin.entries.length,
  };
}

export function parseBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (_) {
    throw new Error("This file is not valid JSON.");
  }
  if (!obj || obj.app !== "NOCTIS" || typeof obj.data !== "object" || obj.data === null)
    throw new Error("This is not a NOCTIS backup file.");
  return obj;
}

export async function readBackupFile(file) {
  if (!file) throw new Error("No file chosen.");
  if (file.size > MAX_BYTES) throw new Error("File is too large for a NOCTIS backup.");
  const obj = parseBackup(await file.text());
  return { data: obj.data, exportedAt: obj.exportedAt || "" };
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// Returns "shared" | "downloaded" | "cancelled"
export async function downloadBackup() {
  const json = JSON.stringify(buildBackup(), null, 2);
  const name = `noctis-backup-${dkey()}.json`;
  const file = new File([json], name, { type: "application/json" });
  if (isIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "NOCTIS backup" });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
