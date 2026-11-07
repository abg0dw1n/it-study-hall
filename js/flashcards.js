// Flashcards built from the Key terms of Learn modules. A small Leitner scheme: "Got it" moves a card
// up a box (shown again after longer gaps), "Again" sends it back to box 0. Progress is saved with the
// rest of the exam's state, under state.learn.cards[<moduleId>|<term>] = { box, due }.

const esc = (t = '') => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const DAY = 86400000;
const GAPS = [0, 1, 3, 7, 14, 30]; // days until a card in box N is due again
const SESSION = 15;

let keyHandler = null;
export function stopCards() {
  if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
}

export const termKey = (c) => `${c.mod}|${c.t}`;

// cards: [{ mod, t, d, modTitle }]; store: object that persists (state.learn.cards)
export function renderCards(body, { cards, store, save, title }) {
  stopCards();
  const now = () => Date.now();
  const rec = (c) => store[termKey(c)];
  const isNew = (c) => !rec(c);
  const isDue = (c) => rec(c) && rec(c).due <= now();
  const mastered = (c) => rec(c) && rec(c).box >= 3;
  let queue = [], cur = null, flipped = false, done = 0, again = 0;

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const build = (all) => {
    const due = shuffle(cards.filter(isDue));
    const fresh = shuffle(cards.filter(isNew));
    const pool = all ? shuffle([...cards]) : [...due, ...fresh];
    return pool.slice(0, SESSION);
  };
  const stats = () => {
    const m = cards.filter(mastered).length;
    return { total: cards.length, mastered: m, fresh: cards.filter(isNew).length, due: cards.filter(isDue).length };
  };

  function next() { cur = queue.shift() || null; flipped = false; draw(); }

  function grade(ok) {
    if (!cur || !flipped) return;
    const k = termKey(cur); const r = store[k] || { box: 0, due: 0 };
    if (ok) { r.box = Math.min(GAPS.length - 1, r.box + 1); done++; }
    else { r.box = 0; again++; queue.push(cur); }
    r.due = now() + GAPS[r.box] * DAY; r.seen = now();
    store[k] = r; save();
    next();
  }

  function flip() { if (!cur) return; flipped = !flipped; draw(); }

  function start(all) { queue = build(all); done = 0; again = 0; if (!queue.length) { cur = null; draw(); return; } next(); }

  function draw() {
    const s = stats();
    const head = `<div class="fc-stats"><span><b>${s.mastered}</b> of ${s.total} learned</span><span><b>${s.due}</b> due</span><span><b>${s.fresh}</b> new</span></div>
      <div class="learn-meter" title="${s.mastered} of ${s.total} learned"><i style="width:${s.total ? (s.mastered / s.total) * 100 : 0}%"></i></div>`;
    if (!cur) {
      const finished = done + again > 0;
      body.innerHTML = `<div class="stack fc"><h3>${esc(title)}</h3>${head}
        <div class="panel card-pad fc-done">
          <h3>${finished ? 'Session complete' : s.total ? 'Nothing due right now' : 'No terms here yet'}</h3>
          <p class="muted">${finished ? `You marked ${done} as "Got it" and ${again} as "Again" this round.` : s.total ? 'Every card is scheduled for later. Study extra cards any time.' : ''}</p>
          <div class="fc-actions">
            ${s.total ? `<button class="btn btn-primary" id="fc-more">${icon('redo')}Study ${Math.min(SESSION, s.total)} more cards</button>` : ''}
            ${s.fresh + s.due ? `<button class="btn btn-ghost" id="fc-due">Due and new only</button>` : ''}
            <button class="btn btn-ghost" id="fc-reset">Reset progress</button>
          </div></div></div>`;
      body.querySelector('#fc-more')?.addEventListener('click', () => start(true));
      body.querySelector('#fc-due')?.addEventListener('click', () => start(false));
      body.querySelector('#fc-reset')?.addEventListener('click', () => { for (const c of cards) delete store[termKey(c)]; save(); queue = []; cur = null; done = 0; again = 0; draw(); });
      return;
    }
    body.innerHTML = `<div class="stack fc"><h3>${esc(title)}</h3>${head}
      <p class="muted small" role="status" aria-live="polite">Card ${done + 1} of ${done + queue.length + 1}${again ? ` · ${again} to repeat` : ''}</p>
      <button class="fc-card ${flipped ? 'flipped' : ''}" id="fc-card" aria-label="${flipped ? 'Definition shown. Press to show the term' : 'Press to show the definition'}">
        ${cur.modTitle ? `<span class="fc-from">${esc(cur.modTitle)}</span>` : ''}
        ${flipped ? `<span class="fc-term fc-term-sm">${esc(cur.t)}</span><span class="fc-label">Definition</span><span class="fc-def">${cur.d}</span>` : `<span class="fc-label">Term</span><span class="fc-term">${esc(cur.t)}</span>`}
        <span class="fc-hint">${flipped ? '' : 'Tap or press Space to flip'}</span>
      </button>
      <div class="fc-actions ${flipped ? '' : 'fc-hidden'}">
        <button class="btn btn-ghost" id="fc-again">${icon('redo')}Again <kbd>1</kbd></button>
        <button class="btn btn-primary" id="fc-got">${icon('check')}Got it <kbd>2</kbd></button>
      </div></div>`;
    body.querySelector('#fc-card').addEventListener('click', flip);
    body.querySelector('#fc-again').addEventListener('click', () => grade(false));
    body.querySelector('#fc-got').addEventListener('click', () => grade(true));
    body.querySelector('#fc-card').focus({ preventScroll: true });
  }

  keyHandler = (e) => {
    if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'Enter') { if (e.target.id === 'fc-card' || e.target === document.body) { e.preventDefault(); flip(); } }
    else if (e.key === '1' || e.key === 'ArrowLeft') grade(false);
    else if (e.key === '2' || e.key === 'ArrowRight') grade(true);
  };
  document.addEventListener('keydown', keyHandler);
  start(false);
}
