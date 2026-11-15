# NOCTIS (PWA)

Ultra-dark AMOLED life manager. Offline-first, no build step, no dependencies.

**Modules**
* **Namaz** – five daily prayers (On time / Jamaat / Qaza), day-by-day history, streak, daily Quranic header, and a Friday **Jummah** routine with Sunnah checklist and Done buttons.
* **Gym** – back / strength routine with the Urdu poetry header, set tracking, weight log, and automatic muscle-group badges (lats, mid-back, lower back, biceps ... detected from the exercise name). Routine is editable.
* **Finance** – manual USDT/PKR converter (buy rate, sell rate, fee %, spread, swap direction) and an income / expense ledger by month (PKR + USDT).
* **Vault** – PIN lock (4 or 6 digits, auto-lock), PIN-gated admin actions, local JSON backup / restore, erase all data.

## Run locally
    cd noctis-pwa
    python3 -m http.server 8000        # open http://localhost:8000

## Put it on your phone (needs HTTPS to install)
Upload the whole folder to any static host (Netlify drop, GitHub Pages, Cloudflare Pages, Vercel), then open the https:// link:
* Android Chrome: menu -> "Install app"
* iPhone Safari: Share -> "Add to Home Screen"

For GitHub Pages: put these files at the root of the repository (index.html must be at the top level), then Settings -> Pages -> deploy from the branch. No build step is needed.

## Good to know
* Data is stored in this browser only (localStorage). Clearing site data deletes it, so export a backup now and then.
* The PIN locks the app and protects backup / restore / erase. It does **not** encrypt the stored data, and backups are plain JSON files.
* Rakat counts follow the common Hanafi practice. Change them in `js/data.js`.
* Rates are typed in by you; the app never fetches prices.
* Urdu / Arabic fonts load from Google Fonts on the first online visit and are cached for offline use.
* After changing any file, bump `VERSION` in `sw.js` so phones pick up the update.
