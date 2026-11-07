// Performance-based questions (PBQs): exam-style drag-and-drop, ordering, matching, fill-in and firewall-rule tasks.
// Content: /exams/<slug>/pbq.json = { intro, minutesPerQuestion, questions: [{ id, title, domain, scenario, activities[], explanation }] }.
// Activities use the same format and renderer as the Labs "tasks" kind (see mountActivity in labs.js).
// Two ways to practice: a timed set (several PBQs, one timer, graded on submit with partial credit)
// or a single PBQ at your own pace with instant checking.
import { mountActivity, activityScore } from './labs.js';

const $ = (id) => document.getElementById(id);
const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

let ctx = null;  // { exam, state, save, guest, guestCta, confirm }
let data = null;
let timer = 0;

export async function loadPbq(slug) {
  try {
    const res = await fetch(`/exams/${slug}/pbq.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    data = await res.json();
    return data?.questions?.length ? data : null;
  } catch { return null; }
}
export function stopPbq() { clearInterval(timer); timer = 0; }

const store = () => (ctx.state.pbq ||= { history: [], active: null, single: null, best: {} });
const byId = (id) => data.questions.find((q) => q.id === id);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const pbqSummary = (saved, total) => ({ sets: saved?.pbq?.history?.length || 0, total, running: !!saved?.pbq?.active,
  best: Math.max(0, ...(saved?.pbq?.history || []).map((h) => h.score)) });

// ── Scoring ──────────────────────────────────────────────────────────────────
function scoreQuestion(q, work = {}) {
  const parts = q.activities.map((a, i) => activityScore(a, work[i] || {}));
  const got = parts.reduce((n, p) => n + p.got, 0), total = parts.reduce((n, p) => n + p.total, 0);
  return { parts, got, total, frac: total ? got / total : 0 };
}

function describeAnswer(a) {
  if (a.type === 'match') return `<ul>${a.categories.map((c, ci) => `<li><b>${esc(c)}</b>: ${a.items.filter((it) => it.cat === ci).map((it) => esc(it.text)).join(', ') || '(none)'}</li>`).join('')}</ul>`;
  if (a.type === 'order') return `<ol>${a.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`;
  if (a.type === 'fill') return `<ul>${a.rows.map((r) => `<li>${esc(r.label)}: <code>${esc(Array.isArray(r.answer) ? r.answer[0] : r.answer)}</code></li>`).join('')}</ul>`;
  if (a.type === 'rules') return `<ul>${a.tests.map((t) => `<li>${esc(t.label)} → <b>${esc(t.expect)}</b></li>`).join('')}</ul><p class="small muted">Any rule set that gives these results is accepted.</p>`;
  return '';
}

function reviewBlock(q, work) {
  const sc = scoreQuestion(q, work);
  return `<article class="panel card-pad stack pbq-review" style="gap:10px">
    <header class="pbq-review-head"><h3>${esc(q.title)}</h3>
      <span class="chip ${sc.frac === 1 ? 'chip-azure' : ''}">${sc.got} / ${sc.total} correct</span></header>
    ${q.activities.map((a, i) => `<details class="pbq-answer"><summary><b>${esc(a.title || `Part ${i + 1}`)}</b>
      <span class="${sc.parts[i].got === sc.parts[i].total ? 'good' : 'weak'}"> ${sc.parts[i].got} of ${sc.parts[i].total}</span></summary>${describeAnswer(a)}</details>`).join('')}
    ${q.explanation ? `<div class="pbq-explain"><b>Why:</b> ${q.explanation}</div>` : ''}
  </article>`;
}

// ── Entry ────────────────────────────────────────────────────────────────────
export function renderPbq(main, context) {
  ctx = context;
  stopPbq();
  if (ctx.guest) return renderLocked(main);
  const s = store();
  if (s.active && s.active.result) return renderResult(main);
  if (s.active) return renderRun(main);
  if (s.single) return renderSingle(main);
  return renderHome(main);
}

function renderLocked(main) {
  main.innerHTML = `<section class="stack pbq">
    <div class="stack" style="gap:6px"><h2 class="home-title">Performance-based practice for ${esc(ctx.exam.code)}</h2><p class="muted">${esc(data.intro || '')}</p></div>
    <div class="panel card-pad labs-locked">${icon('lock')}<div><h3>Performance-based practice is for signed-in members</h3>
      <p class="muted">There are ${data.questions.length} exam-style tasks: drag-and-drop, matching, ordering and rule-building, in timed sets or one at a time. Accounts are free.</p></div>
      <button class="btn btn-primary" data-guest-exit="signin">${icon('user')}Sign in to practice</button></div>
    <ul class="labs-preview">${data.questions.map((q) => `<li>${icon('grid')}<span><b>${esc(q.title)}</b><span class="muted small">${q.activities.length} part${q.activities.length === 1 ? '' : 's'}</span></span></li>`).join('')}</ul>
  </section>`;
}

// ── Home: start a timed set or pick one ──────────────────────────────────────
function renderHome(main) {
  const s = store();
  const n = data.questions.length;
  const sizes = [...new Set([3, 5, Math.min(8, n)])].filter((x) => x <= n);
  const per = data.minutesPerQuestion || 8;
  const last = s.history[0];
  const best = (id) => (s.best[id] != null ? `<span class="lab-status good">${icon('check')}Best ${Math.round(s.best[id] * 100)}%</span>` : '<span class="lab-status muted">Not tried</span>');
  main.innerHTML = `<section class="stack pbq">
    <div class="stack" style="gap:6px"><h2 class="home-title">Performance-based practice for ${esc(ctx.exam.code)}</h2>
      <p class="muted">${esc(data.intro || 'Exam-style tasks where you do something instead of picking an answer.')}</p></div>
    <div class="panel card-pad stack" style="gap:12px">
      <h3>Timed set</h3>
      <p class="muted small">Pick how many tasks. You get ${per} minutes per task on one timer, move between them freely, and are graded with partial credit when you submit or time runs out.</p>
      <div class="pbq-sizes" role="radiogroup" aria-label="Number of tasks">${sizes.map((x, i) => `<label class="ref-chip"><input type="radio" name="pbq-size" value="${x}" ${i === 0 ? 'checked' : ''}><span>${x} tasks · ${x * per} min</span></label>`).join('')}</div>
      <div><button class="btn btn-primary" id="pbq-start">${icon('clock')}Start timed set</button></div>
      ${last ? `<p class="small muted">Last set: <b>${Math.round(last.score * 100)}%</b> on ${last.count} tasks in ${mmss(last.elapsed)} · ${s.history.length} set${s.history.length === 1 ? '' : 's'} completed</p>` : ''}
    </div>
    <div class="stack" style="gap:8px"><h3>Practice one at a time</h3><p class="muted small">No timer. Check your work as often as you like.</p></div>
    <div class="lab-grid">${data.questions.map((q, i) => `<article class="panel lab-card">
      <div class="lab-card-head"><span class="learn-num">${i + 1}</span><div><h3>${esc(q.title)}</h3>
        <span class="lab-meta">${q.activities.length} part${q.activities.length === 1 ? '' : 's'}${ctx.exam.domains?.[q.domain] ? ` · ${esc(ctx.exam.domains[q.domain].name)}` : ''}</span></div></div>
      <div class="lab-card-foot">${best(q.id)}<button class="btn btn-ghost btn-sm" data-pbq-one="${esc(q.id)}">Practice${icon('right')}</button></div></article>`).join('')}</div>
  </section>`;
  $('pbq-start').addEventListener('click', () => {
    const count = Number(main.querySelector('[name="pbq-size"]:checked')?.value || sizes[0]);
    const ids = data.questions.map((q) => q.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const now = Date.now();
    s.active = { ids: ids.slice(0, count), idx: 0, startedAt: now, endsAt: now + count * per * 60000, work: {}, result: null };
    ctx.save(); renderPbq(main, ctx); window.scrollTo({ top: 0 });
  });
  main.querySelectorAll('[data-pbq-one]').forEach((b) => b.addEventListener('click', () => {
    s.single = { id: b.dataset.pbqOne, work: {}, checked: false }; ctx.save(); renderPbq(main, ctx); window.scrollTo({ top: 0 });
  }));
}

// ── Shared: draw a question's scenario and activities ───────────────────────
function drawQuestion(el, q, work, onChange) {
  el.innerHTML = `<div class="panel card-pad stack" style="gap:8px"><h3>${esc(q.title)}</h3><div class="pbq-scenario">${q.scenario}</div></div>
    ${q.activities.map((a, i) => `<section class="panel card-pad activity" data-pa="${i}"><h3><span class="act-num">${i + 1}</span>${esc(a.title || '')}</h3><p class="muted">${a.prompt}</p><div class="act-body"></div></section>`).join('')}`;
  q.activities.forEach((a, i) => {
    const box = el.querySelector(`[data-pa="${i}"] .act-body`);
    const st = work[i] ||= {};
    const mount = () => mountActivity(box, a, st, { changed: onChange, redraw: mount });
    mount();
  });
}

// ── Timed set ────────────────────────────────────────────────────────────────
function renderRun(main) {
  const s = store(), act = s.active;
  const q = byId(act.ids[act.idx]);
  if (!q) { s.active = null; ctx.save(); return renderHome(main); }
  const touched = (id) => Object.keys(act.work[id] || {}).length > 0;
  main.innerHTML = `<section class="stack pbq">
    <div class="pbq-bar panel">
      <span class="pbq-timer" id="pbq-timer" role="timer" aria-live="off">${icon('clock')}<span id="pbq-time">--:--</span></span>
      <div class="pbq-dots" role="tablist" aria-label="Tasks">${act.ids.map((id, i) => `<button type="button" role="tab" class="pbq-dot${i === act.idx ? ' on' : ''}${touched(id) ? ' done' : ''}" data-go="${i}" aria-selected="${i === act.idx}" aria-label="Task ${i + 1}">${i + 1}</button>`).join('')}</div>
      <button class="btn btn-primary btn-sm" id="pbq-submit">Submit set</button>
    </div>
    <div id="pbq-q" class="stack"></div>
    <div class="pbq-nav"><button class="btn btn-ghost" id="pbq-prev" ${act.idx === 0 ? 'disabled' : ''}>${icon('left')}Previous</button>
      <button class="btn btn-ghost" id="pbq-next" ${act.idx === act.ids.length - 1 ? 'disabled' : ''}>Next${icon('right')}</button></div>
  </section>`;
  const work = (act.work[q.id] ||= {});
  drawQuestion($('pbq-q'), q, work, () => { ctx.save(); main.querySelector(`[data-go="${act.idx}"]`)?.classList.add('done'); });
  const go = (i) => { act.idx = i; ctx.save(); renderRun(main); window.scrollTo({ top: 0 }); };
  main.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.go))));
  $('pbq-prev').addEventListener('click', () => go(act.idx - 1));
  $('pbq-next').addEventListener('click', () => go(act.idx + 1));
  $('pbq-submit').addEventListener('click', async () => {
    const untouched = act.ids.filter((id) => !touched(id)).length;
    const ok = await ctx.confirm('Submit this set?', `<p>${untouched ? `${untouched} task${untouched === 1 ? ' has' : 's have'} no answers yet. ` : ''}You can't change answers after submitting.</p>`, 'Submit', 'Keep working');
    if (ok) submitSet(main, false);
  });
  const tick = () => {
    const left = Math.max(0, Math.round((act.endsAt - Date.now()) / 1000));
    const el = $('pbq-time'); if (el) el.textContent = mmss(left);
    $('pbq-timer')?.classList.toggle('low', left <= 60);
    if (left <= 0) { stopPbq(); submitSet(main, true); }
  };
  tick(); timer = setInterval(tick, 1000);
}

function submitSet(main, timedOut) {
  const s = store(), act = s.active; if (!act || act.result) return;
  stopPbq();
  const scores = {}; let sum = 0;
  for (const id of act.ids) { const sc = scoreQuestion(byId(id), act.work[id]); scores[id] = sc.frac; sum += sc.frac; }
  const elapsed = Math.min(Math.round((Date.now() - act.startedAt) / 1000), Math.round((act.endsAt - act.startedAt) / 1000));
  act.result = { scores, score: sum / act.ids.length, elapsed, timedOut };
  s.history.unshift({ at: Date.now(), score: act.result.score, count: act.ids.length, elapsed });
  s.history = s.history.slice(0, 30);
  for (const id of act.ids) s.best[id] = Math.max(s.best[id] || 0, scores[id]);
  ctx.save(); renderPbq(main, ctx); window.scrollTo({ top: 0 });
  if (timedOut) ctx.toast?.("Time's up. Your set was submitted.");
}

function renderResult(main) {
  const s = store(), act = s.active, r = act.result;
  main.innerHTML = `<section class="stack pbq">
    <div class="panel card-pad stack pbq-result" style="gap:8px">
      <h2 class="home-title">Set complete</h2>
      <p class="pbq-score"><b>${Math.round(r.score * 100)}%</b><span class="muted"> across ${act.ids.length} tasks · ${mmss(r.elapsed)}${r.timedOut ? ' · time expired' : ''}</span></p>
      <p class="muted small">Scored with partial credit: each task is worth the same, and each part counts by how many items you got right.</p>
      <div class="pbq-actions"><button class="btn btn-primary" id="pbq-again">New set</button><button class="btn btn-ghost" id="pbq-done">Back to PBQs</button></div>
    </div>
    ${act.ids.map((id) => reviewBlock(byId(id), act.work[id])).join('')}
  </section>`;
  $('pbq-again').addEventListener('click', () => { s.active = null; ctx.save(); renderPbq(main, ctx); $('pbq-start')?.click(); });
  $('pbq-done').addEventListener('click', () => { s.active = null; ctx.save(); renderPbq(main, ctx); window.scrollTo({ top: 0 }); });
}

// ── Single question ──────────────────────────────────────────────────────────
function renderSingle(main) {
  const s = store(), one = s.single, q = byId(one.id);
  if (!q) { s.single = null; ctx.save(); return renderHome(main); }
  main.innerHTML = `<section class="stack pbq">
    <div><button class="btn btn-ghost btn-sm" id="pbq-back">${icon('left')}All tasks</button></div>
    <div id="pbq-q" class="stack"></div>
    <div class="pbq-actions"><button class="btn btn-primary" id="pbq-check">Check my work</button><button class="btn btn-ghost" id="pbq-reset">Start over</button></div>
    <div id="pbq-fb" role="status" aria-live="polite"></div>
  </section>`;
  drawQuestion($('pbq-q'), q, one.work, () => { ctx.save(); if (one.checked) { one.checked = false; $('pbq-fb').innerHTML = ''; } });
  $('pbq-back').addEventListener('click', () => { s.single = null; ctx.save(); renderPbq(main, ctx); window.scrollTo({ top: 0 }); });
  $('pbq-reset').addEventListener('click', () => { one.work = {}; one.checked = false; ctx.save(); renderSingle(main); });
  const show = () => {
    const sc = scoreQuestion(q, one.work);
    s.best[q.id] = Math.max(s.best[q.id] || 0, sc.frac);
    one.checked = true; ctx.save();
    $('pbq-fb').innerHTML = `<p class="${sc.frac === 1 ? 'trainer-ok' : 'trainer-bad'}">${icon(sc.frac === 1 ? 'check' : 'x')}${sc.frac === 1 ? 'All correct.' : `${sc.got} of ${sc.total} correct. Adjust and check again, or open the answers below.`}</p>${reviewBlock(q, one.work)}`;
  };
  $('pbq-check').addEventListener('click', show);
}
