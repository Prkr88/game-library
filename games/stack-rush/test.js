const L=require('./src/logic.js');
const corrupt=L.normalizeSave({best:'oops',coins:-4,theme:99,owned:{},ach:'bad',hard:'yes',lastMode:123});
if(corrupt.best!==0||corrupt.coins!==0||corrupt.theme!==4||corrupt.owned.join()!=='0'||corrupt.ach.length!==0||corrupt.hard)throw 27;
const clean=L.normalizeSave({best:12,owned:[0,2,2,99,-1],ach:['s25',4],lastMode:'Hard'});
if(clean.best!==12||clean.owned.join()!=='0,2'||clean.ach.join()!=='s25'||clean.lastMode!=='Hard')throw 28;
console.log('ok-save-normalization');
const s=L.create(1);let r=L.drop(s,0);
if(r.type!=='perfect'||s.score!==1)throw 1;
r=L.drop(s,0.3);if(r.type!=='trim'||Math.abs(s.blocks[2].w-0.7)>1e-9)throw 2;
r=L.drop(s,2);if(r.type!=='miss'||!s.over)throw 3;
for(let t=0;t<50;t+=0.1){const p=L.posAt(t,10);if(Math.abs(p)>0.9001)throw 4}
console.log('ok');
if(L.dailyReward(1)!==20||L.dailyReward(50)!==100)throw 5;console.log('ok2')
const A=L.newAchievements({score:30,maxCombo:5,perfects:3},['first']);
if(A.map(a=>a.id).join()!=='c5,s25')throw 6;console.log('ok3')
const m=L.dailyMods(5), s2=L.create(1,false,m);
if(s2.blocks[0].w!==m.w||L.speed(10,false,m)<=L.speed(10,false)*0.99&&m.sp>1)throw 7;
if(L.dailyMods(-1)==null)throw 8;console.log('ok4')
for(const h of [false,true])for(let sc=0;sc<80;sc+=5)for(let t=0;t<30;t+=0.013){if(Math.abs(L.posAt(t,sc,h))>0.9001)throw 9}
if(L.warp(10,false)!==0||L.warp(100,false)!==0.25)throw 10;console.log('ok5')
if(L.trimGrade(0.95,1)!=='CLOSE'||L.trimGrade(0.7,1)!=='CLEAN'||L.trimGrade(0.69,1)!=='RISKY')throw 13;console.log('ok7')
if(L.precisionPercent(0,0)!==0||L.precisionPercent(2,3)!==67||L.precisionPercent(5,4)!==100)throw 21;console.log('ok-precision')
if(L.longestPerfectStreak([true,true,false,true,true,true,false])!==3||L.longestPerfectStreak([])!==0||L.longestPerfectStreak([false,false])!==0)throw 22;console.log('ok-streak')
const z=L.perfectZone(0,1,0,false,null);if(Math.abs(z.left+0.025)>1e-9||Math.abs(z.right-0.025)>1e-9)throw 15;
const zh=L.perfectZone(0.1,0.02,60,true,null);if(zh.width>0.02||zh.left>0.1||zh.right<0.1)throw 16;console.log('ok-zone')
const cuePerfect=L.timingCue(0,0,1,0,false,null), cueTrim=L.timingCue(0.5,0,1,0,false,null), cueLeft=L.timingCue(1.1,0,1,0,false,null), cueRight=L.timingCue(-1.1,0,1,0,false,null);
if(cuePerfect.state!=='perfect'||cuePerfect.label!=='TAP PERFECT'||cueTrim.state!=='trim'||cueTrim.label!=='TAP TO LAND'||cueLeft.state!=='miss'||cueLeft.label!=='MOVE LEFT'||cueRight.state!=='miss'||cueRight.label!=='MOVE RIGHT')throw 17;console.log('ok-cue')
const feedbackPerfect=L.dropFeedback({type:'perfect'},1),feedbackTrim=L.dropFeedback({type:'trim',w:0.8},1),feedbackMiss=L.dropFeedback({type:'miss'},1);
if(feedbackPerfect.label!=='PERFECT · FULL WIDTH'||feedbackTrim.label!=='CLEAN CUT · 80% WIDTH'||feedbackMiss.label!=='MISS · ALIGN NEXT DROP')throw 18;console.log('ok-feedback')
if(L.nextTarget(0,false,false)!==25||L.nextTarget(25,false,false)!==50||L.nextTarget(49,true,false)!==50||L.nextTarget(9,false,true)!==10||L.nextTarget(25,false,true)!==25)throw 14;console.log('ok8')
const gp=L.goalProgress(12,false,false);if(gp.previous!==0||gp.target!==25||gp.percent!==48)throw 18;
const gh=L.goalProgress(40,true,false);if(gh.previous!==30||gh.target!==50||gh.percent!==50)throw 19;
const gd=L.goalProgress(25,false,true);if(gd.previous!==10||gd.target!==25||gd.percent!==100)throw 20;console.log('ok-goal-progress')
const cc=L.continueContext(8,12,25);if(cc.pbGap!==4||cc.goalGap!==17||!cc.hasPb||cc.pbTied||cc.goalReached)throw 23;
const ce=L.continueContext(25,25,25);if(ce.pbGap!==0||!ce.pbTied||!ce.goalReached)throw 24;console.log('ok-continue-context')
const rn=L.recordContext(12,10), rt=L.recordContext(10,10), rc=L.recordContext(8,10), rf=L.recordContext(0,0);
if(rn.state!=='new'||rn.margin!==2||rt.state!=='tie'||rc.state!=='chase'||rc.gap!==2||rf.state!=='first')throw 25;console.log('ok-record-context')
if(L.scopedBest(12,'2026-10-17','2026-10-18')!==0||L.scopedBest(12,'2026-10-18','2026-10-18')!==12||L.scopedBest(0,'2026-10-18','2026-10-18')!==0)throw 26;console.log('ok-scoped-best')
const B=L.newAchievements({score:50,maxCombo:20,perfects:9,hard:true},['first','c5','c10','s25','s50']).map(a=>a.id).join();
if(B!=='c20,h15,h30,h50')throw 11;
if(L.newAchievements({score:30,maxCombo:0,perfects:0,daily:true},[]).map(a=>a.id).indexOf('d25')<0)throw 12;console.log('ok6')
// audio module loads headless and degrades gracefully with no AudioContext
var SA = require('./src/audio.js'); SA.setMuted(true); SA.sfx.perfect(3); SA.music(true, 10); console.log('audio ok');
// ads adapter: web = no ads, no free rewards
var ADS = require('./src/ads.js'), mem = {}, st = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
var web = ADS.create(null, st); if (web.canShow() || web.rewardedReady() || web.maybeInterstitial(3)) throw new Error('ads: web must be inert');
var got = 0, inter = 0, nat = { requestConsent: () => Promise.resolve(true), showInterstitial: () => { inter++; return Promise.resolve(); }, showRewarded: () => Promise.resolve(true) };
var ad = ADS.create(nat, st, () => 1e9); if (ad.rewardedReady()) throw new Error('ads: needs consent');
ad.ensureConsent().then(() => { if (!ad.rewardedReady() || !ad.maybeInterstitial(3) || inter !== 1) throw new Error('ads: native');
  ad.showRewarded(() => got++); setTimeout(() => { if (got !== 1) throw new Error('ads: reward'); console.log('ads ok'); }, 10); });
