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
