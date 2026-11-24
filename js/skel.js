"use strict";
/* River City Quest Modern: the skeleton. People are one skinned body driven by 13 bones (pelvis, chest,
   head, upper arms, forearms, thighs, shins, feet). Walking and running come from motion capture
   (js/anim.js); standing still is a quiet procedural idle with breathing and weight shifts; and the game's
   older pose instructions (swing the right arm, sit, hold something up) are layered on top. */
const B_PELVIS=0,B_CHEST=1,B_HEAD=2,B_UARML=3,B_FARML=4,B_UARMR=5,B_FARMR=6,B_THIGHL=7,B_SHINL=8,B_FOOTL=9,B_THIGHR=10,B_SHINR=11,B_FOOTR=12,NBONES=13;
const BONE_PARENT=[-1,0,1,1,3,1,5,0,7,8,0,10,11];
const Qt={
  mul:(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],
  ax:(x,y,z,a)=>{const s=Math.sin(a/2);return[x*s,y*s,z*s,Math.cos(a/2)];},
  rot:(q,v)=>{const x=q[0],y=q[1],z=q[2],w=q[3],ux=y*v[2]-z*v[1],uy=z*v[0]-x*v[2],uz=x*v[1]-y*v[0];return[v[0]+2*(w*ux+y*uz-z*uy),v[1]+2*(w*uy+z*ux-x*uz),v[2]+2*(w*uz+x*uy-y*ux)];},
  slerp:(a,b,t)=>{let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],s=1;if(d<0){s=-1;d=-d;}let p=1-t,q=t;if(d<.9995){const th=Math.acos(d),sn=Math.sin(th);p=Math.sin((1-t)*th)/sn;q=Math.sin(t*th)/sn;}
    const o=[a[0]*p+b[0]*q*s,a[1]*p+b[1]*q*s,a[2]*p+b[2]*q*s,a[3]*p+b[3]*q*s],l=Math.hypot(o[0],o[1],o[2],o[3])||1;return[o[0]/l,o[1]/l,o[2]/l,o[3]/l];},
  // the same turn order the old part poses used: yaw, then pitch, then roll
  ypr:(y,x,z)=>Qt.mul(Qt.mul(Qt.ax(0,1,0,y||0),Qt.ax(1,0,0,x||0)),Qt.ax(0,0,1,z||0)),
  I:[0,0,0,1]};
// where each bone's joint sits when the body is at rest, for a given build
function skelRest(fem,wide){const ax=(fem?.155:.178)*wide*1.08,hx=.09*(fem?.9:1);
  return[[0,.95,0],[0,1.1,0],[0,1.5,0],[-ax,1.42,0],[-ax,1.12,.005],[ax,1.42,0],[ax,1.12,.005],[-hx,.92,0],[-hx,.455,.01],[-hx,.1,-.005],[hx,.92,0],[hx,.455,.01],[hx,.1,-.005]];}
// bone weights for one vertex of a body part, from where it sits in that part: [bone, other bone, how much of the other]
const sstep=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
function boneWeights(part,y,sculpted){
  if(part=='head')return[B_HEAD,B_HEAD,0];
  if(part=='body')return y<1.3?[B_PELVIS,B_CHEST,sstep(.98,1.14,y)]:[B_CHEST,B_HEAD,sstep(1.47,1.56,y)];
  if(part=='armL'||part=='armR'){const u=part=='armL'?B_UARML:B_UARMR;return sculpted?[u,u+1,sstep(-.23,-.37,y)]:[u+1,u+1,0];}
  const t=part=='legL'?B_THIGHL:B_THIGHR;return y>-.65?[t,t+1,sstep(-.37,-.54,y)]:[t+1,t+2,sstep(-.77,-.85,y)];}
// turn a freshly built person (parts in their own spaces) into one skinned figure in body space
function rigHuman(P,fem,wide){for(const pt of P){const m=pt.mesh,n0=pt.nSculpt||0;m.bw=[];
    for(let i=0;i<m.count;i++){const w=boneWeights(pt.name,m.pos[i*3+1]+(pt.name=='body'?0:0),i<n0);m.bw.push(w[0],w[1],w[2]);m.pos[i*3]+=pt.pivot[0];m.pos[i*3+1]+=pt.pivot[1];m.pos[i*3+2]+=pt.pivot[2];}
    pt.pivot=[0,0,0];}
  P.skel={rest:skelRest(fem,wide),anim:{blend:0,frame:-1,t:Math.random()*100}};return P;}
function clipSample(C,phase){const f=((phase%1)+1)%1*C.n,i=Math.floor(f)%C.n,j=(i+1)%C.n,t=f-Math.floor(f),A=C.q[i],Bq=C.q[j],q=[];
  for(let b=0;b<NBONES;b++)q.push(Qt.slerp(A.slice(b*4,b*4+4),Bq.slice(b*4,b*4+4),t));return{q,y:C.y[i]+(C.y[j]-C.y[i])*t,x:C.x[i]+(C.x[j]-C.x[i])*t};}
// joint positions for a set of bone rotations, with the pelvis at root
function skelFK(rest,q,root){const pos=[root];for(let b=1;b<NBONES;b++){const p=BONE_PARENT[b],d=Qt.rot(q[p],[rest[b][0]-rest[p][0],rest[b][1]-rest[p][1],rest[b][2]-rest[p][2]]);pos.push([pos[p][0]+d[0],pos[p][1]+d[1],pos[p][2]+d[2]]);}return pos;}
// how high the hips ride for a clip so the lower foot just touches the ground through the stride
function clipBase(C,rest){if(C.base!=null)return C.base;let lo=1e9;for(let k=0;k<C.n;k++){const s=clipSample(C,k/C.n),pos=skelFK(rest,s.q,[0,rest[0][1]+s.y,0]);
    for(const f of [B_FOOTL,B_FOOTR]){const toe=Qt.rot(s.q[f],[0,-.1,.12]),heel=Qt.rot(s.q[f],[0,-.1,-.05]);lo=Math.min(lo,pos[f][1]+toe[1],pos[f][1]+heel[1]);}}return C.base=-lo;}
/* The pose for this frame: 13 bone matrices. `pose` is what the game asks for: _walk (a stride counter),
   _moving, _run, and optional part overrides (armL/armR/legL/legR {x,y,z}, head {x,y}, body handled by the caller). */
function skelPose(skel,pose,time){pose=pose||{};const rest=skel.rest,A=skel.anim,moving=!!pose._moving,T=time==null?0:time;
  if(A.frame!==T){const d=A.frame<0?99:Math.min(10,Math.abs(T-A.frame));A.frame=T;const k=1-Math.pow(.82,d);A.blend+=((moving?1:0)-A.blend)*k;A.run=moving?!!pose._run:A.run;}
  // idle: arms hang a little out with soft elbows; breathing lifts the chest; weight shifts slowly from foot to foot
  const t=T/60+A.t,br=Math.sin(t*1.5)*.012,sw=Math.sin(t*.37)*.02,q=[];
  q[B_PELVIS]=Qt.ax(0,0,1,sw*.6);q[B_CHEST]=Qt.mul(Qt.ax(0,0,1,-sw*.5),Qt.ax(1,0,0,br));q[B_HEAD]=Qt.ax(1,0,0,-br*.5);
  q[B_UARML]=Qt.ypr(0,.03+br,-.075);q[B_FARML]=Qt.mul(q[B_UARML],Qt.ax(1,0,0,-.2));q[B_UARMR]=Qt.ypr(0,.03+br,.075);q[B_FARMR]=Qt.mul(q[B_UARMR],Qt.ax(1,0,0,-.2));
  q[B_THIGHL]=Qt.ax(0,0,1,-.02+sw*.4);q[B_SHINL]=q[B_THIGHL];q[B_FOOTL]=Qt.ax(0,1,0,-.12);q[B_THIGHR]=Qt.ax(0,0,1,.02+sw*.4);q[B_SHINR]=q[B_THIGHR];q[B_FOOTR]=Qt.ax(0,1,0,.12);
  let rootY=rest[0][1],rootX=sw*.25;
  if(A.blend>.002&&typeof CLIPS!='undefined'){const C=A.run?CLIPS.run:CLIPS.walk,ph=(pose._walk||0)/6.2832*(A.run?.68:.9),s=clipSample(C,ph),b=A.blend;
    s.q[B_HEAD]=Qt.slerp(s.q[B_HEAD],s.q[B_CHEST],.25);s.q[B_HEAD]=Qt.slerp(s.q[B_HEAD],Qt.I,.4);// keep the eyes on the road
    for(let i=0;i<NBONES;i++)q[i]=Qt.slerp(q[i],s.q[i],b);rootY+=(clipBase(C,rest)+s.y)*b;rootX=rootX*(1-b)+s.x*b;}
  // what the game asks for on top: these are turns of a whole limb from the shoulder or hip
  for(const [key,u] of [['armL',B_UARML],['armR',B_UARMR]]){const o=pose[key];if(!o)continue;q[u]=Qt.ypr(o.y,o.x,o.z);const up=(o.x||0)<-2;q[u+1]=Qt.mul(q[u],Qt.ax(1,0,0,up?-.12:-.3));}
  for(const [key,u] of [['legL',B_THIGHL],['legR',B_THIGHR]]){const o=pose[key];if(!o)continue;const x=o.x||0;q[u]=Qt.ypr(0,x,0);
    // a leg swung well forward means sitting or pedaling: the knee bends so the shin hangs down
    q[u+1]=x<-.6?Qt.ax(1,0,0,x+Math.min(1.5,(-x-.3)*1.1)):Qt.ax(1,0,0,x+Math.max(0,x)*.9);q[u+2]=q[u+1];}
  if(pose.legL&&pose.legR&&(pose.legL.x||0)<-.6&&(pose.legR.x||0)<-.6)rootY-=(1-Math.cos((pose.legL.x+pose.legR.x)/2))*.42;// seated: the hips drop as the thighs come level
  if(pose.head)q[B_HEAD]=Qt.mul(q[B_HEAD],Qt.ypr(pose.head.y,pose.head.x,0));
  const pos=skelFK(rest,q,[rootX,rootY,0]),out=new Float32Array(NBONES*16);
  for(let b=0;b<NBONES;b++){const [x,y,z,w]=q[b],r=rest[b],p=pos[b],o=b*16;
    const m00=1-2*(y*y+z*z),m01=2*(x*y-z*w),m02=2*(x*z+y*w),m10=2*(x*y+z*w),m11=1-2*(x*x+z*z),m12=2*(y*z-x*w),m20=2*(x*z-y*w),m21=2*(y*z+x*w),m22=1-2*(x*x+y*y);
    out[o]=m00;out[o+1]=m10;out[o+2]=m20;out[o+4]=m01;out[o+5]=m11;out[o+6]=m21;out[o+8]=m02;out[o+9]=m12;out[o+10]=m22;out[o+15]=1;
    out[o+12]=p[0]-(m00*r[0]+m01*r[1]+m02*r[2]);out[o+13]=p[1]-(m10*r[0]+m11*r[1]+m12*r[2]);out[o+14]=p[2]-(m20*r[0]+m21*r[1]+m22*r[2]);}
  out.pos=pos;out.q=q;return out;}
