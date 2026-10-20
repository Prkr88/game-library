(function(g){
 const stages=[
  {name:'Spark',speed:260,items:[['gap',420],['low',700],['coin',900],['gap',1120],['high',1420],['coin',1660],['gap',1900],['coin',1900],['low',2200],['finish',2600]]},
  {name:'Voltage',speed:285,items:[['gap',380],['low',620],['coin',620],['gap',820],['high',1030],['coin',1190],['gap',1370],['low',1570],['coin',1570],['gap',1790],['high',2020],['finish',2440]]},
  {name:'Overload',speed:310,items:[['low',360],['coin',360],['gap',560],['high',760],['gap',940],['low',1150],['coin',1150],['gap',1340],['coin',1510],['high',1660],['gap',1870],['low',2070],['finish',2380]]},
  {name:'Afterimage',speed:335,items:[['gap',340],['low',520],['coin',520],['gap',700],['high',875],['gap',1040],['low',1230],['coin',1230],['high',1410],['gap',1570],['low',1750],['coin',1750],['gap',1940],['high',2110],['finish',2420]]},
  {name:'Redline',speed:360,items:[['low',320],['coin',320],['gap',490],['high',650],['gap',820],['low',980],['coin',980],['gap',1150],['high',1320],['low',1490],['gap',1650],['high',1810],['gap',1980],['low',2150],['coin',2150],['finish',2440]]},
  {name:'Core',speed:390,items:[['gap',310],['high',470],['low',630],['coin',630],['gap',790],['low',950],['gap',1110],['high',1270],['gap',1430],['low',1590],['coin',1590],['high',1750],['gap',1910],['low',2070],['coin',2070],['gap',2230],['finish',2520]]},
  {name:'Ghost Wire',speed:420,items:[['gap',378],['low',554],['high',697],['gap',865],['low',1008],['coin',1134],['high',1323],['gap',1466],['low',1676],['high',1802],['low',1945],['gap',2134],['high',2268],['gap',2411],['low',2600],['coin',2684],['high',2852],['finish',3230]]},
  {name:'Static Storm',speed:455,items:[['low',364],['gap',501],['high',637],['low',774],['gap',946],['coin',1083],['high',1219],['gap',1356],['low',1538],['high',1665],['gap',1802],['low',1938],['high',2120],['gap',2257],['low',2375],['gap',2557],['high',2694],['low',2830],['coin',2921],['high',3085],['gap',3221],['finish',3631]]},
  {name:'Zero Hour',speed:490,items:[['gap',368],['low',505],['high',632],['gap',779],['low',916],['high',1063],['coin',1210],['gap',1338],['low',1504],['high',1632],['low',1769],['gap',1916],['high',2043],['gap',2181],['low',2357],['high',2484],['gap',2631],['low',2759],['high',2906],['gap',3033],['coin',3131],['low',3298],['high',3425],['gap',3572],['finish',4013]]},
  {name:'Singularity',speed:530,items:[['low',371],['high',504],['gap',647],['low',784],['high',917],['gap',1076],['coin',1235],['low',1373],['gap',1505],['high',1654],['low',1786],['gap',1929],['high',2062],['low',2221],['gap',2353],['high',2496],['low',2629],['high',2767],['gap',2915],['low',3048],['coin',3154],['high',3302],['gap',3434],['low',3578],['high',3710],['gap',3869],['finish',4346]]},
  {"name":"Overclock","speed":565,"items":[["low",380],["high",521],["low",671],["low",819],["high",977],["low",1131],["coin",1242],["gap",1299],["gap",1473],["low",1642],["gap",1800],["low",1969],["high",2116],["high",2254],["coin",2364],["low",2420],["gap",2562],["low",2713],["low",2882],["gap",3047],["low",3189],["gap",3329],["coin",3429],["high",3486],["low",3651],["gap",3819],["gap",3964],["high",4126],["gap",4274],["finish",4794]]}
 ,{"name":"Meltdown","speed":600,"items":[["low",380],["gap",541],["gap",701],["high",852],["high",1008],["high",1173],["coin",1277],["high",1337],["low",1483],["gap",1661],["gap",1820],["low",1993],["low",2158],["high",2312],["coin",2411],["gap",2471],["high",2644],["low",2802],["gap",2981],["high",3121],["gap",3275],["high",3453],["coin",3573],["high",3633],["high",3796],["low",3949],["high",4113],["low",4256],["high",4433],["low",4582],["coin",4680],["gap",4740],["high",4907],["low",5047],["finish",5571]]}
 ,{"name":"Event Horizon","speed":640,"items":[["low",380],["high",561],["low",719],["high",864],["low",1009],["high",1157],["coin",1252],["low",1316],["low",1501],["gap",1643],["gap",1815],["high",1994],["gap",2147],["high",2331],["coin",2413],["high",2477],["low",2644],["gap",2823],["gap",2967],["high",3124],["gap",3307],["high",3489],["coin",3610],["gap",3674],["low",3852],["high",4013],["low",4186],["gap",4360],["high",4514],["low",4697],["coin",4778],["high",4842],["gap",4985],["high",5133],["low",5310],["high",5483],["gap",5652],["low",5831],["coin",5925],["finish",6349]]}
 ,{"name":"Pulse Zero","speed":690,"items":[["gap",380],["low",563],["high",718],["high",898],["low",1047],["high",1209],["coin",1297],["low",1366],["high",1516],["low",1689],["low",1845],["high",2031],["gap",2198],["low",2373],["coin",2458],["low",2527],["gap",2697],["low",2889],["high",3065],["low",3211],["low",3385],["gap",3571],["coin",3664],["low",3733],["low",3897],["low",4075],["gap",4265],["high",4458],["high",4630],["gap",4820],["coin",4939],["low",5008],["high",5164],["low",5315],["gap",5489],["high",5673],["gap",5835],["high",6023],["coin",6115],["gap",6184],["low",6361],["high",6515],["high",6691],["finish",7232]]}
 ];

 function endlessSpeed(x){return Math.min(620,300+Math.max(0,x)*.008)}
 function endlessGap(x){return Math.max(.3,.62-Math.max(0,x)/40000*.32)}
 function endlessRng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function endlessStage(seed){return {name:'ENDLESS',endless:true,speed:endlessSpeed(0),items:[],cursor:420,count:0,rand:endlessRng(seed||1)}}
 function endlessExtend(st,upTo,speedAt=endlessSpeed){
  const kinds=['low','high','gap'];let prev=null;
  while(st.cursor<upTo){
   let k=kinds[Math.floor(st.rand()*3)];if(k===prev&&st.rand()<.6)k=kinds[Math.floor(st.rand()*3)];
   st.items.push([k,Math.round(st.cursor)]);prev=k;st.count++;
   const v=speedAt(st.cursor);
   st.cursor+=v*(endlessGap(st.cursor)+st.rand()*.1);
   if(st.count%6===5){st.items.push(['coin',Math.round(st.cursor-v*.12)])}
  }
  return st;
 }
 function itemAt(stage,x){return stage.items.find(i=>i[0]!=='coin'&&Math.abs(i[1]-x)<34)}
 function hit(kind,player){const grounded=!player.air&&player.y>205;if(kind==='gap')return grounded;if(kind==='low')return grounded;if(kind==='high')return grounded&&!player.sliding;return false}
 function coreHit(coreX,player,reach=28){return !!player.air&&Math.abs(coreX-player.x)<reach&&Math.abs(player.y-150)<52}
 function progress(stage,x){const end=stage.items[stage.items.length-1][1];return Math.max(0,Math.min(100,Math.round(x/end*100)))}
 function checkpoint(stage,x){return x>=stage.items[stage.items.length-1][1]*.5}
 function stageUnlocked(index,cleared){return Number.isInteger(index)&&index>=0&&index<stages.length&&index<=Math.max(0,Math.min(stages.length-1,cleared|0))}
 function parTime(stage){return stage.items[stage.items.length-1][1]/stage.speed*1.18}
 function formatTime(seconds){return `${seconds.toFixed(1)}s`}
 function paceFeedback(time,record){time=Number(time)||0;record=Number(record)||0;if(!record)return 'PB --';const delta=record-time;return Math.abs(delta)<=.051?'PB PACE':delta>0?`${formatTime(delta)} AHEAD`:`${formatTime(-delta)} BEHIND`}
 function jumpAssist(player){return !player.air&&(player.coyote>0||player.y>=245)&&player.jumpBuffer>0}
 function timeFeedback(time,record){if(!record)return 'FIRST RUN';const delta=time-record;return delta<-.05?`${formatTime(-delta)} FASTER`:delta>.05?`${formatTime(delta)} SLOWER`:'TIED PB'}
 function rank(stars,dead){return dead?'RETRY':stars>=3?'PERFECT':stars>=1?'CLEAR':'CLEAR'}
 function retryTip(kind){return ({gap:'Jump early: clear gap center before landing.',low:'Jump over low barrier; keep jump held for more height.',high:'Slide under high barrier; release after passing it.'})[kind]||'Watch NEXT action cue, then commit one clean input.'}
 function clearanceCue(kind){return ({gap:'CLEAN JUMP',low:'CLEAN JUMP',high:'CLEAN SLIDE'})[kind]||''}
 function clearRecap(stage,index,stars,time,record,list=stages){
  const goals=[];
  if(stars<3){const missing=3-stars;goals.push(`Replay: collect ${missing} more core${missing===1?'':'s'}`)}
  const par=parTime(stage);
  goals.push(time>par?`Replay: shave ${formatTime(time-par)} to hit PAR`:'PAR BEAT');
  if(record&&time>record)goals.push(`PB chase: ${formatTime(time-record)} faster`);
  const next=index<list.length-1?`Next: ${list[index+1].name} · PAR ${formatTime(parTime(list[index+1]))}`:'All stages clear · chase 3-star mastery';
  return {goal:goals.join(' · '),next};
 }
 function stageGoal(stage,stars,record){
  stars=stars||0;record=record||0;const goals=[];
  if(stars<3){const missing=3-stars;goals.push('collect '+missing+' more core'+(missing===1?'':'s'))}
  const par=parTime(stage);
  if(!record)goals.push('set PB under '+formatTime(par));
  else if(record>par)goals.push('beat PAR '+formatTime(par));
  else goals.push('PB '+formatTime(record));
  return goals.join(' · ');
 }
 function cueUrgency(distance){distance=Math.max(0,Number(distance)||0);return distance<=70?'NOW':distance<=180?'READY':'FAR'}
 function pauseSummary(stage,x,time,stars,hasCheckpoint){
  const cores=Number(stars)||0;
  return `${stage.name} · ${progress(stage,x)}% · ${formatTime(Number(time)||0)} · ${cores} core${cores===1?'':'s'} · ${hasCheckpoint?'CHECKPOINT READY':'CHECKPOINT AT 50%'}`;
 }
 g.PulseLogic={endlessSpeed,endlessGap,endlessStage,endlessExtend,stages,itemAt,hit,coreHit,progress,checkpoint,stageUnlocked,parTime,formatTime,timeFeedback,paceFeedback,rank,retryTip,clearanceCue,clearRecap,stageGoal,jumpAssist,cueUrgency,pauseSummary};
})(window);
 (function(){
  function nextCue(stage,x,collected){const owned=collected instanceof Set?collected:new Set(collected||[]);const item=stage.items.find((i,index)=>i[1]>x&&(i[0]!=='coin'||!owned.has(index)));if(!item)return {label:'CORE',distance:0,kind:'finish'};const index=stage.items.indexOf(item),label=item[0]==='high'?'SLIDE':item[0]==='finish'||item[0]==='coin'?'CORE':'JUMP';return {label,distance:Math.max(0,Math.round(item[1]-x)),kind:item[0],index}}
  window.PulseLogic.nextCue=nextCue;
 })();
