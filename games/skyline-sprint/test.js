const fs=require('fs');
const assert=require('assert');

const source=fs.readFileSync(`${__dirname}/game.js`,'utf8');
const html=fs.readFileSync(`${__dirname}/index.html`,'utf8');

assert.match(source,/const \$=s=>document\.querySelector\(s\.startsWith\('#'\)\?s:`#\$\{s\}`\)/,
  'selector helper must normalize bare ids');

const boundIds=['startBtn','stageBtn','dailyBtn','overdriveBtn','resumeBtn','menuBtn',
  'overMenuBtn','retryBtn','stagePrev','stageNext','pauseBtn','helpBtn',
  'helpCloseBtn','helpStartBtn','skinBtn','soundBtn','reviveBtn'];
for(const id of boundIds){
  assert.match(html,new RegExp(`id=["']${id}["']`),`missing bound control #${id}`);
  assert.match(source,new RegExp(`\\$\\(['"]${id}['"]\\)`),`missing handler reference #${id}`);
}

assert.match(source,/document\.querySelectorAll\('\[data-action\]'\)/,
  'touch action delegation must remain wired');
assert.match(source,/function persist\(\)\{try\{localStorage\.skylineSprint=JSON\.stringify\(save\);return true\}catch\{return false\}\}/,
  'save writes must survive restricted or full localStorage');
assert.match(source,/const key=e\.key\.toLowerCase\(\);const handled=/,
  'keyboard handler must normalize key case');
assert.match(source,/if\(!handled\)return;e\.preventDefault\(\);/,
  'handled game keys must prevent browser defaults');
assert.match(source,/blocked=stage===0&&!run\.daily&&!run\.overdrive\?2:3/,
  'gates must block multiple lanes so lane-dodging cannot skip jump/slide');
assert.match(source,/run\.next%3===2\)run\.objects\[run\.objects\.length-1\]\.type='wall'/,'wall gates must spawn every third gate from stage 3');
assert.match(source,/o\.type==='wall'\|\|o\.type!==run\.action/,'wall must be lethal regardless of action');
assert.match(require('fs').readFileSync(`${__dirname}/style.css`,'utf8'),/\[hidden\]\{display:none!important\}/,
  'hidden attribute must win over display rules');
console.log(`Skyline selector regression passed: ${boundIds.length} controls + touch delegation.`);

assert.match(source,/function musicTick\(\)/,'procedural music loop must exist');
assert.match(source,/musicTick\(\);draw\(\)/,'music must be driven from frame loop');
console.log('music wiring ok');

const pkg=JSON.parse(fs.readFileSync(`${__dirname}/package.json`,'utf8'));
const cap=JSON.parse(fs.readFileSync(`${__dirname}/capacitor.config.json`,'utf8'));
assert.strictEqual(cap.webDir,'www','capacitor must ship the built www dir only');
assert.ok(pkg.dependencies['@capacitor/core']&&pkg.devDependencies['@capacitor/cli'],'capacitor deps declared');
require('child_process').execFileSync('node',[`${__dirname}/scripts/build-www.js`]);
for(const f of ['index.html','game.js','sw.js','assets/gen/icon.png'])assert.ok(fs.existsSync(`${__dirname}/www/${f}`),`www missing ${f}`);
assert.ok(!fs.existsSync(`${__dirname}/www/test.js`),'tests must not ship');
assert.ok(fs.existsSync(`${__dirname}/STORE.md`),'store listing doc present');
console.log('capacitor packaging ok');
