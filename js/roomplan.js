"use strict";
/* River City Quest Modern: free-form floor plans for rooms and dungeons. Every room used to be the same 16 by 11
   box of squares. Now each one has its own outline: a rotunda, an apse, cut corners, a slanted wall, an L, a
   chamber that narrows, or the ragged edge of a cave. The outline is a distance field (negative inside the room,
   positive in the wall), so walls can run at any angle or curve, the mesh follows it exactly, and collision is
   the same field. Squares remain only as a notebook for puzzles: which cell a block, switch or chest is on. */
const RP_W=32,RP_H=22;
const sdBox=(x,z,x0,z0,x1,z1)=>{const dx=Math.max(x0-x,x-x1),dz=Math.max(z0-z,z-z1);return Math.min(Math.max(dx,dz),0)+Math.hypot(Math.max(dx,0),Math.max(dz,0));};
function rpNoise(x,z,seed){const h=(a,b)=>(hash(a,b,seed)%1024)/1024,xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);return(h(xi,zi)*(1-u)+h(xi+1,zi)*u)*(1-v)+(h(xi,zi+1)*(1-u)+h(xi+1,zi+1)*u)*v;}
// the families of outline. Each takes how strongly to shape the room (t from 0 to 1) and returns a field to be
// kept inside the plain box. Bigger t is more character and less floor.
const RP_SHAPES={
  oct:(t)=>(x,z)=>(Math.abs(x-16)+Math.abs(z-11)-(23-t*7))/1.414,
  round:(t)=>{const r=t*8;return(x,z)=>{const dx=Math.abs(x-16)-(14-r),dz=Math.abs(z-11)-(9-r);return Math.min(Math.max(dx,dz),0)+Math.hypot(Math.max(dx,0),Math.max(dz,0))-r;};},
  ellipse:(t)=>{const a=14+(1-t)*9,b=9+(1-t)*7;return(x,z)=>(Math.hypot((x-16)/a,(z-11)/b)-1)*b;},
  apse:(t)=>{const R=14/Math.max(.12,t);return(x,z)=>Math.hypot(x-16,z-(2+R))-R;},// a curved north wall
  apse2:(t)=>{const R=9/Math.max(.12,t);return(x,z)=>Math.max(Math.hypot(x-(2+R),z-11)-R,Math.hypot(x-(30-R),z-11)-R);},// both ends curved
  trap:(t)=>{const k=t*.36;return(x,z)=>(Math.abs(x-16)+k*(20-z)-14)/Math.hypot(1,k);},// narrows to the north
  fan:(t)=>{const k=t*.36;return(x,z)=>(Math.abs(x-16)+k*(z-2)-14)/Math.hypot(1,k);},// narrows to the south
  skewW:(t)=>{const k=t*.4;return(x,z)=>(-(x-2)+k*(20-z))/Math.hypot(1,k);},
  skewE:(t)=>{const k=t*.4;return(x,z)=>((x-30)+k*(z-2))/Math.hypot(1,k);},
  ellNE:(t)=>(x,z)=>-sdBox(x,z,30-t*11,-9,60,2+t*7),ellNW:(t)=>(x,z)=>-sdBox(x,z,-30,-9,2+t*11,2+t*7),// an L: one corner is another room's
  ellSE:(t)=>(x,z)=>-sdBox(x,z,30-t*11,20-t*7,60,40),ellSW:(t)=>(x,z)=>-sdBox(x,z,-30,20-t*7,2+t*11,40),
  cave:(t,seed,keep)=>(x,z)=>{let near=9;for(const k of keep){const d=Math.max(Math.abs(x-k[0]*2-1),Math.abs(z-k[1]*2-1));if(d<near)near=d;}const ease=Math.max(0,Math.min(1,(near-1.15)/2.2));return sdBox(x,z,2,2,30,20)+t*4.2*ease*(.2+rpNoise(x*.21,z*.21,seed)*.65+rpNoise(x*.55,z*.55,seed+9)*.4)+(near>2.2?.25*rpNoise(x*.9,z*.9,seed+3):0);}};
// which outlines suit which place, best first
const RP_STYLE={capitol:['ellipse','round','oct'],vmhc:['round','oct'],vmfa:['ellNE','ellNW','skewE','oct'],science:['apse2','round','oct'],station:['apse2','oct','round'],bank:['oct','round'],byrd:['apse','fan','round'],hippo:['apse','fan','oct'],stjohn:['apse','oct'],
  conserv:['apse2','ellipse','round','oct'],carillon:['oct','round'],pyramid:['trap','oct'],tredegar:['skewE','skewW','oct','ellNE'],poe:['skewW','ellNW','ellNE','skewE','oct'],quarry:['cave'],tunnel:['cave'],ruins:['cave'],libby:['skewE','cave'],
  jefferson:['round','apse2','oct'],siegel:['fan','round','oct'],marshall:['ellNE','ellNW','oct'],mansion:['apse','ellNW','oct'],bhm:['ellNW','ellNE','oct'],agecroft:['ellNE','skewW','oct'],taproom:['ellNW','skewE','oct'],tearoom:['oct','apse','round'],
  shop:['ellNE','skewW','oct'],rowhouse:['ellNW','ellNE','oct'],boathouse:['fan','skewE','oct'],stonehouse:['oct','ellNE'],studio:['skewW','skewE','ellNE','oct']};
function roomPlan(id,d){if(d.plan)return d.plan;const area=id.split(':')[0],seed=hash(d.ax*13+7,d.ay*29+3,area.length*31+area.charCodeAt(0)),R=d.rows.map(r=>r.split('')),W=d.w,H=d.h,at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?R[y][x]:null;
  // what must stay on the floor: every cell that holds something, and the ways in and out
  const need=new Set(),add=(x,y)=>{if(x>0&&y>0&&x<W-1&&y<H-1)need.add(x+','+y);},gates=[],pillars=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=R[y][x],ring=x==0||y==0||x==W-1||y==H-1;if(ring){if(c!='W'){gates.push([x,y]);const ix=x==0?1:x==W-1?W-2:x,iy=y==0?1:y==H-1?H-2:y;add(ix,iy);add(ix+(x==0?1:x==W-1?-1:0),iy+(y==0?1:y==H-1?-1:0));}}else if(c=='W')pillars.push([x,y]);else if(c!='F')add(x,y);}
  for(const q of d.dyn||[])for(const [x,y] of q.cells){if(x==0||y==0||x==W-1||y==H-1){if(!gates.some(g=>g[0]==x&&g[1]==y))gates.push([x,y]);const ix=x==0?1:x==W-1?W-2:x,iy=y==0?1:y==H-1?H-2:y;add(ix,iy);add(ix+(x==0?1:x==W-1?-1:0),iy+(y==0?1:y==H-1?-1:0));}else add(x,y);}
  for(const n of d.npcs||[]){add(n.tx,n.ty);add(n.tx,n.ty+1);}for(const k of ['chests','items'])for(const c of d[k]||[])add(c.tx,c.ty);for(const e of d.en||[])add(e[1],e[2]);for(const b of d.braz||[])add(b[0],b[1]);for(const b of d.spots||[])add(b[0],b[1]);
  for(const k in d.reads||{}){const [x,y]=k.split(',').map(Number);add(x,y);add(x,y+1);}for(const k in d.readsT||{}){const [x,y]=k.split(',').map(Number);add(x,y);add(x,y+1);}
  if(d.bossT||d.reward){add(7,8);add(8,8);add(7,5);add(8,5);}if(d.statue){add(d.statue[0],d.statue[1]);add(d.statue[0],d.statue[1]+1);}add(7,5);add(8,5);
  // things you push need a square to be pushed onto, and something beside a pillar needs the way round it
  for(const k of [...need]){const [x,y]=k.split(',').map(Number),c=at(x,y);if('OZgr'.includes(c))for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])add(x+a,y+b);}
  const needs=[...need].map(k=>k.split(',').map(Number)),barrier=y=>y>=0&&y<H&&R[y].some(c=>c=='_'||c=='w'||c=='=');
  const box=(x,z)=>sdBox(x,z,2,2,30,20),corr=[];
  // each way out is one passage through the wall, as wide as its squares together, reaching well into the room
  {const left=gates.slice();while(left.length){const run=[left.pop()];for(let grew=true;grew;){grew=false;for(let i=left.length-1;i>=0;i--)if(run.some(r=>Math.abs(r[0]-left[i][0])+Math.abs(r[1]-left[i][1])==1)){run.push(left.splice(i,1)[0]);grew=true;}}
      const x0=Math.min(...run.map(r=>r[0])),x1=Math.max(...run.map(r=>r[0])),y0=Math.min(...run.map(r=>r[1])),y1=Math.max(...run.map(r=>r[1]));corr.push([x0*2-(x0==0?2:x1==W-1?6:0),y0*2-(y0==0?2:y1==H-1?6:0),x1*2+2+(x1==W-1?2:x0==0?6:0),y1*2+2+(y1==H-1?2:y0==0?6:0)]);}}
  const cols=pillars.map(([x,y])=>[x*2+1,y*2+1]);
  const build=shape=>(x,z)=>{let v=shape?Math.max(box(x,z),shape(x,z)):box(x,z);for(const b of bays)v=Math.min(v,Math.hypot(x-b[0],z-b[1])-b[2]);for(const c of corr)v=Math.min(v,sdBox(x,z,c[0],c[1],c[2],c[3]));for(const c of cols)v=Math.max(v,.95-Math.hypot(x-c[0],z-c[1]));return v;};
  let bays=[];
  // walking the room square by square, round the furniture, from the middle: whatever could be reached in the old box must still be
  const solidCell=(x,y)=>{const c=at(x,y);return c==null||(c!='F'&&c!='E'&&typeof walkable=='function'&&!walkable(c)&&!(d.dyn||[]).some(q=>q.cells.some(k=>k[0]==x&&k[1]==y)));};
  const walkFrom=f=>{const seen=new Set(),q=[];for(const s of [[7,5],[8,5],[7,6],[8,4],[7,8]])if(!solidCell(s[0],s[1])&&f(s[0]*2+1,s[1]*2+1)<-.7){q.push(s);seen.add(s.join());break;}
    while(q.length){const [x,y]=q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b,k=nx+','+ny;if(nx<1||ny<1||nx>W-2||ny>H-2||seen.has(k)||solidCell(nx,ny)||f(nx*2+1,ny*2+1)>-.8||f(x*2+1+a,y*2+1+b)>-.75||f(x*2+1+a*.5,y*2+1+b*.5)>-.75||f(x*2+1+a*1.5,y*2+1+b*1.5)>-.75)continue;seen.add(k);q.push([nx,ny]);}}return seen;};
  const touched=(seen,n)=>seen.has(n.join())||[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>seen.has((n[0]+a)+','+(n[1]+b)));
  // does a shape keep every needed square whole, and can you walk between all of them?
  const fits=f=>{for(const [x,y] of needs)for(const [a,b] of [[-.92,-.92],[.92,-.92],[-.92,.92],[.92,.92],[0,0]])if(f(x*2+1+a,y*2+1+b)>-.04)return false;
    const seen=walkFrom(f);return needs.every(n=>!touched(seen0,n)||touched(seen,n));};
  const seen0=walkFrom(build(null)),keepWide=needs.slice();// a cave leaves the ground beside pools, pits and rails alone, since that is where the paths run
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(R[y][x]=='F'&&!need.has(x+','+y)&&[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]].some(([a,b])=>{const c=at(x+a,y+b);return c!='F'&&c!='W'&&c!=null&&!(x+a==0||y+b==0||x+a==W-1||y+b==H-1);}))keepWide.push([x,y]);
  let pick=null,name='box',best=0;const own=RP_STYLE[area]||['oct','round'],fam=own.concat(['oct','round','skewE','skewW','ellNE','ellNW'].filter(k=>!own.includes(k))),multi=Object.keys(RCQ.rooms).filter(k=>k.split(':')[0]==area).length>1,start=multi?seed%own.length:0;
  // the strongest shape that fits wins; the list is tried from a different place for each room so a dungeon's rooms differ
  for(let i=0;i<fam.length&&best<.5;i++){const fn=i<own.length?own[(start+i)%own.length]:fam[i];for(let t=1;t>=.2;t-=.1){if(t<=best)break;const s=RP_SHAPES[fn](t,seed,keepWide);if(fits(build(s))){best=t;pick=s;name=fn+' '+t.toFixed(1);break;}}}
  if(!pick){const s=RP_SHAPES.round(.12);if(fits(build(s))){pick=s;name='round 0.1';}}
  // bays: shallow curved recesses pushed into the thickness of the wall where it is plain
  {const base=build(pick),cand=[];for(let x=3;x<W-3;x++)for(const [y,iy,cz] of [[0,1,2.9]]){if([-2,-1,0,1,2].some(k=>at(x+k,y)!='W')||barrier(iy)||base(x*2+1,cz)>-.5||base(x*2-1.6,2.3)>-.1||base(x*2+3.6,2.3)>-.1)continue;cand.push([x*2+1,cz,2.3]);}
    for(let y=3;y<H-3;y++)for(const [x,cx] of [[0,2.9],[W-1,29.1]]){if([-2,-1,0,1,2].some(k=>at(x,y+k)!='W')||[-1,0,1].some(k=>barrier(y+k))||base(cx,y*2+1)>-.5||base(x?29.7:2.3,y*2-1.6)>-.1||base(x?29.7:2.3,y*2+3.6)>-.1)continue;cand.push([cx,y*2+1,2.3]);}
    const want=1+seed%3;for(let k=0;k<cand.length*2&&bays.length<want;k++){const c=cand[hash(k,seed,5)%Math.max(1,cand.length)];if(c&&!bays.some(b=>Math.hypot(b[0]-c[0],b[1]-c[1])<7))bays.push(c);}}
  const sdf=build(pick),colAt=(x,z)=>{let v=9;for(const c of cols)v=Math.min(v,Math.hypot(x-c[0],z-c[1])-.95);return v;};
  // the notebook: a plain square left outside the outline becomes wall, so pushing, spawning and pathing all agree
  let carved=0;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(R[y][x]=='F'&&!need.has(x+','+y)&&sdf(x*2+1,y*2+1)>-.75){R[y][x]='W';carved++;}
  d.rows=R.map(r=>r.join(''));d.plan={sdf,colAt,name,carved,bays:bays.length,seed,pillars};return d.plan;}
const planBlocked=(pl,x,z,r)=>pl.sdf(x,z)>-r;

/* ---------- the room you see: floor, walls and wall tops traced from the field ---------- */
function roomPlanMesh(M,lv,flCell,flC,wlCell,wlC,lit){const pl=lv.plan,f=pl.sdf,S=.5,NX=RP_W/S,NZ=RP_H/S,V=new Float32Array((NX+1)*(NZ+1));for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++)V[j*(NX+1)+i]=f(i*S,j*S);
  const hi=lit?3.4:4,rows=lv.d.rows,g=(x,z)=>{const a=Math.floor(x/2),b=Math.floor(z/2);return rows[b]?rows[b][a]:null;};
  // how tall the wall stands here: low along the south so you can see in, shorter for a free-standing pillar
  const hAt=(x,z)=>pl.colAt(x,z)<.35?2.2:z>15.99?.8:hi;
  const tri=(a,b,c,cell,ca,cb,cc,n)=>{const s=M.swayV;M.swayV=-(CELL[cell]+1);const uv=p=>Math.abs(n[1])>.5?[p[0]/2,p[2]/2]:[(Math.abs(n[0])>Math.abs(n[2])?p[2]:p[0])/2,-p[1]/2];M.tri(a,b,c,uv(a),uv(b),uv(c),ca,cb,cc,n,n,n);M.swayV=s;};
  const UP=[0,1,0],shade=(v,k)=>{const a=Math.max(.5,Math.min(1,.5+(-v)/1.6*.5));return[k[0]*a,k[1]*a,k[2]*a];},capC=[.03,.03,.04],lowC=[wlC[0]*.8,wlC[1]*.8,wlC[2]*.8];
  const Hc=new Float32Array(NX*NZ);for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++)Hc[j*NX+i]=hAt((i+.5)*S,(j+.5)*S);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const v=[V[j*(NX+1)+i],V[j*(NX+1)+i+1],V[(j+1)*(NX+1)+i+1],V[(j+1)*(NX+1)+i]],P=[[i*S,j*S],[(i+1)*S,j*S],[(i+1)*S,(j+1)*S],[i*S,(j+1)*S]],inn=[],out=[],cut=[];
    for(let k=0;k<4;k++){const k2=(k+1)%4;(v[k]<0?inn:out).push([P[k][0],P[k][1],v[k]]);if((v[k]<0)!=(v[k2]<0)){const t=v[k]/(v[k]-v[k2]),q=[P[k][0]+(P[k2][0]-P[k][0])*t,P[k][1]+(P[k2][1]-P[k][1])*t,0];inn.push(q);out.push(q);cut.push(q);}}
    const c=g((i+.5)*S,(j+.5)*S),hole=c=='_'||c=='w'||c=='='||c=='~',h=Hc[j*NX+i];
    if(inn.length>2&&!hole)for(let k=1;k<inn.length-1;k++){const a=inn[0],b=inn[k],d=inn[k+1];tri([a[0],0,a[1]],[b[0],0,b[1]],[d[0],0,d[1]],flCell,shade(a[2],flC),shade(b[2],flC),shade(d[2],flC),UP);}
    if(out.length>2){const top=h<1?wlCell:h<3?wlCell:'black',tc=h<3?lowC:capC;for(let k=1;k<out.length-1;k++){const a=out[0],b=out[k],d=out[k+1];tri([a[0],h,a[1]],[b[0],h,b[1]],[d[0],h,d[1]],top,tc,tc,tc,UP);}
      // where a tall wall meets a low one, close the step between them
      for(const [di,dj,a,b] of [[1,0,P[1],P[2]],[0,1,P[3],P[2]]]){const ni=i+di,nj=j+dj;if(ni>=NX||nj>=NZ)continue;const h2=Hc[nj*NX+ni];if(Math.abs(h2-h)<.05)continue;const va=di?v[1]:v[3],vb=v[2];if(va<0&&vb<0)continue;const lo=Math.min(h,h2),hh=Math.max(h,h2),n=di?[h>h2?1:-1,0,0]:[0,0,h>h2?1:-1];
        tri([a[0],lo,a[1]],[b[0],lo,b[1]],[b[0],hh,b[1]],wlCell,wlC,wlC,wlC,n);tri([a[0],lo,a[1]],[b[0],hh,b[1]],[a[0],hh,a[1]],wlCell,wlC,wlC,wlC,n);}}
    if(cut.length==2){// the wall face, turned toward the room
      const a=cut[0],b=cut[1],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,e=.05,gx=f(mx+e,mz)-f(mx-e,mz),gz=f(mx,mz+e)-f(mx,mz-e),gl=Math.hypot(gx,gz)||1,n=[-gx/gl,0,-gz/gl],dk=[wlC[0]*.62,wlC[1]*.62,wlC[2]*.62],y0=hole?(c=='_'?-3:-1.2):0;
      tri([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],h,b[1]],wlCell,dk,dk,wlC,n);tri([a[0],y0,a[1]],[b[0],h,b[1]],[a[0],h,a[1]],wlCell,dk,wlC,wlC,n);
      if(lit&&h>3){const t=[wlC[0]*.8,wlC[1]*.8,wlC[2]*.8],o=.03;tri([a[0]+n[0]*o,h-.22,a[1]+n[2]*o],[b[0]+n[0]*o,h-.22,b[1]+n[2]*o],[b[0]+n[0]*o,h,b[1]+n[2]*o],'white',t,t,t,n);tri([a[0]+n[0]*o,h-.22,a[1]+n[2]*o],[b[0]+n[0]*o,h,b[1]+n[2]*o],[a[0]+n[0]*o,h,a[1]+n[2]*o],'white',t,t,t,n);
        const bb=[wlC[0]*.55,wlC[1]*.55,wlC[2]*.55];tri([a[0]+n[0]*o,0,a[1]+n[2]*o],[b[0]+n[0]*o,0,b[1]+n[2]*o],[b[0]+n[0]*o,.28,b[1]+n[2]*o],'white',bb,bb,bb,n);tri([a[0]+n[0]*o,0,a[1]+n[2]*o],[b[0]+n[0]*o,.28,b[1]+n[2]*o],[a[0]+n[0]*o,.28,a[1]+n[2]*o],'white',bb,bb,bb,n);}}}
  // the outer face of the low south wall and the ends, so the room reads as a solid block from the camera
  for(let i=0;i<NX;i++){const x0=i*S,x1=x0+S;if(V[NZ*(NX+1)+i]>0&&V[NZ*(NX+1)+i+1]>0){const h=Hc[(NZ-1)*NX+i];tri([x0,-.6,RP_H],[x1,-.6,RP_H],[x1,h,RP_H],wlCell,lowC,lowC,lowC,[0,0,1]);tri([x0,-.6,RP_H],[x1,h,RP_H],[x0,h,RP_H],wlCell,lowC,lowC,lowC,[0,0,1]);}}}
