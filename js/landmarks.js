"use strict";
/* River City Quest Modern: the flagship landmarks, built to look like the real buildings.
   The Virginia State Capitol (Jefferson's temple with its 1906 wings), Main Street Station (clock tower, steep
   tile roof, arcade and train shed), St. John's Church (white frame church with its three-stage steeple),
   the Carillon (the Georgian brick bell tower in Byrd Park) and the Byrd Theatre (marquee and blade sign).
   Each fits the footprint its map gives it; the front faces south, toward the street. */
const LMK={};
const LM_TRIM=[.93,.92,.88];
// one wall of a box, as a flat drawing surface: u runs along it, d comes out of it
function wallFace(x0,z0,x1,z1,s){if(s=='S')return{len:x1-x0,P:(u,y,d)=>[x0+u,y,z1+d]};if(s=='N')return{len:x1-x0,P:(u,y,d)=>[x1-u,y,z0-d]};if(s=='E')return{len:z1-z0,P:(u,y,d)=>[x1+d,y,z1-u]};return{len:z1-z0,P:(u,y,d)=>[x0-d,y,z0+u]};}
const fbox=(M,F,u0,u1,y0,y1,d0,d1,cell,col)=>{const a=F.P(u0,y0,d0),b=F.P(u1,y1,d1);M.box(Math.min(a[0],b[0]),y0,Math.min(a[2],b[2]),Math.max(a[0],b[0]),y1,Math.max(a[2],b[2]),cell,col);};
const fquad=(M,F,u0,u1,y0,y1,d,cell,col)=>M.quad(F.P(u0,y0,d),F.P(u1,y0,d),F.P(u1,y1,d),F.P(u0,y1,d),cell,col);
const ltri=(M,a,b,c,cell,col)=>{const [u0,v0,u1,v1]=cellUV(cell),k=col||[1,1,1];M.tri(a,b,c,[u0,v1],[u1,v1],[(u0+u1)/2,v0],k,k,k);};
// a big sloping surface cut into pieces, so its texture stays at its real size
function bigQuad(M,a,b,c,d,cell,col,size){const L=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t],len=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]),s=size||2,nu=Math.max(1,Math.round(Math.max(len(a,b),len(d,c))/s)),nv=Math.max(1,Math.round(Math.max(len(a,d),len(b,c))/s));
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const P=(u,v)=>L(L(a,b,u),L(d,c,u),v);M.quad(P(i/nu,j/nv),P((i+1)/nu,j/nv),P((i+1)/nu,(j+1)/nv),P(i/nu,(j+1)/nv),cell,col);}}
// a roof that slopes in from all four sides to a smaller flat top, a ridge or a point
function hipRoof(M,x0,z0,x1,z1,y0,h,ix,iz,cell,col){const y1=y0+h,a=[x0+ix,y1,z1-iz],b=[x1-ix,y1,z1-iz],c=[x1-ix,y1,z0+iz],d=[x0+ix,y1,z0+iz];
  bigQuad(M,[x0,y0,z1],[x1,y0,z1],b,a,cell,col);bigQuad(M,[x1,y0,z0],[x0,y0,z0],d,c,cell,col);bigQuad(M,[x1,y0,z1],[x1,y0,z0],c,b,cell,col);bigQuad(M,[x0,y0,z0],[x0,y0,z1],a,d,cell,col);
  if(x1-x0-2*ix>.05&&z1-z0-2*iz>.05)M.quad(a,b,c,d,cell,col);}
// a window set into a wall: glass, frame, sill, glazing bars, and whatever crowns it
function lmWin(M,F,u,y0,w,h,o){o=o||{};const tr=o.trim||LM_TRIM,t=o.t||.09,u0=u-w/2,u1=u+w/2,y1=y0+h,g=o.cell||(o.lit?'panelit':'pane'),gc=o.gcol;
  fquad(M,F,u0,u1,y0,y1,.025,g,gc);fbox(M,F,u0-t,u0,y0,y1,0,.07,'white',tr);fbox(M,F,u1,u1+t,y0,y1,0,.07,'white',tr);if(!o.nosill)fbox(M,F,u0-t*1.7,u1+t*1.7,y0-t,y0,0,.13,'white',tr);
  const cols=o.cols==null?2:o.cols,rows=o.rows==null?Math.max(2,Math.round(h/.55)):o.rows;for(let i=1;i<cols;i++){const x=u0+w*i/cols;fbox(M,F,x-.014,x+.014,y0,y1,.02,.045,'white',tr);}for(let j=1;j<rows;j++){const y=y0+h*j/rows;fbox(M,F,u0,u1,y-.014,y+.014,.02,.045,'white',tr);}
  if(o.arch){const r=w/2,n=10;for(let i=0;i<n;i++){const a0=Math.PI*i/n,a1=Math.PI*(i+1)/n,p=(a,rr,d)=>F.P(u+Math.cos(a)*rr,y1+Math.sin(a)*rr,d);
      ltri(M,F.P(u,y1,.025),p(a0,r,.025),p(a1,r,.025),g,gc);M.quad(p(a0,r,.07),p(a0,r+t*1.3,.07),p(a1,r+t*1.3,.07),p(a1,r,.07),'white',tr);M.quad(p(a0,r+t*1.3,.07),p(a0,r+t*1.3,0),p(a1,r+t*1.3,0),p(a1,r+t*1.3,.07),'white',tr);}
    if(cols>1)fbox(M,F,u-.014,u+.014,y1,y1+r,.02,.045,'white',tr);if(o.key)fbox(M,F,u-t,u+t,y1+r-.02,y1+r+t*2.4,0,.11,'white',tr);}
  else{fbox(M,F,u0-t,u1+t,y1,y1+t,0,.08,'white',tr);
    if(o.ped){fbox(M,F,u0-t*2.2,u1+t*2.2,y1+t,y1+t*1.8,0,.16,'white',tr);const ph=w*.26;ltri(M,F.P(u0-t*2.2,y1+t*1.8,.1),F.P(u1+t*2.2,y1+t*1.8,.1),F.P(u,y1+t*1.8+ph,.1),'white',tr);}
    else if(o.hood)fbox(M,F,u0-t*2,u1+t*2,y1+t,y1+t*2,0,.15,'white',tr);}
  if(o.shut){const sw=w*.48;fbox(M,F,u0-t-sw,u0-t,y0,y1,0,.045,'white',o.shut);fbox(M,F,u1+t,u1+t+sw,y0,y1,0,.045,'white',o.shut);}}
// a classical column: stepped base, a shaft that swells and tapers, and a capital in its order
function lmColumn(M,x,z,y0,h,r,order,col){const c=col||[.95,.94,.9],bh=r*.55,ch=order=='ionic'?r*.75:r*.6,hs=h-bh-ch;
  M.box(x-r*1.38,y0,z-r*1.38,x+r*1.38,y0+r*.22,z+r*1.38,'marble',c);M.lathe(x,y0+r*.22,z,[[0,r*1.3],[r*.1,r*1.34],[r*.2,r*1.14],[r*.26,r*1.2],[r*.33,r*1.02]],16,'marble',c);
  M.lathe(x,y0+bh,z,[[0,r],[hs*.33,r*.99],[hs*.7,r*.92],[hs,r*.84]],18,'column',c);const yc=y0+bh+hs;
  if(order=='ionic'){M.lathe(x,yc,z,[[0,r*.84],[ch*.3,r*.98],[ch*.55,r*1.02]],16,'marble',c);for(const sx of [-1,1])M.tube([x+sx*r*1.02,yc+ch*.45,z-r*.98],[x+sx*r*1.02,yc+ch*.45,z+r*.98],r*.34,r*.34,10,'marble',c,true);
    M.box(x-r*1.3,yc+ch*.55,z-r*.95,x+r*1.3,yc+ch*.75,z+r*.95,'marble',c);M.box(x-r*1.12,yc+ch*.75,z-r*1.12,x+r*1.12,yc+ch,z+r*1.12,'marble',c);}
  else{M.lathe(x,yc,z,[[0,r*.84],[ch*.15,r*.9],[ch*.5,r*1.2]],16,'marble',c);M.box(x-r*1.28,yc+ch*.5,z-r*1.28,x+r*1.28,yc+ch,z+r*1.28,'marble',c);}}
const lmDoor=(M,F,u,y0,w,h,o)=>{o=o||{};const tr=o.trim||LM_TRIM,t=.12;fquad(M,F,u-w/2,u+w/2,y0,y0+h,.03,o.cell||'door',o.col);fbox(M,F,u-.02,u+.02,y0,y0+h,.03,.05,'white',[.2,.16,.12]);fbox(M,F,u-w/2-t,u-w/2,y0,y0+h,0,.1,'white',tr);fbox(M,F,u+w/2,u+w/2+t,y0,y0+h,0,.1,'white',tr);fbox(M,F,u-w/2-t,u+w/2+t,y0+h,y0+h+t,0,.12,'white',tr);};
// stone blocks stepping up a corner
function quoins(M,x,z,y0,y1,col,k){k=k||1;for(let y=y0,i=0;y<y1-.2;y+=.45,i++){const w=(i%2?.32:.5)*k;M.box(x-w,y,z-w,x+w,Math.min(y1,y+.4),z+w,'marble',col);}}

/* ---------- Virginia State Capitol ---------- */
LMK.capitol=(M,X0,Z0,X1,Z1)=>{const cx=(X0+X1)/2,W=[.96,.95,.92],cw=4.7,base=1.5,H=6.2,zb=Z0+.8,zp=Z1-1.35,zf=zp-3.3,top=base+H;
  M.box(X0+.2,0,Z0+.3,X1-.2,.45,Z1-.1,'granite',null,{bottom:1},true);
  // the temple: podium, stair, walls, and the Ionic portico two columns deep
  M.box(cx-cw,0,zb,cx+cw,base,zp,'marble',W,{bottom:1},true);for(let i=0;i<8;i++)M.box(cx-cw+.65,0,zp,cx+cw-.65,base*(1-(i+1)/9),zp+(i+1)*1.2/8,'granite');for(const sx of [-1,1])M.box(cx+sx*cw-(sx>0?.65:0),0,zp,cx+sx*cw+(sx>0?0:.65),base+.1,Z1-.15,'marble',W);
  const bx0=cx-cw+.35,bx1=cx+cw-.35;M.box(bx0,base,zb+.2,bx1,top,zf,'white',W,{bottom:1,top:1},true);
  for(let i=0;i<6;i++)lmColumn(M,cx-cw+.6+i*(2*cw-1.2)/5,zp-.6,base,H,.4,'ionic',W);for(const sx of [-1,1])lmColumn(M,cx+sx*(cw-.6),zp-2.2,base,H,.4,'ionic',W);
  M.box(cx-cw,top,zb,cx+cw,top+.75,zp-.1,'white',W);M.box(cx-cw-.08,top+.75,zb-.08,cx+cw+.08,top+1.1,zp-.02,'marble',W);M.box(cx-cw-.3,top+1.1,zb-.3,cx+cw+.3,top+1.28,zp+.2,'white',W);
  M.gable(cx-cw-.3,zb-.3,cx+cw+.3,zp+.2,top+1.28,1.95,false,'tin',null,'white');M.box(cx-cw-.3,top+1.28,zp+.12,cx+cw+.3,top+1.4,zp+.2,'white',W);
  const S=wallFace(bx0,zb+.2,bx1,zf,'S');lmDoor(M,S,S.len/2,base,1.7,3.3);{const t=LM_TRIM;fbox(M,S,S.len/2-1.25,S.len/2+1.25,base+3.42,base+3.6,0,.2,'white',t);ltri(M,S.P(S.len/2-1.25,base+3.6,.12),S.P(S.len/2+1.25,base+3.6,.12),S.P(S.len/2,base+4.2,.12),'white',t);}
  for(const u of [1.35,S.len-1.35]){lmWin(M,S,u,base+.9,1,2.5,{ped:1});lmWin(M,S,u,base+4.3,1,1.3,{rows:2});}
  for(const s of ['E','W']){const F=wallFace(bx0,zb+.2,bx1,zf,s),n=4;for(let i=0;i<=n;i++){const u=.3+i*(F.len-.6)/n;fbox(M,F,u-.28,u+.28,base,top,0,.09,'white',W);fbox(M,F,u-.36,u+.36,top-.35,top,0,.13,'marble',W);fbox(M,F,u-.36,u+.36,base,base+.25,0,.13,'marble',W);}
    for(let i=0;i<n;i++){const u=.3+(i+.5)*(F.len-.6)/n;lmWin(M,F,u,base+.9,.95,2.5,{ped:1});lmWin(M,F,u,base+4.3,.95,1.3,{rows:2});}}
  // the 1906 wings: smaller temples set back on either side, joined by low links
  for(const sx of [-1,1]){const hx0=cx+sx*cw,hx1=cx+sx*(cw+1.5),wx1=sx>0?X1-.35:X0+.35,a=Math.min(hx0,hx1),b=Math.max(hx0,hx1),hz0=zb+2.2,hz1=zf-1.4,ht=base+4.3;
    M.box(a,0,hz0,b,ht,hz1,'white',W,{bottom:1},true);M.box(a-.05,ht,hz0-.1,b+.05,ht+.2,hz1+.1,'marble',W);for(let k=0;k<5;k++)M.box(a+.15+k*(b-a-.3)/4-.05,ht+.2,hz1-.08,a+.15+k*(b-a-.3)/4+.05,ht+.75,hz1+.04,'marble',W);M.box(a,ht+.75,hz1-.1,b,ht+.85,hz1+.06,'marble',W);
    lmWin(M,wallFace(a,hz0,b,hz1,'S'),(b-a)/2,base+.7,.85,2.2,{hood:1});
    const w0=Math.min(hx1,wx1),w1=Math.max(hx1,wx1),wz0=zb+1,wz1=zf+.5,wt=base+4.9;M.box(w0,0,wz0,w1,base,wz1+.25,'marble',W,{bottom:1},true);M.box(w0+.12,base,wz0+.12,w1-.12,wt,wz1,'white',W,{bottom:1,top:1},true);
    M.box(w0,wt,wz0,w1,wt+.6,wz1+.1,'white',W);M.box(w0-.18,wt+.6,wz0-.18,w1+.18,wt+.76,wz1+.28,'white',W);M.gable(w0-.18,wz0-.18,w1+.18,wz1+.28,wt+.76,.95,false,'tin',null,'white');
    const F=wallFace(w0+.12,wz0+.12,w1-.12,wz1,'S');for(let i=0;i<3;i++){const u=.22+i*(F.len-.44)/2;fbox(M,F,u-.2,u+.2,base,wt,0,.08,'white',W);fbox(M,F,u-.27,u+.27,wt-.28,wt,0,.12,'marble',W);}
    for(let i=0;i<2;i++){const u=.22+(i+.5)*(F.len-.44)/2;lmWin(M,F,u,base+.7,.8,2.2,{ped:1});lmWin(M,F,u,base+3.5,.8,1,{rows:2});}
    const G=wallFace(w0+.12,wz0+.12,w1-.12,wz1,sx>0?'E':'W');for(let i=0;i<4;i++){const u=(i+.5)*G.len/4;lmWin(M,G,u,base+.7,.85,2.2,{hood:1});lmWin(M,G,u,base+3.5,.85,1,{rows:2});}}
  for(const sx of [-1,1]){M.tube([cx+sx*(cw+.9),0,Z1-.5],[cx+sx*(cw+.9),7.5,Z1-.5],.05,.035,6,'chrome');M.sphere(cx+sx*(cw+.9),7.55,Z1-.5,.08,6,3,'gold');}};

/* ---------- Main Street Station ---------- */
LMK.station=(M,X0,Z0,X1,Z1)=>{const st=[.86,.82,.74],bk=[1.12,.84,.62],tile=[1.35,.62,.4],hx0=X0+.6,hx1=X0+16.6,hz0=Z0+1.5,hz1=Z1-.7,eave=10.4;
  // head house: stone arcade below, buff brick above, and the steep tiled roof with its dormers
  M.box(hx0,0,hz0,hx1,3.6,hz1,'marble',st,{bottom:1,top:1},true);M.box(hx0-.1,3.6,hz0-.1,hx1+.1,3.85,hz1+.1,'marble',st);for(const y of [1.2,2.4])M.box(hx0-.03,y,hz0-.03,hx1+.03,y+.06,hz1+.03,'marble',st.map(v=>v*.7));
  M.box(hx0+.12,3.85,hz0+.12,hx1-.12,eave,hz1-.12,'brick',bk,{bottom:1,top:1},true);M.box(hx0-.15,eave,hz0-.15,hx1+.15,eave+.3,hz1+.15,'marble',st);M.box(hx0-.35,eave+.3,hz0-.35,hx1+.35,eave+.5,hz1+.35,'marble',st);
  for(let x=hx0;x<hx1;x+=.8){M.box(x,eave-.3,hz1-.12,x+.2,eave,hz1+.12,'marble',st);M.box(x,eave-.3,hz0-.12,x+.2,eave,hz0+.12,'marble',st);}
  const S=wallFace(hx0,hz0,hx1,hz1,'S'),a0=4.15,bay=2.3;for(let i=0;i<5;i++){const u=a0+bay*(i+.5);lmWin(M,S,u,.05,1.55,1.75,{arch:1,key:1,cell:'black',cols:1,rows:1,nosill:1,trim:st,t:.16});fquad(M,S,u-.6,u+.6,.05,2.1,-.25,i==2?'door':'pane');
    lmWin(M,wallFace(hx0+.12,hz0+.12,hx1-.12,hz1-.12,'S'),u-.12,4.5,1.2,1.7,{arch:1,key:1,trim:st});for(const o of [-.42,.42])lmWin(M,wallFace(hx0+.12,hz0+.12,hx1-.12,hz1-.12,'S'),u-.12+o,7.9,.6,1.5,{cols:1,hood:1,trim:st});}
  for(const s of ['E','N']){const F=wallFace(hx0,hz0,hx1,hz1,s),n=Math.floor(F.len/2.3);for(let i=0;i<n;i++){const u=(i+.5)*F.len/n;lmWin(M,F,u,.6,1.2,1.5,{arch:1,trim:st});lmWin(M,F,u,4.5,1.1,1.7,{arch:1,key:1,trim:st});lmWin(M,F,u,7.9,.9,1.5,{hood:1,trim:st});}}
  quoins(M,hx1-.05,hz1-.05,3.85,eave,st);quoins(M,hx1-.05,hz0+.05,3.85,eave,st);
  const ry=eave+.5,rh=4.8;hipRoof(M,hx0-.3,hz0-.3,hx1+.3,hz1+.3,ry,rh,3.3,3.3,'roof',tile);M.box(hx0+3.1,ry+rh,hz0+3,hx1-3.1,ry+rh+.12,hz1-3,'copper');for(let x=hx0+3.2;x<hx1-3.2;x+=.5)M.cone(x,ry+rh+.1,(hz0+hz1)/2,.05,ry+rh+.55,0,4,'copper');
  for(const [n,yy,w] of [[4,ry+.5,1.1],[3,ry+2.5,.8]])for(let i=0;i<n;i++){const x=hx0+5.6+i*(hx1-hx0-7.2)/(n-1||1),k=(yy-ry)/rh*3.3,z=hz1+.3-k;M.box(x-w/2,yy-.2,z-1.2,x+w/2,yy+w*1.1,z+.12,'brick',bk);M.gable(x-w/2-.1,z-1.2,x+w/2+.1,z+.2,yy+w*1.1,w*.7,false,'roof',tile,'brick');lmWin(M,wallFace(x-w/2,z-1.2,x+w/2,z+.12,'S'),w/2,yy+.1,w*.55,w*.8,{cols:1,rows:2,trim:st});}
  // the clock tower on the corner
  const tx0=hx0,tx1=hx0+4,tz1=hz1+.15,tz0=tz1-4,tc=[(tx0+tx1)/2,(tz0+tz1)/2];M.box(tx0,0,tz0,tx1,3.6,tz1,'marble',st,{bottom:1,top:1},true);M.box(tx0-.1,3.6,tz0-.1,tx1+.1,3.85,tz1+.1,'marble',st);M.box(tx0+.1,3.85,tz0+.1,tx1-.1,15.6,tz1-.1,'brick',bk,{bottom:1,top:1},true);
  for(const [x,z] of [[tx0+.1,tz0+.1],[tx1-.1,tz0+.1],[tx0+.1,tz1-.1],[tx1-.1,tz1-.1]])quoins(M,x,z,3.85,15.6,st);
  for(const s of ['S','W','E','N']){const F=wallFace(tx0+.1,tz0+.1,tx1-.1,tz1-.1,s);if(s=='S'||s=='W')lmWin(M,wallFace(tx0,tz0,tx1,tz1,s),2,.05,1.5,1.8,{arch:1,key:1,cell:s=='S'?'door':'pane',cols:1,rows:1,nosill:1,trim:st,t:.16});
    for(const y of [4.6,7.6,10.6])lmWin(M,F,F.len/2,y,.8,1.7,{arch:1,cols:1,trim:st});lmWin(M,F,F.len/2,13.4,1.5,1.2,{arch:1,cols:3,key:1,trim:st});}
  M.box(tx0-.2,15.6,tz0-.2,tx1+.2,16,tz1+.2,'marble',st);M.box(tx0,16,tz0,tx1,19.2,tz1,'marble',st,{bottom:1,top:1},true);
  for(const s of ['S','W','E','N']){const F=wallFace(tx0,tz0,tx1,tz1,s);fquad(M,F,.75,3.25,16.35,18.85,.06,'clock');for(let i=0;i<16;i++){const a0=i/16*6.2832,a1=(i+1)/16*6.2832,p=(a,r)=>F.P(2+Math.cos(a)*r,17.6+Math.sin(a)*r,.09);M.quad(p(a0,1.25),p(a0,1.42),p(a1,1.42),p(a1,1.25),'white',st.map(v=>v*.8));}}
  M.box(tx0-.25,19.2,tz0-.25,tx1+.25,19.55,tz1+.25,'marble',st);
  // open belvedere under the roof: corner piers and arched openings
  for(const [x,z] of [[tx0,tz0],[tx1-.55,tz0],[tx0,tz1-.55],[tx1-.55,tz1-.55]])M.box(x,19.55,z,x+.55,21.9,z+.55,'marble',st);M.box(tx0+.4,19.55,tz0+.4,tx1-.4,21.9,tz1-.4,'black');
  for(const s of ['S','W','E','N']){const F=wallFace(tx0,tz0,tx1,tz1,s);for(const u of [1.45,2.55])fbox(M,F,u-.09,u+.09,19.55,21.2,-.3,-.05,'marble',st);fbox(M,F,.5,3.5,21.2,21.9,-.3,0,'marble',st);fbox(M,F,.3,3.7,19.55,20,-.1,.05,'bars',st);}
  M.box(tx0-.3,21.9,tz0-.3,tx1+.3,22.25,tz1+.3,'marble',st);hipRoof(M,tx0-.3,tz0-.3,tx1+.3,tz1+.3,22.25,5,2.3,2.3,'roof',tile);M.lathe(tc[0],27.2,tc[1],[[0,.1],[.3,.22],[.55,.08],[1.3,.03],[1.5,0]],8,'copper');
  // the train shed alongside
  const sx0=hx1,sx1=X1-.3,sz0=Z0+2.2,sz1=Z1-1.8,ir=[.42,.45,.46];M.box(sx0,0,sz0,sx1,5.4,sz1,'brick',bk.map(v=>v*.82),{bottom:1},true);M.gable(sx0,sz0-.3,sx1+.2,sz1+.3,5.4,2.3,true,'tin',null,'brick');
  M.box(sx0+.6,7.2,(sz0+sz1)/2-.9,sx1-.4,7.9,(sz0+sz1)/2+.9,'grille',ir);M.gable(sx0+.5,(sz0+sz1)/2-1.1,sx1-.3,(sz0+sz1)/2+1.1,7.9,.6,true,'tin');
  const T=wallFace(sx0,sz0,sx1,sz1,'S'),tn=3;for(let i=0;i<tn;i++){const u=(i+.5)*T.len/tn;lmWin(M,T,u,.3,1.5,2.6,{arch:1,key:1,cols:3,trim:st});fbox(M,T,u+T.len/tn/2-.14,u+T.len/tn/2+.14,0,5.4,0,.12,'brick',bk.map(v=>v*.7));}
  const E=wallFace(sx0,sz0,sx1,sz1,'E');lmWin(M,E,E.len/2,.05,3.4,2.4,{arch:1,cell:'black',cols:1,rows:1,nosill:1,trim:ir,t:.18});};

/* ---------- St. John's Church ---------- */
LMK.church=(M,X0,Z0,X1,Z1)=>{const W=[.96,.96,.93],CW=[1.04,1.14,1.74],gr=[.14,.24,.18],dk=[.42,.4,.4],dx=X0+5,wh=4.4,nz1=Z1-3.1,cz1=Z0+4.6;
  const wing=(x0,z0,x1,z1,along)=>{M.box(x0-.06,0,z0-.06,x1+.06,.55,z1+.06,'brick',null,{bottom:1},true);M.box(x0,.55,z0,x1,wh,z1,'clap',CW,{bottom:1,top:1},true);M.box(x0-.2,wh,z0-.2,x1+.2,wh+.16,z1+.2,'white',W);M.gable(x0-.25,z0-.25,x1+.25,z1+.25,wh+.16,along?(z1-z0)*.36:(x1-x0)*.36,along,'roof',null,'white');};
  // a T: the long nave behind the tower, and the older wing across the back
  wing(dx-3,cz1-.5,dx+3,nz1,false);wing(X0+.5,Z0+.5,X1-.5,cz1,true);
  const win=(F,u)=>lmWin(M,F,u,1.5,.95,2.2,{cols:3,rows:5,shut:gr,hood:1});
  for(const s of ['E','W']){const F=wallFace(dx-3,cz1,dx+3,nz1,s);for(let i=0;i<2;i++)win(F,(i+.5)*F.len/2);}
  const C=wallFace(X0+.5,Z0+.5,X1-.5,cz1,'S');for(const u of [.5+((dx-3)-(X0+.5))/2-.2,C.len-(X1-.5-(dx+3))/2])if(u>.9&&u<C.len-.9)win(C,u);
  for(const s of ['E','W']){const F=wallFace(X0+.5,Z0+.5,X1-.5,cz1,s);win(F,F.len/2);lmWin(M,F,F.len/2,wh+.5,.7,.7,{arch:1,cols:1,rows:1});}
  const N=wallFace(X0+.5,Z0+.5,X1-.5,cz1,'N');for(let i=0;i<4;i++)win(N,(i+.5)*N.len/4);
  for(const sx of [-1,1])win(wallFace(dx-3,cz1,dx+3,nz1,'S'),3+sx*2.2);
  // the steeple: square tower with the door, a louvred second stage, an eight-sided belfry and the spire
  const t0=dx-1.55,t1=dx+1.55,tz0=Z1-3.3,tz1=Z1-.25,tcz=(tz0+tz1)/2;M.box(t0-.06,0,tz0,t1+.06,.55,tz1+.06,'brick',null,{bottom:1},true);M.box(t0,.55,tz0,t1,6.4,tz1,'clap',CW,{bottom:1,top:1},true);for(const [x,z] of [[t0,tz1],[t1,tz1],[t0,tz0],[t1,tz0]])M.box(x-.09,.55,z-.09,x+.09,6.4,z+.09,'white',W);
  const T=wallFace(t0,tz0,t1,tz1,'S');lmWin(M,T,T.len/2,.55,1.35,2.3,{arch:1,cell:'door',cols:2,rows:1,nosill:1,t:.13});for(let i=0;i<3;i++)M.box(dx-1.1-i*.12,0,tz1,dx+1.1+i*.12,.55-i*.18,tz1+.1+i*.05,'granite');
  lmWin(M,T,T.len/2,4,.8,1.3,{arch:1,cols:2,rows:3});for(const s of ['E','W'])lmWin(M,wallFace(t0,tz0,t1,tz1,s),1.5,3.2,.8,1.6,{cols:2,rows:4,shut:gr});
  M.box(t0-.22,6.4,tz0-.22,t1+.22,6.62,tz1+.22,'white',W);M.box(t0+.25,6.62,tz0+.25,t1-.25,9,tz1-.25,'clap',CW,{bottom:1,top:1},true);
  for(const s of ['S','W','E','N'])lmWin(M,wallFace(t0+.25,tz0+.25,t1-.25,tz1-.25,s),1.3,7,.85,1.1,{arch:1,cell:'grille',gcol:gr.map(v=>v*1.6),cols:1,rows:1});
  M.box(t0+.05,9,tz0+.05,t1-.05,9.22,tz1-.05,'white',W);M.lathe(dx,9.22,tcz,[[0,1.15],[2.1,1.1]],8,'white',W);
  for(let i=0;i<8;i++){const a=(i+.5)/8*6.2832,r=1.17,ux=Math.cos(a),uz=Math.sin(a),px=-uz,pz=ux,p=(u,y)=>[dx+ux*r+px*u,y,tcz+uz*r+pz*u];M.quad(p(.28,9.6),p(-.28,9.6),p(-.28,10.75),p(.28,10.75),'grille',gr.map(v=>v*1.6));for(let k=0;k<6;k++){const a0=Math.PI*k/6,a1=Math.PI*(k+1)/6;ltri(M,p(0,10.75),p(-Math.cos(a0)*.28,10.75+Math.sin(a0)*.28),p(-Math.cos(a1)*.28,10.75+Math.sin(a1)*.28),'grille',gr.map(v=>v*1.6));}}
  M.lathe(dx,11.32,tcz,[[0,1.3],[.12,1.32],[.2,1.2]],8,'white',W);M.lathe(dx,11.52,tcz,[[0,1.12],[.5,.95],[.9,.6],[1.1,.42]],8,'roof',dk);M.lathe(dx,12.62,tcz,[[0,.42],[.6,.4],[.66,.5],[.74,.5]],8,'white',W);
  M.cone(dx,13.36,tcz,.44,16.6,.02,8,'roof',dk);M.sphere(dx,16.7,tcz,.1,8,4,'gold');M.tube([dx,16.7,tcz],[dx,17.5,tcz],.015,.015,4,'gold');M.box(dx-.3,17.25,tcz-.01,dx+.3,17.29,tcz+.01,'gold');M.box(dx-.01,17.25,tcz-.3,dx+.01,17.29,tcz+.3,'gold');};

/* ---------- the Carillon ---------- */
LMK.carillon=(M,X0,Z0,X1,Z1)=>{const cx=(X0+X1)/2,st=[.9,.87,.8],bk=[1,.86,.78],s=2.15,cz=Z1-.45-s,x0=cx-s,x1=cx+s,z0=cz-s,z1=cz+s;
  // memorial terrace behind the tower
  M.box(X0+.3,0,Z0+.4,X1-.3,.7,z0,'granite',null,{bottom:1},true);for(const [a,b,c,d] of [[X0+.3,Z0+.4,X1-.3,Z0+.6],[X0+.3,Z0+.4,X0+.5,z0],[X1-.5,Z0+.4,X1-.3,z0]]){M.box(a,.7,b,c,.82,d,'marble',st);M.box(a,1.45,b,c,1.6,d,'marble',st);for(let k=0,n=Math.round(Math.max(c-a,d-b)/.3);k<=n;k++){const x=a+(c-a)*(c-a>d-b?k/n:.5),z=b+(d-b)*(c-a>d-b?.5:k/n);M.lathe(x,.82,z,[[0,.05],[.2,.09],[.42,.05],[.63,.07]],6,'marble',st);}}
  for(const x of [X0+.4,X1-.4])M.lathe(x,1.6,Z0+.5,[[0,.2],[.15,.28],[.5,.3],[.6,.16],[.75,.2]],8,'marble',st);
  // base: limestone, with the tall arched portal
  M.box(x0-.25,0,z0-.25,x1+.25,.5,z1+.25,'granite',null,{bottom:1},true);M.box(x0,0.5,z0,x1,4.4,z1,'marble',st,{bottom:1,top:1},true);for(let y=1.1;y<4.3;y+=.6)M.box(x0-.03,y,z0-.03,x1+.03,y+.06,z1+.03,'marble',st.map(v=>v*.72));M.box(x0-.2,4.4,z0-.2,x1+.2,4.75,z1+.2,'marble',st);
  const B=wallFace(x0,z0,x1,z1,'S');lmWin(M,B,s,.5,1.5,2.1,{arch:1,key:1,cell:'door',cols:2,rows:1,nosill:1,trim:st,t:.2});for(const sgn of ['E','W','N'])lmWin(M,wallFace(x0,z0,x1,z1,sgn),s,1.4,1,1.4,{arch:1,key:1,trim:st,t:.14});
  // the brick shaft with stone corners and slit windows
  const top=18.4;M.box(x0+.15,4.75,z0+.15,x1-.15,top,z1-.15,'brick',bk,{bottom:1,top:1},true);for(const [x,z] of [[x0+.15,z0+.15],[x1-.15,z0+.15],[x0+.15,z1-.15],[x1-.15,z1-.15]])quoins(M,x,z,4.75,top,st,.55);
  for(const sgn of ['S','E','W','N']){const F=wallFace(x0+.15,z0+.15,x1-.15,z1-.15,sgn);for(const y of [6.2,10,13.8])lmWin(M,F,F.len/2,y,.5,1.8,{cols:1,rows:3,hood:1,trim:st});fbox(M,F,F.len/2-.9,F.len/2+.9,16.6,17.6,0,.06,'marble',st);}
  M.box(x0-.05,top,z0-.05,x1+.05,top+.3,z1+.05,'marble',st);M.box(x0-.3,top+.3,z0-.3,x1+.3,top+.5,z1+.3,'marble',st);
  // the belfry: stone, open arches between pilasters, balustrade above
  const by=top+.5,bt=by+4.6;M.box(x0+.2,by,z0+.2,x1-.2,bt,z1-.2,'marble',st,{bottom:1,top:1},true);
  for(const sgn of ['S','E','W','N']){const F=wallFace(x0+.2,z0+.2,x1-.2,z1-.2,sgn);for(const u of [F.len*.3,F.len*.7]){lmWin(M,F,u,by+.7,.85,2.3,{arch:1,key:1,cell:'black',cols:1,rows:1,trim:st,t:.12});fquad(M,F,u-.42,u+.42,by+.7,by+2.2,.035,'bars',[.5,.42,.25]);}for(const u of [.22,F.len/2,F.len-.22])fbox(M,F,u-.2,u+.2,by,bt,0,.1,'marble',st);}
  M.box(x0-.1,bt,z0-.1,x1+.1,bt+.25,z1+.1,'marble',st);M.box(x0-.35,bt+.25,z0-.35,x1+.35,bt+.45,z1+.35,'marble',st);
  for(const sgn of ['S','E','W','N']){const F=wallFace(x0-.25,z0-.25,x1+.25,z1+.25,sgn);fbox(M,F,0,F.len,bt+1.1,bt+1.22,-.14,0,'marble',st);for(let k=0;k<=12;k++){const p=F.P(.1+k*(F.len-.2)/12,bt+.45,-.07);M.lathe(p[0],p[1],p[2],[[0,.04],[.2,.075],[.42,.04],[.65,.06]],6,'marble',st);}}
  for(const [x,z] of [[x0-.2,z0-.2],[x1+.2,z0-.2],[x0-.2,z1+.2],[x1+.2,z1+.2]])M.lathe(x,bt+.45,z,[[0,.16],[.75,.16],[.8,.22],[.95,.2],[1.2,.06],[1.3,.1],[1.42,0]],8,'marble',st);
  // the eight-sided lantern, its dome and gilded finial
  const ly=bt+.45;M.lathe(cx,ly,cz,[[0,1.55],[.3,1.55],[.3,1.4],[2.5,1.35],[2.5,1.5],[2.7,1.5]],8,'marble',st);
  for(let i=0;i<8;i++){const a=(i+.5)/8*6.2832,r=1.42,ux=Math.cos(a),uz=Math.sin(a),p=(u,y)=>[cx+ux*r-uz*u,y,cz+uz*r+ux*u];M.quad(p(.26,ly+.6),p(-.26,ly+.6),p(-.26,ly+1.8),p(.26,ly+1.8),'black');for(let k=0;k<6;k++){const a0=Math.PI*k/6,a1=Math.PI*(k+1)/6;ltri(M,p(0,ly+1.8),p(-Math.cos(a0)*.26,ly+1.8+Math.sin(a0)*.26),p(-Math.cos(a1)*.26,ly+1.8+Math.sin(a1)*.26),'black');}}
  M.lathe(cx,ly+2.7,cz,[[0,1.38],[.5,1.25],[.95,.95],[1.25,.55],[1.4,.3]],16,'copper');M.lathe(cx,ly+4.1,cz,[[0,.3],[.5,.26],[.55,.34],[.65,.34],[.8,.12],[1.6,.04],[1.75,0]],8,'gold');};

/* ---------- the Byrd Theatre ---------- */
LMK.byrd=(M,X0,Z0,X1,Z1)=>{const cx=(X0+X1)/2,bk=[1.08,.94,.78],tc=[.93,.89,.78],red=[.75,.12,.1],x0=X0+.25,x1=X1-.25,z0=Z0+.3,z1=Z1-1.25,H=10.6;
  M.box(x0,0,z0,x1,H,z1,'brick',bk,{bottom:1,top:1},true);M.box(x0,H,z0,x1,H+.02,z1,'roof');const S=wallFace(x0,z0,x1,z1,'S'),L=S.len;
  // street level: terracotta piers, poster cases, glass doors and the ticket booth
  fbox(M,S,0,L,0,3.5,0,.06,'marble',tc);fbox(M,S,0,L,0,.35,0,.1,'granite');fbox(M,S,L/2-2.2,L/2+2.2,.05,3,.04,.07,'black');for(const o of [-1.5,-.5,.5,1.5])fquad(M,S,L/2+o-.42,L/2+o+.42,.1,2.6,.09,'glass',[.5,.6,.7]);fbox(M,S,L/2-2.2,L/2+2.2,2.6,3,.07,.11,'wood',[.5,.3,.2]);const G=wallFace(x0,z0,x1,z1+.06,'S');
  M.lathe(cx,0,z1+.35,[[0,.5],[1,.5],[1,.46],[2.1,.46],[2.1,.55],[2.3,.52],[2.5,.2]],8,'wood',[.55,.32,.2]);M.lathe(cx,1.02,z1+.35,[[0,.475],[1.06,.475]],8,'glass',[.7,.8,.85]);
  for(const sx of [-1,1]){for(const o of [3.1,4.5])lmWin(M,G,L/2+sx*o,.9,1,1.7,{cell:'case',cols:1,rows:1,trim:[.75,.6,.25],t:.07,nosill:1});lmWin(M,G,L/2+sx*5.9,.4,1.1,2.5,{cell:'storefront',cols:1,rows:1,trim:tc,nosill:1});}
  // the marquee: a deep canopy edged in bulbs
  const my=3.35,mz=Z1-.12;M.box(cx-3.6,my,z1,cx+3.6,my+.75,mz,{top:'black',bottom:'white',side:'marquee'});M.box(cx-3.7,my+.75,z1,cx+3.7,my+.85,mz+.05,'gold');M.box(cx-3.7,my-.08,z1,cx+3.7,my,mz+.05,'gold');
  for(let x=cx-3.45;x<=cx+3.46;x+=.3){M.sphere(x,my-.1,mz-.04,.045,5,3,'lampglow');for(let z=z1+.25;z<mz-.2;z+=.3)M.sphere(x,my-.03,z,.04,4,2,'lampglow');}
  // the blade sign
  M.box(cx-.5,my+.85,z1,cx+.5,H+.6,z1+.75,{top:'gold',bottom:'gold',side:'marquee',east:'white',west:'white'},red);for(const sx of [-1,1])for(let y=my+1.1;y<H+.5;y+=.32)M.sphere(cx+sx*.52,y,z1+.76,.04,4,2,'lampglow');M.lathe(cx,H+.6,z1+.38,[[0,.5],[.2,.55],[.5,.3],[.9,.06],[1,0]],8,'gold');
  // upper floors: five bays of arched windows in cream terracotta, then a row of small ones
  fbox(M,S,0,L,3.5,3.8,0,.14,'marble',tc);const n=5,bw=(L-.8)/n;for(let i=0;i<=n;i++){const u=.4+i*bw;fbox(M,S,u-.22,u+.22,3.8,H-.9,0,.1,'marble',tc);fbox(M,S,u-.3,u+.3,H-1.25,H-.9,0,.15,'marble',tc);}
  for(let i=0;i<n;i++){const u=.4+(i+.5)*bw;if(i!=2){lmWin(M,S,u,4.5,1.25,2,{arch:1,key:1,cols:2,rows:3,trim:tc,t:.12});lmWin(M,S,u,7.9,1.2,1.1,{cols:3,rows:2,hood:1,trim:tc});}
    fbox(M,S,u-.5,u+.5,7.25,7.5,0,.07,'marble',tc);}
  fbox(M,S,-.1,L+.1,H-.9,H-.5,0,.2,'marble',tc);fbox(M,S,-.2,L+.2,H-.5,H-.3,0,.36,'marble',tc);for(let u=.1;u<L;u+=.45)fbox(M,S,u,u+.16,H-.75,H-.5,0,.3,'marble',tc);fbox(M,S,0,L,H-.3,H+.55,-.25,.02,'brick',bk);fbox(M,S,-.05,L+.05,H+.55,H+.7,-.3,.08,'marble',tc);
  fbox(M,S,L/2-1.6,L/2+1.6,H+.7,H+1.3,-.25,.02,'marble',tc);ltri(M,S.P(L/2-1.8,H+1.3,.02),S.P(L/2+1.8,H+1.3,.02),S.P(L/2,H+2,.02),'marble',tc);for(const u of [.25,L-.25])M.lathe(S.P(u,0,0)[0],H+.7,z1-.12,[[0,.14],[.12,.2],[.4,.24],[.5,.12],[.62,.16],[.75,0]],8,'marble',tc);
  for(const s of ['E','W']){const F=wallFace(x0,z0,x1,z1,s);for(const y of [4.6,7.8])lmWin(M,F,F.len/2,y,1,1.6,{hood:1,trim:tc});}};

/* ---------- neighbors of the landmarks ---------- */
// St. Paul's Episcopal Church: a stuccoed Greek Revival temple with a deep columned porch and a low eight-sided cupola
LMK.temple=(M,X0,Z0,X1,Z1)=>{const cx=(X0+X1)/2,W=[.93,.9,.84],x0=X0+.5,x1=X1-.5,z0=Z0+.3,zp=Z1-.35,zf=zp-2,base=1.1,H=6,top=base+H;
  M.box(x0-.2,0,z0,x1+.2,base,zp,'granite',null,{bottom:1},true);for(let i=0;i<5;i++)M.box(x0+.6,0,zp,x1-.6,base*(1-(i+1)/6),zp+(i+1)*.06,'granite');
  M.box(x0,base,z0,x1,top,zf,'plaster',W,{bottom:1,top:1},true);const n=6;for(let i=0;i<n;i++)lmColumn(M,x0+.45+i*(x1-x0-.9)/(n-1),zp-.45,base,H,.34,'ionic',W);
  M.box(x0-.1,top,z0-.1,x1+.1,top+.9,zp,'white',W);M.box(x0-.3,top+.9,z0-.3,x1+.3,top+1.05,zp+.2,'white',W);M.gable(x0-.3,z0-.3,x1+.3,zp+.2,top+1.05,1.7,false,'tin',null,'white');
  const S=wallFace(x0,z0,x1,zf,'S');lmDoor(M,S,S.len/2,base,1.5,3.2);for(const u of [1.4,S.len-1.4])lmDoor(M,S,u,base,1.1,2.8);
  for(const s of ['E','W']){const F=wallFace(x0,z0,x1,zf,s);for(let i=0;i<3;i++){const u=(i+.5)*F.len/3;lmWin(M,F,u,base+1.2,1,3.6,{cols:3,rows:6,hood:1});fbox(M,F,u+F.len/6-.2,u+F.len/6+.2,base,top,0,.08,'white',W);}}
  const cz=zf-1.2;M.box(cx-1.1,top+1.6,cz-1.1,cx+1.1,top+2.6,cz+1.1,'white',W);M.lathe(cx,top+2.6,cz,[[0,1],[1.5,.96],[1.5,1.08],[1.65,1.08]],8,'white',W);M.lathe(cx,top+4.25,cz,[[0,1.02],[.4,.9],[.75,.55],[.9,.2],[1.2,.05],[1.3,0]],16,'copper');};
// Old City Hall: gray granite Gothic, a tall clock tower at one corner and steep-roofed turrets at the others
LMK.cityhall=(M,X0,Z0,X1,Z1)=>{const g=[.78,.79,.82],dk=[.5,.52,.56],x0=X0+.5,x1=X1-.5,z0=Z0+.4,z1=Z1-.5,H=11;
  M.box(x0-.15,0,z0-.15,x1+.15,.9,z1+.15,'granite',dk,{bottom:1},true);M.box(x0,.9,z0,x1,H,z1,'granite',g,{bottom:1,top:1},true);for(const y of [4.2,7.4])M.box(x0-.06,y,z0-.06,x1+.06,y+.18,z1+.06,'granite',dk);M.box(x0-.2,H,z0-.2,x1+.2,H+.35,z1+.2,'granite',dk);
  hipRoof(M,x0-.2,z0-.2,x1+.2,z1+.2,H+.35,3.2,2.4,2.4,'roof',[.6,.62,.68]);
  for(const s of ['S','E','W','N']){const F=wallFace(x0,z0,x1,z1,s),n=Math.max(2,Math.floor(F.len/2.2));for(let i=0;i<n;i++){const u=(i+.5)*F.len/n;for(const y of [1.5,4.8,8])lmWin(M,F,u,y,.95,1.5,{arch:1,key:1,cols:2,rows:3,trim:dk,t:.11});}}
  const S=wallFace(x0,z0,x1,z1,'S');lmWin(M,S,S.len/2,.9,1.9,2.4,{arch:1,key:1,cell:'door',cols:2,rows:1,nosill:1,trim:dk,t:.2});for(let i=0;i<4;i++)M.box((x0+x1)/2-1.6-i*.1,0,z1,(x0+x1)/2+1.6+i*.1,.9-i*.22,z1+.1+i*.05,'granite');
  const turret=(tx,tz,r,top,clock)=>{M.box(tx-r,0,tz-r,tx+r,top,tz+r,'granite',g,{bottom:1,top:1},true);M.box(tx-r-.12,top,tz-r-.12,tx+r+.12,top+.3,tz+r+.12,'granite',dk);
    for(const s of ['S','E','W','N']){const F=wallFace(tx-r,tz-r,tx+r,tz+r,s);for(let y=2;y<top-3.2;y+=3.2)lmWin(M,F,r,y,.55,1.5,{arch:1,cols:1,rows:2,trim:dk});lmWin(M,F,r,top-2.6,Math.min(1.1,r*1.2),1.2,{arch:1,cols:2,rows:1,cell:'grille',gcol:dk,trim:dk});
      if(clock){fquad(M,F,r-.85,r+.85,top-5.2,top-3.5,.05,'clock');}}
    hipRoof(M,tx-r-.12,tz-r-.12,tx+r+.12,tz+r+.12,top+.3,clock?5.5:3.2,r+.12,r+.12,'roof',[.6,.62,.68]);M.lathe(tx,top+.3+(clock?5.5:3.2),tz,[[0,.08],[.3,.14],[.5,.04],[1,0]],6,'copper');};
  turret(x0+1.3,z1-1.1,1.3,19,true);turret(x1-.9,z1-.8,.9,13.5);turret(x0+.9,z0+.8,.9,13.5);turret(x1-.9,z0+.8,.9,13.5);
  for(let i=0;i<3;i++){const x=x0+4.6+i*(x1-x0-7.6)/2;M.box(x-.5,H+.2,z1-.9,x+.5,H+1.5,z1+.05,'granite',g);M.gable(x-.6,z1-.9,x+.6,z1+.12,H+1.5,.9,false,'roof',[.6,.62,.68],'granite');lmWin(M,wallFace(x-.5,z1-.9,x+.5,z1+.05,'S'),.5,H+.45,.5,.75,{arch:1,cols:1,rows:1,trim:dk});}};
