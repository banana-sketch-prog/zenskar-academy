// Zenskar Academy renderer. Content comes from window.ACADEMY (built from /content).
const A = window.ACADEMY;
const MODS = A.modules, EP = A.endpoints;
const BY = Object.fromEntries(MODS.map(m => [m.key, m]));
const $ = s => document.querySelector(s);
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const el = h => { const d = document.createElement('div'); d.innerHTML = h; return d; };
let done = {};
try { done = JSON.parse(localStorage.getItem('za') || '{}'); } catch (e) {}
const save = () => { try { localStorage.setItem('za', JSON.stringify(done)); } catch (e) {} };

/* ---------- widgets ---------- */
const TIERS = [{ f: 1, t: 100, r: 100, fl: 1000 }, { f: 101, t: 200, r: 90, fl: 500 }, { f: 201, t: 1e9, r: 80, fl: 250 }];
const MODELS = { unit: 'Per unit', tiered: 'Tiered (graduated)', volume: 'Volume', tflat: 'Tiered with flat fee', vflat: 'Volume with flat fee', pkg: 'Package (50 per package)' };
function calc(m, q) {
  const L = []; let tot = 0;
  if (m == 'unit') { tot = q * 100; L.push(q + ' × $100'); }
  if (m == 'tiered' || m == 'tflat') TIERS.forEach((x, i) => {
    const u = Math.max(0, Math.min(q, x.t) - x.f + 1);
    if (u > 0) { const c = u * x.r + (m == 'tflat' ? x.fl : 0); tot += c; L.push('Tier ' + (i + 1) + ': ' + u + ' × $' + x.r + (m == 'tflat' ? ' + $' + x.fl + ' flat' : '') + ' = ' + money(c)); }
  });
  if (m == 'volume' || m == 'vflat') {
    const t = TIERS.find(x => q >= x.f && q <= x.t);
    if (t) { tot = q * t.r + (m == 'vflat' ? t.fl : 0); L.push('Quantity lands in tier ' + (TIERS.indexOf(t) + 1) + ', so all ' + q + ' units × $' + t.r + (m == 'vflat' ? ' + $' + t.fl + ' flat' : '')); }
  }
  if (m == 'pkg') { const p = Math.ceil(q / 50); tot = p * 4500; L.push(q + ' units ÷ 50 = ' + p + ' package(s) (rounded up) × $4,500'); }
  return { tot, L };
}
function pricingCalculator() {
  const w = el(`<p>Same usage, different model. Tiers: 1–100 at $100, 101–200 at $90, 201+ at $80. Flat fees (where used): $1,000 / $500 / $250.</p><label for=m>Pricing model</label><select id=m>${Object.keys(MODELS).map(k => '<option value=' + k + '>' + MODELS[k] + '</option>').join('')}</select><label for=q>Quantity</label><input id=q type=number min=0 value=250><div class=card style="margin-top:14px"><div class=total id=tt></div><div id=ll></div></div>`);
  const u = () => { const r = calc(w.querySelector('#m').value, +w.querySelector('#q').value || 0); w.querySelector('#tt').textContent = money(r.tot); w.querySelector('#ll').innerHTML = r.L.map(x => '<div>' + x + '</div>').join(''); };
  w.querySelectorAll('input,select').forEach(x => x.oninput = u); u(); return w;
}
function pin(ref, off, mode) { const d = new Date(ref + 'T00:00:00'); const y = d.getFullYear(), m = d.getMonth() + off, last = new Date(y, m + 1, 0).getDate(), day = mode == 'last' ? last : Math.min(d.getDate(), last); return new Date(y, m, day); }
function invoiceDateCalculator() {
  const w = el(`<p>Invoice date calculator (organization-level rule, three steps: reference date, offset, day pinning).</p><label for=d>Reference date (e.g. Bill For Date)</label><input id=d type=date value=2026-03-01><label for=o>Offset in months (negative = before)</label><input id=o type=number value=1><label for=p>Day pinning</label><select id=p><option value=last>Last day of that month</option><option value=same>Same day as reference date</option></select><div class=card style="margin-top:14px"><div class=total id=r></div><div id=s></div></div>`);
  const u = () => { const d = w.querySelector('#d').value; if (!d) return; const o = +w.querySelector('#o').value || 0, p = w.querySelector('#p').value, x = pin(d, o, p);
    w.querySelector('#r').textContent = x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    w.querySelector('#s').innerHTML = '1. Reference: ' + d + '<br>2. Offset: ' + (o >= 0 ? '+' : '') + o + ' month(s)<br>3. Pin: ' + (p == 'last' ? 'last day of the month' : 'same day number (clamped to month length)'); };
  w.querySelectorAll('input,select').forEach(x => x.oninput = u); u(); return w;
}
const WIDGETS = { 'pricing-calculator': pricingCalculator, 'invoice-date-calculator': invoiceDateCalculator };

/* ---------- building blocks ---------- */
const card = c => `<div class="card"><h3>${c.title}</h3>${c.body || ''}${c.example ? `<div class="ex"><b>Example:</b> ${c.example}</div>` : ''}</div>`;
function tabs(names, fn) {
  const w = document.createElement('div'), bar = document.createElement('div'), body = document.createElement('div'); bar.className = 'tabs';
  names.forEach((n, i) => { const b = document.createElement('button'); b.textContent = n;
    b.onclick = () => { [...bar.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); body.innerHTML = ''; body.appendChild(fn(n, i)); };
    bar.appendChild(b); });
  w.append(bar, body); bar.children[0].click(); return w;
}
function quiz(id, qs) {
  let s = 0, n = 0; const h = document.createElement('div'); const sc = document.createElement('div'); sc.className = 'total';
  qs.forEach((q, i) => {
    const c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<b>' + (i + 1) + '. ' + q.question + '</b>'; let a = false;
    q.options.forEach((o, j) => { const b = document.createElement('button'); b.className = 'opt'; b.textContent = o;
      b.onclick = () => { if (a) return; a = true; n++; const ok = j == q.answer; if (ok) s++; b.classList.add(ok ? 'ok' : 'no'); if (!ok) c.querySelectorAll('.opt')[q.answer].classList.add('ok');
        const e = document.createElement('p'); e.innerHTML = (ok ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + q.explanation; c.appendChild(e);
        if (n == qs.length) { sc.textContent = 'Score: ' + s + ' / ' + qs.length; done[id] = s + '/' + qs.length; save(); renderNav(); } };
      c.appendChild(b); });
    h.appendChild(c); });
  h.appendChild(sc); return h;
}
function qaView(m) {
  const L = m.qa, cats = ['All', 'Difference', 'Use case', 'Edge case', 'How it works'];
  const w = document.createElement('div'), bar = document.createElement('div'), box = document.createElement('div'); bar.className = 'tabs';
  const draw = c => { box.innerHTML = L.filter(x => c == 'All' || x.type == c).map(x => `<details><summary><span class="tag" style="margin:0 8px 0 0">${x.type}</span>${x.question}</summary><p>${x.answer}</p></details>`).join('');
    [...bar.children].forEach(b => b.classList.toggle('on', b.dataset.c == c)); };
  cats.forEach(c => { const b = document.createElement('button'); b.dataset.c = c; b.textContent = c + ' (' + (c == 'All' ? L.length : L.filter(x => x.type == c).length) + ')'; b.onclick = () => draw(c); bar.appendChild(b); });
  w.append(bar, box); draw('All'); return w;
}

/* ---------- endpoints and Postman ---------- */
const EPL = [];
const hdr = m => `-H 'x-api-key: $API_KEY' -H 'organisation: $ORG_ID'` + (m == 'GET' || m == 'DELETE' ? '' : ` -H 'Content-Type: application/json'`);
const curlOf = e => `curl --request ${e.method} 'https://api.zenskar.com${e.path.replace(/\{(\w+)\}/g, '<$1>')}' ${hdr(e.method)}` + (e.body ? ` --data '${JSON.stringify(e.body, null, 2)}'` : '');
function fb(t, done) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); done(); }
function copyTxt(t, btn) { const done = () => { if (btn) { const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => btn.textContent = o, 1200); } }; try { navigator.clipboard.writeText(t).then(done, () => fb(t, done)); } catch (e) { fb(t, done); } }
window.cpc = (i, b) => copyTxt(curlOf(EPL[i]), b);
window.cpb = (i, b) => copyTxt(JSON.stringify(EPL[i].body, null, 2), b);
function epCard(e) {
  const i = EPL.push(e) - 1;
  return `<div class="card"><div><span class="tag" style="margin:0 8px 0 0">${e.method}</span><code>{{base_url}}${e.path}</code></div><p style="margin:6px 0">${e.description}</p>${e.body ? `<pre class="code">${JSON.stringify(e.body, null, 2).replace(/</g, '&lt;')}</pre>` : ''}<button class="opt" style="display:inline-block;width:auto;margin-right:8px" onclick="cpc(${i},this)">Copy curl</button>${e.body ? `<button class="opt" style="display:inline-block;width:auto" onclick="cpb(${i},this)">Copy body</button>` : ''}</div>`;
}
function epSection(k) {
  const s = EP.sets[k]; if (!s) return '';
  return `<h3 id="ep-${k}">${s.title}</h3>${s.note ? `<div class="note">${s.note}</div>` : ''}` + s.groups.map(g => `<h4>${g.title}</h4>` + g.endpoints.map(epCard).join('')).join('') + `<p class="draft">Also in the reference (paths not confirmed here): ${s.more.join('; ')}.</p>`;
}
function collection() {
  const toP = p => p.replace(/\{(\w+)\}/g, ':$1');
  const item = Object.keys(EP.sets).map(k => ({ name: EP.sets[k].title, item: EP.sets[k].groups.flatMap(g => g.endpoints).map(e => {
    const path = toP(e.path).split('?')[0], q = e.path.split('?')[1]; const vars = [...e.path.matchAll(/\{(\w+)\}/g)].map(m => ({ key: m[1], value: '' }));
    return { name: e.method + ' ' + e.path.split('?')[0], request: { method: e.method, header: [{ key: 'x-api-key', value: '{{api_key}}' }, { key: 'organisation', value: '{{org_id}}' }, ...(e.body ? [{ key: 'Content-Type', value: 'application/json' }] : [])],
      url: { raw: '{{base_url}}' + path + (q ? '?' + q : ''), host: ['{{base_url}}'], path: path.split('/').filter(Boolean), variable: vars, ...(q ? { query: [{ key: q.split('=')[0], value: q.split('=')[1] }] } : {}) },
      ...(e.body ? { body: { mode: 'raw', raw: JSON.stringify(e.body, null, 2), options: { raw: { language: 'json' } } } } : {}), description: e.description } }; }) }));
  return { info: { name: 'Zenskar API (from Zenskar Academy)', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, variable: [{ key: 'base_url', value: 'https://api.zenskar.com' }, { key: 'api_key', value: '' }, { key: 'org_id', value: '' }], item };
}
window.pm = k => { go('postman'); setTimeout(() => { const e = document.getElementById('ep-' + k); if (e) e.scrollIntoView({ behavior: 'smooth' }); }, 0); };
window.jump = j => { document.querySelector('.tabs button').click(); setTimeout(() => { const e = document.getElementById('s' + j); if (e) e.scrollIntoView({ behavior: 'smooth' }); }, 0); };

/* ---------- views ---------- */
function reviewBadge(m) {
  const r = m.review || {}; const ok = r.status == 'reviewed';
  return `<div class="review ${ok ? 'reviewed' : 'draft'}">${ok ? 'Reviewed by ' + (r.reviewedBy || 'SME') + (r.date ? ' on ' + r.date : '') : 'Draft: not yet reviewed by a Zenskar SME'}</div>`;
}
function moduleView(m) {
  const w = el('<h2>' + m.name + '</h2>' + reviewBadge(m));
  const names = ['Learn']; if (m.widget) names.push('Try it'); names.push('Edge cases', 'API', 'Quiz', 'Q&A');
  w.appendChild(tabs(names, n => {
    if (n == 'Learn') return el((m.learn.intro ? '<p>' + m.learn.intro + '</p>' : '') + m.learn.subs.map((s, j) => `<h3 id="s${j}">${s.title}</h3><div class="grid">${s.cards.map(card).join('')}</div>`).join('') + (m.learn.outro ? `<div class="note">${m.learn.outro}</div>` : ''));
    if (n == 'Try it') return WIDGETS[m.widget]();
    if (n == 'Edge cases') return el(m.edgeCases.map(t => `<div class="edge">${t}</div>`).join('') + '<p class=draft>Draft from public docs; confirm with a product SME.</p>');
    if (n == 'API') return el((m.api.endpointSet ? `<div class="note">Test these in Postman. Open the full <button class=opt style="display:inline-block;width:auto" onclick="pm('${m.api.endpointSet}')">Postman page</button> for the importable collection.</div>` + epSection(m.api.endpointSet) : '') + '<h3>All operations in the reference</h3><p>Operations from the Zenskar API reference. Authenticate with the x-api-key header.</p>' + m.api.groups.map(g => `<div class="card"><h3>${g.title}</h3>${g.items.map(x => '<div>' + x + '</div>').join('')}</div>`).join('') + (m.api.note ? `<div class="note">${m.api.note}</div>` : ''));
    if (n == 'Quiz') return quiz(m.key, m.quiz);
    return qaView(m);
  }));
  return w;
}
function postmanView() {
  const w = el('<h2>API for Postman</h2>' + EP.setup); const c = JSON.stringify(collection(), null, 2);
  const d = el('<div class=card><h3>Postman collection</h3><p>Copy this JSON, then in Postman choose Import and paste it as Raw text. It creates one folder per module with every request below, using the variables base_url, api_key and org_id.</p><textarea class=col readonly id=pmj></textarea><br><br><button class=opt style="display:inline-block;width:auto" id=pmb>Copy collection JSON</button></div>');
  d.querySelector('#pmj').value = c; d.querySelector('#pmb').onclick = function () { copyTxt(c, this); };
  w.appendChild(d); w.appendChild(el(Object.keys(EP.sets).map(epSection).join(''))); return w;
}
function homeView() {
  return el(`<h2>Welcome to Zenskar Academy</h2><p>Short lessons, examples, edge cases, API details and a quiz for every topic. ${MODS.length} modules are live.</p><div class="grid">` + MODS.map(m => `<div class="card"><h3>${m.name}</h3>${m.description}<br><br><button class="opt" onclick="go('${m.key}')">Start</button></div>`).join('') + '</div>');
}
function rail(k) {
  const m = BY[k]; const idx = MODS.findIndex(x => x.key == k); const nxt = k == 'postman' ? 'home' : (MODS[idx + 1] ? MODS[idx + 1].key : 'postman');
  const nm = x => x == 'home' ? 'Back to home' : x == 'postman' ? 'API for Postman' : BY[x].name;
  let h = `<div class="card"><h3>${k == 'home' ? 'Suggested order' : 'Key takeaways'}</h3>${k == 'home' ? '<ol>' + MODS.map(x => '<li>' + x.name + '</li>').join('') + '</ol>' : '<ul>' + (m ? m.takeaways : ['Two headers on every call: x-api-key and organisation', 'Usage definitions live at /rawmetrics, events at /usage/{api_slug}', 'V3 organizations use /v3/products']).map(x => '<li>' + x + '</li>').join('') + '</ul>'}</div>`;
  if (m) h += `<div class="card"><h3>In this module</h3>${m.learn.subs.map((s, j) => `<button class="opt" onclick="jump(${j})">${s.title}</button>`).join('')}</div>`;
  if (m && m.api.endpointSet) h += `<div class="card"><h3>Postman</h3><button class="opt" onclick="pm('${m.api.endpointSet}')">Endpoints for this module</button></div>`;
  if (m) h += `<div class="card"><h3>API reference</h3>${m.api.groups.flatMap(g => g.items).slice(0, 8).map(x => '<div>' + x + '</div>').join('')}</div>`;
  h += `<div class="card"><h3>Quiz scores</h3><table>${MODS.map(x => '<tr><td>' + x.name + '</td><td>' + (done[x.key] || 'not taken') + '</td></tr>').join('')}</table></div><div class="card"><h3>Up next</h3><button class="opt" onclick="go('${nxt}')">${nm(nxt)}</button></div>`;
  return h;
}
let cur = 'home';
function renderNav() {
  const b = k => `<button class="${cur == k ? 'on' : ''}" onclick="go('${k}')">${BY[k].name}${done[k] ? '<span class=tag>' + done[k] + '</span>' : ''}</button>`;
  const groups = [...new Set(MODS.map(m => m.group))];
  $('#nav').innerHTML = `<button class="${cur == 'home' ? 'on' : ''}" onclick="go('home')">Home</button>` + groups.map(g => `<h3>${g}</h3>` + MODS.filter(m => m.group == g).map(m => b(m.key)).join('') + (g == 'Platform' ? `<button class="${cur == 'postman' ? 'on' : ''}" onclick="go('postman')">API for Postman</button>` : '')).join('');
}
window.go = (k, fromHash) => {
  if (k != 'home' && k != 'postman' && !BY[k]) k = 'home';
  cur = k; EPL.length = 0;
  const m = $('#main'); m.innerHTML = '<div class=cols><div id=bd></div><div class=rail id=rl></div></div>';
  $('#bd').appendChild(k == 'home' ? homeView() : k == 'postman' ? postmanView() : moduleView(BY[k]));
  $('#rl').innerHTML = rail(k); renderNav(); window.scrollTo(0, 0);
  if (!fromHash) { try { history.replaceState(null, '', '#/' + k); } catch (e) {} }
};
window.addEventListener('hashchange', () => go(location.hash.replace('#/', '') || 'home', true));
go(location.hash.replace('#/', '') || 'home', true);
