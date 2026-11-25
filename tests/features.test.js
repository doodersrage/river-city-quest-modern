// Side content: reading markers, the four neighborhood challenges, bushes, chests, night, dying and the menu.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;};
// a swing next to a shopkeeper opens their shop, which would stall the bot: close it
const step=(o,n)=>{for(let i=0;i<(n||1);i++){clr();I.x=I.z=0;Object.assign(I,o||{});if(G.shop)G.shop=null;G.update();}clr();I.x=I.z=0;};
const talkThrough=pick=>{for(let k=0;k<200&&G.dlg;k++){if(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1){G.dlg.n=999;G.dlg.sel=pick||0;}step({a:1});step({},2);}};
const face=(x,z)=>{G.p.yaw=Math.atan2(x-G.p.x,z-G.p.z);};
const go=(id,tx,tz)=>{G.loadScene(id,tx*T+T/2,tz*T+T/2,0);step({},40);G.dlg=null;G.enemies.length=0;G.p.hold=0;G.p.swing=0;};
const talk=who=>{const n=G.npcs.find(n=>n.talk==who||n.chal==who);G.p.x=n.x;G.p.z=n.z+1.6;n.x=n.hx;face(n.x,n.z);G.p.swing=0;step({a:1});return n;};
G.startGame(null);G.dlg=null;G.st.items.lantern=1;G.st.eq='lantern';
// markers
go('ow:2,1',22,9);const [mx,mz]=Object.keys(G.lv.markers).find(k=>G.lv.markers[k]=='capitol').split(',').map(Number);G.p.x=mx*T+T/2;G.p.z=(mz+1)*T+T/2+.2;face(mx*T+T/2,mz*T+T/2);G.p.swing=0;step({a:1});
ok(G.dlg&&G.dlg.who==G.RCQ.lore.capitol.t,'reading the Capitol marker ('+G.RCQ.lore.capitol.t+')');talkThrough();ok(G.st.lore.capitol,'it goes in the journal');
// lamps on Church Hill
go('ow:3,0',16,10);ok(G.lv.lamps.length>=4&&G.lv.lamps.every(l=>!l.lit),'Church Hill\'s gas lamps are out');talk('lamps');talkThrough(0);ok(G.chal&&G.chal.id=='lamps','the lamplighter\'s challenge starts');
for(const L of G.lv.lamps){G.p.x=L.tx*T+T/2;G.p.z=(L.ty+1)*T+T/2;G.p.hold=0;step({b:1});step({},2);}talkThrough();ok(G.st.pins.lamps&&G.lv.lamps.every(l=>l.lit),'lighting every lamp wins the pin');
// market rats in Shockoe
go('ow:3,1',16,10);talk('rats');talkThrough(0);ok(G.chal&&G.enemies.filter(e=>e.chal).length==8,'eight market rats');
for(const e of G.enemies.filter(e=>e.chal)){for(let j=0;j<4&&!e.dead;j++){G.p.x=e.x-1;G.p.z=e.z;e.x=G.p.x+1;face(e.x,e.z);G.p.inv=999;G.p.swing=0;step({a:1});step({},20);talkThrough();}}
G.p.inv=0;ok(G.st.pins.rats,'clearing the rats wins the pin');
// river cleanup on Belle Isle
go('ow:2,2',16,8);talk('cleanup');talkThrough(0);const tr=G.picks.filter(k=>k.kind=='trash');ok(tr.length==6,'six pieces of trash');for(const k of tr){G.p.x=k.x;G.p.z=k.z;step({},12);talkThrough();}ok(G.st.pins.cleanup,'picking it all up wins the pin');
// time runs out
go('ow:3,1',16,10);talk('rats');talkThrough(0);G.p.inv=1e9;step({},G.chal.t+60);G.p.inv=0;talkThrough();ok(!G.chal&&G.enemies.filter(e=>e.chal).length==0,'running out of time ends the challenge');
// the history quiz: answer with your journal
for(const id in G.RCQ.lore)G.st.lore[id]=1;go('ow:2,1',16,9);talk('quiz');for(let k=0;k<20&&G.dlg&&G.dlg.who=='Richmond History Quiz';k++){if(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1){G.dlg.n=999;G.dlg.sel=0;}step({a:1});step({},2);}
for(let q=0;q<3&&G.dlg;q++){for(let k=0;k<10&&G.dlg&&!(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1);k++){step({a:1});step({},2);}
  const d=G.dlg,quote=d.lines[1].replace(/^"|"$/g,'').replace(/\.\.\.$/,''),right=d.choices.findIndex(t=>{const L=Object.values(G.RCQ.lore).find(l=>l.t==t);return L&&L.s.startsWith(quote.replace(/\.$/,''));});d.n=999;d.sel=Math.max(0,right);step({a:1});step({},2);}
talkThrough();ok(G.st.pins.quiz,'three right answers win the quiz pin');
// bushes and the corner chest
go('ow:2,1',4,19);const bush=G.lv.dyn.find(o=>o.kind=='bush'&&o.on);G.p.x=bush.tx*T+T/2;G.p.z=(bush.ty-1)*T+T/2;face(bush.tx*T+T/2,bush.ty*T+T/2);if(G.lv.g[bush.ty-1][bush.tx]!='b'){G.p.swing=0;step({a:1});step({},20);}
ok(!bush.on&&G.walkable(G.lv.g[bush.ty][bush.tx]),'the paddle cuts through a bush');
// night brings ghosts, and the lantern glows
G.st.clock=G.CYC*.7;go('ow:3,1',16,10);G.loadScene('ow:3,1',16*T,10*T,0);ok(G.dark()>.6&&G.enemies.some(e=>e.type=='ghost'),'ghosts come out after dark');G.st.clock=2400;
// dying sends you back to where you came in
go('ow:3,1',16,10);G.enemies.length=0;G.p.hp=1;G.p.inv=0;const r=G.enemies.push(Object.assign({},{type:'rat',x:G.p.x+.3,z:G.p.z,y:0,hp:1,max:1,yaw:0,t:0,kx:0,kz:0,flash:0,state:'idle',st:0}));step({},3);ok(G.deathT>0,'losing your last heart');step({},100);ok(G.p.hp==G.st.max,'you get back up with full hearts');
// the pause menu
step({menu:1});ok(G.menu&&G.menu.tab==0,'MENU opens the pause menu');step({right:1});step({right:1});ok(G.menu.tab==2,'tabs flip to the map');step({menu:1});ok(!G.menu,'and close');
// pigeons scatter when you walk up
go('ow:2,1',4,3);const pg=G.birds;ok(pg.length>=5,'pigeons peck around Capitol Square ('+pg.length+')');const b0=pg[0];G.p.x=b0.x+5;G.p.z=b0.z;step({},5);ok(b0.state=='peck','they stay put while you keep your distance');
G.p.x=b0.x+1;G.p.z=b0.z;step({},5);ok(b0.state=='fly','and scatter when you come close');step({},200);ok(b0.state=='gone','then fly off over the rooftops');
// the bigger maps play: the jog opens into a run, streets count as you walk them, and the new ground has life on it
{const run=(n,o)=>{for(let i=0;i<n;i++){I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;I.x=I.z=0;Object.assign(I,o||{});G.update();}};
G.loadScene('ow:2,1',20*T,8*T,0);for(let k=0;k<60&&(G.trans||G.dlg);k++){if(G.dlg)G.dlg=null;run(1);}G.enemies.length=0;G.st.sts={};const c0=G.st.coins||0,x0=G.p.x;G.p.runT=0;
run(30,{x:1});const slow=G.p.sprint;run(150,{x:1});ok(slow<1.05&&G.p.sprint>1.4,'keep moving on a clear street and the jog becomes a run ('+G.p.sprint.toFixed(2)+'x)');
ok(Object.keys(G.st.sts).length>=1&&G.st.coins>=c0+5,'walking a named street for the first time counts and pays ('+Object.keys(G.st.sts).join(', ')+')');
const M=G.RCQ.maps;let nb=0,st2=0,foes=0;for(const id in M){if(id.indexOf('ow:'))continue;nb+=M[id].npcs.filter(n=>n.who=='Neighbor').length;st2+=M[id].chests.filter(c=>c.id.indexOf('ch:big:')==0).length;foes+=M[id].en.filter(e=>e[1]<15||e[1]>48||e[2]<10||e[2]>33).length;}
ok(nb>=30&&st2>=30&&foes>=40,nb+' neighbors on the named streets, '+st2+' stashes and '+foes+' enemies out on the new ground');}
// traffic: cars keep to their lanes, stop on red, wait for someone crossing, and never sit on a parked car
{const run=(n)=>{for(let i=0;i<n;i++){I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;I.x=I.z=0;G.update();}};
G.loadScene('ow:0,1',20*T,8*T,0);for(let k=0;k<60&&(G.trans||G.dlg);k++){if(G.dlg)G.dlg=null;run(1);}G.enemies.length=0;const TR=G.traffic();ok(TR.cars.length>=8&&TR.lanes.length>=6&&TR.walkers.length>=4,TR.cars.length+' cars on '+TR.lanes.length+' lanes and '+TR.walkers.length+' people out walking in Carytown');
const s0=TR.cars.map(c=>c.s);let ran=0,bump=0;for(let k=0;k<900;k++){run(1);const C=G.traffic().cars;
  for(const c of C)for(const sp of c.lane.stops){const dd=(sp-c.s)*c.lane.dir;if(dd<-.6&&dd>-1.6&&G.sigState(c.lane.ax)==0&&c.v>.03)ran++;}
  for(const c of C){const x=c.lane.ax=='x'?c.s:c.lane.line,z=c.lane.ax=='x'?c.lane.line:c.s;for(const pr of G.lv.props)if(pr.kind=='car'&&Math.abs(pr.x-x)<pr.solid[0]+(c.lane.ax=='x'?2:.8)&&Math.abs(pr.z-z)<pr.solid[1]+(c.lane.ax=='x'?.8:2))bump++;}}
const moved=G.traffic().cars.filter((c,i)=>Math.abs(c.s-s0[i])>4).length;ok(moved>=TR.cars.length*.7,moved+' of them drove on');ok(!ran,'nobody ran a red light');ok(!bump,'and no moving car touched a parked one');
const c=G.traffic().cars[0],L=c.lane;c.s=L.start+(L.end-L.start)*.5;c.v=.1;for(const o of G.traffic().cars)if(o!==c&&o.lane===L)o.s=L.end-L.dir*2;G.frameSet(0);if(L.ax=='x'){G.p.x=c.s+L.dir*6;G.p.z=L.line;}else{G.p.z=c.s+L.dir*6;G.p.x=L.line;}const gap0=6;for(let k=0;k<90;k++){const px=G.p.x,pz=G.p.z;run(1);G.p.x=px;G.p.z=pz;}
const gap=((L.ax=='x'?G.p.x:G.p.z)-c.s)*L.dir;ok(c.v<.01&&gap>2.5,'a car stops for you when you step into the road ('+gap.toFixed(1)+' m short)');}
