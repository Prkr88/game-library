const assert=require('assert');
const L=require('./src/logic.js');
let clean=L.normalizeSave({ daily: null, best: 'bad', bombs: -4, theme: 99, lastRun: 'bad', ach: [] });
if (clean.daily.best!==0||clean.best!==0||clean.bombs!==0||clean.theme!==0||clean.lastRun!==undefined||Array.isArray(clean.ach)) throw new Error('save normalize');
clean=L.normalizeSave({ daily: { date: '2026-10-18', best: 12, streak: 2, last: '2026-10-18' }, best: 42, theme: 2 });
if (clean.daily.best!==12||clean.daily.streak!==2||clean.best!==42||clean.theme!==2) throw new Error('save preserve');
console.log('save normalize ok');
let s=L.create(3);s.next=2;let r=L.drop(s,0);
if(s.grid[6][0]!==2)throw 1;
s.next=2;r=L.drop(s,0);
if(s.grid[6][0]!==4||s.score!==4||r.chain!==1)throw 2;
// chain: 4 beside 2+2 below => merge into 4 then merge with neighbour 4
s=L.create(3);s.grid[6][1]=8;s.grid[6][0]=4;s.grid[5][0]=0;s.next=4;
// drop 4 at col0 -> sits on 4 -> 8, merges with 8 at col1 -> 16 (chain)
r=L.drop(s,0);
if(s.grid[6][0]!==16&&s.grid[6][1]!==16)throw 3;
if(r.chain<2)throw 4;
if(s.maxChain!==2)throw 4.1;
// full column returns null
s=L.create(5);for(let i=0;i<7;i++)s.grid[i][4]=(i%2?32:64)*(i+1);
s.next=2;if(L.drop(s,4)!==null)throw 5;
// game over on random play terminates
s=L.create(9);let n=0;while(!s.over&&n<5000){L.drop(s,n%5)||L.drop(s,(n+1)%5)||L.drop(s,(n+2)%5)||L.drop(s,(n+3)%5)||L.drop(s,(n+4)%5);n++}
if(!s.over)throw 6;
console.log('ok');
// bomb removes tile, cascades; swapNext changes
s=L.create(4);s.grid[6][0]=8;s.grid[5][0]=2;s.grid[4][0]=4;s.grid[6][1]=4;
r=L.bomb(s,5,0);
if(s.grid[6][0]!==8||s.grid[5][0]!==4||r.chain!==0)throw 7;
if(L.bomb(s,0,0)!==null)throw 8;
const o=s.next;if(L.swapNext(s)===o)throw 9;
console.log('ok2');
// board clear bonus: lone tile + matching drop after 8 drops
s=L.create(3);s.grid[6][0]=2;s.drops=8;s.next=2;
r=L.drop(s,0);
if(!r.cleared||s.score!==504)throw 10;
s=L.create(3);s.grid[6][0]=2;s.next=2;r=L.drop(s,0);
if(r.cleared)throw 11;
console.log('ok3');
var A = require('./src/achievements.js');
(function () { var sv = { bestTile: 512, runs: 1, best: 0, daily: { streak: 0 } }; var n = A.check(sv); if (n.length !== 2 || A.check(sv).length) throw new Error('ach'); var s2={bestTile:0,runs:50,best:0,riseBest:1000,maxChain:6,maxLevel:8,bombsUsed:10,daily:{streak:0,last:'x'}};if(A.check(s2).length!==8)throw new Error('ach2');console.log('ach ok'); })();
// difficulty ramp: stones unmergeable, avg run length shrinks with level pressure
s=L.create(3);s.grid[6][0]=-1;s.grid[6][1]=-1;if(L.findGroup(s.grid))throw 12;
console.log('ramp ok');
// rise mode: junk rows arrive on schedule, no instant adjacent pairs, sim shows shorter runs
s=L.create(5,true);for(let i=0;i<8;i++){L.drop(s,i%5);}
if(s.grid[6].some(v=>!v))throw 13;
function avgRun(rise){let tot=0;for(let sd=1;sd<=100;sd++){const st=L.create(sd,rise);let n=0;while(!st.over&&n<3000){let ok=false;for(let k=0;k<5&&!ok;k++)ok=!!L.drop(st,(n+k)%5);if(!ok)break;n++;}tot+=st.drops;}return tot/100;}
const a0=avgRun(false),a1=avgRun(true);
if(!(a1<a0))throw 14;
console.log('rise ok',a0,a1);
// mastery goal selects next tile milestone without mutating anything
let g=L.nextGoal(0);if(g.target!==128||g.remaining!==128)throw 15;
g=L.nextGoal(128);if(g.target!==512||g.remaining!==384)throw 16;
g=L.nextGoal(500);if(g.target!==512||g.remaining!==12)throw 17;
g=L.nextGoal(20000);if(!g.complete||g.target!==16384||g.remaining!==0)throw 18;
console.log('goal ok');
let rc=L.recordChase(120,100);if(!rc.newRecord||rc.needed!==1||rc.record!==100)throw 19;
rc=L.recordChase(99,100);if(rc.newRecord||rc.needed!==2)throw 19.1;
console.log('record chase ok');
if(L.liveStreak(4,'2026-10-18','2026-10-18')!==4||L.liveStreak(4,'2026-10-17','2026-10-18')!==4||L.liveStreak(4,'2026-10-16','2026-10-18')!==0||L.liveStreak(5,'2026-12-31','2027-1-1')!==5)throw 'liveStreak';
if(L.dailyRecord(900,'2026-10-17','2026-10-18')!==0||L.dailyRecord(900,'2026-10-18','2026-10-18')!==900)throw 19.2;
console.log('daily record scope ok');
// undo: snapshot/restore round-trips incl. RNG
s=L.create(11);L.drop(s,0);const sn=L.snapshot(s);const g0=JSON.stringify(s.grid),nx=s.next;
L.drop(s,1);const a=s.next;L.restore(s,sn);
if(JSON.stringify(s.grid)!==g0||s.next!==nx||s.maxChain!==sn.maxChain)throw 20;
L.drop(s,1);if(s.next!==a)throw 21;
console.log('undo ok');
// preview predicts cascades and does not mutate live state
s=L.create(3);s.grid[6][1]=8;s.grid[6][0]=4;s.next=4;
const before=JSON.stringify(s), pv=L.preview(s,0);
if(pv.mergeValue!==16||pv.chain<2||pv.full)throw 22;
if(JSON.stringify(s)!==before)throw 23;
s=L.create(7);for(let i=0;i<7;i++)s.grid[i][2]=2;
if(!L.preview(s,2).full)throw 24;
// preview flags legal drop that immediately fills top row
s=L.create(8);for(let c=0;c<4;c++)for(let r=0;r<7;r++)s.grid[r][c]=2**(r*5+c+1);
s.grid[0][4]=0;for(let r=1;r<7;r++)s.grid[r][4]=2**(r+6);s.next=4;
if(!L.preview(s,4).endsRun)throw 25;
console.log('preview ok');
// puzzles: solvable at par, not solvable faster, fixed queue deterministic
const PZ=require('./src/puzzles.js');
PZ.forEach((pz,i)=>{
  const best=[];
  (function rec(s,k){ best[k]=Math.max(best[k]||0,s.max); if(k>=pz.limit)return;
    for(let c=0;c<5;c++){const t=L.snapshot(s),g=s.grid.map(r=>r.slice());const r=L.drop(s,c);if(r&&!s.over)rec(s,k+1);s.grid=g;L.restore(s,t);} })(L.createPuzzle(pz),0);
  for(let k=1;k<best.length;k++)best[k]=Math.max(best[k],best[k-1]);
  if(best[pz.par]<pz.goal)throw new Error('puzzle '+(i+1)+' unsolvable at par');
  if(best[pz.par-1]>=pz.goal)throw new Error('puzzle '+(i+1)+' par not minimal');
  if(pz.board.length!==7||pz.board.some(r=>r.length!==5))throw new Error('puzzle shape');
});
PZ.forEach(function(pz,i){ assert.ok(pz.sol&&pz.sol.length<=pz.par,'sol '+(i+1)); var st=L.createPuzzle(pz); for(var k=0;k<pz.sol.length;k++) assert.ok(L.drop(st,+pz.sol[k]),'sol drop '+(i+1)); assert.ok(st.max>=pz.goal,'sol reaches goal '+(i+1)); });
console.log('puzzle hints ok');
console.log('puzzles ok',PZ.length);
// ads adapter
{
  const A=require('./src/ads.js'); const mem={}; const store={getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}};
  let t=1e6, inter=0, rewardOk=true;
  const native={requestConsent:()=>Promise.resolve(true),showInterstitial:()=>{inter++;return Promise.resolve();},showRewarded:()=>Promise.resolve(rewardOk)};
  const web=A.create(null,store,()=>t);
  if(web.canShow()||web.maybeInterstitial(3)||web.rewardedReady())throw new Error('ads: web must be inert');
  const a=A.create(native,store,()=>t);
  if(a.maybeInterstitial(3)||inter)throw new Error('ads: no consent yet');
  a.ensureConsent().then(()=>{
    if(!a.maybeInterstitial(3)||inter!==1)throw new Error('ads: interstitial');
    if(a.maybeInterstitial(6)||inter!==1)throw new Error('ads: min gap');
    t+=A.MIN_GAP_MS+1; if(a.maybeInterstitial(4))throw new Error('ads: every-3rd');
    a.setRemoveAds(true); if(a.maybeInterstitial(9))throw new Error('ads: removeAds');
    if(!A.create(native,store,()=>t).state.removeAds)throw new Error('ads: persist');
    let got=0; a.showRewarded(()=>got++); rewardOk=false; a.showRewarded(()=>got++);
    return new Promise(r=>setTimeout(r,5)).then(()=>{ if(got!==1)throw new Error('ads: reward only when earned'); console.log('ads ok'); });
  }).catch(e=>{console.error(e);process.exit(1);});
}
{ const PZ=require('./src/puzzles.js'); const seen=new Set();
  for(let d=1;d<=60;d++){const i=L.dailyPuzzleIndex('2026-10-'+d,PZ.length);if(i<Math.floor(PZ.length/2)||i>=PZ.length)throw new Error('daily pz idx '+i);seen.add(i);}
  if(L.dailyPuzzleIndex('2026-10-18',PZ.length)!==L.dailyPuzzleIndex('2026-10-18',PZ.length))throw new Error('daily pz unstable');
  if(seen.size<5)throw new Error('daily pz low variety');
  const n=L.normalizeSave({dpz:{stars:9,streak:-2,date:5}}); if(n.dpz.stars!==0||n.dpz.streak!==0||n.dpz.date!=='')throw new Error('dpz normalize');
  console.log('daily puzzle ok'); }

// hardcore: faster ramp, stones earlier than classic, deterministic
{
  const c = L.create(5, false, false), h = L.create(5, false, true);
  c.drops = h.drops = 18;
  let sc = 0, sh = 0; for (let i = 0; i < 3000; i++) { if (L.swapNext(c) === L.STONE) sc++; if (L.swapNext(h) === L.STONE) sh++; }
  if (!(sh > sc * 2)) throw new Error('hard stones not harsher ' + sc + ' ' + sh);
  if (L.normalizeSave({ hardBest: 77 }).hardBest !== 77) throw new Error('hardBest save');
  console.log('hardcore ok');
}
(function () { var sv = { bestTile: 1024, runs: 1, best: 20000, maxChain: 8, hardBest: 2000, puzzle: [3,3,3,3,3,3,3,3,3,3,3,3], daily: { streak: 0 } }; var ids = A.check(sv).map(function (d) { return d.id; }); ['t1024','score20k','chain8','hard2k','pz10','pz3star'].forEach(function (i) { if (ids.indexOf(i) < 0) throw new Error('ach ' + i); }); })();
console.log('late ach ok');

if(!/Merge Drop Classic[\s\S]*120 pts[\s\S]*tile 64/.test(L.shareText({mode:'classic',score:120,max:64,chain:3},'x'))||L.shareText(null))throw 'share';
