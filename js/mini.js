"use strict";
/* River City Quest 3D: the mini-games. Batting practice at The Diamond, free throws at the Siegel Center,
   tennis on Arthur Ashe Boulevard, pinball in the Stone House arcade, and three races: the Libby Hill
   soapbox derby, the Capital Trail time trial and the Richmond Raceway dash. Each one runs in mode 'mini'
   with its own little 3D set and camera. The rules are the 2D game's, measured in its old pixel units. */
let mini=null;
const MINI={
  bat:{name:'Batting Practice'},hoops:{name:'Rams Free Throws'},tennis:{name:'Ashe Center Tennis'},pin:{name:'River City Ramble'},
  derby:{name:'Libby Hill Soapbox Derby',gold:15.5,silver:19,who:'The Derby Kid',flag:'derbyGold',len:3100,top:4.2},
  trail:{name:'Capital Trail Time Trial',gold:21,silver:26,who:'The cyclist',flag:'trailGold',len:4200,top:4.2},
  race:{name:'Richmond Raceway Dash',gold:14.5,silver:18,who:'The race official',flag:'raceGold',len:3900,top:5.2}};
const RACES=['derby','trail','race'];
function startMini(kind){mini={kind,t:0,done:false,msg:''};mode='mini';sfx('go');const m=mini;
  if(kind=='bat')Object.assign(m,{n:0,hits:0,hr:0,ball:null,swing:0,msg:'Press A to swing',wait:60});
  if(kind=='hoops')Object.assign(m,{n:0,made:0,ph:0,sp:.05,ball:null,msg:'Press A when the needle is centered'});
  if(kind=='tennis')Object.assign(m,{x:128,ball:null,wait:50,ret:0,miss:0,sw:0,msg:'Left and right to move, A to swing'});
  if(kind=='pin')Object.assign(m,{balls:3,score:0,ball:null,fl:[0,0],flv:[0,0],launch:40,bumps:[[92,60,9],[164,60,9],[128,92,10],[60,104,7],[196,104,7]],lit:[0,0,0,0,0],still:0,msg:'B: left flipper   A: right flipper'});
  if(RACES.includes(kind)){const M=MINI[kind],L=M.len,obs=[],tr=kind=='trail',rc=kind=='race';
    for(let y=260;y<L-100;y+=(tr?80:rc?70:90)+rnd(70)){const k=rnd(4);obs.push({x:76+rnd(100),y,k:tr?['goose','jogger','puddle','goose'][k]:rc?['car','car','oil','car'][k]:['hay','cone','puddle','hay'][k],hit:false,v:rc&&k!=2?1.2+Math.random()*1.4:0,c:rnd(4)});}
    Object.assign(m,{x:128,v:0,y:0,obs,time:0,bump:0,len:L,count:120,msg:'Steer with left and right'});}}
function endMini(lines){const k=mini.kind;mini=null;mode='play';if(lines&&lines.length)say(lines,null,MINI[k].name);needSave=true;}
function miniBest(k,v,lower){st.mini=st.mini||{};const b=st.mini[k];if(b==null||(lower?v<b:v>b)){st.mini[k]=v;return true;}return false;}
function miniUpdate(){const m=mini;m.t++;if(inp.menu||inp.start){endMini(['You walk away from the game.']);return;}if(m.done)return;MUPD[m.kind](m);}
const pay=n=>{st.coins=Math.min(999,st.coins+n);};

const PLATE=166;
const MUPD={
  bat(m){if(m.swing>0)m.swing--;
    if(!m.ball){if(m.n>=10){m.done=true;const coins=m.hits*2+m.hr*5;pay(coins);const nb=miniBest('bat',m.hits);if(m.hr>=3)st.f.slugger=1;
        endMini(['Ten pitches: '+m.hits+' hits, '+m.hr+' home runs.','The coach slips you '+coins+' coins.'+(nb?' That\'s your best round yet!':'')+(m.hr>=3?' Three homers! They\'ll call you Slugger.':'')]);return;}
      if(--m.wait<=0){const sp=1.6+Math.random()*1.6;m.ball={x:128,y:58,vy:sp,vx:(Math.random()-.5)*.5,arr:Math.round((PLATE-58)/sp),age:0,res:null,p:[0,1.6,-17],v:[0,0,0]};sfx('throw');m.msg='Pitch '+(m.n+1)+' of 10';}return;}
    const b=m.ball;b.age++;
    if(!b.res){b.y+=b.vy;b.x+=b.vx;b.vx*=.99;const k=(b.y-58)/(PLATE-58);b.p=[(b.x-128)/14,1.7-k*.75+Math.sin(k*Math.PI)*.35,-17+k*17];
      if(inp.a&&m.swing==0){m.swing=12;sfx('swing');const d=b.age-b.arr,ad=Math.abs(d);b.res=ad<=2?'hr':ad<=5?'hit':ad<=8?'foul':'miss';
        if(b.res=='hr'){m.hr++;m.hits++;b.v=[(Math.random()-.5)*.25,.42,-.95];sfx('crack');sfx('cheer');m.msg='HOME RUN!';shake=8;vibrate(60);}
        else if(b.res=='hit'){m.hits++;b.v=[(d<0?-1:1)*(.2+Math.random()*.25),.2,-.6];sfx('crack');m.msg='Base hit!';vibrate(30);}
        else if(b.res=='foul'){b.v=[d<0?-.55:.55,.25,-.1];sfx('hit');m.msg=d<0?'Foul, too early':'Foul, too late';}
        else m.msg=d<0?'Swing and a miss! Too early.':'Swing and a miss! Too late.';}
      if(b.y>PLATE+18&&!b.res){b.res='miss';b.called=1;m.msg='Strike! You watched it go by.';sfx('no');}}
    else if(b.res=='miss'){b.p[2]+=.5;}else{b.p=b.p.map((v,i)=>v+b.v[i]);b.v[1]-=.012;if(b.p[1]<.1){b.p[1]=.1;b.v[1]=Math.abs(b.v[1])*.4;b.v[0]*=.7;b.v[2]*=.7;}}
    if(b.res&&b.age>b.arr+(b.res=='hr'?110:70)){m.ball=null;m.n++;m.wait=50;}},
  hoops(m){if(m.ball){const b=m.ball;b.t++;if(b.t==b.T){if(b.res!='miss'){m.made++;sfx(b.res=='swish'?'swish':'clank');sfx('cheer');vibrate(20);}else sfx('clank');m.msg=b.res=='swish'?'Swish!':b.res=='rim'?'In off the rim!':'Clank. Missed.';}
      if(b.t>b.T+40){m.ball=null;m.n++;m.sp=.05+m.n*.008;}return;}
    if(m.n>=10){m.done=true;const coins=m.made*2;pay(coins);const nb=miniBest('hoops',m.made);if(m.made>=8)st.f.havoc=1;endMini([m.made+' of 10 from the line.','The coach tosses you '+coins+' coins.'+(nb?' Your best yet!':'')+(m.made>=8?' That\'s Havoc!':'')]);return;}
    m.ph+=m.sp;if(inp.a){const off=Math.sin(m.ph)*50,ad=Math.abs(off),res=ad<7?'swish':ad<15?(Math.random()<.6?'rim':'miss'):'miss';m.ball={t:0,T:44,res,side:off<0?-1:1};sfx('throw');}},
  tennis(m){m.x=Math.max(40,Math.min(216,m.x+inp.x*2.4));if(m.sw>0)m.sw--;if(inp.a&&m.sw==0){m.sw=14;sfx('swing');}
    if(m.miss>=3){m.done=true;const coins=m.ret;pay(coins);const nb=miniBest('tennis',m.ret);if(m.ret>=15)st.f.ace=1;endMini([m.ret+' returns before three misses.','The coach hands you '+coins+' coins.'+(nb?' A new best!':'')+(m.ret>=15?' Arthur Ashe would be proud.':'')]);return;}
    if(!m.ball){if(--m.wait<=0){const sp=1.6+Math.min(2.2,m.ret*.09),tx=50+rnd(156);m.ball={x:128,y:40,vx:(tx-128)/((150-40)/sp),vy:sp,up:false,h:1};sfx('throw');}return;}
    const b=m.ball;b.x+=b.vx;b.y+=b.vy;if(b.x<30||b.x>226)b.vx=-b.vx;
    if(!b.up&&m.sw>6&&Math.abs(b.y-150)<12&&Math.abs(b.x-m.x)<18){b.up=true;b.vy=-3.2;b.vx=(b.x-m.x)*.12;m.ret++;sfx('hit');m.msg='Return '+m.ret+'!';vibrate(15);}
    if(b.up&&b.y<34){m.ball=null;m.wait=30;}if(!b.up&&b.y>210){m.ball=null;m.wait=50;m.miss++;sfx('no');m.msg='Missed! ('+(3-m.miss)+' left)';}},
  pin(m){for(let i=0;i<2;i++){const on=i==0?inp.bh:inp.ah,prev=m.fl[i];m.fl[i]=Math.max(0,Math.min(1,m.fl[i]+(on?.35:-.18)));m.flv[i]=m.fl[i]-prev;if(on&&prev==0)sfx('push');}
    if(!m.ball){if(m.balls<=0){m.done=true;const coins=Math.floor(m.score/500);pay(coins);const nb=miniBest('pin',m.score);endMini(['Game over! Score: '+m.score+'.','The machine spits out '+coins+' coins.'+(nb?' New high score!':'')]);return;}
      if(--m.launch<=0){m.ball={x:236,y:40,vx:-1.6-Math.random(),vy:.5};sfx('shoot');m.msg='Ball '+(4-m.balls)+' of 3';}return;}
    const b=m.ball;for(let s=0;s<2;s++){b.vy+=.045;b.x+=b.vx/2;b.y+=b.vy/2;const sp=Math.hypot(b.vx,b.vy);if(sp>7){b.vx*=7/sp;b.vy*=7/sp;}
      if(b.x<22){b.x=22;b.vx=Math.abs(b.vx)*.8;}if(b.x>244){b.x=244;b.vx=-Math.abs(b.vx)*.8;}if(b.y<34){b.y=34;b.vy=Math.abs(b.vy)*.8;}
      if(b.y<70&&b.x>200&&(b.x-200)+(70-b.y)>60)b.vx=-Math.abs(b.vx)-.5;
      m.bumps.forEach(([x,y,r],i)=>{const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy);if(d<r+3){const nx=dx/d,ny=dy/d;b.x=x+nx*(r+3);b.y=y+ny*(r+3);const dot=b.vx*nx+b.vy*ny;b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.vx+=nx*1.6;b.vy+=ny*1.6;m.score+=100;m.lit[i]=12;sfx('ping');}});
      for(const [x1,y1,x2,y2] of [[22,150,96,178],[244,150,160,178]]){const r=segHit(b,x1,y1,x2,y2,3);if(r){b.vx=r[0];b.vy=r[1];}}
      for(let i=0;i<2;i++){const [x1,y1,x2,y2]=flipSeg(i,m),r=segHit(b,x1,y1,x2,y2,3);if(r){b.vx=r[0];b.vy=r[1];if(m.flv[i]>0){b.vy-=5*m.flv[i]+2;b.vx+=(i==0?1:-1)*1.2;}}}}
    if(Math.hypot(b.vx,b.vy)<.35){if(++m.still>40){b.vx+=b.x<128?.9:-.9;b.vy-=.6;m.still=0;}}else m.still=0;
    for(let i=0;i<m.lit.length;i++)if(m.lit[i]>0)m.lit[i]--;
    if(b.y>230){m.ball=null;m.balls--;m.launch=60;sfx('die');m.msg=m.balls?'Ball lost!':'';}}};
for(const k of RACES)MUPD[k]=raceUpdate;
const PFL=[{x:96,y:178,dir:1},{x:160,y:178,dir:-1}],PFLEN=26;
function flipSeg(i,m){const f=PFL[i],a=(f.dir>0?.45:Math.PI-.45)-f.dir*m.fl[i]*.9;return[f.x,f.y,f.x+Math.cos(a)*PFLEN,f.y+Math.sin(a)*PFLEN];}
function segHit(b,x1,y1,x2,y2,r){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((b.x-x1)*dx+(b.y-y1)*dy)/l2)),px=x1+dx*t,py=y1+dy*t,ex=b.x-px,ey=b.y-py,d=Math.hypot(ex,ey);
  if(d>=r||d==0)return null;const nx=ex/d,ny=ey/d;b.x=px+nx*r;b.y=py+ny*r;const dot=b.vx*nx+b.vy*ny;if(dot>0)return null;return[(b.vx-2*dot*nx)*.85,(b.vy-2*dot*ny)*.85];}
function raceUpdate(m){if(m.count>0){m.count--;if(m.count%40==0)sfx(m.count?'blip':'go');m.msg=m.count>0?String(Math.ceil(m.count/40)):'GO!';return;}if(m.t%60==0&&m.msg=='GO!')m.msg='';
  m.time++;const slow=m.bump>0;if(m.bump>0)m.bump--;const M=MINI[m.kind];m.v=Math.min(slow?1.6:M.top,m.v+(m.kind=='race'?.05:.04));m.y+=m.v;for(const o of m.obs)if(o.v)o.y+=o.v;
  m.x=Math.max(64,Math.min(192,m.x+inp.x*1.8));if(m.kind=='race'&&m.t%6==0)sfx('engine');
  for(const o of m.obs){if(o.hit)continue;const sy=o.y-m.y;if(sy>120&&sy<150&&Math.abs(o.x-m.x)<14){o.hit=true;
    if(o.k=='puddle'||o.k=='oil'){m.v*=.6;sfx('splash');}else{m.bump=40;m.v=1;shake=6;vibrate(40);sfx('hit');if(o.k=='goose')sfx('growl');}}}
  if(m.y>=m.len){m.done=true;const s=m.time/60,medal=s<M.gold?'gold':s<M.silver?'silver':'bronze',coins={gold:20,silver:10,bronze:5}[medal];pay(coins);
    const nb=miniBest(m.kind,Math.round(m.time),true);if(medal=='gold')st.f[M.flag]=1;sfx(medal=='gold'?'fanfare':'chest');
    endMini(['Finished in '+fmtTime(m.time)+'! That\'s a '+medal+' medal.',M.who+' hands over '+coins+' coins.'+(nb?' A new best time!':'')]);}}

/* ---------- the sets: one static mesh per game, built once ---------- */
const MSET={};
function crowd(M,x0,x1,z,y,rows,face){for(let r=0;r<rows;r++){M.box(x0,y+r*.6,z+r*face*.8,x1,y+r*.6+.6,z+(r+1)*face*.8,'concrete');for(let x=x0+.3;x<x1;x+=.7){const h=hash(Math.round(x*10),r,7),c=rgb(['#e83048','#3d63c8','#f2c14e','#58a850','#e8e4dc','#2a2a34','#b890f8'][h%7]);
  M.box(x-.18,y+r*.6+.6,z+(r+.5)*face*.8-.15,x+.18,y+r*.6+1.15,z+(r+.5)*face*.8+.15,'white',c);M.sphere(x,y+r*.6+1.3,z+(r+.5)*face*.8,.15,6,3,'white',rgb(['#e8b890','#c08860','#8a5a3a','#f0c8a0'][h%4]));}}}
function buildSet(k){const M=new Mesh();
  if(k=='bat'){M.floor(-60,-60,60,20,0,'grass');M.quad([0,.02,2.5],[13,.02,-10.5],[0,.02,-23.5],[-13,.02,-10.5],'dirt');M.quad([0,.03,-1],[8,.03,-9],[0,.03,-17],[-8,.03,-9],'grass2');
    M.lathe(0,0,-17,[[0,2.2],[.3,1.8],[.32,0]],10,'dirt');M.box(-.3,.3,-17.1,.3,.34,-16.9,'white');for(const [x,z] of [[8.5,-9],[0,-17.5],[-8.5,-9]])M.box(x-.3,0,z-.3,x+.3,.1,z+.3,'white');M.box(-.35,0,-.35,.35,.05,.35,'white');
    for(let a=-1;a<=1;a+=.05){const x=Math.sin(a*.9)*46,z=-Math.cos(a*.9)*46-2;M.box(x-1.3,0,z-.3,x+1.3,3.2,z+.3,'white',rgb('#2e5a3a'));}M.box(-12,3.2,-48.5,12,8,-47.5,'white',rgb('#1e3a5e'));M.box(-9,4.5,-47.4,9,7.2,-47.3,'clock');
    for(const x of [-30,30]){M.box(x-.3,0,-40,x+.3,16,-39.4,'white',[.6,.6,.65]);M.box(x-2,16,-40.5,x+2,18,-39,'white',[.9,.9,.8]);}
    crowd(M,-34,-14,-52,0,4,-1);crowd(M,14,34,-52,0,4,-1);}
  if(k=='hoops'){M.floor(-9,-7,9,9,0,'woodfl');M.box(-.05,.01,-7,.05,.02,9,'white');M.quad([-2.4,.015,-4.6],[2.4,.015,-4.6],[2.4,.015,.8],[-2.4,.015,.8],'white',rgb('#e8b0a0'));M.box(-2.4,.02,.75,2.4,.03,.85,'white');
    M.box(-.15,0,-5.8,.15,3.6,-5.6,'white',[.3,.3,.35]);M.box(-.9,2.7,-5.4,.9,3.9,-5.3,'white',[.98,.98,1]);M.box(-.3,3,-5.29,.3,3.45,-5.27,'white',rgb('#e83048'));M.box(-.25,3.05,-5.28,.25,3.4,-5.26,'white',[.98,.98,1]);
    M.lathe(0,3.05,-4.8,[[0,.24],[.03,.24]],10,'white',rgb('#e86a20'));M.lathe(0,2.65,-4.8,[[0,.15],[.4,.24]],10,'rails',[1,1,1]);M.box(-.05,3.05,-5.3,.05,3.08,-5.04,'white',rgb('#e86a20'));
    crowd(M,-9,9,-8,0,5,-1);crowd(M,-9.5,-9.4,-7,0,0,1);for(const s of [-1,1])for(let z=-7;z<8;z+=.01){M.box(s*9-.1,0,-7,s*9+.1,1,9,'white',[.2,.2,.24]);break;}
    M.box(-9,0,-15,9,9,-14.6,'white',[.12,.12,.16]);M.box(-6,5.5,-14.5,6,7,-14.4,'white',rgb('#f2c14e'));}
  if(k=='tennis'){M.floor(-12,-16,12,14,0,'white',rgb('#3a7ab0'));M.quad([-5.5,.01,-12],[5.5,.01,-12],[5.5,.01,12],[-5.5,.01,12],'white',rgb('#3a8ac8'));
    for(const [x0,z0,x1,z1] of [[-5.5,-12,5.5,-11.9],[-5.5,11.9,5.5,12],[-5.5,-12,-5.4,12],[5.4,-12,5.5,12],[-4.2,-12,-4.1,12],[4.1,-12,4.2,12],[-4.2,-6.4,4.2,-6.3],[-4.2,6.3,4.2,6.4],[-.05,-6.4,.05,6.4]])M.box(x0,.01,z0,x1,.03,z1,'white');
    M.box(-6,0,-.03,6,1,.03,'rails',[.9,.9,.9]);M.box(-6,.95,-.05,6,1.05,.05,'white');for(const x of [-6,6])M.box(x-.06,0,-.06,x+.06,1.1,.06,'white',[.3,.3,.3]);
    M.box(-.9,0,-13.2,.9,1.4,-11.8,'white',[.35,.35,.4]);M.tube([0,1,-12],[0,1,-11.2],.3,.25,8,'white',[.2,.2,.25]);for(const s of [-1,1])M.box(s*12-.1,0,-16,s*12+.1,3.5,14,'rails',rgb('#2e5a3a'));M.box(-12,0,-16.1,12,3.5,-15.9,'rails',rgb('#2e5a3a'));
    for(let z=-14;z<14;z+=5)for(const s of [-1,1]){const x=s*15;M.lathe(x,0,z,[[0,.25],[2,.2]],6,'bark');M.sphere(x,3,z,1.6,7,4,'leaves');}}
  if(k=='pin'){const X=x=>(x-128)/10,Z=y=>(y-130)/10;M.box(-13,-.6,-12,13,0,12,'white',rgb('#2a1a4a'));M.floor(-12.4,-10,12.4,11,.001,'white',rgb('#3a2a6a'));
    for(const [x0,z0,x1,z1] of [[-13,-11,13,-10],[-13,-11,-12.4,12],[12.4,-11,13,12]])M.box(x0,0,z0,x1,1.2,z1,'wood');
    M.tube([X(22),.3,Z(150)],[X(96),.3,Z(178)],.25,.25,6,'wood');M.tube([X(244),.3,Z(150)],[X(160),.3,Z(178)],.25,.25,6,'wood');M.tube([X(200),.3,Z(34)],[X(250),.3,Z(84)],.25,.25,6,'wood');
    for(let i=0;i<5;i++)M.box(X(40+i*40)-.3,.01,Z(40)-.3,X(40+i*40)+.3,.05,Z(40)+.3,'white',[.4,.3,.1]);M.quad([-10,.01,-6],[10,.01,-6],[10,.01,3],[-10,.01,3],'mural',[.55,.45,.7]);
    M.box(-13,0,-12.5,13,9,-11,'white',rgb('#1a1030'));M.box(-11,2,-11.05,11,8,-11,'marquee');M.floor(-40,-40,40,40,-.62,'woodfl',[.4,.3,.25]);}
  if(RACES.includes(k)){const L=MINI[k].len/10+60,rc=k=='race',tr=k=='trail',W=rc?7.5:5.5,Y=z=>k=='derby'?z*.06:0;
    for(let z=20;z>-L;z-=4){const y0=Y(z),y1=Y(z-4);M.quad([-W,y0,z],[W,y0,z],[W,y1,z-4],[-W,y1,z-4],k=='derby'?'cobble':'concrete',rc?[.55,.55,.6]:tr?[.7,.7,.72]:null);
      if(!rc)for(const s of [-1,1])M.quad([s*W,y0,z],[s*(W+2.5),y0+.12,z],[s*(W+2.5),y1+.12,z-4],[s*W,y1,z-4],k=='derby'?'sidewalk':'grass',null);
      if(z%8==0&&!rc)M.box(-.08,y0+.01,z-1.5,.08,y0+.02,z,'white',[.95,.9,.5]);
      if(rc){for(const s of [-1,1])M.box(s*W-(s>0?0:.4),y0,z-4,s*W+(s>0?.4:0),y0+1.1,z,'white',(Math.floor(z/4)&1)?[.95,.95,.95]:rgb('#e83048'));M.box(-W,y0+.01,z-.2,W,y0+.02,z,'white',[.42,.42,.46]);}}
    if(k=='derby')for(let z=10;z>-L;z-=6)for(const s of [-1,1]){const y=Y(z)-.5,x=s*(W+2.5),h=7+hash(z,s,3)%3*1.2,c=rgb(['#a8543a','#8a4430','#b86448','#9a5040'][hash(z,s,1)%4]);
      M.box(s>0?x:x-6,y,z-5.9,s>0?x+6:x,y+h,z,{top:'roof',side:'brickwin'},c);M.box(s>0?x-.05:x-.9,y,z-4,s>0?x+.9:x+.05,y+.9,z-2,'steps');}
    if(tr)for(let z=10;z>-L;z-=7){M.lathe(W+5+hash(z,1,1)%3,0,z,[[0,.28],[2.4,.22]],6,'bark');M.sphere(W+5+hash(z,1,1)%3,3.4,z,1.7,7,4,'leaves');M.quad([-W-2.5,-.2,z],[-W-40,-.2,z],[-W-40,-.2,z-7],[-W-2.5,-.2,z-7],'white',rgb('#4a7aa8'));
      if(z%21==0)M.lathe(W+3,0,z,[[0,.08],[1.6,.06]],5,'white',[.3,.3,.3]);}
    if(rc){for(let z=10;z>-L;z-=12)for(let r=0;r<4;r++){const x0=W+3+r*.8;M.box(x0,r*.6,z-12,x0+.8,r*.6+.6,z,'concrete');for(let zz=z-11.6;zz<z;zz+=.7){const h=hash(Math.round(zz*10),r,5);
        M.box(x0+.25,r*.6+.6,zz-.18,x0+.55,r*.6+1.15,zz+.18,'white',rgb(['#e83048','#3d63c8','#f2c14e','#58a850','#e8e4dc','#2a2a34'][h%6]));M.sphere(x0+.4,r*.6+1.3,zz,.15,6,3,'white',rgb(['#e8b890','#c08860','#8a5a3a','#f0c8a0'][h%4]));}}for(let z=10;z>-L;z-=8)M.quad([-W-.4,0,z],[-W-30,0,z],[-W-30,0,z-8],[-W-.4,0,z-8],'grass');for(let z=10;z>-L;z-=12)M.floor(W+.4,z-12,W+3,z,0,'concrete');}
    const fz=-(MINI[k].len-135)/10,fy=Y(fz);for(let i=0;i<16;i++)for(let j=0;j<2;j++)M.box(-W+i*W/8,fy+.02,fz-j*.5,-W+(i+1)*W/8,fy+.03,fz-(j+1)*.5,'white',(i+j)&1?[1,1,1]:[.08,.08,.1]);
    for(const s of [-1,1])M.box(s*(W+.3)-.15,fy,fz-.6,s*(W+.3)+.15,fy+4,fz-.3,'white',[.85,.85,.85]);M.box(-W-.3,fy+3.4,fz-.6,W+.3,fy+4.2,fz-.3,'white',rgb('#e83048'));}
  return M;}

/* ---------- drawing ---------- */
function miniCam(m){const k=m.kind;
  if(k=='bat')return[[2.4,2.6,4.6],[-.4,1.1,-12]];if(k=='hoops')return[[1.5,3.1,6.8],[0,2.5,-4.8]];if(k=='tennis'){const x=(m.x-128)/18;return[[x*.6,3.6,10.5],[x*.3,.6,-6]];}if(k=='pin')return[[0,19,19],[0,0,-.5]];
  const rx=(m.x-128)/10,z=-m.y/10,y=m.kind=='derby'?z*.06:0;return[[rx*.55,y+3.2,z+6.8],[rx*.7,y+.8+(m.kind=='derby'?-.4:0),z-7]];}
const MSKY={bat:[.55,.72,.92],hoops:[.08,.08,.12],tennis:[.62,.78,.95],pin:[.05,.03,.1],derby:[.66,.72,.82],trail:[.66,.78,.88],race:[.6,.72,.9]};
function renderMini(shadowPass){const m=mini,k=m.kind,sky=MSKY[k],indoor=k=='hoops'||k=='pin';
  if(!shadowPass)setCommon(indoor?sky:[.78,.84,.92],RACES.includes(k)?[60,140]:[80,200],indoor?.9:1,indoor?[[0,8,0,30,[.6,.55,.45]],[0,6,-6,20,[.5,.5,.45]]]:[]);
  if(!MSET[k])MSET[k]=meshGL(buildSet(k));drawVAO(MSET[k]);
  const H=getModel('player:'+(st.gold?1:0),()=>humanoid({hat:'#e83048',shirt:'#3d63c8',skin:'#e8b890',pants:'#3c3c54',hair:'#6a3a1e',paddle:true,acc:['pack']}));
  const mdl=(n,b)=>getModel(n,b),put=(mm,x,y,z,yaw,sc,opt,pose)=>drawModel(mm,M4.mul(M4.mul(M4.tr(x,y,z),M4.ry(yaw||0)),M4.sc(sc||1)),pose||null,opt);
  if(k=='bat'){const sw=m.swing>0?(12-m.swing)/12:0;put(H,.95,0,.2,-Math.PI/2+.25,1,null,humanPose(0,false,{armR:{x:-1.6,y:1.4-sw*3.2},armL:{x:-1.2,y:.4-sw*1.4},body:{y:-sw*.8}}));
    const pit=mdl('npc:pitcher',()=>humanoid({hat:'#1e3a5e',shirt:'#e8e4dc',pants:'#e8e4dc',skin:'#c08860'}));const wind=m.ball&&m.ball.age<20?Math.sin(m.ball.age/20*Math.PI):0;put(pit,0,.3,-17,0,1,null,humanPose(0,false,{armR:{x:-2.6*wind}}));
    const cat=mdl('npc:catcher',()=>humanoid({hat:'#1e3a5e',shirt:'#2e4a8a',pants:'#e8e4dc',acc:['helmet'],capless:true}));put(cat,0,-.5,2.2,Math.PI,1,null,humanPose(0,false,{legL:{x:-1.4},legR:{x:-1.4},armL:{x:-1.2}}));
    if(m.ball)put(mdl('ball',()=>lifeModel('ball')),m.ball.p[0],m.ball.p[1],m.ball.p[2]);}
  if(k=='hoops'){put(H,0,0,2.6,Math.PI,1,null,humanPose(0,false,m.ball&&m.ball.t<12?{armL:{x:-2.8},armR:{x:-2.8}}:{armL:{x:-.9},armR:{x:-.9}}));
    const b=m.ball;let pos=[.0,2.2,2.2];if(b){const t=Math.min(1,b.t/b.T),ex=b.res=='miss'?b.side*.32:0,ey=b.res=='miss'?3.15:3.12;pos=[ex*t,2.2+(ey-2.2)*t+Math.sin(t*Math.PI)*2.4,2.2+(-4.8-2.2)*t];
      if(b.t>b.T){const u=(b.t-b.T)/40;pos=b.res=='miss'?[ex+b.side*u*2.5,ey+Math.sin(u*Math.PI)*.8-u*2.2,-4.8+u*2.5]:[0,3.05-u*2.9,-4.8+u*.4];pos[1]=Math.max(.2,pos[1]);}}
    if(!b||b.t<b.T+40)put(mdl('bball',()=>lifeModel('bball')),pos[0],pos[1],pos[2],frame*.1);}
  if(k=='tennis'){const x=(m.x-128)/18,sw=m.sw>0?(14-m.sw)/14:0;put(H,x,0,6.6,Math.PI,1,null,humanPose(m.t*.2,Math.abs(inp.x)>.2,{armR:{x:-1.4,y:-1.2+sw*3}}));
    const b=m.ball;if(b){const z=-12+(b.y-40)/110*18.6,k2=Math.max(0,Math.min(1,(b.y-40)/110)),h=b.up?.9+Math.sin(Math.max(0,(150-b.y)/116)*Math.PI)*2:.4+Math.abs(Math.sin(k2*Math.PI*1.4))*1.5;put(mdl('tball',()=>lifeModel('tball')),(b.x-128)/18,h,z);}}
  if(k=='pin'){const X=x=>(x-128)/10,Z=y=>(y-130)/10,bm=mdl('bumper',()=>lifeModel('bumper'));m.bumps.forEach(([x,y,r],i)=>put(bm,X(x),0,Z(y),0,r/9,m.lit[i]?{tint:[2,2,1.4]}:null));
    const fm=mdl('flipper',()=>lifeModel('flipper'));for(let i=0;i<2;i++){const [x1,y1,x2,y2]=flipSeg(i,m),a=Math.atan2(y2-y1,x2-x1);drawModel(fm,M4.mul(M4.mul(M4.tr(X(x1),0,Z(y1)),M4.ry(-a)),M4.sc(PFLEN/17)));}
    for(let i=0;i<5;i++)if((m.t>>3)%5==i)put(mdl('pinlamp',()=>[part(mm=>mm.box(-.3,0,-.3,.3,.08,.3,'white',[1,.95,.5]),[0,0,0])]),X(40+i*40),.02,Z(40));
    if(m.ball)put(mdl('pball',()=>lifeModel('pball')),X(m.ball.x),.3,Z(m.ball.y));}
  if(RACES.includes(k)){const rx=(m.x-128)/10,z=-m.y/10,Y=zz=>k=='derby'?zz*.06:0,y=Y(z),tilt=inp.x*.15;
    if(k=='derby'){put(mdl('soapbox',()=>lifeModel('soapbox')),rx,y,z,Math.PI-tilt*.5);put(H,rx,y+.15,z+.25,Math.PI-tilt*.5,1,null,humanPose(0,false,{legL:{x:-1.5},legR:{x:-1.5},armL:{x:-1.1},armR:{x:-1.1}}));}
    else if(k=='trail'){put(mdl('bike',()=>lifeModel('bike')),rx,0,z,Math.PI-tilt*.5);const pd=m.t*.25*Math.min(1,m.v/2);put(H,rx,.15,z+.05,Math.PI-tilt*.5,1,null,humanPose(0,false,{legL:{x:-1.1+Math.sin(pd)*.5},legR:{x:-1.1-Math.sin(pd)*.5},armL:{x:-1.1},armR:{x:-1.1}}));}
    else put(mdl('racecar',()=>lifeModel('racecar')),rx,0,z,Math.PI-tilt*.4);
    for(const o of m.obs){const oz=-(o.y-135)/10;if(oz-z>8||z-oz>70)continue;const ox=(o.x-128)/10,oy=Y(oz);
      if(o.k=='car')put(mdl('car'+o.c,()=>{const P=lifeModel('racecar');return P;}),ox,0,oz,Math.PI,1,{tint:rgb(['#e8e4dc','#f2c14e','#34c8b0','#b890f8'][o.c]).map(v=>v*1.1)});
      else if(o.k=='goose')put(mdl('goose',()=>enemyModel('goose')),ox,oy,oz,Math.sin(m.t*.05+o.y)*1.5);
      else if(o.k=='jogger'){const J=mdl('npc:jogger'+o.c,()=>humanoid({shirt:['#e83048','#f2c14e','#3ac2e8','#58a850'][o.c],capless:true,style:'long'}));put(J,ox+Math.sin(m.t*.03+o.y)*.8,oy,oz,Math.PI/2,1,null,humanPose(m.t*.3,true,{}));}
      else put(mdl(o.k,()=>lifeModel(o.k)),ox,oy,oz,0);}}}

/* ---------- the heads-up display ---------- */
function drawMiniHud(){const m=mini;if(!m)return;hx.clearRect(0,0,HW,HH);const k=m.kind,top=s=>{win(HW/2-200,10,400,40);T(s,HW/2,20,{align:'center',size:18,c:'#fff2a8'});};
  if(k=='bat')top('Pitch '+Math.min(10,m.n+1)+'/10    Hits '+m.hits+'    HR '+m.hr);
  if(k=='hoops'){top('Shot '+Math.min(10,m.n+1)+'/10    Made '+m.made);if(!m.ball&&m.n<10){const x0=HW/2-150;hx.fillStyle='#1a1423';hx.fillRect(x0-4,HH-136,308,30);hx.fillStyle='#3a3a44';hx.fillRect(x0,HH-132,300,22);
      hx.fillStyle='#f2c14e';hx.fillRect(HW/2-45,HH-132,90,22);hx.fillStyle='#58c868';hx.fillRect(HW/2-21,HH-132,42,22);hx.fillStyle='#ffffff';hx.fillRect(HW/2+Math.sin(m.ph)*150-3,HH-140,6,38);}}
  if(k=='tennis')top('Returns '+m.ret+'    Misses '+m.miss+'/3');
  if(k=='pin'){win(16,10,200,40);T('SCORE '+m.score,30,20,{size:18,c:'#fff2a8'});win(HW-136,10,120,40);T('BALLS '+m.balls,HW-122,20,{size:18});}
  if(RACES.includes(k)){const M=MINI[k];top(M.name.toUpperCase()+'    '+fmtTime(m.time));const f=Math.min(1,m.y/m.len);hx.fillStyle='#1a1423';hx.fillRect(HW-40,70,12,260);hx.fillStyle='#58c868';hx.fillRect(HW-38,72+256*(1-f),8,256*f);
    T('Gold '+fmtTime(M.gold*60),20,64,{size:14,c:'#f2c14e'});if(m.count>0)T(String(Math.ceil(m.count/40)),HW/2,HH/2-50,{align:'center',size:60,c:'#fff2a8'});}
  if(m.msg&&!(RACES.includes(k)&&m.count>0)){win(HW/2-200,HH-90,400,36);T(m.msg,HW/2,HH-81,{align:'center',size:17});}
  T(k=='pin'?'B left flipper   A right flipper   MENU quit':RACES.includes(k)?'Left and right to steer   MENU quit':k=='tennis'?'Left and right to move   A swing   MENU quit':'A '+(k=='hoops'?'shoot':'swing')+'   MENU quit',HW/2,HH-40,{align:'center',size:13,c:'#c8d0f0'});}
