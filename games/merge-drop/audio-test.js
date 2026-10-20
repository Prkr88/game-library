// smoke: every MergeAudio call runs against a stub AudioContext without throwing
const P=()=>new Proxy(function(){}, {get:(t,k)=>k==='value'?0:P(),set:()=>true,apply:()=>P()});
const calls=[];
global.window={AudioContext:function(){const n=()=>{const o={connect(){},start(){calls.push(1)},stop(){},frequency:P(),gain:P(),detune:{},getChannelData:()=>new Float32Array(64)};return o;};return{currentTime:0,sampleRate:8000,state:'running',destination:{},createDynamicsCompressor:()=>({threshold:{},ratio:{},connect(){}}),createGain:()=>({gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}),createConvolver:()=>({connect(){}}),createBuffer:()=>({getChannelData:()=>new Float32Array(8000)}),createOscillator:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},detune:{},connect(){},start(){calls.push(1)},stop(){}}),createBufferSource:()=>({connect(){},start(){calls.push(1)}}),createBiquadFilter:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}),resume(){}};}};
const A=require('./src/audio.js');
A.drop(2);A.land();A.merge(64,3);A.merge(2,1);A.bomb();A.swap();A.undo();A.rise();A.level();A.clear();A.over();A.warn();
for(let i=0;i<32;i++)A.musicStep(i,i/32);
if(calls.length<50)throw new Error('too few voices '+calls.length);
let m=true;A.setMuted(()=>m);const n=calls.length;A.merge(8,1);if(calls.length!==n)throw new Error('mute ignored');
console.log('audio ok',calls.length);
