// Bakes Carnegie Mellon motion capture (BVH) into js/anim.js: a looping walk and run for the game's skeleton.
// Usage: node tools/bake-mocap.js
// The data was obtained from mocap.cs.cmu.edu (created with funding from NSF EIA-0196217), BVH conversion by B. Hahne.
const fs=require('fs'),path=require('path');
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qaxis=(ax,deg)=>{const h=deg*Math.PI/360,s=Math.sin(h);return[ax[0]*s,ax[1]*s,ax[2]*s,Math.cos(h)];};
const qrot=(q,v)=>{const [x,y,z,w]=q,ux=y*v[2]-z*v[1],uy=z*v[0]-x*v[2],uz=x*v[1]-y*v[0];return[v[0]+2*(w*ux+y*uz-z*uy),v[1]+2*(w*uy+z*ux-x*uz),v[2]+2*(w*uz+x*uy-y*ux)];};
const qnorm=q=>{const l=Math.hypot(...q);return q.map(v=>v/l);};
const qslerp=(a,b,t)=>{let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];if(d<0){b=b.map(v=>-v);d=-d;}if(d>.9995)return qnorm(a.map((v,i)=>v+(b[i]-v)*t));const th=Math.acos(d),s=Math.sin(th),p=Math.sin((1-t)*th)/s,q=Math.sin(t*th)/s;return a.map((v,i)=>v*p+b[i]*q);};
const qfrom=(a,b)=>{const d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2],c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];return qnorm([c[0],c[1],c[2],1+d]);};
const AX={X:[1,0,0],Y:[0,1,0],Z:[0,0,1]};
function parse(file){const tok=fs.readFileSync(file,'utf8').split(/\s+/);let i=0;const joints=[];
  const node=(parent)=>{const name=tok[i++];i++;/*{*/const j={name,parent,offset:[],ch:[],kids:[]};joints.push(j);
    while(tok[i]!='}'){const t=tok[i++];if(t=='OFFSET')j.offset=[+tok[i++],+tok[i++],+tok[i++]];else if(t=='CHANNELS'){const n=+tok[i++];for(let k=0;k<n;k++)j.ch.push(tok[i++]);}
      else if(t=='JOINT')j.kids.push(node(j));else if(t=='End'){i+=2;i++;j.end=[+tok[i++],+tok[i++],+tok[i++]];i++;}}i++;return j;};
  while(tok[i]!='ROOT')i++;i++;node(null);while(tok[i]!='Frames:')i++;const n=+tok[i+1];while(tok[i]!='Time:')i++;const dt=+tok[i+1];i+=2;
  const nch=joints.reduce((a,j)=>a+j.ch.length,0),frames=[];for(let f=0;f<n;f++){frames.push(tok.slice(i,i+nch).map(Number));i+=nch;}return{joints,frames,dt};}
// world rotation and position of every joint for one frame
function fk(B,fr){let c=0;const out={};for(const j of B.joints){let pos=j.offset.slice(),q=[0,0,0,1];for(const ch of j.ch){const v=fr[c++];if(ch.endsWith('position'))pos['XYZ'.indexOf(ch[0])]=v;else q=qmul(q,qaxis(AX[ch[0]],v));}
    if(j.parent){const P=out[j.parent.name];out[j.name]={q:qmul(P.q,q),p:P.p.map((v,k)=>v+qrot(P.q,pos)[k])};}else out[j.name]={q,p:pos};}return out;}
// the game's bones, and which mocap joint drives each (the game's "L" side is -x, which is the performer's right)
const BONES=[['pelvis','Hips'],['chest','Spine1'],['head','Head'],['uArmL','RightArm','RightForeArm'],['fArmL','RightForeArm','RightHand'],['uArmR','LeftArm','LeftForeArm'],['fArmR','LeftForeArm','LeftHand'],
  ['thighL','RightUpLeg','RightLeg'],['shinL','RightLeg','RightFoot'],['footL','RightFoot'],['thighR','LeftUpLeg','LeftLeg'],['shinR','LeftLeg','LeftFoot'],['footR','LeftFoot']];
function bake(file,name,opt){const B=parse(file),J={};for(const j of B.joints)J[j.name]=j;const step=Math.round(1/30/B.dt),F=[];for(let f=opt.skip||0;f<B.frames.length;f+=step)F.push(fk(B,B.frames[f]));
  // limbs: the game's rest pose has arms and legs straight down, the performer's rest pose is a T; C turns one into the other
  const C=BONES.map(([b,j,child])=>child?qfrom([0,-1,0],(()=>{const o=J[child].offset,l=Math.hypot(...o);return o.map(v=>v/l);})()):[0,0,0,1]);
  const legLen=Math.hypot(...J.LeftLeg.offset)+Math.hypot(...J.LeftFoot.offset),scale=.82/legLen;
  // face the direction of travel down +z
  const a=F[0].Hips.p,b=F[F.length-1].Hips.p,yaw=Math.atan2(b[0]-a[0],b[2]-a[2]),Y=qaxis([0,1,0],-yaw*180/Math.PI);
  const pose=f=>BONES.map(([bn,j],i)=>qnorm(qmul(Y,qmul(F[f][j].q,C[i]))));
  // find one full stride that loops: the frame about a cycle later that looks most like the start
  const dist=(f,g)=>{const A=pose(f),Bq=pose(g);let d=0;for(let i=0;i<A.length;i++)d+=1-Math.abs(A[i][0]*Bq[i][0]+A[i][1]*Bq[i][1]+A[i][2]*Bq[i][2]+A[i][3]*Bq[i][3]);return d+Math.abs(F[f].Hips.p[1]-F[g].Hips.p[1])*.02;};
  let best=null;for(let f0=opt.from||4;f0<F.length-opt.min-2&&f0<(opt.from||4)+12;f0++)for(let f1=f0+opt.min;f1<=Math.min(F.length-1,f0+opt.max);f1++){const d=dist(f0,f1);if(!best||d<best[0])best=[d,f0,f1];}
  const [,f0,f1]=best,n=f1-f0,P=[],hip0=F[f0].Hips.p;const travel=[F[f1].Hips.p[0]-F[f0].Hips.p[0],F[f1].Hips.p[2]-F[f0].Hips.p[2]];
  const restHip=legLen+Math.hypot(...J.LeftToeBase.offset)*.35;let meanY=0;for(let k=0;k<n;k++)meanY+=F[f0+k].Hips.p[1]/n;
  for(let k=0;k<n;k++){const q=pose(f0+k),t=k/n,hp=F[f0+k].Hips.p,sway=qrot(Y,[hp[0]-hip0[0]-travel[0]*t,0,hp[2]-hip0[2]-travel[1]*t]);
    P.push({q,y:(hp[1]-meanY)*scale,x:sway[0]*scale});}
  // ease the last few frames into the first so the loop has no pop
  const end=pose(f1),start=pose(f0),inv=q=>[-q[0],-q[1],-q[2],q[3]];
  for(let k=n-5;k<n;k++){const w=(k-(n-5)+1)/6;P[k].q=P[k].q.map((qq,i)=>qslerp(qq,qnorm(qmul(qmul(start[i],inv(end[i])),qq)),w));
    P[k].y+=(P[0].y-(F[f1].Hips.p[1]-meanY)*scale)*w;}
  const r=v=>Math.round(v*1000)/1000;console.log(name+': frames '+f0+'..'+f1+' ('+n+' at 30 fps, '+(n/30).toFixed(2)+'s), loop error '+best[0].toFixed(4)+', stride '+(Math.hypot(...travel)*scale).toFixed(2)+' m, hips '+(meanY*scale).toFixed(2)+' m');
  return{fps:30,n,stride:r(Math.hypot(...travel)*scale),hips:r(meanY*scale),q:P.map(p=>p.q.flat().map(r)),y:P.map(p=>r(p.y)),x:P.map(p=>r(p.x))};}
const dir=path.join(__dirname,'mocap'),clips={walk:bake(path.join(dir,'walk_35_01.bvh'),'walk',{min:26,max:42,from:20}),run:bake(path.join(dir,'run_09_01.bvh'),'run',{min:16,max:28,from:4})};
fs.writeFileSync(path.join(__dirname,'..','js','anim.js'),'"use strict";\n/* Generated by tools/bake-mocap.js from the CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu,\n   created with funding from NSF EIA-0196217). Do not edit by hand. Each clip is one looping stride at 30 fps:\n   q holds a world-space quaternion (x,y,z,w) per bone per frame, y the hips bob and x the hips sway in meters. */\nconst BONE_NAMES='+JSON.stringify(BONES.map(b=>b[0]))+';\nconst CLIPS='+JSON.stringify(clips)+';\n');
