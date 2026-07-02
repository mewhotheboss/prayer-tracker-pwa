# Project Context: Islamic Daily Prayer & Prayer Tracker PWA

## Project Overview
A premium, offline-first Progressive Web App (PWA) for tracking personal daily Islamic worship (prayers and amols). The application requires no servers, backend, or APIs, running completely on the client-side with local storage.

---

## Technology Stack & Design System
* **Core:** HTML5, Vanilla JavaScript.
* **Styling:** Premium Vanilla CSS with support for multiple theme modes (Light, Dark, and System Default) featuring glassmorphic elements, emerald green accents, gold gradients, and responsive layouts.
* **PWA Capability:** Custom Service Worker (`sw.js`) utilizing a stale-while-revalidate caching strategy to allow offline operation, combined with a standard `manifest.json`.
* **Storage:** Client-side HTML5 `localStorage`.
* **Theme Prevention of Flash (FOUC):** Blocker inline script inside `<head>` of `index.html` to instantly apply appropriate theme class.

---

## File Structure
* [index.html](./index.html): UI shell with dynamic views (Tracker, Insights, Settings), headers showing streaks, custom modal overlays, and custom favicon.
* [styles.css](./styles.css): Premium design system implementation, active states, animations, and custom scrollbars.
* [adhan.js](./adhan.js): Bundled UMD version of `Adhan.js` library for offline astronomical calculations.
* [app.js](./app.js): App state controller, date navigation helper, streak & insights calculations, and local storage syncer.
* [sw.js](./sw.js): PWA service worker caching structural assets.
* [manifest.json](./manifest.json): Configuration file for mobile installable standalone options.
* [contex.md](./contex.md): Project specification and current state documentation.

---

## Key Features

### 1. Daily Tracker
* **Five Waqt Prayers:** fajr, dhuhr (displays as **Jum'a** on Fridays), asr, maghrib, and isha. Each prayer card contains status selector pill toggles representing `ON_TIME`, `LATE`, `QAZA`, or `NOT_DONE`.
* **Dhaka-based Prayer Times:** Displays dynamic start and end times for each waqt based on the active date using the offline-first `Adhan.js` library (configured with Karachi/Hanafi calculation standards).
* **Sunrise & Sunset Display:** Displays dynamic, offline-calculated Sunrise and Sunset (Maghrib start) times on the daily tracker view.
* **Forbidden Prayer Times:** Dynamically calculates and renders the three daily forbidden prayer intervals (Sunrise: 15 mins from Sunrise; Zawal: 7 mins before Dhuhr/Jum'a, ending 1 min before; Sunset: 15 mins before Maghrib, ending 1 min before, with a footnote highlighting the exemption allowing today's Asr prayer to be performed).
* **Default Amols:** morning_zikr, evening_zikr, and tahajjud. Tracking via simple checkboxes (checked/unchecked).
* **Date Navigation:** Backward/forward date skipping with relative descriptors ("Today", "Yesterday", "2 days ago") and a hidden native calendar picker.

### 2. Custom Amol System
* Users can add new daily tasks (e.g., "Read Quran 15 mins", "Charity").
* Custom tasks automatically sync to current/future checklist dates.
* Managed under the Settings tab, where they can be individually deleted.

### 3. Insights & Analytics
* **Daily Progress Ring:** Dynamic SVG circular progress bar rendering percentage of completed tasks for the active date.
* **Numeric Stats:** Displays Timely, Qaza, and Complete prayer percentages filtered by timeframe.
* **Timeframe Selector:** Dropdown filtering insights by the last 30 days or specific calendar months.
* **Weekly Grid:** Visual breakdown showing dots for the 5 prayers over the last 7 days.
* **Spiritual Heatmap:** Interactive calendar grid mapping consistency score (0 to 5) for the active month. Clicking a day loads its checklist.

### 4. Settings & Management
* **App Theme Switcher:** Set preference to Light, Dark, or System Default.
* Manage and delete custom amols.
* Clear all application data with double-confirmation dialog and storage reset.
* Export and import daily tracker records and custom amols to JSON files for backup and migration.


---

## Storage & Data Logic

### Data Schema
All records are saved as JSON strings under two `localStorage` keys:
1. `amol_records`: Central object maps ISO date strings (`YYYY-MM-DD`) to their daily prayer and amol states.
   ```json
   {
     "2026-06-20": {
       "prayers": {
         "fajr": "ON_TIME",
         "dhuhr": "LATE",
         "asr": "NOT_DONE",
         "maghrib": "QAZA",
         "isha": "ON_TIME"
       },
       "amol": {
         "morning_zikr": "DONE",
         "evening_zikr": "NOT_DONE",
         "tahajjud": "NOT_DONE",
         "custom_1718912345678": "DONE"
       }
     }
   }
   ```
2. `amol_custom_amols`: Array of user-created daily amol templates.
   ```json
   [
     { "id": "custom_1718912345678", "title": "Read Quran 5 pages" }
   ]
   ```
3. `app_theme`: Stores the selected theme mode preference string (`"light"`, `"dark"`, or `"system"`).


### Backup JSON Schema
Backup files are formatted as JSON objects containing:
```json
{
  "app": "prayer-tracker",
  "exportedAt": "2026-06-29T00:58:08.123Z",
  "amol_records": { ... },
  "amol_custom_amols": [ ... ]
}
```

### Legacy Key Migration
On startup, the app checks for and migrates legacy data keys (`iman_records` and `iman_custom_amols`) to the new prefix (`amol_`).

### Streak Calculation Logic
* A day is marked as completed if all **5 waqt prayers** are done (any status other than `NOT_DONE`).
* **Best Streak:** Maximum consecutive completed days found in logged history.
* **Active Streak:** Consecutive completed days counting backward from today (or yesterday if today's actions are not yet fully completed).

---

## Current Status & Verification
* **Status:** Fully functional, stable, and running.
* **Latest Verification (July 2, 2026):**
  * **Forbidden Prayer Times Asr Exception Note:** Added a clarification footnote (`*Except Today's Asr`) and updated tooltip descriptions to highlight the exception allowing the current day's Asr prayer to be performed during the Pre-Maghrib forbidden window.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v13` and cache-busted `app.js` and `styles.css` with `?v=13` to deliver instant caching updates.
* **Previous Verification (July 2, 2026):**
  * **Forbidden Prayer Times Feature:** Added dynamic calculation and display of the 3 forbidden daily prayer times (Zawal/Pre-Dhuhr, Sunrise, and Pre-Maghrib) underneath the Sunrise/Sunset card in the main tracker checklist.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v12` and cache-busted `app.js` and `styles.css` with `?v=12` to ensure immediate offline updates on client browsers.
  * **Sunrise & Sunset Times Feature:** Integrated a dual-column Sunrise and Sunset dynamic time display widget on the main Daily Tracker screen. The times are computed locally using offline calculations provided by `Adhan.js` based on coordinates. Added corresponding SVG icons, beautiful custom gradients, and light/dark theme color tweaks.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v11` and cache-busted `app.js` and `styles.css` with `?v=11` to ensure clients download the new layout and styling features instantly.
* **Previous Verification (June 30, 2026):**
  * **Professional Vocabulary Update:** Updated the user-facing status labels from "On Time" to "Timely" and "Not Done" to "Pending" in the main tracker checklist, dropdown options, analytics summaries, legend cards, and README.md.
  * **Two-Letter Weekday Abbreviations:** Changed weekday names from single-character representation (S, M, T, W...) to clearer two-character representation (Su, Mo, Tu, We, Th, Fr, Sa) in both the Weekly Tracker and the Spiritual Heatmap.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v8` and cache-busted `app.js` and `styles.css` with `?v=8` to force clients to update.
* **Previous Verification (June 30, 2026):**
  * **Spiritual Heatmap Light Theme Fix:** Added explicit light-theme overrides for all active heatmap cell score values (1 to 5) in `styles.css`. This resolved a bug where the general `.light-theme .heatmap-cell` rule overrode score-based background colors, causing heatmap cells to appear washed-out/white in light mode. Score 5 cells (completed day) are now rendered in solid green with white text (`#ffffff`) for high contrast, and scores 1-4 render in graduated shades of green.
* **Previous Verification (June 29, 2026):**
  * **Theme Selector Feature:** Integrated Light, Dark, and System Default themes. Persistent using `localStorage` (`app_theme`), with an inline script block in `<head>` preventing theme flashes on load.
  * **Install Banner Style Update:** Corrected the visual contrast of the "Add to Home Screen" promo banner in Light theme. Implemented a light gradient background with dark text for high legibility, and styled the CTA install button with a premium teal accent.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v6` and registered `'./styles.css?v=6'` to resolve caching issues.
* **Previous Verification (June 29, 2026):**
  * **Dhaka-based Prayer Times:** Integrated client-side prayer times calculation and display inside the 5 Waqt prayer cards. Displays dynamic times (e.g. Fajr 3:46 AM - 5:14 AM) using the offline-first `Adhan.js` library configured with Karachi/Hanafi calculation standards.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v4` and added `adhan.js` to pre-cached static assets.
* **Previous Verification (June 29, 2026):**
  * **Backup & Restore Feature:** Added client-side export and import feature. Users can download a JSON file containing all logs and restore them on another device or after a reinstall.
  * **PWA Service Worker Update:** Bumped cache version to `prayer-tracker-v3` to ensure that browsers fetch the updated layout and scripts.
* **Previous Verification (June 22, 2026):**
  * **Fixed Bottom Navigation & Toast Position:** Moved the bottom navigation bar (`nav.bottom-nav`) and toast notification (`#toast`) outside the `.app-container` directly into `<body>`. This resolves the issue where `backdrop-filter: blur(10px)` on the container overrode their fixed positioning, causing them to scroll with the page.
  * **Service Worker Version Bump:** Bumped service worker cache version to `prayer-tracker-v2` in `sw.js` to force browsers to update and load the newest layout changes.
  * **Dropdown Styling Fix:** Resolved a white-on-white text rendering issue for options inside `#insights-timeframe-select` dropdown in dark mode by styling `<option>` tags explicitly to use a dark background (`var(--bg-card-solid)`) and light text (`var(--text-primary)`).
  * **Automated & Manual Tests:** Verified navigation tabs, changing prayer status (toast and card color updates), logging amols, checking circular progress chart responsiveness, and verifying service worker caching.
  * **Favicon Integration:** Linked `icon.svg` as the favicon in `index.html` to resolve standard 404 console errors.