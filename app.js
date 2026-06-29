// Prayer Tracker - App Logic

// 1. CONSTANTS & METADATA
const PRAYER_METADATA = [
  { id: 'fajr', title: 'Fajr', desc: 'Dawn Prayer • 2 Sunnah, 2 Fard' },
  { id: 'dhuhr', title: 'Dhuhr', desc: 'Noon Prayer • 4 Sunnah, 4 Fard, 2 Sunnah' },
  { id: 'asr', title: 'Asr', desc: 'Afternoon Prayer • 4 Fard' },
  { id: 'maghrib', title: 'Maghrib', desc: 'Sunset Prayer • 3 Fard, 2 Sunnah' },
  { id: 'isha', title: 'Isha', desc: 'Night Prayer • 4 Fard, 2 Sunnah, 3 Witr' }
];

const DEFAULT_AMOLS = [
  { id: 'morning_zikr', title: 'Morning Zikr', desc: 'Adhkar after Fajr' },
  { id: 'evening_zikr', title: 'Evening Zikr', desc: 'Adhkar after Asr/Maghrib' },
  { id: 'tahajjud', title: 'Tahajjud', desc: 'Night Vigil Prayer' }
];

const STATUS_DETAILS = {
  'NOT_DONE': { label: 'Not Done', color: '#6b7280' },
  'ON_TIME': { label: 'On Time', color: '#10b981' },
  'LATE': { label: 'Late', color: '#f59e0b' },
  'QAZA': { label: 'Qaza', color: '#ef4444' }
};

// 2. STATE MANAGEMENT
let currentDate = getLocalDateString();
let records = {};
let customAmols = [];
let deferredPrompt = null;
let currentTheme = 'system';

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initApp();
  registerServiceWorker();
});

// Helper: Get local date string YYYY-MM-DD
function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Format date for visual display: "Saturday, June 20, 2026"
function formatVisualDate(dateStr) {
  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

// Load data from LocalStorage
function loadData() {
  let savedRecords = localStorage.getItem('amol_records');
  if (!savedRecords) {
    savedRecords = localStorage.getItem('iman_records');
    if (savedRecords) {
      // Migrate existing records to the new key
      localStorage.setItem('amol_records', savedRecords);
    }
  }

  if (savedRecords) {
    try {
      records = JSON.parse(savedRecords);
    } catch (e) {
      console.error('Error parsing records', e);
      records = {};
    }
  }

  let savedCustom = localStorage.getItem('amol_custom_amols');
  if (!savedCustom) {
    savedCustom = localStorage.getItem('iman_custom_amols');
    if (savedCustom) {
      // Migrate existing custom amols to the new key
      localStorage.setItem('amol_custom_amols', savedCustom);
    }
  }

  if (savedCustom) {
    try {
      customAmols = JSON.parse(savedCustom);
    } catch (e) {
      console.error('Error parsing custom amols', e);
      customAmols = [];
    }
  }

  // Load theme preference
  const savedTheme = localStorage.getItem('app_theme');
  if (savedTheme) {
    currentTheme = savedTheme;
  }
  // Apply initially (without toast notification)
  applyTheme(currentTheme, false);
}

// Theme management functions
function applyTheme(theme, showFeedback = true) {
  currentTheme = theme;
  localStorage.setItem('app_theme', theme);

  let isLight = false;
  if (theme === 'light') {
    isLight = true;
  } else if (theme === 'system') {
    isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  if (isLight) {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }

  // Update theme buttons UI if they are present in DOM
  const buttons = document.querySelectorAll('.theme-btn');
  if (buttons.length > 0) {
    buttons.forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  if (showFeedback) {
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
    showToast(`${theme === 'system' ? 'System default' : capitalize(theme) + ' theme'} applied!`);
  }
}

// Save records to LocalStorage
function saveRecords() {
  localStorage.setItem('amol_records', JSON.stringify(records));
  calculateStreak();
  renderInsights();
}

// Save custom amols to LocalStorage
function saveCustomAmols() {
  localStorage.setItem('amol_custom_amols', JSON.stringify(customAmols));
}

// Initialize active views and global event listeners
function initApp() {
  // Navigation Tabs switching
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.getAttribute('data-view');
      
      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      
      item.classList.add('active');
      const targetView = document.getElementById(viewId);
      if (targetView) targetView.classList.add('active');

      if (viewId === 'insights-view') {
        renderInsights();
      } else if (viewId === 'settings-view') {
        renderCustomAmolsManager();
      }
    });
  });

  // Date Navigation buttons
  document.getElementById('prev-date-btn').addEventListener('click', () => changeDate(-1));
  document.getElementById('next-date-btn').addEventListener('click', () => changeDate(1));

  // Date input hidden selector
  const dateInput = document.getElementById('date-input');
  dateInput.value = currentDate;
  dateInput.addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      updateDateView();
    }
  });

  // Add custom amol form
  document.getElementById('custom-amol-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('custom-amol-input');
    const title = input.value.trim();
    if (title) {
      addCustomAmol(title);
      input.value = '';
      showToast('Custom amol added!');
    }
  });

  // Backup & Restore: Export Data
  document.getElementById('btn-export-data').addEventListener('click', () => {
    exportData();
  });

  // Backup & Restore: Import Data trigger
  document.getElementById('btn-import-trigger').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  // Backup & Restore: Import Data file selection
  document.getElementById('import-file-input').addEventListener('change', (e) => {
    handleImportFile(e);
  });

  // Reset Data action with custom modal
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    showConfirmModal(
      'Clear All Data?',
      'Are you absolutely sure you want to clear all your prayer records, streaks, and custom amols? This action is irreversible.',
      () => {
        localStorage.clear();
        showToast('All data cleared successfully.');
        setTimeout(() => window.location.reload(), 1000);
      }
    );
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.status-pill') && !e.target.closest('.status-dropdown')) {
      document.querySelectorAll('.status-dropdown').forEach(d => d.classList.remove('show'));
    }
  });

  // PWA installation promo
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installPromo = document.getElementById('install-promo');
    if (installPromo) installPromo.style.display = 'flex';
  });

  document.getElementById('btn-install').addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        const installPromo = document.getElementById('install-promo');
        if (installPromo) installPromo.style.display = 'none';
      });
    }
  });

  // Network connection status monitoring
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  // Theme selector buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-theme');
      applyTheme(selectedTheme, true);
    });
  });

  // Watch for system theme changes dynamically
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyTheme('system', false);
    }
  });

  // Populate dynamic month list on Insights and register change listener
  populateTimeframeSelector();
  const timeframeSelect = document.getElementById('insights-timeframe-select');
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', () => {
      renderInsights();
    });
  }

  // Initial draw of tracker
  updateDateView();
}

// Populate dynamic month list on Insights (up to 12 months back)
function populateTimeframeSelector() {
  const select = document.getElementById('insights-timeframe-select');
  if (!select) return;
  
  select.innerHTML = '<option value="last-30">Last 30 Days</option>';
  
  const today = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

// Monitor and toggle offline banner
function updateNetworkStatus() {
  const offlineBanner = document.getElementById('offline-banner');
  if (navigator.onLine) {
    offlineBanner.style.display = 'none';
  } else {
    offlineBanner.style.display = 'flex';
  }
}

// 4. DATE OPERATIONS
function changeDate(daysOffset) {
  const parts = currentDate.split('-');
  const currentObj = new Date(parts[0], parts[1] - 1, parts[2]);
  currentObj.setDate(currentObj.getDate() + daysOffset);
  
  currentDate = getLocalDateString(currentObj);
  document.getElementById('date-input').value = currentDate;
  updateDateView();
}

function updateDateView() {
  // Update Date displays
  document.getElementById('current-date-label').textContent = formatVisualDate(currentDate);
  
  const todayStr = getLocalDateString();
  const relativeLabel = document.getElementById('relative-date-label');
  
  if (currentDate === todayStr) {
    relativeLabel.textContent = 'Today';
  } else {
    const parts = currentDate.split('-');
    const currentObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const todayParts = todayStr.split('-');
    const todayObj = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    
    const diffTime = currentObj - todayObj;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === -1) {
      relativeLabel.textContent = 'Yesterday';
    } else if (diffDays === 1) {
      relativeLabel.textContent = 'Tomorrow';
    } else if (diffDays < 0) {
      relativeLabel.textContent = `${Math.abs(diffDays)} days ago`;
    } else {
      relativeLabel.textContent = `In ${diffDays} days`;
    }
  }

  // Draw entries for this day
  renderTracker();
  calculateStreak();
}

// 5. DAILY TRACKER VIEW RENDERING
function renderTracker() {
  // Ensure record structure exists for the active date
  if (!records[currentDate]) {
    records[currentDate] = {
      prayers: {
        fajr: 'NOT_DONE',
        dhuhr: 'NOT_DONE',
        asr: 'NOT_DONE',
        maghrib: 'NOT_DONE',
        isha: 'NOT_DONE'
      },
      amol: {}
    };
  }
  
  // Fill empty amols with NOT_DONE
  DEFAULT_AMOLS.forEach(a => {
    if (records[currentDate].amol[a.id] === undefined) {
      records[currentDate].amol[a.id] = 'NOT_DONE';
    }
  });
  customAmols.forEach(a => {
    if (records[currentDate].amol[a.id] === undefined) {
      records[currentDate].amol[a.id] = 'NOT_DONE';
    }
  });

  const dayRecord = records[currentDate];
  
  // Calculate Dhaka prayer times for the current date view
  const times = getPrayerTimesForDate(currentDate);

  // RENDER PRAYERS
  const prayersContainer = document.getElementById('prayers-list-container');
  prayersContainer.innerHTML = '';

  PRAYER_METADATA.forEach(p => {
    const status = dayRecord.prayers[p.id] || 'NOT_DONE';
    const statusLabel = STATUS_DETAILS[status].label;
    
    // Determine the time range for the current prayer
    let timeRange = '';
    if (times) {
      if (p.id === 'fajr') {
        timeRange = `${formatTime12(times.fajr)} - ${formatTime12(times.sunrise)}`;
      } else if (p.id === 'dhuhr') {
        timeRange = `${formatTime12(times.dhuhr)} - ${formatTime12(times.asr)}`;
      } else if (p.id === 'asr') {
        timeRange = `${formatTime12(times.asr)} - ${formatTime12(times.maghrib)}`;
      } else if (p.id === 'maghrib') {
        timeRange = `${formatTime12(times.maghrib)} - ${formatTime12(times.isha)}`;
      } else if (p.id === 'isha') {
        timeRange = `${formatTime12(times.isha)} - ${formatTime12(times.nextFajr)}`;
      }
    }
    
    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.setAttribute('data-status', status);
    
    card.innerHTML = `
      <div class="prayer-info">
        <span class="prayer-name">${p.title}</span>
        ${timeRange ? `
        <span class="prayer-time">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ${timeRange}
        </span>` : ''}
        <span class="prayer-desc">${p.desc}</span>
      </div>
      <div class="status-pill" data-status="${status}" onclick="toggleStatusDropdown(event, '${p.id}')">
        <span class="status-dot"></span>
        <span>${statusLabel}</span>
      </div>
      <!-- Dropdown selector overlay -->
      <div class="status-dropdown" id="dropdown-${p.id}">
        <div class="status-opt" data-val="ON_TIME" onclick="selectPrayerStatus('${p.id}', 'ON_TIME')">On Time</div>
        <div class="status-opt" data-val="LATE" onclick="selectPrayerStatus('${p.id}', 'LATE')">Late</div>
        <div class="status-opt" data-val="QAZA" onclick="selectPrayerStatus('${p.id}', 'QAZA')">Qaza</div>
        <div class="status-opt" data-val="NOT_DONE" onclick="selectPrayerStatus('${p.id}', 'NOT_DONE')">Not Done</div>
      </div>
    `;
    prayersContainer.appendChild(card);
  });

  // RENDER AMOLS
  const amolsContainer = document.getElementById('amols-list-container');
  amolsContainer.innerHTML = '';

  // Standard Amols
  DEFAULT_AMOLS.forEach(a => {
    const val = dayRecord.amol[a.id] === 'DONE';
    const card = createAmolCheckCard(a.id, a.title, val, a.desc || 'Daily spiritual practice');
    amolsContainer.appendChild(card);
  });

  // Custom Amols
  customAmols.forEach(a => {
    const val = dayRecord.amol[a.id] === 'DONE';
    const card = createAmolCheckCard(a.id, a.title, val, 'Custom target');
    amolsContainer.appendChild(card);
  });
}

// Generate checkbox card layout for Amols
function createAmolCheckCard(id, title, isChecked, desc) {
  const card = document.createElement('div');
  card.className = `amol-card ${isChecked ? 'checked' : ''}`;
  card.onclick = () => toggleAmol(id);

  card.innerHTML = `
    <div class="prayer-info">
      <span class="amol-title">${title}</span>
      <span class="prayer-desc">${desc}</span>
    </div>
    <div class="checkbox-container">
      <div class="checkbox-check"></div>
    </div>
  `;
  return card;
}

// Handle status pill toggle popover
window.toggleStatusDropdown = function(event, prayerId) {
  event.stopPropagation();
  // Close any other open dropdowns first
  document.querySelectorAll('.status-dropdown').forEach(d => {
    if (d.id !== `dropdown-${prayerId}`) d.classList.remove('show');
  });

  const dropdown = document.getElementById(`dropdown-${prayerId}`);
  dropdown.classList.toggle('show');
};

// Update status choice inside records
window.selectPrayerStatus = function(prayerId, status) {
  if (records[currentDate]) {
    records[currentDate].prayers[prayerId] = status;
    saveRecords();
    renderTracker();
    showToast(`${prayerId.toUpperCase()} status updated!`);
  }
};

// Toggle checklist state of Amol
function toggleAmol(amolId) {
  if (records[currentDate]) {
    const currentVal = records[currentDate].amol[amolId];
    records[currentDate].amol[amolId] = (currentVal === 'DONE') ? 'NOT_DONE' : 'DONE';
    saveRecords();
    renderTracker();
    
    const isDone = records[currentDate].amol[amolId] === 'DONE';
    showToast(isDone ? 'Task completed! ✨' : 'Task reset.');
  }
}

// 6. INSIGHTS GENERATION
function renderInsights() {
  const todayStr = getLocalDateString();
  const dayRecord = records[todayStr];

  // A. Overall Ring Progress for Today
  let completedTasks = 0;
  let totalTasks = 5; // 5 prayers always

  if (dayRecord) {
    // Check completed prayers
    PRAYER_METADATA.forEach(p => {
      const status = dayRecord.prayers[p.id];
      if (status && status !== 'NOT_DONE') completedTasks++;
    });

    // Check amols
    const activeAmolIds = [...DEFAULT_AMOLS.map(a => a.id), ...customAmols.map(c => c.id)];
    totalTasks += activeAmolIds.length;
    
    activeAmolIds.forEach(id => {
      if (dayRecord.amol[id] === 'DONE') completedTasks++;
    });
  }

  const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Set text
  document.getElementById('progress-percentage-label').textContent = `${overallPercent}%`;
  
  // Update progress description text
  const desc = document.getElementById('progress-card-desc');
  if (overallPercent === 100) {
    desc.textContent = "Masha'Allah! You completed all spiritual tracker actions today!";
  } else if (overallPercent > 60) {
    desc.textContent = "Excellent progress! A few actions left to complete today's circle.";
  } else {
    desc.textContent = "Log your daily prayers and tasks to grow your Amol index.";
  }

  // Update SVG dash offset
  const ring = document.getElementById('overall-progress-ring');
  const circumference = 251.2;
  const offset = circumference - (overallPercent / 100) * circumference;
  ring.style.strokeDashoffset = offset;

  // B. Calculate stats based on timeframe selection
  const select = document.getElementById('insights-timeframe-select');
  const timeframe = select ? select.value : 'last-30';
  
  let totalPrayersTracked = 0;
  let onTimePrayers = 0;
  let completePrayers = 0;
  let incompletePrayers = 0;
  
  const allDates = Object.keys(records).sort();
  const todayObj = new Date();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  let monthLabel = "Last 30 Days";
  if (timeframe !== 'last-30') {
    const parts = timeframe.split('-');
    const selYear = parseInt(parts[0], 10);
    const selMonthIndex = parseInt(parts[1], 10) - 1;
    monthLabel = `${monthNames[selMonthIndex]} ${selYear}`;
  }

  allDates.forEach(dStr => {
    const parts = dStr.split('-');
    const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
    
    let inRange = false;
    if (timeframe === 'last-30') {
      const diffDays = Math.ceil((todayObj - dObj) / (1000 * 60 * 60 * 24));
      inRange = (diffDays <= 30 && diffDays >= 0);
    } else {
      inRange = dStr.startsWith(timeframe);
    }
    
    if (inRange) {
      const rec = records[dStr];
      PRAYER_METADATA.forEach(p => {
        const stat = rec.prayers[p.id] || 'NOT_DONE';
        totalPrayersTracked++;
        
        if (stat === 'ON_TIME') {
          onTimePrayers++;
          completePrayers++;
        } else if (stat === 'LATE' || stat === 'QAZA') {
          completePrayers++;
        } else {
          incompletePrayers++;
        }
      });
    }
  });

  const onTimePercentage = totalPrayersTracked > 0 ? Math.round((onTimePrayers / totalPrayersTracked) * 100) : 0;
  const completePercentage = totalPrayersTracked > 0 ? Math.round((completePrayers / totalPrayersTracked) * 100) : 0;
  const incompletePercentage = totalPrayersTracked > 0 ? Math.round((incompletePrayers / totalPrayersTracked) * 100) : 0;

  const onTimeEl = document.getElementById('stats-ontime-prayers');
  const completeEl = document.getElementById('stats-complete-prayers');
  const incompleteEl = document.getElementById('stats-incomplete-prayers');
  
  if (onTimeEl) onTimeEl.textContent = `${onTimePercentage}%`;
  if (completeEl) completeEl.textContent = `${completePercentage}%`;
  if (incompleteEl) incompleteEl.textContent = `${incompletePercentage}%`;

  const detailsText = timeframe === 'last-30' ? 'Last 30 Days' : monthLabel;
  const onTimeDet = document.getElementById('stats-ontime-details');
  const completeDet = document.getElementById('stats-complete-details');
  const incompleteDet = document.getElementById('stats-incomplete-details');
  
  if (onTimeDet) onTimeDet.textContent = detailsText;
  if (completeDet) completeDet.textContent = detailsText;
  if (incompleteDet) incompleteDet.textContent = detailsText;

  // C. Weekly Prayer grid breakdown (7 columns representing last 7 days)
  const weeklyContainer = document.getElementById('weekly-breakdown-container');
  if (weeklyContainer) {
    weeklyContainer.innerHTML = '';
    
    // Calculate list of last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(getLocalDateString(d));
    }

    last7Days.forEach(dateStr => {
      const rec = records[dateStr];
      const parts = dateStr.split('-');
      const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const weekdayName = dObj.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W, T...
      
      const col = document.createElement('div');
      col.className = 'weekly-day-col';
      
      const cellsWrapper = document.createElement('div');
      cellsWrapper.className = 'weekly-grid-cell-container';
      
      PRAYER_METADATA.forEach(p => {
        const status = rec ? (rec.prayers[p.id] || 'NOT_DONE') : 'NOT_DONE';
        const cellDot = document.createElement('div');
        cellDot.className = 'weekly-cell-dot';
        cellDot.setAttribute('data-status', status);
        cellDot.title = `${p.title}: ${STATUS_DETAILS[status].label}`;
        cellsWrapper.appendChild(cellDot);
      });
      
      col.innerHTML = `<span class="weekly-day-label">${weekdayName}</span>`;
      col.appendChild(cellsWrapper);
      weeklyContainer.appendChild(col);
    });
  }

  // D. Monthly spiritual heatmap
  let heatYear, heatMonthIndex;
  if (timeframe === 'last-30') {
    const today = new Date();
    heatYear = today.getFullYear();
    heatMonthIndex = today.getMonth();
  } else {
    const parts = timeframe.split('-');
    heatYear = parseInt(parts[0], 10);
    heatMonthIndex = parseInt(parts[1], 10) - 1;
  }
  renderMonthlyHeatmap(heatYear, heatMonthIndex);
}

// Generate the monthly consistency calendar (glowing grid)
function renderMonthlyHeatmap(year, monthIndex) {
  const container = document.getElementById('heatmap-grid-container');
  if (!container) return;
  container.innerHTML = '';

  const today = new Date();
  const currentYear = year !== undefined ? year : today.getFullYear();
  const currentMonth = monthIndex !== undefined ? monthIndex : today.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const labelEl = document.getElementById('heatmap-month-label');
  if (labelEl) labelEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // Print weekdays labels
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  weekdays.forEach(day => {
    const wCell = document.createElement('div');
    wCell.className = 'heatmap-cell-weekday';
    wCell.textContent = day;
    container.appendChild(wCell);
  });

  // Get total days in month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Print empty cells prior to start of month
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'heatmap-cell';
    emptyCell.style.opacity = '0';
    container.appendChild(emptyCell);
  }

  // Draw day cells with relative spiritual scores (0 to 5 colors)
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const rec = records[dateStr];
    
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell active-day';
    cell.textContent = day;
    cell.title = `Date: ${dateStr}`;
    
    let score = 0;
    if (rec) {
      // 5 prayers. 1 point for on_time, 0.5 for late, 0.2 for qaza
      let prayerPoints = 0;
      PRAYER_METADATA.forEach(p => {
        const stat = rec.prayers[p.id];
        if (stat === 'ON_TIME') prayerPoints += 1;
        else if (stat === 'LATE') prayerPoints += 0.6;
        else if (stat === 'QAZA') prayerPoints += 0.3;
      });
      score = Math.min(5, Math.round(prayerPoints));
      
      // Customize tooltip
      const completeCount = PRAYER_METADATA.filter(p => rec.prayers[p.id] !== 'NOT_DONE').length;
      const amolCount = Object.values(rec.amol).filter(val => val === 'DONE').length;
      cell.title = `${dateStr}\nPrayers: ${completeCount}/5 completed\nAmols Done: ${amolCount}`;
    }

    cell.setAttribute('data-score', score);
    
    // Clicking a cell navigates the tracker to that day!
    cell.onclick = () => {
      currentDate = dateStr;
      document.getElementById('date-input').value = currentDate;
      updateDateView();
      // Switch view to tracker
      document.getElementById('nav-tracker').click();
      showToast(`Viewing date: ${formatVisualDate(dateStr)}`);
    };

    container.appendChild(cell);
  }
}

// 7. STREAK CALCULATIONS
function calculateStreak() {
  const todayStr = getLocalDateString();
  const allDates = Object.keys(records).filter(d => records[d]).sort();
  
  if (allDates.length === 0) {
    updateStreakDisplays(0, 0);
    return;
  }

  let bestStreak = 0;
  let activeStreak = 0;
  let tempStreak = 0;

  // Let's sort all dates to find streaks
  // A day is considered completed if all 5 prayers are completed (any status except NOT_DONE)
  const isDayCompleted = (dateStr) => {
    const rec = records[dateStr];
    if (!rec) return false;
    return PRAYER_METADATA.every(p => rec.prayers[p.id] && rec.prayers[p.id] !== 'NOT_DONE');
  };

  // Convert dates string array to ordered list of Date objects
  const sortedDateObjects = allDates.map(dStr => {
    const parts = dStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  });

  if (sortedDateObjects.length === 0) {
    updateStreakDisplays(0, 0);
    return;
  }

  // Iterate to find streaks
  let i = 0;
  while (i < allDates.length) {
    if (isDayCompleted(allDates[i])) {
      tempStreak = 1;
      let currentObj = sortedDateObjects[i];
      
      // Look forward for consecutive days
      while (i + 1 < allDates.length) {
        const nextObj = sortedDateObjects[i + 1];
        const diffTime = nextObj - currentObj;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1 && isDayCompleted(allDates[i + 1])) {
          tempStreak++;
          currentObj = nextObj;
          i++;
        } else if (diffDays === 0) {
          // duplicate log, skip
          i++;
        } else {
          break;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }
    i++;
  }

  // Calculate ACTIVE STREAK (ending today or yesterday)
  const todayParts = todayStr.split('-');
  const todayDateObj = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  
  const yesterdayDateObj = new Date(todayDateObj);
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDateObj);

  // Start checking active streak backwards
  let checkDateObj = todayDateObj;
  let checkStr = todayStr;

  // If today isn't completed, check if yesterday was.
  if (!isDayCompleted(todayStr)) {
    checkDateObj = yesterdayDateObj;
    checkStr = yesterdayStr;
  }

  if (isDayCompleted(checkStr)) {
    activeStreak = 1;
    let prevDateObj = new Date(checkDateObj);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    let prevStr = getLocalDateString(prevDateObj);

    while (isDayCompleted(prevStr)) {
      activeStreak++;
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      prevStr = getLocalDateString(prevDateObj);
    }
  }

  bestStreak = Math.max(bestStreak, activeStreak);
  updateStreakDisplays(activeStreak, bestStreak);
}

function updateStreakDisplays(active, best) {
  document.getElementById('active-streak-display').textContent = `${active} Day${active !== 1 ? 's' : ''}`;
  
  const bestLabel = document.getElementById('stats-best-streak');
  if (bestLabel) {
    bestLabel.textContent = `${best} Day${best !== 1 ? 's' : ''}`;
  }
}

// 8. CUSTOM AMOL SYSTEM
function addCustomAmol(title) {
  const id = 'custom_' + Date.now();
  customAmols.push({ id, title });
  saveCustomAmols();
  
  // Inject default value for today's record
  if (records[currentDate]) {
    records[currentDate].amol[id] = 'NOT_DONE';
  }
  
  saveRecords();
  renderTracker();
  renderCustomAmolsManager();
}

window.deleteCustomAmol = function(id) {
  showConfirmModal(
    'Delete Custom Amol?',
    'Previous logs on past days will be kept in storage, but it will be removed from your daily checklist.',
    () => {
      customAmols = customAmols.filter(a => a.id !== id);
      saveCustomAmols();
      
      // We clean up from today's record to refresh UI
      if (records[currentDate] && records[currentDate].amol[id]) {
        delete records[currentDate].amol[id];
      }
      
      saveRecords();
      renderTracker();
      renderCustomAmolsManager();
      showToast('Amol deleted.');
    }
  );
};

function renderCustomAmolsManager() {
  const container = document.getElementById('custom-amols-manager-container');
  container.innerHTML = '';

  if (customAmols.length === 0) {
    container.innerHTML = `<p class="stat-footer" style="text-align: center; padding: 12px 0;">No custom amols added yet.</p>`;
    return;
  }

  customAmols.forEach(a => {
    const item = document.createElement('div');
    item.className = 'settings-item';
    item.innerHTML = `
      <span class="settings-item-label">${a.title}</span>
      <button class="btn-delete" onclick="deleteCustomAmol('${a.id}')" aria-label="Delete ${a.title}">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
    container.appendChild(item);
  });
}

// Backup & Restore Functions
function exportData() {
  try {
    const data = {
      app: "prayer-tracker",
      exportedAt: new Date().toISOString(),
      amol_records: JSON.parse(localStorage.getItem('amol_records') || '{}'),
      amol_custom_amols: JSON.parse(localStorage.getItem('amol_custom_amols') || '[]')
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    const dateStr = getLocalDateString();
    a.href = url;
    a.download = `prayer_tracker_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Backup file downloaded! 📥');
  } catch (err) {
    console.error('Export failed', err);
    showToast('Failed to export data. ❌');
  }
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      
      // Validation: Check if records exist
      const recordsToImport = imported.amol_records || imported.iman_records;
      if (!recordsToImport || typeof recordsToImport !== 'object') {
        showToast('Invalid backup file structure. ❌');
        return;
      }
      
      const customAmolsToImport = imported.amol_custom_amols || imported.iman_custom_amols || [];
      
      showConfirmModal(
        'Import Backup Data?',
        'This will overwrite your existing records and custom amols with the data from the backup file. This cannot be undone.',
        () => {
          localStorage.setItem('amol_records', JSON.stringify(recordsToImport));
          localStorage.setItem('amol_custom_amols', JSON.stringify(customAmolsToImport));
          
          showToast('Data imported successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        }
      );
    } catch (err) {
      console.error('Import failed', err);
      showToast('Failed to parse backup file. ❌');
    }
    // Reset file input value
    e.target.value = '';
  };
  reader.readAsText(file);
}

// 9. UTILITIES
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  
  toastText.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// Helper: Calculate Dhaka prayer times for a given date string (YYYY-MM-DD)
function getPrayerTimesForDate(dateStr) {
  try {
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    
    // Dhaka, Bangladesh coordinates
    const coordinates = new adhan.Coordinates(23.8103, 90.4125);
    const params = adhan.CalculationMethod.Karachi();
    params.madhab = adhan.Madhab.Hanafi;
    
    const pt = new adhan.PrayerTimes(coordinates, date, params);
    
    // Calculate tomorrow's Fajr to compute Isha's end boundary
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const ptTomorrow = new adhan.PrayerTimes(coordinates, tomorrow, params);
    
    return {
      fajr: pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha,
      nextFajr: ptTomorrow.fajr
    };
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    return null;
  }
}

// Helper: Format date object to 12-hour time string
function formatTime12(date) {
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Reusable Custom Confirmation Modal function
function showConfirmModal(title, description, onConfirm) {
  let modal = document.getElementById('global-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-confirm-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <h3 class="modal-title" id="global-modal-title">Confirm</h3>
        <p class="modal-desc" id="global-modal-desc"></p>
        <div class="modal-actions">
          <button id="global-btn-cancel" class="btn-secondary">Cancel</button>
          <button id="global-btn-proceed" class="btn-danger-modal">Proceed</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listener to cancel button
    document.getElementById('global-btn-cancel').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Close modal when clicking outside card
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Set content
  document.getElementById('global-modal-title').textContent = title;
  document.getElementById('global-modal-desc').textContent = description;
  
  // Clone proceed button to clear previous event listeners
  const proceedBtn = document.getElementById('global-btn-proceed');
  const newProceedBtn = proceedBtn.cloneNode(true);
  proceedBtn.parentNode.replaceChild(newProceedBtn, proceedBtn);
  
  newProceedBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    onConfirm();
  });
  
  // Show modal
  modal.style.display = 'flex';
}

// 10. PWA SERVICE WORKER REGISTRATION
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('ServiceWorker registered with scope:', reg.scope);
        })
        .catch(err => console.error('ServiceWorker registration failed:', err));
    });

    // Reload the page when a new service worker version is installed and takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}
