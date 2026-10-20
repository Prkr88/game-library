// Verifies endless generator output is clearable at sampled speeds/gaps. Usage: node scripts/endless_check.js
const fs = require('node:fs'), vm = require('node:vm'), bot = require('./bot.js');
const sb = { window: {} };
vm.runInNewContext(fs.readFileSync(`${__dirname}/../src/logic.js`, 'utf8'), sb);
const L = sb.window.PulseLogic;
let bad = 0, total = 0;
for (const x0 of [0, 4000, 10000, 20000, 30000, 45000]) {
  for (let seed = 1; seed <= 12; seed++) {
    const v = L.endlessSpeed(x0);
    const st = L.endlessStage(seed); st.cursor = x0 + 420;
    L.endlessExtend(st, x0 + 420 + v * 14, () => v);
    const items = st.items.map(([k, p]) => [k, p - x0]);
    items.push(['finish', items[items.length - 1][1] + 360]);
    total++;
    if (!bot.solve({ speed: v, items })) { bad++; console.log('UNCLEARABLE', x0, seed); }
  }
}
console.log(`${total - bad}/${total} clearable`);
process.exit(bad ? 1 : 0);
