// --- app.js: sections-enabled start page with localStorage ---
const KEY = 'startpage.shortcuts.v1';
const TIMEZONES_KEY = 'startpage.timezones.v1';
const $grid = document.getElementById('grid');
const $timezones = document.getElementById('timezones');
const $dialog = document.getElementById('shortcutDialog');
const $form = document.getElementById('shortcutForm');
const $name = document.getElementById('name');
const $url = document.getElementById('url');
const $dialogTitle = $dialog.querySelector('.dialog-title');
const $clock = document.getElementById('clock');
const $menuButton = document.getElementById('menuButton');
const $menuDropdown = document.getElementById('menuDropdown');

let editTarget = null; // {section: si, item: ii} or {section: si, item: null} for add

// --- Clock ---
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  $clock.innerHTML = `${hours}:${minutes} <span class="tz-suffix">IST</span>`;
  
  // Update other timezones
  const timezones = getTimezones();
  $timezones.innerHTML = '';
  timezones.forEach((tz) => {
    const tzDiv = document.createElement('div');
    tzDiv.className = 'timezone-item';
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: tz.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const time = formatter.format(now);
    tzDiv.innerHTML = `<span class="tz-time">${time}</span> <span class="tz-name">${tz.name}</span>`;
    $timezones.appendChild(tzDiv);
  });
}
updateClock();
setInterval(updateClock, 1000);

// --- Menu toggle ---
$menuButton.addEventListener('click', (e) => {
  e.stopPropagation();
  $menuDropdown.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    $menuDropdown.classList.remove('active');
  }
});

// --- LocalStorage helpers ---
function getData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0]?.title && parsed[0]?.items) return parsed;
    return [];
  } catch {
    return [];
  }
}

function setData(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function getTimezones() {
  try {
    const raw = localStorage.getItem(TIMEZONES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setTimezones(list) {
  localStorage.setItem(TIMEZONES_KEY, JSON.stringify(list));
}

// --- Utilities ---
function normalizeUrl(str) {
  str = (str || '').trim();
  try { new URL(str); return str; } catch {}
  if (/^www\./i.test(str) || /^[\w.-]+\.[a-z]{2,}$/i.test(str)) {
    return 'https://' + str;
  }
  return str;
}

function faviconFor(u) {
  try {
    const hostUrl = new URL(u).origin;
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(hostUrl)}`;
  } catch {
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(u)}`;
  }
}


// Render helpers (safe DOM creation)
function createTile(item, onRemove, onEdit, section, ii) {
  const a = document.createElement('a');
  a.className = 'tile';
  a.href = item.url;
  a.target = '_self';
  a.rel = 'noreferrer';
  a.title = item.url;

  const bg = document.createElement('div'); bg.className = 'tile-bg';
  const fav = document.createElement('div'); fav.className = 'favicon';
  const img = document.createElement('img'); img.alt = '';
  img.src = faviconFor(item.url);
  fav.appendChild(img);

  const label = document.createElement('span'); label.className = 'label';
  label.title = item.name; label.textContent = item.name;

  // simple tile menu (no fixed positioning)
  const menu = document.createElement('div'); menu.className = 'tile-menu';
  const menuBtn = document.createElement('button'); menuBtn.className = 'tile-menu-button'; menuBtn.textContent = '⋮';

  const tileDropdown = document.createElement('div'); tileDropdown.className = 'tile-menu-dropdown';
  const editBtn = document.createElement('button'); editBtn.textContent = 'Edit';
  const delBtn = document.createElement('button'); delBtn.className = 'danger'; delBtn.textContent = 'Delete';

  editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); onEdit(); tileDropdown.classList.remove('active'); });
  delBtn.addEventListener('click', (ev) => { ev.stopPropagation(); if (confirm('Delete this shortcut?')) { onRemove(); } tileDropdown.classList.remove('active'); });

  tileDropdown.appendChild(editBtn);
  tileDropdown.appendChild(delBtn);

  // toggle dropdown; stop propagation so global click handler doesn't immediately close it
  menuBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.tile-menu-dropdown.active').forEach(d => d.classList.remove('active')); tileDropdown.classList.toggle('active'); });

  menu.appendChild(menuBtn);
  menu.appendChild(tileDropdown);

  a.appendChild(bg);
  a.appendChild(fav);
  a.appendChild(label);
  a.appendChild(menu);
  return a;
}

function render() {
  const data = getData();
  $grid.innerHTML = '';

  data.forEach((section, si) => {
    const sec = document.createElement('div'); sec.className = 'section';

    const header = document.createElement('div'); header.className = 'section-header';
    const h2 = document.createElement('h2'); h2.textContent = section.title || 'Section';
    header.appendChild(h2);

    const actions = document.createElement('div'); actions.className = 'section-actions';
    const menuBtn = document.createElement('button'); menuBtn.className = 'section-menu-button'; menuBtn.textContent = '⋮';

    // Section dropdown
    const sectionDropdown = document.createElement('div');
    sectionDropdown.className = 'section-menu-dropdown';
    const addShortcutBtn = document.createElement('button'); addShortcutBtn.textContent = 'Add shortcut';
    const deleteSectionBtn = document.createElement('button'); deleteSectionBtn.className = 'danger'; deleteSectionBtn.textContent = 'Delete section';
    addShortcutBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      editTarget = { section: si, item: null };
      $form.reset(); $dialogTitle.textContent = 'Add shortcut'; $dialog.showModal();
      sectionDropdown.classList.remove('active');
      setTimeout(() => $name.focus(), 0);
    });
    deleteSectionBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (confirm('Delete this section and all its shortcuts?')) {
        data.splice(si, 1);
        setData(data); render();
      }
      sectionDropdown.classList.remove('active');
    });
    sectionDropdown.appendChild(addShortcutBtn);
    sectionDropdown.appendChild(deleteSectionBtn);

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.section-menu-dropdown.active').forEach(d => d.classList.remove('active'));
      sectionDropdown.classList.toggle('active');
    });

    actions.appendChild(menuBtn);
    actions.appendChild(sectionDropdown);
    header.appendChild(actions);

    const secGrid = document.createElement('div'); secGrid.className = 'grid';

    section.items.forEach((item, ii) => {
      const tile = createTile(item, () => {
        section.items.splice(ii,1);
        setData(data); render();
      }, () => {
        editTarget = { section: si, item: ii };
        $name.value = item.name; $url.value = item.url;
        $dialogTitle.textContent = 'Edit shortcut';
        $dialog.showModal();
      }, section, ii);
      secGrid.appendChild(tile);
    });

    // plus tile for this section
    const plus = document.createElement('button'); plus.type = 'button'; plus.className = 'tile plus';
    const plusBg = document.createElement('div'); plusBg.className = 'tile-bg';
    const plusFav = document.createElement('div'); plusFav.className = 'favicon';
    const plusSpan = document.createElement('span'); plusSpan.textContent = '+'; plusFav.appendChild(plusSpan);
    const plusLabel = document.createElement('span'); plusLabel.className = 'label'; plusLabel.textContent = 'Add shortcut';
    plus.appendChild(plusBg); plus.appendChild(plusFav); plus.appendChild(plusLabel);
    plus.addEventListener('click', () => {
      editTarget = { section: si, item: null };
      $form.reset(); $dialogTitle.textContent = 'Add shortcut'; $dialog.showModal();
      setTimeout(() => $name.focus(), 0);
    });
    secGrid.appendChild(plus);

    sec.appendChild(header);
    sec.appendChild(secGrid);
    $grid.appendChild(sec);
  });

  // If no sections, show a small placeholder with Add section button
  if (!data.length) {
    const p = document.createElement('div'); p.className = 'section';
    const ph = document.createElement('div'); ph.className = 'section-header';
    const h2 = document.createElement('h2'); h2.textContent = 'No sections'; ph.appendChild(h2);
    p.appendChild(ph);
    $grid.appendChild(p);
  }
}

// --- Add/Edit dialog submit ---
document.getElementById('saveShortcut').addEventListener('click', (ev) => {
  ev.preventDefault();
  const name = $name.value.trim();
  let url = normalizeUrl($url.value);
  try { new URL(url); } catch { alert('Please provide a valid URL (e.g., https://example.com).'); return; }

  const data = getData();
  if (!editTarget) { alert('No section selected.'); return; }
  const si = editTarget.section;
  if (si == null || !data[si]) { alert('Invalid section.'); return; }
  if (editTarget.item === null) {
    data[si].items.push({ name, url });
  } else {
    data[si].items[editTarget.item] = { name, url };
  }
  setData(data); $dialog.close(); render();
});

// --- Cancel dialog ---
document.getElementById('cancelShortcut').addEventListener('click', () => {
  $dialog.close();
});

$dialog.addEventListener('close', () => {
  editTarget = null;
});

// --- Reset ---
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all saved shortcuts? This cannot be undone.')) {
    localStorage.removeItem(KEY); 
    render();
  }
});

// Add section button
const addSectionBtn = document.getElementById('addSectionBtn');
if (addSectionBtn) {
  addSectionBtn.addEventListener('click', () => {
    const title = prompt('Section title', 'New section');
    if (title) {
      const data = getData(); 
      data.push({ title: title.trim(), items: [] }); 
      setData(data); 
      render();
    }
  });
}

// Add timezone button
const addTimezoneBtn = document.getElementById('addTimezoneBtn');
if (addTimezoneBtn) {
  addTimezoneBtn.addEventListener('click', () => {
    const name = prompt('Timezone name (e.g., EST, GMT)', 'New timezone');
    if (!name) return;
    const timezone = prompt('Timezone (e.g., America/New_York)', 'UTC');
    if (!timezone) return;
    const timezones = getTimezones();
    timezones.push({ name: name.trim(), timezone: timezone.trim() });
    setTimezones(timezones);
    updateClock();
  });
}

// Search behavior
document.getElementById('searchForm').addEventListener('submit', (ev) => {
  const input = document.getElementById('q');
  const value = input.value.trim();
  if (!value) return;
  try {
    const asUrl = normalizeUrl(value);
    new URL(asUrl);
    ev.preventDefault(); location.href = asUrl;
  } catch {}
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.section-menu-dropdown.active, .tile-menu-dropdown.active').forEach(d => d.classList.remove('active'));
});

// Initial render
render();
