// Builds dist/index.html: one self-contained file from content/ + src/. No dependencies.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const dir = path.join(root, 'content/modules');
const modules = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const endpoints = JSON.parse(read('content/endpoints.json'));
const safe = JSON.stringify({ modules, endpoints }).replace(/</g, '\\u003c');
const html = read('src/index.template.html')
  .replace('/*STYLES*/', () => read('src/styles.css'))
  .replace('/*CONTENT*/null', () => safe)
  .replace('/*APP*/', () => read('src/app.js'));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
console.log('Built dist/index.html (' + Math.round(html.length / 1024) + ' KB, ' + modules.length + ' modules)');
