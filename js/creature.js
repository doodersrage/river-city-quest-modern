"use strict";
/* River City Quest Modern: the animals, each built on its own small skeleton so it moves the way the real one does.
   Norway rats trot and sniff, gray squirrels bound and sit up, Canada geese waddle, graze, hiss and charge with
   wings out, blue crabs sidle on rippling legs with claws raised, bats and the raven beat jointed wings, the
   snapping turtle crawls and pulls its neck in, and the ghost trails its robe behind it. */
const RX=a=>Qt.ax(1,0,0,a),RY=a=>Qt.ax(0,1,0,a),RZ=a=>Qt.ax(0,0,1,a),QM=(...q)=>q.reduce((a,b)=>Qt.mul(a,b));
const clamp01=v=>Math.max(0,Math.min(1,v));
// build one mesh whose pieces are each bound to a bone (or blended between two), with a skeleton and an animator
function rigged(J,build,anim,scale){const m=new Mesh();m.bw=[];
  const sync=(b,b2,wf)=>{for(let i=m.bw.length/3;i<m.count;i++){const r=wf?wf(m.pos[i*3],m.pos[i*3+1],m.pos[i*3+2]):0;if(Array.isArray(r))m.bw.push(r[0],r[1],clamp01(r[2]));else m.bw.push(b,b2==null?b:b2,clamp01(r));}};
  build((b,fn,b2,wf)=>{fn(m);sync(b,b2,wf);},m);const k=scale||1;if(k!=1)for(let i=0;i<m.pos.length;i++)m.pos[i]*=k;
  const P=[{mesh:m,pivot:[0,0,0],name:'body'}];P.skel={custom:anim,rest:J.map(j=>j[1].map(v=>v*k)),parent:J.map(j=>j[0]),k,anim:{}};return P;}
// local turns from the animator, walked down the skeleton into the matrices the shader wants
function creaturePose(skel,pose,time){const rest=skel.rest,n=rest.length,k=skel.k,L=skel.custom(pose,pose._t!=null?pose._t:time),q=[],pos=[],out=new Float32Array(NBONES*16);
  for(let b=0;b<NBONES;b++){const o=b*16;if(b>=n){out[o]=out[o+5]=out[o+10]=out[o+15]=1;continue;}const p=skel.parent[b],lq=L.q[b]||Qt.I,of=L.off&&L.off[b];
    if(p<0){q[b]=lq;const r=L.root||[0,0,0];pos[b]=[rest[b][0]+r[0]*k,rest[b][1]+r[1]*k,rest[b][2]+r[2]*k];}
    else{q[b]=Qt.mul(q[p],lq);const d=Qt.rot(q[p],[rest[b][0]-rest[p][0]+(of?of[0]*k:0),rest[b][1]-rest[p][1]+(of?of[1]*k:0),rest[b][2]-rest[p][2]+(of?of[2]*k:0)]);pos[b]=[pos[p][0]+d[0],pos[p][1]+d[1],pos[p][2]+d[2]];}
    const [x,y,z,w]=q[b],r=rest[b],c=pos[b];
    const m00=1-2*(y*y+z*z),m01=2*(x*y-z*w),m02=2*(x*z+y*w),m10=2*(x*y+z*w),m11=1-2*(x*x+z*z),m12=2*(y*z-x*w),m20=2*(x*z-y*w),m21=2*(y*z+x*w),m22=1-2*(x*x+y*y);
    out[o]=m00;out[o+1]=m10;out[o+2]=m20;out[o+4]=m01;out[o+5]=m11;out[o+6]=m21;out[o+8]=m02;out[o+9]=m12;out[o+10]=m22;out[o+15]=1;
    out[o+12]=c[0]-(m00*r[0]+m01*r[1]+m02*r[2]);out[o+13]=c[1]-(m10*r[0]+m11*r[1]+m12*r[2]);out[o+14]=c[2]-(m20*r[0]+m21*r[1]+m22*r[2]);}
  out.pos=pos;out.q=q;return out;}
const beadEye=(m,x,y,z,r)=>{m.sphere(x,y,z,r,8,4,'white',[.03,.02,.02]);m.sphere(x+r*.3,y+r*.35,z+r*.6,r*.3,5,3,'white',[.9,.9,.9]);};
const moved=(build,dx,dy,dz)=>{const t=new Mesh();build(t);for(let i=0;i<t.pos.length;i+=3){t.pos[i]+=dx;t.pos[i+1]+=dy;t.pos[i+2]+=dz;}return t;};
// one leg of a walking cycle: swings back and forth from the hip, and folds as it comes forward
const stepLeg=(ph,s,swing,fold)=>[RX(Math.sin(ph)*swing*s),RX(Math.max(0,-Math.cos(ph))*fold*s)];

/* ---------- four legs: rat and squirrel ---------- */
function ratModel(){const c=rgb('#6e6258'),bl=rgb('#c8b4a8'),pk=rgb('#d0a098'),tl=pk.map(v=>v*.85);
  const J=[[-1,[0,.17,-.14]],[0,[0,.17,.08]],[1,[0,.19,.24]],[1,[-.07,.13,.15]],[3,[-.075,.06,.16]],[1,[.07,.13,.15]],[5,[.075,.06,.16]],[0,[-.08,.14,-.15]],[7,[-.09,.06,-.12]],[0,[.08,.14,-.15]],[9,[.09,.06,-.12]],[0,[0,.14,-.28]],[11,[0,.12,-.5]]];
  return rigged(J,on=>{
    on(0,m=>{m.sphere(0,.17,-.02,.17,14,8,'fur',c,.78,.95,1.65);m.sphere(0,.12,.02,.15,12,6,'fur',bl,.6,.9,1.5,0,.45);},1,(x,y,z)=>sstep(-.14,.1,z));
    on(2,m=>{m.sphere(0,.2,.3,.1,12,6,'fur',c,.85,.9,1.35);m.tube([0,.195,.36],[0,.18,.485],.058,.014,8,'fur',c);m.sphere(0,.18,.49,.016,6,3,'skin',pk);
      for(const sx of [-1,1]){beadEye(m,sx*.05,.23,.39,.016);m.sphere(sx*.06,.29,.3,.035,8,4,'skin',pk,1,.35,1);for(let k=0;k<3;k++)m.tube([sx*.02,.18,.47],[sx*.16,.19+k*.015-.015,.42],.002,.001,3,'white',[.9,.9,.9]);}});
    for(const [sx,u] of [[-1,3],[1,5]]){on(u,m=>m.tube([sx*.07,.14,.15],[sx*.075,.06,.16],.03,.02,6,'fur',c));on(u+1,m=>{m.tube([sx*.075,.065,.16],[sx*.08,.012,.18],.018,.013,5,'skin',pk);m.sphere(sx*.08,.01,.2,.022,6,3,'skin',pk,.45,1,1.5);});}
    for(const [sx,u] of [[-1,7],[1,9]]){on(u,m=>{m.sphere(sx*.085,.13,-.14,.06,8,5,'fur',c,1.1,.8,1.2);m.tube([sx*.085,.12,-.15],[sx*.09,.06,-.12],.035,.022,6,'fur',c);});on(u+1,m=>{m.tube([sx*.09,.065,-.12],[sx*.09,.014,-.15],.02,.014,5,'skin',pk);m.sphere(sx*.09,.01,-.11,.024,6,3,'skin',pk,.4,1,2.2);});}
    on(11,m=>{m.tube([0,.14,-.26],[0,.12,-.5],.022,.016,6,'skin',tl);m.tube([0,.12,-.5],[0,.13,-.78],.016,.005,6,'skin',tl);},12,(x,y,z)=>(-.42-z)/.14);
  },ps=>{const s=ps._s||0,g=ps._g||0,t=ps._t||0,idle=1-s,al=ps._al||0,sw=Math.sin(g),q=[];
    q[0]=RY(sw*.07*s);q[1]=RY(-sw*.13*s);q[2]=QM(RY(sw*.05*s+idle*Math.sin(t*.031+(ps._seed||0))*.3),RX(Math.sin(t*.5)*.05*idle-.28*al));
    [q[3],q[4]]=stepLeg(g,s,.7,.9);[q[5],q[6]]=stepLeg(g+Math.PI,s,.7,.9);[q[7],q[8]]=stepLeg(g+Math.PI,s,.6,.8);[q[9],q[10]]=stepLeg(g,s,.6,.8);
    q[11]=QM(RY(-Math.sin(g-1)*.25*s+Math.sin(t*.04)*.15*idle),RX(-.06*s));q[12]=RY(-Math.sin(g-2)*.38*s+Math.sin(t*.04-.8)*.22*idle);
    return{q,root:[0,Math.abs(sw)*.012*s,0]};},1.25);}
function squirrelModel(){const c=rgb('#8a8680'),r=rgb('#9a7a5a'),w=rgb('#e8e2d8');
  const J=[[-1,[0,.15,-.12]],[0,[0,.17,.08]],[1,[0,.21,.2]],[1,[-.055,.12,.13]],[3,[-.06,.06,.15]],[1,[.055,.12,.13]],[5,[.06,.06,.15]],[0,[-.08,.13,-.12]],[7,[-.085,.05,-.08]],[0,[.08,.13,-.12]],[9,[.085,.05,-.08]],[0,[0,.2,-.2]],[11,[0,.44,-.32]]];
  return rigged(J,on=>{
    on(0,m=>{m.sphere(0,.17,0,.13,12,7,'fur',c,.85,.85,1.6);m.sphere(0,.13,.03,.11,10,5,'fur',w,.6,.75,1.5,0,.5);},1,(x,y,z)=>sstep(-.12,.1,z));
    on(2,m=>{m.sphere(0,.23,.25,.08,12,6,'fur',c,.95,.95,1.15);m.sphere(0,.21,.33,.04,8,4,'fur',r);m.sphere(0,.205,.365,.012,6,3,'white',[.08,.06,.06]);
      for(const sx of [-1,1]){beadEye(m,sx*.05,.26,.3,.016);m.tube([sx*.04,.29,.22],[sx*.045,.35,.21],.022,.006,6,'fur',c);}});
    for(const [sx,u] of [[-1,3],[1,5]]){on(u,m=>m.tube([sx*.055,.13,.13],[sx*.06,.06,.15],.026,.02,6,'fur',c));on(u+1,m=>{m.tube([sx*.06,.065,.15],[sx*.06,.012,.17],.018,.014,5,'fur',c);m.sphere(sx*.06,.01,.185,.02,6,3,'fur',r,.45,1,1.5);});}
    for(const [sx,u] of [[-1,7],[1,9]]){on(u,m=>{m.sphere(sx*.08,.13,-.1,.07,10,5,'fur',c,1.15,.7,1.25);m.tube([sx*.08,.12,-.12],[sx*.085,.05,-.08],.04,.024,6,'fur',c);});on(u+1,m=>{m.tube([sx*.085,.055,-.08],[sx*.085,.014,-.1],.022,.016,5,'fur',c);m.sphere(sx*.085,.01,-.04,.022,6,3,'fur',r,.4,1,2.8);});}
    // a bushy tail: a run of soft puffs along an S curve, so it can bend without showing joints
    on(11,m=>{const pts=[[0,.2,-.2],[0,.32,-.32],[0,.5,-.34],[0,.64,-.26],[0,.68,-.15]];for(let i=0;i<13;i++){const u=i/12*3.999,k=Math.floor(u),f=u-k,A=pts[k],B=pts[k+1];m.sphere(0,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f,.062+.034*Math.sin(i/12*2.6),8,5,'fur',i>6?r.map(v=>v*.92):c);}},12,(x,y,z)=>sstep(.3,.6,y));
  },ps=>{const s=ps._s||0,g=ps._g||0,t=ps._t||0,idle=1-s,al=(ps._al||0)*idle,q=[],b=Math.sin(g),up=.95*al;
    // bounding: both front feet land together, then both hind feet, with the back arching between
    q[0]=RX(-up+b*.3*s);q[1]=RX(-.2*al-b*.5*s);q[2]=QM(RY(idle*Math.sin(t*.027+(ps._seed||0))*.5),RX(.85*al+b*.2*s+Math.sin(t*.6)*.03*idle));
    const f=stepLeg(g,s,.9,1),h=stepLeg(g+2.4,s,1,1.1);q[3]=q[5]=QM(RX(-.7*al),f[0]);q[4]=q[6]=QM(RX(1.5*al),f[1]);q[7]=q[9]=QM(RX(up),h[0]);q[8]=q[10]=h[1];
    const fl=Math.pow(Math.max(0,Math.sin(t*.13+(ps._seed||0))),8);q[11]=RX(up*.6+b*.25*s+.5*s-fl*.25);q[12]=RX(.9*s+fl*.5+Math.sin(t*.05)*.06);
    return{q,root:[0,(.5-.5*Math.cos(g+.8))*.07*s,0]};},1.2);}

/* ---------- goose ---------- */
function gooseModel(){const b=rgb('#5e5244'),bk=rgb('#151413'),w=rgb('#ece8e0'),br=rgb('#b8aa98'),leg=[.12,.12,.12];
  const J=[[-1,[0,.5,-.05]],[0,[0,.6,.3]],[1,[0,.92,.36]],[2,[0,1.12,.42]],[0,[-.2,.66,.1]],[0,[.2,.66,.1]],[0,[-.07,.36,-.02]],[6,[-.07,.03,-.01]],[0,[.07,.36,-.02]],[8,[.07,.03,-.01]],[0,[0,.52,-.4]]];
  return rigged(J,on=>{
    on(0,m=>{m.sphere(0,.55,-.05,.27,14,8,'feather',b,.78,.9,1.55);m.sphere(0,.48,.02,.24,12,6,'feather',br,.7,.85,1.4,0,.5);});
    on(10,m=>{m.sphere(0,.5,-.42,.12,10,5,'feather',w,.9,.8,1.2);m.tube([0,.56,-.46],[0,.6,-.62],.1,.03,8,'feather',bk);});
    for(const [sx,u] of [[-1,4],[1,5]])on(u,m=>{m.sphere(sx*.21,.6,-.16,.15,12,6,'feather',b.map(v=>v*.75),.5,.3,1.9);m.sphere(sx*.215,.58,-.3,.1,10,5,'feather',bk.map(v=>v+.06),.4,.25,1.9);});
    for(const [sx,u] of [[-1,6],[1,8]]){on(u,m=>m.tube([sx*.07,.38,-.02],[sx*.07,.03,-.01],.03,.02,6,'skin',leg));on(u+1,m=>m.box(sx*.07-.06,0,-.03,sx*.07+.06,.022,.13,'skin',leg));}
    on(1,m=>m.tube([0,.6,.3],[0,.92,.36],.075,.055,10,'feather',bk),2,(x,y,z)=>sstep(.74,.96,y));on(2,m=>m.tube([0,.92,.36],[0,1.12,.42],.055,.05,10,'feather',bk),3,(x,y,z)=>sstep(1.04,1.14,y));
    on(3,m=>m.add(moved(m=>{m.sphere(0,.56,.14,.07,10,6,'feather',bk,1,.9,1.3);m.sphere(0,.5,.12,.064,10,5,'feather',w,.9,.82,1.15,.25,.75);m.tube([0,.55,.2],[0,.535,.33],.032,.01,8,'white',[.1,.1,.1]);for(const sx of [-1,1])beadEye(m,sx*.045,.58,.18,.012);},0,.6,.3)));
  },ps=>{const s=ps._s||0,g=ps._g||0,t=ps._t||0,idle=1-s,al=ps._al||0,lg=ps._lg||0,q=[],sw=Math.sin(g);
    // grazing when left alone: the neck goes down to the grass for a while, then comes up to look around
    const gz=idle*(1-al)*sstep(.35,.7,Math.sin(t*.011+(ps._seed||0)*3)),bob=Math.sin(g*2)*.14*s*(1-lg);
    q[0]=QM(RZ(sw*.08*s),RY(sw*.06*s),RX(.3*gz+.12*lg));q[1]=RX(1.35*gz+1.0*lg-.16*al+bob);q[2]=RX(.55*gz+.3*lg-bob*.6+Math.sin(t*.4)*.04*gz);q[3]=QM(RY(idle*(1-gz)*Math.sin(t*.02+(ps._seed||0))*.5),RX(-.55*gz-1.3*lg+.12*al-bob*.4));
    const open=Math.max(lg,(ps._flap||0)),fl=Math.sin(t*.55)*.55*open;q[4]=QM(RZ(-.25*open+fl),RY(1.25*open));q[5]=QM(RZ(.25*open-fl),RY(-1.25*open));
    for(const [u,ph] of [[6,g],[8,g+Math.PI]]){q[u]=RX(Math.sin(ph)*.5*s);q[u+1]=RX(-Math.sin(ph)*.5*s+Math.max(0,-Math.cos(ph))*.6*s);}
    q[10]=QM(RY(-sw*.15*s),RX(Math.sin(t*.3)*.08*al));return{q,root:[0,Math.abs(sw)*.015*s-.03*lg,0]};});}

/* ---------- blue crab ---------- */
function crabModel(){const top=rgb('#5a6e5c'),bl=rgb('#3a6aa8'),wh=rgb('#e8e4d8'),rd=rgb('#c84a32');
  const J=[[-1,[0,.18,0]],[0,[-.22,.2,.12]],[1,[-.32,.23,.48]],[0,[.22,.2,.12]],[3,[.32,.23,.48]]];for(const sx of [-1,1]){for(let i=0;i<3;i++)J.push([0,[sx*.22,.17,-.1+i*.08]]);J.push([0,[sx*.2,.18,-.16]]);}
  return rigged(J,on=>{
    on(0,m=>{m.sphere(0,.2,0,.2,16,6,'carapace',top,.35,1.75,.8,.45,1);m.sphere(0,.19,0,.2,16,4,'carapace',wh,.25,1.72,.78,0,.5);
      for(const sx of [-1,1]){m.tube([sx*.3,.21,0],[sx*.47,.215,0],.04,.004,6,'carapace',top);beadEye(m,sx*.06,.3,.15,.018);m.tube([sx*.06,.24,.14],[sx*.06,.29,.15],.008,.008,4,'white',top);}});
    [-1,1].forEach((sx,k)=>{const a=1+k*2,L=5+k*4;
      on(a,m=>m.add(moved(m=>{m.tube([0,0,0],[sx*.08,.02,.2],.035,.04,8,'carapace',bl);m.sphere(sx*.08,.03,.3,.075,10,5,'carapace',bl,.7,.9,1.5);m.tube([sx*.06,.03,.36],[sx*.04,.03,.48],.022,.006,6,'carapace',rd);},sx*.22,.2,.12)));
      on(a+1,m=>m.add(moved(m=>m.tube([sx*.1,.03,.36],[sx*.12,.03,.47],.02,.005,6,'carapace',rd),sx*.22,.2,.12)));
      for(let i=0;i<3;i++){const z=-.1+i*.08;on(L+i,m=>{m.tube([sx*.22,.17,z],[sx*.42,.24,z+.02],.022,.02,6,'carapace',bl);m.tube([sx*.42,.24,z+.02],[sx*.55,0,z+.06],.02,.008,6,'carapace',bl);});}
      on(L+3,m=>{m.tube([sx*.2,.18,-.16],[sx*.4,.2,-.26],.02,.02,6,'carapace',bl);m.sphere(sx*.45,.2,-.29,.06,8,4,'carapace',bl,.25,1,1.2);});});
  },ps=>{const s=ps._s||0,g=ps._g||0,t=ps._t||0,al=ps._al||0,q=[];q[0]=QM(RZ(Math.sin(g)*.05*s),RX(-.12*al));
    [-1,1].forEach((sx,k)=>{const a=1+k*2,L=5+k*4,snap=.2+.3*Math.max(0,Math.sin(t*.35+k*2));q[a]=QM(RY(-sx*.35*al+sx*Math.sin(t*.05+k)*.08),RX(-.75*al-.1+Math.sin(t*.07+k*1.7)*.06));q[a+1]=RY(sx*(.1+snap*al));
      for(let i=0;i<4;i++){const ph=g+i*1.55+k*Math.PI;q[L+i]=QM(RZ(sx*(Math.max(0,Math.cos(ph))*.4*s+.03*Math.sin(t*.06+i))),RY(Math.sin(ph)*.3*s));}});
    return{q,root:[0,Math.abs(Math.sin(g*2))*.008*s+.02*al,0]};},1.9);}

/* ---------- wings: bat and raven ---------- */
function batModel(){const c=rgb('#5a4234'),w=rgb('#3a2a24');const J=[[-1,[0,0,0]],[0,[-.06,0,0]],[1,[-.26,.06,.04]],[0,[.06,0,0]],[3,[.26,.06,.04]],[0,[0,.08,.02]]];
  return rigged(J,on=>{on(0,m=>m.sphere(0,0,0,.08,10,6,'fur',c,1.3));on(5,m=>{m.sphere(0,.11,.02,.05,10,5,'fur',c);m.sphere(0,.1,.065,.018,6,3,'skin',w);for(const sx of [-1,1]){m.tube([sx*.03,.13,.01],[sx*.045,.2,0],.024,.004,6,'skin',w);beadEye(m,sx*.02,.12,.065,.008);}});
    [-1,1].forEach((sx,k)=>on(1+k*2,m=>{const o=[sx*.06,0,.02],el=[sx*.26,.06,.04],tip=[sx*.56,.02,-.05],f1=[sx*.5,-.02,-.2],f2=[sx*.36,-.04,-.26],f3=[sx*.16,-.04,-.2],bd=[sx*.03,-.06,-.12];
      m.tube(o,el,.012,.01,4,'skin',w);m.tube(el,tip,.008,.004,4,'skin',w);m.tube(el,f1,.005,.003,3,'skin',w);m.tube(el,f2,.005,.003,3,'skin',w);
      const P=[o,el,tip,f1,f2,f3,bd];for(const [a,b2,d] of [[0,1,5],[1,4,5],[1,2,3],[1,3,4],[0,5,6]])m.tri(P[a],P[b2],P[d],[0,0],[1,0],[1,1],w,w,w);},2+k*2,(x,y,z)=>(Math.abs(x)-.22)/.1));
  },ps=>{const t=ps._t||0,f=t*.8+(ps._seed||0),lg=ps._lg||0,a=.15+(.8-.3*lg)*Math.sin(f),b=.55*Math.sin(f-1.1)-.3-.3*lg,q=[];
    q[0]=RX(.35+.45*lg);q[1]=RZ(-a);q[2]=RZ(-b);q[3]=RZ(a);q[4]=RZ(b);q[5]=RX(-.3-.3*lg);return{q,root:[0,-Math.sin(f)*.03,0]};},1.1);}
function ravenModel(){const c=rgb('#121218'),hi=[.1,.1,.14],dk=[.08,.08,.1];const J=[[-1,[0,0,0]],[0,[-.25,.1,.05]],[1,[-.8,.12,.05]],[0,[.25,.1,.05]],[3,[.8,.12,.05]],[0,[0,.15,.3]],[0,[0,0,-.4]]];
  return rigged(J,on=>{on(0,m=>{m.sphere(0,0,0,.32,14,8,'feather',c,.9,.85,1.5);for(const sx of [-1,1]){m.tube([sx*.1,-.2,-.05],[sx*.11,-.36,.02],.03,.02,5,'skin',dk);for(let k=-1;k<=1;k++)m.tube([sx*.11,-.36,.02],[sx*.11+k*.05,-.4,.12],.012,.004,4,'skin',dk);}});
    on(5,m=>{m.sphere(0,.22,.38,.18,12,6,'feather',c);m.tube([0,.22,.5],[0,.17,.78],.07,.01,8,'white',dk);m.sphere(0,.13,.5,.08,8,4,'feather',c,.8,.9,1.2);for(const sx of [-1,1])beadEye(m,sx*.09,.28,.5,.025);});
    on(6,m=>{for(let k=-2;k<=2;k++)m.tri([k*.05,0,-.38],[k*.14+.06,-.02,-.92+Math.abs(k)*.06],[k*.14-.06,-.02,-.92+Math.abs(k)*.06],[0,0],[1,1],[0,1],c,hi,hi);});
    [-1,1].forEach((sx,k)=>on(1+k*2,m=>{const sh=[sx*.25,.1,.05],wr=[sx*.8,.12,.05],tip=[sx*1.25,.1,-.05];m.tube(sh,wr,.06,.04,6,'feather',c);m.tube(wr,tip,.04,.015,6,'feather',c);
      // flight feathers: a row along the arm, then long fingers spread at the tip
      for(let i=0;i<9;i++){const u0=i/9,u1=(i+1)/9,x0=sx*(.25+u0*.72),x1=sx*(.25+u1*.72),len=.42+.12*Math.sin(u0*3);m.tri([x0,.1,.08],[x1,.1,.08],[x1,.06,-len],[0,0],[1,0],[1,1],c,c,hi);m.tri([x0,.1,.08],[x1,.06,-len],[x0,.06,-len+.03],[0,0],[1,1],[0,1],c,hi,hi);}
      for(let i=0;i<6;i++){const a=i*.3-.15,bx=sx*(.95+i*.05),tx=bx+sx*Math.sin(a+.5)*.5,tz=-Math.cos(a+.5)*.5;m.tri([bx-sx*.05,.11,.04],[bx+sx*.05,.11,.02],[tx,.08,tz],[0,0],[1,0],[.5,1],c,c,hi);}},2+k*2,(x,y,z)=>(Math.abs(x)-.72)/.16));
  },ps=>{const t=ps._t||0,dive=clamp01((2.35-(ps._y==null?2.4:ps._y))*2.5),f=t*.26,am=1-dive*.75,a=.1+.6*am*Math.sin(f)+.25*dive,b=.45*am*Math.sin(f-1.2)-.2+.5*dive,sweep=.75*dive,q=[];
    q[0]=RX(.15+.5*dive);q[1]=QM(RZ(-a),RY(-sweep));q[2]=QM(RZ(-b),RY(-sweep*.8));q[3]=QM(RZ(a),RY(sweep));q[4]=QM(RZ(b),RY(sweep*.8));q[5]=QM(RY(Math.sin(t*.04)*.25*(1-dive)),RX(-.1-.35*dive));q[6]=RX(-.2*am*Math.sin(f-.6)+.2*dive);
    return{q,root:[0,-Math.sin(f)*.07*am,0]};});}

/* ---------- ghost ---------- */
function ghostModel(){const c=rgb('#d8e4f0');const J=[[-1,[0,1.45,.02]],[0,[0,1.1,0]],[1,[0,.6,0]],[2,[0,.15,0]],[0,[-.2,1.3,0]],[0,[.2,1.3,0]]];
  return rigged(J,on=>{on(0,m=>m.lathe(0,0,0,[[.1,.05],[.25,.15],[.4,.22],[.6,.26],[.8,.28],[1,.275],[1.2,.26],[1.45,.2],[1.6,.13],[1.72,0]],14,'cloth',c,1,.8),0,(x,y,z)=>y>1.1?[0,1,1-sstep(1.1,1.45,y)]:y>.6?[1,2,1-sstep(.6,1.1,y)]:[2,3,1-sstep(.15,.6,y)]);
    on(0,m=>{m.sphere(0,1.5,.05,.13,12,6,'skin',c.map(v=>v*1.02),1.2,.9,1);for(const sx of [-1,1])m.sphere(sx*.045,1.53,.15,.022,6,3,'white',[.05,.06,.1]);m.sphere(0,1.45,.16,.03,6,3,'white',[.05,.06,.1],1.4,.8,.5);});
    [-1,1].forEach((sx,k)=>on(4+k,m=>{m.tube([sx*.2,1.3,0],[sx*.38,.95,.18],.05,.03,8,'cloth',c);m.sphere(sx*.39,.92,.19,.035,6,3,'skin',c);}));
  },ps=>{const s=ps._s||0,t=ps._t||0,sd=ps._seed||0,q=[],w=k=>Math.sin(t*.05-k*.9+sd);
    // hung from the head: the robe trails behind when it moves and sways when it hovers
    q[0]=QM(RX(.12*s),RZ(w(0)*.04));q[1]=QM(RX(.2*s+w(1)*.05),RZ(w(1)*.07));q[2]=QM(RX(.22*s+w(2)*.08),RZ(w(2)*.1));q[3]=QM(RX(.2*s+w(3)*.1),RZ(w(3)*.12));
    for(const [u,sx] of [[4,-1],[5,1]])q[u]=QM(RX(-.25-1.25*s+Math.sin(t*.07+sx)*.12),RZ(sx*.15*(1-s)));return{q,root:[0,Math.sin(t*.06+sd)*.05,0]};});}

/* ---------- snapping turtle ---------- */
function turtleModel(){const sh=rgb('#3e3a2c'),sk=rgb('#5a5640'),pl=rgb('#b8a878'),L=[[-1.1,-.85],[1.1,-.85],[-1.1,.85],[1.1,.85]];
  const J=[[-1,[0,.4,0]],[0,[0,.5,1.25]],[1,[0,.63,1.8]],...L.map(([x,z])=>[0,[x*.75,.45,z*.75]]),[0,[0,.35,-1.5]]];
  return rigged(J,on=>{on(0,m=>{m.sphere(0,.4,0,1.4,18,9,'carapace',sh,.42,1,1.25,.5,1);m.sphere(0,.38,0,1.35,16,4,'carapace',pl,.12,1,1.2,.35,.5);
      for(const xo of [-.55,0,.55])for(let i=0;i<5;i++){const z=-1.1+i*.55,h=Math.sqrt(Math.max(0,1-(xo*xo)/1.96-(z*z)/3))*.55;m.cone(xo,.38+h,z,.2,.82+h-(xo?.08:0),.02,6,'carapace',sh.map(v=>v*.85));}
      for(let i=0;i<7;i++){const a=Math.PI+(i-3)*.18;m.cone(Math.sin(a)*1.3,.4,Math.cos(a)*1.65,.12,.42,0,4,'carapace',sh,0);}});
    L.forEach(([x,z],i)=>on(3+i,m=>{m.tube([x*.75,.45,z*.75],[x,0,z],.3,.24,10,'carapace',sk,true);for(let k=-1;k<=1;k++)m.cone(x+k*.1,.04,z+.24*Math.sign(z),.04,.04,0,5,'white',[.15,.13,.1]);}));
    on(7,m=>{m.tube([0,.35,-1.5],[0,.2,-2.3],.24,.04,8,'carapace',sk);for(let k=0;k<5;k++)m.cone(0,.4-k*.04,-1.6-k*.15,.05,.55-k*.06,0,4,'carapace',sk.map(v=>v*.8));});
    on(1,m=>m.add(moved(m=>m.tube([0,0,-.15],[0,.08,.4],.32,.3,12,'carapace',sk),0,.55,1.4)));
    on(2,m=>m.add(moved(m=>{m.sphere(0,.12,.58,.34,14,8,'carapace',sk,.8,1.05,1.25);m.tube([0,.04,.85],[0,-.04,1.0],.15,.02,8,'white',[.25,.22,.16]);for(const sx of [-1,1])beadEye(m,sx*.2,.28,.82,.045);},0,.55,1.4)));
  },ps=>{const s=ps._s||0,g=ps._g||0,t=ps._t||0,st=ps._st,q=[],fast=st=='charge'?1:0,sw=Math.sin(g);
    // the neck: pulled in when winding up or knocked over, thrown forward on the charge
    const pull=st=='stun'?-.6:st=='wind'?-.4*clamp01((ps._stt||0)/25):st=='charge'?.3:Math.sin(t*.02)*.05;
    q[0]=QM(RZ(sw*.035*s),RY(sw*.03*s));q[1]=QM(RY(st=='walk'||st=='idle'?Math.sin(t*.025)*.2:0),RX(st=='wind'?.15:0));q[2]=RX(st=='charge'?-.2:Math.sin(t*.03)*.05);
    for(let i=0;i<4;i++){const ph=g+((i==0||i==3)?0:Math.PI),fr=i>1;q[3+i]=st=='stun'?RX(Math.sin(t*.25+i*1.7)*.35):QM(RX(Math.sin(ph)*(.38+.12*fast)*s),RZ((i%2?1:-1)*Math.max(0,-Math.cos(ph))*.18*s*(fr?1:.6)));}
    q[7]=RY(-sw*.2*s+Math.sin(t*.03)*.1);return{q,off:{1:[0,0,pull]},root:[0,Math.abs(sw)*.03*s,0]};});}

const CREATURES={rat:ratModel,squirrel:squirrelModel,goose:gooseModel,crab:crabModel,bat:batModel,raven:ravenModel,ghost:ghostModel,turtle:turtleModel};
function realCreature(t){return CREATURES[t]?CREATURES[t]():null;}
