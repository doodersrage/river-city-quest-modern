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

/* ---------- anatomy ---------- */
// build: {fem, wide, hair:'short'|'long'|'bun'|'bald', hat:'cap'|'none', coat, skirt}
function bodyParts(B){const S=SDF,f=B.fem,w=B.wide||1,sh=(f?.155:.178)*w,hp=(f?.165:.15)*w,bu=f?1:0;
  const shirt=B.coat?'coat':'shirt',low=B.skirt?'skirt':'pants';
  const body=[[S.ell([0,.95,-.005],[hp,.12,.1]),low],[S.sph([-.07*w,.92,-.055],.085),low,.06],[S.sph([.07*w,.92,-.055],.085),low,.06],
    [S.cap([0,1.0,0],[0,1.18,0],(f?.118:.13)*w,(f?.12:.145)*w,.72),shirt,.08],[S.ell([0,1.3,.008],[sh*.98,.13,.115]),shirt,.07],
    [S.sph([-sh*.92,1.41,0],.062),shirt,.05],[S.sph([sh*.92,1.41,0],.062),shirt,.05],[S.cap([-.05,1.48,-.01],[-sh*.85,1.43,0],.045,.04),shirt,.05],[S.cap([.05,1.48,-.01],[sh*.85,1.43,0],.045,.04),shirt,.05],
    [S.cap([0,1.44,.0],[0,1.62,.012],.054,.05),'skin',.04],[S.ell([0,1.02,.0],[hp*1.02,.028,.105]),'belt',.0]];
  if(bu)body.push([S.sph([-.06,1.3,.075],.06),shirt,.05],[S.sph([.06,1.3,.075],.06),shirt,.05]);
  if(B.skirt)body.push([S.cap([0,.98,0],[0,.48,0],hp*1.05,.24,.8),'skirt',.06]);
  if(B.coat)body.push([S.cap([0,1.2,0],[0,.62,0],sh*.9,.2,.72),'coat',.06]);
  const head=[[S.ell([0,.125,-.012],[.079,.098,.095]),'skin'],[S.ell([0,.07,.028],[.068,.076,.073]),'skin',.035],[S.ell([0,.035,.035],[.058,.045,.06]),'skin',.03],[S.sph([0,.008,.072],.026),'skin',.025],
    [S.cap([0,.112,.086],[0,.074,.108],.011,.015),'skin',.012],[S.cap([-.034,.135,.078],[.034,.135,.078],.014,.014),'skin',.016],
    [S.sph([-.046,.09,.06],.032),'skin',.02],[S.sph([.046,.09,.06],.032),'skin',.02],[S.ell([-.079,.1,-.005],[.011,.03,.019]),'skin',.01],[S.ell([.079,.1,-.005],[.011,.03,.019]),'skin',.01],
    [S.ell([0,.044,.094],[.02,.006,.008]),'lips',.006]];
  const hairS=B.hair||'short',hat=B.hat=='cap';
  const hairPrims=[];
  if(hairS!='bald'){hairPrims.push([p=>Math.max(S.ell([0,.128,-.016],[.085,.108,.101])(p),.092-p[1]+(p[2]<-.02?(-p[2]-.02)*1.6:0)+(p[2]>.06?.5:0)),'hair',.012]);
    if(hairS=='long')hairPrims.push([S.cap([0,.1,-.06],[0,-.12,-.07],.075,.07,.65),'hair',.03]);
    if(hairS=='bun')hairPrims.push([S.sph([0,.205,-.075],.04),'hair',.015]);}
  if(hat){hairPrims.length=0;hairPrims.push([p=>Math.max(S.ell([0,.13,-.012],[.088,.11,.103])(p),.122-p[1]),'hat',.006],[S.ell([0,.12,.095],[.075,.01,.06]),'hat',.004]);
    hairPrims.push([p=>Math.max(S.ell([0,.1,-.02],[.083,.08,.097])(p),p[1]-.122,p[2]+.01),'hair',.01]);}
  head.push(...hairPrims);
  const cuts=[[S.sph([-.033,.113,.097],.013),.012],[S.sph([.033,.113,.097],.013),.012]];
  const leg=[[S.cap([0,.0,0],[0,-.44,.012],.088*(f?1.03:1),.056),low],[S.sph([0,-.55,-.03],.055),low,.05],[S.cap([0,-.45,.01],[0,-.82,-.005],.054,.036),low,.04],
    [S.cap([0,-.875,-.04],[0,-.885,.13],.046,.04,1),'shoe',.03],[S.box([0,-.905,.04],[.045,.012,.1],.008),'shoe',.02]];
  if(B.skirt){leg[0][1]='skin';leg[1][1]='skin';leg[2][1]='skin';}
  const arm=[[S.sph([0,0,0],.062),shirt],[S.cap([0,-.03,0],[0,-.29,.005],.056,.043),shirt,.04],[S.cap([0,-.3,.008],[0,-.54,.025],.044,.031),B.coat?'coat':'skin',.03],
    [S.ell([0,-.6,.03],[.024,.052,.041]),'skin',.02],[S.cap([0,-.575,.055],[.0,-.62,.075],.012,.01),'skin',.012]];
  return{body:{prims:body,lo:[-.32,.4,-.25],hi:[.32,1.66,.25],h:.022},head:{prims:head,cuts,lo:[-.11,-.16,-.13],hi:[.11,.25,.14],h:.012},
    legL:{prims:leg,lo:[-.11,-.94,-.12],hi:[.11,.12,.2],h:.02},legR:{prims:leg,lo:[-.11,-.94,-.12],hi:[.11,.12,.2],h:.02},
    armL:{prims:arm,lo:[-.08,-.67,-.08],hi:[.08,.08,.12],h:.016},armR:{prims:arm,lo:[-.08,-.67,-.08],hi:[.08,.08,.12],h:.016}};}
const BODYGEO={};
let BODY_RES=1;// 1 = full detail; larger is coarser (set from the graphics quality)
function bodyGeo(B){const key=JSON.stringify(B)+BODY_RES;if(BODYGEO[key])return BODYGEO[key];const D=bodyParts(B),out={};
  for(const name in D){if(name=='legR'||name=='armR'){out[name]=out[name.replace('R','L')];continue;}const d=D[name],F=partField(d.prims,d.cuts),net=surfaceNet(F,d.lo,d.hi,d.h*BODY_RES),tris=[];
    const vreg=net.verts.map(p=>regionAt(d.prims,p));
    for(const q of net.quads){const c=[0,1,2,3].map(i=>net.verts[q[i]]),ctr=[0,1,2].map(a=>(c[0][a]+c[1][a]+c[2][a]+c[3][a])/4);tris.push([q,regionAt(d.prims,ctr)]);}
    out[name]={net,tris,vreg,lo:d.lo,hi:d.hi};}
  return BODYGEO[key]=out;}
// one soft material for the whole figure: region edges then blend through the vertex colors instead of stepping
const REGION_CELL={skin:'skin',lips:'skin',shirt:'skin',coat:'skin',pants:'skin',skirt:'skin',belt:'skin',shoe:'skin',hair:'skin',hat:'skin'};
function sculptedHuman(o){const f=o.skirt||o.style=='long'||o.style=='bun',B={fem:!!f,wide:+(o.wide||1).toFixed(2),hair:o.style=='bun'?'bun':o.style=='long'?'long':'short',hat:o.capless?'none':'cap',coat:(o.acc||[]).includes('coat'),skirt:!!o.skirt};
  const G=bodyGeo(B),sk=rgb(o.skin||'#d9a57e');
  const COL={skin:sk,lips:[sk[0]*.9,sk[1]*.7,sk[2]*.68],shirt:cloth(o.shirt||'#3d63c8'),coat:cloth(o.coat||'#2a3a6a',.3),pants:cloth(o.pants||'#3c3c54',.25),skirt:cloth(o.pants||'#3c3c54',.25),
    belt:[.12,.09,.07],shoe:cloth(o.shoe||'#2a2228',.1),hair:cloth(o.hair||'#3a2414',.1),hat:cloth(o.hat||'#6a4020')};
  const pivots={body:[0,0,0],head:[0,1.6,0],legL:[-.09*(B.fem?.9:1),.92,0],legR:[.09*(B.fem?.9:1),.92,0],armL:[-(B.fem?.155:.178)*B.wide*1.08,1.42,0],armR:[(B.fem?.155:.178)*B.wide*1.08,1.42,0]};
  const P=[];for(const name of ['body','head','legL','legR','armL','armR']){const g=G[name],m=new Mesh(),V=g.net.verts,N=g.net.N,sx=name=='armL'||name=='legL'?-1:1;
    for(const [q,reg] of g.tris){const [u0,v0,u1,v1]=cellUV(REGION_CELL[reg]||'white'),col=COL[reg]||[1,1,1],UV=p=>[u0+(u1-u0)*((p[0]-g.lo[0])/(g.hi[0]-g.lo[0])),v1-(v1-v0)*((p[1]-g.lo[1])/(g.hi[1]-g.lo[1]))];
      const pts=q.map(i=>V[i]),ns=q.map(i=>N[i]),cs=q.map(i=>COL[g.vreg[i]]||col);
      m.tri(pts[0],pts[1],pts[2],UV(pts[0]),UV(pts[1]),UV(pts[2]),cs[0],cs[1],cs[2],ns[0],ns[1],ns[2]);m.tri(pts[0],pts[2],pts[3],UV(pts[0]),UV(pts[2]),UV(pts[3]),cs[0],cs[2],cs[3],ns[0],ns[2],ns[3]);}
    if(sx<0)for(let i=0;i<m.pos.length;i+=3){m.pos[i]=-m.pos[i];m.nrm[i]=-m.nrm[i];}
    P.push({mesh:m,pivot:pivots[name],name});}
  // the eyes: whites, irises and a glint, set into the sockets
  const Hd=P[1].mesh;for(const sx of [-1,1]){Hd.sphere(sx*.033,.113,.087,.0122,10,6,'white',[.86,.84,.8]);Hd.sphere(sx*.033,.113,.0975,.0055,8,4,'white',cloth(o.eyes||['#4a3020','#3a5a7a','#2a2018','#4a6a3a'][Math.round(sk[0]*7)%4],.1));Hd.sphere(sx*.033,.113,.1012,.0024,6,3,'white',[.02,.02,.02]);}
  return P;}
