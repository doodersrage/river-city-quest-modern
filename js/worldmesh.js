"use strict";
/* River City Quest Modern: building the polygon world you see. Ground and water, streets as ribbons with real
   widths, sidewalks, crossings and lane paint, parks and parking lots, every building raised from its real
   footprint with windows, doors, cornices and a roof, landmarks set on the real buildings they are, bridges,
   railways, fences, trees and street furniture. Nothing here is on a grid: walls run at whatever angle the real
   ones do, and textures run across them at true scale. */
const WUP=[0,1,0];
// phones get a lighter build of each neighborhood: fewer trees and parked cars, plainer windows
const WLOW=typeof navigator!='undefined'&&/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
const tileOf=cell=>-(CELL[cell]+1);// sway below zero tells the shader this surface repeats its texture
// flat ground triangle, texture laid out by position so neighbors always match
function gTri(M,a,b,c,cell,col){const k=col||[1,1,1],s=M.swayV;M.swayV=tileOf(cell);M.tri(a,b,c,[a[0]/2,a[2]/2],[b[0]/2,b[2]/2],[c[0]/2,c[2]/2],k,k,k,WUP,WUP,WUP);M.swayV=s;}
// cut a simple outline into triangles
function earcut(pp){const n=pp.length,out=[];if(n<3)return out;const idx=[];for(let i=0;i<n;i++)idx.push(i);const sgn=polyArea(pp)>0?1:-1;let guard=n*n+10;
  const cross=(a,b,c)=>((pp[b][0]-pp[a][0])*(pp[c][1]-pp[a][1])-(pp[b][1]-pp[a][1])*(pp[c][0]-pp[a][0]))*sgn;
  const inside=(a,b,c,p)=>{const d1=cross(a,b,p),d2=cross(b,c,p),d3=cross(c,a,p);return d1>1e-9&&d2>1e-9&&d3>1e-9;};
  while(idx.length>3&&guard-->0){let cut=false;for(let i=0;i<idx.length;i++){const a=idx[(i+idx.length-1)%idx.length],b=idx[i],c=idx[(i+1)%idx.length];if(cross(a,b,c)<=1e-9)continue;let ok=true;for(const p of idx){if(p==a||p==b||p==c)continue;if(inside(a,b,c,p)){ok=false;break;}}
      if(ok){out.push(a,b,c);idx.splice(i,1);cut=true;break;}}if(!cut){idx.splice(0,1);}}
  if(idx.length==3)out.push(idx[0],idx[1],idx[2]);return out;}
function gPoly(M,pp,y,cell,col){const t=earcut(pp);for(let i=0;i<t.length;i+=3)gTri(M,[pp[t[i]][0],y,pp[t[i]][1]],[pp[t[i+1]][0],y,pp[t[i+1]][1]],[pp[t[i+2]][0],y,pp[t[i+2]][1]],cell,col);}
// a strip of ground following a line, with rounded corners and ends
function ribbon(M,pts,hw,y,cell,col,caps){const n=pts.length;for(let i=0;i<n-1;i++){const a=pts[i],b=pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<.02)continue;const nx=-(b[1]-a[1])/l*hw,nz=(b[0]-a[0])/l*hw;
    const p0=[a[0]+nx,y,a[1]+nz],p1=[a[0]-nx,y,a[1]-nz],p2=[b[0]-nx,y,b[1]-nz],p3=[b[0]+nx,y,b[1]+nz];gTri(M,p0,p1,p2,cell,col);gTri(M,p0,p2,p3,cell,col);}
  for(let i=caps?0:1;i<(caps?n:n-1);i++){const c=pts[i];for(let k=0;k<7;k++){const a0=k/7*6.2832,a1=(k+1)/7*6.2832;gTri(M,[c[0],y,c[1]],[c[0]+Math.cos(a0)*hw,y,c[1]+Math.sin(a0)*hw],[c[0]+Math.cos(a1)*hw,y,c[1]+Math.sin(a1)*hw],cell,col);}}}
// a line moved sideways (positive is to its right)
function offsetLine(pts,off){const out=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;out.push([pts[i][0]-(b[1]-a[1])/l*off,pts[i][1]+(b[0]-a[0])/l*off]);}return out;}
const lineLen=p=>{let s=0;for(let i=0;i<p.length-1;i++)s+=Math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]);return s;};
// the piece of a line between two distances along it
function lineCut(p,s0,s1){const out=[];let s=0;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<1e-6)continue;const e=s+l;if(e>s0&&s<s1){const t0=Math.max(0,(s0-s)/l),t1=Math.min(1,(s1-s)/l);if(!out.length)out.push([a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0]);out.push([a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1]);}s=e;}return out;}
function lineAt(p,d){let s=0;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<1e-6)continue;if(s+l>=d||i==p.length-2){const t=Math.max(0,Math.min(1,(d-s)/l));return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/l,dz:(b[1]-a[1])/l};}s+=l;}return{x:p[0][0],z:p[0][1],dx:1,dz:0};}
// an upright wall between two points, texture running along it at true scale
function wallQuad(M,a,b,y0,y1,cell,col,u0,nrm,colLow){if(Math.hypot(nrm[0],nrm[1],nrm[2])<.5)return;const L=Math.hypot(b[0]-a[0],b[1]-a[1])/2,k=col||[1,1,1],kl=colLow||k,s=M.swayV;M.swayV=tileOf(cell);const A=[a[0],y0,a[1]],B=[b[0],y0,b[1]],C=[b[0],y1,b[1]],D=[a[0],y1,a[1]];
  M.tri(B,A,D,[u0+L,-y0/2],[u0,-y0/2],[u0,-y1/2],kl,kl,k,nrm,nrm,nrm);M.tri(B,D,C,[u0+L,-y0/2],[u0,-y1/2],[u0+L,-y1/2],kl,k,k,nrm,nrm,nrm);M.swayV=s;}
// drawing on one wall of a building: u runs along it, d comes out of it
function wallFrame(a,b){const l=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l,nx=uz,nz=-ux;return{len:l,nx,nz,ux,uz,P:(u,y,d)=>[b[0]-ux*u+nx*d,y,b[1]-uz*u+nz*d]};}// u runs left to right as you face the wall
const fQuad=(M,F,u0,u1,y0,y1,d,cell,col)=>M.quad(F.P(u0,y0,d),F.P(u1,y0,d),F.P(u1,y1,d),F.P(u0,y1,d),cell,col);
function fBox(M,F,u0,u1,y0,y1,d0,d1,cell,col,noBottom){fQuad(M,F,u0,u1,y0,y1,d1,cell,col);M.quad(F.P(u0,y1,d1),F.P(u1,y1,d1),F.P(u1,y1,d0),F.P(u0,y1,d0),cell,col);if(!noBottom)M.quad(F.P(u0,y0,d0),F.P(u1,y0,d0),F.P(u1,y0,d1),F.P(u0,y0,d1),cell,col);
  M.quad(F.P(u0,y0,d0),F.P(u0,y0,d1),F.P(u0,y1,d1),F.P(u0,y1,d0),cell,col);M.quad(F.P(u1,y0,d1),F.P(u1,y0,d0),F.P(u1,y1,d0),F.P(u1,y1,d1),cell,col);}

// a shallow ledge: its face and its top, nothing hidden
function fLedge(M,F,u0,u1,y0,y1,d,cell,col){fQuad(M,F,u0,u1,y0,y1,d,cell,col);M.quad(F.P(u0,y1,d),F.P(u1,y1,d),F.P(u1,y1,0),F.P(u0,y1,0),cell,col);}

/* ---------- ground and water ---------- */
function worldGround(M,Wm,lv,w){const x0=-w.mx,x1=w.w+w.mx,z0=-w.mz,z1=w.h+w.mz,hd=hood(lv),paved=['broad','shockoe','works','cary','jward'].includes(hd),base=paved?'concrete':'grass',bc=paved?[.86,.85,.82]:null;
  if(!w.wf){for(let x=x0;x<x1;x+=40)for(let z=z0;z<z1;z+=40){const a=[x,0,z],b=[Math.min(x1,x+40),0,z],c=[Math.min(x1,x+40),0,Math.min(z1,z+40)],d=[x,0,Math.min(z1,z+40)];gTri(M,a,b,c,base,bc);gTri(M,a,c,d,base,bc);}}
  else{// the bank is traced through the smoothed water, square by square; open land is merged into long strips
    const cw=w.water.cw,ch=w.water.ch,f=w.wf,X=i=>x0+i*2+1,Z=j=>z0+j*2+1,bank=[.5,.44,.36];
    Wm.quad([x0,-.35,z1],[x1,-.35,z1],[x1,-.35,z0],[x0,-.35,z0],'white');
    for(let j=0;j<ch-1;j++){let run=-1;for(let i=0;i<cw;i++){const land=i<cw-1&&f[j*cw+i]<.5&&f[j*cw+i+1]<.5&&f[(j+1)*cw+i]<.5&&f[(j+1)*cw+i+1]<.5;
        if(land&&run<0)run=i;if((!land||i==cw-1)&&run>=0){const a=[X(run),0,Z(j)],b=[X(i),0,Z(j)],c=[X(i),0,Z(j+1)],d=[X(run),0,Z(j+1)];gTri(M,a,b,c,base,bc);gTri(M,a,c,d,base,bc);run=-1;}
        if(i<cw-1&&!land){const v=[f[j*cw+i],f[j*cw+i+1],f[(j+1)*cw+i+1],f[(j+1)*cw+i]],P=[[X(i),Z(j)],[X(i+1),Z(j)],[X(i+1),Z(j+1)],[X(i),Z(j+1)]],poly=[];if(v.every(q=>q>=.5))continue;
          for(let k=0;k<4;k++){const k2=(k+1)%4;if(v[k]<.5)poly.push(P[k]);if((v[k]<.5)!=(v[k2]<.5)){const t=(.5-v[k])/(v[k2]-v[k]);poly.push([P[k][0]+(P[k2][0]-P[k][0])*t,P[k][1]+(P[k2][1]-P[k][1])*t,1]);}}
          for(let k=1;k<poly.length-1;k++)gTri(M,[poly[0][0],0,poly[0][1]],[poly[k][0],0,poly[k][1]],[poly[k+1][0],0,poly[k+1][1]],base,bc);
          for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length];if(a[2]&&b[2]){const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;wallQuad(M,a,b,-.9,0,'dirt',bank,a[0]/2,[(b[1]-a[1])/l,0,-(b[0]-a[0])/l]);}}}}}
    // the edge strips the half-cell border leaves out
    for(const [a,b,c,d] of [[[x0,z0],[x1,z0],[x1,z0+1],[x0,z0+1]],[[x0,z1-1],[x1,z1-1],[x1,z1],[x0,z1]]])if(waterField(w,(a[0]+b[0])/2,a[1])<.5){gTri(M,[a[0],0,a[1]],[b[0],0,b[1]],[c[0],0,c[1]],base,bc);gTri(M,[a[0],0,a[1]],[c[0],0,c[1]],[d[0],0,d[1]],base,bc);}}
  {const F=500,ring=[[x0-F,z0-F,x1+F,z0],[x0-F,z1,x1+F,z1+F],[x0-F,z0,x0,z1],[x1,z0,x1+F,z1]];for(const [a,b,c,d] of ring){const wet=w.wf&&waterField(w,Math.max(x0+1,Math.min(x1-1,(a+c)/2)),Math.max(z0+1,Math.min(z1-1,(b+d)/2)))>.5;
      if(w.wf)Wm.quad([a,-.35,d],[c,-.35,d],[c,-.35,b],[a,-.35,b],'white');const y=wet?-.9:-.02;gTri(M,[a,y,b],[c,y,b],[c,y,d],paved?'concrete':'grass',bc);gTri(M,[a,y,b],[c,y,d],[a,y,d],paved?'concrete':'grass',bc);}}
  const AREA={park:['grass',null],grass:['grass',null],yard:['grass',null],cemetery:['grass',[.92,.96,.9]],wood:['grass2',[.8,.84,.74]],scrub:['grass2',null],sand:['sand',null],parking:['asphalt',[1.08,1.08,1.08]],plaza:['sidewalk',null],paved:['concrete',[.82,.81,.78]],pitch:['grass',[.86,1.08,.8]],deck:['planks',null]};
  w.areas.forEach((a,i)=>{const s=AREA[a.k];if(!s||(a.k=='yard'&&!paved))return;if(a.k=='paved'&&paved)return;gPoly(M,a.pp,.012+Math.min(i,40)*.0006+(a.k=='parking'||a.k=='pitch'||a.k=='plaza'||a.k=='deck'?.02:0),a.k=='pitch'&&/baseball|softball/.test(a.s||'')?'grass':s[0],s[1]);
    if(a.k=='parking'){// bays painted along the longest side
      const o=obbOf(a.pp);if(o&&o.hu>6&&o.hv>4){const Wt=[.86,.86,.84];for(let u=-o.hu+1.4;u<o.hu-1;u+=2.7)for(const sv of [-1,1]){const v0=sv*(o.hv-.4),v1=sv*(o.hv-5),P=(uu,vv)=>[o.cx+o.ux*uu-o.uz*vv,.05,o.cz+o.uz*uu+o.ux*vv];if(!inPolygon(a.pp,P(u,(v0+v1)/2)[0],P(u,(v0+v1)/2)[2]))continue;M.quad(P(u-.05,v0),P(u+.05,v0),P(u+.05,v1),P(u-.05,v1),'white',Wt);}}}});}

/* ---------- streets, paths, rails, bridges ---------- */
function worldRoads(M,lv,w){const cob=streetKind(lv)=='cobble',brickWalk=cob||['fan','jward','chill','shockoe'].includes(hood(lv)),walk=brickWalk?'bricksw':'sidewalk',Y=[.86,.66,.12],Wt=[.86,.86,.84];
  worldJunctions(w);const nodes=w.nodes,key=w.nodeKey;
  for(const r of w.roads){const hw=r.wm/2,p=r.pp;if(p.length<2)continue;
    if(r.k=='m'&&r.b){// an elevated highway: deck, edge walls and piers
      const y=6.6;ribbon(M,p,hw,y,'asphalt',null);for(const sd of [-1,1]){const e=offsetLine(p,sd*hw);for(let i=0;i<e.length-1;i++){const l=Math.hypot(e[i+1][0]-e[i][0],e[i+1][1]-e[i][1])||1,nr=[(e[i+1][1]-e[i][1])/l*sd,0,-(e[i+1][0]-e[i][0])/l*sd];wallQuad(M,e[i],e[i+1],y-1.1,y+.9,'concrete',[.8,.8,.78],0,nr);}}
      const L=lineLen(p);for(let s=6;s<L-4;s+=22){const q=lineAt(p,s);if(waterField(w,q.x,q.z)>.5&&!w.wf)continue;for(const o of [-hw*.6,hw*.6]){const px=q.x-q.dz*o,pz=q.z+q.dx*o;M.box(px-.6,-1,pz-.6,px+.6,y-1.1,pz+.6,'concrete',[.74,.74,.72],{bottom:1,top:1},true);}M.box(q.x-Math.abs(q.dz)*hw-.7,y-1.9,q.z-Math.abs(q.dx)*hw-.7,q.x+Math.abs(q.dz)*hw+.7,y-1.1,q.z+Math.abs(q.dx)*hw+.7,'concrete',[.74,.74,.72]);}continue;}
    if(r.car){const side=r.k!='a'&&r.k!='v'&&r.k!='m'&&!r.b,surf=r.c||cob&&r.k=='v'||hood(lv)=='shockoe'&&r.k=='r'&&r.wm<9.5?'cobble':'asphalt';if(side)ribbon(M,p,hw+2.5,.03,walk,null);ribbon(M,p,hw+.2,.048,'curb',[.86,.84,.8]);ribbon(M,p,hw,surf=='cobble'?.058:r.k=='a'||r.k=='v'?.062:.066,surf,r.k=='a'?[.92,.9,.88]:null,true);
      if(r.b){for(const sd of [-1,1]){const e=offsetLine(p,sd*(hw+.25));for(let i=0;i<e.length-1;i++){const l=Math.hypot(e[i+1][0]-e[i][0],e[i+1][1]-e[i][1])||1,nr=[(e[i+1][1]-e[i][1])/l*sd,0,-(e[i+1][0]-e[i][0])/l*sd];wallQuad(M,e[i],e[i+1],-.9,.07,'concrete',[.7,.7,.68],0,nr);wallQuad(M,e[i],e[i+1],.07,1.1,'concrete',[.82,.82,.8],0,nr);}}}
      // paint: clear of the crossings, with a zebra at each one
      if(surf=='asphalt'&&'pstr'.includes(r.k)&&r.wm>=7){const L=lineLen(p),cuts=[];let s=0;for(let i=0;i<p.length;i++){if(i)s+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);const n=nodes.get(key(p[i]));if(n&&n.n>1){let cw=0;for(const o of n.rs)if(o!==r)cw=Math.max(cw,o.wm);if(cw>4.5)cuts.push([s-cw/2-2.6,s+cw/2+2.6,cw>=7]);}}
        cuts.sort((a,b)=>a[0]-b[0]);let from=0;const spans=[];for(const c of cuts){if(c[0]>from+3)spans.push([from,c[0],c[2]]);from=Math.max(from,c[1]);}if(L>from+3)spans.push([from,L,false]);
        for(const [s0,s1,zeb] of spans){if(s1-s0<4)continue;const seg=lineCut(p,s0+(s0>0?1.9:0),s1-(s1<L?1.9:0));if(seg.length<2)continue;
          if(!r.o){ribbon(M,offsetLine(seg,-.11),.05,.08,'white',Y);ribbon(M,offsetLine(seg,.11),.05,.08,'white',Y);}
          if(r.wm>=12.5)for(const o of r.o?[-r.wm/6,r.wm/6]:[-r.wm/4,r.wm/4]){const ln=offsetLine(seg,o),ll=lineLen(ln);for(let d=1;d<ll-2;d+=6){const c2=lineCut(ln,d,d+2.4);if(c2.length>1)ribbon(M,c2,.05,.08,'white',Wt);}}
          for(const [at,on] of [[s0,s0>0],[s1,s1<L]]){if(!on)continue;const q=lineAt(p,at+(at==s0?.9:-.9));for(let o=-hw+.5;o<hw-.3;o+=.9){const cx=q.x-q.dz*o,cz=q.z+q.dx*o;ribbon(M,[[cx-q.dx*.85,cz-q.dz*.85],[cx+q.dx*.85,cz+q.dz*.85]],.2,.08,'white',Wt);}}}}
      continue;}
    // footpaths, steps and promenades
    const cell=r.k=='d'?walk:r.k=='x'?'steps':r.sw?walk:streetKind(lv)=='park'?'gravel':'sidewalk';ribbon(M,p,hw,r.b?.07:.036,cell,null,true);
    if(r.b)for(const sd of [-1,1]){const e=offsetLine(p,sd*(hw+.05));for(let i=0;i<e.length-1;i++){const l=Math.hypot(e[i+1][0]-e[i][0],e[i+1][1]-e[i][1])||1;wallQuad(M,e[i],e[i+1],.07,1.1,'bars',[.2,.2,.22],0,[(e[i+1][1]-e[i][1])/l*sd,0,-(e[i+1][0]-e[i][0])/l*sd]);wallQuad(M,e[i],e[i+1],-.5,.07,'planks',[.6,.55,.5],0,[(e[i+1][1]-e[i][1])/l*sd,0,-(e[i+1][0]-e[i][0])/l*sd]);}}}
  // railways: ballast, sleepers and two rails; on a viaduct where the real one is
  for(const r of w.rails){const p=r.pp,y=r.b?7.2:.07;if(p.length<2)continue;ribbon(M,p,1.7,y,'gravel',r.x?[.7,.72,.66]:null);if(!r.x||r.b)for(const o of [-.72,.72])ribbon(M,offsetLine(p,o),.05,y+.09,'chrome',[.55,.5,.46]);
    {const L=lineLen(p);for(let s=.4;s<L;s+=WLOW?1.3:.65){const q=lineAt(p,s);ribbon(M,[[q.x-q.dz*1.25,q.z+q.dx*1.25],[q.x+q.dz*1.25,q.z-q.dx*1.25]],.11,y+.03,'wood',[.36,.3,.26]);}}
    if(r.b){for(const sd of [-1,1]){const e=offsetLine(p,sd*1.9);for(let i=0;i<e.length-1;i++){const l=Math.hypot(e[i+1][0]-e[i][0],e[i+1][1]-e[i][1])||1;wallQuad(M,e[i],e[i+1],y-1.2,y+.05,'tin',[.32,.3,.3],0,[(e[i+1][1]-e[i][1])/l*sd,0,-(e[i+1][0]-e[i][0])/l*sd]);}}
      const L=lineLen(p);for(let s=4;s<L-2;s+=14){const q=lineAt(p,s);for(const o of [-1.5,1.5]){const px=q.x-q.dz*o,pz=q.z+q.dx*o;M.box(px-.28,-1,pz-.28,px+.28,y-1.2,pz+.28,'tin',[.3,.28,.28],{bottom:1,top:1});}}}}
  // fences, walls and hedges, where the real ones are
  for(const l of w.lines){const p=l.pp;for(let i=0;i<p.length-1;i++){const d=Math.hypot(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1])||1,n=[(p[i+1][1]-p[i][1])/d,0,-(p[i+1][0]-p[i][0])/d];
      if(l.k=='fence')wallQuad(M,p[i],p[i+1],0,l.h?l.h/10:1.3,'bars',[.16,.16,.18],0,n);else if(l.k=='hedge'){for(const o of [-.35,.35]){const e=offsetLine([p[i],p[i+1]],o);wallQuad(M,e[0],e[1],0,1.1,'leaves2',null,0,n);}ribbon(M,[p[i],p[i+1]],.35,1.1,'leaves2',null);}
      else{for(const o of [-.2,.2]){const e=offsetLine([p[i],p[i+1]],o);wallQuad(M,e[0],e[1],0,l.h?l.h/10:1.4,'stonewall',null,0,n);}ribbon(M,[p[i],p[i+1]],.24,(l.h?l.h/10:1.4)+.01,'granite',null);}}}}

/* ---------- buildings ---------- */
const RESID=['house','detached','residential','terrace','semidetached_house','bungalow','apartments','dormitory'];
function worldBuilding(M,lv,w,b){const p=b.pp,n=p.length,hd=hood(lv),h=hash(b.i*31+7,lv.d.ax*5+lv.d.ay,29),look=wallLook(h,lv),wc=look[0],wcol=look[1],low=wcol.map(v=>v*.7),trim=[[.93,.92,.88],[.86,.84,.78],[.2,.24,.22],[.9,.9,.9]][h%4],stone=[.86,.84,.8];
  if(b.t=='roof'){gPoly(M,p,b.hm,'tin',[.8,.8,.82]);for(let i=0;i<n;i+=Math.max(1,Math.floor(n/6)))M.tube([p[i][0],0,p[i][1]],[p[i][0],b.hm,p[i][1]],.09,.09,6,'chrome');return;}
  const small=b.ar<45;let shop=!small&&(['retail','commercial','supermarket'].includes(b.t)||/restaurant|cafe|bar|pub|bank|fast_food|pharmacy|clothes|books|convenience|bakery|hairdresser/.test(b.a||'')||(hd=='cary'||hd=='broad')&&b.ar>70&&b.ar<1500&&!RESID.includes(b.t));
  const hm=b.hm*(b.lv||b.h%10?1:.92+(h%17)/100),nf=Math.max(1,Math.round((hm-.6)/3.25)),fh=(hm-.4)/nf,resid=RESID.includes(b.t)||(!b.t&&['fan','chill','jward','town'].includes(hd)&&b.ar<420&&!shop);
  const o=obbOf(p),boxy=o&&b.ar/o.ar>.8&&Math.min(o.hu,o.hv)<9,pitched=!small&&boxy&&(b.rf=='gabled'||b.rf=='hipped'||resid&&(hd=='chill'||hd=='town'||b.t=='house'||b.t=='detached'||b.t=='bungalow'))&&b.rf!='flat',top=hm+(pitched?0:.45);
  const tower=nf>7||(b.t=='office'&&nf>4),ws=h%4,ww=ws==1?1.5:ws==2?.85:1.05,wh=Math.min(fh-1.3,ws==2?2:1.75),bay=ws==1?3.3:2.5+(h%3)*.3,lit=q=>hash(b.i,q,61)%6==0?'panelit':'pane';
  // the wall that faces the street gets the door and, on a shop, the shop front
  let front=-1,fd=1e9;for(let i=0;i<n;i++){const a=p[i],c=p[(i+1)%n],l=Math.hypot(c[0]-a[0],c[1]-a[1]);if(l<2.6)continue;const mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2,nx=(c[1]-a[1])/l,nz=-(c[0]-a[0])/l,rn=roadNear(w,mx+nx*2,mz+nz*2,45,q=>q.k!='m'),d=(rn?rn.d:70)-Math.min(l,10)*.5;if(d<fd&&!buildingAt(w,mx+nx*1.2,mz+nz*1.2)){fd=d;front=i;}}
  if(b.door){let bd=1e9;for(let i=0;i<n;i++){const d=segDist(b.door.x,b.door.z,p[i],p[(i+1)%n]);if(d<bd){bd=d;front=i;}}}
  // an untyped building fronting a main street is most likely a shop
  let frn=null;if(front>=0){const a=p[front],c=p[(front+1)%n],l=Math.hypot(c[0]-a[0],c[1]-a[1])||1;frn=roadNear(w,(a[0]+c[0])/2+(c[1]-a[1])/l*2,(a[1]+c[1])/2-(c[0]-a[0])/l*2,30,q=>q.car&&q.k!='m'&&q.k!='a'&&q.k!='v');
    if(!shop&&!small&&frn&&'pst'.includes(frn.r.k)&&frn.d<frn.r.wm/2+9&&!RESID.includes(b.t)&&b.ar>60&&b.ar<1800&&nf<=5&&hash(b.i,3,7)%4)shop=true;}
  let u0=0;for(let i=0;i<n;i++){const a=p[i],c=p[(i+1)%n],F=wallFrame(a,c),L=F.len;if(L<.15){u0+=L/2;continue;}const nr=[F.nx,0,F.nz],mid=F.P(L/2,0,.6),nbr=buildingAt(w,mid[0],mid[2]),party=nbr&&nbr!==b&&!nbr.gone;
    if(party&&nbr.hm>=hm-.5){u0+=L/2;continue;}const yb=party?Math.min(top,nbr.hm):0;
    if(yb<1.1){wallQuad(M,a,c,0,1.1,wc,wcol,u0,nr,low);wallQuad(M,a,c,1.1,top,wc,wcol,u0,nr);}else wallQuad(M,a,c,yb,top,wc,wcol,u0,nr);u0+=L/2;
    if(party||small){if(!party&&L>2&&i==front)fQuad(M,F,L/2-.5,L/2+.5,0,2.1,.03,'door',[.5,.45,.4]);continue;}
    const rn=roadNear(w,mid[0]+F.nx*2,mid[2]+F.nz*2,26,q=>q.k!='m'&&q.k!='f'&&q.k!='x'),street=!!rn||i==front,nb=Math.max(1,Math.floor((L-.5)/bay)),m0=(L-nb*bay)/2;
    // base course and cornice
    fLedge(M,F,0,L,0,.35,.05,'granite',[.72,.7,.68]);if(!pitched){fBox(M,F,-.05,L+.05,hm-.25,hm+.05,0,.28,'white',stone);if(street&&!tower&&hd!='works')fQuad(M,F,0,L,hm-.62,hm-.25,.1,'white',stone.map(v=>v*.92));}
    for(let f=0;f<nf;f++){const y0=.4+f*fh;if(f>0&&street&&!tower&&f<5)fQuad(M,F,0,L,y0-.1,y0+.02,.03,'granite',stone);
      if(tower&&(f>0||!shop)){// a tall modern block: one band of glass a floor, with a pier between the bays only on the street side
        const wy=y0+fh*.28,wt=y0+fh*.86;fQuad(M,F,.5,L-.5,wy,wt,.03,(hash(b.i,f,i)%5==0)?'panelit':'pane');if(street&&f<12)for(let q=1;q<nb;q++)fQuad(M,F,m0+q*bay-.09,m0+q*bay+.09,wy,wt,.05,'white',trim);if(f==0&&i==front){const uc=L/2;fQuad(M,F,uc-1.3,uc+1.3,0,2.6,.05,'white',[.14,.14,.16]);fQuad(M,F,uc-1.15,uc+1.15,0,2.45,.07,'door',[.3,.32,.36]);if(b.door)fBox(M,F,uc-1.8,uc+1.8,2.75,2.9,0,1.4,'white',trim);}continue;}
      for(let q=0;q<nb;q++){const uc=m0+(q+.5)*bay,isDoor=f==0&&i==front&&q==Math.floor(nb/2);
        if(isDoor){const dw=shop?1.1:.95,dh=2.25;fQuad(M,F,uc-dw/2-.1,uc+dw/2+.1,0,dh+.12,.03,'white',trim);fQuad(M,F,uc-dw/2,uc+dw/2,0,dh,.05,'door',[[.5,.45,.4],[.35,.2,.18],[.25,.32,.4],[.2,.28,.22]][h%4]);fQuad(M,F,uc-dw/2,uc+dw/2,dh+.15,dh+.5,.04,'pane');
          fBox(M,F,uc-dw/2-.25,uc+dw/2+.25,0,.16,0,.75,'granite',stone,true);fBox(M,F,uc-dw/2-.1,uc+dw/2+.1,.16,.3,0,.4,'granite',stone,true);if(b.door){fBox(M,F,uc-.9,uc+.9,dh+.6,dh+.72,0,.7,'white',trim);M.sphere(F.P(uc,dh+.5,.3)[0],dh+.5,F.P(uc,dh+.5,.3)[2],.09,6,3,'lampglow');}continue;}
        if(f==0&&shop&&street){// a shop front: glass over a low bulkhead, a sign above, and often an awning
          fQuad(M,F,uc-bay/2+.12,uc+bay/2-.12,.5,2.7,.03,'white',[.14,.14,.16]);fQuad(M,F,uc-bay/2+.2,uc+bay/2-.2,.58,2.62,.045,'pane');fQuad(M,F,uc-.03,uc+.03,.58,2.62,.055,'white',[.14,.14,.16]);
          if(q==Math.floor(nb/2)-1||nb==1){fQuad(M,F,uc-bay/2+.05,uc+bay/2-.05,2.85,3.25,.06,'white',[.2,.2,.22]);textQuad(M,F.P(uc-bay/2+.1,2.89,.07),F.P(uc+bay/2-.1,2.89,.07),F.P(uc+bay/2-.1,3.21,.07),F.P(uc-bay/2+.1,3.21,.07),SHOPSIGNS[hash(b.i,i,lv.d.ax*5+lv.d.ay)%SHOPSIGNS.length]);}
          if(h%3==0){const aw=h%2?'awning':'awning2';M.quad(F.P(uc-bay/2+.1,2.75,0),F.P(uc+bay/2-.1,2.75,0),F.P(uc+bay/2-.1,2.35,1),F.P(uc-bay/2+.1,2.35,1),aw);}continue;}
        const wy=y0+(fh-wh)*.45,w0=uc-ww/2,w1=uc+ww/2;
        if(!street){if((q+f)%2==0&&!WLOW){fQuad(M,F,w0-.06,w1+.06,wy-.06,wy+wh+.06,.02,'white',trim);fQuad(M,F,w0,w1,wy,wy+wh,.035,'pane');}continue;}
        fQuad(M,F,w0-.08,w1+.08,wy-.04,wy+wh+.08,.03,'white',trim);fQuad(M,F,w0,w1,wy,wy+wh,.045,lit(q*7+f));if(f<4&&!WLOW){fQuad(M,F,w0,w1,wy+wh/2-.025,wy+wh/2+.025,.055,'white',trim);
        if(ws!=1)fQuad(M,F,uc-.02,uc+.02,wy,wy+wh,.055,'white',trim);
        fLedge(M,F,w0-.14,w1+.14,wy-.13,wy-.04,.11,'granite',stone);if(f<2)fQuad(M,F,w0-.1,w1+.1,wy+wh+.08,wy+wh+.24,.03,'granite',stone);}
        if(ws==3&&hd!='works'&&f<3&&!WLOW)for(const [s0,s1] of [[w0-.08-ww*.46,w0-.08],[w1+.08,w1+.08+ww*.46]])fQuad(M,F,s0,s1,wy,wy+wh,.04,'planks',[.17,.26,.19]);}}
    if(nf>=3&&!resid&&street&&hash(b.i,i,43)%5==0&&L>5){for(let f=1;f<nf;f++){const py=.4+f*fh+.6;fBox(M,F,m0+.2,m0+2.2,py,py+.05,0,.8,'grille',[.07,.07,.08]);fQuad(M,F,m0+.2,m0+2.2,py+.05,py+.95,.8,'bars',[.07,.07,.08]);if(f<nf-1)M.quad(F.P(m0+.4,py+.05,.2),F.P(m0+.4,py+.05,.65),F.P(m0+2,py+fh+.05,.65),F.P(m0+2,py+fh+.05,.2),'grille',[.07,.07,.08]);}}}
  // a front porch, the way Richmond's row houses have them: a low deck, slim columns and a flat roof over the door
  if(resid&&!shop&&!small&&!tower&&nf<=3&&front>=0&&frn&&frn.d>frn.r.wm/2+3.4&&hash(b.i,11,5)%5&&!(WLOW&&hash(b.i,1,2)%2)){const F=wallFrame(p[front],p[(front+1)%n]),L=F.len;if(L>=4.2){const pw=Math.min(L-.3,L>7?L*.62:5.2),u0=L/2-pw/2,u1=L/2+pw/2,dp=Math.min(2,frn.d-frn.r.wm/2-2.7),o=F.P(L/2,0,dp+.3);
      if(dp>=1.2&&!buildingAt(w,o[0],o[2])){const wood=[.93,.92,.88],ph=Math.min(2.85,fh+.15),cn=pw>4.4?4:3;fBox(M,F,u0,u1,0,.2,0,dp,'planks',[.62,.6,.56],true);fLedge(M,F,L/2-.8,L/2+.8,0,.1,dp+.32,'granite',stone);
        fBox(M,F,u0-.12,u1+.12,ph,ph+.2,0,dp+.15,'white',wood);M.quad(F.P(u0-.12,ph+.2,dp+.15),F.P(u1+.12,ph+.2,dp+.15),F.P(u1+.12,ph+.5,0),F.P(u0-.12,ph+.5,0),'tin',[.5,.5,.54]);
        for(let k=0;k<cn;k++){const u=u0+.12+(pw-.24)*k/(cn-1),a2=F.P(u,.2,dp-.12);M.tube([a2[0],.2,a2[2]],[a2[0],ph,a2[2]],.075,.06,6,'white',wood);}
        if(hash(b.i,2,9)%2)for(const [ua,ub] of [[u0+.12,L/2-.85],[L/2+.85,u1-.12]])if(ub-ua>.5){M.quad(F.P(ua,.2,dp-.12),F.P(ub,.2,dp-.12),F.P(ub,1,dp-.12),F.P(ua,1,dp-.12),'bars',wood);M.quad(F.P(ub,.2,dp-.13),F.P(ua,.2,dp-.13),F.P(ua,1,dp-.13),F.P(ub,1,dp-.13),'bars',wood);}}}}
  // a chimney on the smaller houses
  if(resid&&!small&&!tower&&b.ar<320&&o&&hash(b.i,5,3)%3!=0){const lu=o.hu>=o.hv,ax=lu?[o.ux,o.uz]:[-o.uz,o.ux],sx=[-ax[1],ax[0]],hl=lu?o.hu:o.hv,hs=lu?o.hv:o.hu,sd=hash(b.i,6,1)%2?1:-1,cx=o.cx+ax[0]*hl*.5*sd+sx[0]*(hs-.55),cz=o.cz+ax[1]*hl*.5*sd+sx[1]*(hs-.55);
    if(inPolygon(p,cx,cz)){const top=hm+(pitched?hs*.62*.2+1.5:1.5);M.box(cx-.32,hm-.2,cz-.32,cx+.32,top,cz+.32,'brick',[.8,.72,.68],{bottom:1});M.box(cx-.38,top,cz-.38,cx+.38,top+.1,cz+.38,'granite');}}
  if(b.mural){const F=wallFrame(p[b.mural.i],p[(b.mural.i+1)%n]),u=F.len/2;fQuad(M,F,u-2.2,u+2.2,.5,3.3,.03,'white',[.9,.88,.82]);fQuad(M,F,u-2.1,u+2.1,.6,3.2,.045,'mural');}
  // the roof
  if(pitched){const lu=o.hu>=o.hv,hl=(lu?o.hu:o.hv)+.3,hs=(lu?o.hv:o.hu)+.35,ax=lu?[o.ux,o.uz]:[-o.uz,o.ux],sx=[-ax[1],ax[0]],rise=hs*.62,C=(u,v,y)=>[o.cx+ax[0]*u+sx[0]*v,y,o.cz+ax[1]*u+sx[1]*v],rc=[[.5,.5,.54],[.62,.42,.38],[.44,.5,.46],[.7,.72,.76]][h%4],cell=hd=='chill'||h%3==0?'tin':'roof',s=M.swayV;
    for(const sv of [-1,1]){const A=C(-hl,sv*hs,hm-.12),B=C(hl,sv*hs,hm-.12),Cc=C(hl,0,hm+rise),D=C(-hl,0,hm+rise),nr=nrm3([sx[0]*sv*rise,hs,sx[1]*sv*rise]),sl=Math.hypot(hs,rise)/2;M.swayV=tileOf(cell);
      M.tri(A,B,Cc,[0,sl],[hl,sl],[hl,0],rc,rc,rc,nr,nr,nr);M.tri(A,Cc,D,[0,sl],[hl,0],[0,0],rc,rc,rc,nr,nr,nr);M.swayV=s;}
    for(const su of [-1,1]){const A=C(su*(hl-.3),-hs+.35,hm),B=C(su*(hl-.3),hs-.35,hm),T=C(su*(hl-.3),0,hm+rise*(1-.35/hs)),nr=[ax[0]*su,0,ax[1]*su];M.swayV=tileOf(wc);M.tri(A,B,T,[0,-hm/2],[hs,-hm/2],[hs/2,-(hm+rise)/2],wcol,wcol,wcol,nr,nr,nr);M.swayV=s;}
    if(h%3==1){const q=C(hl*.4,hs*.25,0);M.box(q[0]-.3,hm,q[2]-.3,q[0]+.3,hm+rise+.9,q[2]+.3,'brick');M.box(q[0]-.36,hm+rise+.9,q[2]-.36,q[0]+.36,hm+rise+1,q[2]+.36,'granite');}}
  else{gPoly(M,p,hm,'roof',[[.62,.62,.64],[.8,.8,.78],[.5,.5,.52]][h%3]);
    // what collects on a flat roof, scaled to its size
    if(b.ar>120){const c=b.c,rh=hash(b.i,5,9);if(inPolygon(p,c[0],c[1])){if(rh%3==0){M.box(c[0]-.7,hm,c[1]-.5,c[0]+.7,hm+.8,c[1]+.5,'tin',[.75,.76,.78]);}else if(rh%3==1){M.box(c[0]-.9,hm,c[1]-1,c[0]+.9,hm+2.2,c[1]+1,wc,wcol);M.box(c[0]-1,hm+2.2,c[1]-1.1,c[0]+1,hm+2.3,c[1]+1.1,'granite');}
        if(b.ar>500&&rh%5==2&&hd!='civic'){const tx=c[0]+3,tz=c[1]+2;if(inPolygon(p,tx,tz)){for(const [a2,b2] of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]])M.tube([tx+a2,hm,tz+b2],[tx+a2*.8,hm+2,tz+b2*.8],.05,.05,4,'black');M.lathe(tx,hm+2,tz,[[0,.95],[2,.9],[2,.98],[2.08,.98],[2.6,0]],12,'wood',[.5,.4,.32]);}}}}}}

/* ---------- landmarks, set on the real buildings ---------- */
function worldLandmark(M,lv,w,lm){const L=lm.L,T=new Mesh(),w0=L.w*TS,d0=L.h*TS;try{landmark(T,lv,{art:L.art,x:0,y:0,w:L.w,h:L.h});}catch(e){return;}
  const o=lm.obb,f=lm.face,along=Math.abs(f[0]*o.ux+f[1]*o.uz)>.5,hd=along?o.hu:o.hv,hw=along?o.hv:o.hu,sx=2*hw/w0,sz=2*hd/d0,sy=Math.max(.8,Math.min(1.9,Math.min(sx,sz)*1.05));lm.scale=[sx,sy,sz];
  for(let i=0;i<T.pos.length;i+=3){const lx=(T.pos[i]-w0/2)*sx,lz=(T.pos[i+2]-d0/2)*sz;T.pos[i]=o.cx+lx*f[1]+lz*f[0];T.pos[i+1]*=sy;T.pos[i+2]=o.cz-lx*f[0]+lz*f[1];const nx=T.nrm[i],nz=T.nrm[i+2];T.nrm[i]=nx*f[1]+nz*f[0];T.nrm[i+2]=-nx*f[0]+nz*f[1];}
  // plain stone, brick and metal keep their true grain however the likeness was stretched
  for(let t=0;t<T.count;t+=3){const layer=Math.floor(T.uv[t*2]+1e-4);if(!LM_TILE[layer]||T.sw[t]!=0)continue;const n=[T.nrm[t*3],T.nrm[t*3+1],T.nrm[t*3+2]],ax=Math.abs(n[1])>.7?1:Math.abs(n[0])>Math.abs(n[2])?0:2;
    for(let k=0;k<3;k++){const i=t+k,x=T.pos[i*3],y=T.pos[i*3+1],z=T.pos[i*3+2];T.uv[i*2]=(ax==1?x:ax==0?z:x)/2;T.uv[i*2+1]=(ax==1?z:-y)/2;T.sw[i]=-(layer+1);}}
  M.add(T);}
// how wooded each green district is (trees per hundred 7 m plots), and whether it is a burying ground
const WGREEN={'ow:2,1':[7],'ow:1,2':[30,1],'ow:2,2':[46],'ow:0,3':[52],'ow:3,3':[40],'ow:0,-1':[34],'ow:-1,2':[48],'ow:1,3':[22],'ow:0,2':[14],'ow:1,-1':[16]};
const LM_TILE={};for(const c of ['marble','stone','granite','brick','steps','concrete','roof','copper','plaster','white','tin','stonewall','sidewalk','cobble','floor','planks','wood','black','gold','chrome','clap','clap2','worn','qwall'])LM_TILE[CELL[c]]=1;

/* ---------- trees, lamps, signals and street furniture ---------- */
function worldProps(lv){const w=lv.world,out=[];worldJunctions(w);const seed=lv.d.ax*97+lv.d.ay*31,trees=[],free=(x,z,r)=>!buildingAt(w,x,z)&&!(w.wf&&waterField(w,x,z)>.45)&&!trees.some(t=>Math.abs(t[0]-x)<r&&Math.abs(t[1]-z)<r);
  const onRoad=(x,z,pad)=>{const rn=roadNear(w,x,z,16,q=>q.car);return rn&&rn.d<rn.r.wm/2+(pad||0);};
  for(const q of w.pts)if(q.k=='tree'&&trees.length<(WLOW?90:200)&&free(q.xm,q.zm,1.2)&&!onRoad(q.xm,q.zm,.2))trees.push([q.xm,q.zm,hash(q.x,q.z,seed)]);
  // street trees and woods where nobody has mapped each tree
  const mapped=trees.length;for(const r of w.roads){if(!'str'.includes(r.k)||r.b||trees.length>(WLOW?105:215))continue;const L=lineLen(r.pp);for(const sd of [-1,1]){const e=offsetLine(r.pp,sd*(r.wm/2+1.5));for(let s=6+hash(r.w,r.p[0],3)%7;s<L-5;s+=13){const q=lineAt(e,s),hh=hash(Math.round(q.x*3),Math.round(q.z*3),seed+2);if(hh%3==0||mapped>60&&hh%2)continue;
        if(q.x<-w.mx+2||q.z<-w.mz+2||q.x>w.w+w.mx-2||q.z>w.h+w.mz-2||!free(q.x,q.z,3.5)||onRoad(q.x,q.z,.6)||w.junctions.some(j=>Math.hypot(j.x-q.x,j.z-q.z)<j.w/2+5))continue;trees.push([q.x,q.z,hh,1]);}}}
  for(const a of w.areas){const dens=a.k=='wood'?46:a.k=='park'||a.k=='cemetery'?260:a.k=='scrub'?120:0;if(!dens)continue;const n=Math.min(90,Math.floor(Math.abs(polyArea(a.pp))/dens));let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of a.pp){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);}
    for(let k=0,tries=0;k<n&&tries<n*6&&trees.length<(WLOW?125:250);tries++){const hh=hash(tries,Math.round(x0),seed+Math.round(z0)),x=x0+(hh%1000)/1000*(x1-x0),z=z0+((hh>>10)%1000)/1000*(z1-z0);if(!inPolygon(a.pp,x,z)||!free(x,z,a.k=='wood'?2.6:5)||roadNear(w,x,z,5))continue;trees.push([x,z,hh]);k++;}}
  // parks, the cemetery and the river banks are wooded even where nobody has drawn the woods on the map
  {const G=WGREEN[w.id];if(G){const cap=WLOW?150:330,R=lv.d.rows,cand=[];w.graves=[];for(let cz=4;cz<w.h-4;cz+=7)for(let cx=4;cx<w.w-4;cx+=7){const hh=hash(cx,cz,seed+41),x=cx+(hh%600)/100,z=cz+((hh>>10)%600)/100,c=R[Math.floor(z/2)]&&R[Math.floor(z/2)][Math.floor(x/2)];if(c!='.')continue;
        const rn=roadNear(w,x,z,7);if(rn&&rn.d<rn.r.wm/2+2.2)continue;if((hh>>20)%100<G[0]&&free(x,z,3)){cand.push([x,z,hh]);continue;}
        if(G[1])for(let k=0;k<3;k++){const gx=cx+1+k*2.1,gz=cz+((hh>>5)%3)*1.6+1;if((hash(cx+k,cz,seed+77)%10)<7&&R[Math.floor(gz/2)][Math.floor(gx/2)]=='.'&&!roadNear(w,gx,gz,3))w.graves.push([gx,gz,hash(cx,k,cz)]);}}
      cand.sort((a,b)=>(a[2]&65535)-(b[2]&65535));for(const t of cand){if(trees.length>=cap)break;trees.push(t);}if(G[1]){const keep=(WLOW?260:520)/Math.max(1,w.graves.length);w.graves=w.graves.filter(g=>((g[2]>>>4)%1000)/1000<keep);}if(G[1])w.graves=w.graves.filter(g=>!trees.some(t=>Math.abs(t[0]-g[0])<1.2&&Math.abs(t[1]-g[1])<1.2));}}
  w.trees=trees;w.solid=trees.filter(t=>t[0]>0&&t[1]>0&&t[0]<w.w&&t[1]<w.h).map(t=>[t[0],t[1],.32]);
  for(const q of w.pts){if(q.xm<1||q.zm<1||q.xm>w.w-1||q.zm>w.h-1)continue;const kind={hydrant:'hydrant',bin:'can',post:'mailbox'}[q.k];if(kind&&!onRoad(q.xm,q.zm,0))out.push({kind,tx:Math.floor(q.xm/2),ty:Math.floor(q.zm/2),x:q.xm,z:q.zm,yaw:0});}
  // parked cars along the curb of the ordinary streets, clear of the corners
  let cars=0;for(const r of w.roads){if(!'str'.includes(r.k)||r.b||r.wm<(r.o?7:9)||cars>(WLOW?22:46))continue;const L=lineLen(r.pp);for(const sd of [-1,1]){const e=offsetLine(r.pp,sd*(r.wm/2-1.15));for(let s=9;s<L-9;s+=6.2){const q=lineAt(e,s),hh=hash(Math.round(q.x),Math.round(q.z),seed+9);if(hh%5<2||q.x<3||q.z<3||q.x>w.w-3||q.z>w.h-3)continue;
        if(w.junctions.some(j=>Math.hypot(j.x-q.x,j.z-q.z)<j.w/2+7.5)||buildingAt(w,q.x,q.z))continue;const yaw=Math.atan2(-q.dz,q.dx)+(sd>0?0:Math.PI),c=Math.abs(Math.cos(yaw)),sn=Math.abs(Math.sin(yaw));
        out.push({kind:'car',tx:Math.floor(q.x/2),ty:Math.floor(q.z/2),x:q.x,z:q.z,yaw,rd:r,solid:[c*2.2+sn*.9,sn*2.2+c*.9],col:['#7a1818','#1c2a4a','#c4c6ca','#1e1e20','#e8e6e0','#4a4c52','#2e3e30','#8a8c90','#3a2a20'][hh%9]});cars++;}}}
  // street lamps: the mapped ones, and one every so often along the streets
  const lamps=[];for(const q of w.pts)if(q.k=='lamp'&&q.xm>2&&q.zm>2&&q.xm<w.w-2&&q.zm<w.h-2)lamps.push([q.xm,q.zm]);
  for(const r of w.roads){if(!'pstr'.includes(r.k)||r.b)continue;const L=lineLen(r.pp);for(let s=12+hash(r.p[0],r.p[1],5)%9,i=0;s<L-6;s+=31,i++){const q=lineAt(offsetLine(r.pp,(i%2?1:-1)*(r.wm/2+.9)),s);if(q.x<3||q.z<3||q.x>w.w-3||q.z>w.h-3||buildingAt(w,q.x,q.z)||lamps.some(l=>Math.hypot(l[0]-q.x,l[1]-q.z)<16)||lamps.length>44)continue;lamps.push([q.x,q.z]);}}
  w.lampsDeco=lamps.filter(([x,z])=>!lv.lamps.some(l=>Math.hypot(l.tx*2+1-x,l.ty*2+1-z)<12));return out;}
function worldFurniture(M,lv,w){// trees and parked cars are not built into the ground: a few shapes are drawn again and again, only where you can see them (worldDraw)
  for(const [x,z,h] of w.graves||[]){const k=h%4,g=[[.74,.74,.72],[.6,.6,.6],[.8,.78,.72],[.5,.52,.5]][k];if(k==3){M.box(x-.22,0,z-.22,x+.22,.5,z+.22,'granite',g);M.lathe(x,.5,z,[[0,.14],[1.5,.08],[1.7,0]],4,'granite',g);}else{M.box(x-.32,0,z-.09,x+.32,.75+k*.15,z+.09,k==1?'granite':'marble',g);if(k==2)M.box(x-.38,0,z-.14,x+.38,.12,z+.14,'granite',g);}}
  lv.sigHeads=[];const dk=[.12,.13,.14],gas=['chill','shockoe','fan','jward','civic'].includes(hood(lv));
  const gasLamp=(cx,cz,tx,ty)=>{M.lathe(cx,0,cz,[[0,.2],[.25,.18],[.35,.1],[.6,.07],[2.5,.06],[2.6,.1]],6,'black');M.box(cx-.22,2.6,cz-.22,cx+.22,2.68,cz+.22,'black');M.lathe(cx,2.68,cz,[[0,.16],[.4,.24],[.55,.26]],4,'glass',null,1,1);M.lathe(cx,3.23,cz,[[0,.3],[.12,.28],[.32,.06],[.42,0]],4,'black');M.sphere(cx,3.68,cz,.05,4,2,'black');lv.glows.push([cx,2.95,cz,tx,ty]);};
  for(const l of lv.lamps)gasLamp(l.tx*2+1,l.ty*2+1,l.tx,l.ty);
  for(const [x,z] of w.lampsDeco||[]){if(gas){gasLamp(x,z,-1,-1);continue;}const rn=roadNear(w,x,z,12,o=>o.car),dl=rn?Math.hypot(rn.b[0]-rn.a[0],rn.b[1]-rn.a[1])||1:1;let ax=rn?-(rn.b[1]-rn.a[1])/dl:1,az=rn?(rn.b[0]-rn.a[0])/dl:0;if(rn&&segDist(x+ax,z+az,rn.a,rn.b)>segDist(x,z,rn.a,rn.b)){ax=-ax;az=-az;}
    M.lathe(x,0,z,[[0,.14],[.3,.09],[7.6,.06]],6,'white',dk);M.tube([x,7.5,z],[x+ax*2,7.9,z+az*2],.05,.04,5,'white',dk);M.box(x+ax*1.7-.18,7.78,z+az*1.7-.18,x+ax*2.3+.18,7.9,z+az*2.3+.18,'white',dk);M.box(x+ax*1.8-.1,7.74,z+az*1.8-.1,x+ax*2.2+.1,7.78,z+az*2.2+.1,'lampglow');lv.glows.push([x+ax*2,7.6,z+az*2,-1,-1]);}
  for(const q of w.pts){const x=q.xm,z=q.zm;if(x<-20||z<-20||x>w.w+20||z>w.h+20)continue;
    if(q.k=='signal'){// a mast on the corner with its arm out over the street it controls
      const rn=roadNear(w,x,z,8,o=>o.car);if(!rn)continue;const dl=Math.hypot(rn.b[0]-rn.a[0],rn.b[1]-rn.a[1])||1,dx=(rn.b[0]-rn.a[0])/dl,dz=(rn.b[1]-rn.a[1])/dl,hw=rn.r.wm/2,cx=x-dz*(hw+.7),cz=z+dx*(hw+.7),len=Math.min(hw*1.5,5.5);
      M.lathe(cx,0,cz,[[0,.13],[.25,.1],[5.6,.07]],8,'white',dk);M.tube([cx,5.3,cz],[cx+dz*len,5.5,cz-dx*len],.06,.045,6,'white',dk);for(const f of [.6,1]){const hx=cx+dz*len*f,hz=cz-dx*len*f;M.box(hx-.16,4.45,hz-.16,hx+.16,5.4,hz+.16,'white',[.85,.7,.12]);lv.sigHeads.push({x:hx,z:hz,ax:Math.abs(dx)>Math.abs(dz)?'x':'z',dx,dz});}}
    else if(q.k=='bench'){M.box(x-.75,.38,z-.22,x+.75,.46,z+.22,'wood',[.5,.36,.24]);M.box(x-.75,.46,z-.22,x+.75,.86,z-.16,'wood',[.5,.36,.24]);for(const o of [-.6,.6])M.box(x+o-.04,0,z-.2,x+o+.04,.38,z+.2,'black');}
    else if(q.k=='statue'){M.box(x-.7,0,z-.7,x+.7,1.5,z+.7,'granite');statue(M,x,1.5,z);}
    else if(q.k=='flag'){M.tube([x,0,z],[x,8,z],.06,.035,6,'chrome');M.sphere(x,8.05,z,.08,6,3,'gold');M.quad([x,6.6,z],[x+1.5,6.6,z],[x+1.5,7.6,z],[x,7.6,z],'white',[[.72,.12,.14],[.14,.2,.5],[.9,.9,.9]][hash(q.x,q.z,3)%3]);}
    else if(q.k=='fountain'){M.cone(x,0,z,1.6,.55,1.6,12,'granite');M.lathe(x,.5,z,[[0,.3],[.9,.22],[1,.7],[1.1,.7],[1.2,.2]],10,'granite');}
    else if(q.k=='bus'){M.box(x-1.4,2.2,z-.7,x+1.4,2.3,z+.7,'tin',[.3,.32,.36]);for(const [a,b] of [[-1.3,-.6],[1.3,-.6],[-1.3,.6],[1.3,.6]])M.tube([x+a,0,z+b],[x+a,2.2,z+b],.04,.04,5,'chrome');M.box(x-1.2,.4,z-.5,x+1.2,.46,z-.2,'wood',[.5,.36,.24]);}
    else if(q.k=='bollard'){M.lathe(x,0,z,[[0,.1],[.85,.09],[.9,.06]],6,'white',dk);}
    else if(q.k=='stop'){M.tube([x,0,z],[x,2.3,z],.03,.03,5,'chrome');M.lathe(x,2.3,z,[[0,.01],[0,.34],[.02,.34],[.02,.01]],8,'white',[.75,.1,.1]);}
    else if(q.k=='pole'){M.lathe(x,0,z,[[0,.15],[1,.13],[8.4,.09]],8,'wood',[.34,.27,.2]);M.box(x-.9,7.7,z-.06,x+.9,7.82,z+.06,'wood',[.34,.27,.2]);}}
  // a stop sign faces each side street where it meets another and there is no signal
  {const sig=w.pts.filter(q=>q.k=='signal'),octa=(c,nx,nz,r,col,off)=>{const P=k=>{const a=(k+.5)/8*6.2832;return[c[0]-nz*Math.cos(a)*r+nx*off,c[1]+Math.sin(a)*r,c[2]+nx*Math.cos(a)*r+nz*off];};for(let k=0;k<8;k++)M.tri([c[0]+nx*off,c[1],c[2]+nz*off],P(k),P(k+1),[0,0],[0,0],[0,0],col,col,col,[nx,0,nz],[nx,0,nz],[nx,0,nz]);};let n=0;
    for(const j of w.junctions){if(n>=(WLOW?14:34)||j.x<4||j.z<4||j.x>w.w-4||j.z>w.h-4||sig.some(q=>Math.hypot(q.xm-j.x,q.zm-j.z)<16))continue;const rs=[...new Set(j.rs)].filter(r=>'pstr'.includes(r.k));if(rs.length<2)continue;const wide=Math.max(...rs.map(r=>r.wm));
      for(const r of rs){if(r.wm>=wide&&rs.some(o=>o.wm<wide)||r.k=='p'||r.k=='s')continue;const pp=r.pp;for(let i=0;i<pp.length;i++){if(Math.hypot(pp[i][0]-j.x,pp[i][1]-j.z)>.2)continue;for(const k of [i-1,i+1]){if(k<0||k>=pp.length||(r.o&&k>i))continue;const l=Math.hypot(pp[k][0]-j.x,pp[k][1]-j.z);if(l<8)continue;
            const dx=(pp[k][0]-j.x)/l,dz=(pp[k][1]-j.z)/l,tx=-dx,tz=-dz,back=wide/2+2.2,x=j.x+dx*back-tz*(r.wm/2+.9),z=j.z+dz*back+tx*(r.wm/2+.9);if(buildingAt(w,x,z)||x<2||z<2||x>w.w-2||z>w.h-2)continue;
            M.tube([x,0,z],[x,2.55,z],.028,.028,5,'chrome');octa([x,2.25,z],dx,dz,.38,[.9,.9,.9],.03);octa([x,2.25,z],dx,dz,.33,[.78,.08,.08],.04);octa([x,2.25,z],-dx,-dz,.38,[.5,.5,.52],.03);n++;}}}}}
  // wooden utility poles and their wires along the back streets
  if(!['civic','broad'].includes(hood(lv))){let n=0;const pc=[.34,.27,.2];for(const r of w.roads){if(r.k!='r'||r.b||n>(WLOW?16:40))continue;const e=offsetLine(r.pp,-(r.wm/2+1.9)),L=lineLen(e);if(L<60||hash(r.p[0],r.p[1],23)%3==0)continue;let prev=null;
      for(let s=7;s<L-4;s+=36){const q=lineAt(e,s);if(q.x<-10||q.z<-10||q.x>w.w+10||q.z>w.h+10||buildingAt(w,q.x,q.z)||waterField(w,q.x,q.z)>.4||w.junctions.some(j=>Math.hypot(j.x-q.x,j.z-q.z)<j.w/2+3)){prev=null;continue;}
        M.lathe(q.x,0,q.z,[[0,.15],[1,.13],[8.6,.09]],6,'wood',pc);const ax=-q.dz*.95,az=q.dx*.95;M.tube([q.x-ax,7.9,q.z-az],[q.x+ax,7.9,q.z+az],.05,.05,4,'wood',pc);M.box(q.x-.16,6.3,q.z-.16,q.x+.16,6.9,q.z+.16,'tin',[.5,.52,.54]);
        if(prev)for(const o of [-.85,0,.85]){const a=[prev.x-prev.dz*o,8,prev.z+prev.dx*o],b2=[q.x-q.dz*o,8,q.z+q.dx*o],mid=[(a[0]+b2[0])/2,7.45,(a[2]+b2[2])/2];M.tube(a,mid,.014,.014,3,'black');M.tube(mid,b2,.014,.014,3,'black');}prev=q;n++;}}}
  // plaques you can read, each on a short post
  for(const k in lv.markers){const [tx,ty]=k.split(',').map(Number),cx=tx*2+1,cz=ty*2+1;M.box(cx-.05,0,cz-.05,cx+.05,1,cz+.05,'black');M.quad([cx-.4,.95,cz+.12],[cx+.4,.95,cz+.12],[cx+.4,1.35,cz-.12],[cx-.4,1.35,cz-.12],'gold',[.7,.6,.4]);M.quad([cx+.4,.95,cz+.1],[cx-.4,.95,cz+.1],[cx-.4,1.35,cz-.14],[cx+.4,1.35,cz-.14],'black');}}

function buildWorldMesh(lv){const w=lv.world,M=new Mesh(),Wm=new Mesh(),Fm=new Mesh(),Fr=new Mesh();
  worldGround(M,Wm,lv,w);worldRoads(M,lv,w);
  for(const b of w.bld){if(b.gone||b.lm)continue;worldBuilding(M,lv,w,b);}
  for(const lm of w.landmarks||[])worldLandmark(M,lv,w,lm);
  worldFurniture(M,lv,w);for(const pr of lv.props||[])if(pr.kind!='car')propMesh(M,pr);
  return{main:M,water:Wm,foam:Fm,froth:Fr};}

/* ---------- drawn every frame: the same few trees and cars, placed many times, skipped when out of sight ---------- */
function wTreeModel(con,v){return getModel('wtree:'+con+':'+v,()=>{const m=new Mesh();if(con){conifer(m,0,0,v*7919+7,1);m.lathe(0,0,0,[[1.3,1.25],[4.6,.75],[7.4,.06]],7,'leaves2',[.42,.55,.42]);}else deciduous(m,0,0,v*7919+13,1);return[{mesh:m,pivot:[0,0,0],name:'t'}];});}
function worldDraw(){const w=lv.world,sh=PASS=='shadow',V=sh?LVP:PV,far=sh?50:(WLOW?85:150),f2=far*far,cx=sh?p.x:camPos[0],cz=sh?p.z:camPos[2];let n=0;
  for(const t of w.trees||[]){const x=t[0],z=t[1],dx=x-cx,dz=z-cz;if(dx*dx+dz*dz>f2||!boxVisible(V,[x-5,0,z-5],[x+5,11,z+5],sh))continue;const h=t[2]>>>0,con=h%7==0&&!t[3]?1:0,sc=con?.95+((h>>>9)%4)*.06:t[3]?.72+((h>>>9)%4)*.05:.9+((h>>>9)%4)*.07;
    drawModel(wTreeModel(con,con?h%2:h%6),M4.mul(M4.mul(M4.tr(x,0,z),M4.ry((h%628)/100)),M4.sc(sc)));n++;}
  const cf=sh?40:(WLOW?70:110);for(const c of lv.props||[]){if(c.kind!='car')continue;const dx=c.x-cx,dz=c.z-cz;if(dx*dx+dz*dz>cf*cf||!boxVisible(V,[c.x-2.6,0,c.z-2.6],[c.x+2.6,2,c.z+2.6],sh))continue;
    drawModel(getModel('pcar:'+c.col+':'+(c.tx%3),()=>[{mesh:sedan(c.col,(c.tx%3)*7+3),pivot:[0,0,0],name:'body'}]),M4.mul(M4.tr(c.x,.065,c.z),M4.ry(c.yaw)));}
  if(!sh)w.drawn=n;}
