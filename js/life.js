"use strict";
/* River City Quest 3D: everyday Richmond. The shelter dog, the camera and photo album, your row house,
   food and the market, fishing, the bike, hidden stashes, weather, frogs, fireflies, First Friday and
   the seasons by the real calendar. No drawing to the screen here except the bits in drawLife and the glows. */

/* ---------- the calendar ---------- */
let fakeDate=null;
function today(){return fakeDate||new Date();}
function season(){const m=today().getMonth();return m==11||m<2?'winter':m<5?'spring':m<8?'summer':'fall';}
function events(){const d=today(),m=d.getMonth(),day=d.getDate(),e=[];
  if(m==11)e.push('lights');if((m==2&&day>=15)||(m==3&&day<=15))e.push('10k');if(m==9&&day<=20)e.push('folk');if(m==4&&day>=15)e.push('riverrock');if(m==6)e.push('tomato');return e;}
const WEEK=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const weekday=()=>Math.floor((st?st.clock:0)/CYC)%7;
function firstFriday(){return!!st&&weekday()==4&&dark()>.4;}
const rnd=n=>Math.floor(Math.random()*n);

/* ---------- new townspeople, placed on open ground near where the 2D game put them ---------- */
function openSpot(id,cx,cy){const d=RCQ.maps[id];if(!d)return null;const R=d.rows,taken=(d.npcs||[]).concat(EXTRA_NPCS.filter(n=>n.scene==id));let best=null;
  for(let y=1;y<d.h-1;y++)for(let x=1;x<d.w-1;x++){if(!walkable(R[y][x])||'DE'.includes(R[y][x]))continue;if(taken.some(n=>Math.abs(n.tx-x)+Math.abs(n.ty-y)<2))continue;
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!walkable(R[y+b][x+a])))continue;const k=Math.abs(x-cx)+Math.abs(y-cy);if(!best||k<best[0])best=[k,x,y];}return best&&[best[1],best[2]];}
for(const [scene,cx,cy,def] of [['ow:2,3',20,17,{who:'Shelter Volunteer',hat:['#e8d28a'],shirt:['#58a850'],talk:'shelter'}],['ow:3,1',16,12,{who:'Market Grocer',hat:['#e8d28a'],shirt:['#d8692a'],talk:'grocer'}],
    ['ow:3,2',20,10,{who:'Trail Cyclist',hat:['#3ac2e8'],shirt:['#f2c14e'],talk:'cyclist'}],['ow:3,1',8,17,{who:'Tomato Farmer',hat:['#e8d28a'],shirt:['#e83048'],talk:'tomato'}]]){
  const s=openSpot(scene,cx,cy);if(s)EXTRA_NPCS.push(Object.assign({scene,tx:s[0],ty:s[1]},def));}
const HOME='rowhouse:0,0';if(RCQ.rooms[HOME])RCQ.rooms[HOME].name='Your Row House';

/* ---------- hidden stashes: one per neighborhood, tucked beside a tree, bush or rock you can reach ---------- */
const SECRETS={};
(function placeSecrets(){for(const id in RCQ.maps){const d=RCQ.maps[id],R=d.rows,ok=(x,y)=>R[y]&&walkable(R[y][x])&&!'DE'.includes(R[y][x]);
  const seen=new Set(),q=[];for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if((y==0||x==0||y==d.h-1||x==d.w-1)&&ok(x,y)){seen.add(x+','+y);q.push([x,y]);}
  while(q.length){const [x,y]=q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+a)+','+(y+b);if(!seen.has(k)&&ok(x+a,y+b)){seen.add(k);q.push([x+a,y+b]);}}}
  const busy=new Set((d.npcs||[]).map(n=>n.tx+','+n.ty).concat((d.items||[]).map(i=>i.tx+','+i.ty)));
  const c=[...seen].map(k=>k.split(',').map(Number)).filter(([x,y])=>!busy.has(x+','+y)&&x>1&&y>1&&x<d.w-2&&y<d.h-2&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>'Tbr'.includes(R[y+b][x+a])));
  if(c.length)SECRETS[id]=c[hash(id.length,d.w*7+d.h,id.charCodeAt(3)+id.charCodeAt(5))%c.length];}})();
const nSecrets=()=>Object.keys(SECRETS).filter(id=>st.got['sec:'+id]).length;

/* ---------- photos ---------- */
const PHOTOCAP={grandstand:'The Diamond, home of the Flying Squirrels',store:'The old Broad Street department stores',shelter:'A bus shelter on Broad Street',hippodrome:'The Hippodrome on Second Street',
  church:'St. John\'s Church on Church Hill',vmfa:'The Virginia Museum of Fine Arts',byrd:'The Byrd Theatre in Carytown',capitol:'The Virginia State Capitol',belltower:'The old Capitol Square bell tower',
  station:'Main Street Station',market:'The 17th Street Market',carillon:'The Carillon in Byrd Park',mansion:'Maymont House',pyramid:'The granite pyramid in Hollywood Cemetery',
  birdcage:'President Monroe\'s tomb',ruins:'The power plant ruins on Belle Isle',steamboat:'A steamboat at Rocketts Landing',stonehouse:'Forest Hill\'s Stone House',trolley:'An old Forest Hill trolley',
  scimuseum:'The Science Museum of Virginia',vmhc:'The Virginia Museum of History & Culture',sauers:'The Sauer\'s sign on Broad Street',ashecenter:'The tennis courts on Arthur Ashe Boulevard',
  speedway:'Richmond Raceway',agecroft:'Agecroft Hall, shipped from England',siegel:'The Siegel Center, home of the Rams',marshall:'The John Marshall House',sallybell:'Sally Bell\'s Kitchen',
  armory:'The old Blues Armory',stage:'The stage on Brown\'s Island'};
const PHOTOS=[];for(const id in RCQ.maps)for(const L of RCQ.maps[id].lm||[])if(PHOTOCAP[L.art]&&!PHOTOS.some(q=>q.art==L.art))PHOTOS.push({id,art:L.art});
function snapPhoto(){flash=10;sfx('snap');
  const L=(lv.d.lm||[]).filter(L=>PHOTOCAP[L.art]).map(L=>[L,Math.hypot((L.x+L.w/2)*TS-p.x,(L.y+L.h/2)*TS-p.z)]).sort((a,b)=>a[1]-b[1])[0];
  if(!L||L[1]>22||lv.room){toast('Nice shot! Find a landmark to fill your album.');return;}
  st.photos=st.photos||{};const k=L[0].art,isNew=!st.photos[k];st.photos[k]={night:dark()>.5,wx:st.wxk>.5?st.wx:'clear',ssn:season()};needSave=true;
  toast((isNew?'New photo: ':'Retook: ')+PHOTOCAP[k]+' ('+Object.keys(st.photos).length+'/'+PHOTOS.length+')');}

/* ---------- food ---------- */
const FOODS={cupcake:['Carytown Cupcake',2,'Heals one heart and puts a spring in your step.'],biscuit:['Ham Biscuit',6,'Heals three hearts.'],stew:['Brunswick Stew',99,'Heals every heart and toughens you up for a while.'],
  cookie:['Rainbow Cookie',2,'Three colored layers and chocolate on top.'],lunch:['Sally Bell\'s Box Lunch',8,'A sandwich, potato salad, a deviled egg, a cheese wafer and a cupcake.']};
const RECIPES=[['biscuit',{ham:1,flour:1}],['stew',{tomato:1,ham:1}],['cupcake',{flour:1,sugar:1}]];
let warm=0,zoom=0;
const addFood=(k,n)=>{st.food=st.food||{};st.food[k]=(st.food[k]||0)+(n||1);};
const addIngr=(k,n)=>{st.ingr=st.ingr||{};st.ingr[k]=(st.ingr[k]||0)+(n||1);return st.ingr[k];};
function eatMenu(){st.food=st.food||{};const have=Object.keys(FOODS).filter(k=>st.food[k]>0);
  if(!have.length){toast('The basket is empty. Buy food at the 17th Street Market or cook at home.');sfx('no');return;}
  say(['Your picnic basket: '+have.map(k=>FOODS[k][0]+' x'+st.food[k]).join(', ')+'.'],sel=>{const k=have[sel];if(!k)return;st.food[k]--;p.hp=Math.min(st.max,p.hp+FOODS[k][1]);
    if(k=='stew')warm=1800;if(k=='cupcake'||k=='cookie')zoom=600;sfx('heart');burst(p.x,1.6,p.z,10,'#f8a030');toast('Mmm. '+FOODS[k][0]+'!');needSave=true;},'Picnic Basket',have.map(k=>FOODS[k][0]).concat(['Not now']));}
function cookMenu(){st.food=st.food||{};st.ingr=st.ingr||{};const I=st.ingr,can=RECIPES.filter(([,r])=>Object.entries(r).every(([k,n])=>(I[k]||0)>=n));
  const have='You have: ham '+(I.ham||0)+', flour '+(I.flour||0)+', sugar '+(I.sugar||0)+', tomatoes '+(I.tomato||0)+'.';
  if(!can.length){say(['The stove is warm. '+have,'Recipes: ham and flour make a Ham Biscuit. A tomato and ham make Brunswick Stew. Flour and sugar make a Cupcake.'],null,'Stove');return;}
  if(!st.items.basket){say(['You\'d need a picnic basket to carry food. The 17th Street Market sells them.'],null,'Stove');return;}
  say(['What should you cook? '+have],sel=>{const c=can[sel];if(!c)return;for(const [k,n] of Object.entries(c[1]))I[k]-=n;addFood(c[0]);(st.f.cooked=st.f.cooked||{})[c[0]]=1;sfx('chest');toast('You cooked a '+FOODS[c[0]][0]+'!');needSave=true;},'Stove',can.map(c=>FOODS[c[0]][0]).concat(['Nothing']));}

/* ---------- shops ---------- */
const sold=k=>()=>st.items[k]?'SOLD OUT':'',furn=k=>()=>st.furn&&st.furn[k]?'SOLD OUT':'';
const buyFurn=k=>function(){(st.furn=st.furn||{})[k]=1;return'Delivered to your row house in the Fan.';};
SHOPS.carytown.items.push(
  {name:'Camera',price:25,why:sold('camera'),buy(){st.items.camera=1;if(!st.eq)st.eq='camera';return'Snap landmarks to fill your album!';}},
  {name:'Fishing Rod',price:30,why:sold('rod'),buy(){st.items.rod=1;if(!st.eq)st.eq='rod';return'A fine rod. Use it on B facing the water.';}},
  {name:'Braided Rug',price:15,why:furn('rug'),buy:buyFurn('rug')},{name:'Potted Fern',price:8,why:furn('fern'),buy:buyFurn('fern')},
  {name:'Fish Tank',price:30,why:furn('tank'),buy(){(st.furn=st.furn||{}).tank=1;return'Delivered. Fish you catch will swim in it.';}},{name:'Upright Piano',price:40,why:furn('piano'),buy:buyFurn('piano')});
SHOPS.market={title:'17TH STREET MARKET',who:'Market Grocer',items:[
  {name:'Picnic Basket',price:10,why:sold('basket'),buy(){st.items.basket=1;addFood('cupcake');if(!st.eq)st.eq='basket';return'A basket, with a cupcake in it!';}},
  {name:'Cupcake',price:4,why:()=>!st.items.basket?'???':'',buy(){addFood('cupcake');return'In the basket it goes.';}},
  {name:'Rainbow Cookie',price:3,why:()=>!st.items.basket?'???':'',buy(){addFood('cookie');learn('ukrops');return'Just like the old Ukrop\'s bakery made them.';}},
  {name:'Virginia Ham',price:3,why:()=>'',buy(){return'Virginia ham. You have '+addIngr('ham')+'.';}},
  {name:'Bag of Flour',price:2,why:()=>'',buy(){return'A bag of flour. You have '+addIngr('flour')+'.';}},
  {name:'Bag of Sugar',price:2,why:()=>'',buy(){return'A bag of sugar. You have '+addIngr('sugar')+'.';}},
  {name:'Hanover Tomato',price:2,why:()=>season()=='summer'?'':'SUMMER',buy(){learn('hanover');return'A Hanover tomato. You have '+addIngr('tomato')+'.';}}]};
SHOPS.sally={title:'SALLY BELL\'S KITCHEN',who:'Sally Bell\'s Kitchen',items:[
  {name:'Box Lunch',price:6,why:()=>!st.items.basket?'???':'',buy(){addFood('lunch');learn('sallybell');return'Tied up with string, right into the basket.';}},
  {name:'Cupcake',price:4,why:()=>!st.items.basket?'???':'',buy(){addFood('cupcake');return'In the basket it goes.';}}]};

/* ---------- the dog ---------- */
let dog=null;const DOGNAMES=['Biscuit','James','Peanut','Rosie'];
function dogReset(){dog=st&&st.dog?{x:p.x-1.2,z:p.z+1,yaw:p.yaw,trail:[],t:0,cool:0,dig:0,bark:0,walk:0,moving:false}:null;}
function dogUpdate(){if(!dog)return;const d=dog;d.t++;if(d.cool>0)d.cool--;if(d.bark>0)d.bark--;
  d.trail.push([p.x,p.z]);if(d.trail.length>18)d.trail.shift();let tx=d.trail[0][0],tz=d.trail[0][1],sp=.19;d.moving=false;
  const sec=picks.find(k=>k.kind=='secret'&&Math.hypot(k.x-p.x,k.z-p.z)<11);
  const foe=enemies.find(e=>!e.dead&&!e.boss&&!EDEF[e.type].fly&&Math.hypot(e.x-d.x,e.z-d.z)<7&&Math.hypot(e.x-p.x,e.z-p.z)<11);
  if(foe){tx=foe.x;tz=foe.z;sp=.25;const l=Math.hypot(foe.x-d.x,foe.z-d.z)||1;if(l<1.3&&d.cool<=0){d.cool=50;hitEnemy(foe,1,(foe.x-d.x)/l,(foe.z-d.z)/l,'dog');d.bark=20;sfx('bark');}}
  else if(sec){tx=sec.x;tz=sec.z+.8;if(Math.hypot(sec.x-d.x,sec.z-d.z)<2&&d.t%50==0){d.bark=20;sfx('bark');}}
  else if(d.dig>0){d.dig--;if(d.dig==0){const r=Math.random(),k=r<.65?'coin':r<.85?'heart':'tomato',pk=mkPick(k,d.x,d.z+.6);picks.push(pk);burst(d.x,.3,d.z,8,'#8a6a3a');sfx('drop');}return;}
  else if(!lv.room&&d.t%2400==1200&&'.,'.includes(tAt(d.x,d.z))&&Math.hypot(d.x-p.x,d.z-p.z)<5){d.dig=70;return;}
  const dx=tx-d.x,dz=tz-d.z,l=Math.hypot(dx,dz);
  if(l>(foe||sec?.3:1.6)){const m=Math.min(sp*(l>7?1.8:1),l);d.x+=dx/l*m;d.z+=dz/l*m;d.yaw+=ang(d.yaw,Math.atan2(dx,dz))*.3;d.moving=true;d.walk+=.45;}
  if(Math.hypot(d.x-p.x,d.z-p.z)>26){d.x=p.x-1;d.z=p.z+1;}}

/* ---------- fishing ---------- */
const FISHES=[
  {id:'bluegill',name:'bluegill',str:1,coins:3,w:()=>5,txt:'A little sunfish. Every pond in Richmond has them.'},
  {id:'bass',name:'largemouth bass',str:1.6,coins:6,w:()=>4,txt:'A fighter. Bass lurk along weedy edges.'},
  {id:'catfish',name:'blue catfish',str:2,coins:8,w:()=>dark()>.5?6:1,txt:'Blue catfish feed at night, and they get huge in the James.'},
  {id:'shad',name:'American shad',str:1.4,coins:6,w:()=>st.wx=='rain'?5:.3,txt:'Shad run up the James to spawn. Rain gets them moving.'},
  {id:'sturgeon',name:'Atlantic sturgeon',str:2.6,coins:30,w:()=>riverHere()?(dark()>.5?.9:.45):0,txt:'An ancient, armored giant. Spotting one in the James is a big deal.'}];
const riverHere=()=>(!lv.room&&((lv.d.ay==2&&lv.d.ax>=1)||(lv.d.ay==3&&lv.d.ax!=1&&lv.d.ax!=2)))||lv.id.startsWith('boathouse');
function pickFish(){const ws=FISHES.map(f=>f.w()),t=ws.reduce((a,b)=>a+b,0);let r=Math.random()*t;for(let i=0;i<FISHES.length;i++){r-=ws[i];if(r<=0)return FISHES[i];}return FISHES[0];}
let fish=null;
function castLine(){for(const d of [2.5,3.5,4.5,1.6]){const [fx,fz]=front(d),c=tAt(fx,fz);if(c&&WATER.includes(c)){fish={ph:'wait',t:90+rnd(240),x:fx,z:fz,dip:0};sfx('splash');burst(fx,0,fz,6,'#a8d8f0');return true;}}
  toast('Face the water and cast with B.');sfx('no');return true;}
function fishEnd(m){fish=null;toast(m);sfx('no');}
function fishUpdate(){const f=fish;f.t--;if(f.dip>0)f.dip--;
  if(inp.b){fish=null;toast('You reel in your line.');return;}
  if(f.ph=='wait'){if(inp.a){fishEnd('Too early! Nothing on the hook.');return;}if(f.t<=0){f.ph='bite';f.t=30;f.dip=30;vibrate(60);sfx('bite');}}
  else if(f.ph=='bite'){if(inp.a){f.ph='reel';f.sp=pickFish();f.dist=40;f.ten=18;f.run=0;sfx('reel');}else if(f.t<=0)fishEnd('It stole the bait and swam off.');}
  else{const S=f.sp;if(f.run>0)f.run--;else if(Math.random()<.012*S.str)f.run=35+rnd(40);
    f.dist+=(f.run?.13:.05)*S.str;f.ten=Math.max(0,f.ten-(f.run?.2:.75));if(f.run&&frame%6==0)f.dip=4;
    if(inp.a){f.dist-=3.2;f.ten+=f.run?15:8;sfx('reel');}
    if(f.ten>=100){fishEnd('Snap! The line broke.');return;}if(f.dist>=72){fishEnd('It got away.');return;}
    if(f.dist<=0){fish=null;st.fish=st.fish||{};st.fish[S.id]=(st.fish[S.id]||0)+1;st.coins=Math.min(999,st.coins+S.coins);p.hold=90;p.holdIc='fish';sfx('fanfare');needSave=true;
      say(['You caught '+(/^[aeiou]/i.test(S.name)?'an ':'a ')+S.name+'!',S.txt+' (+'+S.coins+' coins)'],null,'Fishing');}}}

/* ---------- weather ---------- */
function pickWeather(){const w={winter:[.4,.2,.15,.25],spring:[.5,.35,.15,0],summer:[.6,.3,.1,0],fall:[.5,.25,.2,.05]}[season()],r=Math.random();
  return r<w[0]?'clear':r<w[0]+w[1]?'rain':r<w[0]+w[1]+w[2]?'fog':'snow';}
function wxTick(){if(st.wx==null){st.wx='clear';st.wxk=0;st.wxT=2400;st.wxNext=null;}
  if(st.wxNext){st.wxk=Math.max(0,st.wxk-1/240);if(st.wxk<=0){st.wx=st.wxNext;st.wxNext=null;}}
  else{if(st.wx!='clear')st.wxk=Math.min(1,st.wxk+1/300);if(--st.wxT<=0){st.wxT=3000+rnd(4200);const n=pickWeather();if(n!=st.wx)st.wxNext=n;}}}
const wxNow=()=>!lv||lv.room||!st||st.wx=='clear'?0:st.wxk;
function weatherLook(e){const k=wxNow();if(!k)return e;const dk=dark(),mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
  if(st.wx=='rain')return{fog:[e.fog[0]*(1-.4*k),e.fog[1]*(1-.4*k)],fogCol:mix(e.fogCol,[.42*(1-dk*.8),.46*(1-dk*.8),.52*(1-dk*.7)],.6*k),amb:e.amb*(1-.25*k)};
  if(st.wx=='fog')return{fog:[e.fog[0]*(1-.7*k),e.fog[1]*(1-.55*k)],fogCol:mix(e.fogCol,[.72*(1-dk*.8),.74*(1-dk*.8),.76*(1-dk*.75)],.7*k),amb:e.amb};
  return{fog:[e.fog[0]*(1-.3*k),e.fog[1]*(1-.3*k)],fogCol:mix(e.fogCol,[.86*(1-dk*.8),.88*(1-dk*.8),.92*(1-dk*.7)],.6*k),amb:e.amb*(1+.1*k*(1-dk))};}

/* ---------- frogs come out in the rain ---------- */
function frogTick(){for(const k of picks)if(k.kind=='frog'){if(k.jump>0){k.jump--;k.y=.5+Math.sin(k.jump/12*Math.PI)*.6;}if(--k.hop<=0){k.hop=50+rnd(70);const a=rnd(4)*Math.PI/2,nx=k.x+Math.sin(a)*1.4,nz=k.z+Math.cos(a)*1.4;
    if(walkable(tAt(nx,nz))){k.x=nx;k.z=nz;k.yaw=a;k.jump=12;}}}
  if(frame%90||lv.room||st.wx!='rain'||st.wxk<.5||st.f.frogsDone)return;if(picks.filter(k=>k.kind=='frog').length>=3)return;
  for(let i=0;i<40;i++){const tx=1+rnd(lv.w-2),tz=1+rnd(lv.h-2);if(lv.g[tz][tx]!='.')continue;if(![[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>lv.g[tz+b][tx+a]=='w'))continue;
    const x=tx*TS+TS/2,z=tz*TS+TS/2;if(Math.hypot(x-p.x,z-p.z)<6)continue;const k=mkPick('frog',x,z);k.life=1500;k.hop=30+rnd(40);k.jump=0;k.yaw=0;picks.push(k);break;}}

/* ---------- each scene: dog, stash, tomatoes, First Friday and festival crowds ---------- */
const GARDENS=['ow:0,2','ow:0,-1','ow:4,0','ow:1,-1','ow:3,1'];
let runners=[];
function addFolk(who,talk,lines,hat,shirt,extra){const s=freeSpot(3);if(!s)return null;const n=Object.assign({who,talk,lines,hat:[hat],shirt:[shirt],tx:Math.floor(s[0]/TS),ty:Math.floor(s[1]/TS),x:s[0],z:s[1],hx:s[0],hz:s[1],yaw:0,t:rnd(200),walk:0,i:npcs.length,wander:talk=='folk'},extra||{});npcs.push(n);return n;}
const FOLKC=[['#e83048','#3d63c8'],['#f2c14e','#58a850'],['#3ac2e8','#e8e4dc'],['#b890f8','#f2c14e'],['#58c868','#e83048'],['#f890a0','#2e4a8a']];
function lifeOnLoad(id){dogReset();runners=[];lv.strings=null;
  if(id==HOME){for(const [x,y] of [[13,7],[13,8],[10,1],[2,4]])lv.g[y][x]='!';if(st.furn&&st.furn.piano){lv.g[4][13]=lv.g[4][14]='!';}}
  if(lv.room)return;
  const s=SECRETS[id];if(s&&!st.got['sec:'+id]){const k=mkPick('secret',s[0]*TS+TS/2,s[1]*TS+TS/2);k.id='sec:'+id;k.life=1e9;picks.push(k);}
  if(GARDENS.includes(id)){const day=Math.floor(st.clock/CYC),key='tom:'+id+':'+day;if(!st.f[key]){const cells=[];lv.d.rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==',')cells.push([x,y]);}));
    if(cells.length){const [x,y]=cells[hash(day,id.length,7)%cells.length],k=mkPick('tomato',x*TS+TS/2,y*TS+TS/2);k.life=1e9;k.day=key;picks.push(k);}}}
  if(firstFriday()&&(id=='ow:1,0'||id=='ow:2,0')){
    if(id=='ow:1,0'){addFolk('Curator','curator',[],'#2e2e3a','#b890f8');addFolk('Gallery Goer','folk',['First Friday! Every gallery on Broad Street stays open late.','Have you seen the new show? It\'s all paintings of the James.'],'#f2c14e','#58a850');addFolk('Street Musician','folk',['Got any requests? I know every song about Richmond. All three of them.'],'#3a2414','#f890a0');}
    else addFolk('Gallery Goer','folk',['The art walk spills over into Jackson Ward, too.'],'#3ac2e8','#e8e4dc');
    if(st.f.galleryAsk&&!st.f.gallery)for(const k of ['p1','p2','p3'])if(!st.got['paint:'+k]&&((k=='p3')==(id=='ow:2,0'))){const s2=freeSpot(6);if(s2){const pk=mkPick('painting',s2[0],s2[1]);pk.id='paint:'+k;pk.life=1e9;picks.push(pk);}}
    toast('First Friday! Galleries open late.');}
  const ev=events();
  if((ev.includes('folk')||ev.includes('riverrock'))&&id=='ow:4,1')for(let i=0;i<6;i++){const c=FOLKC[i];addFolk(ev.includes('folk')?'Festivalgoer':'Riverrock Fan','folk',[['This band came all the way from Mali!','Free music on the river. Only in Richmond.','Have you tried the funnel cake?'][i%3]],c[0],c[1]);}
  if(ev.includes('10k')&&id=='ow:1,1'){for(let i=0;i<7;i++){const c=FOLKC[i%6];runners.push({x:-2-i*5,z:(9+(i%3)*.6)*TS,v:.11+Math.random()*.05,walk:i,m:{hat:c[0],shirt:c[1]}});}
    if(!st.f['ev10k'+today().getFullYear()]){st.f['ev10k'+today().getFullYear()]=1;toast('It\'s Monument Avenue 10K season! Runners everywhere.');}}
  if(ev.includes('lights')&&(id=='ow:1,1'||id=='ow:0,1')&&!st.f['evlights'+today().getFullYear()]){st.f['evlights'+today().getFullYear()]=1;toast('Holiday lights are up! They look best after dark.');}}

/* ---------- each frame ---------- */
let fireflies=[];
function lifeUpdate(){wxTick();if(warm>0)warm--;if(zoom>0)zoom--;dogUpdate();frogTick();for(const r of runners){r.x+=r.v;r.walk+=.3;if(r.x>lv.w*TS+2)r.x=-2;}
  const ffOn=!lv.room&&dark()>.6&&!(st.wx=='rain'||st.wx=='snow')&&st.wxk<.5&&lv.d.rows.some(r=>r.includes('T'));
  if(!ffOn)fireflies.length=0;else{while(fireflies.length<14)fireflies.push({x:p.x+(Math.random()-.5)*24,z:p.z+(Math.random()-.5)*24,y:.6+Math.random()*1.6,ph:Math.random()*6,b:rnd(90)});
    for(const f of fireflies){f.ph+=.03;f.x+=Math.cos(f.ph)*.03;f.z+=Math.sin(f.ph*1.3)*.03;f.y+=Math.sin(f.ph*2)*.006;f.b=(f.b+1)%90;if(Math.hypot(f.x-p.x,f.z-p.z)>16){f.x=p.x+(Math.random()-.5)*20;f.z=p.z+(Math.random()-.5)*20;}}}}
function lifeSpeed(){let s=1;if(st.riding&&!lv.room)s*='psSkKn=-|'.includes(tAt(p.x,p.z))?1.55:1.3;if(zoom>0)s*=1.2;return s;}
function lifeDamage(d){return warm>0?Math.max(1,d-1):d;}
function lifeUse(k){switch(k){
  case'rod':return castLine();
  case'camera':snapPhoto();return true;
  case'basket':eatMenu();return true;
  case'bike':if(lv.room){toast('Not indoors!');sfx('no');return true;}st.riding=!st.riding;sfx(st.riding?'go':'drop');toast(st.riding?'You hop on the bike.':'You hop off the bike.');return true;}
  return false;}
function lifeCollect(k){switch(k.kind){
  case'secret':st.got[k.id]=1;st.coins=Math.min(999,st.coins+25);sfx('secret');burst(k.x,1,k.z,12,'#fff2a8');toast('A hidden stash! 25 coins. ('+nSecrets()+'/'+Object.keys(SECRETS).length+' secrets)');break;
  case'tomato':learn('hanover');addIngr('tomato');if(k.day)st.f[k.day]=1;sfx('coin');toast('A ripe Hanover tomato! ('+st.ingr.tomato+')');break;
  case'frog':st.frogs=(st.frogs||0)+1;sfx('frog');burst(k.x,.5,k.z,6,'#68b854');toast(st.frogs>=5&&!st.f.frogsDone?'Five frogs! Take them to the naturalist in Byrd Park.':'Caught a frog! ('+Math.min(st.frogs,5)+'/5)');break;
  case'painting':{st.got[k.id]=1;const n=['p1','p2','p3'].filter(q=>st.got['paint:'+q]).length;sfx('chest');toast('A lost painting! ('+n+'/3) Bring them to the curator.');break;}}
  needSave=true;}

/* ---------- your row house ---------- */
const HSPOT={bed:[13,8],stove:[10,1],shelf:[4,2],table:[10,3],piano:[13,4],tank:[2,4],fern:[1,1],rug:[7,5]};
const BOSSROOMS=['quarry:1,0','pyramid:1,1','poe:1,0','carillon:1,0','tredegar:0,0','conserv:0,0','tunnel:0,0'];
const LETTERS=[['won','The Archivist','The journal you finished is in the Library of Virginia now. Your name is on the first page.'],
  ['boss:tredegar:0,0','The Historian','Heard you quieted Tredegar. The old ironworkers would have bought you a round.'],
  ['bateau','The River Historian','The bateau floated on her first try. Come see her on the James!'],['frogsDone','The Naturalist','Final frog count: 112. You found five of them. Thank you!'],
  ['derbyGold','The Derby Kid','Your gold time is still on the chalkboard on Libby Hill. Nobody has beaten it.'],['gallery','The Curator','The three paintings you found are hanging in our front window.']];
function lifeInteract(){if(lv.id!=HOME)return false;const [fx,fz]=front(1.6),tx=fx/TS,tz=fz/TS,near=k=>Math.abs(tx-(HSPOT[k][0]+.5))<1.4&&Math.abs(tz-(HSPOT[k][1]+.5))<1.4;
  if(near('bed')){say(['Your own bed. Rest until...'],sel=>{if(sel==2)return;const want=sel==0?7:20,h=hour();const add=((want-h+24)%24)||24;st.clock+=Math.round(add/24*CYC);p.hp=st.max;sfx('heart');toast('You wake up rested. Hearts refilled.');needSave=true;},'Bed',['Morning','Evening','Not now']);return true;}
  if(near('stove')){cookMenu();return true;}
  if(near('table')){const got=LETTERS.filter(l=>st.f[l[0]]);say(got.length?got.map(l=>'From '+l[1]+': "'+l[2]+'"'):['No mail yet. Help people around town and they\'ll write.'],null,'Mail');return true;}
  if(near('shelf')){const n=BOSSROOMS.filter(b=>st.f['boss:'+b]).length;say([n?'Your trophy shelf holds '+n+' of 7 boss trophies.':'An empty shelf, waiting for trophies.','Photos on the wall: '+(st.photos?Object.keys(st.photos).length:0)+'.'],null,'Trophy Shelf');return true;}
  if(near('piano')&&st.furn&&st.furn.piano){sfx('organ');toast('You play a little tune.');return true;}
  if(near('tank')&&st.furn&&st.furn.tank){const f=Object.keys(st.fish||{});say([f.length?'Swimming in the tank: '+f.map(k=>FISHES.find(q=>q.id==k).name).join(', ')+'.':'An empty tank. Go catch something!'],null,'Fish Tank');return true;}
  return false;}

/* ---------- new people to talk to ---------- */
const askPlay=(n,lines,kind,yes)=>{say(lines,sel=>{if(sel==0)startMini(kind);},n.who,[yes,'Not now']);return null;};
const best=k=>st.mini&&st.mini[k]!=null?st.mini[k]:null;
Object.assign(TALK3,{
  shelter(n){if(st.dog)return['How is '+st.dog.name+' doing?','Dogs love the parks along the river.'];
    say(['This pup has been waiting for a home for weeks. Would you like to adopt? What will you call the pup?'],sel=>{if(sel==4)return;st.dog={name:DOGNAMES[sel]};dogReset();sfx('fanfare');needSave=true;
      say([st.dog.name+' is yours! '+st.dog.name+' will follow you, sniff out hidden stashes, chase small pests and dig up treats now and then.'],null,n.who);},n.who,DOGNAMES.concat(['Not today']));return null;},
  grocer(){openShop('market');return null;},
  sallybell(){if(!st.items.basket)return['Box lunches, made fresh every morning since the 1920s.','You\'ll want a picnic basket to carry one. The 17th Street Market sells them.'];learn('sallybell');openShop('sally');return null;},
  tomato(){learn('hanover');if(events().includes('tomato')){const k='tomfest'+today().getFullYear();if(!st.f[k]){st.f[k]=1;addIngr('tomato',3);sfx('chest');needSave=true;return['It\'s tomato season! Hanover tomatoes, the best in the world.','Take three, on the house. Brunswick stew needs a tomato.'];}
      return['Enjoy those tomatoes!','Salt, pepper, white bread and mayo. That\'s all a Hanover tomato needs.'];}
    return['Hanover tomatoes come in July. You\'ve never had one? You\'ve never had a tomato.','In summer the Market Grocer sells them too. Gardens around town grow a few, too. Keep an eye on the flower beds.'];},
  cyclist(n){if(!st.items.bike){st.items.bike=1;if(!st.eq)st.eq='bike';p.hold=70;p.holdIc='bike';sfx('chest');needSave=true;return['The Virginia Capital Trail starts right here and runs all the way to Jamestown.','I just got a new bike. Take my old one!','You got the Bicycle! Use it with B outdoors. It\'s fastest on streets and paths.'];}
    return askPlay(n,['Want to ride the Capital Trail time trial? Beat '+fmtTime(MINI.trail.gold*60)+' for gold.'+(best('trail')?' Your best: '+fmtTime(best('trail'))+'.':'')],'trail','Let\'s ride!');},
  curator(){const got=['p1','p2','p3'].filter(k=>st.got['paint:'+k]).length;
    if(st.f.gallery)return['Welcome back! Those three paintings are the talk of the art walk.'];
    if(got>=3){st.f.gallery=1;st.coins=Math.min(999,st.coins+50);sfx('fanfare');needSave=true;return['You found all three! I can hang the show tonight after all.','Please, take 50 coins. And come back next First Friday.'];}
    if(!st.f.galleryAsk){st.f.galleryAsk=1;needSave=true;for(const k of ['p1','p2'])if(!st.got['paint:'+k]){const s=freeSpot(6);if(s){const pk=mkPick('painting',s[0],s[1]);pk.id='paint:'+k;pk.life=1e9;picks.push(pk);}}}
    return['Disaster! Three paintings for tonight\'s show went missing on the way over.','Two must be somewhere on Broad Street, and one blew over to Jackson Ward. Find them before the night is over?'+(got?' You have '+got+' of 3.':'')];},
  naturalist(){if(st.f.frogsDone)return['The frog count is in the record books, thanks to you.','Come back on a rainy night. You never know what turns up.'];
    if((st.frogs||0)>=5){st.f.frogsDone=1;st.coins=Math.min(999,st.coins+40);needSave=true;sfx('fanfare');return['Five frogs! Wonderful. I\'ll count them and let them go by the lake.','Here are 40 coins for your trouble.'];}
    return['I\'m counting frogs for Maymont. They mostly come out when it rains, near the water.','Could you catch five for me? Just walk into them.'+(st.frogs?' You have '+st.frogs+' so far.':'')];},
  festival(){const ev=events(),k='fest'+today().getFullYear()+(ev.includes('folk')?'f':'r');
    if(ev.includes('folk')||ev.includes('riverrock')){if(!st.f[k]){st.f[k]=1;st.coins=Math.min(999,st.coins+30);sfx('fanfare');needSave=true;return[ev.includes('folk')?'Welcome to the Richmond Folk Festival!':'Welcome to Dominion Riverrock!',ev.includes('folk')?'Bands from all over the world, right here on Brown\'s Island. And it\'s free!':'Climbing, kayaking, dogs leaping into pools, and bands at night.','Here, festival money. 30 coins. Go get a funnel cake.'];}
      return[ev.includes('folk')?'Enjoy the Folk Festival!':'Enjoy Riverrock!','The stage runs till late. Listen for it all over downtown.'];}
    return['Brown\'s Island is quiet today. Come back in May for Dominion Riverrock, or in October for the Richmond Folk Festival.','Either way, there\'s a present in it for you.'];},
  racer(n){return askPlay(n,['This is the Libby Hill soapbox derby! Steepest street in Church Hill.','Want to race my car down the hill? Beat '+fmtTime(MINI.derby.gold*60)+' for gold.'+(best('derby')?' Your best: '+fmtTime(best('derby'))+'.':'')],'derby','Let\'s race!');},
  tennis(n){return askPlay(n,['Arthur Ashe learned on courts a lot like these. Want to rally against the ball machine?','Move left and right, and press A when the ball reaches you. Miss three and you\'re done.'+(best('tennis')!=null?' Your best: '+best('tennis')+' returns.':'')],'tennis','Let\'s rally!');},
  hoops(n){return askPlay(n,['Ten free throws. Press A when the needle hits the middle of the meter.','Make eight and you\'ve got Havoc in your blood.'+(best('hoops')!=null?' Your best: '+best('hoops')+' of 10.':'')],'hoops','Shoot!');},
  racedir(n){return askPlay(n,['Want a few laps around the Action Track? Dodge the slow cars and the oil.','Beat '+fmtTime(MINI.race.gold*60)+' for gold.'+(best('race')?' Your best: '+fmtTime(best('race'))+'.':'')],'race','Start your engine!');}});
const ballTalk=TALK3.ballplayer;
TALK3.ballplayer=function(n){if(st.items.balls&&st.ammo.balls>=10&&st.pins.flies){say(['Nice glove work out there. Want to take some swings in the batting cage? Ten pitches.'],sel=>{if(sel==0)startMini('bat');},n.who,['Batter up!','No thanks']);return null;}return ballTalk(n);};
function offerPinball(){say(['A pinball machine called RIVER CITY RAMBLE. One coin a game.'+(best('pin')?' High score: '+best('pin')+'.':'')],sel=>{if(sel!=0)return;if(st.coins<1){toast('You need a coin.');sfx('no');return;}st.coins--;startMini('pin');},'Penny Arcade',['Play','Not now']);}

/* ---------- drawing: the dog, the home, picks that hop, the bike, runners ---------- */
function drawLife(){
  if(dog){const D=getModel('dog',()=>lifeModel('dog')),s=dog.moving?Math.sin(dog.walk)*.6:0,dg=dog.dig>0?Math.sin(frame*.8)*.5:0;
    shadowAt(dog.x,dog.z,.7);drawModel(D,M4.mul(M4.tr(dog.x,0,dog.z),M4.ry(dog.yaw)),{legFL:{x:s+dg},legBR:{x:s},legFR:{x:-s-dg},legBL:{x:-s},tail:{y:Math.sin(frame*(dog.bark>0?.8:.25))*.5},head:{x:dog.dig>0?.5:dog.bark>0?-.3*Math.abs(Math.sin(frame*.5)):0}});}
  if(lv.id==HOME){const F=st.furn||{},at=(k,y)=>M4.tr((HSPOT[k][0]+.5)*TS,y||0,(HSPOT[k][1]+.5)*TS),dm=(k,y,r)=>{const m=getModel(k,()=>lifeModel(k));drawModel(m,r?M4.mul(at(k,y),M4.ry(r)):at(k,y));};
    dm('bed',0);dm('stove',0,Math.PI);if(F.rug)dm('rug');if(F.piano)dm('piano',0,Math.PI);if(F.tank){dm('tank',0,Math.PI/2);const fk=Object.keys(st.fish||{});fk.forEach((k,i)=>{const fm=getModel('fish',()=>lifeModel('fish'));const a=frame*.02+i*1.7;
      drawModel(fm,M4.mul(M4.mul(M4.tr((HSPOT.tank[0]+.5)*TS+Math.sin(a)*.25,.5+i*.12,(HSPOT.tank[1]+.5)*TS+Math.cos(a)*.6),M4.ry(a+Math.PI/2)),M4.sc(.8)),null,{tint:rgb(['#f2c14e','#58a848','#8a8e9c','#e8e4dc','#5a6470'][i%5]).map(v=>v*1.4)});});}
    if(F.fern)dm('fern');const tm=getModel('trophy',()=>lifeModel('trophy'));BOSSROOMS.forEach((b,i)=>{if(st.f['boss:'+b])drawModel(tm,M4.tr((3.2+i*.42)*TS,1.25,2.5*TS));});
    const mb=getModel('mailbox',()=>lifeModel('mailbox'));if(LETTERS.some(l=>st.f[l[0]]))drawModel(mb,M4.mul(M4.tr(10.5*TS,1.05,3.5*TS),M4.ry(.3)));}
  for(const r of runners){const H=getModel('runner:'+r.m.shirt,()=>humanoid({hat:r.m.hat,shirt:r.m.shirt,capless:true,style:'short'}));drawModel(H,M4.mul(M4.tr(r.x,0,r.z),M4.ry(Math.PI/2)),humanPose(r.walk,true,{}));}
  if(fish){const B=getModel('bobber',()=>lifeModel('bobber')),y=-.2+Math.sin(frame*.08)*.05-(fish.dip>0?.25:0);drawModel(B,M4.tr(fish.x,y,fish.z));
    const f=fwd(p.yaw),tip=[p.x+f[0]*1.2+Math.cos(p.yaw)*.3,2.4,p.z+f[1]*1.2-Math.sin(p.yaw)*.3],ln=new Mesh();ln.tube(tip,[fish.x,y+.15,fish.z],.012,.012,3,'white',[.9,.9,.9]);
    const rd=new Mesh();rd.tube([p.x+Math.cos(p.yaw)*.35+f[0]*.3,1.2,p.z-Math.sin(p.yaw)*.35+f[1]*.3],tip,.03,.015,4,'white',rgb('#8a5a34'));ln.add(rd);upload(dynBuf,ln);drawVAO(dynBuf);}}
function riderPose(base,ex){if(!st.riding||lv.room||tAt(p.x,p.z)=='~')return base;const B=getModel('bike',()=>lifeModel('bike')),lean=p.moving?Math.sin(p.walk*.5)*.04:0;
  drawModel(B,M4.mul(M4.mul(M4.tr(p.x,0,p.z),M4.ry(p.yaw)),M4.rz(lean)));const pd=p.walk*1.4;ex.legL={x:-1.1+Math.sin(pd)*.5};ex.legR={x:-1.1-Math.sin(pd)*.5};ex.armL={x:-1.1};ex.armR={x:-1.1};
  return M4.mul(M4.tr(0,.15,-.05),base);}

/* rain, snow, the sparkle over a stash the dog has found, frogs bobbing */
function lifeBB(bb,m,rx,rz){if(lv.room)return;const k=wxNow();
  if(k&&st.wx=='rain'){const n=Math.round(220*k);for(let i=0;i<n;i++){const h=hash(i,7,3),x=cam.tx+((h%400)/400-.5)*30,z=cam.tz+(((h>>9)%400)/400-.5)*30,y=((h>>3)%100)/10-(frame*.45+(h%37))%10+9;
      m.quad([x-rx*.035,y,z-rz*.035],[x+rx*.035,y,z+rz*.035],[x+rx*.035,y+.9,z+rz*.035],[x-rx*.035,y+.9,z-rz*.035],'white',[.78,.82,.92]);}}
  if(k&&st.wx=='snow'){const n=Math.round(140*k);for(let i=0;i<n;i++){const h=hash(i,11,5),x=cam.tx+((h%400)/400-.5)*30+Math.sin(frame*.02+i)*.4,z=cam.tz+(((h>>9)%400)/400-.5)*30,y=10-((frame*.05+(h%97)/9.7)%10);bb(x,y,z,.1,'white',[1,1,1]);}}}
function lifeGlow(g,rx,rz,dk){if(lv.room)return;const q=(x,y,z,s,c)=>g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',c);
  for(const f of fireflies)if(f.b<55){const a=Math.sin(f.b/55*Math.PI);q(f.x,f.y,f.z,.22,[.8*a,.8*a,.25*a]);}
  for(const k of picks)if(k.kind=='secret'&&Math.hypot(k.x-p.x,k.z-p.z)<(dog?11:7)&&(frame+Math.floor(k.x*10))%80<16){const a=Math.sin(((frame+Math.floor(k.x*10))%80)/16*Math.PI);q(k.x,.6,k.z,.5,[a,.9*a,.5*a]);}
  const ff=firstFriday()&&(lv.id=='ow:1,0'||lv.id=='ow:2,0'),hol=events().includes('lights')&&(lv.id=='ow:1,1'||lv.id=='ow:0,1')&&dk>.3;
  if(ff||hol){if(!lv.strings){lv.strings=[];for(let ty=0;ty<lv.h-1;ty++)for(let tx=0;tx<lv.w;tx++)if(lv.d.rows[ty][tx]=='B'&&lv.d.rows[ty+1][tx]!='B')for(let i=0;i<4;i++)lv.strings.push([tx*TS+.25+i*.5,3.1+((i+tx)&1)*.12,(ty+1)*TS+.12,(i+tx)%4]);}
    const C=[[1,.2,.25],[.25,.75,1],[1,.9,.3],[.35,1,.4]];for(const [x,y,z,c] of lv.strings){if(Math.abs(x-p.x)>26||Math.abs(z-p.z)>26)continue;q(x,y,z,.16,C[(c+(frame>>5))%4].map(v=>v*Math.max(.5,dk)));}}}

/* ---------- HUD bits: fishing and the album page ---------- */
function drawLifeHud(){if(fish){const f=fish;win(HW/2-170,HH-140,340,f.ph=='reel'?70:46);
    if(f.ph=='wait')T('Waiting for a bite...   B: reel in',HW/2,HH-128,{align:'center',size:16});
    else if(f.ph=='bite')T('A BITE! Press A!',HW/2,HH-128,{align:'center',size:20,c:(frame>>2)&1?'#fff2a8':'#ff8a8a'});
    else{T('Tap A to reel. Ease off when it runs!',HW/2,HH-130,{align:'center',size:14,c:f.run?'#ff8a8a':'#c8d0f0'});hx.fillStyle='#1a0a10';hx.fillRect(HW/2-150,HH-108,300,10);hx.fillStyle='#58c868';hx.fillRect(HW/2-150,HH-108,300*Math.max(0,1-f.dist/72),10);
      hx.fillStyle='#1a0a10';hx.fillRect(HW/2-150,HH-92,300,10);hx.fillStyle=f.ten>70?'#e83048':'#f2c14e';hx.fillRect(HW/2-150,HH-92,3*Math.min(100,f.ten),10);T('LINE',HW/2-160,HH-110,{align:'right',size:11,c:'#9aa4d8'});T('STRAIN',HW/2-160,HH-94,{align:'right',size:11,c:'#9aa4d8'});}}
  if(!lv.room&&st.wx&&st.wx!='clear'&&st.wxk>.3&&bannerT>0&&bannerT<100)T({rain:'Rain',fog:'Fog',snow:'Snow'}[st.wx],HW-24,58,{align:'right',size:13,c:'#c8d0f0'});}
function drawAlbum(m){const ph=st.photos||{},fs=st.fish||{},mb=st.mini||{};
  T('PHOTOS '+Object.keys(ph).length+'/'+PHOTOS.length,44,80,{size:15,c:'#fff2a8'});
  PHOTOS.forEach((q,i)=>{const x=44+(i%10)*28,y=102+Math.floor(i/10)*24,got=ph[q.art];hx.fillStyle=got?(got.night?'#2a3a6a':'#c8b890'):'#1e2650';hx.fillRect(x,y,24,18);if(got){hx.fillStyle=got.night?'#f2c14e':'#3d63c8';hx.fillRect(x+3,y+3,18,8);}});
  T('FISH',340,80,{size:15,c:'#fff2a8'});FISHES.forEach((f,i)=>T((fs[f.id]?f.name+'  x'+fs[f.id]:'- - -'),340,102+i*22,{size:15,c:fs[f.id]?'#ffffff':'#5a64a0'}));
  const rec=[['Batting',mb.bat!=null?mb.bat+' hits':null],['Pinball',mb.pin!=null?mb.pin:null],['Free throws',mb.hoops!=null?mb.hoops+'/10':null],['Tennis',mb.tennis!=null?mb.tennis+' returns':null],
    ['Soapbox Derby',mb.derby?fmtTime(mb.derby):null],['Capital Trail',mb.trail?fmtTime(mb.trail):null],['Raceway',mb.race?fmtTime(mb.race):null]];
  T('RECORDS',44,214,{size:15,c:'#fff2a8'});rec.forEach(([n,v],i)=>T(n+'   '+(v==null?'-':v),44+(i>3?250:0),236+(i%4)*22,{size:15,c:v==null?'#5a64a0':'#ffffff'}));
  T('Secrets '+nSecrets()+'/'+Object.keys(SECRETS).length+'    Frogs '+Math.min(5,st.frogs||0)+'/5    '+(st.dog?'Dog: '+st.dog.name+'    ':'')+WEEK[weekday()],HW/2,HH-70,{align:'center',size:15,c:'#c8d0f0'});}
