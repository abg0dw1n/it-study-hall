# Repository Optimization Report

## Current State Overview

**The IT Study Hall** is a static site with 34 certification exams, featuring practice questions, timed exams, learning paths with narrated video lessons, and hands-on labs. It's deployed to Vercel with no build step and no runtime dependencies.

### File Structure
```
/home/vboxuser/it-study-hall/
├── css/styles.css          # 1,046 lines - all styling
├── index.html              # 160 lines - app shell
├── privacy.html            # Privacy policy
├── sw.js                   # Service worker (v54)
├── vercel.json             # Vercel config (rewrites, headers, CSP)
├── package.json            # Minimal scripts
├── js/                     # 6,907 lines across 15 modules
│   ├── app.js              # 1,925 lines - main app logic
│   ├── auth.js             # 269 lines - Supabase auth + sync
│   ├── learn.js            # 533 lines - learning paths
│   ├── labs.js             # 609 lines - lab runner
│   ├── labs-*.js           # 7 lab platform modules
│   └── theme.js            # 49 lines - theme persistence
├── scripts/                # 4 build/validation scripts
├── exams/                  # 34 exam folders with exam.json, questions.json, learn.json, labs.json
└── fonts/, icons/          # Static assets
```

---

## Optimization Opportunities

### 1. **Code Organization & Modularity** (High Impact)

**Issue:** `app.js` (1,925 lines) is a monolithic file handling routing, state, rendering, practice/exam/review modes, home page, account page, feature requests, etc.

**Recommendations:**
- Split `app.js` into feature modules:
  - `router.js` - URL routing, slug parsing
  - `state.js` - State management (load/save/merge)
  - `render-home.js` - Home page rendering
  - `render-practice.js` - Practice mode rendering
  - `render-exam.js` - Exam mode rendering
  - `render-review.js` - Review mode rendering
  - `render-account.js` - Account page rendering
  - `ui-utils.js` - Shared UI helpers (icon, escapeHtml, toast, confirmModal)
- Keep `app.js` as thin entry point importing and wiring modules

### 2. **Lab Platform Consolidation** (Medium Impact)

**Issue:** 7 separate lab platform files (`labs-ios.js`, `labs-linux.js`, `labs-linux-admin.js`, `labs-linux-base.js`, `labs-linux-sec.js`, `labs-linux-storage.js`, `labs-net.js`, `labs-win.js`, `labs-az.js`) with shared imports and overlapping utilities.

**Recommendations:**
- Consolidate Linux modules into `labs-linux.js` (merge base, admin, sec, storage)
- Extract shared network utilities to `labs-net.js` (already somewhat separate)
- Consider a unified `Platform` interface for lab kinds (cli/tasks/portal)

### 3. **CSS Architecture** (Medium Impact)

**Issue:** Single 1,046-line CSS file with no organization. Uses custom properties well but lacks logical grouping.

**Recommendations:**
- Split into logical layers:
  - `tokens.css` - Custom properties (colors, spacing, fonts)
  - `base.css` - Reset, typography, global styles
  - `components.css` - Reusable components (buttons, inputs, cards, modals)
  - `layout.css` - Page layout, grid, responsive
  - `exam.css` - Exam-specific styles (questions, navigator, timer)
  - `home.css` - Home page, catalog, recents
  - `labs.css` - Lab-specific styles
  - `learn.css` - Learning path styles
- Use `@import` in main `styles.css` (no build step needed)
- Or keep single file but add clear section comments and TOC

### 4. **Data & Content Optimization** (Low-Medium Impact)

**Issues:**
- `exams/index.json` manually maintained - could be auto-generated from folders
- Question banks lack schema validation (TypeScript types or JSON Schema)
- `questions.json` files are pretty-printed (2-space indent) - could be minified for production
- Narration audio files in `exams/*/media/` not in git (correct), but `narration.json` manifests are

**Recommendations:**
- Add `scripts/generate-index.mjs` to build `index.json` from exam folders
- Add JSON Schema for `exam.json`, `questions.json`, `learn.json`, `labs.json`
- Minify JSON in CI for production deploy (keep pretty for dev)

### 5. **Performance** (Low-Medium Impact)

**Issues:**
- All JS loaded as modules via `<script type="module">` - good, but no code splitting
- Large `app.js` parsed even on pages that don't need it
- Service worker caches everything network-first (good for updates, could be stale-while-revalidate for static assets)
- Fonts preloaded but not subset further

**Recommendations:**
- Dynamic import for heavy features (labs, learn, narration audio)
- Use `modulepreload` more aggressively for critical paths
- Consider `stale-while-revalidate` for fonts, exam data
- Add `fetchpriority="high"` to critical CSS/JS

### 6. **Developer Experience** (Low Impact)

**Issues:**
- No TypeScript, ESLint, Prettier
- No CI linting/formatting
- Scripts use raw Node APIs (could use better CLI lib)

**Recommendations:**
- Add TypeScript with `jsconfig.json` for IDE support (no build step)
- Add Prettier for consistent formatting
- Add simple lint script to CI

### 7. **Security** (Already Good)

- CSP configured in `vercel.json`
- RLS on Supabase
- No build secrets in repo
- Rate limiting on narration script

---

## Proposed New Structure

```
/home/vboxuser/it-study-hall/
├── css/
│   ├── styles.css           # Main entry - imports below
│   ├── tokens.css           # Custom properties
│   ├── base.css             # Reset, typography
│   ├── components.css       # Buttons, inputs, cards, modal, toast
│   ├── layout.css           # Page layout, grid, responsive
│   ├── home.css             # Home page, catalog, recents
│   ├── exam.css             # Exam modes (practice/exam/review)
│   ├── labs.css             # Lab styles
│   └── learn.css            # Learning path styles
├── js/
│   ├── app.js               # Thin entry point (~50 lines)
│   ├── router.js            # Routing, URL parsing
│   ├── state.js             # State load/save/merge
│   ├── ui.js                # Shared UI utilities
│   ├── render-home.js       # Home page rendering
│   ├── render-practice.js   # Practice mode
│   ├── render-exam.js       # Exam mode
│   ├── render-review.js     # Review mode
│   ├── render-account.js    # Account page
│   ├── render-features.js   # Feature requests
│   ├── auth.js              # Supabase auth (unchanged)
│   ├── learn.js             # Learning paths (unchanged)
│   ├── labs.js              # Lab runner (unchanged)
│   ├── labs-ios.js          # iOS simulator
│   ├── labs-linux.js        # Linux simulator (consolidated)
│   ├── labs-net.js          # Network utils
│   ├── labs-win.js          # Windows simulator
│   ├── labs-az.js           # Azure simulator
│   └── theme.js             # Theme persistence
├── scripts/
│   ├── validate-questions.mjs
│   ├── import-csv.mjs
│   ├── stamp-updated.mjs
│   ├── render-speech.mjs
│   └── generate-index.mjs    # NEW: auto-generate exams/index.json
├── exams/                    # 34 exam folders (unchanged)
├── schemas/                  # NEW: JSON schemas for content
│   ├── exam.schema.json
│   ├── questions.schema.json
│   ├── learn.schema.json
│   └── labs.schema.json
├── index.html                # Updated module imports
├── sw.js                     # Updated cache strategy
├── vercel.json               # Minor tweaks
├── package.json              # Add lint/format scripts
└── jsconfig.json             # TypeScript config for IDE
```

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Split CSS into modular files | Medium | Maintainability, readability |
| 2 | Split `app.js` into feature modules | High | Maintainability, code splitting |
| 3 | Consolidate Linux lab modules | Medium | Maintainability, reduce duplication |
| 4 | Add JSON schemas for content | Low | Content validation, IDE support |
| 5 | Auto-generate `exams/index.json` | Low | Reduce manual maintenance |
| 6 | Add TypeScript/Prettier config | Low | Developer experience |
| 7 | Optimize service worker caching | Low | Performance |
| 8 | Dynamic imports for heavy features | Medium | Initial load performance |

---

## Quick Wins (Do First)

1. **CSS Modularization** - Immediate readability win, no JS changes needed
2. **Service Worker Cache Version Bump** - Already done (v54)
3. **Add `generate-index.mjs`** - Removes manual `index.json` maintenance
4. **JSON Schemas** - Documents data structures, enables validation

---

## Notes

- This is a **static site with no build step** - preserve this! All optimizations should work with plain ES modules and CSS `@import`.
- The site works offline - service worker strategy is critical.
- Content (questions, learn paths, labs) is the product - code serves content.
- Vercel deployment is working well - don't break it.