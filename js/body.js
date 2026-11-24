"use strict";
/* River City Quest Modern: sculpted people. Each body part is described as a blend of simple shapes
   (spheres, ellipsoids and tapered capsules melted together with a smooth minimum), the way a sculptor
   blocks out anatomy, and turned into a smooth mesh with surface nets. Every shape is tagged with what
   it is (skin, shirt, pants, shoes, hair, hat, lips), and each triangle takes the tag of the nearest
   shape, so clothing and skin get their own colors and materials. Meshes are cached by body type, so a
   crowd of people only costs a few builds; colors are painted on per person. */

/* ---------- distance functions ---------- */
const SDF={
  sph:(c,r)=>p=>{const x=p[0]-c[0],y=p[1]-c[1],z=p[2]-c[2];return Math.sqrt(x*x+y*y+z*z)-r;},
  ell:(c,R)=>p=>{const x=(p[0]-c[0])/R[0],y=(p[1]-c[1])/R[1],z=(p[2]-c[2])/R[2],k0=Math.sqrt(x*x+y*y+z*z),a=x/R[0],b=y/R[1],c2=z/R[2],k1=Math.sqrt(a*a+b*b+c2*c2);return k1<1e-6?-Math.min(...R):k0*(k0-1)/k1;},
  // a capsule from a to b whose radius tapers from ra to rb; sz squashes it front to back
  cap:(a,b,ra,rb,sz)=>p=>{sz=sz||1;const q=[p[0]-a[0],p[1]-a[1],(p[2]-a[2])/sz],ba=[b[0]-a[0],b[1]-a[1],(b[2]-a[2])/sz],L2=ba[0]*ba[0]+ba[1]*ba[1]+ba[2]*ba[2];
    const t=Math.max(0,Math.min(1,(q[0]*ba[0]+q[1]*ba[1]+q[2]*ba[2])/L2)),dx=q[0]-ba[0]*t,dy=q[1]-ba[1]*t,dz=q[2]-ba[2]*t,d=Math.sqrt(dx*dx+dy*dy+dz*dz);return(d-(ra+(rb-ra)*t))*Math.min(1,sz*1.1);},
  box:(c,R,r)=>p=>{const q=[Math.abs(p[0]-c[0])-R[0],Math.abs(p[1]-c[1])-R[1],Math.abs(p[2]-c[2])-R[2]];const a=Math.max(q[0],0),b=Math.max(q[1],0),c2=Math.max(q[2],0);return Math.sqrt(a*a+b*b+c2*c2)+Math.min(Math.max(q[0],q[1],q[2]),0)-(r||0);}};
const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
// a part is a list of [shape, region, blend] plus optional carved-out shapes
function partField(prims,cuts){return p=>{let d=1e9;for(const [f,,k] of prims)d=k?smin(d,f(p),k):Math.min(d,f(p));for(const [f,k] of cuts||[])d=-smin(-d,f(p),k);return d;};}
function regionAt(prims,p){let best=null,bd=1e9;for(const [f,reg] of prims){const d=f(p);if(d<bd){bd=d;best=reg;}}return best;}

/* ---------- surface nets: a smooth mesh from a distance field ---------- */
function surfaceNet(F,lo,hi,h){const nx=Math.ceil((hi[0]-lo[0])/h)+2,ny=Math.ceil((hi[1]-lo[1])/h)+2,nz=Math.ceil((hi[2]-lo[2])/h)+2,V=new Float32Array(nx*ny*nz);
  const I=(i,j,k)=>i+nx*(j+ny*k),P=(i,j,k)=>[lo[0]+(i-.5)*h,lo[1]+(j-.5)*h,lo[2]+(k-.5)*h];
  // only points near the surface need an exact distance: sample a coarse grid first and copy its value out where it's far away
  const cs=4,cx=Math.ceil(nx/cs)+1,cy=Math.ceil(ny/cs)+1,cz=Math.ceil(nz/cs)+1,Cv=new Float32Array(cx*cy*cz);
  for(let k=0;k<cz;k++)for(let j=0;j<cy;j++)for(let i=0;i<cx;i++)Cv[i+cx*(j+cy*k)]=F(P(i*cs,j*cs,k*cs));const band=h*cs*1.9;
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const c=Cv[Math.round(i/cs)+cx*(Math.round(j/cs)+cy*Math.round(k/cs))];V[I(i,j,k)]=Math.abs(c)>band?c:F(P(i,j,k));}
  const vid=new Int32Array(nx*ny*nz).fill(-1),verts=[];
  const E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]],C=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]],OFF=C.map(o=>o[0]+nx*(o[1]+ny*o[2])),v=new Float32Array(8);
  for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++){let base=nx*(j+ny*k);for(let i=0;i<nx-1;i++,base++){let neg=0;for(let c=0;c<8;c++){const x=V[base+OFF[c]];v[c]=x;if(x<0)neg++;}if(neg==0||neg==8)continue;
    let sx=0,sy=0,sz=0,n=0;for(let e=0;e<12;e++){const a=E[e][0],b=E[e][1];if((v[a]<0)==(v[b]<0))continue;const t=v[a]/(v[a]-v[b]),A=C[a],Bc=C[b];sx+=A[0]+(Bc[0]-A[0])*t;sy+=A[1]+(Bc[1]-A[1])*t;sz+=A[2]+(Bc[2]-A[2])*t;n++;}
    vid[base]=verts.length;verts.push([lo[0]+(i-.5+sx/n)*h,lo[1]+(j-.5+sy/n)*h,lo[2]+(k-.5+sz/n)*h]);}}
  const quads=[];
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){const a=V[I(i,j,k)];
    for(const [d,c1,c2] of [[[1,0,0],[0,1,0],[0,0,1]],[[0,1,0],[0,0,1],[1,0,0]],[[0,0,1],[1,0,0],[0,1,0]]]){const b=V[I(i+d[0],j+d[1],k+d[2])];if((a<0)==(b<0))continue;
      const q=[[0,0],[1,0],[1,1],[0,1]].map(([s,t])=>vid[I(i-c1[0]*s-c2[0]*t,j-c1[1]*s-c2[1]*t,k-c1[2]*s-c2[2]*t)]);if(q.some(x=>x<0))continue;quads.push(a<0?q:[q[0],q[3],q[2],q[1]]);}}
  // smooth normals: each vertex averages the faces around it
  const acc=verts.map(()=>[0,0,0]);for(const q of quads){const [a,b,c,d]=q.map(i=>verts[i]),n=v3.cross([c[0]-a[0],c[1]-a[1],c[2]-a[2]],[d[0]-b[0],d[1]-b[1],d[2]-b[2]]);for(const i of q){acc[i][0]+=n[0];acc[i][1]+=n[1];acc[i][2]+=n[2];}}
  const N=acc.map(nrm3);
  return{verts,quads,N};}

/* ---------- real bodies ---------- */
// The people are Blender Studio's realistic Human Base Meshes (CC0), rigged by the Castcut project and baked
// into js/bodydata.js. One mesh per sex and outfit cut is shared by everyone; each person brings a palette
// (skin, shirt, trousers, shoes...) that the shader looks up by the clothing region stored on each vertex.
const REG={HAIR:7,SKIN:0,SHIRT:1,LEGUP:2,SHOE:3,BELT:4,EYE:5,IRIS:6,ARMLOW:8,SHIN:10};
function b64(s,T){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new T(u.buffer);}
const BODYMESH={};
// is this point of the head under hair? the line runs from the forehead, over the ears, down to the nape
function scalp(D,x,y,z){const h=y-D.eye[1],zr=z-D.ear[2];const line=zr>0?.034+zr*.5:.034+Math.max(-1,zr/.035)*.1;return h>line;}
function bodyMesh(sex,coat,skirt,style){const key=sex+(coat?'c':'')+(skirt?'s':'')+style;if(BODYMESH[key])return BODYMESH[key];const D=BODYDATA[sex],n=D.n,P=b64(D.pos,Int16Array),N=b64(D.nrm,Int8Array),W=b64(D.bw,Uint8Array),R=Uint8Array.from(b64(D.reg,Uint8Array)),I=b64(D.idx,Uint16Array);
  const m=new Mesh(),[u0,v0,u1,v1]=cellUV('skin'),tri=v=>Math.abs((v-Math.floor(v))*2-1),pos=new Float32Array(n*3),nrm=new Float32Array(n*3);
  for(let i=0;i<n*3;i++){pos[i]=P[i]/16000;nrm[i]=N[i]/127;}
  for(let i=0;i<n;i++)if(R[i]==REG.SKIN&&W[i*3]==B_HEAD&&W[i*3+2]<40&&scalp(D,pos[i*3],pos[i*3+1],pos[i*3+2]))R[i]=REG.HAIR;
  // the mesh is split along seams; weld by place so cloth can be smoothed without tearing
  const canon=new Int32Array(n),seen=new Map();for(let i=0;i<n;i++){const k=P[i*3]+','+P[i*3+1]+','+P[i*3+2];if(!seen.has(k))seen.set(k,i);canon[i]=seen.get(k);}
  const nb=[];for(let i=0;i<n;i++)nb.push(null);const link=(a,b)=>{(nb[a]||(nb[a]=new Set())).add(b);};
  for(let t=0;t<I.length;t+=3){const a=canon[I[t]],b=canon[I[t+1]],c=canon[I[t+2]];link(a,b);link(a,c);link(b,a);link(b,c);link(c,a);link(c,b);}
  // cloth hangs: it bridges muscle and bone instead of clinging, so clothed parts are relaxed and pushed out
  const soft=r=>r==REG.SHIRT||r==REG.LEGUP||r==REG.BELT||(r==REG.ARMLOW&&coat)||(r==REG.SHIN&&!skirt)||r==REG.HAIR;
  for(let it=0;it<22;it++){const nx=new Float32Array(pos);for(let i=0;i<n;i++){if(canon[i]!=i||!nb[i]||!soft(R[i])||(it>=7&&R[i]!=REG.SHIRT&&R[i]!=REG.BELT))continue;let x=0,y=0,z=0,c=0;for(const j of nb[i]){x+=pos[j*3];y+=pos[j*3+1];z+=pos[j*3+2];c++;}
      const k=R[i]==REG.HAIR?.35:.6;nx[i*3]+=(x/c-pos[i*3])*k;nx[i*3+1]+=(y/c-pos[i*3+1])*k;nx[i*3+2]+=(z/c-pos[i*3+2])*k;}pos.set(nx);}
  const hair=style=='long'?.024:style=='bun'?.014:sex=='f'?.016:.011,off=[];off[REG.SHIRT]=coat?.024:.017;off[REG.LEGUP]=.011;off[REG.SHOE]=-.004;off[REG.BELT]=coat?.025:.018;off[REG.ARMLOW]=coat?.014:0;off[REG.SHIN]=skirt?0:.01;off[REG.HAIR]=hair;
  for(let i=0;i<n;i++){if(canon[i]!=i)continue;const o=off[R[i]]||0;for(let c=0;c<3;c++)pos[i*3+c]+=nrm[i*3+c]*o;}
  // fresh normals where the surface moved
  const fn=new Float32Array(n*3);for(let t=0;t<I.length;t+=3){const a=canon[I[t]]*3,b=canon[I[t+1]]*3,c=canon[I[t+2]]*3,ux=pos[b]-pos[a],uy=pos[b+1]-pos[a+1],uz=pos[b+2]-pos[a+2],vx=pos[c]-pos[a],vy=pos[c+1]-pos[a+1],vz=pos[c+2]-pos[a+2],x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;
    for(const v of [a,b,c]){fn[v]+=x;fn[v+1]+=y;fn[v+2]+=z;}}
  m.pos=new Float32Array(n*3);m.nrm=new Float32Array(n*3);m.uv=new Float32Array(n*2);m.col=new Float32Array(n*3);m.sw=new Float32Array(n);m.bw=new Float32Array(n*3);m.idx=I;const box={top:-9,z0:9,z1:-9,x1:0};
  for(let i=0;i<n;i++){const c=canon[i]*3,sf=soft(R[i])||R[i]==REG.SHOE,l=Math.hypot(fn[c],fn[c+1],fn[c+2])||1;
    for(let k=0;k<3;k++){m.pos[i*3+k]=pos[c+k];m.nrm[i*3+k]=sf?fn[c+k]/l:nrm[i*3+k];}
    if(R[i]==REG.HAIR){box.top=Math.max(box.top,pos[c+1]);box.z0=Math.min(box.z0,pos[c+2]);box.z1=Math.max(box.z1,pos[c+2]);box.x1=Math.max(box.x1,pos[c]);}
    m.uv[i*2]=u0+(u1-u0)*tri(pos[c]*3+pos[c+2]*2);m.uv[i*2+1]=v0+(v1-v0)*tri(pos[c+1]*3);m.col[i*3]=R[i];m.bw[i*3]=W[i*3];m.bw[i*3+1]=W[i*3+1];m.bw[i*3+2]=W[i*3+2]/255;}
  // where each foot is, heel to toe, so shoes can be made to fit
  m.feet=[-1,1].map(sx=>{const v=[];for(let i=0;i<n;i++)if(R[i]==REG.SHOE&&pos[i*3]*sx>0&&pos[i*3+1]<.05)v.push([pos[i*3],pos[i*3+1],pos[i*3+2]]);v.sort((a,b)=>a[2]-b[2]);const k=Math.max(1,v.length>>3),avg=l=>[0,1,2].map(c=>l.reduce((s,p)=>s+p[c],0)/l.length);return{heel:avg(v.slice(0,k)),toe:avg(v.slice(-k)),z0:v[0][2],z1:v[v.length-1][2]};});
  m.skull=box;return BODYMESH[key]=m;}
const SHOENET={};
function shoeMesh(sex,feet,col){if(!SHOENET[sex]){const S=SDF,D=BODYDATA[sex],prims=[];feet.forEach((f,i)=>{const an=D.rest[i?B_FOOTR:B_FOOTL],h=[f.heel[0],.04,f.z0+.042],t=[f.toe[0],.03,f.z1-.026],sole=p=>-p[1];
      prims.push([p=>Math.max(S.cap(h,t,.046,.04,1)(p),sole(p)),'s'+i,.012],[p=>Math.max(S.cap([an[0],.05,an[2]-.005],[an[0],an[1]+.035,an[2]],.045,.041,1)(p),sole(p),p[1]-an[1]-.04),'s'+i,.012]);});
    const net=surfaceNet(partField(prims),[-.3,-.02,-.2],[.3,.16,.3],.009);net.reg=net.verts.map(p=>regionAt(prims,p));SHOENET[sex]=net;}
  const net=SHOENET[sex],m=new Mesh(),[u0,v0,u1,v1]=cellUV('leather'),cl=v=>v-Math.floor(v),UV=p=>[u0+(u1-u0)*cl(p[0]*5+p[2]*3),v0+(v1-v0)*cl(p[1]*6)],bones=[];
  for(const q of net.quads){const pts=q.map(i=>net.verts[i]),ns=q.map(i=>net.N[i]),b=net.reg[q[0]]=='s0'?B_FOOTL:B_FOOTR,c=pts.map(p=>p[1]<.012?[col[0]*.5,col[1]*.5,col[2]*.5]:col);
    m.tri(pts[0],pts[1],pts[2],UV(pts[0]),UV(pts[1]),UV(pts[2]),c[0],c[1],c[2],ns[0],ns[1],ns[2]);m.tri(pts[0],pts[2],pts[3],UV(pts[0]),UV(pts[2]),UV(pts[3]),c[0],c[2],c[3],ns[0],ns[2],ns[3]);for(let k=0;k<6;k++)bones.push(b,b,0);}
  m.bw=bones;return m;}
/* caps, buns and long hair are sculpted to fit the skull they sit on */
const HEADNET={};
function headwear(sex,style,cap,box,hairCol,hatCol){const key=sex+style+(cap?'c':'');if(!HEADNET[key]){const S=SDF,D=BODYDATA[sex],prims=[],ey=D.eye[1],cz=(box.z0+box.z1)/2,rz=(box.z1-box.z0)/2,cy=ey+.012,ry=box.top-cy;
    if(cap){const brimY=ey+.062;prims.push([p=>Math.max(S.ell([0,cy,cz],[box.x1+.007,ry+.008,rz+.008])(p),brimY-p[1]),'hat',.004],[p=>Math.max(S.ell([0,brimY+.004,box.z1+.035],[.074,.007,.07])(p),cz+.02-p[2]),'hat',.003]);}
    if(style=='long')prims.push([S.cap([0,ey+.03,box.z0+.045],[0,ey-.2,box.z0+.03],.07,.075,.6),'hair',.03],[S.cap([-(box.x1-.01),ey+.03,cz-.01],[-(box.x1+.002),ey-.15,cz-.005],.03,.032,1),'hair',.02],[S.cap([box.x1-.01,ey+.03,cz-.01],[box.x1+.002,ey-.15,cz-.005],.03,.032,1),'hair',.02]);
    if(style=='bun')prims.push([S.sph([0,box.top-.02,box.z0+.02],.042),'hair',.01]);
    if(!prims.length){HEADNET[key]={quads:[]};}else{const net=surfaceNet(partField(prims),[-.14,ey-.3,box.z0-.08],[.14,box.top+.05,box.z1+.13],.01);net.reg=net.verts.map(p=>regionAt(prims,p));HEADNET[key]=net;}}
  const net=HEADNET[key],m=new Mesh(),[u0,v0,u1,v1]=cellUV('hairs'),[a0,b0,a1,b1]=cellUV('cloth'),cl=v=>v-Math.floor(v);
  for(const q of net.quads){const pts=q.map(i=>net.verts[i]),ns=q.map(i=>net.N[i]),hat=net.reg[q[0]]=='hat',c=hat?hatCol:hairCol,UV=p=>hat?[a0+(a1-a0)*cl(p[0]*4),b0+(b1-b0)*cl(p[2]*4)]:[u0+(u1-u0)*cl(p[0]*5),v0+(v1-v0)*cl(p[1]*2.5)];
    m.tri(pts[0],pts[1],pts[2],UV(pts[0]),UV(pts[1]),UV(pts[2]),c,c,c,ns[0],ns[1],ns[2]);m.tri(pts[0],pts[2],pts[3],UV(pts[0]),UV(pts[2]),UV(pts[3]),c,c,c,ns[0],ns[2],ns[3]);}
  return m;}
// a person: empty parts for things they wear and carry (in the old part spaces), plus the shared skinned body
function realHuman(o){const fem=!!(o.skirt||o.style=='long'||o.style=='bun'),sex=fem?'f':'m',D=BODYDATA[sex],A=o.acc||[],coat=A.includes('coat'),sk=rgb(o.skin||'#d9a57e');
  const hs=fem?1.1:1.14,P=[['body',[0,D.rest[5][1]-1.4,0]],['head',[0,D.eye[1]-.113*hs,D.eye[2]-.1*hs]],['legL',[0,0,0]],['legR',[0,0,0]],['armL',[0,0,0]],['armR',[0,0,0]]].map(([name,pivot])=>({mesh:new Mesh(),pivot,name}));
  P[1].scale=hs;const bare=A.includes('tricorn')||A.includes('helmet'),style=o.style=='bun'?'bun':o.style=='long'?'long':'short',hairCol=cloth(o.hair||'#3a2414',.1),body=bodyMesh(sex,coat,!!o.skirt,style);
  const pants=cloth(o.pants||'#3c3c54',.25),shirt=coat?cloth(o.coat||'#2a3a6a',.3):cloth(o.shirt||'#3d63c8'),pal=new Float32Array(36),set=(i,c)=>pal.set(c,i*3);
  set(REG.SKIN,sk);set(REG.SHIRT,shirt);set(REG.LEGUP,pants);set(REG.SHOE,cloth(o.shoe||'#2a2228',.1));set(REG.BELT,[.1,.075,.06]);set(REG.EYE,[.82,.8,.76]);
  set(REG.IRIS,cloth(o.eyes||['#3a2414','#2e4a66','#241a12','#3a5230'][Math.round(sk[0]*7)%4],.1));set(REG.ARMLOW,coat?shirt:sk);set(REG.SHIN,o.skirt?sk:pants);set(REG.HAIR,hairCol);
  P.push({mesh:body,pivot:[0,0,0],name:'skin',shared:true,pal});P.push({mesh:shoeMesh(sex,body.feet,cloth(o.shoe||'#2a2228',.1)),pivot:[0,0,0],name:'shoes',rigged:true});const hw=headwear(sex,style,!bare&&!o.capless,body.skull,hairCol,cloth(o.hat||'#6a4020'));if(hw.count)P.push({mesh:hw,pivot:[0,0,0],name:'hat',real:true});P.meta={D,fem,scale:(fem?.985:1.03)*(.97+((Math.round(sk[1]*97)+(o.shirt||'').length)%7)*.01)};return P;}
