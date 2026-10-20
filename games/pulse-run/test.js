const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const root = __dirname;
const main = fs.readFileSync(`${root}/src/main.js`, 'utf8');
const logicSource = fs.readFileSync(`${root}/src/logic.js`, 'utf8');

assert.equal((main.match(/function readArray\(/g) || []).length, 1, 'save helper must have one shared definition');
assert.equal((main.match(/const readArray\(/g) || []).length, 0, 'save helper must not be closure-local');
assert.match(main, /normalizeResume\(saved\)/, 'resume normalization must remain wired');
assert.match(main, /localStorage\.setItem\(resumeKey/, 'active runs must persist resume state');
for (let i = 1; i <= 6; i++) assert.match(main, new RegExp(`runner-run-${i}\\.png`), `run frame ${i} must load`);
assert.match(main, /runFrame=\(p\.runFrame\+1\)%6/, 'grounded run must advance animation frames');
assert.match(main, /runner-run-\$\{\(p\.runFrame\|\|0\)\+1\}/, 'renderer must select current run frame');

const storage = new Map();
const sandbox = { localStorage: { getItem: key => storage.get(key) ?? null } };
vm.runInNewContext(main.slice(main.indexOf('function readArray'), main.indexOf('\n\n(()=>{')), sandbox);
assert.deepEqual(Array.from(sandbox.readArray('missing')), []);
storage.set('pulseStars', JSON.stringify([2, 3]));
assert.deepEqual(Array.from(sandbox.readArray('pulseStars')), [2, 3]);
storage.set('pulseStars', '{bad');
assert.deepEqual(Array.from(sandbox.readArray('pulseStars')), []);
storage.set('pulseStars', JSON.stringify({ bad: true }));
assert.deepEqual(Array.from(sandbox.readArray('pulseStars')), []);

const logicSandbox = { window: {} };
vm.runInNewContext(logicSource, logicSandbox);
const logic = logicSandbox.window.PulseLogic;
assert.equal(logic.stages.length, 14);
assert.equal(logic.stageUnlocked(0, 0), true);
assert.equal(logic.stageUnlocked(1, 0), false);
assert.equal(logic.stageUnlocked(1, 1), true);
assert.equal(logic.progress(logic.stages[0], 1300), 50);
assert.equal(logic.paceFeedback(9, 10), '1.0s AHEAD');
assert.equal(logic.cueUrgency(60), 'NOW');
assert.equal(logic.cueUrgency(120), 'READY');
 assert.equal(logic.cueUrgency(240), 'FAR');
assert.equal(logic.coreHit(100, {x: 100, y: 150, air: false}), false, 'grounded runner must miss airborne core');
assert.equal(logic.coreHit(100, {x: 100, y: 150, air: true}), true, 'jumping runner can collect aligned core');
assert.equal(logic.coreHit(100, {x: 100, y: 225, air: true}), false, 'short jump below core height must miss core');
assert.equal(logic.coreHit(100, {x: 70, y: 150, air: true}), false, 'runner must overlap core horizontally');
assert.match(main, /PulseLogic\.coreHit\(i\[1\],p,Math\.max\(28,s\.speed\*dt\+18\)\)/, 'runtime must use vertical core collision');

const bot = require('./scripts/bot.js');
logic.stages.forEach((st, i) => assert.equal(bot.solve(st), true, `stage ${i + 1} must be clearable`));
assert.match(main, /best<PulseLogic\.stages\.length/, 'play button must follow stage count');
assert.equal(logic.endlessSpeed(0), 300);
assert.equal(logic.endlessSpeed(1e9), 620, 'endless speed capped');
assert.ok(logic.endlessGap(0) > logic.endlessGap(40000), 'endless gaps tighten');
assert.equal(logic.endlessGap(1e9), 0.3);
const es = logic.endlessStage(7); logic.endlessExtend(es, 5000);
assert.ok(es.items.length > 10 && es.items[es.items.length - 1][1] >= 4000, 'endless extends');
assert.match(main, /startEndless/, 'endless mode wired');
require('child_process').execFileSync('node', [`${root}/scripts/endless_check.js`], { stdio: 'inherit' });
console.log('Pulse Run regression checks passed');
