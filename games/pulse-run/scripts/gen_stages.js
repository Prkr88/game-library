// Generates bot-verified hard stages 11-14. Usage: node scripts/gen_stages.js
const bot = require('./bot.js');
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const defs=[['Overclock',565,.24,26,11],['Meltdown',600,.23,30,12],['Event Horizon',640,.22,34,13],['Pulse Zero',690,.21,38,14]];
const out=[];
for(const [name,speed,gapSec,n,seed] of defs){
  for(let attempt=0;attempt<4000;attempt++){
    const r=rng(seed*1000+attempt),items=[];let x=380,prev=null;
    for(let i=0;i<n;i++){
      let k=['low','high','gap'][Math.floor(r()*3)];if(k===prev&&r()<.6)k=['low','high','gap'][Math.floor(r()*3)];
      items.push([k,Math.round(x)]);prev=k;
      x+=speed*(gapSec+r()*.07);
      if(i%7===5){items.push(['coin',Math.round(x-speed*.1)])}
    }
    items.push(['finish',Math.round(x+360)]);
    const st={name,speed,items};
    if(bot.solve(st)){out.push(st);console.error(name,'attempt',attempt);break}
  }
}
console.log(out.map(s=>` ,${JSON.stringify({name:s.name,speed:s.speed,items:s.items})}`).join('\n'));
