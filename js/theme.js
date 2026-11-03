// Theme palettes. Loaded as a plain (blocking) script in <head> so the right theme
// is applied before the page paints. The choice is per device: 'system' (default,
// follows the device's light/dark setting) or a palette id below. Stored under a key
// sign-out keeps. 'dark' and 'light' are the original Monokai Pro pair (kept as ids so
// older saved choices still work). CSS for the other palettes is in css/styles.css.
(function () {
  var KEY = 'itsh:theme', BACK = 'itsh:theme-back';
  // scheme = base light/dark styling; bg/panel/accent/text feed the picker swatches and the browser UI color.
  var LIST = [
    { id: 'dark', pair: 'light',            name: 'Monokai Pro',     scheme: 'dark',  bg: '#221f22', panel: '#2d2a2e', accent: '#ffd866', text: '#fcfcfa' },
    { id: 'light', pair: 'dark',           name: 'Monokai Light',   scheme: 'light', bg: '#f1ebe8', panel: '#faf4f2', accent: '#f0b429', text: '#29242a' },
    { id: 'powershell', pair: 'powershell-light',      name: 'PowerShell',      scheme: 'dark',  bg: '#012456', panel: '#06306b', accent: '#f9f1a5', text: '#eeedf0' },
    { id: 'powershell-light', pair: 'powershell', name: 'PowerShell Light', scheme: 'light', bg: '#e9eef6', panel: '#ffffff', accent: '#0a64c8', text: '#1b1b1b' },
    { id: 'dracula', pair: 'dracula-light',         name: 'Dracula',         scheme: 'dark',  bg: '#21222c', panel: '#282a36', accent: '#bd93f9', text: '#f8f8f2' },
    { id: 'dracula-light',   pair: 'dracula',   name: 'Dracula Light',   scheme: 'light', bg: '#f3eed9', panel: '#fffbeb', accent: '#644ac9', text: '#1f1f1f' },
    { id: 'one-dark', pair: 'one-light',        name: 'One Dark',        scheme: 'dark',  bg: '#21252b', panel: '#282c34', accent: '#61afef', text: '#abb2bf' },
    { id: 'one-light',       pair: 'one-dark',  name: 'One Light',       scheme: 'light', bg: '#eceded', panel: '#fafafa', accent: '#3569e0', text: '#383a42' },
    { id: 'nord', pair: 'nord-light',            name: 'Nord',            scheme: 'dark',  bg: '#2e3440', panel: '#3b4252', accent: '#88c0d0', text: '#eceff4' },
    { id: 'nord-light',      pair: 'nord',      name: 'Nord Light',      scheme: 'light', bg: '#e5e9f0', panel: '#eceff4', accent: '#4f7399', text: '#2e3440' },
    { id: 'solarized-dark', pair: 'solarized-light',  name: 'Solarized Dark',  scheme: 'dark',  bg: '#002b36', panel: '#073642', accent: '#b58900', text: '#93a1a1' },
    { id: 'solarized-light', pair: 'solarized-dark', name: 'Solarized Light', scheme: 'light', bg: '#eee8d5', panel: '#fdf6e3', accent: '#b58900', text: '#073642' },
    { id: 'gruvbox', pair: 'gruvbox-light', name: 'Gruvbox', scheme: 'dark', bg: '#1d2021', panel: '#282828', accent: '#fabd2f', text: '#ebdbb2' },
    { id: 'gruvbox-light', pair: 'gruvbox', name: 'Gruvbox Light', scheme: 'light', bg: '#ebdbb2', panel: '#fbf1c7', accent: '#96600f', text: '#3c3836' },
    { id: 'tokyo-night', pair: 'tokyo-night-day', name: 'Tokyo Night', scheme: 'dark', bg: '#16161e', panel: '#1a1b26', accent: '#7aa2f7', text: '#c0caf5' },
    { id: 'tokyo-night-day', pair: 'tokyo-night', name: 'Tokyo Night Day', scheme: 'light', bg: '#d5d6db', panel: '#e6e7ed', accent: '#2a6fd1', text: '#343b58' },
    { id: 'catppuccin', pair: 'catppuccin-latte', name: 'Catppuccin Mocha', scheme: 'dark', bg: '#11111b', panel: '#1e1e2e', accent: '#cba6f7', text: '#cdd6f4' },
    { id: 'catppuccin-latte', pair: 'catppuccin', name: 'Catppuccin Latte', scheme: 'light', bg: '#dce0e8', panel: '#eff1f5', accent: '#8839ef', text: '#4c4f69' },
    { id: 'github-dark', pair: 'github-light', name: 'GitHub Dark', scheme: 'dark', bg: '#0d1117', panel: '#161b22', accent: '#58a6ff', text: '#e6edf3' },
    { id: 'github-light', pair: 'github-dark', name: 'GitHub Light', scheme: 'light', bg: '#f6f8fa', panel: '#ffffff', accent: '#0969da', text: '#1f2328' },
    { id: 'rose-pine', pair: 'rose-pine-dawn', name: 'Rosé Pine', scheme: 'dark', bg: '#191724', panel: '#1f1d2e', accent: '#ebbcba', text: '#e0def4' },
    { id: 'rose-pine-dawn', pair: 'rose-pine', name: 'Rosé Pine Dawn', scheme: 'light', bg: '#f2e9e1', panel: '#faf4ed', accent: '#a0516b', text: '#575279' },
    { id: 'ise-ambient', name: 'Ambient', scheme: 'dark', group: 'ise', bg: '#091012', panel: '#0c1619', accent: '#ec7600', text: '#e0e2e4' },
    { id: 'ise-ambients', name: 'Ambients', scheme: 'dark', group: 'ise', bg: '#0c1a26', panel: '#112435', accent: '#ffcc66', text: '#ffffff' },
    { id: 'ise-base16-tomorrow', name: 'Base16 Tomorrow', scheme: 'dark', group: 'ise', bg: '#151618', panel: '#1d1f21', accent: '#de935f', text: '#e0e2e4' },
    { id: 'ise-black-pastel', name: 'Black Pastel', scheme: 'dark', group: 'ise', bg: '#000000', panel: '#000000', accent: '#c78d9b', text: '#c0c0c0' },
    { id: 'ise-dependonme', name: 'DependOnMe', scheme: 'dark', group: 'ise', bg: '#161616', panel: '#1e1e1e', accent: '#42b7c9', text: '#d8d8d8' },
    { id: 'ise-gedit-original', name: 'gedit Original', scheme: 'dark', group: 'ise', bg: '#212527', panel: '#2e3436', accent: '#edd400', text: '#d3d7cf' },
    { id: 'ise-havenjark', name: 'Havenjark', scheme: 'dark', group: 'ise', bg: '#202729', panel: '#2d3639', accent: '#dfbe95', text: '#cbc3b7' },
    { id: 'ise-monokai-classic', name: 'Monokai Classic', scheme: 'dark', group: 'ise', bg: '#1c1d18', panel: '#272822', accent: '#79abff', text: '#f8f8f2' },
    { id: 'ise-navy-ocean', name: 'Navy Ocean', scheme: 'dark', group: 'ise', bg: '#0d253e', panel: '#123456', accent: '#ec7600', text: '#e0e2e4' },
    { id: 'ise-notepad-like', name: 'Notepad++ Like', scheme: 'light', group: 'ise', bg: '#f2f2f2', panel: '#ffffff', accent: '#b25900', text: '#210042' },
    { id: 'ise-oblivion', name: 'Oblivion', scheme: 'dark', group: 'ise', bg: '#161616', panel: '#1e1e1e', accent: '#ffc600', text: '#d8d8d8' },
    { id: 'ise-obsidian', name: 'Obsidian', scheme: 'dark', group: 'ise', bg: '#1e2325', panel: '#293134', accent: '#ec7600', text: '#e0e2e4' },
    { id: 'ise-ocean-deep', name: 'Ocean Deep', scheme: 'dark', group: 'ise', bg: '#0c232e', panel: '#103040', accent: '#00ffff', text: '#e8eee0' },
    { id: 'ise-pastel', name: 'Pastel', scheme: 'dark', group: 'ise', bg: '#161819', panel: '#1f2223', accent: '#678cb1', text: '#e0e2e4' },
    { id: 'ise-placidity', name: 'Placidity', scheme: 'dark', group: 'ise', bg: '#1d1d1d', panel: '#282828', accent: '#b8860b', text: '#abb7b8' },
    { id: 'ise-recogneyes', name: 'RecognEyes', scheme: 'dark', group: 'ise', bg: '#0c0c17', panel: '#101020', accent: '#ffff00', text: '#d0d0d0' },
    { id: 'ise-retta', name: 'Retta', scheme: 'dark', group: 'ise', bg: '#000000', panel: '#000000', accent: '#e79e3c', text: '#f8e1aa' },
    { id: 'ise-roboticket', name: 'Roboticket', scheme: 'light', group: 'ise', bg: '#e9e9e9', panel: '#f5f5f5', accent: '#af0f91', text: '#515151' },
    { id: 'ise-sublime-text-2', name: 'Sublime Text 2', scheme: 'dark', group: 'ise', bg: '#1c1d18', panel: '#272822', accent: '#ff1d8e', text: '#cfbfad' },
    { id: 'ise-vs2013-dark', name: 'VS2013 Dark', scheme: 'dark', group: 'ise', bg: '#161616', panel: '#1e1e1e', accent: '#b58900', text: '#eeedf0' },
    { id: 'ise-vibrant-ink', name: 'Vibrant Ink', scheme: 'dark', group: 'ise', bg: '#121212', panel: '#191919', accent: '#f7c527', text: '#ffffff' },
    { id: 'ise-wombat', name: 'Wombat', scheme: 'dark', group: 'ise', bg: '#1a1a1a', panel: '#242424', accent: '#95e454', text: '#f6f3e8' },
    { id: 'ise-zenburn', name: 'Zenburn', scheme: 'dark', group: 'ise', bg: '#2e2e2e', panel: '#404040', accent: '#dfbe95', text: '#f6f3e8' },
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
    // The header button flips between light and dark. It returns to the theme you just left,
    // otherwise goes to the chosen theme's light/dark counterpart (e.g. Dracula <-> Dracula Light),
    // otherwise to Monokai.
    toggle: function () {
      var cur = this.palette(), t = BY_ID[cur], back = null;
      try { back = JSON.parse(localStorage.getItem(BACK) || 'null'); } catch (e) { /* ignore */ }
      var to = back && back.at === cur && BY_ID[back.to] ? back.to : (t && t.pair) || (this.current() === 'light' ? 'dark' : 'light');
      try { localStorage.setItem(BACK, JSON.stringify({ at: to, to: cur })); } catch (e) { /* ignore */ }
      this.set(to);
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
