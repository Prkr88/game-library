// Store screenshots: node scripts/shots.js  ->  assets/store/shot-*.png (1290x2796 portrait)
const p = require('../../../system/browser/node_modules/puppeteer-core'), fs = require('fs'), path = require('path'), http = require('http');
const CHROME = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(fs.existsSync);
const root = path.resolve(__dirname, '..'), out = path.join(root, 'assets/store');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0, async () => {
  const b = await p.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const url = `http://localhost:${srv.address().port}/index.html`;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const click = id => pg.evaluate(i => document.getElementById(i).click(), id);
  const shot = n => pg.screenshot({ path: path.join(out, n + '.png') });
  await pg.goto(url, { waitUntil: 'networkidle0' });
  await wait(800); await shot('shot-menu');
  await click('btnShop'); await wait(500); await shot('shot-skins'); await click('btnShopBack');
  await click('btnMissions'); await wait(500); await shot('shot-missions'); await click('btnMissionsBack');
  await click('btnAch'); await wait(500); await shot('shot-achievements'); await click('btnAchBack');
  await click('btnPlay'); await wait(600);
  for (let i = 0; i < 7; i++) { await pg.mouse.click(215, 500); await wait(1100); }
  await shot('shot-play');
  await b.close(); srv.close();
});
