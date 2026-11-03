// Theme palettes. Loaded as a plain (blocking) script in <head> so the right theme
// is applied before the page paints. The choice is per device: 'system' (default,
// follows the device's light/dark setting) or a palette id below. Stored under a key
// sign-out keeps. 'dark' and 'light' are the original Monokai Pro pair (kept as ids so
// older saved choices still work). CSS for the other palettes is in css/styles.css.
(function () {
  var KEY = 'itsh:theme';
  // scheme = base light/dark styling; bg/panel/accent/text feed the picker swatches and the browser UI color.
  var LIST = [
    { id: 'dark', pair: 'light',            name: 'Monokai Pro',     scheme: 'dark',  bg: '#221f22', panel: '#2d2a2e', accent: '#ffd866', text: '#fcfcfa' },
    { id: 'light', pair: 'dark',           name: 'Monokai Light',   scheme: 'light', bg: '#f1ebe8', panel: '#faf4f2', accent: '#f0b429', text: '#29242a' },
    { id: 'powershell', pair: 'powershell-light',      name: 'PowerShell',      scheme: 'dark',  bg: '#012456', panel: '#06306b', accent: '#f9f1a5', text: '#eeedf0' },
    { id: 'dracula', pair: 'dracula-light',         name: 'Dracula',         scheme: 'dark',  bg: '#21222c', panel: '#282a36', accent: '#bd93f9', text: '#f8f8f2' },
    { id: 'one-dark', pair: 'one-light',        name: 'One Dark',        scheme: 'dark',  bg: '#21252b', panel: '#282c34', accent: '#61afef', text: '#abb2bf' },
    { id: 'nord', pair: 'nord-light',            name: 'Nord',            scheme: 'dark',  bg: '#2e3440', panel: '#3b4252', accent: '#88c0d0', text: '#eceff4' },
    { id: 'solarized-dark', pair: 'solarized-light',  name: 'Solarized Dark',  scheme: 'dark',  bg: '#002b36', panel: '#073642', accent: '#b58900', text: '#93a1a1' },
    { id: 'solarized-light', pair: 'solarized-dark', name: 'Solarized Light', scheme: 'light', bg: '#eee8d5', panel: '#fdf6e3', accent: '#b58900', text: '#073642' },
    { id: 'powershell-light', pair: 'powershell', name: 'PowerShell Light', scheme: 'light', bg: '#e9eef6', panel: '#ffffff', accent: '#0a64c8', text: '#1b1b1b' },
    { id: 'dracula-light',   pair: 'dracula',   name: 'Dracula Light',   scheme: 'light', bg: '#f3eed9', panel: '#fffbeb', accent: '#644ac9', text: '#1f1f1f' },
    { id: 'one-light',       pair: 'one-dark',  name: 'One Light',       scheme: 'light', bg: '#eceded', panel: '#fafafa', accent: '#3569e0', text: '#383a42' },
    { id: 'nord-light',      pair: 'nord',      name: 'Nord Light',      scheme: 'light', bg: '#e5e9f0', panel: '#eceff4', accent: '#4f7399', text: '#2e3440' },
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
    // The header button flips to the light/dark counterpart of the chosen theme
    // (e.g. Dracula <-> Dracula Light). With System, it picks a fixed theme.
    toggle: function () {
      var t = BY_ID[this.palette()];
      this.set(t && t.pair ? t.pair : (this.current() === 'light' ? 'dark' : 'light'));
    },
  };

  apply();
  media.addEventListener('change', function () { if (pref() === 'system') apply(); });
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('theme-toggle');
    if (b) b.addEventListener('click', function () { window.Theme.toggle(); });
    syncToggle();
  });
})();
