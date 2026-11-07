// Reference tab: printable one-page cheat sheets and, for networking exams, a subnetting trainer.
// Content comes from /exams/<slug>/reference.json:
//   { intro, trainer: true|false, sheets: [{ id, title, blurb, blocks: [block...] }] }
// Block types: table {title, head[], rows[][]}, cmds {title, rows[[command, meaning]]}, list {title, items[]},
//              note {text}. In text, `backticks` make inline code. Everything else is escaped.
import { makeProblem, KINDS, LEVELS, kindList, mask, hosts } from './subnet.js';

const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rich = (t = '') => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>');
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

let ctx = null;   // { exam, state, save }
let data = null;  // reference.json
let problem = null;
let answered = null; // null | { ok, given }

export async function loadReference(slug) {
  try {
    const res = await fetch(`/exams/${slug}/reference.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    data = await res.json();
    return (data?.sheets?.length || data?.trainer) ? data : null;
  } catch { return null; }
}
export function stopReference() { problem = null; answered = null; }

const store = () => (ctx.state.reference ||= { view: null, trainer: { level: 'medium', kinds: [], total: 0, correct: 0, streak: 0, best: 0 } });
const views = () => [...(data.sheets || []).map((s) => ({ id: s.id, label: s.title })), ...(data.trainer ? [{ id: 'trainer', label: 'Subnetting trainer' }] : [])];

export function renderReference(main, context) {
  ctx = context;
  const s = store();
  const all = views();
  if (!all.some((v) => v.id === s.view)) s.view = all[0].id;
  const tabs = `<div class="ref-tabs" role="tablist" aria-label="Reference sheets">${all.map((v) =>
    `<button type="button" role="tab" class="ref-tab" data-ref-view="${esc(v.id)}" aria-selected="${v.id === s.view}">${v.id === 'trainer' ? icon('shuffle') : icon('book')}${esc(v.label)}</button>`).join('')}</div>`;
  main.innerHTML = `<section class="stack reference">
    <div class="stack" style="gap:6px"><h2 class="home-title">Reference for ${esc(ctx.exam.code)}</h2>
      <p class="muted">${esc(data.intro || 'Quick-reference sheets you can print.')}</p></div>
    ${tabs}
    <div id="ref-body"></div>
  </section>`;
  main.querySelectorAll('[data-ref-view]').forEach((b) => b.addEventListener('click', () => {
    s.view = b.dataset.refView; ctx.save(); stopReference(); renderReference(main, ctx); window.scrollTo({ top: 0 });
  }));
  if (s.view === 'trainer') renderTrainer($('ref-body'));
  else renderSheet($('ref-body'), data.sheets.find((x) => x.id === s.view));
}

const $ = (id) => document.getElementById(id);

// ── Cheat sheets ─────────────────────────────────────────────────────────────
function block(b) {
  const title = b.title ? `<h4>${rich(b.title)}</h4>` : '';
  if (b.type === 'table') {
    return `<section class="ref-block">${title}<table><thead><tr>${b.head.map((h) => `<th>${rich(h)}</th>`).join('')}</tr></thead>
      <tbody>${b.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${rich(c)}</th>` : `<td>${rich(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></section>`;
  }
  if (b.type === 'cmds') {
    return `<section class="ref-block">${title}<table class="ref-cmds"><tbody>${b.rows.map(([c, d]) => `<tr><td><code>${esc(c)}</code></td><td>${rich(d)}</td></tr>`).join('')}</tbody></table></section>`;
  }
  if (b.type === 'list') return `<section class="ref-block">${title}<ul>${b.items.map((i) => `<li>${rich(i)}</li>`).join('')}</ul></section>`;
  if (b.type === 'note') return `<section class="ref-block ref-note"><p>${rich(b.text)}</p></section>`;
  return '';
}

function renderSheet(el, sheet) {
  el.innerHTML = `<article class="panel card-pad ref-sheet" id="ref-sheet">
    <header class="ref-head"><div><h3>${esc(sheet.title)}</h3><p class="muted small">${esc(sheet.blurb || '')}</p></div>
      <button type="button" class="btn btn-ghost btn-sm ref-print" id="ref-print">${icon('book')}Print this sheet</button></header>
    <div class="ref-cols">${sheet.blocks.map(block).join('')}</div>
    <p class="ref-foot small muted">The IT Study Hall · ${esc(ctx.exam.code)} · ${esc(sheet.title)}. A study aid; check the official exam objectives for the current list.</p>
  </article>`;
  $('ref-print').addEventListener('click', () => window.print());
}

// ── Subnetting trainer ───────────────────────────────────────────────────────
function newProblem() {
  const t = store().trainer;
  problem = makeProblem(t.kinds, t.level);
  answered = null;
}

function renderTrainer(el) {
  const t = store().trainer;
  if (!problem) newProblem();
  const pct = t.total ? Math.round((t.correct / t.total) * 100) : 0;
  const chips = kindList.map((k) => `<label class="ref-chip"><input type="checkbox" data-kind="${k}" ${t.kinds.length === 0 || t.kinds.includes(k) ? 'checked' : ''}><span>${esc(KINDS[k].label)}</span></label>`).join('');
  el.innerHTML = `<div class="trainer">
    <div class="panel card-pad stack trainer-main" style="gap:14px">
      <div class="trainer-stats" aria-live="polite">
        <span><b>${t.correct}</b> / ${t.total} correct${t.total ? ` (${pct}%)` : ''}</span>
        <span>Streak <b>${t.streak}</b></span><span>Best streak <b>${t.best}</b></span>
        <button type="button" class="link-btn" id="tr-reset">Reset score</button>
      </div>
      <p class="trainer-kind muted small">${esc(KINDS[problem.kind].label)}</p>
      <p class="trainer-prompt" id="tr-prompt">${esc(problem.prompt)}</p>
      <form id="tr-form" class="trainer-form" autocomplete="off">
        <input id="tr-input" type="text" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" aria-labelledby="tr-prompt" ${answered ? 'disabled' : ''} value="${answered ? esc(answered.given) : ''}" placeholder="Type your answer">
        ${answered
    ? '<button type="submit" class="btn btn-primary" id="tr-next">Next problem</button>'
    : '<button type="submit" class="btn btn-primary" id="tr-check">Check</button><button type="button" class="btn btn-ghost" id="tr-hint">Hint</button><button type="button" class="btn btn-ghost" id="tr-skip">Skip</button>'}
      </form>
      <div id="tr-feedback" role="status" aria-live="polite">${answered ? feedback() : ''}</div>
    </div>
    <aside class="panel card-pad stack trainer-side" style="gap:12px">
      <label class="small">Difficulty
        <select id="tr-level">${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}" ${t.level === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
      <fieldset class="ref-kinds"><legend class="small">Question types</legend>${chips}</fieldset>
      <details class="ref-quick"><summary class="small">Quick table: /prefix, mask, hosts</summary>${quickTable()}</details>
    </aside>
  </div>`;
  const input = $('tr-input');
  if (!answered) input.focus({ preventScroll: true }); else $('tr-next').focus({ preventScroll: true });
  $('tr-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (answered) { newProblem(); return renderTrainer(el); }
    check(el);
  });
  $('tr-hint')?.addEventListener('click', () => { $('tr-feedback').innerHTML = `<p class="trainer-hint">${icon('bulb')}${esc(problem.hint)}</p>`; input.focus(); });
  $('tr-skip')?.addEventListener('click', () => {
    const t2 = store().trainer; t2.total++; t2.streak = 0; ctx.save();
    answered = { ok: false, given: '', skipped: true }; renderTrainer(el);
  });
  $('tr-reset').addEventListener('click', () => { Object.assign(store().trainer, { total: 0, correct: 0, streak: 0, best: 0 }); ctx.save(); renderTrainer(el); });
  $('tr-level').addEventListener('change', (e) => { store().trainer.level = e.target.value; ctx.save(); newProblem(); renderTrainer(el); });
  el.querySelectorAll('[data-kind]').forEach((c) => c.addEventListener('change', () => {
    let picked = [...el.querySelectorAll('[data-kind]:checked')].map((x) => x.dataset.kind);
    if (!picked.length) { picked = []; el.querySelectorAll('[data-kind]').forEach((x) => { x.checked = true; }); }
    store().trainer.kinds = picked.length === kindList.length ? [] : picked;
    ctx.save(); newProblem(); renderTrainer(el);
  }));
}

function check(el) {
  const given = $('tr-input').value;
  if (!given.trim()) { $('tr-input').focus(); return; }
  const ok = !!problem.accept(given);
  const t = store().trainer;
  t.total++;
  if (ok) { t.correct++; t.streak++; t.best = Math.max(t.best, t.streak); } else t.streak = 0;
  ctx.save();
  answered = { ok, given };
  renderTrainer(el);
}

function feedback() {
  const steps = `<ol class="trainer-steps">${problem.steps.map((s) => `<li><code>${esc(s)}</code></li>`).join('')}</ol>`;
  if (answered.ok) return `<p class="trainer-ok">${icon('check')}Correct. <b>${esc(problem.answer)}</b></p><details class="trainer-work"><summary class="small">Show the working</summary>${steps}</details>`;
  return `<p class="trainer-bad">${icon('x')}${answered.skipped ? 'Skipped.' : 'Not quite.'} The answer is <b>${esc(problem.answer)}</b>.</p>${steps}`;
}

function quickTable() {
  const rows = [];
  for (let c = 8; c <= 30; c++) rows.push(`<tr><th scope="row">/${c}</th><td>${mask(c)}</td><td>${hosts(c).toLocaleString('en-US')}</td></tr>`);
  return `<table class="ref-quick-table"><thead><tr><th>Prefix</th><th>Mask</th><th>Usable hosts</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
