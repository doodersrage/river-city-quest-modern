// The skeleton and the motion capture: people have bending joints, their feet stay on the ground, and the stride loops.
const G=require('./harness.js');const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const P=G.humanoid({}),S=P.skel;
ok(S&&P.every(pt=>pt.mesh.bw.length==pt.mesh.count*3),'a person is rigged: every vertex follows one or two of 13 bones');
const ang=(a,b)=>Math.acos(Math.min(1,Math.abs(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3])))*2;
for(const [name,run] of [['walk',false],['run',true]]){const C=G.CLIPS[name];let lo=9,hi=-9,knee=0,elbow=0,bad=0;
  for(let k=0;k<40;k++){S.anim.blend=1;S.anim.run=run;S.anim.frame=k;const b=G.skelPose(S,{_walk:k/40*6.2832/(run?.68:.9),_moving:true,_run:run},k);if(Array.from(b).some(v=>!isFinite(v)))bad++;
    for(const f of [9,12]){const sole=b.pos[f][1]+G.Qt.rot(b.q[f],[0,-.065,.13])[1],heel=b.pos[f][1]+G.Qt.rot(b.q[f],[0,-.065,-.05])[1];lo=Math.min(lo,sole,heel);hi=Math.max(hi,Math.min(sole,heel));}
    knee=Math.max(knee,ang(b.q[7],b.q[8]),ang(b.q[10],b.q[11]));elbow=Math.max(elbow,ang(b.q[3],b.q[4]),ang(b.q[5],b.q[6]));}
  ok(!bad,name+': every bone matrix is finite');ok(Math.abs(lo)<.03,name+': the lower foot touches the ground ('+lo.toFixed(3)+' m)');ok(hi>.08,name+': the other foot lifts ('+hi.toFixed(2)+' m)');
  ok(knee>.6,name+': knees bend ('+Math.round(knee*57)+' degrees)');ok(elbow>.15,name+': elbows bend ('+Math.round(elbow*57)+' degrees)');
  const a=G.clipSample(C,.999),z=G.clipSample(C,0);let d=0;for(let i=0;i<13;i++)d=Math.max(d,ang(a.q[i],z.q[i]));ok(d<.12,name+': the stride loops without a pop ('+(d*57).toFixed(1)+' degrees at the seam)');
  ok(C.stride>(run?1.8:1)&&C.stride<(run?3.5:1.8),name+': a '+C.stride+' m stride in '+(C.n/30).toFixed(2)+' s');}
S.anim.blend=0;S.anim.frame=-1;const idle=G.skelPose(S,{_moving:false},5);ok(Math.abs(idle.pos[9][1]-S.rest[9][1])<.012&&Math.abs(idle.pos[2][1]-S.rest[2][1])<.02&&Math.abs(idle.pos[4][0])<.26,'standing still, the feet are planted and the head is level');
const up=G.skelPose(S,{armR:{x:-2.9},armL:{x:-2.9}},6);ok(up.pos[6][1]>up.pos[5][1],'the game can still raise both arms to hold something up');
const sit=G.skelPose(S,{legL:{x:-1.4},legR:{x:-1.4}},7);ok(sit.pos[0][1]<.75&&sit.pos[8][2]>.3,'and sit with knees bent');
// the real bodies
for(const sex of ['m','f']){const M=G.bodyMesh(sex,false,false,'short'),n=M.pos.length/3;let bad=0,hair=0;for(let i=0;i<n;i++){if(!(M.bw[i*3]>=0&&M.bw[i*3]<13&&M.bw[i*3+1]>=0&&M.bw[i*3+1]<13&&M.bw[i*3+2]>=0&&M.bw[i*3+2]<=1))bad++;if(M.col[i*3]==7)hair++;if(!isFinite(M.pos[i*3]+M.nrm[i*3]))bad++;}
  let top=0;for(let i=0;i<n;i++)top=Math.max(top,M.pos[i*3+1]);ok(n>10000&&!bad&&Math.max(...M.idx)<n,(sex=='m'?'the man':'the woman')+' is a real body: '+n+' points, each on valid bones');ok(top>1.55&&top<1.8&&hair>200,'and stands '+top.toFixed(2)+' m tall with hair on the scalp');}
const W=G.humanoid({skirt:true,style:'long',capless:true}),names=W.map(p=>p.name);ok(names.includes('skin')&&names.includes('shoes')&&W.find(p=>p.pal).pal.length==36,'each person wears shoes and brings their own colors to the shared body');
// the animals
for(const t of ['rat','squirrel','goose','crab','bat','raven','ghost','turtle']){const P=G.enemyModel(t),S=P.skel,m=P[0].mesh,n=S.rest.length;let bad=0,move=0;
  for(let i=0;i<m.bw.length;i+=3)if(!(m.bw[i]<n&&m.bw[i+1]<n&&m.bw[i+2]>=0&&m.bw[i+2]<=1))bad++;
  const a=G.skelPose(S,{_g:0,_s:1,_t:0,_st:'walk'},0),b=G.skelPose(S,{_g:1.6,_s:1,_t:9,_al:1,_lg:1,_st:'walk'},9);for(let i=0;i<a.length;i++){if(!isFinite(a[i]+b[i]))bad++;move=Math.max(move,Math.abs(a[i]-b[i]));}
  ok(S&&n<=13&&m.bw.length==m.count*3&&!bad&&move>.05,'the '+t+' has a skeleton of '+n+' bones and its joints move');}
