"use strict";
/* River City Quest 3D: sound. Little synthesized effects, and soft looping music with a big
   reverb, the way PS1 sound chips washed everything in echo. */
let ac=null,master=null,musicBus=null,sfxBus=null,verb=null,musicOn=null,nextBeat=0,step=0;
function audioStart(){if(ac){if(ac.state=='suspended')ac.resume();return;}try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  master=ac.createGain();master.gain.value=.7;master.connect(ac.destination);
  verb=ac.createConvolver();const len=ac.sampleRate*2.2,buf=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}verb.buffer=buf;
  const wet=ac.createGain();wet.gain.value=.35;verb.connect(wet);wet.connect(master);
  musicBus=ac.createGain();musicBus.gain.value=.32;musicBus.connect(master);musicBus.connect(verb);sfxBus=ac.createGain();sfxBus.gain.value=.55;sfxBus.connect(master);sfxBus.connect(verb);}
function tone(f,d,type,vol,bus,at,slide){if(!ac)return;const t=at||ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.1,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g);g.connect(bus||sfxBus);o.start(t);o.stop(t+d+.05);}
function noise(d,vol,lp,at){if(!ac)return;const t=at||ac.currentTime,n=ac.createBufferSource(),b=ac.createBuffer(1,ac.sampleRate*d,ac.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;n.buffer=b;
  const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=lp||2000;const g=ac.createGain();g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.001,t+d);n.connect(f);f.connect(g);g.connect(sfxBus);n.start(t);}
function sfx(k){if(!ac)return;const t=ac.currentTime;switch(k){
  case'blip':tone(880,.05,'square',.05);break;case'bark':tone(620,.06,'square',.05,null,null,480);tone(560,.07,'square',.045,null,t+.1,420);break;case'snap':tone(1600,.03,'square',.04);noise(.06,.15,5000);tone(900,.06,'triangle',.04,null,t+.04);break;
  case'bite':tone(1300,.06,'square',.05);tone(1700,.08,'square',.05,null,t+.07);break;case'reel':tone(400+Math.random()*300,.03,'square',.025);break;case'frog':tone(260,.08,'square',.05,null,null,180);tone(300,.08,'square',.04,null,t+.1,200);break;
  case'ping':tone(900+Math.random()*400,.07,'square',.04);break;case'crack':noise(.08,.35,6000);tone(1200,.05,'square',.06,null,null,600);break;case'cheer':noise(.9,.1,2500);for(let i=0;i<4;i++)tone(700+i*120,.12,'triangle',.03,null,t+i*.07);break;case'swish':noise(.25,.12,7000);break;case'engine':tone(70+Math.random()*20,.12,'sawtooth',.02);break;case'swing':noise(.12,.18,3000);tone(300,.1,'triangle',.06,null,null,150);break;
  case'hit':tone(180,.12,'square',.12,null,null,60);noise(.08,.2,1500);break;case'poof':noise(.3,.25,900);tone(520,.25,'triangle',.06,null,null,1200);break;
  case'hurt':tone(220,.25,'sawtooth',.12,null,null,90);break;case'die':for(let i=0;i<5;i++)tone(400-i*60,.3,'triangle',.08,null,t+i*.12);break;
  case'coin':tone(988,.06,'square',.06);tone(1319,.18,'square',.06,null,t+.06);break;case'heart':tone(660,.1,'triangle',.08);tone(880,.15,'triangle',.08,null,t+.08);break;
  case'chest':[523,659,784,1047].forEach((f,i)=>tone(f,.3,'triangle',.08,null,t+i*.09));break;case'fanfare':[523,659,784,1047,988,1047].forEach((f,i)=>tone(f,i==5?.6:.18,'square',.07,null,t+i*.13));break;
  case'secret':[784,740,622,440,415,659,831,1047].forEach((f,i)=>tone(f,.15,'triangle',.07,null,t+i*.08));break;
  case'door':noise(.35,.15,600);tone(110,.3,'triangle',.08);break;case'whoosh':noise(.4,.12,1200);break;
  case'no':tone(150,.15,'square',.08);break;case'go':[523,784,1047].forEach((f,i)=>tone(f,.15,'square',.07,null,t+i*.08));break;
  case'cut':noise(.15,.2,4000);break;case'drop':tone(220,.08,'triangle',.1);break;case'boom':noise(.8,.5,700);tone(80,.6,'sine',.3,null,null,30);break;
  case'clank':tone(1400,.15,'square',.08);tone(1900,.2,'triangle',.06);break;case'growl':tone(90,.6,'sawtooth',.12,null,null,60);break;
  case'throw':tone(700,.06,'triangle',.06,null,null,400);break;case'bug':tone(1400,.15,'square',.03,null,null,1800);break;case'hook':tone(900,.12,'square',.05,null,null,1500);break;case'dash':noise(.2,.15,1500);tone(300,.15,'sawtooth',.04,null,null,600);break;case'splash':noise(.3,.12,3000);break;case'push':tone(110,.15,'square',.05);noise(.15,.1,500);break;case'shoot':tone(520,.08,'triangle',.04,null,null,300);break;case'bell':tone(330,1.4,'triangle',.12);tone(495,1.2,'sine',.06);break;case'organ':[392,494,587,784].forEach((f,i)=>tone(f,.6,'triangle',.05,null,t+i*.05));break;case'flap':for(let i=0;i<6;i++)noise(.05,.12,2500,t+i*.06);break;case'lantern':tone(600,.2,'sine',.06,null,null,900);break;case'light':tone(784,.1,'triangle',.08);tone(1175,.3,'triangle',.08,null,t+.08);break;}}
const SONGS={
  city:{bpm:84,ch:[[57,60,64,67],[53,57,60,64],[55,59,62,67],[52,55,59,64]],arp:'triangle',lv:.05},
  night:{bpm:66,ch:[[50,53,57,60],[46,50,53,57],[48,52,55,59],[45,48,52,55]],arp:'sine',lv:.045},
  dungeon:{bpm:72,ch:[[45,48,52],[44,48,51],[43,46,50],[44,47,52]],arp:'sine',lv:.04},
  boss:{bpm:132,ch:[[40,43,47],[41,44,48],[40,43,47],[38,42,45]],arp:'square',lv:.035},
  title:{bpm:70,ch:[[57,60,64,69],[53,57,60,65],[55,58,62,67],[52,56,59,64]],arp:'triangle',lv:.045}};
const mf=n=>440*Math.pow(2,(n-69)/12);
function musicTick(){if(!ac||ac.state!='running')return;const want=mode=='title'?'title':!lv?'city':boss&&!boss.dead&&lv.id.startsWith('quarry:1,0')?'boss':lv.room?'dungeon':dark()>.6?'night':'city';
  if(want!=musicOn){musicOn=want;step=0;nextBeat=ac.currentTime+.1;}const S=SONGS[musicOn],beat=60/S.bpm/2;
  while(nextBeat<ac.currentTime+.25){const ch=S.ch[Math.floor(step/16)%S.ch.length],i=step%16;
    if(i==0)for(const n of ch){tone(mf(n),beat*15,'sawtooth',S.lv*.35,musicBus,nextBeat);tone(mf(n)*1.004,beat*15,'triangle',S.lv*.4,musicBus,nextBeat);}
    if(i%2==0||musicOn=='boss')tone(mf(ch[(i>>1)%ch.length]+12),beat*1.6,S.arp,S.lv,musicBus,nextBeat);
    if(i%8==0)tone(mf(ch[0]-12),beat*6,'triangle',S.lv*1.6,musicBus,nextBeat);
    if(musicOn=='boss'&&i%4==0)tone(60,beat,'sine',.12,musicBus,nextBeat,30);
    nextBeat+=beat;step++;}}
