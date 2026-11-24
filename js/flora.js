"use strict";
/* River City Quest Modern: trees, shrubs, flower beds and rocks that look like the real thing.
   Crowns are built from cards: small alpha-cut sheets painted with leaves or needles, scattered
   through the crown's volume with normals pointing out from its center so the whole crown shades
   like a soft round mass. Trunks taper and fork. Rocks are lumpy, not faceted. */
function seeded(s){let x=(s|0)||1;return()=>((x=Math.imul(x,48271)%2147483647)<0?(x+=2147483647):x)/2147483647;}
const v3={add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sc:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],n:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];}};
// one leaf card centered at c, spanning +-ax and +-ay, every corner lit as if facing nrm
function card(M,c,ax,ay,nrm,cell,col){const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1],P=(s,t)=>[c[0]+ax[0]*s+ay[0]*t,c[1]+ax[1]*s+ay[1]*t,c[2]+ax[2]*s+ay[2]*t];
  const a=P(-1,-1),b=P(1,-1),d=P(1,1),e=P(-1,1);M.tri(a,b,d,[u0,v1],[u1,v1],[u1,v0],k,k,k,nrm,nrm,nrm);M.tri(a,d,e,[u0,v1],[u1,v0],[u0,v0],k,k,k,nrm,nrm,nrm);}
function crownCards(M,R,ctr,rad,n,size,cell,tint){for(let i=0;i<n;i++){const th=R()*6.283,ph=Math.acos(1-2*R()),rr=.45+.55*Math.cbrt(R());
    const d=[Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)],pos=[ctr[0]+d[0]*rad[0]*rr,ctr[1]+d[1]*rad[1]*rr,ctr[2]+d[2]*rad[2]*rr];
    const nr=v3.n([d[0]*.8,d[1]*.8+.35,d[2]*.8]),q=v3.n([R()-.5,R()-.5,R()-.5]),ax=v3.n(v3.cross(q,[0,1,0])),ay=v3.n(v3.cross(q,ax)),s=size*(.75+R()*.5);
    const shade=.82+R()*.3,col=(tint||[1,1,1]).map(v=>v*shade);card(M,pos,v3.sc(ax,s),v3.sc(ay,s),nr,cell,col);}}
// a broadleaf tree: oak, maple or elm, about 7 to 9 meters tall
function deciduous(M,x,z,seed,s,y0){s=s||1;y0=y0||0;const R=seeded(seed*7919+13),top=(3.4+R()*.8)*s,lean=[(R()-.5)*.3,(R()-.5)*.3];
  M.swayV=0;M.lathe(x,y0,z,[[0,.34*s],[.18*s,.24*s],[.6*s,.19*s],[top*.7,.15*s],[top,.1*s]],8,'bark');
  const tx=x+lean[0],tz=z+lean[1];
  for(let i=0;i<5;i++){const a=i*1.26+R()*.6,by=y0+(1.9+i*.33)*s,len=(1.3+R()*.7)*s,end=[x+Math.cos(a)*len,by+(1+R()*.6)*s,z+Math.sin(a)*len];
    M.tube([x,by,z],end,.1*s,.035*s,6,'bark');const tw=[end[0]+Math.cos(a+.6)*.6*s,end[1]+.5*s,end[2]+Math.sin(a+.6)*.6*s];M.tube(end,tw,.035*s,.015*s,5,'bark');}
  M.swayV=.05;const cy=y0+(4.3+R()*.6)*s,rx=(2.1+R()*.5)*s,ry=(1.9+R()*.4)*s;
  crownCards(M,R,[tx,cy,tz],[rx,ry,rx*(.9+R()*.2)],52,1.05*s,'leafcard');
  for(let k=0;k<3;k++){const a=R()*6.283;crownCards(M,R,[tx+Math.cos(a)*rx*.7,cy-ry*.35,tz+Math.sin(a)*rx*.7],[rx*.5,ry*.45,rx*.5],10,.85*s,'leafcard');}
  M.swayV=0;}
// a pine: straight trunk, tiers of needle cards that droop toward the tips
function conifer(M,x,z,seed,s,y0){s=s||1;y0=y0||0;const R=seeded(seed*104729+7),H=(7+R()*2)*s;M.swayV=0;M.lathe(x,y0,z,[[0,.26*s],[.3*s,.2*s],[H,.04*s]],8,'bark');
  M.swayV=.035;const tiers=11;for(let j=0;j<tiers;j++){const t=j/tiers,y=y0+(1.4*s+t*(H-1.6*s)),rad=(2.1*(1-t)+.3)*s,n=7,off=R()*6.283;
    for(let i=0;i<n;i++){const a=off+i/n*6.283,dir=[Math.cos(a),0,Math.sin(a)],out=v3.add([x,y-.35*s*(1-t*.5),z],v3.sc(dir,rad*.55)),nr=v3.n([dir[0]*.6,.8,dir[2]*.6]);
      const ax=v3.sc(dir,rad*.55),side=v3.sc(v3.n(v3.cross([0,1,0],dir)),(.55+.35*(1-t))*s);ax[1]=-.22*s*(1-t*.5);card(M,out,ax,side,nr,'needles',[.9+R()*.15,1,.9+R()*.15]);
      const ax2=[ax[0],ax[1],ax[2]],up=v3.sc([0,1,0],.32*s);card(M,out,ax2,up,nr,'needles',[.85,.95,.85]);}}
  M.swayV=0;}
function shrub(M,x,z,seed,s,y0){s=s||1;y0=y0||0;const R=seeded(seed*31337+5);M.swayV=.03;crownCards(M,R,[x,y0+.55*s,z],[.75*s,.55*s,.75*s],16,.55*s,'leafcard',[.85,.95,.85]);M.swayV=0;}
// a mulched flower bed: low plants and a scatter of real-sized blossoms
function flowerbed(M,X0,Z0,X1,Z1,seed){const R=seeded(seed*997+3);M.quad([X0+.08,.03,Z1-.08],[X1-.08,.03,Z1-.08],[X1-.08,.03,Z0+.08],[X0+.08,.03,Z0+.08],'mulch');
  for(let i=0;i<4;i++){const x=X0+.4+R()*(X1-X0-.8),z=Z0+.4+R()*(Z1-Z0-.8);shrub(M,x,z,seed*5+i,.38);}
  const cols=['#d8c040','#e8e0d8','#b8406a','#8a5ab0','#d86a3a'],c=rgb(cols[seed%cols.length]).map(v=>v*.85);
  for(let i=0;i<22;i++){const x=X0+.25+R()*(X1-X0-.5),z=Z0+.25+R()*(Z1-Z0-.5),y=.32+R()*.18;M.tube([x,.03,z],[x,y,z],.008,.006,4,'white',[.25,.4,.18]);M.sphere(x,y,z,.035,6,3,'white',c,.6);}}
// a lumpy boulder: a sphere pushed in and out by smooth noise
function boulder(M,x,z,seed,s){const R=seeded(seed*7+1),t=new Mesh();t.sphere(0,0,0,1,10,6,'rock',null,.62);
  for(let i=0;i<t.count;i++){const px=t.pos[i*3],py=t.pos[i*3+1],pz=t.pos[i*3+2],k=.78+.32*(Math.sin(px*3.1+seed)*Math.cos(pz*2.7+seed*.3)*.5+.5)+.08*Math.sin(py*9+px*5);
    t.pos[i*3]=x+px*k*s*(1+R()*.04);t.pos[i*3+1]=Math.max(-.05,py*k*s+.18*s);t.pos[i*3+2]=z+pz*k*s*(.85+R()*.04);}M.add(t);}
