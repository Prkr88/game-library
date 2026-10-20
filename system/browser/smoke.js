// Browser smoke test: node system/browser/smoke.js <slug> [out.png]
// Loads the game in headless Chrome, clicks the first visible start button, plays 3s, screenshots.
// Exit 1 on any page error / failed request / blank canvas.
const p = require('puppeteer-core'), fs = require('fs'), path = require('path'), http = require('http');
const CHROME = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
const [slug, out] = process.argv.slice(2), root = path.resolve(__dirname, '../../games', slug || '');
if (!slug || !fs.existsSync(root)) { console.error('usage: smoke.js <slug> [out.png]'); process.exit(2); }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  const errs = [], missing = [], b = await p.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage(); await pg.setViewport({ width: 900, height: 500, isMobile: true, hasTouch: true });
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errs.push('console: ' + m.text()));
  // 404 on assets/*.png = optional owner art not added yet (game falls back) -> info only
  pg.on('response', r => r.status() >= 400 && (/\/assets\/[^/]+\.png$|favicon\.ico$/.test(r.url()) ? missing.push(r.url().split('/').pop()) : errs.push(`HTTP ${r.status()} ${r.url()}`)));
  await pg.goto(`http://localhost:${srv.address().port}/index.html`, { waitUntil: 'networkidle0' }).catch(e => errs.push(String(e)));
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => b.offsetParent && /play|start|continue|tap/i.test(b.textContent)); b && b.click(); });
  await new Promise(r => setTimeout(r, 3000));
  const blank = await pg.evaluate(() => { const c = document.querySelector('canvas'); if (!c) return false;
    try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = new Set(); for (let i = 0; i < d.length; i += 4000) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size < 4; } catch (e) { return false; } });
  if (blank) errs.push('canvas looks blank (fewer than 4 colours)');
  await pg.screenshot({ path: out || path.join(root, 'smoke.png') });
  await b.close(); srv.close();
  const uniq = [...new Set(errs)];
  console.log(uniq.length ? 'FAIL\n' + uniq.slice(0, 20).join('\n') : 'OK', '- screenshot:', out || path.join(root, 'smoke.png'));
  if (missing.length) console.log('info: owner art not provided yet (fallback used):', missing.length, 'files');
  process.exit(uniq.length ? 1 : 0);
});
