// A bot plays every mini-game to the end: batting, free throws, tennis, pinball and the three races.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;I.x=I.z=0;I.ah=I.bh=0;};
const step=(o)=>{clr();Object.assign(I,o||{});G.update();clr();};
const talkThrough=()=>{for(let k=0;k<200&&G.dlg;k++){G.dlg.n=999;step({a:1});step();}};
G.startGame(null);talkThrough();

function play(kind,bot,max){G.st.coins=0;G.startMini(kind);ok(G.mode=='mini'&&G.mini.kind==kind,G.MINI[kind].name+' starts');let f=0;
  for(;f<(max||20000)&&G.mode=='mini';f++)step(bot(G.mini)||{});const lines=G.dlg?G.dlg.lines.join(' '):'';talkThrough();return{f,lines};}

// batting: swing right as the pitch reaches the plate
let r=play('bat',m=>m.ball&&!m.ball.res&&m.ball.age==m.ball.arr?{a:1}:null);
ok(G.mode=='play'&&G.st.mini.bat==10&&G.st.f.slugger,'Batting: ten for ten with perfect timing ('+r.lines.slice(0,40)+')');

// free throws: shoot when the needle is in the middle
r=play('hoops',m=>!m.ball&&Math.abs(Math.sin(m.ph+m.sp))*50<4?{a:1}:null);ok(G.st.mini.hoops==10&&G.st.f.havoc,'Free throws: '+G.st.mini.hoops+' of 10');

// tennis: run to the ball and swing as it arrives, for a while, then let three go
let returns=0;r=play('tennis',m=>{const b=m.ball;if(m.ret>=16||!b||b.up)return null;const o={x:Math.max(-1,Math.min(1,(b.x-m.x)/5))};if(b.y>132&&b.y<142&&m.sw==0)o.a=1;return o;});
ok(G.st.mini.tennis>=15&&G.st.f.ace,'Tennis: '+G.st.mini.tennis+' returns');

// pinball: flap both flippers when the ball comes down near them
r=play('pin',m=>{const b=m.ball;if(!b)return null;return{ah:b.y>150&&b.x>118?1:0,bh:b.y>150&&b.x<138?1:0};},60000);
ok(G.mode=='play'&&G.st.mini.pin>0,'Pinball: game over with '+G.st.mini.pin+' points');

// the races: steer around everything ahead
const steer=m=>{if(m.count>0)return null;const ahead=m.obs.filter(o=>!o.hit&&o.y-m.y>60&&o.y-m.y<260&&o.k!='puddle'&&o.k!='oil'||!o.hit&&o.y-m.y>90&&o.y-m.y<200);
  let want=m.x;const bad=x=>ahead.some(o=>Math.abs(o.x-x)<20);if(bad(m.x)){let bestX=m.x,bd=1e9;for(let x=64;x<=192;x+=4)if(!bad(x)&&Math.abs(x-m.x)<bd){bd=Math.abs(x-m.x);bestX=x;}want=bestX;}
  return{x:Math.max(-1,Math.min(1,(want-m.x)/4))};};
for(const k of ['derby','trail','race']){r=play(k,steer);ok(G.mode=='play'&&G.st.mini[k]>0,G.MINI[k].name+': finished in '+(G.st.mini[k]/60).toFixed(1)+'s, '+r.lines.match(/(gold|silver|bronze)/)[0]);}
ok(G.st.f.derbyGold,'a clean run down Libby Hill earns gold');

// walking away mid-game
G.startMini('bat');step({menu:1});talkThrough();ok(G.mode=='play','MENU walks away from a game');

// the people who run them
const host=(scene,talk)=>{G.loadScene(scene,8*T,8*T,0);step();talkThrough();const n=G.npcs.find(q=>q.talk==talk);G.p.x=n.x;G.p.z=n.z+1.6;G.p.yaw=Math.PI;step({a:1});for(let k=0;k<20&&G.dlg&&!(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1);k++){G.dlg.n=999;step({a:1});}
  if(G.dlg){G.dlg.n=999;G.dlg.sel=0;step({a:1});}const on=G.mode=='mini';if(on){step({menu:1});talkThrough();}return on;};
ok(host('ow:3,0','racer'),'the Derby Kid on Church Hill starts the soapbox derby');
ok(host('ow:-1,0','tennis'),'the Tennis Coach on Arthur Ashe Boulevard starts tennis');
ok(host('ow:-1,-1','racedir'),'the Race Official at the Raceway starts the dash');
ok(host('siegel:0,0','hoops'),'the Rams Coach in the Siegel Center starts free throws');
G.st.items.bike=1;ok(host('ow:3,2','cyclist'),'the Trail Cyclist at Rocketts Landing starts the time trial');
G.st.pins.flies=1;G.st.items.balls=1;G.st.ammo.balls=20;ok(host('ow:0,0','ballplayer'),'the Ballplayer in Scott\'s Addition starts batting practice once you\'ve won the flies pin');
