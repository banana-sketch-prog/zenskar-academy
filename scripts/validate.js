// Checks content files so a typo cannot break the site. Exits 1 on any error.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dir = path.join(root, 'content/modules');
const errs = []; const keys = new Set();
const need = (c, m, msg) => { if (!c) errs.push(m + ': ' + msg); };
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
  let m; try { m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { errs.push(f + ': invalid JSON (' + e.message + ')'); continue; }
  need(m.key && !keys.has(m.key), f, 'key missing or duplicated'); keys.add(m.key);
  for (const k of ['name', 'group', 'description']) need(typeof m[k] == 'string' && m[k], f, k + ' missing');
  need(m.review && ['draft', 'reviewed'].includes(m.review.status), f, 'review.status must be draft or reviewed');
  if (m.review && m.review.status == 'reviewed') need(m.review.reviewedBy && m.review.date, f, 'reviewed modules need reviewedBy and date');
  need(Array.isArray(m.takeaways) && m.takeaways.length, f, 'takeaways missing');
  need(m.learn && Array.isArray(m.learn.subs) && m.learn.subs.length, f, 'learn.subs missing');
  (m.learn.subs || []).forEach(s => (s.cards || []).forEach(c => need(c.title && c.body, f, 'card needs title and body: ' + JSON.stringify(c.title))));
  need(Array.isArray(m.edgeCases) && m.edgeCases.length, f, 'edgeCases missing');
  need(Array.isArray(m.quiz) && m.quiz.length >= 4, f, 'quiz needs at least 4 questions');
  (m.quiz || []).forEach((q, i) => need(Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && q.explanation, f, 'quiz #' + (i + 1) + ' invalid (answer is a 0-based index into options)'));
  need(Array.isArray(m.qa) && m.qa.length >= 20, f, 'qa needs at least 20 questions (has ' + (m.qa || []).length + ')');
  (m.qa || []).forEach((q, i) => need(['Difference', 'Use case', 'Edge case', 'How it works'].includes(q.type) && q.question && q.answer, f, 'qa #' + (i + 1) + ' needs a valid type, question and answer'));
  need(m.api && Array.isArray(m.api.groups), f, 'api.groups missing');
  if (m.widget) need(['pricing-calculator', 'invoice-date-calculator', 'journal-walkthrough'].includes(m.widget), f, 'unknown widget ' + m.widget);
}
const ep = JSON.parse(fs.readFileSync(path.join(root, 'content/endpoints.json'), 'utf8'));
for (const [k, s] of Object.entries(ep.sets)) for (const g of s.groups) for (const e of g.endpoints) need(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(e.method) && e.path.startsWith('/'), 'endpoints.' + k, 'bad endpoint ' + e.method + ' ' + e.path);
for (const m of fs.readdirSync(dir).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))) if (m.api.endpointSet) need(ep.sets[m.api.endpointSet], m.key, 'endpointSet ' + m.api.endpointSet + ' not in endpoints.json');
if (errs.length) { console.error(errs.map(e => ' - ' + e).join('\n')); process.exit(1); }
console.log('Content OK: ' + keys.size + ' modules');
