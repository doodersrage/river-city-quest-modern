// The whole story in order. For every goal the map names: the district can be walked to from the last one, the person or door
// it points at stands on ground that joins the rest of the district, and it opens with what you hold by then and not before.
// The insides of the dungeons and the boss fights are played in dungeons.test.js and playthrough.test.js; here their prizes are handed over.
const G=require('./harness.js');const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;};
const step=(o,n)=>{for(let i=0;i<(n||1);i++){clr();I.x=I.z=0;Object.assign(I,o||{});G.update();}clr();I.x=I.z=0;};
const talkThrough=()=>{for(let k=0;k<300&&G.dlg;k++){if(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1){G.dlg.n=999;G.dlg.sel=G.dlg.choices.length-1;}step({a:1});step({},2);}};
const rest=()=>{for(let k=0;k<200&&(G.trans||G.dlg);k++){if(G.dlg)talkThrough();else step();}};
const dirInput=(dx,dz)=>{const cy=G.cam.yaw,l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;return{x:dx*Math.cos(cy)+dz*-Math.sin(cy),z:-(dx*-Math.sin(cy)+dz*-Math.cos(cy))};};
const walkTo=(x,z,max)=>{for(let k=0;k<(max||600);k++){const dx=x-G.p.x,dz=z-G.p.z;if(Math.hypot(dx,dz)<.4||G.trans)return true;step(dirInput(dx,dz));if(G.dlg)return true;}return false;};
const face=(x,z)=>{G.p.yaw=Math.atan2(x-G.p.x,z-G.p.z);};
const WH=require('./worldhelp.js')(G);
const SIDE={'1,0':'e','-1,0':'w','0,1':'s','0,-1':'n'},xy=id=>id.slice(3).split(',').map(Number),name=id=>G.RCQ.maps[id].name;
const calm=()=>{G.enemies.length=0;G.p.inv=999;G.p.hp=G.st.hp=G.st.max;};
// one step to the district next door: stand at an edge that joins the rest of the place and walk off it
function hop(side){const from=G.lv.id,q=WH.edgeSpot(side,true);if(!q)return'no way to the '+side+' edge of '+name(from);const dx=side=='e'?9:side=='w'?-9:0,dz=side=='s'?9:side=='n'?-9:0;for(let k=0;k<3&&G.lv.id==from;k++){calm();G.p.x=q[0];G.p.z=q[1];walkTo(q[0]+dx,q[1]+dz,300);rest();}calm();return G.lv.id;}
// the districts to pass through, shortest first; the south bank is left out until you have a boat
function route(a,b){const prev={[a]:null},Q=[a];while(Q.length){const c=Q.shift();if(c==b)break;const [x,y]=xy(c);for(const k in SIDE){const [dx,dy]=k.split(',').map(Number),n='ow:'+(x+dx)+','+(y+dy);if(n in prev||!G.sceneData(n))continue;if(y+dy>=3&&!G.st.items.kayak)continue;prev[n]=c;Q.push(n);}}if(!(b in prev))return null;const out=[];for(let c=b;c!=a;c=prev[c])out.unshift(c);return out;}
function travel(to){const r=route(G.lv.id,to);if(!r)return false;for(const n of r){const [x,y]=xy(G.lv.id),[nx,ny]=xy(n),got=hop(SIDE[(nx-x)+','+(ny-y)]);if(got!=n){console.log('  stuck going from '+name(G.lv.id)+' to '+name(n)+': '+got);return false;}}return G.lv.id==to;}
// open ground beside a point that joins the rest of the district
function beside(x,z,r){const w=G.lv.world;for(let R=1;R<=(r||2.2);R+=.3)for(let a=0;a<16;a++){const px=x+Math.sin(a/16*6.283)*R,pz=z+Math.cos(a/16*6.283)*R;if(!G.blockedCircle(px,pz,.5)&&(!w||G.onMain(w,px,pz)))return[px,pz];}return null;}
function talkTo(kind){const n=G.npcs.find(n=>n.talk==kind);if(!n)return'nobody';const q=beside(n.x,n.z);if(!q)return'cut off';calm();G.p.hold=0;G.p.x=q[0];G.p.z=q[1];face(n.x,n.z);step({a:1});talkThrough();rest();return'ok';}
// walk into a door from the ground in front of it; says where you end up
function tryDoor(to){const d=WH.door(to);if(!d)return'no door';if(!G.onMain(G.lv.world,d.x+d.nx*1.6,d.z+d.nz*1.6)&&!beside(d.x+d.nx*1.6,d.z+d.nz*1.6,1.5))return'cut off';calm();G.p.lockT=0;G.p.bumpT=0;WH.atDoor(to);walkTo(d.x-d.nx,d.z-d.nz,120);rest();return G.lv.id;}
const outside=id=>{const r=G.st.ret;if(r&&r[0]==id)G.loadScene(id,r[1],r[2],0);else G.loadScene(id,200,150,0);G.settle();rest();calm();};
// set a keg down in front of a sealed door and stand back
function blast(to){const d=WH.door(to);calm();G.p.x=d.x+d.nx*2.6;G.p.z=d.z+d.nz*2.6;G.p.yaw=Math.atan2(-d.nx,-d.nz);G.st.eq='powder';step({b:1});G.p.x=d.x+d.nx*12;G.p.z=d.z+d.nz*12;step({},160);calm();}
const goal=(id,why)=>ok(G.goalScene()==id,'the goal is '+(id?name(id):'nothing more')+' ('+why+'): "'+G.goalText()+'"');
const goTo=id=>{const from=name(G.lv.id);ok(travel(id),'walk from '+from+' to '+name(id));};

G.startGame(null);rest();calm();
goal('ow:2,1','a new game');ok(talkTo('archivist')=='ok'&&G.st.items.lantern,'the archivist can be reached and gives the lantern');

// 1. Belle Isle and the quarry
goal('ow:2,2','with the lantern');
// before the quarry: the things later goals need are still shut
G.loadScene('ow:1,2',200,150,0);G.settle();rest();{const d=WH.door('pyramid:0,1');ok(d&&d.sealed,'the pyramid door is sealed with rubble');ok(tryDoor('pyramid:0,1')=='ow:1,2','without powder the pyramid stays shut');}
G.loadScene('ow:2,1',200,150,0);G.settle();rest();
for(const id of ['ow:0,2','ow:1,2','ow:2,2','ow:3,2']){G.loadScene(id,200,150,0);G.settle();rest();const got=hop('s');ok(got==id,'without a boat you cannot walk south out of '+name(id)+' to the far bank ('+(got==id?'held back':'ended up in '+(G.RCQ.maps[got]?name(got):got))+')');}
G.loadScene('ow:2,1',200,150,0);G.settle();rest();
goTo('ow:2,2');ok(tryDoor('quarry:0,1')=='quarry:0,1','the quarry door opens');
G.give('powder');G.st.ammo.powder=8;G.st.got.granite=1;outside('ow:2,2');

// 2. the pyramid in Hollywood Cemetery
goal('ow:1,2','with the granite keystone');goTo('ow:1,2');
blast('pyramid:0,1');ok(tryDoor('pyramid:0,1')=='pyramid:0,1','a powder keg clears the rubble and the pyramid opens');
G.st.got.iron=1;outside('ow:1,2');

// 3. the Poe Museum cellar
goal('ow:3,1','with the iron keystone');goTo('ow:3,1');ok(tryDoor('poe:1,2')=='poe:1,2','the Poe Museum cellar door opens');
G.st.got.brick=1;outside('ow:3,1');

// 4. the Carillon: locked, then a chain of trades for a boat, then the key from across the river
goal('ow:0,2','with the brick keystone');goTo('ow:0,2');
ok(tryDoor('carillon:1,2')=='ow:0,2','the Carillon is locked without its key');rest();ok(talkTo('caretaker')=='ok','the caretaker can be reached');
goTo('ow:0,1');ok(talkTo('vendor')=='ok'&&G.st.trade=='melon','the melon vendor in Carytown hands over a watermelon');
goal('ow:2,0','holding the watermelon');goTo('ow:2,0');ok(talkTo('musician')=='ok'&&G.st.trade=='music','the musician in Jackson Ward trades it for sheet music');
goal('ow:0,1','holding the sheet music');goTo('ow:0,1');ok(tryDoor('byrd:0,0')=='byrd:0,0','the Byrd Theatre door opens');
ok(talkTo('organist')=='ok'&&G.st.trade=='rivermap','the organist trades it for a river map');outside('ow:0,1');
goal('ow:2,2','holding the river map');goTo('ow:2,2');ok(talkTo('kayaker')=='ok'&&G.st.items.kayak,'the kayaker on Belle Isle trades it for a kayak');
goal('ow:1,3','with the kayak');goTo('ow:1,3');
{const k=G.picks.find(k=>k.kind=='carkey');const q=k&&beside(k.x,k.z,1.5);ok(!!q,'the Carillon key lies on ground you can reach');if(k){calm();G.p.x=k.x;G.p.z=k.z;step({},20);talkThrough();rest();}ok(G.st.got.carkey,'picking it up');}
goal('ow:0,2','with the Carillon key');goTo('ow:0,2');ok(tryDoor('carillon:1,2')=='carillon:1,2','the key opens the Carillon');
G.st.got.bronze=1;outside('ow:0,2');

// 5. the tunnel on Church Hill
goal('ow:3,0','with all four keystones');goTo('ow:3,0');
G.st.got.bronze=0;ok(tryDoor('tunnel:0,1')=='ow:3,0','three keystones do not open the tunnel');rest();G.st.got.bronze=1;
ok(tryDoor('tunnel:0,1')=='tunnel:0,1','four keystones open the tunnel');rest();
G.st.f.won=1;outside('ow:3,0');

// 6. after the credits
goal('ow:1,2','after the tunnel');goTo('ow:1,2');ok(tryDoor('tredegar:0,2')=='tredegar:0,2','Tredegar Iron Works opens');G.st.f['boss:tredegar:0,0']=1;outside('ow:1,2');
goal('ow:1,-1','after Tredegar');goTo('ow:1,-1');ok(tryDoor('conserv:0,2')=='conserv:0,2','the conservatory opens');G.st.f['boss:conserv:0,0']=1;outside('ow:1,-1');
goal('ow:3,3','after the conservatory');
for(const [id,part] of [['ow:0,3','oar'],['ow:0,3','pole'],['ow:3,3','tiller']]){if(G.lv.id!=id)goTo(id);const k=G.picks.find(k=>k.id==part);const q=k&&beside(k.x,k.z,1.5);if(k){calm();G.p.x=k.x;G.p.z=k.z;step({},20);talkThrough();rest();}ok(!!q&&G.st.got[part],'the bateau '+part+' in '+name(id)+' can be reached and picked up');}
ok(talkTo('historian')=='ok'&&G.st.f.bateau,'the historian at Ancarrow\'s Landing rebuilds the bateau');
goal(null,'with everything done');

// the other sealed doors: shut until blasted
for(const [id,to] of [['ow:3,0','libby:0,0'],['ow:2,2','ruins:0,0']]){G.loadScene(id,200,150,0);G.settle();rest();const d=WH.door(to);ok(d&&d.sealed&&tryDoor(to)==id,name(id)+': the door to '+to+' is sealed');rest();blast(to);ok(tryDoor(to)==to,'and a powder keg opens it');}

// every door in every district lets you back out onto ground that joins the rest of the place
{let n=0,bad=[];for(const id in G.RCQ.maps){if(G.RCQ.maps[id].area!='ow')continue;G.loadScene(id,200,150,0);G.settle();rest();for(const d of G.lv.doors||[]){n++;const x=d.x+d.nx*1.3,z=d.z+d.nz*1.3;if(G.blockedCircle(x,z,.45)||!G.onMain(G.lv.world,x,z))bad.push(name(id)+' > '+d.to);}}
  ok(n>=30&&!bad.length,'all '+n+' doors open onto reachable ground'+(bad.length?': not '+bad.join(', '):''));}

// old saves: wherever they were made, Continue puts you somewhere you can walk from
const standing=()=>{const w=G.lv.world;return!G.blockedCircle(G.p.x,G.p.z,.45)&&(!w||G.onMain(w,G.p.x,G.p.z));};
function resave(change){G.startGame(null);rest();change(G.st);const x=G.st.x,z=G.st.z;G.p.x=x;G.p.z=z;G.saveGame();const s=G.loadSave();if(!s)return false;G.startGame(s);rest();calm();return true;}
ok(resave(s=>{delete s.poly;s.scene='ow:1,1';s.x=41;s.z=29;})&&G.lv.id=='ow:1,1'&&standing(),'a save from the old street grid loads onto open ground in the same district');
ok(resave(s=>{delete s.poly;delete s.big;s.scene='ow:0,1';s.x=11;s.z=9;})&&G.lv.id=='ow:0,1'&&standing(),'a save from before the maps grew does too');
ok(resave(s=>{delete s.poly;s.scene='byrd:0,0';s.x=16;s.z=14;s.ret=['ow:0,1',30,22,0];})&&G.lv.id=='byrd:0,0'&&standing(),'a save made indoors loads indoors');
{const r=G.st.ret;G.loadScene(r[0],r[1],r[2],r[3]||0);G.settle();rest();ok(G.lv.id=='ow:0,1'&&standing(),'and its way out leads to open ground');}
ok(resave(s=>{s.scene='ow:2,3';s.x=200;s.z=150;})&&G.lv.id=='ow:2,3'&&!G.st.items.kayak&&hop('n')=='ow:2,2','a save left on the south bank without a boat can still walk back north');
ok(resave(s=>{s.scene='ow:2,2';s.x=3;s.z=297;s.items.kayak=1;})&&standing(),'a save made with the boat loads');
