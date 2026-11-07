// Sanity-checks question banks: unique ids, valid domains, valid answer index, required fields.
//   node scripts/validate-questions.mjs                 # every exam in exams/index.json
//   node scripts/validate-questions.mjs --exam az-104   # one exam
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => JSON.parse(fs.readFileSync(path.join(root, ...p), 'utf8'));
const args = process.argv.slice(2);
const only = args.includes('--exam') ? args[args.indexOf('--exam') + 1] : null;
const index = read('exams', 'index.json');
let failed = false;

for (const entry of index.filter((e) => !only || e.slug === only)) {
  const exam = read('exams', entry.slug, 'exam.json');
  const questions = read('exams', entry.slug, 'questions.json');
  const errors = [];
  if (exam.slug !== entry.slug) errors.push(`exam.json slug "${exam.slug}" doesn't match folder/index "${entry.slug}"`);
  const ids = new Set();
  const scenarios = new Set();
  for (const q of questions) {
    if (!Number.isInteger(q.id)) errors.push(`Question with non-integer id: ${JSON.stringify(q.id)}`);
    if (ids.has(q.id)) errors.push(`Duplicate id ${q.id}`);
    ids.add(q.id);
    const key = String(q.scenario).replace(/\s+/g, ' ').trim().toLowerCase();
    if (scenarios.has(key)) errors.push(`Q${q.id}: duplicate scenario text`);
    scenarios.add(key);
    if (!exam.domains[q.domain]) errors.push(`Q${q.id}: unknown domain ${q.domain}`);
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`Q${q.id}: needs at least 2 options`);
    else q.options.forEach((o, i) => { if (!o.text) errors.push(`Q${q.id}: option ${i} has no text`); });
    if (!(q.answer >= 0 && q.answer < (q.options?.length || 0))) errors.push(`Q${q.id}: answer index out of range`);
    if (!q.scenario || !q.explanation) errors.push(`Q${q.id}: missing scenario or explanation`);
    if (q.refs !== undefined) {
      if (!Array.isArray(q.refs)) errors.push(`Q${q.id}: refs must be a list`);
      else q.refs.forEach((r, i) => {
        if (!r || !r.title || !/^https:\/\/[^\s"<>]+$/.test(r.url || '')) errors.push(`Q${q.id}: refs[${i}] needs a title and an https url`);
      });
    }
  }
  if (entry.questions != null && entry.questions !== questions.length) {
    errors.push(`index.json says ${entry.questions} questions but the bank has ${questions.length} (run node scripts/stamp-updated.mjs)`);
  }
  // Reference sheets (cheat sheets and the subnetting trainer), if the exam has them.
  if (fs.existsSync(path.join(root, 'exams', entry.slug, 'reference.json'))) {
    const ref = JSON.parse(fs.readFileSync(path.join(root, 'exams', entry.slug, 'reference.json'), 'utf8'));
    const seen = new Set();
    for (const sh of ref.sheets || []) {
      if (!sh.id || !sh.title || seen.has(sh.id) || sh.id === 'trainer') errors.push(`reference: sheet needs a unique title and id (${sh.id})`);
      seen.add(sh.id);
      for (const b of sh.blocks || []) {
        if (b.type === 'table') { for (const r of b.rows) if (r.length !== b.head.length) errors.push(`reference ${sh.id}: "${b.title}" row has ${r.length} cells, header has ${b.head.length}: ${r[0]}`); }
        else if (b.type === 'cmds') { for (const r of b.rows) if (r.length !== 2) errors.push(`reference ${sh.id}: "${b.title}" command rows need [command, meaning]`); }
        else if (b.type === 'list') { if (!b.items?.length) errors.push(`reference ${sh.id}: empty list "${b.title}"`); }
        else if (b.type !== 'note') errors.push(`reference ${sh.id}: unknown block type ${b.type}`);
      }
    }
    if (!(ref.sheets?.length || ref.trainer)) errors.push('reference.json has no sheets and no trainer');
    if (entry.reference != null && entry.reference !== (ref.sheets?.length || 0) + (ref.trainer ? 1 : 0)) errors.push('index.json reference count is stale (run node scripts/stamp-updated.mjs)');
  }
  // Performance-based questions (pbq.json): same activity format as the Labs "tasks" kind.
  if (fs.existsSync(path.join(root, 'exams', entry.slug, 'pbq.json'))) {
    const pbq = JSON.parse(fs.readFileSync(path.join(root, 'exams', entry.slug, 'pbq.json'), 'utf8'));
    const pids = new Set();
    for (const q of pbq.questions || []) {
      const at = `pbq ${q.id}`;
      if (!q.id || pids.has(q.id)) errors.push(`${at}: missing or duplicate id`);
      pids.add(q.id);
      if (!q.title || !q.scenario || !q.explanation) errors.push(`${at}: needs title, scenario and explanation`);
      if (q.domain && !exam.domains[q.domain]) errors.push(`${at}: unknown domain ${q.domain}`);
      if (!q.activities?.length) errors.push(`${at}: no activities`);
      (q.activities || []).forEach((a, i) => {
        const w = `${at} activity ${i + 1}`;
        if (a.type === 'match') {
          if (!a.categories?.length || !a.items?.length) errors.push(`${w}: match needs categories and items`);
          for (const it of a.items || []) if (!it.text || !(it.cat >= 0 && it.cat < (a.categories || []).length)) errors.push(`${w}: bad item ${JSON.stringify(it)}`);
          for (let c = 0; c < (a.categories || []).length; c++) if (!(a.items || []).some((it) => it.cat === c)) errors.push(`${w}: category "${a.categories[c]}" has no items`);
        } else if (a.type === 'order') {
          if ((a.items?.length || 0) < 2) errors.push(`${w}: order needs at least 2 items`);
        } else if (a.type === 'fill') {
          if (!a.rows?.length || a.rows.some((r) => !r.label || !(Array.isArray(r.answer) ? r.answer.length : r.answer))) errors.push(`${w}: fill rows need a label and an answer`);
        } else if (a.type === 'rules') {
          if (!a.tests?.length || a.tests.some((t) => !t.label || !t.packet || !['allow', 'deny'].includes(t.expect))) errors.push(`${w}: rules tests need label, packet, expect allow|deny`);
        } else errors.push(`${w}: unknown type ${a.type}`);
        if (!a.prompt) errors.push(`${w}: missing prompt`);
      });
    }
    if ((pbq.questions || []).length < 3) errors.push('pbq.json needs at least 3 questions');
    if (entry.pbq != null && entry.pbq !== (pbq.questions || []).length) errors.push('index.json pbq count is stale (run node scripts/stamp-updated.mjs)');
  }
  const perDomain = Object.keys(exam.domains).map((d) => `${d}: ${questions.filter((q) => q.domain === d).length}`).join(', ');
  console.log(`${exam.code} (${entry.slug}): ${questions.length} questions (${perDomain})`);
  if (errors.length) { failed = true; console.error('  ' + errors.join('\n  ')); }
}
if (only && !index.some((e) => e.slug === only)) { console.error(`No exam "${only}" in exams/index.json`); failed = true; }
console.log(failed ? 'FAILED' : 'OK');
process.exit(failed ? 1 : 0);
