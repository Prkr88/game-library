// Headless runtime smoke: executes game.js against a stub DOM, starts every mode, simulates frames.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(`${__dirname}/index.html`,'utf8');
const ids=[...html.matchAll(/id=["']([\w-]+)["']/g)].map(m=>m[1]);
const handlers={},raf=[];
const mk=()=>{const el={style:{},dataset:{},hidden:false,textContent:'',innerHTML:'',disabled:false,
  classList:{add(){},remove(){},toggle(){},contains(){return false}},
  setAttribute(){},getAttribute(){return null},focus(){},blur(){},addEventListener(t,f){(el._h??=[]).push(f)},removeEventListener(){},
  getContext:()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k==='measureText'?()=>({width:10}):()=>{}),set:(t,k,v)=>(t[k]=v,true)}),
  getBoundingClientRect:()=>({left:0,top:0,width:800,height:450}),width:800,height:450,clientWidth:800,clientHeight:450};return el};
const els={};
const document={querySelector:s=>els[s]??=mk(),querySelectorAll:()=>[],addEventListener:(t,f)=>(handlers[t]??=[]).push(f),hidden:false,body:mk(),documentElement:mk()};
ids.forEach(i=>els['#'+i]=mk());
class Img{set src(v){this._s=v}get complete(){return true}naturalWidth=0;naturalHeight=0}
const ctx={document,window:null,Image:Img,localStorage:{skylineSprint:JSON.stringify({tutorialSeen:true,cleared:8})},navigator:{vibrate(){}},console,Math,Date,JSON,Promise,
  requestAnimationFrame:f=>raf.push(f),cancelAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,performance:{now:()=>0},
  addEventListener:(t,f)=>(handlers[t]??=[]).push(f),location:{protocol:'file:'},innerWidth:800,innerHeight:450,devicePixelRatio:1};
ctx.window=ctx;vm.createContext(ctx);
const errors=[];
vm.runInContext(fs.readFileSync(`${__dirname}/game.js`,'utf8').replace(/^export \{.*$/m,''),ctx,{filename:'game.js'});
const click=id=>{try{const e=els['#'+id];[e.onclick,...(e._h||[])].filter(Boolean).forEach(f=>f({preventDefault(){},currentTarget:e,target:e}))}catch(e){errors.push(id+': '+e.message)}};

const run=c=>vm.runInContext(c,ctx);
// Latency-bot: after each gate resolves, waits L seconds before switching lane/acting for the next one.
// L=0 is a perfect player; max L that still clears shows how much reaction slack a stage leaves.
let t=0;
function play(mode,stageIdx,L,idle){
  run(`stage=${stageIdx}`);click(mode);
  let seen=null,seenAt=0,lockT=0,steps=0;
  while(run('state')==='play'&&steps++<20000){
    const objs=run('run.objects.filter(o=>!o.hit&&o.dist>.13).map(o=>({lane:o.lane,type:o.type,dist:o.dist}))');
    const speed=run('stages[stage].speed*(run.overdrive?1.12:1)');
    const locked=run('run.objects.some(o=>o.dist<=.13&&o.dist>-.05)');
    if(locked)lockT=t;
    if(!idle&&objs.length){
      const d=Math.min(...objs.map(o=>o.dist)),grp=objs.filter(o=>Math.abs(o.dist-d)<1e-6);
      const key=run('run.next')-new Set(objs.map(o=>o.dist.toFixed(4))).size;
      if(seen!==key){seen=key;seenAt=t}
      if(seen===key&&t-Math.max(seenAt,lockT)>=L*1000){
        const cur=run('run.lane'),opts=[0,1,2].map(l=>grp.find(o=>o.lane===l)||{lane:l,type:null}).filter(o=>o.type!=='wall'),ok=opts.sort((a,b)=>Math.abs(a.lane-cur)-Math.abs(b.lane-cur))[0];
        if(ok){if(locked&&ok.lane!==cur){/* cannot enter a lane with an unresolved gate */}else if(ok.lane<cur)run('move(-1)');else if(ok.lane>cur)run('move(1)');
          else if(ok.type&&d-.13<speed*.15)run(`act('${ok.type}')`)}
      }
    }
    t+=16;raf.splice(0).forEach(f=>f(t));
  }
  return {win:run('run.ended')&&run('run.clean')===run('run.gates')&&run('run.distance')>=run('stages[stage].target'),gates:run('run.gates'),secs:steps*16/1000|0};
}
const rows=[],slack=[];
for(let s=0;s<8;s++){
  assert.ok(play('startBtn',s,0).win,`perfect bot must clear stage ${s+1}`);
  assert.ok(!play('startBtn',s,0,true).win,`idle bot must fail stage ${s+1}`);
  click('menuBtn');
  let maxL=-1;for(let L=0.05;L<1.5;L=+(L+0.05).toFixed(2)){if(play('startBtn',s,L).win)maxL=L;else break;click('menuBtn')}
  slack.push(maxL);rows.push(`stage ${s+1}: perfect clear OK, idle fails, max reaction slack ${maxL}s`);click('menuBtn');
}
assert.ok(play('overdriveBtn',5,0).win,'perfect bot must clear Overdrive');click('menuBtn');
let od=-1;for(let L=0.05;L<1.5;L=+(L+0.05).toFixed(2)){if(play('overdriveBtn',5,L).win)od=L;else break;click('menuBtn')}
rows.push(`overdrive: max reaction slack ${od}s`);click('menuBtn');
assert.ok(slack[7]<slack[0],'late stages must leave less reaction slack than stage 1');
assert.ok(od<=slack[5],'Overdrive must be at least as demanding as stage 6');
// Practice checkpoint: reaching 50% on a failed run offers practice that never saves progress.
{
  run('stage=2');click('startBtn');
  const target=run('stages[stage].target');
  run('run.distance='+(target*.49));let g=0;while(!run('run.checkpoint')&&g++<500){t+=16;raf.splice(0).forEach(f=>f(t))}
  assert.ok(run('run.checkpoint'),'checkpoint captured at 50%');
  run('end(false)');
  assert.strictEqual(els['#practiceBtn'].hidden,false,'practice offered after fail');
  const bestBefore=run('save.best'),clearedBefore=run('save.cleared');
  click('practiceBtn');
  assert.ok(run('run.practice')&&run('run.distance')>=target*.5,'practice starts at checkpoint');
  run('end(true)');
  assert.strictEqual(run('save.best'),bestBefore,'practice must not change best');
  assert.strictEqual(run('save.cleared'),clearedBefore,'practice must not change progression');
  click('menuBtn');console.log('practice checkpoint ok');
}
rows.forEach(r=>console.log(r));
console.log('bot ok');
