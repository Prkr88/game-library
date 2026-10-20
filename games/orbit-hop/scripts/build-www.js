// Copies only shippable web files into www/ so Capacitor does not bundle tests, art sources or docs.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.json', 'privacy.html', 'sw.js']) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, 'src'), path.join(out, 'src'), { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
fs.cpSync(path.join(root, 'icons'), path.join(out, 'icons'), { recursive: true });
console.log('www built: index.html, manifest.json, src/, assets/');
