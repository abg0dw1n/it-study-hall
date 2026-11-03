// Theme palettes. Loaded as a plain (blocking) script in <head> so the right theme
// is applied before the page paints. The choice is per device: 'system' (default,
// follows the device's light/dark setting) or a palette id below. Stored under a key
// sign-out keeps. 'dark' and 'light' are the original Monokai Pro pair (kept as ids so
// older saved choices still work). CSS for the other palettes is in css/styles.css.
(function () {
  var KEY = 'itsh:theme';
  // scheme = base light/dark styling; bg/panel/accent/text feed the picker swatches and the browser UI color.
  var LIST = [
    { id: 'dark',            name: 'Monokai Pro',     scheme: 'dark',  bg: '#221f22', panel: '#2d2a2e', accent: '#ffd866', text: '#fcfcfa' },
    { id: 'light',           name: 'Monokai Light',   scheme: 'light', bg: '#f1ebe8', panel: '#faf4f2', accent: '#f0b429', text: '#29242a' },
    { id: 'powershell',      name: 'PowerShell',      scheme: 'dark',  bg: '#012456', panel: '#06306b', accent: '#f9f1a5', text: '#eeedf0' },
    { id: 'dracula',         name: 'Dracula',         scheme: 'dark',  bg: '#21222c', panel: '#282a36', accent: '#bd93f9', text: '#f8f8f2' },
    { id: 'one-dark',        name: 'One Dark',        scheme: 'dark',  bg: '#21252b', panel: '#282c34', accent: '#61afef', text: '#abb2bf' },
    { id: 'nord',            name: 'Nord',            scheme: 'dark',  bg: '#2e3440', panel: '#3b4252', accent: '#88c0d0', text: '#eceff4' },
    { id: 'solarized-dark',  name: 'Solarized Dark',  scheme: 'dark',  bg: '#002b36', panel: '#073642', accent: '#b58900', text: '#93a1a1' },
    { id: 'solarized-light', name: 'Solarized Light', scheme: 'light', bg: '#eee8d5', panel: '#fdf6e3', accent: '#b58900', text: '#073642' },
  ];
  var BY_ID = {};
  LIST.forEach(function (t) { BY_ID[t.id] = t; });
  var media = window.matchMedia('(prefers-color-scheme: light)');

  function pref() {
    try { var v = localStorage.getItem(KEY); return v && BY_ID[v] ? v : 'system'; } catch (e) { return 'system'; }
  }
  function resolve(p) { return p === 'system' ? (media.matches ? 'light' : 'dark') : p; }

  function syncToggle() {
    var b = document.getElementById('theme-toggle');
    if (!b) return;
    var light = document.documentElement.dataset.theme === 'light';
    var label = light ? 'Switch to dark mode' : 'Switch to light mode';
    b.setAttribute('aria-label', label);
    b.title = label;
  }

  function apply() {
    var t = BY_ID[resolve(pref())];
    var root = document.documentElement;
    root.dataset.theme = t.scheme;   // base light/dark styling
    root.dataset.palette = t.id;     // which palette
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.panel);
    syncToggle();
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t.scheme, palette: t.id, pref: pref() } }));
  }

  window.Theme = {
    list: LIST,
    pref: pref,
    current: function () { return document.documentElement.dataset.theme; },
    palette: function () { return document.documentElement.dataset.palette; },
    set: function (p) {
      try { if (p === 'system' || !BY_ID[p]) localStorage.removeItem(KEY); else localStorage.setItem(KEY, p); } catch (e) { /* ignore */ }
      apply();
    },
    // The header button flips between the Monokai light and dark pair.
    toggle: function () { this.set(this.current() === 'light' ? 'dark' : 'light'); },
  };

  apply();
  media.addEventListener('change', function () { if (pref() === 'system') apply(); });
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-toggle');
    if (b) b.addEventListener('click', function () { window.Theme.toggle(); });
    syncToggle();
  });
})();
