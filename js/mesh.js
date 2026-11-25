"use strict";
/* River City Quest Modern: geometry. Same building blocks as the PS1 version (quads, boxes, lathes,
   spheres, tubes), but every vertex now carries a real normal so the renderer can light it, round
   shapes get more segments, and texture cells live in a texture array instead of one atlas.
   A cell's layer number is packed into the whole part of u, so u runs from layer to layer+1 across a face.
   A tile of the 2D map is TS world units across. */
const TS=2;
const CELLS=['grass','grass2','flowers','dirt','sand','cobble','sidewalk','steps','rails','planks','brick','brickwin','brickwin2','storefront','roof','stone',
  'stonewall','marble','column','white','door','doorlit','bark','leaves','leaves2','rock','fence','floor','qwall','rubble','sign','gold','glass','wood','black','clock',
  'copper','chest','face','eyes','awning','awning2','sign2','grille','tuft','bloom','worn','pigeon','tilefl','woodfl','plaster','mural','bars','vine','marquee','seat','arcade','engine','concrete','case','hair','shell','lock','crack','tin','clap','clap2','water','foam','keystone','paper','lampglow','sky',
  'cloth','knit','denim','leather','skin','hairs','brass','asphalt','gravel','bricksw','curb','leafcard','needles','mulch','granite','pane','panelit','fur','feather','carapace','paint','tire','chrome','text1','text2','text3','text4','text5'];
const CELL={};CELLS.forEach((n,i)=>CELL[n]=i);
const ATLAS_N=16,ATLAS_PX=32;
// round things get this many times more segments than the PS1 version gave them
const DETAIL={k:2};
function cellUV(name){const i=CELL[name]==null?CELL.white:CELL[name],e=.002;return[i+e,e,i+1-e,1-e];}
const nrm3=v=>{const l=Math.hypot(v[0],v[1],v[2]);return l<1e-9?[0,1,0]:[v[0]/l,v[1]/l,v[2]/l];};
const faceN=(a,b,c)=>nrm3([(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])]);
const segs=n=>Math.max(3,Math.round(n*DETAIL.k));
class Mesh{
  constructor(){this.pos=[];this.uv=[];this.col=[];this.sw=[];this.nrm=[];this.swayV=0;}
  get count(){return this.pos.length/3;}
  // na/nb/nc are optional smooth normals; without them the face normal is used
  tri(a,b,c,ua,ub,uc,ca,cb,cc,na,nb,nc){const f=na?null:faceN(a,b,c);
    for(const [p,u,k,n] of [[a,ua,ca,na],[b,ub,cb,nb],[c,uc,cc,nc]]){this.pos.push(p[0],p[1],p[2]);this.uv.push(u[0],u[1]);this.col.push(k[0],k[1],k[2]);this.sw.push(this.swayV);const N=n||f;this.nrm.push(N[0],N[1],N[2]);}}
  // a quad a-b-c-d (counter-clockwise seen from the front) showing one texture cell.
  // shade is ignored now: the renderer does the lighting.
  quad(a,b,c,d,cell,col){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1];
    this.tri(a,b,c,[u0,v1],[u1,v1],[u1,v0],k,k,k);this.tri(a,c,d,[u0,v1],[u1,v0],[u0,v0],k,k,k);}
  wall(x0,z0,x1,z1,y0,y1,cell,col,shade,cellFn){const len=Math.hypot(x1-x0,z1-z0),nx=Math.max(1,Math.round(len/TS)),ny=Math.max(1,Math.round((y1-y0)/TS));
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const a=i/nx,b=(i+1)/nx,ya=y0+(y1-y0)*j/ny,yb=y0+(y1-y0)*(j+1)/ny,
      xa=x0+(x1-x0)*a,za=z0+(z1-z0)*a,xb=x0+(x1-x0)*b,zb=z0+(z1-z0)*b;
      this.quad([xa,ya,za],[xb,ya,zb],[xb,yb,zb],[xa,yb,za],cellFn?cellFn(i,j,nx,ny):cell,col);}}
  floor(x0,z0,x1,z1,y,cell,col,shade,down){const nx=Math.max(1,Math.round((x1-x0)/TS)),nz=Math.max(1,Math.round((z1-z0)/TS));
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const xa=x0+(x1-x0)*i/nx,xb=x0+(x1-x0)*(i+1)/nx,za=z0+(z1-z0)*j/nz,zb=z0+(z1-z0)*(j+1)/nz;
      if(down)this.quad([xa,y,za],[xb,y,za],[xb,y,zb],[xa,y,zb],cell,col);else this.quad([xa,y,zb],[xb,y,zb],[xb,y,za],[xa,y,za],cell,col);}}
  box(x0,y0,z0,x1,y1,z1,cells,col,skip,tile){const c=typeof cells=='string'?{top:cells,side:cells,bottom:cells}:cells,sk=skip||{},T=tile;
    const W=(a,b,cc)=>{if(T)this.wall(a[0],a[1],b[0],b[1],y0,y1,cc,col);else this.quad([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],cc,col);};
    if(!sk.s)W([x0,z1],[x1,z1],c.south||c.side);if(!sk.n)W([x1,z0],[x0,z0],c.north||c.side);
    if(!sk.e)W([x1,z1],[x1,z0],c.east||c.side);if(!sk.w)W([x0,z0],[x0,z1],c.west||c.side);
    if(!sk.top){if(T)this.floor(x0,z0,x1,z1,y1,c.top,col);else this.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],c.top,col);}
    if(!sk.bottom)this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],c.bottom||c.side,col);}
  // an n-sided cone or frustum around (x,z), smoothly shaded around its sides (few-sided ones stay faceted)
  cone(x,y0,z,r0,y1,r1,n,cell,col,a0){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1];a0=a0||0;const smooth=n>=6;if(smooth)n=segs(n);
    const sl=(r0-r1)/Math.max(.001,Math.hypot(r0-r1,y1-y0)),cy=Math.hypot(r0-r1,y1-y0)?(y1-y0)/Math.hypot(r0-r1,y1-y0):1,N=a=>nrm3([Math.cos(a)*cy,sl,Math.sin(a)*cy]);
    for(let i=0;i<n;i++){const a=a0+i/n*6.283,b=a0+(i+1)/n*6.283,ua=u0+(u1-u0)*i/n,ub=u0+(u1-u0)*(i+1)/n;
      const p0=[x+Math.cos(a)*r0,y0,z+Math.sin(a)*r0],p1=[x+Math.cos(b)*r0,y0,z+Math.sin(b)*r0],q0=[x+Math.cos(a)*r1,y1,z+Math.sin(a)*r1],q1=[x+Math.cos(b)*r1,y1,z+Math.sin(b)*r1];
      const na=smooth?N(a):null,nb=smooth?N(b):null;
      if(r1<.001)this.tri(p1,p0,q0,[ub,v1],[ua,v1],[(ua+ub)/2,v0],k,k,k,nb,na,smooth?N((a+b)/2):null);
      else{this.tri(p1,p0,q0,[ub,v1],[ua,v1],[ua,v0],k,k,k,nb,na,na);this.tri(p1,q0,q1,[ub,v1],[ua,v0],[ub,v0],k,k,k,nb,na,nb);}}}
  disc(x,y,z,r,n,cell,col,down){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1],c=[(u0+u1)/2,(v0+v1)/2];n=segs(n);
    for(let i=0;i<n;i++){const a=i/n*6.283,b=(i+1)/n*6.283,p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r];
      const ua=[c[0]+Math.cos(a)*(u1-u0)/2,c[1]+Math.sin(a)*(v1-v0)/2],ub=[c[0]+Math.cos(b)*(u1-u0)/2,c[1]+Math.sin(b)*(v1-v0)/2];
      if(down)this.tri([x,y,z],p,q,c,ua,ub,k,k,k);else this.tri([x,y,z],q,p,c,ub,ua,k,k,k);}}
  gable(x0,z0,x1,z1,y0,h,alongX,cell,col,end){const yt=y0+h;
    if(alongX){const zm=(z0+z1)/2;this.quad([x0,y0,z1],[x1,y0,z1],[x1,yt,zm],[x0,yt,zm],cell,col);this.quad([x1,y0,z0],[x0,y0,z0],[x0,yt,zm],[x1,yt,zm],cell,col);
      const [u0,v0,u1,v1]=cellUV(end||cell),k=col||[1,1,1];this.tri([x0,y0,z0],[x0,y0,z1],[x0,yt,zm],[u0,v1],[u1,v1],[(u0+u1)/2,v0],k,k,k);this.tri([x1,y0,z1],[x1,y0,z0],[x1,yt,zm],[u0,v1],[u1,v1],[(u0+u1)/2,v0],k,k,k);}
    else{const xm=(x0+x1)/2;this.quad([x1,y0,z1],[x1,y0,z0],[xm,yt,z0],[xm,yt,z1],cell,col);this.quad([x0,y0,z0],[x0,y0,z1],[xm,yt,z1],[xm,yt,z0],cell,col);
      const [u0,v0,u1,v1]=cellUV(end||cell),k=col||[1,1,1];this.tri([x0,y0,z1],[x1,y0,z1],[xm,yt,z1],[u0,v1],[u1,v1],[(u0+u1)/2,v0],k,k,k);this.tri([x1,y0,z0],[x0,y0,z0],[xm,yt,z0],[u0,v1],[u1,v1],[(u0+u1)/2,v0],k,k,k);}}
  // a smooth round shape spun around a vertical axis: prof is [[y,r],...] from bottom to top, with smooth normals
  lathe(cx,cy,cz,prof,n,cell,col,sx,sz,cap){sx=sx||1;sz=sz||1;if(!prof.length)return;n=segs(n);const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1];
    const V=(i,j)=>{const [y,r]=prof[i],a=j/n*6.283,ca=Math.cos(a),sa=Math.sin(a);const y0=prof[Math.max(0,i-1)][0],y1=prof[Math.min(prof.length-1,i+1)][0],r0=prof[Math.max(0,i-1)][1],r1=prof[Math.min(prof.length-1,i+1)][1];
      let ny=-(r1-r0),nh=(y1-y0)||.001;const l=Math.hypot(ny,nh);ny/=l;nh/=l;
      return{p:[cx+ca*r*sx,cy+y,cz+sa*r*sz],n:nrm3([ca*nh/sx,ny,sa*nh/sz]),u:u0+(u1-u0)*j/n,v:v1-(v1-v0)*i/Math.max(1,prof.length-1)};};
    for(let i=0;i<prof.length-1;i++)for(let j=0;j<n;j++){const a=V(i,j),b=V(i,j+1),c=V(i+1,j+1),d=V(i+1,j);
      this.tri(a.p,c.p,b.p,[a.u,a.v],[c.u,c.v],[b.u,b.v],k,k,k,a.n,c.n,b.n);this.tri(a.p,d.p,c.p,[a.u,a.v],[d.u,d.v],[c.u,c.v],k,k,k,a.n,d.n,c.n);}
    if(cap){const t=prof[prof.length-1];if(t[1]>.001)this.disc(cx,cy+t[0],cz,t[1]*Math.max(sx,sz),n/DETAIL.k,cell,k);const b=prof[0];if(b[1]>.001)this.disc(cx,cy+b[0],cz,b[1]*Math.max(sx,sz),n/DETAIL.k,cell,k,true);}}
  sphere(cx,cy,cz,r,n,rings,cell,col,sy,sx,sz,from,to){const pr=[];from=from==null?0:from;to=to==null?1:to;rings=Math.max(2,Math.round(rings*DETAIL.k));
    for(let i=0;i<=rings;i++){const t=from+(to-from)*i/rings,a=-Math.PI/2+t*Math.PI;pr.push([Math.sin(a)*r*(sy||1),Math.cos(a)*r]);}
    this.lathe(cx,cy,cz,pr,n,cell,col,sx,sz);}
  tube(a,b,r0,r1,n,cell,col,caps){const t=new Mesh(),L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(L<1e-5)return this;t.lathe(0,0,0,[[0,r0],[L,r1]],n,cell,col);
    if(caps){t.sphere(0,0,0,r0,n,3,cell,col,1,1,1,0,.5);t.sphere(0,L,0,r1,n,3,cell,col,1,1,1,.5,1);}
    const d=[(b[0]-a[0])/L,(b[1]-a[1])/L,(b[2]-a[2])/L];let ax=[d[2],0,-d[0]];const al=Math.hypot(ax[0],ax[2]);const ang=Math.acos(Math.max(-1,Math.min(1,d[1])));
    if(al<1e-6)ax=[1,0,0];else ax=[ax[0]/al,0,ax[2]/al];const c=Math.cos(ang),s=Math.sin(ang),[kx,ky,kz]=ax;
    const rot=(x,y,z)=>{const dot=kx*x+ky*y+kz*z,qx=ky*z-kz*y,qy=kz*x-kx*z,qz=kx*y-ky*x;return[x*c+qx*s+kx*dot*(1-c),y*c+qy*s+ky*dot*(1-c),z*c+qz*s+kz*dot*(1-c)];};
    for(let i=0;i<t.pos.length;i+=3){const p=rot(t.pos[i],t.pos[i+1],t.pos[i+2]);t.pos[i]=p[0]+a[0];t.pos[i+1]=p[1]+a[1];t.pos[i+2]=p[2]+a[2];const q=rot(t.nrm[i],t.nrm[i+1],t.nrm[i+2]);t.nrm[i]=q[0];t.nrm[i+1]=q[1];t.nrm[i+2]=q[2];}
    return this.add(t);}
  add(m){for(let i=0;i<m.pos.length;i++)this.pos.push(m.pos[i]);for(let i=0;i<m.uv.length;i++)this.uv.push(m.uv[i]);for(let i=0;i<m.col.length;i++)this.col.push(m.col[i]);
    for(let i=0;i<m.nrm.length;i++)this.nrm.push(m.nrm[i]);for(let i=0;i<m.count;i++)this.sw.push(m.sw[i]||this.swayV);return this;}
}
const hash=(a,b,c)=>{let h=(a*374761393+b*668265263+(c||0)*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0);};
const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
