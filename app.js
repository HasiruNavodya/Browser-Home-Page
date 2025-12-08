document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  let sections = JSON.parse(localStorage.getItem('sections')) || [
    {
      title: 'General',
      shortcuts: [
        { name: 'Google', url: 'https://google.com' },
        { name: 'YouTube', url: 'https://youtube.com' }
      ]
    }
  ];

  let timezones = JSON.parse(localStorage.getItem('timezones')) || [];
  let currentTheme = localStorage.getItem('theme') || 'default';

  // --- DOM Elements ---
  const clockEl = document.getElementById('clock');
  const timezonesEl = document.getElementById('timezones');
  const gridEl = document.getElementById('grid');
  
  // Menu
  const menuButton = document.getElementById('menuButton');
  const menuDropdown = document.getElementById('menuDropdown');
  const resetBtn = document.getElementById('resetBtn');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const addTimezoneBtn = document.getElementById('addTimezoneBtn');

  // Settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsDialog = document.getElementById('settingsDialog');
  const themeBtns = document.querySelectorAll('.theme-btn');

  // Dialogs
  const shortcutDialog = document.getElementById('shortcutDialog');
  const sectionDialog = document.getElementById('sectionDialog');
  const timezoneDialog = document.getElementById('timezoneDialog');
  const renameSectionDialog = document.getElementById('renameSectionDialog');
  const renameShortcutDialog = document.getElementById('renameShortcutDialog');

  // Forms
  const shortcutForm = document.getElementById('shortcutForm');
  const sectionForm = document.getElementById('sectionForm');
  const timezoneForm = document.getElementById('timezoneForm');
  const renameSectionForm = document.getElementById('renameSectionForm');
  const renameShortcutForm = document.getElementById('renameShortcutForm');

  // --- Theme ---
  function applyTheme(theme) {
    document.body.className = ''; // Clear existing classes
    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`);
    }
    
    // Update active state in dialog
    themeBtns.forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Clock & Timezones ---
  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Update timezones
    renderTimezones();
  }

  function renderTimezones() {
    timezonesEl.innerHTML = '';
    const now = new Date();
    
    timezones.forEach((tz, index) => {
      const timeString = now.toLocaleTimeString([], { 
        timeZone: tz.zone, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      const el = document.createElement('div');
      el.className = 'timezone-item';
      el.title = tz.zone;
      el.innerHTML = `
        <div class="timezone-name">${tz.name}</div>
        <div class="timezone-time">${timeString}</div>
      `;
      
      // Context Menu
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showTimezoneContextMenu(e, index);
      });
      
      timezonesEl.appendChild(el);
    });
  }

  // --- Shortcuts & Sections ---
  function saveSections() {
    localStorage.setItem('sections', JSON.stringify(sections));
    renderGrid();
  }

  function saveTimezones() {
    localStorage.setItem('timezones', JSON.stringify(timezones));
    renderTimezones();
  }

  function getFavicon(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}/favicon.ico`;
    } catch (e) {
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIi8+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgLTEwIDE1LjMgMTUuMyAwIDAgMSA0IC0xMHoiLz48L3N2Zz4=';
    }
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    
    sections.forEach((section, sectionIndex) => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'section';
      
      // Add right-click listener for section
      sectionEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, sectionIndex);
      });
      
      const shortcutsHtml = section.shortcuts.map((shortcut, shortcutIndex) => {
        let fallbackIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIi8+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgLTEwIDE1LjMgMTUuMyAwIDAgMSA0IC0xMHoiLz48L3N2Zz4=';
        try {
          const domain = new URL(shortcut.url).hostname;
          fallbackIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch (e) {}

        return `
        <a href="${shortcut.url}" class="shortcut" data-section="${sectionIndex}" data-shortcut="${shortcutIndex}">
          <img src="${getFavicon(shortcut.url)}" alt="" class="shortcut-icon" onerror="this.onerror=null;this.src='${fallbackIcon}'">
          <span class="shortcut-name">${shortcut.name}</span>
        </a>
      `}).join('');

      sectionEl.innerHTML = `
        <div class="section-header">
          <div class="section-title">${section.title}</div>
        </div>
        <div class="shortcuts-container">
          ${shortcutsHtml}
        </div>
      `;
      
      gridEl.appendChild(sectionEl);
    });

    // Add right-click listeners for shortcuts
    document.querySelectorAll('.shortcut').forEach(el => {
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent section context menu
        const sIndex = parseInt(el.dataset.section);
        const scIndex = parseInt(el.dataset.shortcut);
        showShortcutContextMenu(e, sIndex, scIndex);
      });
    });
  }

  // --- Context Menu ---
  const contextMenu = document.getElementById('contextMenu');
  const shortcutContextMenu = document.getElementById('shortcutContextMenu');
  const timezoneContextMenu = document.getElementById('timezoneContextMenu');
  let contextMenuSectionIndex = null;
  let contextMenuShortcutIndex = null;
  let contextMenuTimezoneIndex = null;

  function showContextMenu(e, sectionIndex) {
    contextMenuSectionIndex = sectionIndex;
    showMenu(e, contextMenu);
  }

  function showShortcutContextMenu(e, sectionIndex, shortcutIndex) {
    contextMenuSectionIndex = sectionIndex;
    contextMenuShortcutIndex = shortcutIndex;
    showMenu(e, shortcutContextMenu);
  }

  function showTimezoneContextMenu(e, index) {
    contextMenuTimezoneIndex = index;
    showMenu(e, timezoneContextMenu);
  }

  function showMenu(e, menu) {
    // Close other menus
    contextMenu.classList.remove('show');
    shortcutContextMenu.classList.remove('show');
    timezoneContextMenu.classList.remove('show');

    // Position menu
    const x = e.clientX;
    const y = e.clientY;
    
    // Adjust if menu goes off screen
    const menuWidth = 160;
    const menuHeight = 120;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    
    const posX = x + menuWidth > winWidth ? x - menuWidth : x;
    const posY = y + menuHeight > winHeight ? y - menuHeight : y;

    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
    menu.classList.add('show');
  }

  // Hide context menu on click anywhere
  document.addEventListener('click', () => {
    contextMenu.classList.remove('show');
    shortcutContextMenu.classList.remove('show');
    timezoneContextMenu.classList.remove('show');
  });

  // Context Menu Actions
  document.getElementById('ctxAddShortcut').addEventListener('click', () => {
    currentSectionIndex = contextMenuSectionIndex;
    shortcutDialog.showModal();
  });

  document.getElementById('ctxRenameSection').addEventListener('click', () => {
    currentSectionIndex = contextMenuSectionIndex;
    document.getElementById('newSectionName').value = sections[currentSectionIndex].title;
    renameSectionDialog.showModal();
  });

  document.getElementById('ctxDeleteSection').addEventListener('click', () => {
    if (confirm('Delete this section and all its shortcuts?')) {
      sections.splice(contextMenuSectionIndex, 1);
      saveSections();
    }
  });

  // Shortcut Context Menu Actions
  document.getElementById('ctxRenameShortcut').addEventListener('click', () => {
    currentSectionIndex = contextMenuSectionIndex;
    const shortcut = sections[contextMenuSectionIndex].shortcuts[contextMenuShortcutIndex];
    document.getElementById('newShortcutName').value = shortcut.name;
    renameShortcutDialog.showModal();
  });

  document.getElementById('ctxDeleteShortcut').addEventListener('click', () => {
    if (confirm('Delete this shortcut?')) {
      sections[contextMenuSectionIndex].shortcuts.splice(contextMenuShortcutIndex, 1);
      saveSections();
    }
  });

  // Timezone Context Menu Actions
  document.getElementById('ctxDeleteTimezone').addEventListener('click', () => {
    if (confirm('Delete this timezone?')) {
      timezones.splice(contextMenuTimezoneIndex, 1);
      saveTimezones();
    }
  });

  // --- Event Listeners ---

  // Menu
  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuButton) {
      menuDropdown.classList.remove('show');
    }

    // Close section menus
    if (!e.target.classList.contains('section-menu-btn')) {
      document.querySelectorAll('.section-menu-dropdown.show').forEach(el => {
        if (!el.contains(e.target)) {
          el.classList.remove('show');
        }
      });
    }
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all shortcuts and settings?')) {
      localStorage.clear();
      location.reload();
    }
  });

  // Timezones
  addTimezoneBtn.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
    timezoneDialog.showModal();
  });

  timezoneForm.addEventListener('submit', (e) => {
    if (e.submitter.value === 'cancel') {
      timezoneDialog.close();
      return;
    }
    const name = document.getElementById('timezoneName').value;
    const zone = document.getElementById('timezoneValue').value;
    
    try {
      // Validate timezone
      new Date().toLocaleTimeString([], { timeZone: zone });
      timezones.push({ name, zone });
      saveTimezones();
      timezoneForm.reset();
      timezoneDialog.close();
    } catch (err) {
      alert('Invalid timezone identifier. Please check the IANA database.');
      e.preventDefault(); // Keep dialog open
    }
  });

  document.getElementById('cancelTimezone').addEventListener('click', (e) => {
    e.preventDefault();
    timezoneDialog.close();
  });

  timezonesEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('timezone-remove')) {
      const index = e.target.dataset.index;
      timezones.splice(index, 1);
      saveTimezones();
    }
  });

  // Sections
  addSectionBtn.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
    sectionDialog.showModal();
  });

  sectionForm.addEventListener('submit', (e) => {
    if (e.submitter.value === 'cancel') {
      sectionDialog.close();
      return;
    }
    const name = document.getElementById('sectionName').value;
    if (name) {
      sections.push({ title: name, shortcuts: [] });
      saveSections();
      sectionForm.reset();
      sectionDialog.close();
    }
  });

  document.getElementById('cancelSection').addEventListener('click', (e) => {
    e.preventDefault();
    sectionDialog.close();
  });

  renameSectionForm.addEventListener('submit', (e) => {
    if (e.submitter.value === 'cancel') {
      renameSectionDialog.close();
      return;
    }
    const newName = document.getElementById('newSectionName').value;
    if (newName && currentSectionIndex !== null) {
      sections[currentSectionIndex].title = newName;
      saveSections();
      renameSectionForm.reset();
      renameSectionDialog.close();
    }
  });

  document.getElementById('cancelRenameSection').addEventListener('click', (e) => {
    e.preventDefault();
    renameSectionDialog.close();
  });

  renameShortcutForm.addEventListener('submit', (e) => {
    if (e.submitter.value === 'cancel') {
      renameShortcutDialog.close();
      return;
    }
    const newName = document.getElementById('newShortcutName').value;
    if (newName && contextMenuSectionIndex !== null && contextMenuShortcutIndex !== null) {
      sections[contextMenuSectionIndex].shortcuts[contextMenuShortcutIndex].name = newName;
      saveSections();
      renameShortcutForm.reset();
      renameShortcutDialog.close();
    }
  });

  document.getElementById('cancelRenameShortcut').addEventListener('click', (e) => {
    e.preventDefault();
    renameShortcutDialog.close();
  });

  // Shortcuts
  let currentSectionIndex = null;

  gridEl.addEventListener('click', (e) => {
    // Delete Shortcut
    if (e.target.classList.contains('shortcut-delete')) {
      e.preventDefault(); // Prevent link navigation
      const sIndex = parseInt(e.target.dataset.section);
      const scIndex = parseInt(e.target.dataset.shortcut);
      sections[sIndex].shortcuts.splice(scIndex, 1);
      saveSections();
    }
  });

  shortcutForm.addEventListener('submit', (e) => {
    if (e.submitter.value === 'cancel') {
      shortcutDialog.close();
      return;
    }
    const name = document.getElementById('name').value;
    let url = document.getElementById('url').value;
    
    if (name && url && currentSectionIndex !== null) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      
      sections[currentSectionIndex].shortcuts.push({ name, url });
      saveSections();
      shortcutForm.reset();
      shortcutDialog.close();
    }
  });

  document.getElementById('cancelShortcut').addEventListener('click', (e) => {
    e.preventDefault();
    shortcutDialog.close();
  });

  // Settings
  settingsBtn.addEventListener('click', () => {
    settingsDialog.showModal();
  });

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      currentTheme = theme;
      localStorage.setItem('theme', theme);
      applyTheme(theme);
    });
  });

  // Init
  setInterval(updateClock, 1000);
  updateClock();
  renderGrid();
  applyTheme(currentTheme);
});
