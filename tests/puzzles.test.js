// The dungeon tools solve the puzzles they're meant for.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;I.x=I.z=0;};
const step=(o,n)=>{for(let i=0;i<(n||1);i++){clr();Object.assign(I,o||{});G.update();}clr();};
const talkThrough=()=>{for(let k=0;k<200&&G.dlg;k++){G.dlg.n=999;step({a:1});step({},2);}};
const dirInput=(dx,dz)=>{const cy=G.cam.yaw,l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;return{x:dx*Math.cos(cy)+dz*-Math.sin(cy),z:-(dx*-Math.sin(cy)+dz*-Math.cos(cy))};};
const at=(tx,tz,yaw)=>{G.p.x=tx*T+T/2;G.p.z=tz*T+T/2;G.p.yaw=yaw;step({},2);};
const use=(k)=>{G.st.eq=k;step({b:1});step({},30);talkThrough();};
const go=(room)=>{G.startGame(null);const s=G.st;for(const k of G.ITEMORDER)s.items[k]=1;s.ammo.powder=16;G.loadScene(room,8*T,8.6*T,Math.PI);step({},3);talkThrough();for(const e of G.enemies)e.dead=true;step();};
const E=Math.PI/2,W=-Math.PI/2,N=Math.PI,S=0;

// lantern: light all four braziers in the pyramid
go('pyramid:0,1');for(const [x,y] of G.lv.d.braz){at(x,y+1,N);use('lantern');}
ok(G.isSolved('pyramid:0,1'),'the lantern lights every brazier in the pyramid');
ok(G.lv.dyn.filter(o=>o.kind=='brazier').every(o=>o.lit),'  and they stay lit');
const back=r=>{G.loadScene('ow:2,1',15*T,9*T,0);step({},3);talkThrough();G.loadScene(r,8*T,8.6*T,Math.PI);step({},3);talkThrough();};
back('pyramid:0,1');ok(G.lv.dyn.filter(o=>o.kind=='brazier').every(o=>o.lit),'  even after you leave and come back');

// pushing a block onto the switch in the carillon
go('carillon:1,2');at(3,5,E);for(let k=0;k<400&&!G.isSolved('carillon:1,2');k++)step(dirInput(1,0));
ok(G.isSolved('carillon:1,2'),'push the block onto the floor switch');
back('carillon:1,2');ok(G.lv.g[5][11]=='#','  the block is still on it when you come back');

// watering can: grow the vine bridge in the conservatory
go('conserv:1,2');at(7,4,E);use('can');ok(G.lv.g[4][9]=='|'&&G.lv.g[4][11]=='|','the watering can grows a vine bridge over the pit');
for(let k=0;k<200&&G.p.x<12.3*T;k++)step(dirInput(1,0));ok(G.p.x>=12*T,'  and you can walk across it ('+(G.p.x/T).toFixed(1)+','+(G.p.z/T).toFixed(1)+')');

// grappling hook: pull yourself over the pit in Tredegar
go('tredegar:1,2');at(12,6,N);const z0=G.p.z;use('hook');step({},60);ok(G.p.z<4*T,'the hook pulls you across the pit to the post');at(12,3,S);use('hook');step({},60);ok(G.p.z>5.9*T,'  and back again');

// powder: blow the rubble and cracked walls
go('quarry:0,0');const cr=G.lv.dyn.find(o=>o.kind=='crack');if(cr){const [cx,cy]=cr.cells[0];at(cx-1,cy,E);use('powder');step({},120);ok(!cr.on,'blasting powder opens a cracked wall');}

// small keys open locked doors
go('quarry:0,1');G.st.keys.quarry=1;const lk=G.lv.dyn.find(o=>o.kind=='lock');if(lk){const [lx,ly]=lk.cells?lk.cells[0]:[lk.tx,lk.ty];at(lx,ly+1,N);for(let k=0;k<60&&lk.on;k++)step(dirInput(0,-1));ok(!lk.on&&G.st.keys.quarry==0,'a small key opens a locked door');}

// the kayak paddles across the whitewater
go('quarry:0,1');G.loadScene('ow:2,2',8*T,8*T,0);step({},3);talkThrough();
const g=G.lv.g;let w=null;for(let y=0;y<g.length&&!w;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]=='~'){w=[x,y];break;}
if(w){G.st.items.kayak=0;ok(!G.passable('~'),'whitewater blocks you without a boat');G.st.items.kayak=1;ok(G.passable('~'),'  but the kayak gets you across');}

// the shop
go('quarry:0,1');G.st.coins=100;G.shop={k:'carytown',cur:1,msg:''};step({a:1});ok(G.st.coins==96&&G.st.ammo.balls>0,'buy baseballs at the Carytown shop');step({b:1});talkThrough();ok(!G.shop,'  and leave the shop');

// bus travel between visited places
go('quarry:0,1');G.loadScene('ow:2,1',15*T,9*T,0);step({},3);talkThrough();G.st.vis['ow:3,1']=1;G.menu={tab:2,sel:0,ic:0,jc:0};const L=G.busList();G.menu.bi=L.indexOf('ow:3,1');step({a:1});for(let k=0;k<80&&G.trans;k++)step();talkThrough();
ok(G.lv.id=='ow:3,1','the GRTC bus takes you to '+G.lv.d.name);
