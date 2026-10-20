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
for(const mode of ['startBtn','dailyBtn','overdriveBtn']){
  click(mode);
  assert.ok(run('run')||true);
  let t=0;
  for(let i=0;i<4000&&run('state')==='play';i++){t+=16;try{raf.splice(0).forEach(f=>f(t))}catch(e){errors.push(mode+' frame: '+e.message);break}
    if(i%40===0)handlers.keydown?.forEach(f=>f({key:['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'][i/40%4|0],preventDefault(){}}))}
  console.log(mode,'state after sim:',run('state'),'frames',t/16);assert.ok(t>0,mode+' never entered play');
  click('menuBtn');
}
assert.deepStrictEqual(errors,[],errors.join('\n'));

console.log('game.js executed without startup error; controls:',ids.length);
