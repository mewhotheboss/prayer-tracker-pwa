# 🌙 Prayer Tracker - PWA (Islamic Daily Worship Tracker)

Prayer Tracker is a premium, offline-first Progressive Web App (PWA) designed to help you track your daily 5 waqt prayers and other daily spiritual goals (amols). It works entirely client-side, storing all data locally on your device with no signups, databases, or API tracking required.

---

## ✨ Key Features

### 📅 Daily Tracker
* **Five Waqt Prayers:** Track Fajr, Dhuhr, Asr, Maghrib, and Isha. Manually select their status:
  * 🟢 **On Time** (Completed on time)
  * 🟡 **Late** (Completed but delayed)
  * 🔴 **Qaza** (Missed and completed later)
  * ⚪ **Not Done** (Not completed yet)
* **Dhaka-based Prayer Times:** View dynamic start and end times for each waqt based on the active date (e.g., Fajr 3:46 AM - 5:14 AM) calculated offline using `Adhan.js` library.
* **Daily Amols:** Toggle default checklist items such as **Morning Zikr**, **Evening Zikr**, and **Tahajjud**.
* **Date Navigation:** Jump back and forth to log entries for past/future dates, with a relative indicator (e.g., "Yesterday", "2 days ago") and a calendar date picker.

### 📈 Insights & Analytics
* **Daily Progress Ring:** A dynamic SVG progress circle showing your completion percentage for the active day.
* **Numeric Stats:** Displays your On-Time, Complete, and Incomplete prayer percentages filtered by timeframe.
* **Timeframe Filter:** View statistics for the last 30 days or select specific calendar months.
* **Weekly Dot Grid:** A visual summary showing dots representing the status of your 5 prayers over the last 7 days.
* **Spiritual Heatmap:** An interactive calendar consistency grid mapping your daily spiritual scores (0 to 5) for the selected month. Click on any cell to open and edit the tracker checklist for that day.

### ⚙️ Customization & Settings
* **Custom Amols:** Create and track your own recurring daily worship tasks (e.g., *Charity*, *Read Quran 5 pages*, *Istighfar*).
* **Manage Custom List:** Add or delete custom items directly from the Settings panel.
* **Backup & Restore:** Export your logs and custom amol templates into a JSON file, or import it to sync across different devices or restore after an app reinstall.
* **Data Privacy:** A danger zone option to clear all logs, records, and templates.

---

## 🛠️ Technology Stack & Architecture
* **Frontend:** Standard Semantic HTML5, Vanilla JavaScript.
* **Styling:** Premium Vanilla CSS featuring a sleek dark mode theme, glassmorphic card containers, HSL tailored emerald (`#0D5C4D`) and gold color systems, and modern custom typography.
* **PWA & Offline Capability:** Custom Service Worker (`sw.js`) implementing a **stale-while-revalidate** caching strategy. Assets are cached locally, allowing the app to run completely offline.
* **Data Storage:** All user entries are synchronized in client-side HTML5 `localStorage` under `amol_records` and `amol_custom_amols`.

---

## 🚀 How to Run Locally

You do not need any compilation or build steps to run this project locally.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/prayer-tracker-pwa.git
   cd prayer-tracker-pwa
   ```

2. **Serve files using a local web server (required for Service Worker registration):**
   * Using **Node.js (npx):**
     ```bash
     npx http-server -p 8080
     ```
   * Using **Python:**
     ```bash
     python -m http.server 8080
     ```

3. **Open in browser:**
   Go to `http://localhost:8080` or `http://127.0.0.1:8080`.

---

## 📦 Deployment on Vercel

This app is optimized for instant hosting on Vercel as a Static Site. Since Vercel serves applications over HTTPS, the Progressive Web App installer and service worker caching features will work automatically.

1. Push your code to a GitHub repository.
2. Sign in to your [Vercel Account](https://vercel.com/) and click **Add New > Project**.
3. Import your repository and click **Deploy** (Vercel automatically detects it as a static site and handles hosting).
4. **Configuration Note:** Ensure that the **Production Branch** in Vercel settings is set to match your repository (e.g., `master`), and leave the **Build Command** disabled/empty since this is a pure static site.

---

## 🔒 Privacy & Offline First
* **Offline-First:** All assets and code cache locally. Once loaded, the tracker works perfectly without an active internet connection.
* **Zero Tracker/Telemetry:** No analytics packages, database syncs, or cookies. Your spiritual journey is private and stays entirely on your own device.
