(function(g){
 let audio,master,sfxBus,musicBus,verb,noiseBuf,stateFn=()=>0,timer=0,nextT=0,step=0,intensity=0;
 const SKEY='pulseSettings',settings=Object.assign({sound:true,music:true,haptics:true},(()=>{try{return JSON.parse(g.localStorage.getItem(SKEY))||{}}catch{return {}}})());
 const A=[0,3,5,7,10],ROOT=[45,45,41,43];
 const mtof=m=>440*Math.pow(2,(m-69)/12);
 function context(){
  if(audio)return audio;
  const C=g.AudioContext||g.webkitAudioContext;
  if(!C)return null;
  try{
   audio=new C();
   master=audio.createGain();master.gain.value=.9;master.connect(audio.destination);
   sfxBus=audio.createGain();sfxBus.gain.value=1;sfxBus.connect(master);
   musicBus=audio.createGain();musicBus.gain.value=.55;musicBus.connect(master);
   verb=audio.createConvolver();
   const n=audio.sampleRate*.9,b=audio.createBuffer(2,n,audio.sampleRate);
   for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)}
   verb.buffer=b;const vg=audio.createGain();vg.gain.value=.22;verb.connect(vg);vg.connect(master);
   noiseBuf=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);
   const nd=noiseBuf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
   return audio;
  }catch{audio=null;return null}
 }
 function vibrate(style){
  if(!settings.haptics)return;
  try{const native=g.Capacitor?.Plugins?.Haptics;if(native){native.impact({style});return}}catch{}
  try{g.navigator?.vibrate?.(style==='Heavy'?[32,18,48]:style==='Medium'?26:14)}catch{}
 }
 function voice(f,t,dur,type,vol,o={}){
  const ctx=audio,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(f,t);
  if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+dur);
  let out=gain;
  if(o.lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(o.lp,t);if(o.lpTo)fl.frequency.exponentialRampToValueAtTime(o.lpTo,t+dur);osc.connect(fl);fl.connect(gain)}else osc.connect(gain);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(vol,t+(o.atk||.008));gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
  gain.connect(o.bus||sfxBus);if(o.wet){const w=ctx.createGain();w.gain.value=o.wet;gain.connect(w);w.connect(verb)}
  osc.start(t);osc.stop(t+dur+.03);
 }
 function noise(t,dur,vol,freq,type='bandpass',bus){
  const ctx=audio,s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),gain=ctx.createGain();
  s.buffer=noiseBuf;fl.type=type;fl.frequency.value=freq;
  gain.gain.setValueAtTime(vol,t);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(fl);fl.connect(gain);gain.connect(bus||sfxBus);s.start(t);s.stop(t+dur+.02);
 }
 function sfx(fn){if(!settings.sound)return;const ctx=context();if(!ctx)return;try{if(ctx.state==='suspended')ctx.resume();fn(ctx.currentTime)}catch{}}
 function jump(){sfx(t=>{voice(300,t,.14,'square',.05,{to:760,lp:2400});noise(t,.05,.03,3000,'highpass')});vibrate('Light')}
 function core(){sfx(t=>{voice(988,t,.09,'triangle',.07,{wet:.4});voice(1480,t+.06,.2,'sine',.06,{wet:.5})});vibrate('Light')}
 function clearance(kind){sfx(t=>{noise(t,.14,.05,kind==='high'?2600:1500);voice(kind==='high'?700:520,t,.06,'triangle',.03)});vibrate('Light')}
 function death(){sfx(t=>{voice(180,t,.5,'sawtooth',.09,{to:38,lp:1800,lpTo:120,wet:.3});noise(t,.35,.12,500,'lowpass');voice(70,t,.3,'sine',.14,{to:30})});vibrate('Heavy')}
 function clear(){sfx(t=>{[0,4,7,12,16].forEach((s,i)=>voice(mtof(69+s),t+i*.07,.35,'triangle',.06,{wet:.5}))});vibrate('Medium')}
 // music: 16-step bass + arp + drums, tempo and layers scale with stage speed
 function scheduleStep(t,sp,i){
  const bpm=104+Math.min(46,(sp-260)*.2),sixteenth=60/bpm/4,bar=Math.floor(i/16)%4,s=i%16,root=ROOT[bar];
  if(s%4===0)voice(mtof(root-12),t,sixteenth*3.2,'sine',.16,{bus:musicBus});
  if(s%2===0||intensity>.5)voice(mtof(root+(s%8===6?0:-12)),t,sixteenth*1.6,'sawtooth',.05,{bus:musicBus,lp:420+intensity*500});
  if(s%4===0)noise(t,.09,.12,120,'lowpass',musicBus);
  if(s%4===2)noise(t,.05,.05,7000,'highpass',musicBus);
  if(intensity>.25&&s%4===2)noise(t,.12,.06,1800,'bandpass',musicBus);
  if(s%2===1||intensity>.4){
   const n=root+24+A[(s*3+bar*2)%5];
   voice(mtof(n),t,sixteenth*1.4,'square',.018+intensity*.012,{bus:musicBus,lp:1600+intensity*1800,wet:.25});
  }
  return sixteenth;
 }
 function tick(){
  const sp=stateFn(),ctx=audio;
  if(!ctx)return;
  if(!sp||!settings.music){nextT=0;musicBus.gain.setTargetAtTime(0,ctx.currentTime,.08);return}
  musicBus.gain.setTargetAtTime(settings.music?.55:0,ctx.currentTime,.05);
  intensity=Math.max(0,Math.min(1,(sp-260)/270));
  if(nextT<ctx.currentTime-.1){nextT=ctx.currentTime+.05;step=0}
  while(nextT<ctx.currentTime+.18){nextT+=scheduleStep(nextT,sp,step++)}
 }
 function bindState(fn){
  stateFn=fn;
  if(!timer)timer=setInterval(()=>{try{if(audio&&audio.state==='running'||stateFn())context()&&tick()}catch{}},50);
 }
 function setSetting(k,v){if(!(k in settings))return;settings[k]=!!v;try{g.localStorage.setItem(SKEY,JSON.stringify(settings))}catch{}if(k==='haptics'&&v)vibrate('Light')}
 g.PulseFeedback={settings,setSetting,jump,core,clearance,death,clear,bindState,unlock:()=>{const c=context();if(c&&c.state==='suspended')c.resume()}};
})(window);
