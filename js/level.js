"use strict";
/* River City Quest 3D: turns a 2D map from the original game into a 3D place.
   Every tile becomes geometry: brick rows become buildings, T becomes a tree, w becomes the James. */
const WALK='.,psSKk=-FEn^|1';
const GROUND={'.':'grass',',':'flowers','p':'cobble','s':'sidewalk','S':'steps','K':'rails','k':'rails','=':'planks','-':'planks','F':'floor','E':'steps','n':'sand','^':'floor','|':'floor'};
const WATER='w~';
const DUNGEONS=['quarry','pyramid','poe','carillon','tredegar','conserv','tunnel','libby','ruins'];
const LEVELS={};
function sceneData(id){return RCQ.maps[id]||RCQ.rooms[id]||null;}
function edgeLink(id,cells,h){const [cx,cy]=cells[0],[ar,co]=id.split(':'),[ax,ay]=co.split(',').map(Number);
  const n=cy==0?[ax,ay-1]:cy==h-1?[ax,ay+1]:cx==0?[ax-1,ay]:[ax+1,ay];return[id,ar+':'+n[0]+','+n[1]].sort().join('|');}
function buildLevel(id){
  const d=sceneData(id);if(!d)return null;
  const g=d.rows.map(r=>r.split('')),room=id.indexOf('ow:')!=0,lv={id,d,name:d.name,w:d.w,h:d.h,base:d.base,room,dungeon:room&&DUNGEONS.includes(d.area),
    g,dyn:[],glows:[],markers:{},doors:d.doors,lamps:d.lamps.map(([x,y])=>({tx:x,ty:y,lit:false})),spots:d.spots||[]};
  for(const k in d.reads)lv.markers[k]=d.reads[k];
  lv.props=room?[]:scatterProps(lv);
  // things that can change while you play live outside the static mesh
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){const c=g[y][x];
    if(c=='b')lv.dyn.push({kind:'bush',tx:x,ty:y,on:true,under:lv.base=='F'?'F':lv.base});
    if(c=='#')lv.dyn.push({kind:'block',tx:x,ty:y,on:true,under:'F',hx:x,hy:y});
    if(c=='z')lv.dyn.push({kind:'sprout',tx:x,ty:y,on:true,under:'1'});}
  (d.braz||[]).forEach(([x,y],i)=>lv.dyn.push({kind:'brazier',tx:x,ty:y,on:true,i,lit:false,under:'j'}));
  for(const dd of d.dyn){const [cx,cy]=dd.cells[0],edge=room&&(cy==0||cy==lv.h-1||cx==0||cx==lv.w-1);
    if(dd.closed=='L')lv.dyn.push({kind:'lock',cells:dd.cells,on:true,under:dd.open,tx:cx,ty:cy,link:edgeLink(id,dd.cells,lv.h)});
    else if(dd.closed=='H')lv.dyn.push({kind:'gate',cells:dd.cells,on:true,under:dd.open,tx:cx,ty:cy,solved:dd.solved});
    else if(dd.closed=='%')lv.dyn.push({kind:edge?'crack':'rubble',cells:dd.cells,on:true,under:dd.open,tx:cx,ty:cy,link:edge?edgeLink(id,dd.cells,lv.h):null});}
  for(const o of lv.dyn)for(const [x,y] of o.cells||[[o.tx,o.ty]])g[y][x]={bush:'b',lock:'L',gate:'H',crack:'%',rubble:'%',block:'#',sprout:'z',brazier:'j'}[o.kind];
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++)if(g[y][x]=='#'&&!lv.dyn.some(o=>o.kind=='block'&&o.tx==x&&o.ty==y))g[y][x]='F';
  return lv;}
function tileAt(lv,tx,ty){if(tx<0||ty<0||tx>=lv.w||ty>=lv.h)return null;return lv.g[ty][tx];}
function walkable(c){return c!=null&&WALK.includes(c);}
function setTile(lv,tx,ty,c){lv.g[ty][tx]=c;}

/* ---------- street clutter: hydrants, cans, boxes, signs and parked cars ---------- */
function scatterProps(lv){const rows=lv.d.rows,out=[],busy=new Set(),avoid=new Set();
  for(const k in lv.d.reads){const [x,y]=k.split(',').map(Number);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)avoid.add((x+a)+','+(y+b));}
  for(const [x,y] of (lv.d.spots||[]).concat((lv.d.doors||[]).map(d=>[d.tx,d.ty]),(lv.d.npcs||[]).map(n=>[n.tx,n.ty]),(lv.d.chests||[]).map(c=>[c.tx,c.ty])))for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)avoid.add((x+a)+','+(y+b));
  const c=(x,y)=>rows[y]&&rows[y][x],near=(x,y,r)=>out.some(p=>Math.abs(p.tx-x)<=r&&Math.abs(p.ty-y)<=r),seed=lv.d.ax*97+lv.d.ay*31;
  for(let y=1;y<lv.h-1;y++)for(let x=1;x<lv.w-1;x++){const t=c(x,y),h=hash(x,y,seed+5);if(avoid.has(x+','+y))continue;
    if(t=='s'||t=='p'&&lv.base!='p'){const wall=[[0,-1],[0,1],[-1,0],[1,0]].find(([dx,dy])=>'BX'.includes(c(x+dx,y+dy)));
      if(wall&&!near(x,y,3)){const r=h%11,kind=r==0?'hydrant':r==1?'can':r==2?'news':r==3?'mailbox':null;
        if(kind)out.push({kind,tx:x,ty:y,x:x*TS+TS/2+wall[0]*.62,z:y*TS+TS/2+wall[1]*.62,yaw:Math.atan2(-wall[0],-wall[1])});}
      const road=[[0,-1],[0,1],[-1,0],[1,0]].find(([dx,dy])=>c(x+dx,y+dy)=='p');if(t=='s'&&road&&h%17==0&&!near(x,y,4))out.push({kind:'sign',tx:x,ty:y,x:x*TS+TS/2+road[0]*.7,z:y*TS+TS/2+road[1]*.7,yaw:Math.atan2(road[0],road[1])});}
    if(t=='.'&&[[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>c(x+dx,y+dy)=='i')&&h%2==0&&!near(x,y,2))out.push({kind:'can',tx:x,ty:y,x:x*TS+TS/2,z:y*TS+TS/2,yaw:0});}
  // parked cars along the curb of a wide street
  const av1=new Set();for(const [x,y] of (lv.d.spots||[]).concat((lv.d.npcs||[]).map(n=>[n.tx,n.ty]),(lv.d.doors||[]).map(d=>[d.tx,d.ty])))for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)av1.add((x+a)+','+(y+b));
  let cars=0;for(let y=1;y<lv.h-1&&cars<4;y++)for(let x=2;x<lv.w-3&&cars<4;x++){if(av1.has(x+','+y)||av1.has((x+1)+','+y))continue;
    const curbN=c(x,y-1)=='s'&&c(x+1,y-1)=='s',curbS=c(x,y+1)=='s'&&c(x+1,y+1)=='s';if(c(x,y)!='p'||c(x+1,y)!='p'||!(curbN||curbS))continue;
    if(c(x,y+(curbN?1:-1))!='p'||c(x,y+(curbN?2:-2))!='p')continue;if(hash(x,y,seed+9)%3||out.some(p=>p.kind=='car'&&Math.abs(p.ty-y)<2&&Math.abs(p.tx-x)<6))continue;
    out.push({kind:'car',tx:x,ty:y,x:(x+1)*TS,z:y*TS+TS/2+(curbN?-.35:.35),yaw:Math.PI/2,solid:[1.75,.85],col:['#7a1818','#1c2a4a','#c4c6ca','#1e1e20','#e8e6e0','#4a4c52','#2e3e30'][hash(x,y,3)%7]});cars++;}
  return out;}
function propMesh(M,pr){const {x,z}=pr,R=(a,b,c,d,e,f,cells,col)=>{const cs=Math.cos(pr.yaw),sn=Math.sin(pr.yaw);const pts=[[a,c],[d,c],[a,f],[d,f]].map(([u,v])=>[x+u*cs+v*sn,z-u*sn+v*cs]);
    M.box(Math.min(...pts.map(p=>p[0])),b,Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),e,Math.max(...pts.map(p=>p[1])),cells,col);};
  switch(pr.kind){
    case'hydrant':{const r=rgb('#d83030'),y=rgb('#f2c14e');M.lathe(x,0,z,[[0,.2],[.08,.17],[.1,.13],[.6,.13],[.66,.15],[.72,.12],[.8,.07],[.86,0]],8,'white',r);M.tube([x-.24,.45,z],[x+.24,.45,z],.06,.06,6,'white',y,true);M.tube([x,.42,z],[x+Math.sin(pr.yaw)*.22,.42,z+Math.cos(pr.yaw)*.22],.07,.07,6,'white',y,true);break;}
    case'can':{const g=rgb('#2e6a48');M.lathe(x,0,z,[[0,.25],[.85,.28],[.9,.3],[.98,.26],[1.02,0]],10,'white',g);for(let k=0;k<10;k++){const a=k/10*6.283;M.box(x+Math.cos(a)*.27-.015,.12,z+Math.sin(a)*.27-.015,x+Math.cos(a)*.27+.015,.82,z+Math.sin(a)*.27+.015,'black');}break;}
    case'news':R(-.25,.0,-.2,.25,.95,.2,{top:'white',side:'white',south:'glass'},rgb('#3d63c8'));R(-.22,.95,-.18,.22,1.0,.18,'white',rgb('#2a4aa0'));break;
    case'mailbox':R(-.04,0,-.04,.04,.35,.04,'black');R(-.27,.35,-.22,.27,.95,.22,'white',rgb('#2a4aa0'));M.lathe(x,.95,z,[[0,.27],[.12,.2],[.18,0]],8,'white',rgb('#2a4aa0'),1,.82);R(-.12,.62,.2,.12,.68,.24,'white',rgb('#e8e4dc'));break;
    case'sign':M.lathe(x,0,z,[[0,.06],[2.9,.04]],5,'black');R(-.65,2.55,-.03,.65,2.85,.03,{top:'black',side:'sign2'});{const cs=Math.cos(pr.yaw+Math.PI/2),sn=Math.sin(pr.yaw+Math.PI/2);M.box(x-.03-Math.abs(sn)*.55,2.2,z-.03-Math.abs(cs)*.55,x+.03+Math.abs(sn)*.55,2.48,z+.03+Math.abs(cs)*.55,{top:'black',side:'sign2'});}break;
    case'car':{const t=sedan(pr.col,hash(Math.round(x*7),Math.round(z*7),3)),cs=Math.cos(pr.yaw),sn=Math.sin(pr.yaw);
      for(let k=0;k<t.count;k++){const u=t.pos[k*3],v=t.pos[k*3+2];t.pos[k*3]=x+u*cs+v*sn;t.pos[k*3+2]=z-u*sn+v*cs;const nu=t.nrm[k*3],nv=t.nrm[k*3+2];t.nrm[k*3]=nu*cs+nv*sn;t.nrm[k*3+2]=-nu*sn+nv*cs;}M.add(t);break;}
  }}
/* ---------- static geometry ---------- */
const BLOCKS='BX';
function isB(rows,x,y){const c=rows[y]&&rows[y][x];if(c=='B')return true;if(c!='e')return false;return[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>rows[y+b]&&rows[y+b][x+a]=='B');}
function compOf(lv){const comp=[],id={},rows=lv.d.rows;let n=0;
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){if(!isB(rows,x,y)||id[x+','+y]!=null)continue;const q=[[x,y]];id[x+','+y]=n;
    while(q.length){const [a,b]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(a+dx)+','+(b+dy);if(id[k]==null&&isB(rows,a+dx,b+dy)){id[k]=n;q.push([a+dx,b+dy]);}}}n++;}
  return id;}
function lmAt(lv,x,y){return(lv.d.lm||[]).find(L=>x>=L.x&&x<L.x+L.w&&y>=L.y&&y<L.y+L.h);}
// streets the way Richmond has them: cobbles in Shockoe and on Church Hill, asphalt elsewhere in town,
// brick sidewalks in the old neighborhoods, gravel and concrete paths in the parks
function streetKind(lv){if(lv._st)return lv._st;const n=lv.d.rows.join('').split('B').length-1,id=lv.d.id||'';
  return lv._st=['ow:3,1','ow:3,0'].includes(id)?'cobble':n>=30?'asphalt':'park';}
function groundCell(lv,c,x,y){if(!lv.room&&(c=='p'||c=='s')){const k=streetKind(lv);if(c=='p')return k=='park'?'gravel':k;return k=='park'?'sidewalk':'bricksw';}if(GROUND[c])return c=='.'&&hash(x,y,3)%3==0?'grass2':GROUND[c];const b=lv.base;return GROUND[b]?(b=='.'&&hash(x,y,3)%3==0?'grass2':GROUND[b]):'grass';}
function buildMesh(lv){
  const M=new Mesh(),Wm=new Mesh(),Fm=new Mesh(),Fr=new Mesh(),rows=lv.d.rows,comp=compOf(lv),H={};
  const src=(x,y)=>x<0||y<0||x>=lv.w||y>=lv.h?null:rows[y][x];
  const bh=(x,y)=>{const c=src(x,y);if(comp[x+','+y]!=null){const k=comp[x+','+y],v=hash(k,lv.d.ax*7+lv.d.ay,11)%3;return(2+v)*FLOOR_H;}if(c=='X'||c=='D'&&!lmAt(lv,x,y))return 2*FLOOR_H;return 0;};
  const room=lv.room,sty=lv.d.style||{},lit=room&&!lv.dungeon,tint=(h,base)=>{const c=rgb(h||'#808080');return c.map(v=>Math.min(1.35,v/base));};
  const flC=room?tint((sty.fl||[])[0],lit?.86:.37):null,wlC=room?tint((sty.wl||[])[0],lit?.86:.42):null,flCell=lit?(sty.wood?'woodfl':'tilefl'):'floor',wlCell=lit?(lv.d.area=='conserv'?'glass':'plaster'):'qwall';
  lv.flC=flC;
  for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){const c=rows[y][x],X0=x*TS,Z0=y*TS,X1=X0+TS,Z1=Z0+TS,cx=X0+TS/2,cz=Z0+TS/2,h=hash(x,y,lv.d.ax*31+lv.d.ay);
    // ground
    if(WATER.includes(c)){(c=='~'?Fm:Wm).floor(X0,Z0,X1,Z1,-.35,'white');
      for(const [dx,dy,a,b] of [[0,-1,[X1,Z0],[X0,Z0]],[0,1,[X0,Z1],[X1,Z1]],[-1,0,[X0,Z0],[X0,Z1]],[1,0,[X1,Z1],[X1,Z0]]]){const n=src(x+dx,y+dy);if(n!=null&&!WATER.includes(n)&&n!='='&&n!='-')M.wall(a[0],a[1],b[0],b[1],-1.2,0,room?'qwall':'dirt',null,.7);}
      M.floor(X0,Z0,X1,Z1,-1.2,room?'floor':'dirt',[.5,.5,.6]);
      if(!room){for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){const n=src(x+dx,y+dy);if(n==null||WATER.includes(n)||n=='='||n=='-')continue;const w=.16;
          const q=dy==-1?[X0,Z0,X1,Z0+w]:dy==1?[X0,Z1-w,X1,Z1]:dx==-1?[X0,Z0,X0+w,Z1]:[X1-w,Z0,X1,Z1];Fr.floor(q[0],q[1],q[2],q[3],-.31,'foam',[.62,.66,.68]);}
        const bridgeNear=[[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>'=-'.includes(src(x+dx,y+dy)||'.'));
        if(!bridgeNear&&(c=='~'?h%3==0:h%11==0)){const ox=cx+((h>>4)%5-2)*.18,oz=cz+((h>>7)%5-2)*.18,r=.45+(h%3)*.15;const bm=new Mesh();boulder(bm,ox,oz,h,r*1.2);for(let i=1;i<bm.pos.length;i+=3)bm.pos[i]-=.55;M.add(bm);
          Fr.disc(ox,-.3,oz,r*1.35,8,'foam',[.95,.98,1]);}}
      continue;}
    if(c=='='||c=='-'){M.floor(X0,Z0,X1,Z1,.06,'planks');M.box(X0+.1,-1.2,Z0+.1,X0+.4,.06,Z0+.4,'wood');
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=src(x+dx,y+dy);if(n&&WATER.includes(n)){const ax=dx?(dx>0?X1-.15:X0):X0,az=dy?(dy>0?Z1-.15:Z0):Z0;M.box(ax,.06,az,dx?ax+.15:X1,1,dy?az+.15:Z1,'wood');}}
      Wm.floor(X0,Z0,X1,Z1,-.35,'white');continue;}
    if(c=='_'){M.floor(X0,Z0,X1,Z1,-3,'black');for(const [dx,dy,a,b] of [[0,-1,[X1,Z0],[X0,Z0]],[0,1,[X0,Z1],[X1,Z1]],[-1,0,[X0,Z0],[X0,Z1]],[1,0,[X1,Z1],[X1,Z0]]]){const n=src(x+dx,y+dy);if(n!='_'&&n!='|')M.wall(a[0],a[1],b[0],b[1],-3,0,wlCell,[wlC[0]*.4,wlC[1]*.4,wlC[2]*.4]);}continue;}
    M.floor(X0,Z0,X1,Z1,0,room?flCell:groundCell(lv,c,x,y),room?(c=='E'?[.8,.8,.8]:flC):null);
    if(!room)groundDetail(M,lv,src,c,x,y,X0,Z0,X1,Z1,cx,cz,h);
    // things standing on the tile
    switch(c){
      case'B':{const ht=bh(x,y),k=comp[x+','+y],kind=hash(k,5,lv.d.ay)%4,hd=hood(lv),rowh=hd=='fan'||hd=='jward'||hd=='cary',look=wallLook(rowh?k*31+(x>>1)+7:k,lv),same=(a,b)=>comp[a+','+b]===k;
        if(hd=='fan')mansardTile(M,x,y,ht,same,hash(x>>1,y,k));else{M.floor(X0,Z0,X1,Z1,ht,'roof');M.box(X0,ht,Z0,X1,ht+.45,Z1,{top:'granite',side:look[0]},look[1],{bottom:1});}
        facade(M,lv,x,y,ht,bh,kind,h,look);if(hash(k,x,y)%9==0){const ox=X0+.5+(h%3)*.3,oz=Z0+.5+((h>>3)%3)*.3;M.box(ox,ht,oz,ox+.55,ht+1.5,oz+.45,'brick');M.box(ox-.06,ht+1.5,oz-.06,ox+.61,ht+1.6,oz+.51,'granite');}
        break;}
      case'X':case'D':{if(lmAt(lv,x,y))break;const ht=bh(x,y);if(room){M.box(X0,0,Z0,X1,ht,Z1,{top:'roof',side:'qwall'},null,{bottom:1},true);break;}
        // a building you can walk into: same masonry, windows and cornice as its neighbors, with a real door on the street side
        const look=wallLook(hash(x>>2,y>>2,77),lv);if(hood(lv)=='chill'){const sm=(a,b)=>{const q=src(a,b);return(q=='X'||q=='D')&&!lmAt(lv,a,b);};gableTile(M,x,y,ht,sm,look,[[1,.5,.45],[.55,.75,.6],[.8,.82,.86],[.5,.5,.54]][hash(x>>2,y>>2,5)%4],hash(x,y,31));}
        else{M.floor(X0,Z0,X1,Z1,ht,'roof');M.box(X0,ht,Z0,X1,ht+.45,Z1,{top:'granite',side:look[0]},look[1],{bottom:1});}
        facade(M,lv,x,y,ht,bh,2,h,look,c=='D'?faceDir(lv,x,y):null);break;}
      case'W':{const edge=x==0||y==0||x==lv.w-1||y==lv.h-1,wh=y==lv.h-1?.8:edge?(lit?3.4:4):2.2;M.box(X0,0,Z0,X1,wh,Z1,{top:wh<1||!edge?wlCell:'black',side:wlCell},wlC,{bottom:1},wh>1);
        if(lit&&edge&&wh>1)M.box(X0-.01,wh-.2,Z0-.01,X1+.01,wh,Z1+.01,'white',[wlC[0]*.8,wlC[1]*.8,wlC[2]*.8],{bottom:1});break;}
      case'T':{const kind=h%5;if(kind<2)conifer(M,cx+((h>>3)%5-2)*.08,cz+((h>>6)%5-2)*.08,h,.95+(h>>9)%4*.06);else deciduous(M,cx,cz,h,.9+(h>>9)%4*.07);break;}
      case'r':{const sz=.55+(h%4)*.14;boulder(M,cx,cz,h,sz);break;}
      case'R':M.box(X0,0,Z0,X1,1,Z1,{top:'stonewall',side:'stone'},null,{bottom:1});break;
      case'f':{const n=(dx,dy)=>src(x+dx,y+dy)=='f',ew=n(1,0)||n(-1,0),ns=n(0,1)||n(0,-1);
        const run=(ax0,az0,ax1,az1)=>{M.box(Math.min(ax0,ax1)-.04,1.05,Math.min(az0,az1)-.04,Math.max(ax0,ax1)+.04,1.13,Math.max(az0,az1)+.04,'black');M.box(Math.min(ax0,ax1)-.04,.18,Math.min(az0,az1)-.04,Math.max(ax0,ax1)+.04,.25,Math.max(az0,az1)+.04,'black');
          const L=Math.hypot(ax1-ax0,az1-az0),k=Math.round(L/.25);for(let i=0;i<=k;i++){const t=i/k,px=ax0+(ax1-ax0)*t,pz=az0+(az1-az0)*t;M.box(px-.025,0,pz-.025,px+.025,1.22,pz+.025,'black');M.cone(px,1.22,pz,.05,1.34,0,4,'black');}};
        if(ew||!ns)run(n(-1,0)?X0:cx,cz,n(1,0)?X1:cx,cz);if(ns)run(cx,n(0,-1)?Z0:cz,cx,n(0,1)?Z1:cz);
        M.lathe(cx,0,cz,[[0,.09],[1.3,.08],[1.36,.11],[1.42,0]],6,'black');break;}
      case'l':{M.lathe(cx,0,cz,[[0,.2],[.25,.18],[.35,.1],[.6,.07],[2.5,.06],[2.6,.1]],6,'black');M.box(cx-.22,2.6,cz-.22,cx+.22,2.68,cz+.22,'black');
        M.lathe(cx,2.68,cz,[[0,.16],[.4,.24],[.55,.26]],4,'glass',null,1,1);M.lathe(cx,3.23,cz,[[0,.3],[.12,.28],[.32,.06],[.42,0]],4,'black');M.sphere(cx,3.68,cz,.05,4,2,'black');lv.glows.push([cx,2.95,cz,x,y]);break;}
      case'i':{// a park bench at real size: seat 45 cm up, back to about 85 cm
        const s0=Z0+.62;for(let k=0;k<4;k++)M.box(X0+.25,.42,s0+k*.11,X1-.25,.45,s0+.09+k*.11,'planks',[.62,.42,.26]);for(let k=0;k<3;k++)M.box(X0+.25,.52+k*.11,s0-.06+k*.012,X1-.25,.6+k*.11,s0-.03+k*.012,'planks',[.62,.42,.26]);
        for(const ex of [X0+.38,X1-.38]){M.box(ex-.03,0,s0-.07,ex+.03,.86,s0-.02,'black',[.08,.08,.08]);M.box(ex-.03,0,s0+.4,ex+.03,.42,s0+.45,'black',[.08,.08,.08]);M.box(ex-.03,.39,s0-.07,ex+.03,.42,s0+.45,'black',[.08,.08,.08]);M.box(ex-.025,.6,s0-.04,ex+.025,.63,s0+.42,'black',[.08,.08,.08]);}break;}
      case'a':M.box(cx-.05,0,cz-.05,cx+.05,.8,cz+.05,'black');M.disc(cx,.8,cz,.5,6,'white',[.9,.9,.85]);break;
      case'M':{const fd=faceDir(lv,x,y);M.box(cx-.07,0,cz-.07,cx+.07,1.2,cz+.07,'black');
        if(fd[0])M.box(cx-.06,1,cz-.7,cx+.06,2.1,cz+.7,{top:'black',side:'black',east:'sign',west:'sign'});else M.box(cx-.7,1,cz-.06,cx+.7,2.1,cz+.06,{top:'black',side:'black',south:'sign',north:'sign'});break;}
      case'Y':M.box(X0+.2,0,Z0+.2,X1-.2,1.2,Z1-.2,'marble');statue(M,cx,1.2,cz);break;
      case'y':M.cone(cx,0,cz,.95,.5,.95,8,'marble');Wm.disc(cx,.42,cz,.85,8,'white');M.box(cx-.1,.4,cz-.1,cx+.1,1.4,cz+.1,'marble');break;
      case'x':M.box(cx-.3,0,cz-.15,cx+.3,.9,cz+.15,'stone');break;
      case'E':M.box(X0,-.02,Z0,X1,.02,Z1,'steps');break;
      case'U':M.box(X0,0,Z0,X1,2.4,Z1,{top:'concrete',side:'concrete'},null,{bottom:1},true);break;
      case'e':if(comp[x+','+y]!=null){const ht=bh(x,y);for(const [dx,dy,a,b] of [[0,1,[X0,Z1],[X1,Z1]],[0,-1,[X1,Z0],[X0,Z0]],[1,0,[X1,Z1],[X1,Z0]],[-1,0,[X0,Z0],[X0,Z1]]]){const nh=bh(x+dx,y+dy);if(nh>=ht)continue;M.wall(a[0],a[1],b[0],b[1],nh,ht,'brick',null,.86,(i,j)=>j==0&&nh==0?'mural':'brick');}M.floor(X0,Z0,X1,Z1,ht,'roof');}
        else M.box(X0,0,Z0,X1,2.4,Z1,{top:'concrete',side:'mural'},null,{bottom:1});break;
      case't':M.box(cx-.45,0,cz-.45,cx+.45,.12,cz+.45,{top:'mulch',side:'granite'});deciduous(M,cx,cz,h,.5,.1);break;
      case'q':M.box(cx-.25,0,cz-.2,cx+.25,1,cz+.2,{top:'white',side:'white',south:'glass'},rgb('#d83030'));break;
      case'u':M.box(cx-.45,0,cz-.45,cx+.45,.6,cz+.45,{top:'dirt',side:'wood'});for(let k=0;k<4;k++)tuftAt(M,cx-.2+(k%2)*.4,cz-.2+(k>>1)*.4,.45,'bloom',h+k);break;
      case'G':M.box(cx-.5,0,cz-.5,cx+.5,.6,cz+.5,'stone');M.box(cx-.3,.6,cz-.3,cx+.3,3.2,cz+.3,{top:'stone',side:'marble'},[.85,.85,.85]);M.cone(cx,3.2,cz,.42,3.8,0,4,'marble',[.85,.85,.85],.785);break;
      case'Q':M.box(X0+.2,0,Z0+.2,X1-.2,1.2,Z1-.2,'marble');statue(M,cx,1.2,cz);break;
      case'+':M.lathe(cx,0,cz,[[0,.22],[.15,.18],[.9,.16],[1,.24],[1.15,.24],[1.25,0]],6,'black');M.sphere(cx,1.25,cz,.12,6,3,'gold');break;
      case'V':{const wood=!!sty.wood;M.box(X0,0,Z0+.3,X1,1.1,Z1-.3,{top:wood?'wood':'marble',side:'wood'},null,{bottom:1});M.box(X0-.02,1.1,Z0+.22,X1+.02,1.2,Z1-.22,wood?'wood':'marble');break;}
      case'h':M.box(X0+.1,0,Z0+.5,X1-.1,.5,Z1-.3,'seat');M.box(X0+.1,.5,Z1-.45,X1-.1,1.3,Z1-.25,'seat');break;
      case'O':if(lv.d.area=='byrd'){M.box(X0-.2,0,Z0,X1+.2,1.3,Z1,{top:'wood',side:'wood'});for(let k=0;k<6;k++)M.box(X0+k*.32-.1,1.3,Z0+.2,X0+k*.32+.05,2.3+(k%3)*.4,Z0+.35,'gold');}
        else{M.box(X0+.25,0,Z0+.3,X1-.25,2.2,Z1-.3,{top:'black',side:'black',south:'arcade'});M.box(X0+.25,.9,Z1-.55,X1-.25,1.05,Z1-.1,'white',[.3,.3,.35]);}break;
      case'g':M.box(cx-.4,0,cz-.4,cx+.4,.9,cz+.4,'wood');M.box(cx-.4,.9,cz-.4,cx+.4,1.8,cz+.4,{top:'case',side:'case'});M.sphere(cx,1.15,cz,.18,6,4,'gold',null,1.2);break;
      case'Z':if(src(x-1,y)!='Z'&&src(x,y-1)!='Z'){let w=0,hh=0;while(src(x+w,y)=='Z')w++;while(src(x,y+hh)=='Z')hh++;const x1=X0+w*TS,z1=Z0+hh*TS,mz=(Z0+z1)/2;
        M.tube([X0+.4,1.6,mz],[x1-1.4,1.6,mz],1.1,1.1,10,'engine');M.box(x1-1.8,.6,Z0+.3,x1-.1,3.6,z1-.3,{top:'black',side:'engine'});M.tube([X0+1.4,2.6,mz],[X0+1.4,3.8,mz],.3,.38,8,'black');
        for(let k=0;k<4;k++)M.tube([X0+.9+k*1.5,.55,Z0+.2],[X0+.9+k*1.5,.55,z1-.2],.55,.55,10,'black');M.box(X0,0,Z0+.1,x1,.4,z1-.1,'black');M.box(x1-1.6,1.6,z1-.32,x1-.6,2.6,z1-.28,'white',[.9,.75,.3]);M.cone(X0+.2,.2,mz,1,1.2,.1,4,'black',null,.785);}break;
      case'^':M.box(X0+.2,0,Z0+.2,X1-.2,.08,Z1-.2,'gold');M.box(X0+.5,.08,Z0+.5,X1-.5,.12,Z1-.5,'white',[1,.95,.6]);break;
    }
  }
  for(const L of lv.d.lm||[])landmark(M,lv,L);
  for(const pr of lv.props||[])propMesh(M,pr);
  // doorways on whatever building face is open to the street
  for(const dr of lv.doors||[]){if(!room&&rows[dr.ty][dr.tx]=='D'&&!lmAt(lv,dr.tx,dr.ty))continue;if(!room&&typeof LMK!='undefined'&&lmAt(lv,dr.tx,dr.ty)&&LMK[lmAt(lv,dr.tx,dr.ty).art])continue;const fd=faceDir(lv,dr.tx,dr.ty),X0=dr.tx*TS,Z0=dr.ty*TS,cx=X0+TS/2,cz=Z0+TS/2,o=.03,w=.75;
    if(fd[1]==1)M.quad([cx-w,0,Z0+TS+o],[cx+w,0,Z0+TS+o],[cx+w,2.4,Z0+TS+o],[cx-w,2.4,Z0+TS+o],'planks',[.22,.15,.1]);
    else if(fd[1]==-1)M.quad([cx+w,0,Z0-o],[cx-w,0,Z0-o],[cx-w,2.4,Z0-o],[cx+w,2.4,Z0-o],'planks',[.22,.15,.1]);
    else if(fd[0]==1)M.quad([X0+TS+o,0,cz+w],[X0+TS+o,0,cz-w],[X0+TS+o,2.4,cz-w],[X0+TS+o,2.4,cz+w],'door');
    else M.quad([X0-o,0,cz-w],[X0-o,0,cz+w],[X0-o,2.4,cz+w],[X0-o,2.4,cz-w],'door');}
  return{main:M,water:Wm,foam:Fm,froth:Fr};}
function tuftAt(M,x,z,s,cell,yaw){const c=Math.cos(yaw)*s,n=Math.sin(yaw)*s;M.swayV=.035;M.quad([x-c,0,z-n],[x+c,0,z+n],[x+c,s*.9,z+n],[x-c,s*.9,z-n],cell);M.quad([x+n,0,z-c],[x-n,0,z+c],[x-n,s*.9,z+c],[x+n,s*.9,z-c],cell);M.swayV=0;}
function groundDetail(M,lv,src,c,x,y,X0,Z0,X1,Z1,cx,cz,h){
  if(c==',')flowerbed(M,X0,Z0,X1,Z1,h);
  if(false){const pth=[[0,-1],[0,1],[-1,0],[1,0]].find(([dx,dy])=>'ps'.includes(src(x+dx,y+dy)||'#'));if(pth){const ox=cx+pth[0]*.45,oz=cz+pth[1]*.45,r=.85;M.quad([ox-r,.012,oz+r],[ox+r,.012,oz+r],[ox+r,.012,oz-r],[ox-r,.012,oz-r],'worn');}}
  if(c=='s')for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){const n=src(x+dx,y+dy);if(n!='p'&&n!='K')continue;const w=.16,cr=[.86,.84,.8];
    const q=dy==-1?[X0,Z0,X1,Z0+w]:dy==1?[X0,Z1-w,X1,Z1]:dx==-1?[X0,Z0,X0+w,Z1]:[X1-w,Z0,X1,Z1];M.box(q[0],0,q[1],q[2],.15,q[3],'curb',null,{bottom:1});
    const g=dy==-1?[X0,Z0-.28,X1,Z0]:dy==1?[X0,Z1,X1,Z1+.28]:dx==-1?[X0-.28,Z0,X0,Z1]:[X1,Z0,X1+.28,Z1];if(n=='p')M.floor(g[0],g[1],g[2],g[3],.008,'cobble',[.55,.53,.56]);}}
const FLOOR_H=3.3;
// each building gets its own masonry: red, dark or tawny brick, or painted stucco
// which neighborhood a map is, for how its buildings are built
const HOODS={'ow:1,1':'fan','ow:-1,0':'fan','ow:2,0':'jward','ow:3,0':'chill','ow:4,0':'chill','ow:3,1':'shockoe','ow:4,1':'shockoe','ow:3,2':'shockoe','ow:0,1':'cary','ow:0,0':'works','ow:2,3':'works'};
function hood(lv){return lv._hood||(lv._hood=HOODS[lv.d.id]||'town');}
const CLAPW=[1.04,1.14,1.74];// clapboard painted white
const HOODLOOK={fan:[['brick',[1,1,1]],['brick',[.82,.72,.68]],['plaster',[.95,.92,.82]],['brick',[1.05,.92,.84]],['plaster',[.72,.78,.84]],['brick',[.9,.8,.78]],['brick',[.96,.86,.8]]],
  jward:[['brick',[1,1,1]],['brick',[.88,.78,.74]],['brick',[1.02,.9,.8]],['brick',[.8,.74,.72]],['plaster',[.9,.86,.76]]],
  chill:[['brick',[1,1,1]],['clap',CLAPW],['clap',[1,1,1]],['clap',[.76,.96,1.5]],['brick',[.9,.82,.8]],['clap',CLAPW]],
  shockoe:[['brick',[.8,.7,.66]],['brick',[.92,.8,.74]],['brick',[.7,.64,.62]],['brick',[1,.92,.86]]],
  cary:[['plaster',[1,.86,.7]],['plaster',[.74,.9,.86]],['plaster',[.95,.9,.6]],['plaster',[.8,.82,.95]],['brick',[1,1,1]],['plaster',[.97,.96,.92]],['plaster',[.95,.74,.7]]],
  works:[['brick',[1.05,.98,.85]],['concrete',[1,1,1]],['brick',[.85,.8,.78]],['concrete',[.85,.87,.9]]]};
function wallLook(k,lv){const L=HOODLOOK[hood(lv)],h=hash(k,lv.d.ax*13+lv.d.ay,17);if(L)return L[h%L.length];
  return[[ 'brick',[1,1,1]],['brick',[.82,.76,.74]],['brick',[1.04,.9,.8]],['brick',[.9,.84,.86]],['plaster',[.95,.9,.78]],['plaster',[.78,.8,.78]],['brick',[.96,.94,.9]]][h%7];}
// a pitched roof over one tile of a building: the ridge runs east-west down the middle of however deep the building is here
function gableTile(M,x,y,ht,same,look,rc,h){const X0=x*TS,Z0=y*TS,X1=X0+TS,Z1=Z0+TS,cx=X0+1;let a=0,b=0;while(same(x,y-a-1))a++;while(same(x,y+b+1))b++;
  const D=(a+b+1)*TS,pitch=Math.min(.7,2.7/(D/2)),zs=Z0-a*TS,hf=z=>ht+pitch*Math.min(z-zs,zs+D-z),zm=zs+D/2,cut=zm>Z0+.01&&zm<Z1-.01?[Z0,zm,Z1]:[Z0,Z1],ov=.28;
  for(let i=0;i<cut.length-1;i++){let za=cut[i],zb=cut[i+1];if(i==0&&a==0)za-=ov;if(i==cut.length-2&&b==0)zb+=ov;M.quad([X0,hf(zb),zb],[X1,hf(zb),zb],[X1,hf(za),za],[X0,hf(za),za],'tin',rc);
    za=cut[i];zb=cut[i+1];for(const sx of [-1,1]){if(same(x+sx,y)){let a2=0,b2=0;while(same(x+sx,y-a2-1))a2++;while(same(x+sx,y+b2+1))b2++;if(a2==a&&b2==b)continue;}const xx=sx>0?X1:X0;
      if(sx>0)M.quad([xx,ht,zb],[xx,ht,za],[xx,hf(za),za],[xx,hf(zb),zb],look[0],look[1]);else M.quad([xx,ht,za],[xx,ht,zb],[xx,hf(zb),zb],[xx,hf(za),za],look[0],look[1]);}}
  if(h%5==0){const zc=Math.max(Z0+.3,Math.min(Z1-.3,zm)),top=hf(zc)+1.15;M.box(cx-.32,ht,zc-.26,cx+.32,top,zc+.26,'brick');M.box(cx-.38,top,zc-.32,cx+.38,top+.1,zc+.32,'granite');}
  else if(b==0&&D>=3.9&&h%2==0){const zf=Z1-.5,zr=Z1-1.5,y0=hf(zf)-.05,y1=y0+.95;M.box(cx-.42,y0,zr,cx+.42,y1,zf,look[0],look[1]);M.gable(cx-.5,zr,cx+.5,zf+.08,y1,.4,false,'tin',rc);M.quad([cx-.3,y0+.15,zf+.01],[cx+.3,y0+.15,zf+.01],[cx+.3,y1-.08,zf+.01],[cx-.3,y1-.08,zf+.01],'pane');
    for(const u of [-.33,.3])M.box(cx+u,y0+.12,zf,cx+u+.03,y1-.05,zf+.03,'white');M.box(cx-.33,y0+.1,zf,cx+.33,y0+.15,zf+.05,'white');}}
// the Fan's false mansard: a steep slate skirt around the top of the block, with dormers toward the street
function mansardTile(M,x,y,ht,same,h){const X0=x*TS,Z0=y*TS,X1=X0+TS,Z1=Z0+TS,cx=X0+1,e={n:!same(x,y-1),s:!same(x,y+1),w:!same(x-1,y),e:!same(x+1,y)},inn=.5,yt=ht+1.45,tx0=X0+(e.w?inn:0),tx1=X1-(e.e?inn:0),tz0=Z0+(e.n?inn:0),tz1=Z1-(e.s?inn:0),sl=[.62,.62,.7];
  M.quad([tx0,yt,tz1],[tx1,yt,tz1],[tx1,yt,tz0],[tx0,yt,tz0],'roof');
  if(e.s)M.quad([X0,ht,Z1],[X1,ht,Z1],[tx1,yt,tz1],[tx0,yt,tz1],'roof',sl);if(e.n)M.quad([X1,ht,Z0],[X0,ht,Z0],[tx0,yt,tz0],[tx1,yt,tz0],'roof',sl);if(e.e)M.quad([X1,ht,Z1],[X1,ht,Z0],[tx1,yt,tz0],[tx1,yt,tz1],'roof',sl);if(e.w)M.quad([X0,ht,Z0],[X0,ht,Z1],[tx0,yt,tz1],[tx0,yt,tz0],'roof',sl);
  for(const [on,zf,dz] of [[e.s,Z1-.1,-1],[e.n,Z0+.1,1]])if(on&&h%2==0){const za=Math.min(zf,zf+dz*.45),zb=Math.max(zf,zf+dz*.45);M.box(cx-.4,ht+.2,za,cx+.4,ht+1.2,zb,'white',[.93,.92,.88]);M.gable(cx-.48,za-.05,cx+.48,zb+.05,ht+1.2,.38,false,'roof',sl,'white');
    const zq=zf-dz*.012;M.quad([cx-.28,ht+.32,zq],[cx+.28,ht+.32,zq],[cx+.28,ht+1.1,zq],[cx-.28,ht+1.1,zq],'pane');M.box(cx-.015,ht+.32,Math.min(zq,zq-dz*.02),cx+.015,ht+1.1,Math.max(zq,zq-dz*.02),'white');}}
function facadeCell(x,y,dx,dy,f,nh,kind){if(f==0&&nh==0){if(kind==0&&dy==1)return'storefront';if(hash(x,y,dx+3*dy+7)%3==0)return'door';}return hash(x+f,y,dx+dy*5+f)%5==0?'panelit':'pane';}
// the outside walls of a building tile, built around real openings: windows and doors are holes in the
// wall with reveals, set back frames and glass, so they read as recessed the way real masonry does
function facade(M,lv,x,y,ht,bh,kind,h,look,entry){const X0=x*TS,Z0=y*TS,trim=kind==2?[.18,.24,.2]:[.93,.92,.88],stone=[.9,.88,.84],k=hash(x,y,5),wc=look[0],wcol=look[1];
  const doorCol=[[.16,.22,.18],[.08,.08,.09],[.42,.12,.1],[.15,.2,.32],[.35,.25,.16]][k%5],rev=wcol.map(v=>v*.8),hd=hood(lv),PW=[.94,.93,.9],iron=[.07,.07,.08];
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const nh=bh(x+dx,y+dy);if(nh>=ht)continue;
    // u runs along the wall seen from outside (0..TS), d sticks out of it
    const W=(u,yy,d)=>{if(dy){const zf=dy>0?Z0+TS:Z0;return[X0+(dy>0?u:TS-u),yy,zf+dy*d];}const xf=dx>0?X0+TS:X0;return[xf+dx*d,yy,Z0+(dx>0?TS-u:u)];};
    const fb=(u0,u1,y0,y1,d0,d1,cells,col)=>{const a=W(u0,y0,d0),b=W(u1,y1,d1);M.box(Math.min(a[0],b[0]),y0,Math.min(a[2],b[2]),Math.max(a[0],b[0]),y1,Math.max(a[2],b[2]),cells,col);};
    // a flat piece of wall facing out (or along a reveal), textured at true scale and split on texture seams
    const face=(u0,u1,y0,y1,d,cell,col)=>{if(u1-u0<1e-3||y1-y0<1e-3)return;for(let ya=y0;ya<y1-1e-6;){const yb=Math.min(y1,(Math.floor(ya/TS+1e-6)+1)*TS),[c0,,c1]=cellUV(cell),L=Math.floor(c0),fv=yy=>1-(yy/TS-Math.floor(ya/TS+1e-6));
        const uu=u=>L+.002+(u/TS)*.996,p=[W(u0,ya,d),W(u1,ya,d),W(u1,yb,d),W(u0,yb,d)];M.tri(p[0],p[1],p[2],[uu(u0),fv(ya)],[uu(u1),fv(ya)],[uu(u1),fv(yb)],col,col,col);M.tri(p[0],p[2],p[3],[uu(u0),fv(ya)],[uu(u1),fv(yb)],[uu(u0),fv(yb)],col,col,col);ya=yb;}};
    const side=(u,y0,y1,d0,d1,cell,col)=>{const a=W(u,y0,d0),b=W(u,y0,d1),c=W(u,y1,d1),e=W(u,y1,d0);M.quad(a,b,c,e,cell,col);};
    const flat=(u0,u1,yy,d0,d1,cell,col)=>{const a=W(u0,yy,d0),b=W(u1,yy,d0),c=W(u1,yy,d1),e=W(u0,yy,d1);M.quad(a,b,c,e,cell,col);};
    // a wall panel from y0 to y1 with a hole (u0..u1, v0..v1) set back by depth
    const panel=(y0,y1,o)=>{if(!o){face(0,TS,y0,y1,0,wc,wcol);return;}const {u0,u1,v0,v1,dep}=o;
      face(0,u0,y0,y1,0,wc,wcol);face(u1,TS,y0,y1,0,wc,wcol);face(u0,u1,y0,v0,0,wc,wcol);face(u0,u1,v1,y1,0,wc,wcol);
      side(u0,v0,v1,0,-dep,'plaster',rev);side(u1,v0,v1,-dep,0,'plaster',rev);flat(u0,u1,v0,-dep,0,'granite',stone);flat(u1,u0,v1,-dep,0,'plaster',rev);};
    const floors=Math.round(ht/FLOOR_H),f0=Math.ceil(nh/FLOOR_H-1e-6);
    if(f0*FLOOR_H>nh)face(0,TS,nh,Math.min(ht,f0*FLOOR_H),0,wc,wcol);
    // base course, belt courses and a bracketed cornice
    if(nh==0)fb(-.02,TS+.02,0,.42,0,.05,'granite',[.72,.7,.68]);
    const nc=(lv.d.rows[y+dy]||'')[x+dx]||'#',walk=nh==0&&(WALK.includes(nc)||'f,ltMaubq'.includes(nc));
    if(hd=='shockoe'){// corbelled brick: each course steps out a little further
      for(let q=0;q<3;q++)fb(-.03,TS+.03,ht-.42+q*.14,ht-.28+q*.14,0,.06+q*.06,wc,wcol.map(v=>v*(.82+q*.05)));for(let q=0;q<7;q++)fb(.06+q*.28,.2+q*.28,ht-.6,ht-.42,0,.07,wc,wcol.map(v=>v*.78));}
    else if(hd=='works'){fb(-.03,TS+.03,ht-.2,ht,0,.08,'concrete');}
    else{fb(-.06,TS+.06,ht-.5,ht-.08,0,.34,'white',stone);fb(-.06,TS+.06,ht-.08,ht,0,.4,'white',stone);for(let q=0;q<5;q++)fb(.12+q*.4,.24+q*.4,ht-.72,ht-.5,0,.2,'white',stone);
      if(hd=='jward'||hd=='fan')for(const u of [.02,TS-.14]){fb(u,u+.12,ht-1.15,ht-.5,0,.14,'white',stone);fb(u,u+.12,ht-.78,ht-.5,0,.3,'white',stone);}
      if(hd=='cary'&&walk){fb(.25,TS-.25,ht,ht+.55,-.22,0,wc,wcol);fb(.2,TS-.2,ht+.55,ht+.65,-.26,.05,'white',stone);}}
    for(let f=f0;f<floors;f++){const yb=f*FLOOR_H,yt=Math.min(ht,yb+FLOOR_H),isEntry=entry&&entry[0]==dx&&entry[1]==dy&&f==0,c=isEntry?'door':entry&&f==0?'pane':(hd=='cary'&&f==0&&walk&&hash(x,y,dx+3*dy+7)%4)?'storefront':facadeCell(x,y,dx,dy,f,nh,kind);if(f>f0)fb(-.02,TS+.02,yb-.07,yb+.05,0,.05,'granite',stone);
      if(c=='storefront'){const o={u0:.12,u1:1.88,v0:.55,v1:2.75,dep:.16};panel(yb,yt,o);fb(.12,1.88,o.v0,o.v1,-.14,-.13,'pane');
        for(const u of [.12,1.88-.07])fb(u,u+.07,o.v0,o.v1,-.13,-.06,'white',doorCol);fb(.12,1.88,o.v1-.06,o.v1,-.13,-.06,'white',doorCol);fb(.12,1.88,o.v0,o.v0+.08,-.13,-.04,'white',doorCol);fb(.97,1.03,o.v0,o.v1,-.13,-.07,'white',doorCol);
        fb(.05,1.95,2.85,3.2,0,.1,'sign2',[.9,.88,.82]);const ac=rgb(['#6a2a2a','#2a4a3a','#2a3a5a','#5a4a2a'][k%4]);
        const a1=W(0,3.0,0),a2=W(TS,3.0,0),a3=W(TS,2.55,1.1),a4=W(0,2.55,1.1),a5=W(TS,2.35,1.1),a6=W(0,2.35,1.1);const aw=hd=='cary'?(k%2?'awning':'awning2'):'cloth',awc=hd=='cary'?null:ac;M.quad(a1,a2,a3,a4,aw,awc);M.quad(a4,a3,a5,a6,aw,awc);}
      else if(c=='door'){const o={u0:.55,u1:1.45,v0:yb,v1:yb+2.9,dep:.3};panel(yb,yt,o);fb(.55,1.45,yb,yb+2.42,-.3,-.25,'planks',doorCol);for(const [a,b] of [[.62,.97],[1.03,1.38]])for(const [c0,c1] of [[.25,1.15],[1.3,2.25]])fb(a,b,yb+c0,yb+c1,-.25,-.235,'planks',doorCol.map(v=>v*1.15));
        fb(.55,1.45,yb+2.42,yb+2.48,-.3,-.2,'white',trim);fb(.58,1.42,yb+2.48,yb+2.88,-.27,-.26,'pane');fb(1.26,1.31,yb+1.15,yb+1.22,-.25,-.2,'brass');
        fb(.4,1.6,yb,yb+.17,0,.8,'granite',stone);fb(.4,1.6,yb+.17,yb+.34,0,.45,'granite',stone);fb(.48,1.52,yb+2.9,yb+3.08,0,.12,'granite',stone);}
      else if(hd=='works'){// steel factory sash: wide, many small panes
        const v0=yb+1,v1=yb+2.75,o={u0:.2,u1:1.8,v0,v1,dep:.14};panel(yb,yt,o);fb(.2,1.8,v0,v1,-.12,-.11,c);for(let q=0;q<=4;q++)fb(.2+q*.4-.015,.2+q*.4+.015,v0,v1,-.11,-.085,'white',iron);for(let q=0;q<=3;q++)fb(.2,1.8,v0+q*(v1-v0)/3-.015,v0+q*(v1-v0)/3+.015,-.11,-.085,'white',iron);fb(.14,1.86,v0-.1,v0,0,.07,'concrete');}
      else{const v0=yb+(f==0?.95:.9),v1=v0+1.75,o={u0:.52,u1:1.48,v0,v1,dep:.24};panel(yb,yt,o);fb(.52,1.48,v0,v1,-.2,-.19,c);
        for(const u of [.52,1.48-.06])fb(u,u+.06,v0,v1,-.19,-.14,'white',trim);fb(.52,1.48,v0,v0+.07,-.19,-.13,'white',trim);fb(.52,1.48,v1-.06,v1,-.19,-.14,'white',trim);
        fb(.52,1.48,(v0+v1)/2-.03,(v0+v1)/2+.03,-.19,-.15,'white',trim);fb(.985,1.015,v0,(v0+v1)/2,-.19,-.16,'white',trim);fb(.985,1.015,(v0+v1)/2,v1,-.19,-.16,'white',trim);
        fb(.44,1.56,v0-.09,v0,0,.09,'granite',stone);
        if(hd=='shockoe'){for(let q=0;q<6;q++){const u=.44+q*.187,yy=v1+.02+.13*Math.sin(Math.PI*(q+.5)/6);fb(u,u+.18,yy,yy+.2,0,.035,wc,wcol.map(v=>v*.72));}// a low brick arch over each window
          if(k%3==0){fb(.14,.5,v0,v1,0,.04,'tin',[.3,.32,.33]);fb(1.5,1.86,v0,v1,0,.04,'tin',[.3,.32,.33]);}if(f>f0)fb(.16,.3,yb+.1,yb+.24,0,.03,'black',iron);}
        else fb(.47,1.53,v1,v1+.2,0,.03,'granite',stone);
        if(hd=='jward'&&f>0)fb(.44,1.56,v1+.2,v1+.3,0,.12,'white',stone);
        if(kind==3){fb(.12,.44,v0,v1,.0,.05,'planks',[.17,.26,.19]);fb(1.56,1.88,v0,v1,0,.05,'planks',[.17,.26,.19]);}}
      if(f==0&&walk&&(hd=='fan'||hd=='jward')){const pd=.84,dk=.34,pr=2.95;fb(0,TS,0,dk,0,pd,'planks',[.6,.56,.5]);fb(-.04,TS+.04,pr,pr+.16,0,pd+.1,'white',PW);
        {const a=W(-.04,pr+.42,0),b=W(TS+.04,pr+.42,0),c2=W(TS+.04,pr+.16,pd+.1),e=W(-.04,pr+.16,pd+.1);M.quad(e,c2,b,a,'tin',hd=='fan'?[.75,.5,.48]:[.5,.55,.56]);}
        if(c=='door')fb(.45,1.55,0,dk/2,pd,pd+.28,'granite',stone);
        for(const u of [0,TS]){const p=W(u,dk,pd-.1);if(hd=='fan'){M.box(p[0]-.11,dk,p[2]-.11,p[0]+.11,dk+.12,p[2]+.11,'white',PW);M.lathe(p[0],dk+.12,p[2],[[0,.085],[1.2,.08],[2.3,.068],[2.34,.1],[2.49,.1]],10,'column',PW);}
          else{M.box(p[0]-.03,dk,p[2]-.03,p[0]+.03,pr,p[2]+.03,'black',iron);const s=u?-1:1;for(const [w,hh] of [[.34,.3],[.2,.5]]){const q0=W(u,pr-hh,pd-.1),q1=W(u+s*w,pr-hh,pd-.1),q2=W(u+s*w,pr,pd-.1),q3=W(u,pr,pd-.1);M.quad(q0,q1,q2,q3,'grille',iron);}}}
        if(hd=='jward'){const q0=W(0,pr-.22,pd-.1),q1=W(TS,pr-.22,pd-.1),q2=W(TS,pr,pd-.1),q3=W(0,pr,pd-.1);M.quad(q0,q1,q2,q3,'bars',iron);}
        if(c!='door'){if(hd=='fan'){fb(.1,TS-.1,dk+.72,dk+.79,pd-.14,pd-.06,'white',PW);fb(.1,TS-.1,dk+.08,dk+.13,pd-.13,pd-.07,'white',PW);for(let q=0;q<11;q++)fb(.16+q*.165,.195+q*.165,dk+.13,dk+.72,pd-.12,pd-.08,'white',PW);}
          else{const q0=W(0,dk,pd-.1),q1=W(TS,dk,pd-.1),q2=W(TS,dk+.8,pd-.1),q3=W(0,dk+.8,pd-.1);M.quad(q0,q1,q2,q3,'bars',iron);fb(0,TS,dk+.8,dk+.84,pd-.13,pd-.07,'black',iron);}}}
      if(f==0&&walk&&hd=='chill'&&c=='door'){// Greek Revival: a small square-columned portico at the door
        for(const u of [.36,1.64]){const p=W(u,.34,.72);M.box(p[0]-.09,.34,p[2]-.09,p[0]+.09,2.9,p[2]+.09,'white',PW);M.box(p[0]-.12,2.78,p[2]-.12,p[0]+.12,2.9,p[2]+.12,'white',PW);M.box(p[0]-.12,.34,p[2]-.12,p[0]+.12,.44,p[2]+.12,'white',PW);}
        fb(.2,1.8,2.9,3.2,0,.88,'white',PW);fb(.14,1.86,3.2,3.28,0,.94,'white',PW);const a=W(.14,3.28,.94),b=W(1.86,3.28,.94),t=W(1,3.62,.94),a2=W(.14,3.28,0),b2=W(1.86,3.28,0),t2=W(1,3.62,0);ltri(M,a,b,t,'white',PW);M.quad(a2,a,t,t2,'tin',[.5,.5,.54]);M.quad(b,b2,t2,t,'tin',[.5,.5,.54]);}
      if(kind==1&&f==1&&nh==0&&dy==1&&hd!='fan'&&hd!='jward'){fb(0,TS,yb,yb+.1,0,.75,'granite',[.4,.4,.42]);fb(0,TS,yb+1.0,yb+1.05,.7,.75,'black',[.08,.08,.08]);for(let q=0;q<9;q++)fb(q*.24,q*.24+.025,yb+.1,yb+1.0,.71,.74,'black',[.08,.08,.08]);}}
    if(hash(x*3+dx,y*3+dy,11)%5==0)fb(TS-.12,TS-.04,0,ht-.5,.02,.1,'tin',[.5,.5,.52]);}}
function faceDir(lv,x,y){for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const c=lv.d.rows[y+dy]&&lv.d.rows[y+dy][x+dx];if(c&&WALK.includes(c))return[dx,dy];}return[0,1];}
function statue(M,x,y,z){const s=[.62,.62,.66];M.box(x-.25,y,z-.15,x-.05,y+.9,z+.15,'stone',s);M.box(x+.05,y,z-.15,x+.25,y+.9,z+.15,'stone',s);M.box(x-.32,y+.9,z-.2,x+.32,y+1.7,z+.2,'stone',s);
  M.box(x-.45,y+.95,z-.12,x-.32,y+1.6,z+.12,'stone',s);M.box(x+.32,y+1.3,z-.12,x+.45,y+2.1,z+.12,'stone',s);M.box(x-.18,y+1.7,z-.18,x+.18,y+2.1,z+.18,'stone',s);}
function landmark0(M,lv,L){const X0=L.x*TS,Z0=L.y*TS,X1=X0+L.w*TS,Z1=Z0+L.h*TS,cx=(X0+X1)/2;
  switch(L.art){
    case'capitol':{M.box(X0,0,Z0,X1,1,Z1,{top:'marble',side:'stone'},null,{bottom:1},true);const bz=Z1-3.2;M.box(X0+1,1,Z0+.5,X1-1,7,bz,{top:'roof',side:'marble'},null,{bottom:1},true);
      M.gable(X0+.6,Z0+.2,X1-.6,Z1-.2,7,3,false,'roof',null,'marble');M.box(X0+.6,6.4,bz,X1-.6,7,Z1-.2,'marble');
      for(let i=0;i<6;i++){const x=X0+2.2+i*(L.w*TS-4.4)/5;M.cone(x,1,Z1-1.2,.38,6.4,.32,6,'column');}
      break;}
    case'belltower':M.box(X0+.3,0,Z0+.3,X1-.3,8,Z1-.3,{top:'roof',side:'brick'},null,{bottom:1},true);M.box(X0+.1,8,Z0+.1,X1-.1,9.6,Z1-.1,{top:'white',side:'marble'},null,{bottom:1});M.cone(cx,9.6,(Z0+Z1)/2,1.4,11,0,4,'copper',null,.785);break;
    case'station':{const tx=X1-3*TS;M.box(X0,0,Z0,tx,7,Z1,{top:'roof',side:'brick',south:'brickwin'},null,{bottom:1},true);M.gable(X0,Z0,tx,Z1,7,2.6,true,'tin',null,'brick');
      M.box(tx,0,Z0+.6,X1,14,Z1-.6,{top:'roof',side:'brick'},null,{bottom:1},true);
      M.box(tx-.05,11,Z0+.55,X1+.05,13.4,Z1-.55,{top:'roof',side:'clock'},null,{bottom:1,top:1});M.cone((tx+X1)/2,14,(Z0+Z1)/2,3.6,17.5,0,4,'tin',null,.785);break;}
    case'market':{for(let i=X0;i<=X1;i+=4)for(const z of [Z0+.3,Z1-.3])M.box(i-.12,0,z-.12,i+.12,3,z+.12,'black');M.gable(X0-.3,Z0-.3,X1+.3,Z1+.3,3,1.8,true,'copper',[.7,1,.75]);
      for(let i=X0+2;i<X1-2;i+=4)M.box(i,0,Z0+1,i+2,.9,Z1-1,{top:'gold',side:'wood'});break;}
    case'church':{const bx0=X0+.4,bx1=X1-.4;M.box(bx0,0,Z0+3,bx1,4.5,Z1,{top:'roof',side:'clap'},null,{bottom:1},true);M.gable(bx0,Z0+3,bx1,Z1,4.5,2.6,false,'roof',null,'white');
      const tx0=cx-1.4,tx1=cx+1.4;M.box(tx0,0,Z0+.4,tx1,8,Z0+3.2,{top:'roof',side:'white'},null,{bottom:1},true);M.box(tx0+.3,8,Z0+.7,tx1-.3,10,Z0+2.9,{top:'white',side:'marble'},null,{bottom:1});
      M.cone(cx,10,Z0+1.8,1.2,14.5,0,6,'white');break;}
    case'ruins':{for(let i=0;i<L.w;i++){const hh=1+hash(i,L.y,9)%4;M.box(X0+i*TS,0,Z0+.2,X0+(i+1)*TS,hh*1.1,Z0+.9,{top:'rubble',side:'brick'},null,{bottom:1});const h2=1+hash(i,L.y,5)%3;M.box(X0+i*TS,0,Z1-.9,X0+(i+1)*TS,h2,Z1-.2,{top:'rubble',side:'brick'},null,{bottom:1});}
      M.box(X0,0,Z0+.2,X0+.7,3,Z1-.2,{top:'rubble',side:'brick'},null,{bottom:1});M.box(X1-.7,0,Z0+.2,X1,2.2,Z1-.2,{top:'rubble',side:'brick'},null,{bottom:1});M.floor(X0,Z0,X1,Z1,.02,'rubble');break;}
    case'grandstand':{M.box(X0,0,Z0,X1,1,Z1,'concrete');for(let r=0;r<4;r++)M.box(X0+.3,1+r*.7,Z0+.2+r*.8,X1-.3,1.7+r*.7,Z1,{top:'seat',side:'concrete'},null,{bottom:1});
      M.box(X0,0,Z0,X0+.4,5,Z1,'concrete');M.box(X1-.4,0,Z0,X1,5,Z1,'concrete');M.box(X0,4.6,Z0,X1,5,Z1,'roof');for(const x of [X0+1,X1-1])M.box(x-.1,0,Z0+.3,x+.1,9,Z0+.5,'black'),M.box(x-.8,9,Z0+.2,x+.8,10,Z0+.6,{top:'black',side:'lampglow'});break;}
    case'store':{const col=rgb(L.c||'#c8b48c');M.box(X0,0,Z0,X1,10,Z1,{top:'roof',side:'stone',south:'stone'},col,{bottom:1},true);
      M.box(X0,3.05,Z1,X1,3.25,Z1+1.1,'cloth',[.42,.16,.14]);M.box(X0,9.6,Z0,X1,10.2,Z1+.35,'white',[.9,.88,.84]);break;}
    case'shelter':M.box(X0,2.4,Z0+.2,X1,2.6,Z1,'white',rgb('#3d63c8'));for(const x of [X0+.1,X1-.2])M.box(x,0,Z0+.3,x+.1,2.4,Z0+.4,'black');M.box(X0+.1,0,Z0+.25,X1-.1,2.3,Z0+.3,'glass');M.box(X0+.4,.5,Z0+.4,X1-.4,.6,Z0+.9,'wood');break;
    case'hippodrome':{M.box(X0,0,Z0,X1,8,Z1,{top:'roof',side:'white'},rgb('#e8d8b0'),{bottom:1},true);M.box(X0+1,3,Z1,X1-3,4.6,Z1+1.2,{top:'black',side:'marquee'});
      M.box(X1-3,2,Z1,X1-1.6,8.8,Z1+.6,{top:'black',side:'marquee'},rgb('#d83040'));break;}
    case'vmfa':{M.box(X0,0,Z0,X1,1,Z1,'marble');M.box(X0+.5,1,Z0,X1-.5,7,Z1-2,{top:'roof',side:'marble'},null,{bottom:1},true);for(let i=0;i<8;i++){const x=X0+1.4+i*(L.w*TS-2.8)/7;M.cone(x,1,Z1-1,.34,6.5,.3,6,'column');}
      M.box(X0+.5,6.5,Z1-2,X1-.5,7.3,Z1-.2,'marble');break;}
    case'byrd':{M.box(X0,0,Z0,X1,6,Z1,{top:'roof',side:'brick'},rgb('#d89070'),{bottom:1},true);M.box(cx-.8,2,Z1,cx+.8,10,Z1+.5,{top:'black',side:'marquee'},rgb('#3d63c8'));M.box(X0+.5,2.4,Z1,X1-.5,3.4,Z1+1,{top:'black',side:'marquee'});break;}
    case'carillon':{const cz=(Z0+Z1)/2;M.box(cx-2,0,cz-2,cx+2,1,cz+2,'stone');M.box(cx-1.6,1,cz-1.6,cx+1.6,12,cz+1.6,{top:'roof',side:'brick'},rgb('#e8c8a0'),{bottom:1},true);
      M.box(cx-1.8,12,cz-1.8,cx+1.8,15,cz+1.8,{top:'roof',side:'bars'},rgb('#c8a078'),{bottom:1});M.box(cx-1.9,15,cz-1.9,cx+1.9,15.5,cz+1.9,'stone');M.cone(cx,15.5,cz,1.9,18,0,4,'copper',null,.785);M.lathe(cx,12.6,cz,[[0,.8],[1.3,.6],[1.8,.2]],8,'gold');break;}
    case'mansion':{M.box(X0,0,Z0+.5,X1-2.5,6.5,Z1,{top:'roof',side:'stone'},rgb('#c8b89a'),{bottom:1},true);M.gable(X0,Z0+.5,X1-2.5,Z1,6.5,2.4,true,'roof',rgb('#a84a3a'),'stone');
      M.lathe(X1-1.3,0,Z0+2,[[0,1.2],[8.5,1.2]],8,'stone',rgb('#c8b89a'));M.cone(X1-1.3,8.5,Z0+2,1.4,11,0,8,'roof',rgb('#a84a3a'));break;}
    case'pyramid':{const cz=(Z0+Z1)/2;for(let k=0;k<6;k++){const r=(L.w*TS/2)*(1-k/6);M.box(cx-r,k*1.2,cz-r*.9,cx+r,(k+1)*1.2,cz+r*.9,{top:'stone',side:'stone'},[.7,.7,.72],{bottom:1});}M.cone(cx,7.2,cz,.6,8.4,0,4,'stone',null,.785);break;}
    case'birdcage':{const cz=(Z0+Z1)/2;M.box(cx-1.3,0,cz-1.3,cx+1.3,.4,cz+1.3,'stone');M.box(cx-1.1,.4,cz-1.1,cx+1.1,3.2,cz+1.1,{top:'black',side:'bars'});M.lathe(cx,3.2,cz,[[0,1.3],[.6,.9],[1.4,0]],8,'black');M.box(cx-.5,.4,cz-.8,cx+.5,1.3,cz+.8,'stone',[.8,.8,.85]);break;}
    case'steamboat':{const cz=(Z0+Z1)/2;M.lathe(cx,-.3,cz,[[0,.0],[.2,1],[1,1.2]],8,'white',null,L.w*TS/2.4,1);M.box(X0+1,.9,cz-1,X1-2.5,2.6,cz+1,{top:'white',side:'white'},[.95,.95,.92]);M.box(X0+1.5,2.6,cz-.8,X1-3.5,3.8,cz+.8,'white',[.9,.9,.88]);
      for(const x of [X0+3,X0+4.4])M.tube([x,2.6,cz],[x,6,cz],.25,.25,6,'black');M.tube([X1-2.4,1,cz-1.3],[X1-2.4,1,cz+1.3],1.4,1.4,10,'white',rgb('#a82030'));break;}
    case'stonehouse':{M.box(X0,0,Z0+1,X1,5,Z1,{top:'roof',side:'stone'},null,{bottom:1},true);M.gable(X0,Z0+1,X1,Z1,5,2.2,true,'roof',null,'stone');M.box(X0,0,Z1-.1,X1,.3,Z1+1.2,'wood');for(let i=X0+.5;i<X1;i+=2.4)M.box(i,0,Z1+1,i+.15,3,Z1+1.15,'wood');M.box(X0,3,Z1,X1,3.15,Z1+1.2,'wood');break;}
    case'trolley':{const cz=(Z0+Z1)/2;M.box(X0,.4,cz-.8,X1,2.4,cz+.8,{top:'white',side:'glass'},rgb('#2e7d4f'));M.box(X0-.1,.4,cz-.85,X1+.1,1.2,cz+.85,'white',rgb('#2e7d4f'));M.box(X0,2.4,cz-.9,X1,2.6,cz+.9,'white',rgb('#f2c14e'));break;}
    case'scimuseum':{M.box(X0,0,Z0+.5,X1,6,Z1,{top:'roof',side:'marble'},rgb('#e4dcc8'),{bottom:1},true);M.sphere(cx,6,(Z0+Z1)/2,L.w*TS*.28,10,5,'copper',null,1,1,1,.5,1);for(let i=0;i<5;i++){const x=X0+2+i*(L.w*TS-4)/4;M.cone(x,0,Z1-.6,.35,5.5,.3,6,'column');}break;}
    case'vmhc':{M.box(X0,0,Z0,X1,7,Z1-1.6,{top:'roof',side:'marble'},null,{bottom:1},true);M.gable(X0,Z0,X1,Z1-.2,7,2,true,'roof',null,'marble');for(let i=0;i<6;i++){const x=X0+1.5+i*(L.w*TS-3)/5;M.cone(x,0,Z1-.8,.33,7,.3,6,'column');}break;}
    case'sauers':{M.box(X0,0,Z0+1,X1,5,Z1,{top:'roof',side:'brickwin'},null,{bottom:1},true);M.box(X0+.5,5,Z0+1.6,X1-.5,9,Z0+1.9,{top:'black',side:'marquee'},rgb('#f8c060'));for(const x of [X0+1,X1-1])M.box(x,5,Z0+1.4,x+.1,9,Z0+1.6,'black');break;}
    case'ashecenter':{M.floor(X0,Z0,X1,Z1,.02,'white',rgb('#3a8ac8'));M.box(X0+1,0,(Z0+Z1)/2-.05,X1-1,1,(Z0+Z1)/2+.05,{top:'white',side:'fence'});for(const [a,b,c2,d2] of [[X0,Z0,X1,Z0+.1],[X0,Z1-.1,X1,Z1],[X0,Z0,X0+.1,Z1],[X1-.1,Z0,X1,Z1]])M.box(a,0,b,c2,3,d2,{top:'black',side:'fence'});break;}
    case'speedway':{M.floor(X0,Z0,X1,Z1,.03,'cobble',[.4,.4,.44]);M.lathe(cx,0,(Z0+Z1)/2,[[0,L.h*TS*.32],[.05,L.h*TS*.32]],12,'grass',null,L.w/L.h*1.1,1,true);
      for(let r=0;r<5;r++)M.box(X0,r*.9,Z0-.2+r*.7,X1,r*.9+.9,Z0+.6+r*.7,{top:'seat',side:'concrete'});break;}
    case'agecroft':{M.box(X0,0,Z0+.5,X1,5.5,Z1,{top:'roof',side:'clap'},rgb('#f0e4c8'),{bottom:1},true);for(let i=X0;i<=X1;i+=1.2)M.box(i,0,Z1,i+.18,5.5,Z1+.04,'wood');for(const y of [1.8,3.6])M.box(X0,y,Z1,X1,y+.18,Z1+.04,'wood');
      for(const x of [X0+2,cx,X1-2])M.gable(x-1.6,Z0+.5,x+1.6,Z1,5.5,3,false,'roof',rgb('#6a3a2a'),'clap');M.box(X1-2,5,Z0+1,X1-1.3,8.5,Z0+1.7,'brick');break;}
    case'siegel':{M.box(X0,0,Z0,X1,6,Z1,{top:'roof',side:'concrete'},rgb('#5a5a66'),{bottom:1},true);M.lathe(cx,6,(Z0+Z1)/2,[[0,L.w*TS*.45],[1.6,L.w*TS*.32],[2.2,0]],10,'roof',null,1,.55);M.box(X0+1,4,Z1,X1-1,5,Z1+.1,'white',rgb('#f2c14e'));break;}
    case'marshall':{M.box(X0,0,Z0,X1,7,Z1,{top:'roof',side:'brickwin'},null,{bottom:1},true);M.gable(X0,Z0,X1,Z1,7,2.4,true,'roof',null,'brick');for(const x of [X0+.6,X1-1.2])M.box(x,7,Z0+.8,x+.6,10,Z0+1.4,'brick');break;}
    case'sallybell':{M.box(X0,0,Z0,X1,4.5,Z1,{top:'roof',side:'storefront'},null,{bottom:1},true);M.box(X0,2.6,Z1,X1,3.4,Z1+.15,{top:'black',side:'marquee'},rgb('#fff0e0'));break;}
    case'armory':{M.box(X0,0,Z0,X1,6,Z1,{top:'roof',side:'brick'},null,{bottom:1},true);for(let i=X0;i<X1;i+=1.2)M.box(i,6,Z0,i+.7,6.8,Z1,'brick');M.box(cx-1.6,0,Z1-.6,cx+1.6,9,Z1+.4,{top:'roof',side:'brick'});for(let i=cx-1.6;i<cx+1.6;i+=.8)M.box(i,9,Z1-.6,i+.5,9.6,Z1+.4,'brick');break;}
    case'stage':{M.box(X0,0,Z0,X1,1.2,Z1,'wood');for(const x of [X0+.2,X1-.4])M.box(x,1.2,Z0+.2,x+.2,5,Z0+.4,'black');M.box(X0,5,Z0,X1,5.4,Z0+1.4,'black');M.box(X0+.3,1.2,Z0+.1,X1-.3,5,Z0+.3,'white',[.15,.1,.25]);break;}
    default:M.box(X0,0,Z0,X1,4,Z1,{top:'roof',side:'stone'},null,{bottom:1},true);
  }}

// a mid-size sedan, about 4.5 m long, lofted from cross sections along its length (x forward)
function sedan(col,seed){const M=new Mesh(),c=cloth(col,.25),k=c;
  const loft=(S,cellTop,cellSide,colr,cap)=>{for(let i=0;i<S.length-1;i++){const [x0,w0,b0,t0]=S[i],[x1,w1,b1,t1]=S[i+1];
      M.quad([x0,t0,w0],[x1,t1,w1],[x1,t1,-w1],[x0,t0,-w0],typeof cellTop=='function'?cellTop(i):cellTop,colr);
      M.quad([x0,b0,w0],[x1,b1,w1],[x1,t1,w1],[x0,t0,w0],cellSide,colr);M.quad([x1,b1,-w1],[x0,b0,-w0],[x0,t0,-w0],[x1,t1,-w1],cellSide,colr);M.quad([x0,b0,-w0],[x1,b1,-w1],[x1,b1,w1],[x0,b0,w0],'black',[.05,.05,.05]);}
    if(cap)for(const S0 of [S[0],S[S.length-1]]){const [x,w,b,t]=S0;M.quad([x,b,w],[x,b,-w],[x,t,-w],[x,t,w],cap,colr);}};
  loft([[-2.28,.76,.4,.78],[-2.2,.86,.32,.9],[-1.7,.9,.3,.98],[-.9,.91,.28,1.0],[1.1,.91,.28,.98],[1.75,.89,.3,.9],[2.18,.82,.34,.8],[2.27,.74,.4,.72]],'paint','paint',k,'paint');
  loft([[1.05,.82,.97,1.0],[.25,.74,.97,1.42],[-.85,.74,.97,1.45],[-1.5,.8,.97,1.02]],i=>i==1?'paint':'pane','pane',[1,1,1]);
  M.box(-.9,1.43,-.74,.25,1.45,.74,'paint',k);M.box(2.24,.45,-.6,2.29,.68,.6,'grille',[.5,.5,.5]);
  for(const s of [-1,1]){M.box(2.2,.66,s*.5,2.28,.76,s*.78,'chrome');M.box(-2.29,.6,s*.48,-2.24,.72,s*.76,'white',[.7,.05,.05]);M.box(.3,.82,s*.92,.4,.86,s*.94,'chrome');
    M.box(-1.9,.5,s*.91,1.95,.54,s*.915,'chrome');}
  M.box(-2.3,.28,-.86,-2.18,.42,.86,'black',[.08,.08,.09]);M.box(2.2,.28,-.86,2.32,.42,.86,'black',[.08,.08,.09]);
  for(const [u,v] of [[-1.38,1],[1.38,1],[-1.38,-1],[1.38,-1]]){M.tube([u,.33,v*.72],[u,.33,v*.93],.33,.33,14,'tire',null,false);M.disc(u,.33,0,.01,4,'white');const r=new Mesh();r.disc(0,0,0,.2,12,'chrome');r.disc(0,-.005,0,.32,14,'tire');
    for(let i=0;i<r.count;i++){const a=r.pos[i*3],b=r.pos[i*3+1],cz=r.pos[i*3+2];r.pos[i*3]=u+a;r.pos[i*3+1]=.33+cz;r.pos[i*3+2]=v*.935+b*v;const n1=r.nrm[i*3+1];r.nrm[i*3]=0;r.nrm[i*3+1]=0;r.nrm[i*3+2]=v*Math.abs(n1);}M.add(r);}
  return M;}

// real windows on the big landmark buildings: any tall, wide block gets framed windows at true floor heights
function fenestrate(M,x0,z0,x1,z1,y0,y1,seed){const trim=[.93,.92,.88],stone=[.9,.88,.84],FH=FLOOR_H*1.05;
  const faces=[[x0,z1,x1,z1,0,1],[x1,z0,x0,z0,0,-1],[x1,z1,x1,z0,1,0],[x0,z0,x0,z1,-1,0]];
  for(const [ax,az,bx,bz,nx,nz] of faces){const len=Math.hypot(bx-ax,bz-az),n=Math.floor(len/2.4);if(n<1)continue;const step=len/n,P=(u,y,d)=>[ax+(bx-ax)*u/len+nx*d,y,az+(bz-az)*u/len+nz*d];
    const fb=(u0,u1,ya,yb,d0,d1,cell,col)=>{const a=P(u0,ya,d0),b=P(u1,yb,d1);M.box(Math.min(a[0],b[0]),ya,Math.min(a[2],b[2]),Math.max(a[0],b[0]),yb,Math.max(a[2],b[2]),cell,col);};
    for(let f=0;(f+1)*FH<=y1-y0+.4;f++)for(let i=0;i<n;i++){if(f==0&&nz==1&&Math.abs((i+.5)*step-len/2)<step*.6)continue;const uc=(i+.5)*step,v0=y0+f*FH+(f==0?1.05:.95),v1=v0+1.8;if(v1>y1-.5)continue;
      const lit=hash(i,f,seed+nx*3+nz*5)%5==0?'panelit':'pane';fb(uc-.5,uc+.5,v0,v1,0,.03,lit);for(const u of [uc-.56,uc+.5])fb(u,u+.06,v0-.04,v1+.04,0,.08,'white',trim);
      fb(uc-.56,uc+.56,v1,v1+.06,0,.08,'white',trim);fb(uc-.6,uc+.6,v0-.1,v0,0,.14,'granite',stone);fb(uc-.6,uc+.6,v1+.06,v1+.24,0,.06,'granite',stone);fb(uc-.5,uc+.5,(v0+v1)/2-.025,(v0+v1)/2+.025,0,.06,'white',trim);}}}
function landmark(M,lv,L){if(typeof LMK!='undefined'&&LMK[L.art]){LMK[L.art](M,L.x*TS,L.y*TS,(L.x+L.w)*TS,(L.y+L.h)*TS);return;}const box=M.box;let seed=hash(L.x,L.y,lv.d.ax*7+lv.d.ay);
  M.box=function(x0,y0,z0,x1,y1,z1,cells,col,skip,tile){if(cells&&typeof cells=='object'){const c=Object.assign({},cells);for(const k of ['side','south','north','east','west'])if(c[k]=='brickwin'||c[k]=='brickwin2')c[k]='brick';cells=c;}else if(cells=='brickwin')cells='brick';
    box.call(this,x0,y0,z0,x1,y1,z1,cells,col,skip,tile);const side=typeof cells=='object'?cells.side:cells;
    if(tile&&y0<=.01&&y1-y0>=4.4&&x1-x0>=3.5&&z1-z0>=3.5&&['brick','stone','marble','white','clap','concrete','storefront'].includes(side))fenestrate(this,x0,z0,x1,z1,y0,y1,seed++);};
  try{landmark0(M,lv,L);}finally{M.box=box;}}
