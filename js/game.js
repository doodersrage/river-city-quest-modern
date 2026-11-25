"use strict";
/* River City Quest 3D: the game itself, with no drawing in it, so tests can play it headless. */
const CYC=36000,FPS=60,PR=.42;
let st=null,lv=null,p=null,cam=null,mode='title',dlg=null,menu=null,trans=null,toastMsg='',toastT=0,banner='',bannerT=0,frame=0,shake=0,flash=0,endT=0;
let birds=[],npcs=[],enemies=[],picks=[],bombs=[],parts=[],chests=[],shots=[],chal=null,boss=null,hook=null,bug=null,needSave=false,titleSel=0,deathT=0,shop=null;
const inp={x:0,z:0,a:0,b:0,ah:0,bh:0,item:0,menu:0,camX:0,up:0,down:0,left:0,right:0,start:0};
const KEYS4=['granite','iron','brick','bronze'],KEYNAME={granite:'Granite',iron:'Iron',brick:'Brick',bronze:'Bronze'};
const ITEMORDER=['lantern','balls','powder','bug','shoes','hook','can','bottle','rod','camera','basket','bike'];
const ITEMNAME={lantern:'Gas Lantern',balls:'Baseballs',powder:'Blasting Powder',bug:'Gold-Bug',shoes:'Running Shoes',hook:'Grappling Hook',can:'Watering Can',bottle:'Ginger Beer',rod:'Fishing Rod',camera:'Camera',basket:'Picnic Basket',bike:'Bicycle'};
const TRADE={melon:'Watermelon',music:'Sheet Music',rivermap:'River Map'};
function newState(){return{coins:0,hp:6,max:6,items:{},ammo:{balls:0,powder:0},cap:{balls:30,powder:10},eq:null,keys:{},got:{},f:{},lore:{},pins:{},vis:{},
  scene:'ow:2,1',x:(15+BIG.ox)*TS+TS/2,z:(9+BIG.oy)*TS+TS/2,big:1,poly:1,clock:2400,time:0,ret:null,bottle:0,shield:0,trade:null,pieces:0,nightKills:0,sts:{}};}
function newPlayer(){return{x:0,z:0,y:0,yaw:Math.PI,vx:0,vz:0,swing:0,inv:0,kx:0,kz:0,walk:0,hold:0,holdIc:null,moving:false,dash:0,push:0,pushDir:null};}
const hour=()=>(6+(st?st.clock:2400)/CYC*24)%24;
function dark(){if(lv&&lv.room)return lv.dungeon?.55:0;const h=hour();return h>=20||h<5?1:h>=17?(h-17)/3:h<7?(7-h)/2:0;}
const fwd=a=>[Math.sin(a),Math.cos(a)];
const ang=(a,b)=>{let d=b-a;while(d>Math.PI)d-=6.283;while(d<-Math.PI)d+=6.283;return d;};
const nKeys=()=>KEYS4.filter(k=>st.got[k]).length;
const nLore=()=>Object.keys(st.lore).length;
function toast(m){toastMsg=m;toastT=170;}
function tileXZ(x,z){return[Math.floor(x/TS),Math.floor(z/TS)];}
function tAt(x,z){const [tx,tz]=tileXZ(x,z);return tileAt(lv,tx,tz);}
function passable(c){return walkable(c)||c=='~'&&st&&st.items.kayak;}
function blockedCircle(x,z,r){if(lv.world){const c=worldBlocked(lv.world,x,z,r);if(c)return c;// the notebook grid only holds the things set down on the ground: chests, plaques, lamps
    for(const [dx,dz] of [[-r,-r],[r,-r],[-r,r],[r,r]]){const q=tAt(x+dx,z+dz);if(q!=null&&'cMljb%'.includes(q)&&Math.hypot(x-(Math.floor((x+dx)/TS)+.5)*TS,z-(Math.floor((z+dz)/TS)+.5)*TS)<r+.45)return q;}
    for(const pr of lv.props||[])if(pr.solid&&Math.abs(x-pr.x)<pr.solid[0]+r&&Math.abs(z-pr.z)<pr.solid[1]+r)return'car';if(typeof trafficBlock=='function'&&trafficBlock(x,z,r))return'car';return null;}
  if(lv.plan){if(planBlocked(lv.plan,x,z,r))return'W';// walls are the room's own outline; the squares only hold what stands on the floor
    for(const [dx,dz] of [[-r,-r],[r,-r],[-r,r],[r,r],[0,-r],[0,r],[-r,0],[r,0]]){const c=tAt(x+dx,z+dz);if(c!=null&&c!='W'&&!passable(c))return c;}}
  else for(const [dx,dz] of [[-r,-r],[r,-r],[-r,r],[r,r],[0,-r],[0,r],[-r,0],[r,0]]){const c=tAt(x+dx,z+dz);if(c!=null&&!passable(c))return c;}
  for(const pr of lv.props||[])if(pr.solid&&Math.abs(x-pr.x)<pr.solid[0]+r&&Math.abs(z-pr.z)<pr.solid[1]+r)return'car';if(typeof trafficBlock=='function'&&trafficBlock(x,z,r))return'car';return null;}
function npcBlock(x,z){for(const n of npcs)if(Math.hypot(n.x-x,n.z-z)<.85)return n;return null;}
const centerOf=(tx,ty)=>[tx*TS+TS/2,ty*TS+TS/2];

/* ---------- puzzles: is a room solved? ---------- */
function isSolved(id){const d=sceneData(id);if(!d||!d.solveOf)return false;
  if(d.solveOf=='lit')return(d.braz||[]).every((b,i)=>st.f['b:'+id+':'+i]);
  if(d.solveOf=='clear')return!!st.f['clr:'+id];if(d.solveOf=='switch')return!!st.f['sw:'+id];return false;}
function refreshDyn(silent){let opened=false;
  for(const o of lv.dyn){if(!o.on)continue;
    if(o.kind=='gate'&&isSolved(o.solved)){removeDyn(o,true);opened=true;}
    else if((o.kind=='lock'||o.kind=='crack'||o.kind=='rubble')&&st.f[dynKey(o)])removeDyn(o,true);
    else if(o.kind=='sprout'&&st.f['grow:'+lv.id+':'+o.tx+','+o.ty])growSprout(o,true);}
  for(const o of lv.dyn)if(o.kind=='brazier'){o.lit=!!st.f['b:'+lv.id+':'+o.i];lv.g[o.ty][o.tx]=o.lit?'J':'j';}
  for(const c of chests)if(chestVisible(c)&&!c.shown){c.shown=true;lv.g[c.ty][c.tx]='c';if(!silent){sfx('secret');toast('A chest appeared!');burst(c.x,.8,c.z,14,'#fff2a8');}}
  if(opened&&!silent){sfx('secret');toast('Something opened nearby.');}}
function solvedNow(){refreshDyn(false);needSave=true;}

/* ---------- loading a place ---------- */
function loadScene(id,x,z,yaw){
  lv=LEVELS[id]=buildLevel(id);st.scene=id;st.vis[id]=1;st.spawn=[id,x,z];
  // blocks already pushed onto their switches stay there
  if(st.f['sw:'+id]){const sw=[];lv.d.rows.forEach((r,y)=>[...r].forEach((c,x2)=>{if(c=='^')sw.push([x2,y]);}));lv.dyn.filter(o=>o.kind=='block').forEach((b,i)=>{if(sw[i]){lv.g[b.ty][b.tx]='F';b.tx=sw[i][0];b.ty=sw[i][1];lv.g[b.ty][b.tx]='#';}});}
  npcs=(lv.d.npcs||[]).map((n,i)=>({...n,x:n.tx*TS+TS/2,z:n.ty*TS+TS/2,hx:n.tx*TS+TS/2,hz:n.ty*TS+TS/2,yaw:0,t:hash(i,n.tx,n.ty)%200,walk:0,i,wander:n.wander||n.talk=='folk'&&!lv.room}));
  for(const n of EXTRA_NPCS)if(n.scene==id)npcs.push({...n,x:n.tx*TS+TS/2,z:n.ty*TS+TS/2,hx:n.tx*TS+TS/2,hz:n.ty*TS+TS/2,yaw:0,t:0,walk:0,i:npcs.length});
  enemies=[];picks=[];bombs=[];parts=[];shots=[];boss=null;hook=null;bug=null;
  birds=[];if(!lv.room)(lv.d.birds||[]).forEach(([bx,by],i)=>{for(let k=0;k<3+i%2;k++){const hx=bx*TS+TS/2+(k-1)*.6,hz=by*TS+TS/2+((k*7)%3-1)*.5;birds.push({hx,hz,x:hx,z:hz,y:0,yaw:k*2.1,t:k*37,state:'peck',vx:0,vy:0,vz:0,flap:0});}});
  const cleared=st.f['clr:'+id];
  if(!(lv.room&&cleared))for(const [t,x0,y0] of lv.d.en){if(EDEF[t]&&EDEF[t].boss&&st.f['boss:'+id])continue;const e=mkEnemy(t,x0*TS+TS/2,y0*TS+TS/2);enemies.push(e);if(e.boss)boss=e;}
  if(!lv.room&&dark()>.6)for(let i=0;i<2;i++){const s=freeSpot(16);if(s){const e=mkEnemy('ghost',s[0],s[1]);e.night=1;enemies.push(e);}}
  chests=(lv.d.chests||[]).map(c=>({...c,x:c.tx*TS+TS/2,z:c.ty*TS+TS/2,open:!!st.f['c:'+c.id]}));
  for(const c of chests){c.shown=chestVisible(c);if(c.shown)lv.g[c.ty][c.tx]='c';}
  for(const it of lv.d.items||[]){if(st.got[it.id])continue;const [ix,iz]=centerOf(it.tx,it.ty),k=mkPick(it.kind,ix,iz);k.id=it.id;k.life=1e9;k.y=it.kind=='skey'?.3:.5;picks.push(k);}
  if(lv.d.bossT&&st.f['boss:'+id]){lv.g[8][7]=lv.g[8][8]='E';}
  refreshDyn(true);
  for(const L of lv.lamps)L.lit=id!='ow:3,0'||!!st.pins.lamps||!!st.f.won;
  p.x=x;p.z=z;if(yaw!=null)p.yaw=yaw;p.vx=p.vz=0;p.dash=0;settle();
  cam.yaw=lv.room?0:bestYaw(p.yaw+Math.PI);cam.snap=true;cam.manual=0;
  if(chal&&chal.scene!=id){chalClear();chal=null;toast('Challenge abandoned.');}
  banner=lv.name;bannerT=150;needSave=true;if(typeof lifeOnLoad=='function')lifeOnLoad(id);
  if(typeof onSceneLoaded=='function')onSceneLoaded();}
function freeSpot(minD){for(let k=0;k<80;k++){const tx=1+Math.floor(Math.random()*(lv.w-2)),tz=1+Math.floor(Math.random()*(lv.h-2));const x=tx*TS+TS/2,z=tz*TS+TS/2;
  if(walkable(tileAt(lv,tx,tz))&&Math.hypot(x-p.x,z-p.z)>minD&&!(lv.world&&(blockedCircle(x,z,.6)||!onMain(lv.world,x,z))))return[x,z];}return null;}
function settle(){if(lv.world){const w=lv.world;if(!blockedCircle(p.x,p.z,PR)&&onMain(w,p.x,p.z))return;// the nearest open ground that connects to the rest of the neighborhood
    const cx=Math.max(1,Math.min(w.w-2,Math.floor(p.x))),cz=Math.max(1,Math.min(w.h-2,Math.floor(p.z)));for(let r=0;r<Math.max(w.w,w.h);r++){let best=null;for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx+=(Math.abs(dz)==r?1:2*r||1)){const a=cx+dx,b=cz+dz;if(a<1||b<1||a>=w.w-1||b>=w.h-1||!w.main[b*w.w+a]||blockedCircle(a+.5,b+.5,PR))continue;const d=Math.hypot(a+.5-p.x,b+.5-p.z);if(!best||d<best[2])best=[a+.5,b+.5,d];}if(best){p.x=best[0];p.z=best[1];return;}}return;}
  if(!blockedCircle(p.x,p.z,PR))return;let best=null,bd=1e9;
  for(let tz=0;tz<lv.h;tz++)for(let tx=0;tx<lv.w;tx++){if(!walkable(tileAt(lv,tx,tz)))continue;const x=tx*TS+TS/2,z=tz*TS+TS/2,d=Math.hypot(x-p.x,z-p.z);if(d<bd&&!blockedCircle(x,z,PR)){bd=d;best=[x,z];}}
  if(best){p.x=best[0];p.z=best[1];}}
function dynKey(o){return o.key?o.key:o.link?'link:'+o.link:'dyn:'+lv.id+':'+o.tx+','+o.ty;}
function removeDyn(o,silent){o.on=false;for(const [x,y] of o.cells||[[o.tx,o.ty]])lv.g[y][x]=o.under;if(!silent&&o.kind!='bush'&&o.kind!='gate'){st.f[dynKey(o)]=1;needSave=true;}}
function growSprout(o,silent){o.on=false;o.grown=true;lv.g[o.ty][o.tx]='1';o.vines=[];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=o.tx+dx,y=o.ty+dy;while(lv.g[y]&&lv.g[y][x]=='_'){lv.g[y][x]='|';o.vines.push([x,y]);x+=dx;y+=dy;}}
  if(!silent){st.f['grow:'+lv.id+':'+o.tx+','+o.ty]=1;needSave=true;sfx('secret');toast('The sprout drinks it up and grows!');burst(o.tx*TS+TS/2,.8,o.ty*TS+TS/2,14,'#84cc68');}}

/* ---------- starting ---------- */
function startGame(fromSave){st=fromSave?Object.assign(newState(),fromSave):newState();p=newPlayer();cam={yaw:0,pitch:.5,dist:8,x:0,y:0,z:0,manual:0};p.hp=st.hp=st.max;
  loadScene(st.scene,st.x,st.z,Math.PI);mode='play';
  if(!fromSave&&lv.world){// begin a few steps from the archivist, facing them
    const a=npcs.find(n=>n.talk=='archivist'||/Archivist/.test(n.who||''));if(a){let best=null;for(let k=0;k<16;k++){const an=k/16*6.283,x=a.x+Math.sin(an)*5,z=a.z+Math.cos(an)*5;if(!blockedCircle(x,z,PR+.3)&&(!best||roadNear(lv.world,x,z,20)&&!best[2])){best=[x,z,!!roadNear(lv.world,x,z,3)];}}if(best){p.x=best[0];p.z=best[1];p.yaw=Math.atan2(a.x-p.x,a.z-p.z);}}settle();cam.yaw=bestYaw(p.yaw+Math.PI);cam.snap=true;st.spawn=[lv.id,p.x,p.z];}
  if(!fromSave)say(['A cold fog has rolled up off the James, and the gas lamps of Richmond are going dark, block by block.','The archivist by the Capitol wants a word. Walk up and press A to talk.']);}
function saveGame(){if(!st)return;st.x=p.x;st.z=p.z;st.hp=p.hp;try{localStorage.setItem('rcqm-save',JSON.stringify(st));}catch(e){}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem('rcqm-save')||'null');if(s&&!s.big){/* a save from before the maps grew: move it to where that spot is now */if((s.scene||'').indexOf('ow:')==0){s.x+=BIG.ox*TS;s.z+=BIG.oy*TS;}if(s.ret&&typeof s.ret.x=='number'&&(s.ret.scene||s.ret.id||'ow:').indexOf('ow:')==0){s.ret.x+=BIG.ox*TS;s.ret.z+=BIG.oy*TS;}s.big=1;}if(s&&!s.poly){/* a save from before the streets became the real ones: put it down in the middle of the same neighborhood */const W=id=>typeof WORLD!='undefined'&&WORLD[id];if(W(s.scene)){s.x=W(s.scene).w/2;s.z=W(s.scene).h/2;}if(Array.isArray(s.ret)&&W(s.ret[0])){s.ret[1]=W(s.ret[0]).w/2;s.ret[2]=W(s.ret[0]).h/2;}s.spawn=null;s.poly=1;}return s&&sceneData(s.scene)?s:null;}catch(e){return null;}}

/* ---------- dialog ---------- */
function say(lines,cb,who,choices){if(!lines||!lines.length){if(cb)cb(0);return;}dlg={lines:lines.slice(),i:0,n:0,cb,who:who||'',choices:choices||null,sel:0};}
function dlgUpdate(){const d=dlg,L=d.lines[d.i];d.n=Math.min(L.length,d.n+2);const last=d.i==d.lines.length-1;
  if(last&&d.choices&&d.n>=L.length){if(inp.up)d.sel=(d.sel+d.choices.length-1)%d.choices.length;if(inp.down)d.sel=(d.sel+1)%d.choices.length;}
  if(inp.a||inp.b&&!d.choices){if(d.n<L.length){d.n=L.length;return;}if(!last){d.i++;d.n=0;sfx('blip');return;}
    const cb=d.cb,sel=d.choices?(inp.b?d.choices.length-1:d.sel):0;dlg=null;sfx('blip');if(cb)cb(sel);}}

/* ---------- the main update ---------- */
function update(){frame++;
  if(toastT>0)toastT--;if(bannerT>0)bannerT--;if(shake>0)shake--;if(flash>0)flash--;
  if(mode=='title'){titleUpdate();return;}
  if(mode=='mini'){if(typeof miniUpdate=='function')miniUpdate();return;}
  if(mode=='end'||mode=='credits'){endT++;if(endT>(mode=='end'?90:240)&&(inp.a||inp.start))mode='play';return;}
  if(trans){transUpdate();return;}
  if(dlg){dlgUpdate();camUpdate();return;}
  if(shop){shopUpdate();return;}
  if(menu){menuUpdate();return;}
  if(deathT>0){if(--deathT==0){if(chal){chalClear();chal=null;}p.hp=st.max;st.hp=st.max;const s=st.spawn||[st.scene,p.x,p.z];loadScene(s[0],s[1],s[2]);toast('You catch your breath.');}return;}
  if(typeof fish!='undefined'&&fish){st.clock++;st.time++;fishUpdate();npcUpdate();if(typeof lifeUpdate=='function')lifeUpdate();camUpdate();return;}
  if(inp.menu||inp.start){const own=ownItems();menu={tab:0,sel:0,jc:0,rd:null,ic:Math.max(0,own.indexOf(st.eq)),bi:0};sfx('blip');return;}
  st.clock++;st.time++;if(p.inv>0)p.inv--;if(p.hold>0)p.hold--;
  if(chal&&chal.t!=null&&--chal.t<=0)chalFail();
  playerUpdate();if(hook)hookUpdate();if(bug)bugUpdate();blocksUpdate();
  enemiesUpdate();shotsUpdate();npcUpdate();birdsUpdate();picksUpdate();bombsUpdate();partsUpdate();streetTick();if(typeof lifeUpdate=='function')lifeUpdate();camUpdate();
  if(needSave&&frame%30==0){saveGame();needSave=false;}}

function playerUpdate(){
  if(p.bumpT>0)p.bumpT--;if(p.lockT>0)p.lockT--;
  if(p.hold>0||hook&&hook.st=='pull'){p.moving=false;return;}
  const cy=cam.yaw,fx=-Math.sin(cy),fz=-Math.cos(cy),rx=Math.cos(cy),rz=-Math.sin(cy);
  let mx=inp.x*rx+(-inp.z)*fx,mz=inp.x*rz+(-inp.z)*fz;const ml=Math.hypot(mx,mz);
  const onRiver=tAt(p.x,p.z)=='~';
  // a real running pace (about 4 m/s), matched to the stride of the motion capture so feet don't slide
  let sp=(p.swing>0?.02:onRiver?.03:.034)*TS;p.moving=ml>.15||p.dash>0;if(typeof lifeSpeed=='function')sp*=lifeSpeed();
  // keep moving in the open with nothing hunting you and the jog opens up into a run; it drops the moment you stop, swing or meet trouble
  {const foe=!lv.room&&enemies.some(e=>!e.dead&&Math.hypot(e.x-p.x,e.z-p.z)<11);if(p.moving&&ml>.6&&!lv.room&&p.swing<=0&&!foe&&!st.riding&&!onRiver&&!chal)p.runT=Math.min(140,(p.runT||0)+1);else p.runT=Math.max(0,(p.runT||0)-(foe?3:8));
    const k=Math.max(0,Math.min(1,((p.runT||0)-50)/60));p.sprint=1+.5*k*k*(3-2*k);sp*=p.sprint;}
  if(p.dash>0){p.dash--;const f=fwd(p.yaw);mx=f[0];mz=f[1];sp=.1*TS;
    for(const e of enemies)if(!e.dead&&!e.boss&&Math.hypot(e.x-p.x,e.z-p.z)<1.2)hitEnemy(e,1,f[0],f[1],'dash');}
  else if(p.moving){mx/=Math.max(1,ml);mz/=Math.max(1,ml);p.yaw+=ang(p.yaw,Math.atan2(mx,mz))*.35;p.walk+=ml*.251*(typeof lifeSpeed=='function'?lifeSpeed():1)*(p.sprint||1);}
  let dx=(p.moving?mx*sp:0)+p.kx,dz=(p.moving?mz*sp:0)+p.kz;p.kx*=.8;p.kz*=.8;
  const bx=!blockedCircle(p.x+dx,p.z,PR)&&!npcBlock(p.x+dx,p.z),bz=!blockedCircle(p.x,p.z+dz,PR)&&!npcBlock(p.x,p.z+dz);
  const hitX=bx?null:blockedCircle(p.x+dx,p.z,PR),hitZ=bz?null:blockedCircle(p.x,p.z+dz,PR);
  if(bx)p.x+=dx;if(bz)p.z+=dz;
  if(p.dash>0&&(hitX||hitZ)){p.dash=0;shake=4;sfx('hit');}
  if(p.moving&&(hitX||hitZ))bump(p.x+(hitX?Math.sign(dx)*PR*2:0),p.z+(hitZ?Math.sign(dz)*PR*2:0));else p.push=0;
  if(p.moving&&!st.items.kayak&&toastT<=0){const [fx2,fz2]=front(1.2);if(tAt(fx2,fz2)=='~')toast('Whitewater. You\'d need a boat.');}
  // screen edges lead to the next neighborhood or room
  const W=lv.w*TS,H=lv.h*TS;let ex=0,ez=0;if(p.x<.3)ex=-1;else if(p.x>W-.3)ex=1;else if(p.z<.3)ez=-1;else if(p.z>H-.3)ez=1;
  if(ex||ez)edgeExit(ex,ez);
  if(tAt(p.x,p.z)=='E'&&st.ret){const r=st.ret;st.ret=null;startTrans(r[0],r[1],r[2],r[3]||0);}
  // A: talk, read, open, or swing
  if(p.swing>0){p.swing--;if(p.swing>=8&&p.swing<=13)swingHits();}
  if(inp.a&&p.swing<6&&!interact()&&p.swing==0){p.swing=18;sfx('swing');}
  if(inp.b)useItem();
  if(inp.item)cycleItem();}
function front(d){const f=fwd(p.yaw);return[p.x+f[0]*(d||1.4),p.z+f[1]*(d||1.4)];}
function cardinal(){const a=((p.yaw%6.283)+6.283)%6.283,k=Math.round(a/(Math.PI/2))%4;return[[0,1],[1,0],[0,-1],[-1,0]][k];}
function npcInFront(){let best=null,bd=1e9;for(const n of npcs){const d=Math.hypot(n.x-p.x,n.z-p.z),a=Math.abs(ang(p.yaw,Math.atan2(n.x-p.x,n.z-p.z)));if((d<2.1||d<3.8&&counterBetween(n))&&a<1.3&&d<bd){bd=d;best=n;}}return best;}
function counterBetween(n){return tAt((n.x+p.x)/2,(n.z+p.z)/2)=='V';}
function interact(){
  const best=npcInFront();if(best){best.yaw=Math.atan2(p.x-best.x,p.z-best.z);best.look=180;talkTo(best);return true;}
  if(typeof lifeInteract=='function'&&lifeInteract())return true;
  for(const d of [1.2,2]){const [fx,fz]=front(d),[tx,tz]=tileXZ(fx,fz),c=tileAt(lv,tx,tz),k=tx+','+tz;
    const ch=chests.find(q=>q.tx==tx&&q.ty==tz);
    if(ch&&!ch.open&&chestVisible(ch)){openChest(ch);return true;}
    const raw=lv.d.rows[tz]&&lv.d.rows[tz][tx],r=lv.markers[k]||(lv.d.readsT&&lv.d.readsT[raw])||(c=='X'&&(lmAt(lv,tx,tz)||{}).read);
    if(r){readMarker(r);return true;}
    if(c=='D'||lv.world&&d<1.3&&doorNear(fx,fz,1.6)){const dn=lv.world&&doorNear(fx,fz,1.6);if(dn)enterDoor(dn.tx,dn.ty);else enterDoor(tx,tz);return true;}
    if(c=='e'){if(chal&&chal.type=='tag'){const kk=tx+','+tz;if(!chal.set.has(kk)){chal.set.add(kk);burst(fx,1.5,fz,10,'#f2c14e');chalProgress();}else toast('Already found that one.');}else say(['A bright mural, painted right onto the wall.'],null,'Mural');return true;}
    if(c=='j'){say(['A cold brazier.',st.items.lantern?'Raise the Gas Lantern beside it with B.':'Something would have to light it.']);return true;}
    if(c=='L'){bump(fx,fz,true);return true;}
    if(c=='l'&&!(chal&&chal.type=='light')){say([lampLitAt(tx,tz)?'A gas lamp, burning low in the fog.':'A cold gas lamp. The lamplighter could use help.'],null,'Gas Lamp');return true;}}
  return false;}
function lampLitAt(tx,ty){const L=lv.lamps.find(l=>l.tx==tx&&l.ty==ty);return!L||L.lit;}
function doorNear(x,z,r){let best=null,bd=r;for(const d of lv.doors||[])if(d.x!=null){const k=Math.hypot(d.x-x,d.z-z);if(k<bd){bd=k;best=d;}}return best;}
function bump(x,z,loud){if(lv.world){const d=doorNear(p.x,p.z,2);if(d&&!(p.bumpT>0)){p.bumpT=40;enterDoor(d.tx,d.ty);}p.push=0;return;}
  const [tx,tz]=tileXZ(x,z),c=tileAt(lv,tx,tz);
  if(c=='D'&&!(p.bumpT>0)){p.bumpT=40;enterDoor(tx,tz);}
  if(c=='L'){const o=lv.dyn.find(o=>o.kind=='lock'&&o.on&&(o.cells||[]).some(([a,b])=>a==tx&&b==tz));if(o){const ar=lv.id.split(':')[0];
    if((st.keys[ar]||0)>0){st.keys[ar]--;removeDyn(o);sfx('door');toast('The small key turns. The door swings open.');burst(tx*TS+TS/2,1.5,tz*TS+TS/2,10,'#d8a830');}
    else if(loud||!(p.lockT>0)){p.lockT=90;toast('Locked. A small key from somewhere in here would open it.');sfx('no');}}}
  if(c=='#')pushBlock(tx,tz);else p.push=0;}
function edgeExit(ex,ez){const [a,c]=lv.id.split(':'),[ax,ay]=c.split(',').map(Number),nid=a+':'+(ax+ex)+','+(ay+ez);
  const W=lv.w*TS,H=lv.h*TS;
  if(sceneData(nid)){const nd=sceneData(nid),NW=nd.w*TS,NH=nd.h*TS;let nx=p.x,nz=p.z;if(ex<0)nx=NW-.8;if(ex>0)nx=.8;if(ez<0)nz=NH-.8;if(ez>0)nz=.8;startTrans(nid,nx,nz,p.yaw);return;}
  p.x=Math.max(.6,Math.min(W-.6,p.x));p.z=Math.max(.6,Math.min(H-.6,p.z));
  if(!p.edgeT||frame-p.edgeT>200){p.edgeT=frame;toast('The fog is too thick to go any farther that way.');}}
function startTrans(id,x,z,yaw){trans={t:0,id,x,z,yaw,done:false};sfx('whoosh');}
function transUpdate(){trans.t++;if(trans.t==18&&!trans.done){trans.done=true;loadScene(trans.id,trans.x,trans.z,trans.yaw);}if(trans.t>=36)trans=null;}
function enterDoor(tx,tz){const dr=(lv.doors||[]).find(d=>d.tx==tx&&d.ty==tz);if(!dr)return;
  if(dr.sealed&&lv.g[dr.sealed[1]][dr.sealed[0]]=='%'){if(!(p.lockT>0)){p.lockT=120;toast('Fallen stone blocks the door. Blasting powder would clear it.');sfx('no');}return;}
  if(dr.need=='keystones'&&nKeys()<4){say(['The tunnel mouth is sealed. Four hollows in the stone wait for keystones. You have '+nKeys()+'.']);return;}
  if(dr.need=='carkey'&&!st.got.carkey){say(['The Carillon door is locked. The caretaker nearby might know where the key went.']);return;}
  if(!sceneData(dr.to)){say(['The door is shut tight.'],null,lv.name);return;}
  if(dr.x!=null)st.ret=[lv.id,dr.x+dr.nx*1.3,dr.z+dr.nz*1.3,Math.atan2(dr.nx,dr.nz)];else{const fd=faceDir(lv,tx,tz);st.ret=[lv.id,(tx+fd[0])*TS+TS/2,(tz+fd[1])*TS+TS/2,Math.atan2(fd[0],fd[1])];}sfx('door');const intro=dr.to=='tunnel:0,1'&&!st.f.tunIntro;
  startTrans(dr.to,8*TS,8.6*TS,Math.PI);
  if(intro){st.f.tunIntro=1;later.push({n:40,f:()=>say(['The keystones crumble into the seal and it splits. Cold air breathes out of the dark.','Rubble chokes the tunnel ahead. Good thing you brought powder.'])});}}
let later=[];

/* ---------- reading the city ---------- */
function readMarker(id){if(id=='!arcade'&&typeof offerPinball=='function'){offerPinball();return;}if(id[0]=='!'){const x=RCQ.readx[id];if(x)say([id=='!arcade'?'A pinball machine called RIVER CITY RAMBLE. Its 3D cabinet is still being wired up.':x[1]],null,x[0]);return;}
  const L=RCQ.lore[id];if(!L)return;sfx('blip');learn(id);say(wrapPages(L.s),null,L.t);}
function learn(id){if(!RCQ.lore[id]||st.lore[id])return;st.lore[id]=1;needSave=true;toast('Journal: '+RCQ.lore[id].t);}
function wrapPages(s){const words=s.split(' '),pages=[];let cur='';for(const w of words){if((cur+' '+w).trim().length>150){pages.push(cur.trim());cur=w;}else cur+=' '+w;}if(cur.trim())pages.push(cur.trim());return pages;}

/* ---------- chests, items ---------- */
function chestVisible(c){if(!c.appear)return true;return isSolved(lv.id);}
function openChest(c){c.open=true;st.f['c:'+c.id]=1;needSave=true;sfx('chest');p.hold=70;p.holdIc=c.item;say(give(c.item),null,'Treasure');}
function give(code){
  switch(code){
    case'key':{const ar=lv.id.split(':')[0];st.keys[ar]=(st.keys[ar]||0)+1;return['You got a small key!','It opens one locked door in this place.'];}
    case'coins20':st.coins=Math.min(999,st.coins+20);return['Twenty coins!'];
    case'coins50':st.coins=Math.min(999,st.coins+50);return['A hidden stash of fifty coins!'];
    case'lantern':st.items.lantern=1;st.eq=st.eq||'lantern';return['You got the Gas Lantern!','Press B to raise it. It lights lamps and braziers, and it lights your way after dark.'];
    case'balls':st.items.balls=1;st.ammo.balls=Math.max(st.ammo.balls,15);st.eq='balls';return['You got Baseballs!','Press B to throw one straight ahead. Switch items with the ITEM button.'];
    case'bottle':st.items.bottle=1;st.bottle=1;if(!st.eq)st.eq='bottle';return['You got a bottle of Ginger Beer!','Drink it with B to refill every heart. Bring the bottle back to the taproom for a free refill.'];
    case'powder':st.items.powder=1;st.ammo.powder=Math.max(st.ammo.powder,8);st.eq='powder';return['You got the Blasting Powder!','Press B to set down a keg. Cracked walls and rubble give way.','Switch between items with the ITEM button.'];
    case'shield':st.shield=1;return['You got the Cast-Iron Shield!','It works on its own. Face a shot head-on and it bounces straight back.'];
    case'bug':st.items.bug=1;st.eq='bug';return['You got the Gold-Bug!','A golden beetle from Poe\'s story. Throw it with B and it flies back with whatever it touches, even over water.'];
    case'shoes':st.items.shoes=1;st.eq='shoes';return['You got the Running Shoes!','Press B to dash. Small foes get bowled over.'];
    case'hook':st.items.hook=1;st.eq='hook';return['You got the Grappling Hook!','Fire it with B at an iron post to fly across a gap. It can snag things too.'];
    case'can':st.items.can=1;st.eq='can';return['You got the Watering Can!','Use it with B on a dry sprout. Try the one by the sunken bed.'];
    case'hc':st.max+=2;p.hp=st.max;return['A heart charm! Your hearts grew by one.'];
    case'piece':st.pieces++;if(st.pieces%4==0){st.max+=2;p.hp=st.max;return['A heart piece! That makes four. Your hearts grew by one.'];}return['A heart piece! ('+(st.pieces%4)+' of 4) Find four to grow a heart.'];
    case'kayak':st.items.kayak=1;st.trade=null;return['You got the Kayak!','Walk into the whitewater on the James to paddle across it. The south bank is open to you now.'];
    case'melon':case'music':case'rivermap':st.trade=code;return['You got the '+TRADE[code]+'!',{melon:'From the Carytown festival. Someone hungry might trade for it.',music:'An old organ arrangement. A theatre organist would love it.',rivermap:'A hand-drawn map of the old lines through the falls.'}[code]];
  }return[];}
function ownItems(){return ITEMORDER.filter(k=>st.items[k]);}
function itemLabel(k){return k=='balls'?'Baseballs x'+st.ammo.balls:k=='powder'?'Powder x'+st.ammo.powder:k=='bottle'?(st.bottle?'Ginger Beer':'Empty Bottle'):ITEMNAME[k]||'-';}
function cycleItem(){const own=ownItems();if(!own.length){toast('No items yet.');return;}const i=own.indexOf(st.eq);st.eq=own[(i+1)%own.length];sfx('blip');toast(itemLabel(st.eq));}
function useItem(){if(!st.eq){toast('Nothing on B yet.');return;}if(typeof lifeUse=='function'&&lifeUse(st.eq))return;const f=fwd(p.yaw);
  switch(st.eq){
    case'lantern':{p.raise=40;sfx('lantern');
      const bz=lv.dyn.find(o=>o.kind=='brazier'&&!o.lit&&Math.hypot(o.tx*TS+TS/2-p.x,o.ty*TS+TS/2-p.z)<2.8);
      if(bz){const was=isSolved(lv.id);st.f['b:'+lv.id+':'+bz.i]=1;bz.lit=true;lv.g[bz.ty][bz.tx]='J';sfx('light');burst(bz.tx*TS+TS/2,1.6,bz.ty*TS+TS/2,12,'#f8a030');needSave=true;if(!was&&isSolved(lv.id))solvedNow();return;}
      for(const L of lv.lamps){const x=L.tx*TS+TS/2,z=L.ty*TS+TS/2;if(Math.hypot(x-p.x,z-p.z)<2.8&&!L.lit){
        if(!(chal&&chal.type=='light')){toast('The wick won\'t take. The lamplighter knows the trick.');return;}
        L.lit=true;sfx('light');burst(x,3,z,12,'#fff2a8');chalProgress();return;}}
      return;}
    case'powder':if(st.ammo.powder<=0){toast('Out of powder. The Carytown shop sells kegs.');sfx('no');return;}if(bombs.length>=2)return;st.ammo.powder--;{const [fx,fz]=front(1.1);bombs.push({x:fx,z:fz,t:110});}sfx('drop');return;
    case'balls':if(st.ammo.balls<=0){toast('Out of baseballs.');sfx('no');return;}st.ammo.balls--;shots.push({x:p.x+f[0]*.6,z:p.z+f[1]*.6,y:1.2,vx:f[0]*.28,vz:f[1]*.28,life:105,k:'ball',pl:true});sfx('throw');return;
    case'bug':if(bug)return;bug={x:p.x,z:p.z,y:1.2,vx:f[0]*.5,vz:f[1]*.5,t:0,ret:false,carry:[],hit:new Set()};sfx('bug');return;
    case'hook':{if(hook)return;const c=cardinal(),a2=Math.atan2(c[0],c[1]),use=Math.abs(ang(p.yaw,a2))<.45?c:f;hook={x:p.x,z:p.z,dx:use[0],dz:use[1],d:0,st:'out',carry:[]};sfx('hook');return;}
    case'shoes':if(p.dash>0)return;p.dash=22;sfx('dash');return;
    case'can':{const [fx,fz]=front(1.4),[tx,tz]=tileXZ(fx,fz);burst(fx,.6,fz,8,'#7ac8f0');sfx('splash');
      const sp=lv.dyn.find(o=>o.kind=='sprout'&&o.on&&Math.abs(o.tx-tx)<=1&&Math.abs(o.ty-tz)<=1&&Math.hypot(o.tx*TS+TS/2-p.x,o.ty*TS+TS/2-p.z)<3);if(sp){growSprout(sp);return;}
      const a=enemies.find(e=>e.type=='arum'&&!e.dead&&Math.hypot(e.x-p.x,e.z-p.z)<4.5);if(a&&a.state!='bloom'){a.state='bloom';a.st=0;sfx('secret');toast('The Titan Arum unfurls! Now\'s your chance.');}
      return;}
    case'bottle':if(st.bottle){st.bottle=0;p.hp=st.max;sfx('heart');burst(p.x,1.4,p.z,12,'#f8a030');toast('Ahh. Every heart refilled.');needSave=true;}else toast('The bottle is empty. The brewer in Scott\'s Addition refills it.');return;
  }}

/* ---------- the hook and the Gold-Bug ---------- */
function hookUpdate(){const h=hook;
  if(h.st=='out'){h.d+=.65;h.x=p.x+h.dx*h.d;h.z=p.z+h.dz*h.d;
    for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-h.x,e.z-h.z)<(e.boss?1.8:.9)){if(e.type=='foreman')foremanHooked(e);else if(!e.boss){e.stun=60;hitEnemy(e,1,h.dx,h.dz,'hook');}else sfx('clank');h.st='back';return;}}
    for(const k of picks)if(!k.got&&Math.hypot(k.x-h.x,k.z-h.z)<.9){k.got=2;h.carry.push(k);h.st='back';}
    const c=tAt(h.x,h.z);
    if(c=='+'){const [tx,tz]=tileXZ(h.x,h.z);h.st='pull';h.x=tx*TS+TS/2;h.z=tz*TS+TS/2;h.tx=(tx-h.dx)*TS+TS/2;h.tz=(tz-h.dz)*TS+TS/2;sfx('clank');return;}
    if(c==null||!passable(c)&&!'_w~|1'.includes(c)||h.d>=13){h.st='back';if(c&&!passable(c)&&!'_w~'.includes(c))sfx('clank');}}
  else if(h.st=='back'){h.d-=.85;h.x=p.x+h.dx*h.d;h.z=p.z+h.dz*h.d;for(const k of h.carry){k.x=h.x;k.z=h.z;}if(h.d<=0){hook=null;for(const k of h.carry){k.got=1;collect(k);}}}
  else{const dx=h.tx-p.x,dz=h.tz-p.z,l=Math.hypot(dx,dz);p.inv=Math.max(p.inv,2);if(l<=.5){p.x=h.tx;p.z=h.tz;hook=null;return;}p.x+=dx/l*.5;p.z+=dz/l*.5;}}
function bugUpdate(){const b=bug;b.t++;
  if(!b.ret){b.x+=b.vx;b.z+=b.vz;const c=tAt(b.x,b.z);if(b.t>=26||c==null||!passable(c)&&!'w~_|'.includes(c))b.ret=true;}
  else{const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz)||1;if(d<.6){bug=null;for(const k of b.carry){k.got=1;collect(k);}return;}b.x+=dx/d*.55;b.z+=dz/d*.55;}
  for(const k of picks)if(!k.got&&Math.hypot(k.x-b.x,k.z-b.z)<1){k.got=2;b.carry.push(k);b.ret=true;}
  for(const k of b.carry){k.x=b.x;k.z=b.z;}
  for(const e of enemies)if(!e.dead&&!b.hit.has(e)&&Math.hypot(e.x-b.x,e.z-b.z)<1){b.hit.add(e);b.ret=true;if(e.boss)sfx('clank');else{e.stun=80;if(e.hp<=1)hitEnemy(e,1,0,0,'bug');}}}

/* ---------- push blocks and floor switches ---------- */
function pushBlock(tx,tz){const o=lv.dyn.find(q=>q.kind=='block'&&q.tx==tx&&q.ty==tz&&!q.mv);if(!o)return;
  if(lv.d.rows[tz][tx]=='^'&&isSolved(lv.id)){if(p.push++==14)toast('It\'s locked onto the switch.');return;}
  const c=cardinal(),key=c.join();if(p.pushDir!=key){p.pushDir=key;p.push=0;}if(++p.push<18)return;p.push=0;
  const nx=tx+c[0],ny=tz+c[1],t=lv.g[ny]&&lv.g[ny][nx];
  if(!t||!walkable(t)||t=='E'||t=='D'||npcs.some(n=>Math.floor(n.x/TS)==nx&&Math.floor(n.z/TS)==ny)){sfx('no');return;}
  lv.g[tz][tx]=lv.d.rows[tz][tx]=='^'?'^':'F';o.fx=tx;o.fy=tz;o.tx=nx;o.ty=ny;o.mv=12;lv.g[ny][nx]='#';sfx('push');}
function blocksUpdate(){for(const o of lv.dyn)if(o.kind=='block'&&o.mv){o.mv--;if(!o.mv){
  if(lv.d.solveOf=='switch'&&!st.f['sw:'+lv.id]){const sw=[];lv.d.rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c=='^')sw.push([x,y]);}));
    if(sw.length&&sw.every(([x,y])=>lv.dyn.some(q=>q.kind=='block'&&q.tx==x&&q.ty==y&&!q.mv))){st.f['sw:'+lv.id]=1;solvedNow();}
    else if(lv.d.rows[o.ty][o.tx]=='^')sfx('light');}}}}

/* ---------- combat ---------- */
const EDEF={rat:{hp:1,sp:.06,r:.5,dmg:1},squirrel:{hp:1,sp:.05,r:.45,dmg:1},scooter:{hp:2,sp:.085,r:.6,dmg:1},bat:{hp:1,sp:.055,r:.45,dmg:1,fly:1},goose:{hp:2,sp:.05,r:.6,dmg:1},
  crab:{hp:2,sp:.04,r:.6,dmg:1},ghost:{hp:2,sp:.035,r:.6,dmg:2,fly:1},turtle:{hp:8,sp:.04,r:1.5,dmg:2,boss:1},wraith:{hp:6,r:1.2,dmg:2,fly:1,boss:1},raven:{hp:7,r:1.1,dmg:2,fly:1,boss:1},
  bell:{hp:8,r:1.6,dmg:2,fly:1,boss:1},foreman:{hp:9,r:1.4,dmg:2,boss:1},arum:{hp:8,r:1.6,dmg:2,boss:1},vampire:{hp:14,r:1.1,dmg:2,fly:1,boss:1}};
const BOSSNAME={turtle:'OLD SNAPPER',wraith:'THE PYRAMID WRAITH',raven:'THE RAVEN',bell:'THE GREAT BELL',foreman:'THE IRON FOREMAN',arum:'THE TITAN ARUM',vampire:'THE RICHMOND VAMPIRE'};
// everything that chases you moves at this fraction of its old arcade speed, to match the player's real pace
const PACE=.45;
// how far through its stride an animal gets for each metre it covers
const GAIT={rat:12,squirrel:7,goose:9,crab:12,turtle:2.9};
function mkEnemy(t,x,z){const d=EDEF[t]||EDEF.rat;return{type:t,x,z,y:d.fly?1.4:0,hx:x,hz:z,hp:d.hp,max:d.hp,yaw:Math.random()*6,t:Math.floor(Math.random()*120),kx:0,kz:0,flash:0,state:t=='bell'?'float':'idle',st:0,dead:false,boss:!!d.boss,stun:0,vis:0};}
function enemiesUpdate(){
  for(const e of enemies){if(e.dead)continue;const d=EDEF[e.type];e.t++;if(e.flash>0)e.flash--;
    if(e.stun>0){e.stun--;continue;}
    const ox=e.x,oz=e.z,ease=(k,to,r)=>{e[k]=(e[k]||0)+(to-(e[k]||0))*r;};
    if(e.boss){BOSSUPD[e.type](e);const dd=Math.hypot(e.x-ox,e.z-oz);e.gait=(e.gait||0)+dd*(GAIT[e.type]||0);ease('spd',dd>.002?1:0,.15);continue;}
    const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz)||1,ty=e.type,sp=d.sp*TS*PACE;let mx=0,mz=0,alert=0,lunge=0,face=null;
    if(dist<9){const a=Math.atan2(dx,dz),ux=dx/dist,uz=dz/dist,weave=k=>{const w=Math.sin(e.t*.045+(e.hx||0)*3)*(dist>2.2?k:0),l=Math.hypot(1,w);mx=(ux-uz*w)/l;mz=(uz+ux*w)/l;};
      // each animal closes in the way its kind does
      if(ty=='crab'){const side=Math.sin(e.t*.04)>0?1:-1;mx=Math.cos(a)*side*.6+ux*.4;mz=-Math.sin(a)*side*.6+uz*.4;face=a;alert=dist<4.5?1:.3;}// sidles, claws up
      else if(ty=='goose'||ty=='squirrel'){if(e.t%150<50){alert=1;face=a;}else{weave(ty=='squirrel'?.6:0);mx*=1.6;mz*=1.6;lunge=1;}}// stands tall and stares, then rushes
      else if(ty=='scooter'){e.yaw+=ang(e.yaw,a)*.15;if(e.t%120<2||!e.vx){e.vx=Math.sin(e.yaw)*1.4;e.vz=Math.cos(e.yaw)*1.4;}mx=e.vx;mz=e.vz;}
      else if(ty=='rat'){if(e.t%70<58){weave(.4);mx*=1.2;mz*=1.2;}else{alert=1;face=a;}}// scurries in bursts, stops to sniff
      else if(ty=='bat'){weave(.8);lunge=dist<3.5?1:0;}// flutters side to side, then swoops
      else{weave(ty=='ghost'?.3:0);}}
    else if(e.t%180<60){mx=Math.sin(e.t*.05+(e.hx||0));mz=Math.cos(e.t*.05+(e.hz||0));}
    // nothing alive starts or turns in an instant
    if(ty=='scooter'){e.mvx=mx*sp;e.mvz=mz*sp;if(dist>=9&&(mx||mz))e.yaw=Math.atan2(mx,mz);}
    else{ease('mvx',mx*sp,.14);ease('mvz',mz*sp,.14);const v=Math.hypot(e.mvx,e.mvz);
      if(ty=='crab'&&face!=null)e.yaw+=ang(e.yaw,face)*.15;else if(v>sp*.25)e.yaw+=ang(e.yaw,Math.atan2(e.mvx,e.mvz))*.22;else if(face!=null)e.yaw+=ang(e.yaw,face)*.12;}
    let nx=e.x+e.mvx+e.kx,nz=e.z+e.mvz+e.kz;e.kx*=.82;e.kz*=.82;
    if(d.fly){e.x=nx;e.z=nz;if(ty=='bat')ease('y',lunge?1.05:1.85+Math.sin(e.t*.05+(e.hx||0))*.25,.05);else e.y=1.3+Math.sin(e.t*.12)*.4;}else{let moved=false;if(!blockedCircle(nx,e.z,d.r*.7)){e.x=nx;moved=true;}if(!blockedCircle(e.x,nz,d.r*.7)){e.z=nz;moved=true;}if(!moved&&e.type=='scooter'){e.yaw+=Math.PI/2;e.vx=0;}}
    const dd=Math.hypot(e.x-ox,e.z-oz);e.gait=(e.gait||0)+dd*(GAIT[ty]||10);ease('spd',Math.min(1,dd/(sp*.9)),.18);ease('al',alert,.1);ease('lg',lunge,.1);
    e.x=Math.max(.5,Math.min(lv.w*TS-.5,e.x));e.z=Math.max(.5,Math.min(lv.h*TS-.5,e.z));
    if(dist<d.r+.45&&p.inv==0&&p.dash==0)hurtPlayer(d.dmg,e.x,e.z);}
  enemies=enemies.filter(e=>!e.dead||e.fade>0&&e.fade--);
  if(lv.room&&lv.d.en.length&&!enemies.some(e=>!e.dead&&!e.chal)&&!st.f['clr:'+lv.id]){st.f['clr:'+lv.id]=1;needSave=true;if(lv.d.solveOf=='clear')solvedNow();}}
// the named street the player is standing on, if any
function streetHere(){if(lv&&lv.world)return worldStreet(lv.world,p.x,p.z);if(!lv||lv.room||!lv.d.streets)return null;const tx=Math.floor(p.x/TS),ty=Math.floor(p.z/TS);let nm=null,best=1e9;for(const s of lv.d.streets)if(tx>=s.x0&&tx<=s.x1&&ty>=s.y0&&ty<=s.y1){const a=(s.x1-s.x0+1)*(s.y1-s.y0+1);if(a<best){best=a;nm=s.n;}}return nm=='alley'?null:nm;}
let STREET_TOTAL=0;
// walking a street for the first time is worth a little: it goes in the count and pays a few coins
function streetTick(){if(frame%20||!st||dlg||trans)return;const n=streetHere();if(!n)return;st.sts=st.sts||{};const key=lv.id+'|'+n;if(st.sts[key])return;st.sts[key]=1;
  if(!STREET_TOTAL){for(const id in RCQ.maps){const seen={},W=typeof WORLD!='undefined'&&WORLD[id];if(W)for(const r of W.roads){if(r.n&&'mpstrva'.includes(r.k)&&r.k!='m')for(let i=0;i<r.p.length;i+=2)if(r.p[i]>0&&r.p[i+1]>0&&r.p[i]<W.w*10&&r.p[i+1]<W.h*10){seen[r.n]=1;break;}}else for(const s of RCQ.maps[id].streets||[])if(s.n!='alley')seen[s.n]=1;STREET_TOTAL+=Object.keys(seen).length;}}
  st.coins=Math.min(999,(st.coins||0)+5);needSave=true;sfx('coin');toast('New street: '+n+'  ('+Object.keys(st.sts).length+' of '+STREET_TOTAL+')  +5 coins');}
function hurtPlayer(dmg,fx,fz){if(p.hold>0||hook&&hook.st=='pull')return;if(typeof lifeDamage=='function')dmg=lifeDamage(dmg);p.hp-=dmg;p.inv=70;const l=Math.hypot(p.x-fx,p.z-fz)||1;p.kx=(p.x-fx)/l*.35;p.kz=(p.z-fz)/l*.35;shake=8;sfx('hurt');vibrate(40);
  if(p.hp<=0){if(st.bottle){st.bottle=0;p.hp=st.max;toast('You gulp down the ginger beer just in time!');sfx('heart');return;}p.hp=0;deathT=90;sfx('die');}}
function swingHits(){
  for(const e of enemies){if(e.dead||e.flash>0)continue;const dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz),r=EDEF[e.type].r;if(d>2.1+r*.6)continue;
    if(e.y>2.6&&!e.boss)continue;if(Math.abs(ang(p.yaw,Math.atan2(dx,dz)))>1.25&&d>r+.3)continue;hitEnemy(e,st.gold?2:1,dx/(d||1),dz/(d||1),'paddle');}
  for(const s of shots)if(!s.pl&&!s.refl&&Math.hypot(s.x-p.x,s.z-p.z)<2.2&&Math.abs(ang(p.yaw,Math.atan2(s.x-p.x,s.z-p.z)))<1.3)reflect(s);
  for(const o of lv.dyn){if(o.kind!='bush'||!o.on)continue;const x=o.tx*TS+TS/2,z=o.ty*TS+TS/2,d=Math.hypot(x-p.x,z-p.z);
    if(d<2.4&&Math.abs(ang(p.yaw,Math.atan2(x-p.x,z-p.z)))<1.1){removeDyn(o);burst(x,.8,z,10,'#4e9a44');sfx('cut');const r=Math.random();if(r<.25)picks.push(mkPick('coin',x,z));else if(r<.35)picks.push(mkPick('heart',x,z));}}}
function hitEnemy(e,dmg,nx,nz,src){
  if(e.dead||e.flash>0&&src!='bomb')return;
  if(e.type=='turtle'&&e.state!='stun'&&src!='bomb'){sfx('clank');e.flash=6;if(src=='paddle'){p.kx=-nx*.4;p.kz=-nz*.4;}if(!st.f.clankTip){st.f.clankTip=1;toast('Your paddle bounces off the shell! Make it charge into a wall.');}return;}
  if(e.type=='wraith'&&e.vis<=0){if(src!='refl')return;e.vis=150;}
  if(e.type=='arum'&&e.state!='bloom'){sfx('clank');e.flash=6;if(!st.f.arumTip){st.f.arumTip=1;toast('The arum is clamped shut. Maybe it needs water.');}return;}
  if(e.type=='foreman'&&e.state!='stun'){sfx('clank');e.flash=6;if(src=='paddle'){p.kx=-nx*.4;p.kz=-nz*.4;}if(!st.f.foreTip){st.f.foreTip=1;toast('Solid iron plate. Something that grabs might rip it off.');}return;}
  if(e.type=='bell'&&e.state!='stun'){if(e.y>2)return;if(src!='bomb'){sfx('clank');return;}}
  if(e.type=='vampire'&&e.gone)return;
  e.hp-=dmg;e.flash=e.boss?18:14;if(!e.boss){e.kx=nx*.5;e.kz=nz*.5;}sfx('hit');if(e.boss)shake=5;
  if(e.hp<=0){e.dead=true;e.fade=e.boss?40:0;burst(e.x,e.y+.5,e.z,e.boss?30:12,'#ffffff');sfx('poof');if(e.night)st.nightKills=(st.nightKills||0)+1;
    if(e.chal&&chal)chalProgress();
    if(e.boss){bossDie(e);return;}
    const r=Math.random();if(r<.3)picks.push(mkPick('coin',e.x,e.z));else if(r<.44)picks.push(mkPick('heart',e.x,e.z));else if(r<.52&&st.items.balls)picks.push(mkPick('ballpk',e.x,e.z));else if(r<.57&&st.items.powder)picks.push(mkPick('powpk',e.x,e.z));}}

/* ---------- enemy shots, and your baseballs ---------- */
function shoot(e,sp,a,k,y){sp*=.55;shots.push({x:e.x,z:e.z,y:y||e.y+.8,vx:Math.sin(a)*sp,vz:Math.cos(a)*sp,life:430,k});sfx('shoot');}
function aimAt(e){return Math.atan2(p.x-e.x,p.z-e.z);}
function reflect(s){s.refl=true;s.life=200;const w=enemies.find(e=>e.type=='wraith'&&!e.dead);
  if(s.k=='orb'&&w){const a=Math.atan2(w.x-s.x,w.z-s.z),v=Math.hypot(s.vx,s.vz)*1.6;s.vx=Math.sin(a)*v;s.vz=Math.cos(a)*v;}else{s.vx*=-1.3;s.vz*=-1.3;}sfx('clank');burst(s.x,s.y,s.z,5,'#ffffff');}
function shotsUpdate(){for(const s of shots){s.x+=s.vx;s.z+=s.vz;s.life--;const c=tAt(s.x,s.z);
    if(c==null||!passable(c)&&!'w~_|'.includes(c)){s.life=0;burst(s.x,s.y,s.z,3,'#ffffff');continue;}
    if(s.pl||s.refl){for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-s.x,e.z-s.z)<EDEF[e.type].r+.3&&Math.abs((e.y+.8)-s.y)<2.5){hitEnemy(e,s.k=='ball'?1:2,s.vx,s.vz,s.refl?'refl':'ball');s.life=0;break;}}}
    else if(Math.hypot(p.x-s.x,p.z-s.z)<.6&&p.inv==0){const from=Math.atan2(s.x-p.x,s.z-p.z);
      if(st.shield&&Math.abs(ang(p.yaw,from))<.9&&p.swing==0){reflect(s);continue;}hurtPlayer(s.k=='blood'||s.k=='spark'?2:1,s.x,s.z);s.life=0;}}
  shots=shots.filter(s=>s.life>0);}

/* ---------- the bosses ---------- */
const BOSSUPD={
  turtle(e){e.st++;const dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz);
    if(e.state=='idle'){if(e.st>60||dist<10){e.state='walk';e.st=0;}}
    else if(e.state=='walk'){e.yaw+=ang(e.yaw,Math.atan2(dx,dz))*.05;const f=fwd(e.yaw),s=.014*TS;const nx=e.x+f[0]*s,nz=e.z+f[1]*s;if(!blockedCircle(nx,nz,1.2)){e.x=nx;e.z=nz;}if(e.st>110){e.state='wind';e.st=0;sfx('growl');}}
    else if(e.state=='wind'){e.yaw+=ang(e.yaw,Math.atan2(dx,dz))*.12;if(e.st>40){e.state='charge';e.st=0;}}
    else if(e.state=='charge'){const f=fwd(e.yaw),s=.085*TS,nx=e.x+f[0]*s,nz=e.z+f[1]*s;
      if(blockedCircle(nx,nz,1.3)||e.st>180){e.state='stun';e.st=0;shake=16;sfx('boom');burst(e.x+f[0]*1.5,.5,e.z+f[1]*1.5,16,'#9a9aa4');}else{e.x=nx;e.z=nz;}}
    else if(e.state=='stun'){if(e.st>150){e.state='walk';e.st=0;}}
    if(e.state!='stun'&&dist<2.2&&p.inv==0)hurtPlayer(2,e.x,e.z);},
  wraith(e){if(e.vis>0)e.vis--;e.yaw=aimAt(e);const tx=Math.max(4,Math.min(lv.w*TS-4,p.x)),tz=Math.max(4,Math.min(lv.h*TS-6,p.z-6));
    e.x+=(tx-e.x)*.02+Math.cos(e.t/20)*.06;e.z+=(tz-e.z)*.02;e.y=2.2+Math.sin(e.t*.05)*.4;
    if(e.t%110==60)shoot(e,.2,aimAt(e),'orb');
    if(e.t%330==200&&enemies.filter(q=>q.type=='ghost'&&!q.dead).length<2)enemies.push(mkEnemy('ghost',e.x,e.z));
    if(e.vis>0&&Math.hypot(p.x-e.x,p.z-e.z)<1.5&&p.inv==0)hurtPlayer(2,e.x,e.z);
    if(e.t==30&&!st.f.wraithTip){st.f.wraithTip=1;toast('It fades in and out. Swing at its orbs to knock them back!');}},
  raven(e){const ph=e.t%120;e.y=2.4;
    if(ph<70){const tx=p.x,tz=p.z-5,dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz)||1;if(l>.3){e.x+=dx/l*.05;e.z+=dz/l*.05;}e.yaw=aimAt(e);if(ph==35)shoot(e,.22,aimAt(e),'feather');}
    else{if(ph==70||e.vx==null){const a=aimAt(e);e.vx=Math.sin(a)*.16;e.vz=Math.cos(a)*.16;sfx('growl');}e.x+=e.vx;e.z+=e.vz;e.y=Math.max(1,2.4-(ph-70)*.06);}
    e.x=Math.max(1.5,Math.min(lv.w*TS-1.5,e.x));e.z=Math.max(1.5,Math.min(lv.h*TS-1.5,e.z));
    if(Math.hypot(p.x-e.x,p.z-e.z)<1.3&&e.y<2&&p.inv==0)hurtPlayer(2,e.x,e.z);},
  bell(e){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz)||1;
    if(e.state=='stun'){if(++e.st>110){e.state='rise';e.st=0;}return;}
    if(e.state=='rise'){e.y=Math.min(5,e.y+.15);if(e.y>=5)e.state='float';return;}
    if(e.state=='drop'){e.y-=.5;if(e.y<=0){e.y=0;e.state='stun';e.st=0;shake=14;sfx('boom');sfx('bell');for(let i=0;i<8;i++)shoot(e,.2,i*Math.PI/4,'ring',.6);burst(e.x,.5,e.z,16,'#e8b070');
      if(Math.hypot(p.x-e.x,p.z-e.z)<2.2)hurtPlayer(2,e.x,e.z);}return;}
    e.y=5;if(d>.5){e.x+=dx/d*.05;e.z+=dz/d*.05;}if(e.t%140==139){e.state='drop';sfx('bell');}
    if(e.t==40&&!st.f.bellTip){st.f.bellTip=1;toast('When it slams down, it\'s stunned. Hit it then!');}},
  foreman(e){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz)||1;
    if(e.state=='stun'){if(++e.st>170){e.state='walk';e.st=0;sfx('growl');}return;}
    if(e.state=='wind'){if(++e.st>40){e.state='walk';e.st=0;shake=10;sfx('boom');for(let i=0;i<8;i++)shoot(e,.19,i*Math.PI/4+(e.hp<5?Math.PI/8:0),'spark',.8);burst(e.x,1,e.z,14,'#f8a030');}return;}
    e.state='walk';e.yaw+=ang(e.yaw,Math.atan2(dx,dz))*.1;if(d>1.6){const nx=e.x+dx/d*.03,nz=e.z+dz/d*.03;if(!blockedCircle(nx,nz,1)){e.x=nx;e.z=nz;}}
    if(e.t%150==149){e.state='wind';e.st=0;sfx('growl');}if(e.hp<=5&&e.t%90==45)shoot(e,.21,aimAt(e),'spark',1.4);
    if(d<1.9&&p.inv==0)hurtPlayer(2,e.x,e.z);},
  arum(e){if(e.state=='bloom'){if(++e.st>230){e.state='closed';e.st=0;sfx('growl');}return;}
    e.yaw=aimAt(e);if(e.t%70==35){const b=aimAt(e),n=e.hp<=4?5:3;for(let i=0;i<n;i++)shoot(e,.17,b+(i-(n-1)/2)*.32,'seed',1.6);}
    if(e.t%260==200&&enemies.filter(q=>q.type=='rat'&&!q.dead).length<2)enemies.push(mkEnemy('rat',e.x+(Math.random()<.5?-3:3),e.z+2.5));
    if(Math.hypot(p.x-e.x,p.z-e.z)<1.9&&p.inv==0)hurtPlayer(1,e.x,e.z);},
  vampire(e){const dx=p.x-e.x,dz=p.z-e.z;e.yaw=Math.atan2(dx,dz);
    if(!e.p2&&e.hp<=e.max*.6){e.p2=1;e.swarm=1;shake=10;for(let i=0;i<3;i++)enemies.push(mkEnemy('bat',e.x+(i-1)*2,e.z));burst(e.x,1.5,e.z,18,'#6c4c9e');toast('It bursts into a swarm of bats!');sfx('growl');}
    if(e.swarm){e.gone=true;if(!enemies.some(q=>q.type=='bat'&&!q.dead)){e.swarm=0;e.t=0;e.gone=false;burst(e.x,1.5,e.z,12,'#6c4c9e');toast('The bats pull back together!');}return;}
    if(!e.p3&&e.hp<=e.max*.3){e.p3=1;shake=14;toast('Engine 231 groans. The thing is desperate!');sfx('growl');}
    if(e.p3&&e.t%170==60)for(let i=0;i<8;i++)shoot(e,.19,i*Math.PI/4,'blood');
    const ph=e.t%170;e.gone=ph>=130;e.y=1.2+Math.sin(e.t*.08)*.2;
    if(ph==0){for(let i=0;i<30;i++){const x=(2+Math.random()*12)*TS,z=(3+Math.random()*6)*TS;if(!blockedCircle(x,z,.6)&&Math.hypot(x-p.x,z-p.z)>6){e.x=x;e.z=z;break;}}sfx('whoosh');burst(e.x,1.5,e.z,10,'#6c4c9e');}
    if(ph==40||ph==80||(e.hp<=7&&ph==110)){const b=aimAt(e),s0=e.hp<=7?.24:.19;for(const o of[-.4,0,.4])shoot(e,s0,b+o,'blood');}
    if(ph==100&&enemies.filter(q=>q.type=='bat'&&!q.dead).length<2)enemies.push(mkEnemy('bat',e.x,e.z));
    if(!e.gone&&Math.hypot(dx,dz)<1.3&&p.inv==0)hurtPlayer(2,e.x,e.z);}};
function foremanHooked(e){if(e.state=='stun')return;e.state='stun';e.st=0;e.flash=8;shake=6;sfx('clank');burst(e.x,1.6,e.z,16,'#d8dce4');toast('The chest plate rips loose! Hit him now!');}
const BOSSTXT={arum:['The Titan Arum wilts with a sigh you can smell from across the room.','The vines slowly pull back into their beds.'],foreman:['The Iron Foreman grinds to a halt, steam hissing from every joint.','The furnaces gutter out. Tredegar is quiet again.'],
  turtle:['Old Snapper sinks back into the deep end of the quarry pond.','Something glints where it lay.'],wraith:['The wraith thins to mist and drifts up through the granite.','The pyramid falls quiet.'],
  raven:['The raven croaks one last word. You can guess which one.','It flaps off through a crack in the brick and is gone.'],bell:['The great bell cracks and settles on its beam.','From the top of the tower, the other bells start to ring.']};
function bossDie(e){st.f['boss:'+lv.id]=1;st.f['clr:'+lv.id]=1;needSave=true;sfx('fanfare');shots=[];enemies.forEach(q=>{if(!q.boss)q.dead=true;});
  if(e.type=='vampire'){st.f.won=1;lv.g[8][7]=lv.g[8][8]='E';say(['The pale thing shrieks and comes apart like wet newspaper.','Above you the fog thins. One by one the lamps along Broad Street come back on.','Richmond is safe. Somebody owes you a ginger beer.',
    'By morning the fog has burned off the James. Every lamp from Church Hill to Carytown is lit.','The archivist adds one last story to the journal. It\'s called '+(st.name||'Rory')+' and the Fog.'],()=>{mode='credits';endT=0;sfx('fanfare');},'Engine 231');return;}
  say(BOSSTXT[e.type]||['It\'s over.'],null,lv.name);
  if(lv.d.reward){const k=mkPick('keystone',e.x-1.2,e.z);k.id=lv.d.reward;picks.push(k);}
  if(!st.got['hc:'+lv.id]){const k=mkPick('container',e.x+1.2,e.z);k.id='hc:'+lv.id;picks.push(k);}
  lv.g[8][7]=lv.g[8][8]='E';}

/* ---------- bombs ---------- */
function bombsUpdate(){for(const b of bombs){b.t--;if(b.t<=0){explode(b.x,b.z);b.done=1;}}bombs=bombs.filter(b=>!b.done);}
function explode(x,z){sfx('boom');shake=14;flash=6;burst(x,1,z,26,'#f8a030');burst(x,1,z,16,'#5a5662');
  for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.z-z);if(d<3.2+(e.boss?1:0)){if(e.type=='turtle'&&e.state!='stun'){e.state='stun';e.st=0;sfx('clank');}else hitEnemy(e,2,(e.x-x)/(d||1),(e.z-z)/(d||1),'bomb');}}
  if(Math.hypot(p.x-x,p.z-z)<2.2&&p.inv==0)hurtPlayer(1,x,z);
  for(const o of lv.dyn){if(!o.on)continue;const cells=o.cells||[[o.tx,o.ty]];if(cells.some(([a,b])=>Math.hypot(a*TS+TS/2-x,b*TS+TS/2-z)<3.4)){
    if(o.kind=='rubble'||o.kind=='crack'){removeDyn(o);sfx('secret');toast(o.kind=='crack'?'The cracked wall gives way!':'The rubble blows apart!');}else if(o.kind=='bush')removeDyn(o);}}}

/* ---------- pickups and particles ---------- */
const KEEP=['keystone','container','piece','part','bib','carkey','skey','trash','token','flag','melonpk','ballfly','tap','lure'];
function mkPick(kind,x,z){return{kind,x,z,y:.5,vy:.12,t:0,life:KEEP.includes(kind)?1e9:600};}
function picksUpdate(){for(const k of picks){if(k.got)continue;k.t++;k.life--;if(k.kind!='skey'){k.vy-=.012;k.y=Math.max(.5,k.y+k.vy);}const d=Math.hypot(k.x-p.x,k.z-p.z);
    if(d<1.1&&k.t>10){k.got=1;collect(k);}}picks=picks.filter(k=>!k.got&&k.life>0||k.got==2);}
function collect(k){switch(k.kind){
  case'coin':st.coins=Math.min(999,st.coins+1);sfx('coin');break;
  case'heart':p.hp=Math.min(st.max,p.hp+2);sfx('heart');break;
  case'ballpk':st.ammo.balls=Math.min(st.cap.balls,st.ammo.balls+3);sfx('coin');break;
  case'powpk':st.ammo.powder=Math.min(st.cap.powder,st.ammo.powder+1);sfx('coin');break;
  case'trash':case'token':case'tap':case'melonpk':case'ballfly':case'lure':case'flag':sfx('coin');burst(k.x,1,k.z,6,'#fff2a8');if(chal)chalProgress();break;
  case'keystone':{st.got[k.id]=1;p.hold=90;p.holdIc='keystone';sfx('fanfare');const n=nKeys();
    say(['You found the '+KEYNAME[k.id]+' Keystone! ('+n+' of 4)',n>=4?'All four hum together. The tunnel on Church Hill is waiting.':'Take the stairs to head back up.'],null,'Keystone');break;}
  case'container':st.got[k.id]=1;st.max+=2;p.hp=st.max;p.hold=70;p.holdIc='heart';sfx('chest');say(['A heart charm! Your hearts grew by one.']);break;
  case'piece':st.got[k.id]=1;p.hold=60;p.holdIc='heart';sfx('chest');say(give('piece'));break;
  case'part':{st.got[k.id]=1;p.hold=70;p.holdIc='part';sfx('chest');const n=['oar','pole','tiller'].filter(q=>st.got[q]).length;
    say(['You found the bateau '+k.id+'! ('+n+' of 3)',n<3?'The river historian at Ancarrow\'s Landing will want it.':'That\'s every part! Take them to the historian at Ancarrow\'s Landing.'],null,'Bateau Part');break;}
  case'bib':st.got.bib=1;p.hold=70;p.holdIc='bib';sfx('chest');say(['A race bib from the Monument Avenue 10K.','A runner in the Fan must be missing it.']);break;
  case'carkey':st.got.carkey=1;p.hold=70;p.holdIc='key';sfx('chest');say(['You found the Carillon Key!','Bring it to the Carillon in Byrd Park.']);break;
  case'skey':{st.got[k.id]=1;const ar=lv.id.split(':')[0];st.keys[ar]=(st.keys[ar]||0)+1;p.hold=60;p.holdIc='key';sfx('chest');say(['The Gold-Bug brought back a small key!']);break;}
  default:if(typeof lifeCollect=='function')lifeCollect(k);}
  needSave=true;}
function burst(x,y,z,n,c){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=.05+Math.random()*.12;parts.push({x,y,z,vx:Math.cos(a)*v,vy:.05+Math.random()*.15,vz:Math.sin(a)*v,life:30+Math.random()*20|0,c});}}
function partsUpdate(){for(const q of parts){q.x+=q.vx;q.y+=q.vy;q.z+=q.vz;q.vy-=.008;q.life--;}parts=parts.filter(q=>q.life>0);
  for(const l of later)if(--l.n<=0){l.done=1;l.f();}later=later.filter(l=>!l.done);}

/* ---------- pigeons: they peck about and scatter when you come close ---------- */
function birdsUpdate(){for(const b of birds){b.t++;
  if(b.state=='peck'){if(b.t%90==0){b.yaw+=(Math.random()-.5)*2;}if(b.t%140==70){const nx=b.x+Math.sin(b.yaw)*.4,nz=b.z+Math.cos(b.yaw)*.4;if(Math.hypot(nx-b.hx,nz-b.hz)<1.6&&!blockedCircle(nx,nz,.15)){b.x=nx;b.z=nz;}}
    if(Math.hypot(p.x-b.x,p.z-b.z)<3.4||p.swing>0&&Math.hypot(p.x-b.x,p.z-b.z)<5){b.state='fly';const a=Math.atan2(b.x-p.x,b.z-p.z)+(Math.random()-.5)*.8;b.vx=Math.sin(a)*.12;b.vz=Math.cos(a)*.12;b.vy=.09+Math.random()*.04;b.yaw=a;if(!birds.some(q=>q.state=='fly'&&q!==b&&q.t<5))sfx('flap');b.t=0;}}
  else if(b.state=='fly'){b.x+=b.vx;b.z+=b.vz;b.y+=b.vy;b.vy=Math.min(.16,b.vy+.001);b.flap+=.6;if(b.y>16){b.state='gone';b.t=0;}}
  else if(b.state=='gone'&&b.t>900&&Math.hypot(p.x-b.hx,p.z-b.hz)>10){b.state='peck';b.x=b.hx;b.z=b.hz;b.y=0;b.t=0;}}}

/* ---------- townspeople ---------- */
function npcUpdate(){for(const n of npcs){n.t++;if(n.look>0){n.look--;continue;}
  if(n.wander){const tx=n.hx+Math.sin(n.t*.006+n.i)*2.2,tz=n.hz+Math.cos(n.t*.0045+n.i*2)*1.6,dx=tx-n.x,dz=tz-n.z,l=Math.hypot(dx,dz);
    if(l>.1){const nx=n.x+dx/l*.03,nz=n.z+dz/l*.03;if(!blockedCircle(nx,nz,.4)&&Math.hypot(nx-p.x,nz-p.z)>1){n.x=nx;n.z=nz;n.walk+=.15;n.yaw+=ang(n.yaw,Math.atan2(dx,dz))*.1;}}}
  else{n.yaw+=ang(n.yaw,Math.hypot(p.x-n.x,p.z-n.z)<6?Math.atan2(p.x-n.x,p.z-n.z):0)*.05;}}}
const AREAHINT={'ow:0,0':'There\'s a path north to Bryan Park now. The botanical garden is past it.','ow:3,0':'Chimborazo Park is just east. Great view of the river.','ow:1,2':'Hear that clanking? It comes from the old Tredegar works, down in the corner of the cemetery.','ow:0,2':'The naturalist by the lake is counting frogs. Rainy days are best for that.'};
function folkContext(){const o=[];if(AREAHINT[lv.id])o.push(AREAHINT[lv.id]);if(st.f.won)o.push('The lamps are back on all over town. People say it was you who did it!');else if(nKeys()>0)o.push('Word is somebody\'s been finding the old tunnel keystones. '+nKeys()+' so far!');
  if(dark()>.6&&!lv.room)o.push('Evening, friend. Bats come out after dark, so mind yourself.');return o.length?o[Math.floor(Math.random()*o.length)]:null;}
function talkTo(n){if(n.talk=='chal'){offerChal(n,[]);return;}const f=TALK3[n.talk];if(f){const r=f(n);if(r)say(r,null,n.who);}else if(n.lines)TALK3.folk(n);else say(['Hello there!'],null,n.who);}

/* ---------- neighborhood challenges ---------- */
function offerChal(n,pre){const d=RCQ.chal[n.chal],done=st.pins[n.chal];
  say(pre.concat([d.intro,done?'You\'ve already earned this pin. Go again for a few coins?':'Win and you get a Richmond city pin.']),sel=>{if(sel==0)startChal(n.chal,n);},d.name,['Let\'s go!','Not now']);return null;}
function startChal(id,n){const d=RCQ.chal[id];
  if(d.needs=='bug'&&!st.items.bug){say(['You\'d need something that can fly over the water and bring things back.'],null,n.who);return;}
  if(d.type=='light'&&!st.items.lantern){say(['You\'ll need a lantern for this one. The archivist by the Capitol has one.'],null,n.who);return;}
  if(d.type=='quiz'){runQuiz(n);return;}
  chal={id,d,type:d.type,t:Math.round(d.time*60*2.3*(lv.world?2.4:1)),got:0,need:0,who:n.who,scene:lv.id,set:new Set()};const sp=lv.spots;
  if(d.type=='collect'){chal.need=sp.length;for(const [x,y] of sp){const k=mkPick({ball:'ballfly',tap:'tap',melon:'melonpk',lure:'lure',trash:'trash'}[d.ic]||'token',x*TS+TS/2,y*TS+TS/2);k.chal=1;picks.push(k);}}
  else if(d.type=='race'){chal.need=1;const [x,y]=sp[0];const k=mkPick('flag',x*TS+TS/2,y*TS+TS/2);k.chal=1;picks.push(k);}
  else if(d.type=='defeat'){chal.need=d.n;for(let i=0;i<d.n;i++){const [x,y]=sp[i%sp.length]||[16,10],e=mkEnemy(d.foe,x*TS+TS/2+(i>=sp.length?1:0),y*TS+TS/2);e.chal=1;enemies.push(e);}}
  else if(d.type=='light'){for(const L of lv.lamps)L.lit=false;chal.need=lv.lamps.length;}
  else if(d.type=='tag')chal.need=(lv.d.murals||[]).length;
  sfx('go');toast(d.name+': go!');}
function chalProgress(){if(!chal)return;chal.got++;sfx('light');if(chal.got>=chal.need)chalWin();else if(chal.type!='collect')toast(chal.d.name+' ('+chal.got+'/'+chal.need+')');}
function chalClear(){picks=picks.filter(k=>!k.chal);enemies=enemies.filter(e=>!e.chal);}
function chalWin(){const c=chal,first=!st.pins[c.id];st.pins[c.id]=1;st.coins=Math.min(999,st.coins+(first?25:10));chalClear();chal=null;needSave=true;sfx('fanfare');
  const L=[c.d.name+': you did it!',first?'You earned a Richmond city pin and 25 coins. ('+Object.keys(st.pins).length+' of '+Object.keys(RCQ.chal).length+' pins)':'Ten coins for another win.'];
  if(first&&Object.keys(st.pins).length>=Object.keys(RCQ.chal).length&&!st.gold){st.gold=1;L.push('That\'s every pin in Richmond! Your kayak paddle turns gold. It hits twice as hard now.');}
  say(L,null,c.who);}
function chalFail(){const c=chal;chalClear();chal=null;sfx('no');if(c.type=='light')for(const L of lv.lamps)L.lit=!!st.pins.lamps||lv.id!='ow:3,0';say(['Time\'s up!','Talk to the '+c.who.toLowerCase()+' to try again.'],null,c.d.name);}
function runQuiz(n){const read=Object.keys(st.lore);if(read.length<3){say(['Find at least three stories for your journal first, from the historical markers around town. Then come back!'],null,n.who);return;}
  const pool=read.slice(),qs=[];for(let i=0;i<3;i++)qs.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);let score=0,i=0;const all=Object.keys(RCQ.lore);
  const ask=()=>{if(i>=3){if(score==3){chal={id:'quiz',d:RCQ.chal.quiz,who:n.who};chalWin();}else say([score+' out of 3. Brush up on your journal and try again!'],null,n.who);return;}
    const id=qs[i],L=RCQ.lore[id],opts=[L.t];while(opts.length<3){const o=RCQ.lore[all[Math.floor(Math.random()*all.length)]].t;if(!opts.includes(o))opts.push(o);}
    opts.sort(()=>Math.random()-.5);const sn=L.s.split('. ')[0],q=sn.length>110?sn.slice(0,107)+'...':sn+'.';
    say(['Question '+(i+1)+' of 3: which story is this from?','"'+q+'"'],sel=>{if(opts[sel]==L.t){score++;sfx('coin');}else sfx('no');i++;ask();},n.who,opts);};
  ask();}

/* ---------- the camera: trails behind you, swing it with the right stick, Q/E or a drag ---------- */
const CAMD=5.8,CAMP=.36;
function camUpdate(){if(!lv||typeof window!='undefined'&&window.__camLock)return;const tx=p.x,ty=1.25,tz=p.z;
  if(lv.room){cam.yaw+=ang(cam.yaw,inp.camX*.5)*.08;}
  else{if(Math.abs(inp.camX)>.05){cam.yaw-=inp.camX*.045;cam.manual=90;}else if(cam.manual>0)cam.manual--;
  if(cam.manual==0&&p.moving){const want=p.yaw+Math.PI;cam.yaw+=ang(cam.yaw,want)*.018;}}
  const pitch=lv.room?.85:CAMP,want=lv.room?9.5:CAMD;let dist=want;
  if(!lv.room)for(let d=1;d<=want;d+=.25){const x=tx+Math.sin(cam.yaw)*d*Math.cos(pitch),z=tz+Math.cos(cam.yaw)*d*Math.cos(pitch),y=ty+d*Math.sin(pitch),c=tAt(x,z);
    if(c&&tallAt(c,y,Math.floor(z/TS))){dist=Math.max(1.6,d-.4);break;}}
  if(!lv.room&&cam.manual==0&&!p.moving&&dist<want*.5){cam.blocked=(cam.blocked||0)+1;if(cam.blocked>30){const y=bestYaw(cam.yaw);cam.yaw+=ang(cam.yaw,y)*.06;}}else cam.blocked=0;
  cam.dist+=(dist-cam.dist)*(cam.snap?1:dist<cam.dist?.35:.08);cam.snap=false;cam.pitch=pitch;
  cam.x=tx+Math.sin(cam.yaw)*cam.dist*Math.cos(pitch);cam.z=tz+Math.cos(cam.yaw)*cam.dist*Math.cos(pitch);cam.y=ty+cam.dist*Math.sin(pitch);cam.tx=tx;cam.ty=ty;cam.tz=tz;}
// how far the camera can pull back along a yaw before a wall or building gets in the way
function camClear(yaw,pitch,want){if(lv.world){const w=lv.world;for(let d=1;d<=want;d+=.25){const x=p.x+Math.sin(yaw)*d*Math.cos(pitch),z=p.z+Math.cos(yaw)*d*Math.cos(pitch),y=1.4+d*Math.sin(pitch),b=buildingAt(w,x,z);if(b&&!b.gone&&y<b.hm+.6)return d;}return want;}
  for(let d=1;d<=want;d+=.25){const x=p.x+Math.sin(yaw)*d*Math.cos(pitch),z=p.z+Math.cos(yaw)*d*Math.cos(pitch),y=1.4+d*Math.sin(pitch),c=tAt(x,z);
    if(c&&tallAt(c,y,Math.floor(z/TS)))return d;}return want;}
// the angle with the clearest view nearest the one we'd like, so stepping out of a door doesn't bury the camera in the building
function camRoom(x,z,y){let m=4;if(lv.world){lv.world.bh.near(x,z,4,s=>{if(s.o.gone||y>s.o.hm+.6)return;const d=segDist(x,z,s.a,s.b);if(d<m)m=d;});const b=buildingAt(lv.world,x,z);return b&&!b.gone&&y<b.hm+.6?0:m;}for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const tx=Math.floor(x/TS)+dx,tz=Math.floor(z/TS)+dz,c=tileAt(lv,tx,tz);
    if(c&&tallAt(c,y,tz)){const ex=Math.max(0,Math.abs(x-(tx+.5)*TS)-TS/2),ez=Math.max(0,Math.abs(z-(tz+.5)*TS)-TS/2);m=Math.min(m,Math.hypot(ex,ez));}}return m;}
function bestYaw(want){let best=want,bs=-1e9;for(let k=0;k<=12;k++)for(const sgn of k?[1,-1]:[1]){const y=want+sgn*k*Math.PI/12,d=camClear(y,CAMP,CAMD);
    const cx=p.x+Math.sin(y)*d*Math.cos(.42),cz=p.z+Math.cos(y)*d*Math.cos(.42),room=camRoom(cx,cz,1.4+d*Math.sin(.42));
    const sc=d/CAMD*3+Math.min(room,4)*1.2-k*.03;if(sc>bs){bs=sc;best=y;}}return best;}
function tallAt(c,y,tz){if(c=='B'||c=='e')return y<14;if('%LH'.includes(c))return y<3.2;if(c=='X'||c=='D')return y<9;if(c=='W')return y<(tz==lv.h-1?.8:4);if(c=='T')return y<3.6&&y>1;if(c=='U')return y<2.4;return false;}

/* ---------- pause menu: items, journal, map (and the bus) ---------- */
const MTABS=['ITEMS','JOURNAL','MAP','ALBUM','SYSTEM'];
function busList(){return Object.keys(RCQ.maps).filter(k=>st.vis[k]).sort((a,b)=>{const [ax,ay]=a.slice(3).split(',').map(Number),[bx,by]=b.slice(3).split(',').map(Number);return ay-by||ax-bx;});}
function menuUpdate(){const m=menu;
  if(m.rd){if(inp.a||inp.b){if(m.rd.pg<m.rd.pages.length-1)m.rd.pg++;else m.rd=null;sfx('blip');}return;}
  if(inp.menu||inp.start||(inp.b&&m.tab!=1)){menu=null;sfx('blip');return;}
  if(inp.left){m.tab=(m.tab+MTABS.length-1)%MTABS.length;sfx('blip');}if(inp.right){m.tab=(m.tab+1)%MTABS.length;sfx('blip');}
  if(m.tab==0){const own=ownItems();if(own.length){if(inp.up)m.ic=(m.ic+own.length-1)%own.length;if(inp.down)m.ic=(m.ic+1)%own.length;if(inp.a){st.eq=own[m.ic%own.length];sfx('blip');toast('B: '+itemLabel(st.eq));}}}
  if(m.tab==1){const ids=Object.keys(RCQ.lore);if(inp.up)m.jc=(m.jc+ids.length-1)%ids.length;if(inp.down)m.jc=(m.jc+1)%ids.length;
    if(inp.a){const id=ids[m.jc];if(st.lore[id]){m.rd={t:RCQ.lore[id].t,pages:wrapPages(RCQ.lore[id].s),pg:0};sfx('blip');}else sfx('no');}if(inp.b)menu=null;}
  if(m.tab==2){const L=busList();if(!L.length)return;if(m.bi==null||m.bi>=L.length)m.bi=Math.max(0,L.indexOf(lv.id));if(inp.up)m.bi=(m.bi+L.length-1)%L.length;if(inp.down)m.bi=(m.bi+1)%L.length;
    if(inp.a){const id=L[m.bi];if(lv.room){toast('Head back outside to catch a bus.');sfx('no');}else if(id!=lv.id){const s=sceneData(id);menu=null;startTrans(id,s.w*TS/2,s.h*TS/2,0);toast('You ride the GRTC bus to '+s.name+'.');}}}
  if(m.tab==4){if(inp.up)m.sel=(m.sel+2)%3;if(inp.down)m.sel=(m.sel+1)%3;if(inp.a){if(m.sel==0){saveGame();toast('Saved.');menu=null;}else if(m.sel==1){saveGame();menu=null;mode='title';titleSel=0;}
    else if(typeof setQuality=='function'){const o=QUAL.auto?0:QUAL.lvl+1,n=(o+1)%4;setQuality(n==0,n==0?QUAL.lvl:n-1);sfx('blip');}}}}
function goalText(){
  if(!st.items.lantern)return'Talk to the archivist beside the Capitol.';
  if(!st.got.granite)return'Cross the footbridge south of Capitol Square to the Belle Isle quarry.';
  if(!st.got.iron)return'Blast the rubble off the pyramid door in Hollywood Cemetery.';
  if(!st.got.brick)return'Find the Poe Museum cellar in Shockoe Bottom.';
  if(!st.got.bronze){if(st.got.carkey)return'Climb the Carillon in Byrd Park.';if(st.items.kayak)return'Paddle south to Forest Hill Park and look for the Carillon key.';
    return st.trade=='melon'?'Someone hungry in Jackson Ward might trade for that watermelon.':st.trade=='music'?'The organist at the Byrd Theatre would love that sheet music.':st.trade=='rivermap'?'The kayaker on Belle Isle wants that river map.':'Ask the Carillon caretaker in Byrd Park, then visit the melon vendor in Carytown.';}
  if(!st.f.won)return'Take all four keystones to the tunnel on Church Hill.';
  if(!st.f['boss:tredegar:0,0'])return'Explore Tredegar Iron Works, in the corner of Hollywood Cemetery.';
  if(!st.f['boss:conserv:0,0'])return'Explore the conservatory at Lewis Ginter Botanical Garden, north of Bryan Park.';
  if(!st.f.bateau)return'Help the river historian at Ancarrow\'s Landing rebuild a bateau.';
  return'Win every neighborhood pin and fill your journal.';}
function goalScene(){if(!st.items.lantern)return'ow:2,1';if(!st.got.granite)return'ow:2,2';if(!st.got.iron)return'ow:1,2';if(!st.got.brick)return'ow:3,1';
  if(!st.got.bronze){if(st.got.carkey)return'ow:0,2';if(st.items.kayak)return'ow:1,3';return st.trade=='melon'?'ow:2,0':st.trade=='music'?'ow:0,1':st.trade=='rivermap'?'ow:2,2':'ow:0,2';}
  if(!st.f.won)return'ow:3,0';if(!st.f['boss:tredegar:0,0'])return'ow:1,2';if(!st.f['boss:conserv:0,0'])return'ow:1,-1';if(!st.f.bateau)return'ow:3,3';return null;}

/* ---------- shops ---------- */
const SHOPS={
  carytown:{title:'CARYTOWN GOODS',who:'Shopkeeper',items:[
    {name:'Heart Charm',price:15,why:()=>st.got.hcShop?'SOLD OUT':'',buy(){st.got.hcShop=1;give('hc');}},
    {name:'10 Baseballs',price:4,why:()=>!st.items.balls?'???':st.ammo.balls>=st.cap.balls?'FULL':'',buy(){st.ammo.balls=Math.min(st.cap.balls,st.ammo.balls+10);}},
    {name:'4 Powder Kegs',price:8,why:()=>!st.items.powder?'???':st.ammo.powder>=st.cap.powder?'FULL':'',buy(){st.ammo.powder=Math.min(st.cap.powder,st.ammo.powder+4);}},
    {name:'Ginger Beer',price:5,why:()=>!st.items.bottle?'NO BOTTLE':st.bottle?'FULL':'',buy(){st.bottle=1;}},
    {name:'Big Satchel',price:60,why:()=>st.f.satchel?'SOLD OUT':'',buy(){st.f.satchel=1;st.cap.balls=Math.max(st.cap.balls,50);st.cap.powder=Math.max(st.cap.powder,16);}}]}};
function openShop(k){shop={k,cur:0,msg:'What can I get you?'};}
function shopUpdate(){const S=SHOPS[shop.k],L=S.items;
  if(inp.b||inp.menu){shop=null;say(['Come back any time!'],null,S.who);return;}
  if(inp.up)shop.cur=(shop.cur+L.length-1)%L.length;if(inp.down)shop.cur=(shop.cur+1)%L.length;
  if(inp.a){const it=L[shop.cur],why=it.why();
    if(why){sfx('no');shop.msg=why=='???'?'You\'d need one of those first.':why=='FULL'?'You can\'t carry more.':why=='NO BOTTLE'?'You need a bottle for that.':'That one\'s gone.';}
    else if(st.coins<it.price){sfx('no');shop.msg='Not enough coins.';}else{st.coins-=it.price;const r=it.buy();sfx('coin');shop.msg=typeof r=='string'?r:'Thank you kindly!';needSave=true;}}}

/* ---------- title ---------- */
function titleOpts(){return loadSave()?['CONTINUE','NEW GAME']:['NEW GAME'];}
function titleUpdate(){const o=titleOpts();if(inp.up)titleSel=(titleSel+o.length-1)%o.length,sfx('blip');if(inp.down)titleSel=(titleSel+1)%o.length,sfx('blip');
  if(inp.a||inp.start){const c=o[titleSel%o.length];sfx('go');audioStart();if(c=='CONTINUE')startGame(loadSave());else startGame(null);}}
function vibrate(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
