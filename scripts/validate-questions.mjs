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
  const perDomain = Object.keys(exam.domains).map((d) => `${d}: ${questions.filter((q) => q.domain === d).length}`).join(', ');
  console.log(`${exam.code} (${entry.slug}): ${questions.length} questions (${perDomain})`);
  if (errors.length) { failed = true; console.error('  ' + errors.join('\n  ')); }
}
if (only && !index.some((e) => e.slug === only)) { console.error(`No exam "${only}" in exams/index.json`); failed = true; }
console.log(failed ? 'FAILED' : 'OK');
process.exit(failed ? 1 : 0);
