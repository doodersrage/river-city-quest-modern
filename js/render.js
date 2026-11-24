"use strict";
/* River City Quest Modern: matrices, models with poses, the people and creatures, billboards and glows.
   The GPU side lives in gfx.js. */
/* ---------- matrices (column-major, like WebGL wants) ---------- */
const M4={
  id:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  mul(a,b){const o=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2);return[t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0];},
  look(e,c,u){let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(...z);z=z.map(v=>v/l);let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(...x);x=x.map(v=>v/l);
    const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1];},
  tr:(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1],
  ry:a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];},
  rx:a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];},
  rz:a=>{const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];},
  sc:s=>[s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1]};

function drawModel(parts,base,pose,opt){
  if(parts.skel){const b=pose&&pose.body;if(b){if(b.t)base=M4.mul(base,M4.tr(b.t[0],b.t[1],b.t[2]));if(b.y)base=M4.mul(base,M4.ry(b.y));if(b.x)base=M4.mul(base,M4.rx(b.x));}
    const bones=skelPose(parts.skel,pose,frame);parts.skel.last=bones;gl.uniformMatrix4fv(U.uBones,false,bones);gl.uniform1f(U.uSkin,1);for(const pt of parts)drawVAO(meshGL(pt.mesh),base,atlasTex,opt);gl.uniform1f(U.uSkin,0);return;}for(const pt of parts){let m=M4.mul(base,M4.tr(pt.pivot[0],pt.pivot[1],pt.pivot[2]));const ps=pose&&pose[pt.name];
  if(ps){if(ps.t)m=M4.mul(m,M4.tr(ps.t[0],ps.t[1],ps.t[2]));if(ps.y)m=M4.mul(m,M4.ry(ps.y));if(ps.x)m=M4.mul(m,M4.rx(ps.x));if(ps.z)m=M4.mul(m,M4.rz(ps.z));}
  drawVAO(meshGL(pt.mesh),m,atlasTex,opt);}}
function envLook(){const e=envLook0();return typeof weatherLook=='function'?weatherLook(e):e;}
function envLook0(){const dk=dark();if(lv.room)return{fog:[10,30],fogCol:[.03,.03,.05],amb:.5};
  const day=[.66,.72,.78],night=[.05,.06,.12],dusk=[.62,.45,.42],h=hour(),ds=h>=17&&h<20?Math.sin((h-17)/3*Math.PI):0;
  const fc=day.map((v,i)=>v*(1-dk)+night[i]*dk).map((v,i)=>v*(1-ds*.5)+dusk[i]*ds*.5);return{fog:[14-dk*5,40-dk*12],fogCol:fc,amb:1-dk*.66};}
function lightsNow(){const L=[],dk=lv.room?1:dark();
  if(st.items.lantern&&(dk>.3||lv.room))L.push([p.x,2,p.z,lv.room?11:9,[1,.78,.45].map(v=>v*(p.raise>0?1.3:.9))]);
  for(const b of bombs)if(b.t<20)L.push([b.x,1,b.z,8,[1,.6,.2]]);
  for(const o of lv.dyn)if(o.kind=='brazier'&&o.lit)L.push([o.tx*TS+TS/2,2,o.ty*TS+TS/2,9,[1,.6,.25]]);
  if(dk>.2){const gl=lv.glows.filter(g=>lampLit(g)).map(g=>[g,Math.hypot(g[0]-p.x,g[2]-p.z)]).sort((a,b)=>a[1]-b[1]).slice(0,6);for(const [g] of gl)L.push([g[0],g[1]-.5,g[2],8,[1,.82,.5].map(v=>v*dk)]);}
  return L;}
function lampLit(g){const L=lv.lamps.find(l=>l.tx==g[3]&&l.ty==g[4]);return!L||L.lit;}
function shadowAt(x,z,s){if(PASS=='shadow'||Q().shadow&&!lv.room&&SUN.col[0]>.05)return;const sh=getModel('shadow',()=>propModel('shadow'));gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(U.uAlpha,.4);gl.depthMask(false);
  drawModel(sh,M4.mul(M4.tr(x,0,z),M4.sc(s||1)));gl.uniform1f(U.uAlpha,1);gl.depthMask(true);gl.disable(gl.BLEND);}
// what a person is doing this frame: the stride counter and whether they're moving, plus any limbs the game wants placed by hand
function humanPose(walk,moving,extra){return Object.assign({_walk:walk,_moving:moving},extra||{});}
function npcModel(n){return getModel('npc:'+n.who+':'+n.tx+','+n.ty,()=>{const h=hash(n.tx,n.ty,n.who.length),skins=['#e0ac8a','#c68863','#8d5a3b','#f1c6a8','#a06a48','#5c3a26'],pants=['#3c3c54','#5a4a3a','#2e3a5e','#4a4a4a'];
  const ROLE={archivist:['glasses','book'],quiz:['clipboard'],rats:['apron'],henry:['tricorn','coat'],lamps:['pole','coat'],racer:['helmet'],kayaker:['helmet','vest'],cleanup:['gloves']},acc=ROLE[n.chal||n.talk]||[];
  const capless=(h%3!=1)||acc.includes('tricorn')||acc.includes('helmet')?!acc.includes('tricorn'):false,style=['short','long','bun','short','long'][(h>>7)%5];
  if(acc.includes('tricorn')||acc.includes('helmet'))return humanoid({hat:'#1e1c24',shirt:n.shirt?n.shirt[0]:'#58a850',skin:skins[h%6],pants:pants[(h>>3)%4],hair:['#3a2414','#1a1410','#c89048','#7a4a24','#8a8a90'][(h>>5)%5],capless:true,style:'short',acc,coat:n.talk=='henry'?'#2a3a6a':'#4a3a2a',helm:n.talk=='racer'?'#e83048':'#f2c14e',wide:1});
  return humanoid({acc,coat:'#4a3a2a',hat:n.hat?n.hat[0]:'#6a4020',shirt:n.shirt?n.shirt[0]:'#58a850',skin:skins[h%6],pants:pants[(h>>3)%4],hair:['#3a2414','#1a1410','#c89048','#7a4a24','#8a8a90'][(h>>5)%5],capless,style,skirt:style!='short'&&(h>>9)%2==0,wide:.92+((h>>11)%4)*.05});});}
function drawEntities(){
  // the player
  const P=getModel('player:'+(st.gold?1:0),()=>humanoid({hat:'#e83048',shirt:'#3d63c8',skin:'#e8b890',pants:'#3c3c54',hair:'#6a3a1e',paddle:true,acc:['pack']}));
  if(mode!='title'&&(!(p.inv>0&&(frame>>2)&1)||deathT>0)){const sw=p.swing>0?(18-p.swing)/18:0,ex={};
    if(p.swing>0)ex.armR={x:-1.5,y:1.6-sw*3.4};if(p.raise>0){ex.armL={x:-2.6};if(PASS!='shadow')p.raise--;}if(p.hold>0){ex.armL={x:-2.9};ex.armR={x:-2.9};}
    let base=M4.mul(M4.tr(p.x,0,p.z),M4.ry(p.yaw));if(deathT>0)base=M4.mul(base,M4.rx(-Math.min(1.5,(90-deathT)/20)));
    if(!p.moving&&!ex.armR&&!ex.armL){ex.body={t:[0,Math.sin(frame*.05)*.008,0]};ex.head={y:Math.sin(frame*.011)*.25};}
    if(tAt(p.x,p.z)=='~'){base=M4.mul(M4.tr(0,-.35,0),base);const k=getModel('kayak',()=>propModel('kayak'));drawModel(k,M4.mul(M4.mul(M4.tr(p.x,-.15,p.z),M4.ry(p.yaw)),M4.rx(Math.PI/2)));ex.legL={x:-1.4};ex.legR={x:-1.4};}
    if(typeof riderPose=='function')base=riderPose(base,ex);
    ex._run=true;shadowAt(p.x,p.z);drawModel(P,base,humanPose(p.walk,p.moving,ex));
    if(st.items.lantern&&(st.eq=='lantern'||dark()>.3||lv.room)){const L=getModel('lanternProp',()=>[part(m=>{m.box(-.12,-.3,-.12,.12,0,.12,{top:'black',side:'glass'});m.box(-.03,0,-.03,.03,.12,.03,'black');},[0,0,0])]);
      if(P.skel&&P.skel.last){const bm=Array.from(P.skel.last.slice(B_FARML*16,B_FARML*16+16)),r=P.skel.rest[B_FARML];drawModel(L,M4.mul(M4.mul(base,bm),M4.tr(r[0],r[1]-.5,r[2]+.04)),null,{tint:[1.4,1.3,1.1]});}}
    if(p.hold>0&&p.holdIc){const HM={keystone:'keystone',key:'key',lantern:'lanternProp',powder:'bomb',ball:'ballpk',balls:'ballpk',heart:'container',hc:'container',piece:'piece',part:'part',bib:'bib',bug:'bug',hook:'hookhead',kayak:'kayak',melon:'melonpk',coins50:'coin',coins20:'coin',shield:'block',can:'sprout',shoes:'bib',music:'bib',map:'bib',fish:'fish',bike:'bike',camera:'camera',rod:'rod',basket:'basket'},k=HM[p.holdIc]||'coin';
      const im=getModel(k,()=>propModel(k));if(im&&im.length)drawModel(im,M4.mul(M4.tr(p.x,2.6+Math.sin(frame*.1)*.08,p.z),M4.ry(frame*.05)));}}
  if(hook){const hm=getModel('hookhead',()=>propModel('hookhead'));drawModel(hm,M4.mul(M4.tr(hook.x,1.2,hook.z),M4.ry(Math.atan2(hook.dx,hook.dz))));
    const ch=new Mesh();ch.tube([p.x,1.2,p.z],[hook.x,1.2,hook.z],.03,.03,4,'black');upload(dynBuf,ch);drawVAO(dynBuf);}
  if(bug){const bm=getModel('bug',()=>propModel('bug'));drawModel(bm,M4.mul(M4.tr(bug.x,1.2+Math.sin(frame*.4)*.1,bug.z),M4.ry(frame*.3)));for(const k of bug.carry){const m=getModel(k.kind,()=>propModel(k.kind));if(m.length)drawModel(m,M4.tr(k.x,.9,k.z));}}
  for(const s2 of shots){const m=getModel('shot',()=>propModel('shot')),col=s2.refl?[1,1,.6]:{ball:[1,1,1],orb:[.8,.5,1],feather:[.2,.2,.3],ring:[1,.75,.35],spark:[1,.6,.2],seed:[.5,.85,.4],blood:[.9,.1,.2]}[s2.k]||[1,1,1];
    drawModel(m,M4.mul(M4.tr(s2.x,s2.y,s2.z),M4.sc(s2.k=='ball'?.6:1)),null,{tint:col.map(v=>v*1.3)});}
  for(const b of birds){if(b.state=='gone')continue;const m=getModel('pigeon',pigeonModel),fl=b.state=='fly',pk=!fl&&(b.t%60)<12;if(!fl)shadowAt(b.x,b.z,.3);
    drawModel(m,M4.mul(M4.tr(b.x,b.y,b.z),M4.mul(M4.ry(b.yaw),M4.rx(pk?.5:fl?-.25:0))),fl?{wingL:{z:Math.sin(b.flap)*1.1},wingR:{z:-Math.sin(b.flap)*1.1}}:{wingL:{z:-.2},wingR:{z:.2}});}
  for(const n of npcs){shadowAt(n.x,n.z);const mv=n.wander&&!(n.look>0),talking=dlg&&dlg.who==n.who,ex=mv?{}:{body:{t:[Math.sin(n.t*.021+n.i)*.025,Math.sin(n.t*.05)*.008,0],z:Math.sin(n.t*.021+n.i)*.02},armL:{x:Math.sin(n.t*.03)*.06,z:-.12},armR:{x:-Math.sin(n.t*.03)*.06,z:.12}};
    if(talking)ex.head={x:Math.sin(frame*.28)*.1+.05};else if(!mv)ex.head={y:Math.sin(n.t*.013+n.i*2)*.35};
    drawModel(npcModel(n),M4.mul(M4.tr(n.x,0,n.z),M4.ry(n.yaw)),humanPose(n.walk,mv,ex));
    if(n.chal&&!st.pins[n.chal]&&(frame>>4)&1){const im=getModel('coin',()=>propModel('coin'));drawModel(im,M4.mul(M4.tr(n.x,2.7,n.z),M4.mul(M4.ry(frame*.06),M4.sc(.7))));}}
  for(const e of enemies){const t=e.type,m=getModel('en:'+t,()=>enemyModel(t)),pose={};let base=M4.mul(M4.tr(e.x,e.y,e.z),M4.ry(e.yaw));
    if(t=='rat')pose.tail={y:Math.sin(e.t*.3)*.5};if(t=='bat'){pose.wingL={z:Math.sin(e.t*.5)*.8};pose.wingR={z:-Math.sin(e.t*.5)*.8};}if(t=='goose')pose.neck={x:Math.sin(e.t*.1)*.3};
    if(t=='crab'){pose.clawL={x:Math.sin(e.t*.2)*.4};pose.clawR={x:-Math.sin(e.t*.2)*.4};}
    if(t=='turtle'){base=M4.mul(base,M4.sc(1.25));if(e.state=='stun')base=M4.mul(M4.mul(base,M4.tr(0,1.4,0)),M4.rz(Math.PI));pose.head={t:[0,0,e.state=='stun'?-.6:0]};if(e.state=='wind')base=M4.mul(base,M4.tr(Math.sin(e.st)*.08,0,0));}
    if(t=='vampire'&&e.gone)continue;if(t=='raven'){pose.wingL={z:Math.sin(e.t*.3)*.7};pose.wingR={z:-Math.sin(e.t*.3)*.7};}if(t=='squirrel')pose.tail={x:Math.sin(e.t*.2)*.3};
    if(t=='bell'&&e.state=='stun')base=M4.mul(base,M4.rz(Math.sin(e.st*.6)*.15*Math.max(0,1-e.st/40)));if(t=='arum'&&e.state=='bloom')base=M4.mul(base,M4.sc(1.15));
    if(t=='foreman'&&e.state=='wind')base=M4.mul(base,M4.tr(0,Math.sin(e.st*.5)*.1,0));if(e.stun>0&&!e.boss)base=M4.mul(base,M4.rz(Math.sin(frame*.5)*.2));
    if(e.dead)base=M4.mul(base,M4.sc(Math.max(.01,e.fade/40)));
    if(t=='ghost'&&PASS!='shadow'){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(U.uAlpha,.42+.08*Math.sin(frame*.07+e.x));drawModel(m,base,pose,{tint:[1.4,1.5,1.7]});gl.uniform1f(U.uAlpha,1);gl.depthMask(true);gl.disable(gl.BLEND);continue;}
    if(t=='wraith'&&e.vis<=0){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(U.uAlpha,.18+.1*Math.sin(frame*.2));drawModel(m,base,pose);gl.uniform1f(U.uAlpha,1);gl.disable(gl.BLEND);continue;}
    if(!EDEF[t]||!EDEF[t].fly||t=='bell')shadowAt(e.x,e.z,t=='turtle'||t=='bell'||t=='arum'?2.6:t=='foreman'?1.6:.9);else shadowAt(e.x,e.z,.6);drawModel(m,base,pose,e.flash>0&&(e.flash>>1)&1?{flash:.8}:null);}
  for(const c of chests){if(!chestVisible(c))continue;const m=getModel('chest',()=>propModel('chest'));drawModel(m,M4.tr(c.x,0,c.z),{lid:{x:c.open?-1.9:0}});}
  for(const k of picks){const m=getModel(k.kind,()=>propModel(k.kind));if(!m.length)continue;if(k.life<120&&(frame>>2)&1)continue;shadowAt(k.x,k.z,.5);
    if(k.kind=='frog'||k.kind=='painting'||k.kind=='tomato')drawModel(m,M4.mul(M4.tr(k.x,k.kind=='frog'?k.y-.5:0,k.z),M4.ry(k.yaw||0)));else drawModel(m,M4.mul(M4.tr(k.x,k.y+Math.sin(k.t*.08)*.1,k.z),M4.ry(k.t*.06)));}
  for(const b of bombs){const m=getModel('bomb',()=>propModel('bomb'));drawModel(m,M4.mul(M4.tr(b.x,0,b.z),M4.sc(1+(b.t<30?Math.sin(b.t)*.08:0))),null,b.t<40&&(b.t>>2)&1?{flash:.6}:null);}
  for(const o of lv.dyn){if(!o.on)continue;const m=getModel(o.kind,()=>propModel(o.kind));let base;
    if(o.kind=='lock'){const [a,b2]=o.cells[0],[c2,d2]=o.cells[o.cells.length-1],horiz=b2==d2;base=M4.mul(M4.tr(((a+c2)/2+.5)*TS,0,((b2+d2)/2+.5)*TS),horiz?M4.mul(M4.ry(0),M4.sc(1)):M4.ry(Math.PI/2));
      if(horiz)base=M4.mul(base,[2,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);drawModel(m,base);}
    else if(o.kind=='crack'){for(const [a,b2] of o.cells)drawModel(m,M4.tr(a*TS+TS/2,0,b2*TS+TS/2));}
    else if(o.kind=='gate'){for(const [a,b2] of o.cells){const ed=b2==0||b2==lv.h-1;drawModel(m,M4.mul(M4.tr(a*TS+TS/2,0,b2*TS+TS/2),ed?M4.id():M4.ry(Math.PI/2)));}}
    else if(o.kind=='block'){const k=o.mv?o.mv/12:0,x=(o.tx+(o.fx-o.tx)*k)*TS+TS/2,z=(o.ty+(o.fy-o.ty)*k)*TS+TS/2;drawModel(m,M4.tr(x,0,z),null,lv.d.rows[o.ty][o.tx]=='^'&&!o.mv?{tint:[1.15,1.1,.8]}:null);}
    else drawModel(m,M4.tr(o.tx*TS+TS/2,0,o.ty*TS+TS/2));}
  for(const o of lv.dyn){if(o.kind=='brazier'){const m=getModel('brazier',()=>propModel('brazier'));drawModel(m,M4.tr(o.tx*TS+TS/2,0,o.ty*TS+TS/2));}
    if(o.kind=='sprout'&&o.grown){const m=getModel('grown',()=>propModel('grown'));drawModel(m,M4.tr(o.tx*TS+TS/2,0,o.ty*TS+TS/2));
      if(!o.vm){o.vm=new Mesh();for(const [vx,vy] of o.vines){const X0=vx*TS,Z0=vy*TS;o.vm.box(X0,-.15,Z0+.2,X0+TS,.05,Z0+TS-.2,{top:'vine',side:'vine'});o.vm.box(X0,-.15,Z0+.05,X0+TS,.3,Z0+.2,'vine');o.vm.box(X0,-.15,Z0+TS-.2,X0+TS,.3,Z0+TS-.05,'vine');}}drawVAO(meshGL(o.vm));}}
  if(typeof drawLife=='function')drawLife();}
function drawBillboards(env){if(PASS=='shadow')return;const m=new Mesh(),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
  const bb=(x,y,z,s,cell,col)=>m.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],cell,col);
  for(const q of parts)bb(q.x,q.y,q.z,.09,'white',rgb(q.c));
  if(typeof lifeBB=='function')lifeBB(bb,m,rx,rz);
  for(const o of lv.dyn)if(o.kind=='brazier'&&o.lit)for(let k=0;k<3;k++){const f=Math.sin(frame*.3+k*2)*.08;bb(o.tx*TS+TS/2+f,1.55+k*.18+Math.abs(f),o.ty*TS+TS/2,.22-k*.05,'white',[1,.55+k*.18,.15+k*.1]);}
  gl.uniform1f(U.uSnap,1);upload(dynBuf,m);drawVAO(dynBuf);
  const g=new Mesh(),dk=lv.room?.6:dark();
  if(dk>.15)for(const gg of lv.glows)if(lampLit(gg)){const s=1.3,[x,y,z]=gg;g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',[dk,dk,dk]);}
  if(!lv.room&&dk>.4){if(!lv.waterPts){lv.waterPts=[];for(let ty=0;ty<lv.h;ty++)for(let tx=0;tx<lv.w;tx++)if(WATER.includes(lv.d.rows[ty][tx]))lv.waterPts.push([tx,ty]);}
    for(const [tx,ty] of lv.waterPts){const x=tx*TS+TS/2,z=ty*TS+TS/2;if(Math.abs(x-p.x)>22||Math.abs(z-p.z)>22)continue;const q=hash(tx,ty,frame>>4);if(q%3)continue;
      const ox=x+(q%7-3)*.2,oz=z+((q>>3)%7-3)*.2,w=.5+(q%4)*.12,d=.05,k=.35*dk;g.quad([ox-w,-.28,oz+d],[ox+w,-.28,oz+d],[ox+w,-.28,oz-d],[ox-w,-.28,oz-d],'lampglow',[k*.8,k*.85,k]);}
    for(const gg of lv.glows){if(!lampLit(gg))continue;for(const [tx,ty] of lv.waterPts){const x=tx*TS+TS/2,z=ty*TS+TS/2;if(Math.hypot(x-gg[0],z-gg[2])>5)continue;
      for(let k=0;k<3;k++){const wob=Math.sin(frame*.08+k*2+tx)*.15,zz=z-.5+k*.5,w=.35-k*.06;g.quad([x-w+wob,-.27,zz+.08],[x+w+wob,-.27,zz+.08],[x+w+wob,-.27,zz-.08],[x-w+wob,-.27,zz-.08],'lampglow',[dk*.7,dk*.55,dk*.3]);}}}}
  if(st.items.lantern&&(dk>.3||lv.room)){const s=.32,x=p.x,y=1.0,z=p.z;g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',[.3,.24,.14]);}
  for(const b of bombs)if(b.t<6){const s=3,x=b.x,y=1,z=b.z;g.quad([x-rx*s,y-s,z-rz*s],[x+rx*s,y-s,z+rz*s],[x+rx*s,y+s,z+rz*s],[x-rx*s,y+s,z-rz*s],'lampglow',[1,.7,.3]);}
  if(typeof lifeGlow=='function')lifeGlow(g,rx,rz,dk);
  if(g.count){gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.uniform1f(U.uAdd,1);gl.uniform2f(U.uFog,999,1000);upload(dynBuf,g);drawVAO(dynBuf);gl.uniform1f(U.uAdd,0);gl.depthMask(true);gl.disable(gl.BLEND);gl.uniform2f(U.uFog,env.fog[0],env.fog[1]);}}
function project(x,y,z){if(!PV)return null;const v=[x,y,z,1],o=[0,0,0,0];for(let i=0;i<4;i++)o[i]=PV[i]*v[0]+PV[4+i]*v[1]+PV[8+i]*v[2]+PV[12+i];if(o[3]<=0)return null;return[(o[0]/o[3]*.5+.5)*RW,(1-(o[1]/o[3]*.5+.5))*RH];}
