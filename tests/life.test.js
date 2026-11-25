// Everyday Richmond: the dog, the market and the stove, fishing, photos, the bike, stashes, weather and frogs.
const G=require('./harness.js'),T=G.TS;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const I=G.inp,clr=()=>{I.a=I.b=I.item=I.menu=I.start=I.up=I.down=I.left=I.right=0;I.x=I.z=0;I.ah=I.bh=0;};
const step=(o,n)=>{for(let i=0;i<(n||1);i++){clr();Object.assign(I,o||{});G.update();}clr();};
const talkThrough=(pick)=>{for(let k=0;k<200&&G.dlg;k++){G.dlg.n=999;if(G.dlg.choices&&G.dlg.i==G.dlg.lines.length-1)G.dlg.sel=pick||0;step({a:1});step({},2);}};
const settle=()=>{for(let k=0;k<80&&(G.trans||G.dlg);k++){if(G.dlg)talkThrough(0);else step();}};
const face=(x,z)=>{G.p.yaw=Math.atan2(x-G.p.x,z-G.p.z);};
const talk=(n,pick)=>{for(const [ox,oz] of [[0,1.6],[1.6,0],[-1.6,0],[0,-1.6]]){G.p.x=n.x+ox;G.p.z=n.z+oz;face(n.x,n.z);step({a:1});if(G.dlg||G.shop)break;}talkThrough(pick);};
// keep the bot safe from wandering geese and night ghosts while it runs errands
const go=(id,x,z)=>{G.loadScene(id,x,z,0);step({},2);talkThrough();G.p.inv=1e9;for(const e of G.enemies)e.dead=true;};
G.startGame(null);settle();G.st.coins=300;

ok(G.EXTRA_NPCS.length==4,'four new townspeople found a spot: '+G.EXTRA_NPCS.map(n=>n.who).join(', '));

// the shelter dog
go('ow:2,3',10*T,10*T);const vol=G.npcs.find(n=>n.talk=='shelter');talk(vol,2);
ok(G.st.dog&&G.st.dog.name=='Peanut'&&G.dog,'adopt a dog at the shelter and name it Peanut');
for(let i=0;i<120;i++)step({x:1});ok(Math.hypot(G.dog.x-G.p.x,G.dog.z-G.p.z)<5,'the dog keeps up when you walk');

// the market, the stove and the picnic basket
go('ow:3,1',10*T,10*T);const gro=G.npcs.find(n=>n.talk=='grocer');talk(gro);ok(G.shop&&G.shop.k=='market','the Market Grocer opens the 17th Street Market');
const buy=name=>{G.shop.cur=G.SHOPS.market.items.findIndex(i=>i.name==name);step({a:1});};
buy('Picnic Basket');buy('Virginia Ham');buy('Bag of Flour');step({b:1});talkThrough();
ok(G.st.items.basket&&G.st.ingr.ham==1&&G.st.ingr.flour==1&&G.st.food.cupcake==1,'buy a picnic basket (with a cupcake), ham and flour');
go('rowhouse:0,0',10.5*T,3*T);G.p.x=10.5*T;G.p.z=3.3*T;G.p.yaw=Math.PI;step({a:1});talkThrough(0);
ok(G.st.food.biscuit==1&&G.st.ingr.ham==0,'cook a ham biscuit on the stove at home');
G.p.hp=1;G.st.eq='basket';step({b:1});talkThrough(G.st.food.cupcake?1:0);ok(G.p.hp>=5,'eat it from the basket and heal ('+G.p.hp+' hearts)');

// sleeping at home
G.p.x=13.5*T;G.p.z=6.2*T;G.p.yaw=0;const c0=G.st.clock;step({a:1});talkThrough(0);ok(G.st.clock>c0,'sleep in your own bed until morning');

// the camera and the album
G.st.items.camera=1;go('ow:2,1',39*T,20*T);G.st.eq='camera';step({b:1});ok(G.st.photos&&G.st.photos.capitol,'photograph the Capitol');

// fishing
G.st.items.rod=1;go('ow:2,2',8*T,8*T);const g=G.lv.g;let spot=null;
for(let y=1;y<g.length-1&&!spot;y++)for(let x=1;x<g[0].length-1;x++)if(g[y][x]=='w'&&G.walkable(g[y+2]&&g[y+2][x])){spot=[x,y+2];break;}
let tries=0,bit=false,cast=false;
for(;tries<6&&!Object.keys(G.st.fish||{}).length;tries++){G.p.x=spot[0]*T+T/2;G.p.z=spot[1]*T+T/2;G.p.yaw=Math.PI;G.st.eq='rod';step({b:1});cast=cast||!!(G.fish&&G.fish.ph=='wait');
  for(let k=0;k<400&&G.fish&&G.fish.ph=='wait';k++)step();bit=bit||!!(G.fish&&G.fish.ph=='bite');step({a:1});
  for(let k=0;k<3000&&G.fish;k++){const f=G.fish;if(f.ph=='reel'&&f.ten<(f.run?25:55)&&k%3==0)step({a:1});else step();}talkThrough();step({},100);}
ok(cast,'cast into the James');ok(bit,'something bites');ok(Object.keys(G.st.fish||{}).length==1,'reel it in: '+Object.keys(G.st.fish||{}).join('')+' (try '+tries+')');

// the bike
G.st.items.bike=1;go('ow:3,1',16*T,9*T);G.cam.yaw=Math.PI/2;G.cam.manual=999;let p0=[G.p.x,G.p.z];for(let i=0;i<20;i++)step({z:-1});const walkD=Math.hypot(G.p.x-p0[0],G.p.z-p0[1]);
G.st.eq='bike';step({b:1});G.p.x=p0[0];G.p.z=p0[1];for(let i=0;i<20;i++)step({z:-1});const rideD=Math.hypot(G.p.x-p0[0],G.p.z-p0[1]);ok(G.st.riding&&rideD>walkD*1.2,'the bike is faster than walking ('+walkD.toFixed(1)+' vs '+rideD.toFixed(1)+')');
step({b:1});

// a hidden stash
const sid=Object.keys(G.SECRETS)[0],[sx,sz]=G.SECRETS[sid];go(sid,sx*T+T/2,sz*T+T/2+1.5);const c1=G.st.coins;G.p.x=sx*T+T/2;G.p.z=sz*T+T/2;step({},15);
ok(G.st.got['sec:'+sid]&&G.st.coins==c1+25,'dig up a hidden stash in '+G.RCQ.maps[sid].name+' (+25 coins)');
ok(Object.keys(G.SECRETS).length>=20,Object.keys(G.SECRETS).length+' neighborhoods hide a stash');

// rain, and the frogs that come out in it
go('ow:0,2',10*T,10*T);G.st.wx='rain';G.st.wxk=1;G.st.wxT=99999;G.st.wxNext=null;const e=G.weatherLook({fog:[14,40],fogCol:[.6,.7,.8],amb:1});ok(e.fog[1]<40&&e.amb<1,'rain pulls the fog in and dims the light');
for(let k=0;k<1200&&G.picks.filter(q=>q.kind=='frog').length<3;k++)step();const frogs=G.picks.filter(q=>q.kind=='frog');ok(frogs.length==3,'frogs come out by the water in the rain');
for(let n=0,guard=0;n<5&&guard<400;guard++){talkThrough();if(G.lv.id!='ow:0,2')go('ow:0,2',10*T,10*T);const f=G.picks.find(q=>q.kind=='frog'&&q.x>2*T&&q.z>2*T&&q.x<(G.lv.w-2)*T&&q.z<(G.lv.h-2)*T);if(!f){step({},90);continue;}G.p.x=f.x;G.p.z=f.z;step({},2);n=G.st.frogs||0;if(G.st.frogs>=5)break;}
const nat=G.npcs.find(n=>n.talk=='naturalist');const c2=G.st.coins;talk(nat);ok(G.st.f.frogsDone&&G.st.coins==c2+40,'bring five frogs to the naturalist');
G.st.wx='clear';G.st.wxk=0;

// fireflies on a clear summer night in a leafy park
G.st.clock=G.CYC*.7;go('ow:0,2',10*T,10*T);step({},5);ok(G.fireflies.length>0,'fireflies come out at night in Byrd Park');

// First Friday on Broad Street
G.st.clock=G.CYC*(4+.7);go('ow:1,0',10*T,10*T);ok(G.firstFriday()&&G.npcs.some(n=>n.talk=='curator'),'on Friday night the curator is out for First Friday');
const cur=G.npcs.find(n=>n.talk=='curator');talk(cur);for(const k of G.picks.filter(q=>q.kind=='painting')){G.p.x=k.x;G.p.z=k.z;step({},15);}
go('ow:2,0',10*T,10*T);for(const k of G.picks.filter(q=>q.kind=='painting')){G.p.x=k.x;G.p.z=k.z;step({},15);}
go('ow:1,0',10*T,10*T);const cur2=G.npcs.find(n=>n.talk=='curator');talk(cur2);ok(G.st.f.gallery,'find the three lost paintings for the gallery show');

// the festival host knows what month it is
G.fakeDate=new Date(2026,9,10);ok(G.events().includes('folk'),'October brings the Folk Festival');G.fakeDate=new Date(2026,11,10);ok(G.events().includes('lights'),'December brings holiday lights');G.fakeDate=null;

// the album page and saving
G.saveGame();const s=G.loadSave();ok(s.dog&&s.photos&&s.fish&&s.f.frogsDone,'the dog, photos, fish and frogs are saved');
