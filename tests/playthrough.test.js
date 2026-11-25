// A bot plays the opening: lantern, Belle Isle, the quarry, Old Snapper, and back to the archivist.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;};
const step=(o,n)=>{for(let i=0;i<(n||1);i++){clr();I.x=I.z=0;Object.assign(I,o||{});G.update();}clr();I.x=I.z=0;};
const talkThrough=(pick)=>{for(let k=0;k<200&&G.dlg;k++){if(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1){G.dlg.n=999;G.dlg.sel=pick||0;}step({a:1});step({},2);}};
const settle=()=>{for(let k=0;k<80&&(G.trans||G.dlg);k++){if(G.dlg)talkThrough(0);else step();}};
const dirInput=(dx,dz)=>{const cy=G.cam.yaw,l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;return{x:dx*Math.cos(cy)+dz*-Math.sin(cy),z:-(dx*-Math.sin(cy)+dz*-Math.cos(cy))};};
const walkTo=(x,z,max)=>{for(let k=0;k<(max||600);k++){const dx=x-G.p.x,dz=z-G.p.z;if(Math.hypot(dx,dz)<.4||G.trans)return true;step(dirInput(dx,dz));if(G.dlg)return true;}return false;};
const face=(x,z)=>{G.p.yaw=Math.atan2(x-G.p.x,z-G.p.z);};
const tile=(tx,tz)=>[tx*T+T/2,tz*T+T/2];
const killAll=()=>{for(let k=0;k<40;k++){const e=G.enemies.find(e=>!e.dead&&e.type!='turtle');if(!e)break;for(let j=0;j<6&&!e.dead;j++){G.p.x=e.x-1;G.p.z=e.z;e.x=G.p.x+1;e.z=G.p.z;face(e.x,e.z);G.p.inv=999;step({a:1});step({},20);}}G.p.inv=0;};
G.startGame(null);settle();ok(G.lv.id=='ow:2,1'&&G.st.items.lantern==undefined,'new game in Capitol Square');
// the archivist hands over the lantern
const ar=G.npcs.find(n=>n.talk=='archivist');G.p.x=ar.x;G.p.z=ar.z+1.6;face(ar.x,ar.z);step({a:1});talkThrough();talkThrough();ok(G.st.items.lantern,'the archivist gives you the lantern');
ok(G.goalScene()=='ow:2,2','the map points to Belle Isle');
// walk south off the map onto Belle Isle
G.p.x=32*T;G.p.z=42*T;settle();walkTo(32*T,44*T+2,300);settle();ok(G.lv.id=='ow:2,2','walk south from Capitol Square onto Belle Isle');
// every edge leads somewhere now
G.loadScene('ow:2,1',1,21*T+1,0);settle();walkTo(-1,21*T+1,120);settle();ok(G.lv.id=='ow:1,1','west of Capitol Square is '+G.lv.d.name);
// into the quarry
G.loadScene('ow:2,2',35*T+T/2,17*T+T/2,Math.PI);settle();walkTo(35*T+T/2,16*T+.2,200);settle();ok(G.lv.id=='quarry:0,1','bump the quarry door to go in');
ok(G.lv.g[0][7]=='L','the north door is locked');
killAll();step({},5);ok(G.st.f['clr:quarry:0,1'],'clearing the quarry floor');
const c1=G.chests.find(c=>c.id=='q1');G.p.x=c1.x;G.p.z=c1.z+1.6;face(c1.x,c1.z);step({a:1});talkThrough();ok(G.st.keys.quarry==1,'the chest that appears holds a small key');
G.p.x=8*T;G.p.z=1.5*T;G.p.yaw=Math.PI;walkTo(8*T,.6*T,80);step({},5);ok(G.lv.g[0][7]=='F'&&G.st.keys.quarry==0,'the key opens the north door');
walkTo(8*T,-.5,200);settle();ok(G.lv.id=='quarry:0,0','north into the Powder Store');ok(G.lv.g[10][7]=='F','the door is open from this side too');
killAll();step({},5);const c3=G.chests.find(c=>c.id=='q3');G.p.x=c3.x;G.p.z=c3.z+1.6;face(c3.x,c3.z);step({a:1});talkThrough();ok(G.st.items.powder&&G.st.ammo.powder==8,'the powder chest');
// bomb the cracked east wall
step({},80);G.p.x=13.5*T;G.p.z=5.5*T;G.p.yaw=Math.PI/2;G.st.eq='powder';step({b:1});G.p.x=10*T;step({},130);ok(G.lv.g[5][15]=='F','a powder keg blows open the cracked wall');
walkTo(16*T+1,5.5*T,200);settle();ok(G.lv.id=='quarry:1,0','east to Old Snapper');ok(G.boss&&G.boss.type=='turtle','Old Snapper is here');
// stand by a wall so it charges into it, then hit it while it's flipped
const b=G.boss;b.hp=G.EDEF.turtle.hp;let swings=0;
for(let k=0;k<6000&&!b.dead;k++){if(b.state=='stun'){G.p.x=b.x-2;G.p.z=b.z;face(b.x,b.z);G.p.inv=999;step({a:1});step({},20);swings++;}else{G.p.x=8*T;G.p.z=2*T;G.p.inv=999;step();}}
ok(b.dead,'Old Snapper is beaten ('+swings+' hits while stunned)');talkThrough();
const ks=G.picks.find(k=>k.kind=='keystone');G.p.inv=0;if(ks){G.p.x=ks.x;G.p.z=ks.z;step({},15);}talkThrough();ok(G.st.got.granite,'the granite keystone');
ok(G.lv.g[8][7]=='E','the way out opens');G.p.x=7.5*T;G.p.z=8.5*T;step({},100);settle();ok(G.lv.id=='ow:2,2','the stairs lead back up to Belle Isle');
// back to the archivist
G.loadScene('ow:2,1',15*T,9*T,0);settle();const a2=G.npcs.find(n=>n.talk=='archivist');G.p.x=a2.x;G.p.z=a2.z+1.6;step({},25);face(a2.x,a2.z);step({a:1});talkThrough();ok(G.mode=='play'&&G.goalScene()!='ow:2,2','the archivist sends you on to '+G.goalScene()+': '+G.goalText());
// saving and loading
G.saveGame();const s=G.loadSave();ok(s&&s.got.granite&&s.items.powder,'progress is saved');
