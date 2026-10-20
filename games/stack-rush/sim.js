// Difficulty sim: bot taps with timing noise (sigma seconds). Reports avg score per skill.
const L=require('./src/logic.js');
function run(sigma,seed,hard){let r=seed;const rnd=()=>(r=(r*1664525+1013904223)%4294967296)/4294967296;
 const g=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return (u-3)/Math.sqrt(0.5)};
 const s=L.create(1,hard);let t=0;
 while(!s.over&&s.score<300){const top=s.blocks[s.blocks.length-1];const sp=L.speed(s.score,hard);
  // aim for top.x with timing error -> position error ~ sigma*speed*range*... (vel up to 0.9*sp)
  const x=top.x+g()*sigma*0.9*sp*(1+L.warp(s.score,hard)*3.14);L.drop(s,Math.max(-0.9,Math.min(0.9,x)));}
 return s.score}
for(const sg of [0.01,0.02,0.04]){let a=0;for(let i=1;i<=200;i++)a+=run(sg,i);console.log('sigma',sg,'avg',(a/200).toFixed(1))}

for(const sg of [0.01,0.02,0.04]){let a=0;for(let i=1;i<=200;i++)a+=run(sg,i,true);console.log('HARD sigma',sg,'avg',(a/200).toFixed(1))}
function runM(sigma,seed,mods){let r=seed;const rnd=()=>(r=(r*1664525+1013904223)%4294967296)/4294967296;
 const g=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return (u-3)/Math.sqrt(0.5)};
 const s=L.create(1,false,mods);while(!s.over&&s.score<300){const top=s.blocks[s.blocks.length-1];const sp=L.speed(s.score,false,mods);
  L.drop(s,Math.max(-0.9,Math.min(0.9,top.x+g()*sigma*0.9*sp*(1+L.warp(s.score,false)*3.14))));}return s.score}
for(const m of L.DAILY){const o=[0.01,0.02,0.04].map(sg=>{let a=0;for(let i=1;i<=200;i++)a+=runM(sg,i,m);return (a/200).toFixed(1)});console.log('DAILY',m.n,o.join('/'))}
