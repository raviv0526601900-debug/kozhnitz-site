/* ──────────────────────────────────────────────────────────────────────────
   אתר האדמו״ר מקאזניץ — לוגיקה משותפת: תאריכים עבריים, רשימת הגלריות,
   עמוד גלריה ולייטבוקס. הנתונים ב‑data/galleries.js.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const GALLERIES = window.GALLERIES || [];

  /* ── תאריכים ─────────────────────────────────────────────────────────── */
  const HEB_MONTHS = ['תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א׳', 'אדר ב׳', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'];

  function gematria(n) {
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
    let s = '';
    let h = Math.floor(n / 100); n %= 100;
    while (h > 4) { s += 'ת'; h -= 4; }
    s += hundreds[h];
    if (n === 15) s += 'טו';
    else if (n === 16) s += 'טז';
    else s += tens[Math.floor(n / 10)] + ones[n % 10];
    return s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
  }

  // מחזיר {day, month, year, monthName} בלוח העברי. צילומי ערב (אחרי 18:00
  // שעון מקומי של הצילום) נספרים ליום העברי הבא.
  // קורא את שעון הקיר שנכתב במחרוזת ה‑ISO (לא את אזור הזמן של הדפדפן),
  // כדי שהתאריך יהיה זהה בכל מקום. מחזיר Date ב‑UTC של אותו יום אזרחי.
  function wallClockDate(iso, rollAfterNightfall) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?/.exec(iso || '');
    if (!m) return null;
    const hour = m[4] === undefined ? 12 : Number(m[4]);
    const roll = rollAfterNightfall && hour >= 18 ? 1 : 0;
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + roll));
  }

  function hebrewParts(iso) {
    const base = wallClockDate(iso, true);
    if (!base) return null;
    const fmt = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const parts = {};
    fmt.formatToParts(base).forEach((p) => { parts[p.type] = p.value; });
    const monthMap = { Tishri: 0, Heshvan: 1, Kislev: 2, Tevet: 3, Shevat: 4, Adar: 5, 'Adar I': 6, 'Adar II': 7, Nisan: 8, Iyar: 9, Sivan: 10, Tamuz: 11, Av: 12, Elul: 13 };
    const idx = monthMap[parts.month];
    return {
      day: Number(parts.day),
      year: Number(parts.year),
      monthName: idx === undefined ? parts.month : HEB_MONTHS[idx],
    };
  }

  function hebrewYearLabel(year) { return gematria(year % 1000); }

  function formatHebrewDate(iso) {
    const p = hebrewParts(iso);
    if (!p) return '';
    return `${gematria(p.day)} ${p.monthName === 'חשון' ? 'בחשון' : 'ב' + p.monthName} ${hebrewYearLabel(p.year)}`;
  }

  function formatGregorian(iso) {
    const d = wallClockDate(iso, false);
    if (!d) return '';
    return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  }

  function dateLabel(g) {
    if (g.hebrewDate) return g.hebrewDate;
    return g.date ? formatHebrewDate(g.date) : 'תאריך לא ידוע';
  }

  /* ── עזרים ───────────────────────────────────────────────────────────── */
  function counts(g) {
    const photos = g.items.filter((i) => i.type === 'photo').length;
    const videos = g.items.filter((i) => i.type === 'video').length;
    return { photos, videos };
  }
  function plural(n, one, many) { return n === 1 ? one : `${n} ${many}`; }
  function countsLabel(g) {
    const c = counts(g);
    const parts = [];
    if (c.photos) parts.push(plural(c.photos, 'תמונה אחת', 'תמונות'));
    if (c.videos) parts.push(plural(c.videos, 'סרטון אחד', 'סרטונים'));
    return parts.join(' · ') || 'ריק';
  }
  function kind(g) {
    const c = counts(g);
    if (c.photos && c.videos) return 'mixed';
    return c.videos ? 'video' : 'photos';
  }
  function cover(g) {
    if (g.cover) return g.cover;
    const first = g.items.find((i) => i.type === 'photo') || g.items.find((i) => i.type === 'video');
    if (!first) return '';
    return first.type === 'photo' ? (first.thumb || first.src) : (first.poster || '');
  }
  function sorted() {
    return GALLERIES.slice().sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  }
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else if (k in node && k !== 'style') node[k] = v;
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  /* ── עמוד הבית: רשימת הגלריות ────────────────────────────────────────── */
  function renderIndex(root) {
    const list = sorted();
    const filterBar = document.getElementById('gallery-filter');
    const totals = { photos: 0, videos: 0 };
    list.forEach((g) => { const c = counts(g); totals.photos += c.photos; totals.videos += c.videos; });
    const summary = document.getElementById('gallery-summary');
    if (summary) {
      summary.textContent = `${plural(list.length, 'גלריה אחת', 'גלריות')} · ${plural(totals.photos, 'תמונה אחת', 'תמונות')} · ${plural(totals.videos, 'סרטון אחד', 'סרטונים')}`;
    }

    function draw(filter) {
      root.innerHTML = '';
      const visible = list.filter((g) => {
        const c = counts(g);
        if (filter === 'photos') return c.photos > 0;
        if (filter === 'video') return c.videos > 0;
        return true;
      });
      if (!visible.length) {
        root.appendChild(el('p', { className: 'gallery-empty', text: 'אין גלריות להצגה.' }));
        return;
      }
      // קיבוץ לפי שנה עברית
      const groups = new Map();
      visible.forEach((g) => {
        const p = hebrewParts(g.date);
        const key = p ? p.year : 0;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(g);
      });
      groups.forEach((items, year) => {
        const section = el('section', { className: 'year-group' });
        section.appendChild(el('h3', { className: 'year-title', text: year ? `שנת ${hebrewYearLabel(year)}` : 'ללא תאריך' }));
        const grid = el('div', { className: 'gallery-cards' });
        items.forEach((g) => grid.appendChild(card(g)));
        section.appendChild(grid);
        root.appendChild(section);
      });
    }

    function card(g) {
      const c = counts(g);
      const k = kind(g);
      const kindText = k === 'video' ? 'וידאו' : k === 'mixed' ? 'תמונות ווידאו' : 'תמונות';
      const a = el('a', { className: `gcard gcard-${k}`, href: `gallery.html?g=${encodeURIComponent(g.id)}`, 'aria-label': `${g.title} — ${dateLabel(g)} — ${countsLabel(g)}` });
      const media = el('div', { className: 'gcard-media' });
      const src = cover(g);
      if (src) media.appendChild(el('img', { src, alt: '', loading: 'lazy', decoding: 'async' }));
      if (c.videos) media.appendChild(el('span', { className: 'gcard-play', 'aria-hidden': 'true', html: PLAY_SVG }));
      media.appendChild(el('span', { className: `tag ${k === 'video' ? 'tag-accent' : 'tag-accent-2'} gcard-kind`, text: kindText }));
      const body = el('div', { className: 'gcard-body' }, [
        el('span', { className: 'gcard-date', text: dateLabel(g) }),
        el('h4', { className: 'gcard-title', text: g.title }),
        el('span', { className: 'gcard-meta', text: [countsLabel(g), g.date ? formatGregorian(g.date) : null].filter(Boolean).join(' · ') }),
      ]);
      a.appendChild(media); a.appendChild(body);
      return a;
    }

    let filter = 'all';
    try { filter = localStorage.getItem('kozhnitz-filter') || 'all'; } catch (e) { /* ignore */ }
    if (filterBar) {
      filterBar.querySelectorAll('input[name="filter"]').forEach((input) => {
        input.checked = input.value === filter;
        input.addEventListener('change', () => {
          filter = input.value;
          try { localStorage.setItem('kozhnitz-filter', filter); } catch (e) { /* ignore */ }
          draw(filter);
        });
      });
    }
    draw(filter);
  }

  const PLAY_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

  /* ── עמוד גלריה ──────────────────────────────────────────────────────── */
  function renderGallery() {
    const params = new URLSearchParams(location.search);
    const id = params.get('g');
    const list = sorted();
    const index = list.findIndex((g) => g.id === id);
    const g = list[index];
    const titleEl = document.getElementById('g-title');
    const dateEl = document.getElementById('g-date');
    const metaEl = document.getElementById('g-meta');
    const photosWrap = document.getElementById('g-photos');
    const masonry = document.getElementById('masonry');
    const videoSection = document.getElementById('g-videos');
    const videoGrid = document.getElementById('video-grid');

    if (!g) {
      titleEl.textContent = 'הגלריה לא נמצאה';
      dateEl.hidden = true;
      metaEl.innerHTML = '';
      metaEl.appendChild(el('a', { href: 'index.html#galleries', className: 'btn btn-primary', text: 'לרשימת הגלריות' }));
      photosWrap.hidden = true; videoSection.hidden = true;
      return;
    }

    document.title = `${g.title} — ${dateLabel(g)} · מוסדות קאזניץ`;
    titleEl.textContent = g.title;
    dateEl.textContent = dateLabel(g);
    metaEl.textContent = [countsLabel(g), g.date ? formatGregorian(g.date) : null, g.place].filter(Boolean).join(' · ');

    const photos = g.items.filter((i) => i.type === 'photo');
    const videos = g.items.filter((i) => i.type === 'video');

    if (!photos.length) photosWrap.hidden = true;
    photos.forEach((photo, i) => {
      const tile = el('button', { type: 'button', className: 'tile', 'data-index': String(i), 'aria-label': `הגדלת התמונה: ${photo.caption || photo.alt || ''}` });
      const img = el('img', { src: photo.thumb || photo.src, alt: photo.alt || '', loading: i < 6 ? 'eager' : 'lazy', decoding: 'async' });
      img.style.setProperty('--ratio', photo.ratio || '4 / 3');
      tile.appendChild(img);
      masonry.appendChild(tile);
    });

    if (!videos.length) videoSection.hidden = true;
    videos.forEach((v) => {
      const fig = el('figure', { className: 'video-item' }, [
        el('video', { src: v.src, poster: v.poster || null, controls: true, playsInline: true, preload: 'metadata' }),
        v.caption ? el('figcaption', { text: v.caption }) : null,
      ]);
      videoGrid.appendChild(fig);
    });

    // ניווט בין גלריות (הרשימה ממוינת מהחדש לישן)
    const newer = list[index - 1];
    const older = list[index + 1];
    const navNewer = document.getElementById('g-newer');
    const navOlder = document.getElementById('g-older');
    if (newer) { navNewer.href = `gallery.html?g=${encodeURIComponent(newer.id)}`; navNewer.querySelector('span').textContent = newer.title; }
    else navNewer.hidden = true;
    if (older) { navOlder.href = `gallery.html?g=${encodeURIComponent(older.id)}`; navOlder.querySelector('span').textContent = older.title; }
    else navOlder.hidden = true;

    initLightbox(photos, masonry);
  }

  /* ── לייטבוקס ────────────────────────────────────────────────────────── */
  function initLightbox(photos, masonry) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !photos.length) return;
    const lbImage = document.getElementById('lb-image');
    const lbCaption = document.getElementById('lb-caption');
    const btnPrev = lightbox.querySelector('[data-lb-prev]');
    const btnNext = lightbox.querySelector('[data-lb-next]');
    const btnClose = lightbox.querySelector('[data-lb-close]');
    let current = -1;
    let lastFocus = null;

    function show(i) {
      current = (i + photos.length) % photos.length;
      const p = photos[current];
      lbImage.src = p.src;
      lbImage.alt = p.alt || '';
      lbCaption.textContent = p.caption || '';
      btnPrev.disabled = btnNext.disabled = photos.length < 2;
      [current + 1, current - 1].forEach((n) => { const q = photos[(n + photos.length) % photos.length]; if (q) { const pre = new Image(); pre.src = q.src; } });
    }
    function open(i) { lastFocus = document.activeElement; show(i); lightbox.hidden = false; document.body.style.overflow = 'hidden'; btnClose.focus(); }
    function close() { lightbox.hidden = true; document.body.style.overflow = ''; lbImage.src = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

    masonry.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) open(Number(t.dataset.index)); });
    btnPrev.addEventListener('click', () => show(current - 1));
    btnNext.addEventListener('click', () => show(current + 1));
    btnClose.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current + 1);   // RTL: הבא משמאל
      else if (e.key === 'ArrowRight') show(current - 1);
    });
    let startX = null;
    lightbox.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) >= 40) show(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });
  }

  /* ── אתחול ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const indexRoot = document.getElementById('gallery-list');
    if (indexRoot) renderIndex(indexRoot);
    if (document.getElementById('g-title')) renderGallery();
  });
})();
