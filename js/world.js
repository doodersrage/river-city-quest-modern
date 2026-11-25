"use strict";
/* River City Quest Modern: the polygon world. Each neighborhood is the real place, from OpenStreetMap: building
   footprints of any shape, streets as lines with their real widths and names, parks, parking lots and water.
   This file reads that data, answers "what is here?" for the rest of the game (is this point inside a building,
   in the river, on a street), and moves everything from the original game's maps (people, doors, chests,
   enemies, landmarks) onto the real ground. A coarse grid of 2 m cells is still kept, but only as a notebook for
   the older game logic; nothing is drawn from it and nothing collides with it. */
const WGRID=8;// metres per cell of the lookup grids
const dec=a=>{const o=[];for(let i=0;i<a.length;i+=2)o.push([a[i]/10,a[i+1]/10]);return o;};
const polyArea=p=>{let a=0;for(let i=0,n=p.length;i<n;i++){const q=p[(i+1)%n];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;};
const inPolygon=(p,x,z)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const segDist=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/l)):0;return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
const polyCentre=p=>{let x=0,z=0;for(const q of p){x+=q[0];z+=q[1];}return[x/p.length,z/p.length];};
// the smallest box, at any angle, that holds a footprint: centre, half sizes, and the angle of its long side
function obbOf(p){let best=null;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.5)continue;const ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l;let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
    for(const q of p){const u=q[0]*ux+q[1]*uz,v=-q[0]*uz+q[1]*ux;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);}const ar=(u1-u0)*(v1-v0);
    if(!best||ar<best.ar){const cu=(u0+u1)/2,cv=(v0+v1)/2;best={ar,cx:cu*ux-cv*uz,cz:cu*uz+cv*ux,hu:(u1-u0)/2,hv:(v1-v0)/2,ux,uz};}}return best;}
class SegHash{constructor(w,h,mx,mz){this.mx=mx;this.mz=mz;this.nx=Math.ceil((w+2*mx)/WGRID);this.nz=Math.ceil((h+2*mz)/WGRID);this.c=new Map();}
  key(x,z){const i=Math.floor((x+this.mx)/WGRID),j=Math.floor((z+this.mz)/WGRID);return i<0||j<0||i>=this.nx||j>=this.nz?-1:j*this.nx+i;}
  add(a,b,o){const i0=Math.floor((Math.min(a[0],b[0])+this.mx)/WGRID),i1=Math.floor((Math.max(a[0],b[0])+this.mx)/WGRID),j0=Math.floor((Math.min(a[1],b[1])+this.mz)/WGRID),j1=Math.floor((Math.max(a[1],b[1])+this.mz)/WGRID),s={a,b,o};
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(i<0||j<0||i>=this.nx||j>=this.nz)continue;const k=j*this.nx+i;let L=this.c.get(k);if(!L)this.c.set(k,L=[]);L.push(s);}}
  near(x,z,r,fn){const i0=Math.floor((x-r+this.mx)/WGRID),i1=Math.floor((x+r+this.mx)/WGRID),j0=Math.floor((z-r+this.mz)/WGRID),j1=Math.floor((z+r+this.mz)/WGRID);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(i<0||j<0||i>=this.nx||j>=this.nz)continue;const L=this.c.get(j*this.nx+i);if(L)for(const s of L)if(fn(s)===true)return true;}return false;}}
// read a neighborhood once: real coordinates, lookup grids, the smoothed water
function worldOf(id){if(typeof WORLD=='undefined'||!WORLD[id])return null;const w=WORLD[id];if(w._ready)return w;w._ready=true;w.id=id;
  w.bld.forEach((b,i)=>{b.i=i;b.pp=dec(b.p);b.hm=b.h/10;b.ar=Math.abs(polyArea(b.pp));b.c=polyCentre(b.pp);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of b.pp){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);}b.bb=[x0,z0,x1,z1];});
  for(const r of w.roads){r.pp=dec(r.p);r.wm=r.w/10;r.car='mpstrva'.includes(r.k);}for(const r of w.rails)r.pp=dec(r.p);for(const a of w.areas)a.pp=dec(a.p);for(const l of w.lines)l.pp=dec(l.p);for(const q of w.pts){q.xm=q.x/10;q.zm=q.z/10;}
  w.bh=new SegHash(w.w,w.h,w.mx,w.mz);for(const b of w.bld){if(b.t=='roof')continue;for(let i=0;i<b.pp.length;i++)w.bh.add(b.pp[i],b.pp[(i+1)%b.pp.length],b);}
  w.rh=new SegHash(w.w,w.h,w.mx,w.mz);for(const r of w.roads)for(let i=0;i<r.pp.length-1;i++)w.rh.add(r.pp[i],r.pp[i+1],r);
  if(w.water){const bin=atob(w.water.bits),cw=w.water.cw,ch=w.water.ch,m=new Float32Array(cw*ch);for(let i=0;i<cw*ch;i++)m[i]=(bin.charCodeAt(i>>3)>>(i&7))&1;
    let f=m;for(let pass=0;pass<2;pass++){const g=new Float32Array(cw*ch);for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){let s=0,n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=i+a,y=j+b;if(x<0||y<0||x>=cw||y>=ch)continue;s+=f[y*cw+x];n++;}g[j*cw+i]=s/n;}f=g;}w.wf=f;}
  return w;}
// how much water is at a point, 0 to 1; the bank is where it crosses one half
function waterField(w,x,z){if(!w.wf)return 0;const cw=w.water.cw,ch=w.water.ch,u=(x+w.mx)/2-.5,v=(z+w.mz)/2-.5,i=Math.max(0,Math.min(cw-2,Math.floor(u))),j=Math.max(0,Math.min(ch-2,Math.floor(v))),fu=Math.max(0,Math.min(1,u-i)),fv=Math.max(0,Math.min(1,v-j)),f=w.wf;
  return(f[j*cw+i]*(1-fu)+f[j*cw+i+1]*fu)*(1-fv)+(f[(j+1)*cw+i]*(1-fu)+f[(j+1)*cw+i+1]*fu)*fv;}
// the nearest street or path to a point: {r, d} with d the distance to its centre line
function roadNear(w,x,z,rad,pred){let best=null;w.rh.near(x,z,rad,s=>{if(pred&&!pred(s.o))return;const d=segDist(x,z,s.a,s.b);if(d<=rad&&(!best||d-s.o.wm/2<best.d-best.r.wm/2))best={r:s.o,d,a:s.a,b:s.b};});return best;}
function buildingAt(w,x,z){let hit=null;w.bh.near(x,z,.01,s=>{const b=s.o;if(x>=b.bb[0]&&x<=b.bb[2]&&z>=b.bb[1]&&z<=b.bb[3]&&inPolygon(b.pp,x,z)){hit=b;return true;}});return hit;}
// what stops a body of radius r standing at (x,z): 'B' a wall, 'D' a door you can go through, '~' water, 'T' a tree trunk, or nothing
// set while a district's people and things are being placed, so that they go on ground you can reach on foot, boat or no boat
let WDRY=0;
function worldBlocked(w,x,z,r){let hit=null;
  w.bh.near(x,z,r,s=>{if(s.o.gone)return;if(segDist(x,z,s.a,s.b)<r){hit=s.o;return true;}});
  if(!hit){const b=buildingAt(w,x,z);if(b&&!b.gone)hit=b;}
  if(hit){for(const d of w.doorAt||[])if(Math.abs(x-d.x)<1.5+r&&Math.abs(z-d.z)<1.5+r&&Math.hypot(x-d.x,z-d.z)<1.5+r)return'D';return hit.lm?'X':'B';}
  for(const q of w.solid||[])if(Math.abs(x-q[0])<r+q[2]&&Math.abs(z-q[1])<r+q[2]&&Math.hypot(x-q[0],z-q[1])<r+q[2])return'T';
  if(w.wf&&waterField(w,x,z)>.5&&!(!WDRY&&typeof passable=='function'&&passable('~'))&&!onDeck(w,x,z))return'~';
  return null;}
function onDeck(w,x,z){let ok=false;w.rh.near(x,z,12,s=>{if(s.o.b&&s.o.k!='m'&&!(s.o.ly>=2)&&segDist(x,z,s.a,s.b)<s.o.wm/2+.3){ok=true;return true;}});if(ok)return true;for(const a of w.areas)if(a.k=='deck'&&inPolygon(a.pp,x,z))return true;return false;}

/* ---------- the notebook grid and the move from the old maps ---------- */
const OLD_SCALE=5;// one square of an original map stands for this many metres of the real place
const LMNAMES={capitol:/virginia state capitol|^state capitol|capitol building/i,station:/main street station/i,church:/st\.? john'?s (episcopal )?church/i,carillon:/carillon/i,byrd:/byrd theat/i,cityhall:/old city hall/i,temple:/st\.? paul'?s/i,
  hippodrome:/hippodrome/i,vmfa:/virginia museum of fine arts|vmfa/i,scimuseum:/science museum/i,vmhc:/museum of history|historical society/i,belltower:/bell tower/i,market:/17th street market|farmers.? market/i,grandstand:/the diamond/i,siegel:/siegel/i,
  marshall:/john marshall house/i,armory:/armory|black history museum/i,mansion:/maymont (mansion|house)|dooley/i,agecroft:/agecroft/i,pyramid:/pyramid|confederate soldiers/i,stonehouse:/stone house/i,sauers:/sauer/i,ashecenter:/arthur ashe/i,speedway:/raceway/i,sallybell:/sally bell/i};
function worldGrid(w){const tw=w.w/2,th=w.h/2,g=[];
  for(let y=0;y<th;y++){const row=new Array(tw);for(let x=0;x<tw;x++){const px=x*2+1,pz=y*2+1;let c='.';const b=buildingAt(w,px,pz);
      if(b&&b.t!='roof')c='B';else{const rn=roadNear(w,px,pz,14);let on=null;if(rn){const half=rn.r.wm/2;if(rn.d<=half)on=rn.r.car?'p':'s';else if(rn.r.car&&rn.r.k!='m'&&rn.r.k!='a'&&rn.r.k!='v'&&rn.d<=half+2.6)on='s';}
        const wet=w.wf&&waterField(w,px,pz)>.5;if(wet&&!(on&&onDeck(w,px,pz)))c='~';else if(on)c=on;else{for(let i=w.areas.length-1;i>=0;i--){const a=w.areas[i];if(a.k=='yard')continue;if(inPolygon(a.pp,px,pz)){c=a.k=='parking'?'p':a.k=='plaza'||a.k=='paved'||a.k=='deck'?'s':a.k=='sand'?'n':'.';break;}}}}
      row[x]=c;}g.push(row);}
  return g;}
// move one original map onto its real neighborhood: m keeps its lists, but every position becomes a real one
function worldContent(id,m){const w=worldOf(id);if(!w)return false;let main=worldMain(w);const g=worldGrid(w),tw=w.w/2,th=w.h/2,ow=m.w,oh=m.h,old=m.rows;
  const T=(tx,ty)=>[w.w/2+(tx+.5-ow/2)*OLD_SCALE,w.h/2+(ty+.5-oh/2)*OLD_SCALE],used=new Set(),at=(x,y)=>x<0||y<0||x>=tw||y>=th?null:g[y][x];
  // the nearest free cell of the notebook grid that suits: sidewalk or open ground first, then roadway
  const snap=(X,Z,want,pad)=>{const cx=Math.max(3,Math.min(tw-4,Math.floor(X/2))),cy=Math.max(3,Math.min(th-4,Math.floor(Z/2))),ok=want||(c=>c=='s'||c=='.');for(const pass of [0,1])for(let r=0;r<(pass?Math.max(tw,th):60);r++){let best=null;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!=r)continue;const x=cx+dx,y=cy+dy;if(x<3||y<3||x>=tw-3||y>=th-3||used.has(x+','+y))continue;const c=at(x,y);
          if(!(pass?(c=='s'||c=='.'||c=='p'||c=='n'):ok(c)))continue;if(!main[(y*2+1)*w.w+x*2+1])continue;if(pad&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const q=at(x+a,y+b);return q=='B'||q=='~'||q=='X'||q=='D';}))continue;const d=dx*dx+dy*dy;if(!best||d<best[2])best=[x,y,d];}
        if(best){used.add(best[0]+','+best[1]);return[best[0],best[1]];}}return[cx,cy];};
  // landmarks take the place of the real building they are, or of the nearest one that fits
  w.landmarks=[];const lmOld=(tx,ty)=>(m.lm||[]).find(L=>tx>=L.x&&tx<L.x+L.w&&ty>=L.y&&ty<L.y+L.h);
  for(const L of m.lm||[]){const [X,Z]=T(L.x+L.w/2-.5,L.y+L.h/2-.5),rx=LMNAMES[L.art];let b=rx&&w.bld.filter(q=>q.n&&rx.test(q.n)&&!q.lm).sort((a,c)=>c.ar-a.ar)[0];
    const inside=q=>q.c[0]>14&&q.c[1]>14&&q.c[0]<w.w-14&&q.c[1]<w.h-14;if(b&&!inside(b))b=null;
    if(!b){const want=L.w*L.h*4*3;b=w.bld.filter(q=>!q.lm&&inside(q)&&q.ar>want*.25&&q.ar<want*6&&q.t!='roof').sort((a,c)=>Math.hypot(a.c[0]-X,a.c[1]-Z)-Math.hypot(c.c[0]-X,c.c[1]-Z))[0];if(b&&Math.hypot(b.c[0]-X,b.c[1]-Z)>130)b=null;}
    let obb;if(b){obb=obbOf(b.pp);b.gone=true;{// a likeness keeps a human scale: it may grow to fill the real footprint, but only so far
        const mL=Math.max(L.w,L.h),mS=Math.min(L.w,L.h),lng=Math.max(obb.hu,obb.hv),sht=Math.min(obb.hu,obb.hv),k=Math.max(.8,Math.min(1.75,lng/mL,sht/mS));// one scale both ways, so nothing on it is stretched
        if(obb.hu>=obb.hv){obb.hu=mL*k;obb.hv=mS*k;}else{obb.hv=mL*k;obb.hu=mS*k;}}const o=obb,C=(u,v)=>[o.cx+o.ux*u-o.uz*v,o.cz+o.uz*u+o.ux*v];let pp=[C(-o.hu,-o.hv),C(o.hu,-o.hv),C(o.hu,o.hv),C(-o.hu,o.hv)];if(polyArea(pp)<0)pp.reverse();
      const nb={pp,hm:b.hm,ar:o.hu*o.hv*4,c:[o.cx,o.cz],bb:[Math.min(...pp.map(q=>q[0])),Math.min(...pp.map(q=>q[1])),Math.max(...pp.map(q=>q[0])),Math.max(...pp.map(q=>q[1]))],lm:L.art,n:b.n,i:w.bld.length,real:b};w.bld.push(nb);for(let i=0;i<4;i++)w.bh.add(pp[i],pp[(i+1)%4],nb);b=nb;}else{const [sx,sy]=snap(X,Z,c=>c=='.'||c=='s',true),hw=L.w*1.9,hd=L.h*1.9;obb={cx:sx*2+1,cz:sy*2+1,hu:hw,hv:hd,ux:1,uz:0};const pp=[[obb.cx-hw,obb.cz-hd],[obb.cx+hw,obb.cz-hd],[obb.cx+hw,obb.cz+hd],[obb.cx-hw,obb.cz+hd]];
      b={pp,hm:8,ar:hw*hd*4,c:[obb.cx,obb.cz],bb:[obb.cx-hw,obb.cz-hd,obb.cx+hw,obb.cz+hd],lm:L.art,made:true,i:w.bld.length};w.bld.push(b);for(let i=0;i<4;i++)w.bh.add(pp[i],pp[(i+1)%4],b);}
    w.landmarks.push({art:L.art,b,obb,read:L.read||null,L});L.b=b;}
  if(w.landmarks.length){w.main=null;main=worldMain(w);}// the ground has changed where a likeness replaced a real building
  // which side of a building faces the street: the wall whose outside is open and closest to a road
  const frontOf=b=>{let best=null;const p=b.pp;for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],l=Math.hypot(c[0]-a[0],c[1]-a[1]);if(l<2.4)continue;const mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2,nx=(c[1]-a[1])/l,nz=-(c[0]-a[0])/l,ox=mx+nx*1.6,oz=mz+nz*1.6;
      if(ox<4||oz<4||ox>w.w-4||oz>w.h-4||buildingAt(w,ox,oz)||(w.wf&&waterField(w,ox,oz)>.4)||!main[Math.floor(oz)*w.w+Math.floor(ox)])continue;const rn=roadNear(w,ox,oz,40,o=>o.k!='m'),sc=(rn?rn.d:60)-Math.min(l,9)*.6;if(!best||sc<best.sc)best={sc,x:mx,z:mz,nx,nz,l,i};}return best;};
  // a likeness faces the way its shape allows (a wide front goes on a long side), toward open ground and the nearest street
  for(const lm of w.landmarks){if(lm.b.made){lm.face=[0,1];lm.front=frontOf(lm.b);continue;}const o=lm.obb,sq=Math.abs(o.hu-o.hv)<Math.max(o.hu,o.hv)*.15||lm.L.w==lm.L.h,cands=[];
    if(sq||(lm.L.w>=lm.L.h)!=(o.hu>=o.hv))for(const k of [1,-1])cands.push([o.ux*k,o.uz*k,o.hu]);if(sq||(lm.L.w>=lm.L.h)==(o.hu>=o.hv))for(const k of [1,-1])cands.push([-o.uz*k,o.ux*k,o.hv]);
    let best=null;for(const [fx,fz,h] of cands){const x=o.cx+fx*(h+1.6),z=o.cz+fz*(h+1.6),okm=x>4&&z>4&&x<w.w-4&&z<w.h-4&&main[Math.floor(z)*w.w+Math.floor(x)]&&!buildingAt(w,x,z),rn=roadNear(w,x,z,40,q=>q.k!='m'),sc=(okm?0:1000)+(rn?rn.d:60);if(!best||sc<best[0])best=[sc,fx,fz,h];}
    lm.face=[best[1],best[2]];lm.front={x:o.cx+best[1]*best[3],z:o.cz+best[2]*best[3],nx:best[1],nz:best[2],l:10,sc:best[0]};}
  // doors: a landmark's door goes on its front wall; any other door takes the nearest real building that is still free
  const doors=[],sealed=[];for(const d of m.doors||[]){const L=lmOld(d.tx,d.ty),[X,Z]=T(d.tx,d.ty);let b=L&&L.b;
    if(!b||b.door)b=w.bld.filter(q=>!q.door&&!q.lm&&!q.gone&&q.ar>45&&q.t!='roof'&&q.c[0]>16&&q.c[1]>16&&q.c[0]<w.w-16&&q.c[1]<w.h-16&&frontOf(q)).sort((a,c)=>Math.hypot(a.c[0]-X,a.c[1]-Z)-Math.hypot(c.c[0]-X,c.c[1]-Z))[0];
    if(b&&Math.hypot(b.c[0]-X,b.c[1]-Z)>110)b=null;
    if(!b){// nothing real stands near enough: a small stone house is put up for the door, on open ground
      const [sx,sy]=snap(X,Z,c=>c=='.',true),cx=sx*2+1,cz=sy*2+1,pp=[[cx-4,cz-3.5],[cx+4,cz-3.5],[cx+4,cz+3.5],[cx-4,cz+3.5]];b={pp,hm:3.4,ar:56,c:[cx,cz],bb:[cx-4,cz-3.5,cx+4,cz+3.5],made:true,t:'hut',i:w.bld.length};w.bld.push(b);for(let i=0;i<4;i++)w.bh.add(pp[i],pp[(i+1)%4],b);
      for(let y=sy-2;y<=sy+2;y++)for(let x=sx-2;x<=sx+2;x++)if(at(x,y)!=null&&inPolygon(pp,x*2+1,y*2+1))g[y][x]='B';}
    const lmk=w.landmarks.find(q=>q.b===b);let f=frontOf(b)||{x:b.c[0],z:b.c[1],nx:0,nz:1};if(lmk){const o=lmk.obb,fc=lmk.face,dh=Math.abs(fc[0]*o.ux+fc[1]*o.uz)>.5?o.hu:o.hv;f={x:o.cx+fc[0]*dh,z:o.cz+fc[1]*dh,nx:fc[0],nz:fc[1]};lmk.door=f;}
    const ix=Math.floor((f.x-f.nx*.7)/2),iy=Math.floor((f.z-f.nz*.7)/2),ox=Math.floor((f.x+f.nx*1.5)/2),oy=Math.floor((f.z+f.nz*1.5)/2);
    b.door={x:f.x,z:f.z,nx:f.nx,nz:f.nz,to:d.to};(w.doorAt=w.doorAt||[]).push(b.door);if(g[iy]&&g[iy][ix]!=null)g[iy][ix]='D';if(g[oy]&&g[oy][ox]!=null&&(ox!=ix||oy!=iy)&&'B~'.includes(g[oy][ox]))g[oy][ox]='s';used.add(ox+','+oy);
    const nd=Object.assign({},d,{tx:ix,ty:iy,x:f.x,z:f.z,nx:f.nx,nz:f.nz}),seal=(m.dyn||[]).find(q=>q.closed=='%'&&q.open=='D'&&q.cells.some(([a,c])=>a==d.tx&&c==d.ty));
    if(seal&&g[oy]&&g[oy][ox]!=null&&(ox!=ix||oy!=iy)){nd.sealed=[ox,oy];sealed.push({cells:[[ox,oy]],closed:'%',open:'s',solved:null,key:'dyn:'+id+':'+d.tx+','+d.ty});}
    doors.push(nd);}
  for(const lm of w.landmarks)for(let y=Math.floor(lm.b.bb[1]/2);y<=Math.floor(lm.b.bb[3]/2);y++)for(let x=Math.floor(lm.b.bb[0]/2);x<=Math.floor(lm.b.bb[2]/2);x++)if(at(x,y)!=null&&g[y][x]!='D'&&inPolygon(lm.b.pp,x*2+1,y*2+1))g[y][x]='X';
  // everyone and everything else: the same spot in the middle of the map, moved to the nearest real ground that suits
  const near=(o,want,pad)=>{const [X,Z]=T(o.tx,o.ty),[x,y]=snap(X,Z,want,pad);o.tx=x;o.ty=y;};
  for(const n of m.npcs||[]){const L=lmOld(n.tx,n.ty-1)||lmOld(n.tx,n.ty-2)||lmOld(n.tx-1,n.ty)||lmOld(n.tx+1,n.ty);if(L&&L.b&&w.landmarks.find(q=>q.b===L.b).front){const f=w.landmarks.find(q=>q.b===L.b).front,[x,y]=snap(f.x+f.nx*4+(n.tx-(L.x+L.w/2))*1.2,f.z+f.nz*4,null,true);n.tx=x;n.ty=y;}else near(n,null,true);}
  for(const c of m.chests||[])near(c,null,true);for(const it of m.items||[])near(it,null,true);m.en=(m.en||[]).map(e=>{const [X,Z]=T(e[1],e[2]),[x,y]=snap(X,Z,c=>c=='.'||c=='s'||c=='p');return[e[0],x,y].concat(e.slice(3));});
  const pair=a=>{const [X,Z]=T(a[0],a[1]),[x,y]=snap(X,Z);return[x,y].concat(a.slice(2));};m.spots=(m.spots||[]).map(pair);m.birds=(m.birds||[]).map(pair);m.braz=(m.braz||[]).map(pair);m.opens=[];
  const rd={};for(const k in m.reads||{}){const [a,b]=k.split(',').map(Number),[X,Z]=T(a,b),[x,y]=snap(X,Z,null,true);g[y][x]='M';rd[x+','+y]=m.reads[k];}m.reads=rd;
  for(const lm of w.landmarks)if(lm.read&&lm.front){const [x,y]=snap(lm.front.x+lm.front.nx*3+3,lm.front.z+lm.front.nz*3,null,true);g[y][x]='M';m.reads[x+','+y]=lm.read;}
  // bushes to cut and flower beds, moved to open ground near where they grew
  for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){const c=old[y][x];if(c!='b'&&c!=',')continue;if(c==','&&(x+y)%2)continue;const [X,Z]=T(x,y),[sx,sy]=snap(X,Z,q=>q=='.',c=='b');if(g[sy][sx]=='.')g[sy][sx]=c;}
  // murals go on a real wall that faces open ground
  {const out=[];for(const a of m.murals||[]){const [X,Z]=T(a[0],a[1]);let best=null;for(const b of w.bld){if(b.door||b.lm||b.gone||b.mural||b.ar<60||b.t=='roof')continue;const d=Math.hypot(b.c[0]-X,b.c[1]-Z);if(d>90||best&&d>=best[0])continue;const f=frontOf(b);if(f&&f.l>=5)best=[d,b,f];}
      if(!best)continue;const [,b,f]=best,cx=Math.floor((f.x-f.nx*.7)/2),cy=Math.floor((f.z-f.nz*.7)/2);if(at(cx,cy)==null)continue;b.mural={x:f.x,z:f.z,nx:f.nx,nz:f.nz,i:f.i};g[cy][cx]='e';out.push([cx,cy]);}m.murals=out;}
  m.toWorld=(tx,ty,want,pad)=>{const [X,Z]=T(tx,ty);return snap(X,Z,want,pad);};
  m.dyn=sealed;{const L=[];for(const a of m.lamps||[]){if(L.length>=28)break;const [X,Z]=T(a[0],a[1]),[x,y]=snap(X,Z,c=>c=='s',true);if(L.some(q=>Math.abs(q[0]-x)+Math.abs(q[1]-y)<6)){used.delete(x+','+y);continue;}g[y][x]='l';L.push([x,y]);}m.lamps=L;}m.lm=w.landmarks.map(q=>({art:q.art,x:Math.floor(q.b.bb[0]/2),y:Math.floor(q.b.bb[1]/2),w:Math.max(1,Math.ceil((q.b.bb[2]-q.b.bb[0])/2)),h:Math.max(1,Math.ceil((q.b.bb[3]-q.b.bb[1])/2)),read:q.read,world:true}));m.doors=doors;m.streets=[];m.signs=[];m.lots=[];m.world=id;m.oldRows=old;m.w=tw;m.h=th;m.rows=g.map(r=>r.join(''));m.base='.';return true;}

// a neighborhood is moved onto its real ground the first time anything asks for it
function worldReady(id){const m=RCQ.maps[id];if(!m||m.world||typeof WORLD=='undefined'||!WORLD[id])return m;const t0=Date.now();WDRY=1;try{worldContent(id,m);}finally{WDRY=0;}
  if(typeof EXTRA_NPCS!='undefined')for(const n of EXTRA_NPCS)if(n.scene==id&&!n.moved){const q=m.toWorld(n.tx,n.ty,null,true);n.tx=q[0];n.ty=q[1];n.moved=1;}
  if(typeof SECRETS!='undefined'&&SECRETS[id]){// a stash sits at the foot of a tree, off the street
    const w=WORLD[id],s=SECRETS[id],q=m.toWorld(s[0],s[1],c=>c=='.',true);SECRETS[id]=q;}
  m.loadMs=Date.now()-t0;return m;}
// where streets meet: any point two of them share
function worldJunctions(w){if(w.junctions)return w.junctions;
  // the map data drops a street's middle points where it runs straight, so two streets that cross may share no point: give them one
  {const cr=w.roads.filter(r=>r.car&&!r.b&&'pstrva'.includes(r.k)&&r.pp.length>1),ins=cr.map(()=>[]),near=(P,q)=>Math.hypot(P[0]-q[0],P[1]-q[1])<.45;
    for(let i=0;i<cr.length;i++)for(let j=i+1;j<cr.length;j++){const A=cr[i].pp,B=cr[j].pp;for(let a=0;a<A.length-1;a++)for(let b=0;b<B.length-1;b++){const p0=A[a],p1=A[a+1],q0=B[b],q1=B[b+1],rx=p1[0]-p0[0],rz=p1[1]-p0[1],sx=q1[0]-q0[0],sz=q1[1]-q0[1],den=rx*sz-rz*sx,la=Math.hypot(rx,rz),lb=Math.hypot(sx,sz);
        if(Math.abs(den)<1e-6*la*lb+1e-9||la<.01||lb<.01)continue;const t=((q0[0]-p0[0])*sz-(q0[1]-p0[1])*sx)/den,u=((q0[0]-p0[0])*rz-(q0[1]-p0[1])*rx)/den,ea=.5/la,eb=.5/lb;if(t<-ea||t>1+ea||u<-eb||u>1+eb)continue;
        let P=[p0[0]+rx*Math.max(0,Math.min(1,t)),p0[1]+rz*Math.max(0,Math.min(1,t))];for(const v of [p0,p1,q0,q1])if(near(P,v)){P=v;break;}ins[i].push([a,t,P]);ins[j].push([b,u,P]);}}
    cr.forEach((r,i)=>{ins[i].sort((x,y)=>y[0]-x[0]||y[1]-x[1]);for(const [a,t,P] of ins[i]){const pp=r.pp;if(pp.some(v=>v[0]==P[0]&&v[1]==P[1]))continue;if(near(P,pp[a])){pp[a]=P;continue;}if(near(P,pp[a+1])){pp[a+1]=P;continue;}pp.splice(a+1,0,P);}});}
  const nodes=new Map(),key=q=>Math.round(q[0]*10)+','+Math.round(q[1]*10);for(const r of w.roads){if(!r.car||r.b&&r.k=='m')continue;const seen=new Set();for(const q of r.pp){const k=key(q);if(seen.has(k))continue;seen.add(k);const n=nodes.get(k)||{n:0,w:0,rs:[]};n.n++;n.w=Math.max(n.w,r.wm);n.rs.push(r);nodes.set(k,n);}}
  w.nodes=nodes;w.nodeKey=key;w.junctions=[];for(const [k,n] of nodes)if(n.n>1){const [x,z]=k.split(',').map(v=>v/10);w.junctions.push({x,z,w:n.w,rs:n.rs});}return w.junctions;}
// the name of the street you are standing on or beside
function worldStreet(w,x,z){const rn=roadNear(w,x,z,14,r=>r.n&&r.car);return rn&&rn.d<rn.r.wm/2+3.5?rn.r.n:null;}

// the ground you can actually walk to: the largest connected stretch of open ground, on a one-metre grid.
// People, chests and arrivals are only ever put on it, so nobody ends up shut in a courtyard.
// the largest stretch of ground you can cross in one piece. With a boat the water joins it, so it is worked out again once you have one.
function worldMain(w){const wet=!WDRY&&typeof passable=='function'&&!!passable('~');if(w.main&&!!w.mainWet==wet)return w.main;w.mainWet=wet;const N=w.w,H=w.h,comp=new Int32Array(N*H),sizes=[0];let nc=0;const st=[];
  const free=(a,b)=>!worldBlocked(w,a+.5,b+.5,.45);
  for(let b0=0;b0<H;b0++)for(let a0=0;a0<N;a0++){if(comp[b0*N+a0])continue;if(!free(a0,b0)){comp[b0*N+a0]=-1;continue;}nc++;let sz=0;comp[b0*N+a0]=nc;st.push(a0,b0);
    while(st.length){const z=st.pop(),x=st.pop();sz++;for(let k=0;k<4;k++){const a=x+(k==0?1:k==1?-1:0),b=z+(k==2?1:k==3?-1:0);if(a<0||b<0||a>=N||b>=H||comp[b*N+a])continue;if(!free(a,b)){comp[b*N+a]=-1;continue;}comp[b*N+a]=nc;st.push(a,b);}}sizes.push(sz);}
  let big=1;for(let i=1;i<=nc;i++)if(sizes[i]>sizes[big])big=i;const m=new Uint8Array(N*H);for(let i=0;i<N*H;i++)m[i]=comp[i]==big?1:0;w.main=m;return m;}
const onMain=(w,x,z)=>{const a=Math.floor(x),b=Math.floor(z);return a>=0&&b>=0&&a<w.w&&b<w.h&&!!worldMain(w)[b*w.w+a];};

/* ---------- the lie of the land ---------- */
// the height of the ground above the district's lowest point, in metres
function worldElev(w){if(w.el!==undefined)return w.el;const E=typeof WELEV!='undefined'&&WELEV.d[w.id];if(!E){w.el=null;return null;}const raw=atob(E.h),n=E.nx*E.nz,a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=raw.charCodeAt(i)*WELEV.q;
  // one soft pass takes the quarter-metre steps out
  const h=new Float32Array(n);for(let j=0;j<E.nz;j++)for(let i=0;i<E.nx;i++){let s=0,c=0;for(let b=-1;b<=1;b++)for(let d=-1;d<=1;d++){const x=i+d,y=j+b;if(x<0||y<0||x>=E.nx||y>=E.nz)continue;const k=d==0&&b==0?4:d==0||b==0?2:1;s+=a[y*E.nx+x]*k;c+=k;}h[j*E.nx+i]=s/c;}
  w.el={nx:E.nx,nz:E.nz,step:WELEV.step,x0:WELEV.x0,z0:WELEV.z0,h};return w.el;}
// The land is a sheet of flat triangles: each 10 m square of the height grid is cut corner to corner, and a point takes the
// height of the triangle it is over. The shader does exactly the same sum, so the two always agree.
function worldY(w,x,z){const e=w.el===undefined?worldElev(w):w.el;if(!e)return 0;const fx=Math.max(0,Math.min(e.nx-1.001,(x-e.x0)/e.step)),fz=Math.max(0,Math.min(e.nz-1.001,(z-e.z0)/e.step)),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,h=e.h,k=j*e.nx+i,a=h[k],b=h[k+1],c=h[k+e.nx],d=h[k+e.nx+1];
  return u+v<=1?a+u*(b-a)+v*(c-a):d+(1-u)*(c-d)+(1-v)*(b-d);}
// the same, for wherever the game is now (zero indoors)
function gY(x,z){return typeof lv!='undefined'&&lv&&lv.world?worldY(lv.world,x,z)+deckLift(lv.world,x,z):0;}
// A bridge at ground level spans from bank to bank instead of dipping to the water. Each is a line with a height at either
// end; standing on it you are lifted from the land beneath up to the deck.
function worldSpans(w){if(w.spans)return w.spans;w.spans=[];if(!worldElev(w))return w.spans;for(const r of w.roads){if(!r.b||r.k=='m'||r.ly>=2||r.pp.length<2)continue;const p=r.pp,a=p[0],b=p[p.length-1],wet=q=>w.wf&&waterField(w,q[0],q[1])>.5;
    let g0=wet(a)?null:worldY(w,a[0],a[1]),g1=wet(b)?null:worldY(w,b[0],b[1]);if(g0==null&&g1==null)continue;if(g0==null)g0=g1;if(g1==null)g1=g0;let L=0;const cum=[0];for(let i=1;i<p.length;i++){L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);cum.push(L);}
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of p){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);}const half=r.wm/2+.45;w.spans.push({r,p,cum,L:L||1,g0,g1,half,bb:[x0-half,z0-half,x1+half,z1+half]});}return w.spans;}
// the deck height of a span at a point (by how far along the span the point lies), or null when the point is off it
function spanAt(sp,x,z,pad){if(x<sp.bb[0]-pad||z<sp.bb[1]-pad||x>sp.bb[2]+pad||z>sp.bb[3]+pad)return null;let bd=1e9,bs=0;const p=sp.p;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/l2)),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(d<bd){bd=d;bs=sp.cum[i]+Math.sqrt(l2)*t;}}
  return bd<=sp.half+pad?sp.g0+(sp.g1-sp.g0)*bs/sp.L:null;}
function deckLift(w,x,z){const S=w.spans||worldSpans(w);let best=0;for(const sp of S){const h=spanAt(sp,x,z,0);if(h!=null){const d=h-worldY(w,x,z);if(d>best)best=d;}}return best;}

