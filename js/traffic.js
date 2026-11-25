"use strict";
/* River City Quest Modern: traffic. Cars drive the streets on the right-hand side, keep their distance, stop at
   red lights and wait for anyone crossing in front of them; the signals at the big crossings run on one cycle
   and their lamps are lit to match. People walk the sidewalks. */
let traffic=[],TLANES=[],walkers=[],WPATHS=[];
const SIG={ew:300,yel:60,cycle:720};
// which way the lights stand for traffic moving along an axis: 2 green, 1 yellow, 0 red
function sigState(ax){const T=(typeof frame=='number'?frame:0)%SIG.cycle,h=SIG.cycle/2,t=ax=='x'?T:(T+h)%SIG.cycle;return t<SIG.ew?2:t<SIG.ew+SIG.yel?1:0;}
function trafficInit(){traffic=[];TLANES=[];walkers=[];WPATHS=[];if(lv&&lv.world)return wTrafficInit();if(!lv||lv.room||typeof roadKind!='function')return;const W=lv.w,H=lv.h,t=(x,y)=>roadKind(lv,x,y).t;
  // lanes: the rows of a street that are not parking, each with its direction, and the places a car must stop for a crossing
  const lane=(ax,idx,a0,a1,dir)=>{const k=i=>ax=='x'?t(i,idx):t(idx,i),stops=[];for(let i=a0;i<=a1;i++)if(k(i)=='x'&&k(i-dir)!='x'&&i-dir>=a0&&i-dir<=a1)stops.push(dir>0?i*TS-2.7:(i+1)*TS+2.7);
    const lo=a0*TS+(a0<=1?-3:1.2),hi=(a1+1)*TS-(a1>=(ax=='x'?W:H)-2?-3:1.2);TLANES.push({ax,line:(idx+.5)*TS,dir,start:dir>0?lo:hi,end:dir>0?hi:lo,stops});};
  const scan=(ax)=>{const N=ax=='x'?H:W,L=ax=='x'?W:H,want=ax=='x'?'ew':'ns';for(let idx=1;idx<N-1;idx++){let i=0;while(i<L){const k=ax=='x'?t(i,idx):t(idx,i);if(k!=want&&k!='x'){i++;continue;}let j=i,own=0,info=null;
        while(j<L){const q=ax=='x'?t(j,idx):t(idx,j);if(q!=want&&q!='x')break;if(q==want){own++;info=info||roadKind(lv,ax=='x'?j:idx,ax=='x'?idx:j);}j++;}
        if(own>=12&&info){const w=ax=='x'?info.n:info.m,pos=ax=='x'?info.a:info.l,park=w>=3;if(!(park&&(pos==0||pos==w-1))){// on the right: westbound on the north half, southbound on the west half
            const dir=w-(park?2:0)<=1?(hash(idx,i,7)%2?1:-1):(ax=='x'?(pos<w/2?-1:1):(pos<w/2?1:-1));lane(ax,idx,i,j-1,dir);}}i=j+1;}}};
  scan('x');scan('z');
  const n=Math.min(TLANES.length*2,W>40?14:5),COLS=['#7a1818','#1c2a4a','#c4c6ca','#1e1e20','#e8e6e0','#4a4c52','#2e3e30','#8a8c90','#b8a070'];
  for(let i=0;i<n;i++){const L=TLANES[hash(i,lv.d.ax*7+lv.d.ay,41)%TLANES.length],f=(hash(i,3,lv.d.ay)%100)/100,s=L.start+(L.end-L.start)*f;if(traffic.some(c=>c.lane==L&&Math.abs(c.s-s)<8))continue;traffic.push({lane:L,s,v:.08,col:COLS[hash(i,5,lv.d.ax)%COLS.length],seed:i});}
  // people out walking: back and forth along the sidewalks beside the longer streets
  const R=lv.d.rows,sw=(x,y)=>R[y]&&'s'==R[y][x];for(let y=2;y<H-2;y++){let x=2;while(x<W-2){if(!sw(x,y)){x++;continue;}let j=x;while(j<W-2&&sw(j,y))j++;if(j-x>=10)WPATHS.push({ax:'x',line:(y+.5)*TS,lo:x*TS+1,hi:j*TS-1});x=j+1;}}
  for(let x=2;x<W-2;x++){let y=2;while(y<H-2){if(!sw(x,y)){y++;continue;}let j=y;while(j<H-2&&sw(x,j))j++;if(j-y>=10)WPATHS.push({ax:'z',line:(x+.5)*TS,lo:y*TS+1,hi:j*TS-1});y=j+1;}}
  const FOLK=[['#6a4020','#3d63c8'],['#2e2e3a','#b84a3a'],['#8a5a30','#58a850'],['#3a2414','#d8b03a'],['#4a2c14','#7a5ab8'],['#20242c','#d8692a'],['#5a3a20','#c8c8c8']];
  for(let i=0;i<Math.min(WPATHS.length,W>40?7:2);i++){const P=WPATHS[hash(i,lv.d.ax*5+lv.d.ay,63)%WPATHS.length];if(walkers.some(w=>w.path==P))continue;const c=FOLK[i%FOLK.length];
    walkers.push({path:P,s:P.lo+(P.hi-P.lo)*((hash(i,9,lv.d.ax)%100)/100),dir:i%2?1:-1,off:(i%3-1)*.35,walk:i*2,wait:0,skirt:i%3==1,hat:c[0],shirt:c[1],skin:['#d9a57e','#8a5a3a','#f0c8a0','#5a3a28','#c08a60'][i%5]});}}
function carXZ(c){const L=c.lane;return L.ax=='x'?[c.s,L.line]:[L.line,c.s];}
function trafficUpdate(){if(!lv||lv.room)return;if(lv.world)return wTrafficUpdate();
  for(const c of traffic){const L=c.lane,d=L.dir;let vt=.105;const green=sigState(L.ax)==2;
    for(const sp of L.stops){const dd=(sp-c.s)*d;if(dd>-.4&&dd<10&&!green)vt=Math.min(vt,dd<.5?0:Math.max(.012,dd*.018));}
    for(const o of traffic){if(o===c||o.lane!==L)continue;const dd=(o.s-c.s)*d;if(dd>0&&dd<8)vt=Math.min(vt,dd<5.4?0:o.v);}
    // wait for anyone on foot in the road ahead: the player, and the people of the neighborhood
    const yield_=(x,z)=>{const lat=(L.ax=='x'?z:x)-L.line,al=((L.ax=='x'?x:z)-c.s)*d;if(Math.abs(lat)<1.6&&al>1.5&&al<9)vt=Math.min(vt,al<5?0:.03);};
    yield_(p.x,p.z);for(const q of npcs)yield_(q.x,q.z);
    c.v+=(vt-c.v)*(vt<c.v?.14:.03);if(c.v<.002)c.v=0;c.s+=c.v*d;if((c.s-L.end)*d>0){c.s=L.start;c.v=.07;}}
  for(const w of walkers){if(w.wait>0){w.wait--;continue;}const P=w.path;w.s+=w.dir*.024;w.walk+=.24;if(w.s>P.hi||w.s<P.lo){w.dir=-w.dir;w.s=Math.max(P.lo,Math.min(P.hi,w.s));w.wait=40+hash(Math.round(w.s),frame>>6,3)%120;}
    const x=P.ax=='x'?w.s:P.line+w.off,z=P.ax=='x'?P.line+w.off:w.s;if(Math.hypot(x-p.x,z-p.z)<.9)w.wait=20;}}
// a car is solid: you can't walk through one, moving or not
function trafficBlock(x,z,r){if(lv.world){for(const c of traffic){const dx=x-c.x,dz=z-c.z;if(Math.abs(dx)>3.2+r||Math.abs(dz)>3.2+r)continue;if(Math.abs(dx*c.dx+dz*c.dz)<2.2+r&&Math.abs(-dx*c.dz+dz*c.dx)<.9+r)return true;}return false;}for(const c of traffic){const [cx,cz]=carXZ(c),hx=c.lane.ax=='x'?2.2:.9,hz=c.lane.ax=='x'?.9:2.2;if(Math.abs(x-cx)<hx+r&&Math.abs(z-cz)<hz+r)return true;}return false;}
function trafficDraw(){if(!lv||lv.room)return;if(lv.world)return wTrafficDraw();
  for(const c of traffic){const L=c.lane,[x,z]=carXZ(c),m=getModel('tcar:'+c.col,()=>{const P=[{mesh:sedan(c.col,c.seed*7+3),pivot:[0,0,0],name:'body'}];return P;}),edge=Math.min(Math.abs(c.s-L.start),Math.abs(c.s-L.end)),k=Math.max(.02,Math.min(1,edge/3));
    if(Math.hypot(x-p.x,z-p.z)>75)continue;const yaw=L.ax=='x'?(L.dir>0?0:Math.PI):(L.dir>0?-Math.PI/2:Math.PI/2);drawModel(m,M4.mul(M4.mul(M4.tr(x,0,z),M4.ry(yaw)),M4.sc(k)));}
  for(const w of walkers){const P=w.path,x=P.ax=='x'?w.s:P.line+w.off,z=P.ax=='x'?P.line+w.off:w.s;if(Math.hypot(x-p.x,z-p.z)>55)continue;
    const H=getModel('walker:'+w.shirt+w.skirt,()=>humanoid({hat:w.hat,shirt:w.shirt,skin:w.skin,skirt:w.skirt,style:w.skirt?'long':'short',capless:true}));
    drawModel(H,M4.mul(M4.tr(x,0,z),M4.ry(P.ax=='x'?(w.dir>0?Math.PI/2:-Math.PI/2):(w.dir>0?0:Math.PI))),humanPose(w.walk,w.wait<=0,{}));}
  // the signal lamps: one lit in each head, facing both ways along the street it controls
  if(typeof PASS=='undefined'||PASS!='shadow'){const lamp=getModel('siglamp',()=>[{mesh:(()=>{const m=new Mesh();m.sphere(0,0,0,.1,8,4,'lampglow');return m;})(),pivot:[0,0,0],name:'l'}]),COL=[[1.6,.12,.08],[1.6,1.1,.1],[.15,1.5,.4]];
    for(const h of lv.sigHeads||[]){if(Math.hypot(h.x-p.x,h.z-p.z)>70)continue;const st2=sigState(h.ax),q=st2==2?2:st2==1?1:0;for(const sgn of [-1,1])drawModel(lamp,M4.tr(h.x+(h.ax=='x'?sgn*.15:0),5.2-q*.28,h.z+(h.ax=='x'?0:sgn*.15)),null,{tint:COL[q]});}}}

/* ---------- the same, on real streets: lanes follow each street's own line, whatever way it runs ---------- */
function wTrafficInit(){const w=lv.world;worldJunctions(w);const key=w.nodeKey,inMap=q=>q[0]>-w.mx+1&&q[1]>-w.mz+1&&q[0]<w.w+w.mx-1&&q[1]<w.h+w.mz-1;
  for(const r of w.roads){if(!'pstr'.includes(r.k)||r.b||r.wm<6.5||r.c||lineLen(r.pp)<40)continue;const two=!r.o,lo=r.wm>=12.5?r.wm/4-.4:Math.min(r.wm/4+.3,r.wm/2-3.05),offs=two?[lo,-lo]:[0];
    for(const off of offs){let pts=offsetLine(r.pp,off);if(off<0)pts=pts.slice().reverse();const src=off<0?r.pp.slice().reverse():r.pp,stops=[];let sAt=0;
      for(let i=0;i<src.length;i++){if(i)sAt+=Math.hypot(src[i][0]-src[i-1][0],src[i][1]-src[i-1][1]);const n=w.nodes.get(key(src[i]));if(!n||n.n<2||i==0)continue;let cw=0;for(const o of n.rs)if(o!==r&&'pstr'.includes(o.k))cw=Math.max(cw,o.wm);if(cw<6.5)continue;
        const a=src[i-1],b=src[i],ax=Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1])?'x':'z';if(inMap(src[i]))stops.push({s:sAt-cw/2-2.7,ax});}
      TLANES.push({pts,len:lineLen(pts),stops,road:r});}}
  const n=Math.min(TLANES.length*2,16),COLS=['#7a1818','#1c2a4a','#c4c6ca','#1e1e20','#e8e6e0','#4a4c52','#2e3e30','#8a8c90','#b8a070'];
  for(let i=0;i<n&&TLANES.length;i++){const L=TLANES[hash(i,lv.d.ax*7+lv.d.ay,41)%TLANES.length],s=L.len*((hash(i,3,lv.d.ay)%100)/100);if(traffic.some(c=>c.lane==L&&Math.abs(c.s-s)<9))continue;const q=lineAt(L.pts,s);traffic.push({lane:L,s,v:.08,col:COLS[hash(i,5,lv.d.ax)%COLS.length],seed:i,x:q.x,z:q.z,dx:q.dx,dz:q.dz});}
  // people out walking the sidewalks of the longer streets
  for(const r of w.roads){if(!'str'.includes(r.k)||r.b||lineLen(r.pp)<50)continue;for(const sd of [-1,1]){const pts=offsetLine(r.pp,sd*(r.wm/2+1.4)),L=lineLen(pts);let lo=-1,hi=-1;for(let s=2;s<L-2;s+=2){const q=lineAt(pts,s),ok=q.x>3&&q.z>3&&q.x<w.w-3&&q.z<w.h-3&&!worldBlocked(w,q.x,q.z,.5);if(ok){if(lo<0)lo=s;hi=s;}else if(lo>=0){if(hi-lo>=24)WPATHS.push({pts,lo,hi});lo=-1;}}if(lo>=0&&hi-lo>=24)WPATHS.push({pts,lo,hi});}}
  const FOLK=[['#6a4020','#3d63c8'],['#2e2e3a','#b84a3a'],['#8a5a30','#58a850'],['#3a2414','#d8b03a'],['#4a2c14','#7a5ab8'],['#20242c','#d8692a'],['#5a3a20','#c8c8c8']];
  for(let i=0;i<Math.min(WPATHS.length,9);i++){const P=WPATHS[hash(i,lv.d.ax*5+lv.d.ay,63)%WPATHS.length];if(walkers.some(q=>q.path==P))continue;const c=FOLK[i%FOLK.length],s=P.lo+(P.hi-P.lo)*((hash(i,9,lv.d.ax)%100)/100),q=lineAt(P.pts,s);
    walkers.push({path:P,s,dir:i%2?1:-1,off:(i%3-1)*.3,walk:i*2,wait:0,skirt:i%3==1,hat:c[0],shirt:c[1],skin:['#d9a57e','#8a5a3a','#f0c8a0','#5a3a28','#c08a60'][i%5],x:q.x,z:q.z,dx:q.dx,dz:q.dz});}}
function wTrafficUpdate(){for(const c of traffic){const L=c.lane;let vt=.105;
    for(const sp of L.stops){const dd=sp.s-c.s;if(dd>-.4&&dd<10&&sigState(sp.ax)!=2)vt=Math.min(vt,dd<.5?0:Math.max(.012,dd*.018));}
    for(const o of traffic){if(o===c)continue;if(o.lane===L){const dd=o.s-c.s;if(dd>0&&dd<8)vt=Math.min(vt,dd<5.4?0:o.v);}else{const rx=o.x-c.x,rz=o.z-c.z,al=rx*c.dx+rz*c.dz;if(al>1&&al<7&&Math.abs(-rx*c.dz+rz*c.dx)<1.7&&(o.s>c.s||o.v>0))vt=Math.min(vt,al<5?0:.03);}}
    const yield_=(x,z)=>{const rx=x-c.x,rz=z-c.z,al=rx*c.dx+rz*c.dz;if(al>1.5&&al<9&&Math.abs(-rx*c.dz+rz*c.dx)<1.6)vt=Math.min(vt,al<5?0:.03);};
    yield_(p.x,p.z);for(const q of npcs)if(Math.abs(q.x-c.x)<12&&Math.abs(q.z-c.z)<12)yield_(q.x,q.z);
    c.v+=(vt-c.v)*(vt<c.v?.14:.03);if(c.v<.002)c.v=0;if(c.v==0)c.stuck=(c.stuck||0)+1;else c.stuck=0;if(c.stuck>900){c.s+=6;c.stuck=0;}c.s+=c.v;if(c.s>L.len){c.s=0;c.v=.07;}const q=lineAt(L.pts,c.s);c.x=q.x;c.z=q.z;c.dx=q.dx;c.dz=q.dz;}
  for(const k of walkers){if(k.wait>0){k.wait--;continue;}const P=k.path;k.s+=k.dir*.024;k.walk+=.24;if(k.s>P.hi||k.s<P.lo){k.dir=-k.dir;k.s=Math.max(P.lo,Math.min(P.hi,k.s));k.wait=40+hash(Math.round(k.s),frame>>6,3)%120;}
    const q=lineAt(P.pts,k.s);k.x=q.x-q.dz*k.off;k.z=q.z+q.dx*k.off;k.dx=q.dx*k.dir;k.dz=q.dz*k.dir;if(Math.hypot(k.x-p.x,k.z-p.z)<.9)k.wait=20;}}
function wTrafficDraw(){for(const c of traffic){const L=c.lane,m=getModel('tcar:'+c.col,()=>[{mesh:sedan(c.col,c.seed*7+3),pivot:[0,0,0],name:'body'}]),k=Math.max(.02,Math.min(1,Math.min(c.s,L.len-c.s)/3));
    if(Math.hypot(c.x-p.x,c.z-p.z)>80)continue;drawModel(m,M4.mul(M4.mul(M4.tr(c.x,.065,c.z),M4.ry(Math.atan2(-c.dz,c.dx))),M4.sc(k)));}
  for(const k of walkers){if(Math.hypot(k.x-p.x,k.z-p.z)>55)continue;const H=getModel('walker:'+k.shirt+k.skirt,()=>humanoid({hat:k.hat,shirt:k.shirt,skin:k.skin,skirt:k.skirt,style:k.skirt?'long':'short',capless:true}));
    drawModel(H,M4.mul(M4.tr(k.x,.03,k.z),M4.ry(Math.atan2(k.dx,k.dz))),humanPose(k.walk,k.wait<=0,{}));}
  if(typeof PASS=='undefined'||PASS!='shadow'){const lamp=getModel('siglamp',()=>[{mesh:(()=>{const m=new Mesh();m.sphere(0,0,0,.1,8,4,'lampglow');return m;})(),pivot:[0,0,0],name:'l'}]),COL=[[1.6,.12,.08],[1.6,1.1,.1],[.15,1.5,.4]];
    for(const h of lv.sigHeads||[]){if(Math.hypot(h.x-p.x,h.z-p.z)>70)continue;const st2=sigState(h.ax),q=st2==2?2:st2==1?1:0;for(const sgn of [-1,1])drawModel(lamp,M4.tr(h.x+h.dx*sgn*.17,5.2-q*.28,h.z+h.dz*sgn*.17),null,{tint:COL[q]});}}}
