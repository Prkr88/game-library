// Headless-browser UI test: node scripts/ui-test.js  (needs system/browser puppeteer-core + Chrome)
const path = require('path'), fs = require('fs'), http = require('http');
const p = require(path.resolve(__dirname, '../../../system/browser/node_modules/puppeteer-core'));
const CHROME = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(fs.existsSync);
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  const fails = [], errs = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  const b = await p.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const pg = await b.newPage(); await pg.setViewport({ width: 420, height: 800, isMobile: true, hasTouch: true });
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(`http://localhost:${srv.address().port}/index.html`, { waitUntil: 'networkidle0' });
    const vis = id => pg.evaluate(i => { const e = document.getElementById(i); return !!e && !e.classList.contains('hidden') && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0; }, id);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    ok(await vis('menu'), 'menu visible on load');
    await pg.click('#play'); await wait(500);
    ok(!(await vis('menu')), 'menu hides after PLAY');
    const n0 = await pg.evaluate(() => window.__merge.state.grid.flat().filter(Boolean).length);
    await pg.keyboard.press('3'); await wait(1500);
    const n1 = await pg.evaluate(() => window.__merge.state.grid.flat().filter(Boolean).length);
    ok(n1 > n0, `tile dropped (tiles ${n0} -> ${n1})`);
    await pg.keyboard.press('Escape'); await wait(300);
    ok(await vis('pause-panel'), 'Escape opens pause panel');
    await pg.keyboard.press('Escape'); await wait(300);
    ok(!(await vis('pause-panel')), 'Escape closes pause panel');
    ok(errs.length === 0, 'page errors: ' + errs.join('; '));
  } catch (e) { fails.push('exception: ' + e.message); }
  await b.close(); srv.close();
  console.log(fails.length ? 'UI TEST FAIL\n' + fails.join('\n') : 'UI test OK');
  process.exit(fails.length ? 1 : 0);
});
