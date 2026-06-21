# Project Context: Islamic Daily Prayer & Prayer Tracker PWA

## Project Overview
A premium, offline-first Progressive Web App (PWA) for tracking personal daily Islamic worship (prayers and amols). The application requires no servers, backend, or APIs, running completely on the client-side with local storage.

---

## Technology Stack & Design System
* **Core:** HTML5, Vanilla JavaScript.
* **Styling:** Premium Vanilla CSS with dark mode aesthetics (glassmorphic elements, emerald green accents `#0D5C4D` / `#10b981`, gold gradients, and responsive layouts).
* **PWA Capability:** Custom Service Worker (`sw.js`) utilizing a stale-while-revalidate caching strategy to allow offline operation, combined with a standard `manifest.json`.
* **Storage:** Client-side HTML5 `localStorage`.

---

## File Structure
* [index.html](file:///c:/Users/rafim/Documents/prayer-tracker-pwa/index.html): UI shell with dynamic views (Tracker, Insights, Settings), headers showing streaks, custom modal overlays, and custom favicon.
* [styles.css](file:///c:/Users/rafim/Documents/prayer-tracker-pwa/styles.css): Premium design system implementation, active states, animations, and custom scrollbars.
* [app.js](file:///c:/Users/rafim/Documents/prayer-tracker-pwa/app.js): App state controller, date navigation helper, streak & insights calculations, and local storage syncer.
* [sw.js](file:///c:/Users/rafim/Documents/prayer-tracker-pwa/sw.js): PWA service worker caching structural assets.
* [manifest.json](file:///c:/Users/rafim/Documents/prayer-tracker-pwa/manifest.json): Configuration file for mobile installable standalone options.
* [contex.md](file:///c:/Users/rafim/Documents/prayer-tracker-pwa/contex.md): Project specification and current state documentation.

---

## Key Features

### 1. Daily Tracker
* **Five Waqt Prayers:** fajr, dhuhr, asr, maghrib, and isha. Each prayer card contains status selector pill toggles representing `ON_TIME`, `LATE`, `QAZA`, or `NOT_DONE`.
* **Default Amols:** morning_zikr, evening_zikr, and tahajjud. Tracking via simple checkboxes (checked/unchecked).
* **Date Navigation:** Backward/forward date skipping with relative descriptors ("Today", "Yesterday", "2 days ago") and a hidden native calendar picker.

### 2. Custom Amol System
* Users can add new daily tasks (e.g., "Read Quran 15 mins", "Charity").
* Custom tasks automatically sync to current/future checklist dates.
* Managed under the Settings tab, where they can be individually deleted.

### 3. Insights & Analytics
* **Daily Progress Ring:** Dynamic SVG circular progress bar rendering percentage of completed tasks for the active date.
* **Numeric Stats:** Displays On-Time, Complete, and Incomplete prayer percentages filtered by timeframe.
* **Timeframe Selector:** Dropdown filtering insights by the last 30 days or specific calendar months.
* **Weekly Grid:** Visual breakdown showing dots for the 5 prayers over the last 7 days.
* **Spiritual Heatmap:** Interactive calendar grid mapping consistency score (0 to 5) for the active month. Clicking a day loads its checklist.

### 4. Settings & Management
* Manage and delete custom amols.
* Clear all application data with double-confirmation dialog and storage reset.

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

### Legacy Key Migration
On startup, the app checks for and migrates legacy data keys (`iman_records` and `iman_custom_amols`) to the new prefix (`amol_`).

### Streak Calculation Logic
* A day is marked as completed if all **5 waqt prayers** are done (any status other than `NOT_DONE`).
* **Best Streak:** Maximum consecutive completed days found in logged history.
* **Active Streak:** Consecutive completed days counting backward from today (or yesterday if today's actions are not yet fully completed).

---

## Current Status & Verification
* **Status:** Fully functional, stable, and running.
* **Latest Verification:** Verified via automated browser subagent tests (June 21, 2026).
  * Tested elements: local server hosting on port 8085, navigation tabs, changing Fajr prayer status (toast and card color update), checking Morning Zikr card, verification of progress updates in the circular chart on the Insights page (increases from 0% -> 25% -> 33%), adding custom amol templates, logging custom amols on the tracker, and deleting templates from settings.
  * Favicon integration: Linked `icon.svg` as the favicon in `index.html` to resolve standard 404 console errors on deployment.