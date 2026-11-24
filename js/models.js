"use strict";
/* River City Quest 3D: low-poly models made of boxes, each part with a pivot so it can swing.
   The front of every model faces +z when its yaw is 0. */
const MODELS={};
function part(build,pivot,name){const m=new Mesh();build(m);return{mesh:m,pivot:pivot||[0,0,0],name:name||''};}
function shadeHex(h,f){const c=rgb(h);return[c[0]*f,c[1]*f,c[2]*f];}
// real-world clothing colors: pull the game's bright palette toward muted, dyed-fabric tones
function cloth(h,k){const c=typeof h=='string'?rgb(h):h,g=(c[0]+c[1]+c[2])/3,m=k==null?.4:k;return c.map(v=>(v*(1-m)+g*m)*.82);}
// a person at real adult proportions, about 7.5 heads tall. Same parts and pivots as before
// (body, head, legL, legR, armL, armR) so all the poses and swings still work.
function humanoid(o){const sk=rgb(o.skin||'#d9a57e'),sh=cloth(o.shirt||'#3d63c8'),pa=cloth(o.pants||'#3c3c54',.25),ha=cloth(o.hat||'#6a4020'),hair=cloth(o.hair||'#3a2414',.1),shoe=cloth(o.shoe||'#2a2228',.1),N=12,w=(o.wide||1)*.96;
  const skD=sk.map(v=>v*.82),lip=[sk[0]*.86,sk[1]*.62,sk[2]*.6],A=o.acc||[];
  const shirtCell=A.includes('coat')?'knit':'cloth',pantCell=o.skirt?'cloth':'denim';
  const P=typeof sculptedHuman=='function'?sculptedHuman(o):[
    part(m=>{// pelvis, torso and neck
      if(o.skirt)m.lathe(0,0,0,[[.5,.25],[.7,.22],[.9,.19],[1.0,.165]],N,pantCell,pa,w,.8,true);
      else m.lathe(0,0,0,[[.84,.15],[.92,.17],[1.0,.165],[1.06,.155]],N,pantCell,pa,w,.72,true);
      m.lathe(0,0,0,[[1.02,.158],[1.1,.15],[1.2,.165],[1.3,.185],[1.38,.19],[1.43,.175],[1.47,.12],[1.5,.07]],N,shirtCell,sh,w,.62,true);
      for(const sx of [-1,1])m.sphere(sx*.19*w,1.41,0,.07,10,5,shirtCell,sh,1,1,1.1);
      m.lathe(0,0,0,[[1.46,.052],[1.6,.048]],10,'skin',sk);
      m.lathe(0,0,0,[[1.0,.162],[1.045,.162]],N,'leather',[.14,.1,.08],w,.73);m.box(-.03,1.0,.11,.03,1.045,.125,'gold');},[0,0,0],'body'),
    part(m=>{// skull, jaw, nose, ears, eyes and brows
      m.sphere(0,.1,-.01,.1,14,9,'skin',sk,1.18,.92,1.05);m.sphere(0,.035,.03,.082,12,6,'skin',sk,1,.86,1,0,.6);
      m.cone(0,.06,.095,.022,.115,.006,5,'skin',skD,-Math.PI/2);m.sphere(0,.065,.1,.018,6,3,'skin',sk);
      for(const sx of [-1,1]){m.sphere(sx*.094,.09,0,.025,6,4,'skin',sk,1.3,.5,1);
        m.sphere(sx*.036,.105,.085,.013,8,4,'white',[.92,.9,.86]);m.sphere(sx*.036,.105,.096,.0065,6,3,'white',[.16,.1,.07]);
        m.box(sx*.036-.022,.124,.082,sx*.036+.022,.131,.094,'hairs',hair);}
      m.box(-.022,.028,.1,.022,.037,.108,'skin',lip);
      const st=o.style||'short';
      if(st=='long')m.lathe(0,0,-.03,[[-.16,.08],[-.04,.11],[.08,.115],[.16,.1]],N,'hairs',hair,1.05,.85);
      if(o.capless){m.sphere(0,.12,-.02,.108,N,6,'hairs',hair,1.12,.95,1.08,.5,1);if(st=='bun')m.sphere(0,.2,-.1,.045,8,4,'hairs',hair);}
      else{m.sphere(0,.13,-.01,.112,N,6,'cloth',ha,1.0,.97,1.06,.55,1);m.lathe(0,.16,.06,[[0,0],[0,.08],[.012,.085]],N,'cloth',ha.map(v=>v*.9),1,1.3,true);
        m.sphere(0,.09,-.06,.1,N,5,'hairs',hair,1,.98,.9,.3,.62);}},[0,1.6,0],'head'),
    part(m=>{m.lathe(0,0,0,[[-.8,.04],[-.74,.05],[-.5,.06],[-.42,.055],[-.2,.075],[0,.085]],10,pantCell,pa);
      m.sphere(0,-.82,.04,.055,10,5,'leather',shoe,.75,1,2.3,.4,1);m.box(-.05,-.86,-.07,.05,-.84,.16,'leather',shoe.map(v=>v*.6));},[-.09,.92,0],'legL'),
    part(m=>{m.lathe(0,0,0,[[-.8,.04],[-.74,.05],[-.5,.06],[-.42,.055],[-.2,.075],[0,.085]],10,pantCell,pa);
      m.sphere(0,-.82,.04,.055,10,5,'leather',shoe,.75,1,2.3,.4,1);m.box(-.05,-.86,-.07,.05,-.84,.16,'leather',shoe.map(v=>v*.6));},[.09,.92,0],'legR'),
    part(m=>{m.lathe(0,0,0,[[-.3,.042],[-.12,.05],[0,.056]],10,shirtCell,sh,1,1,true);m.lathe(0,0,0,[[-.56,.03],[-.45,.036],[-.3,.04]],10,'skin',sk);m.sphere(0,-.61,.01,.04,8,4,'skin',sk,1.3,.55,1);},[-.205*w,1.42,0],'armL'),
    part(m=>{m.lathe(0,0,0,[[-.3,.042],[-.12,.05],[0,.056]],10,shirtCell,sh,1,1,true);m.lathe(0,0,0,[[-.56,.03],[-.45,.036],[-.3,.04]],10,'skin',sk);m.sphere(0,-.61,.01,.04,8,4,'skin',sk,1.3,.55,1);},[.205*w,1.42,0],'armR')];
  const B=P[0].mesh,Hd=P[1].mesh,AL=P[4].mesh,AR=P[5].mesh,dk=c=>c.map(v=>v*.55);
  if(o.paddle){// a two-bladed touring kayak paddle in the right hand
    const c=o.gold?rgb('#c8a040'):[.12,.12,.13],bl=o.gold?rgb('#c8a848'):rgb('#7a2622'),pd=new Mesh();pd.lathe(0,0,0,[[-.75,.016],[.95,.016]],8,o.gold?'gold':'black',c);
    for(const [y,f] of [[1.1,1],[-.9,-1]])pd.sphere(0,y,0,.16,10,5,'paint',bl,1.1,.5,.05);
    for(let i=0;i<pd.pos.length;i+=3){const y=pd.pos[i+1],z=pd.pos[i+2];pd.pos[i+1]=y*.6-z*.8-.6;pd.pos[i+2]=y*.8+z*.6;const ny=pd.nrm[i+1],nz=pd.nrm[i+2];pd.nrm[i+1]=ny*.6-nz*.8;pd.nrm[i+2]=ny*.8+nz*.6;}AR.add(pd);}
  if(A.includes('coat')){const c=cloth(o.coat||'#2a3a6a',.3);B.lathe(0,0,0,[[.55,.22],[.8,.19],[1.05,.175],[1.3,.195],[1.4,.2],[1.46,.15],[1.51,.07]],N,'knit',c,w*1.06,.68);
    for(let i=0;i<4;i++)B.sphere(.0,1.1+i*.1,.13,.011,5,3,'gold');for(const a of [AL,AR])a.lathe(0,0,0,[[-.5,.05],[-.1,.06],[0,.068]],10,'knit',c,1,1,true);}
  if(A.includes('vest')){B.lathe(0,0,0,[[1.04,.17],[1.3,.2],[1.4,.205],[1.46,.15]],N,'cloth',rgb('#e8a020'),w*1.04,.66);}
  if(A.includes('apron')){B.box(-.13,.62,.115,.13,1.36,.125,'cloth',[.86,.84,.78]);}
  if(A.includes('glasses')){const k=[.08,.07,.07];for(const sx of [-1,1]){const x=sx*.036;Hd.lathe(x,.105,.1,[[-.014,.022],[.014,.022]],10,'black',k);}Hd.box(-.014,.11,.1,.014,.114,.104,'black',k);}
  if(A.includes('tricorn')){const c=[.07,.06,.07];Hd.sphere(0,.17,0,.11,N,5,'cloth',c,.8,1,1,.5,1);Hd.lathe(0,.16,0,[[0,.19],[.025,.18],[.035,.1]],3,'cloth',c,1,1,true);}
  if(A.includes('helmet')){const c=cloth(o.helm||'#f2c14e',.15);Hd.sphere(0,.13,-.005,.125,N,6,'white',c,1,1.02,1.08,.45,1);}
  if(A.includes('book')){AL.box(-.08,-.72,-.02,.08,-.5,.06,{top:'paper',side:'leather',south:'leather'},rgb('#5a1c22'));}
  if(A.includes('clipboard')){AL.box(-.08,-.74,.04,.08,-.5,.06,'wood');AL.box(-.07,-.72,.06,.07,-.52,.065,'paper');}
  if(A.includes('pole')){AR.tube([0,-.6,0],[0,1.6,.3],.016,.013,8,'black',[.1,.1,.1]);AR.sphere(0,1.64,.31,.04,6,3,'brass');}
  if(A.includes('gloves')){for(const a of [AL,AR])a.sphere(0,-.61,.01,.046,8,4,'cloth',rgb('#c8a040'),1.3,.6,1.05);AR.sphere(0,-.82,0,.15,10,6,'white',[.1,.12,.16],1.25);}
  if(A.includes('pack')){const c=cloth('#4a3a28',.2);B.lathe(0,1.06,-.16,[[0,.12],[.08,.14],[.34,.14],[.4,.1]],10,'cloth',c,1.05,.55,true);B.box(-.09,1.12,-.25,.09,1.28,-.22,'cloth',dk(c));for(const sx of [-.1,.1])B.box(sx-.018,1.1,-.12,sx+.018,1.46,.12,'cloth',dk(c));}
  return P;}
function enemyModel(t){if(typeof realCreature=='function'){const r=realCreature(t);if(r)return r;}const P=[];
  if(t=='rat'){const c=rgb('#7a7480'),pk=rgb('#e8a0a8');P.push(part(m=>{m.sphere(0,.26,-.05,.26,8,5,'white',c,.85,1,1.55);m.sphere(0,.28,.38,.17,8,4,'white',c,.95,1,1.3);m.sphere(0,.27,.6,.05,5,2,'white',pk);
      m.quad([-.12,.33,.505],[.12,.33,.505],[.12,.45,.505],[-.12,.45,.505],'eyes');for(const sx of [-1,1]){m.sphere(sx*.13,.44,.32,.08,6,3,'white',pk,1,.4,1);m.tube([sx*.1,.0,.25],[sx*.13,.18,.2],.04,.05,4,'white',pk);m.tube([sx*.12,0,-.3],[sx*.15,.18,-.25],.04,.05,4,'white',pk);}
      for(const sx of [-1,1])for(let k=0;k<3;k++)m.box(sx*.05+sx*k*.02-.004,.28-k*.015,.6,sx*.05+sx*k*.02+sx*.16,.284-k*.015,.604,'white',[.9,.9,.9]);},[0,0,0],'body'),
    part(m=>{m.tube([0,0,0],[0,.05,-.45],.035,.025,4,'white',pk);m.tube([0,.05,-.45],[0,.18,-.8],.025,.012,4,'white',pk);},[0,.2,-.42],'tail'));}
  else if(t=='bat'){const c=rgb('#3a3048'),w=rgb('#4a3a5e');P.push(part(m=>{m.sphere(0,0,0,.2,8,5,'white',c,1.15);m.sphere(0,.24,.03,.15,8,4,'white',c);m.quad([-.11,.18,.16],[.11,.18,.16],[.11,.32,.16],[-.11,.32,.16],'eyes');
      for(const sx of [-1,1])m.cone(sx*.09,.34,.02,.06,.5,0,4,'white',c);},[0,0,0],'body'),
    part(m=>{m.quad([0,0,-.15],[0,0,.15],[-.5,.15,.2],[-.5,.15,-.2],'white',w);m.quad([-.5,.15,-.2],[-.5,.15,.2],[-1,.0,.1],[-1,0,-.25],'white',w);m.tube([0,0,.12],[-.5,.15,.2],.02,.02,3,'white',c);m.tube([-.5,.15,.2],[-1,0,.1],.02,.01,3,'white',c);},[-.15,0,0],'wingL'),
    part(m=>{m.quad([0,0,.15],[0,0,-.15],[.5,.15,-.2],[.5,.15,.2],'white',w);m.quad([.5,.15,.2],[.5,.15,-.2],[1,.0,-.25],[1,0,.1],'white',w);m.tube([0,0,.12],[.5,.15,.2],.02,.02,3,'white',c);m.tube([.5,.15,.2],[1,0,.1],.02,.01,3,'white',c);},[.15,0,0],'wingR'));}
  else if(t=='goose'){const wc=rgb('#f0ece4'),or=rgb('#f08a30'),bk=rgb('#2a2a2a');P.push(part(m=>{m.sphere(0,.68,-.05,.36,9,6,'white',wc,.72,.95,1.45);m.cone(0,.62,-.55,.18,.9,.02,6,'white',wc);
      for(const sx of [-1,1]){m.sphere(sx*.3,.72,-.1,.2,7,4,'white',[.86,.84,.78],.55,.5,1.4);m.tube([sx*.1,.0,.0],[sx*.1,.45,-.02],.035,.04,5,'white',or);m.box(sx*.1-.08,0,-.02,sx*.1+.08,.04,.16,'white',or);}},[0,0,0],'body'),
    part(m=>{m.tube([0,0,0],[0,.75,.12],.1,.08,7,'white',bk);m.sphere(0,.82,.15,.13,8,4,'white',bk,1,1,1.15);m.box(-.1,.66,.14,.1,.74,.22,'white',[.95,.95,.95]);m.cone(0,.8,.28,.06,.8,0,5,'white',or);
      m.tube([0,.79,.25],[0,.77,.46],.055,.02,5,'white',or);m.quad([-.11,.82,.28],[.11,.82,.28],[.11,.92,.28],[-.11,.92,.28],'eyes');},[0,.72,.32],'neck'));}
  else if(t=='crab'){const c=rgb('#d84830'),d=rgb('#a83020');P.push(part(m=>{m.sphere(0,.3,0,.42,10,5,'white',c,.55,1.15,.85);m.sphere(0,.25,0,.4,10,3,'white',d,.3,1.15,.85,0,.5);
      for(const sx of [-1,1]){m.tube([sx*.14,.44,.26],[sx*.16,.6,.3],.025,.025,4,'white',d);m.sphere(sx*.16,.63,.31,.05,5,3,'white',[.1,.1,.1]);
        for(let i=0;i<3;i++){const z=-.2+i*.18;m.tube([sx*.4,.28,z],[sx*.7,.36,z+.04],.04,.035,4,'white',d);m.tube([sx*.7,.36,z+.04],[sx*.85,0,z+.08],.035,.02,4,'white',d);}}},[0,0,0],'body'),
    part(m=>{m.tube([0,0,0],[-.05,.05,.3],.06,.07,6,'white',c);m.sphere(-.05,.07,.45,.13,7,4,'white',rgb('#f05a40'),.8,.9,1.3);m.cone(-.05,.07,.55,.07,.12,0,4,'white',d);},[-.4,.3,.2],'clawL'),
    part(m=>{m.tube([0,0,0],[.05,.05,.3],.06,.07,6,'white',c);m.sphere(.05,.07,.45,.13,7,4,'white',rgb('#f05a40'),.8,.9,1.3);m.cone(.05,.07,.55,.07,.12,0,4,'white',d);},[.4,.3,.2],'clawR'));}
  else if(t=='ghost'){const c=rgb('#c8d8f0');P.push(part(m=>{m.lathe(0,0,0,[[0,.62],[.15,.5],[.6,.42],[1.1,.4],[1.45,.36],[1.7,.25],[1.82,0]],10,'white',c);
      for(let i=0;i<6;i++){const a=i/6*6.283;m.cone(Math.cos(a)*.5,0,Math.sin(a)*.5,.14,-.25,0,4,'white',c);}m.quad([-.2,1.25,.38],[.2,1.25,.38],[.2,1.55,.38],[-.2,1.55,.38],'eyes');
      for(const sx of [-1,1])m.tube([sx*.38,1.2,0],[sx*.62,.9,.15],.09,.06,6,'white',c,true);},[0,0,0],'body'));}
  else if(t=='turtle'){const sh=rgb('#3a6a34'),sk=rgb('#6e9e52');P.push(part(m=>{m.lathe(0,.35,0,[[0,1.55],[.15,1.6],[.35,1.5],[.7,1.25],[1.05,.85],[1.3,.4],[1.38,0]],10,'shell',null,1,1.1);
      m.lathe(0,.2,0,[[0,1.45],[.18,1.58]],10,'white',rgb('#c8b878'),1,1.1);for(let i=0;i<6;i++){const a=i/6*6.283;m.sphere(Math.cos(a)*1.0,1.1,Math.sin(a)*1.1,.32,6,3,'white',[.45,.68,.36],.35);}m.sphere(0,1.62,0,.4,6,3,'white',[.45,.68,.36],.4);
      for(const [x,z] of [[-1.05,-.8],[1.05,-.8],[-1.05,.8],[1.05,.8]]){m.tube([x*.8,.4,z*.8],[x,0,z],.32,.28,7,'white',sk,true);for(let k=-1;k<=1;k++)m.cone(x+k*.12,.05,z+.25*Math.sign(z),.06,.05,0,3,'white',[.9,.9,.8]);}
      m.cone(0,.4,-1.5,.2,.45,0,6,'white',sk);},[0,0,0],'body'),
    part(m=>{m.tube([0,0,-.1],[0,.1,.45],.3,.28,8,'white',sk);m.sphere(0,.15,.6,.36,9,5,'white',sk,.85,1,1.2);m.quad([-.26,.22,.98],[.26,.22,.98],[.26,.48,.98],[-.26,.48,.98],'eyes');
      m.cone(0,.05,.98,.18,0,.0,5,'white',[.9,.85,.6]);m.box(-.25,-.02,.82,.25,.02,1.0,'white',[.3,.4,.25]);},[0,.6,1.35],'head'));}
  else if(t=='squirrel'){const c=rgb('#8a6a4a');P.push(part(m=>{m.sphere(0,.25,0,.2,8,4,'white',c,1,.9,1.3);m.sphere(0,.42,.22,.13,7,3,'white',c);m.quad([-.09,.38,.34],[.09,.38,.34],[.09,.5,.34],[-.09,.5,.34],'eyes');for(const sx of [-1,1])m.cone(sx*.07,.5,.2,.04,.62,0,3,'white',c);},[0,0,0],'body'),
    part(m=>{m.sphere(0,.35,-.15,.16,7,4,'white',rgb('#a8865a'),2,.8,.8);},[0,.1,-.2],'tail'));}
  else if(t=='scooter'){P.push(part(m=>{m.box(-.15,.15,-.6,.15,.25,.6,'white',rgb('#3a3a44'));m.tube([0,.25,.5],[0,1.3,.55],.04,.04,5,'black');m.tube([-.3,1.3,.55],[.3,1.3,.55],.03,.03,4,'black');
      for(const z of [-.5,.5])m.tube([-.08,.12,z],[.08,.12,z],.12,.12,8,'white',rgb('#1a1a1a'));m.box(-.12,.9,.48,.12,1.05,.62,{top:'white',side:'white',south:'face'},rgb('#3ac2e8'));m.box(-.04,.95,.62,.04,1.0,.64,'white',[1,1,.6]);},[0,0,0],'body'));}
  else if(t=='raven'){const c=rgb('#1e1c28');P.push(part(m=>{m.sphere(0,0,0,.4,8,5,'white',c,.9,.9,1.4);m.sphere(0,.25,.45,.25,8,4,'white',c);m.cone(0,.22,.65,.08,.22,0,4,'white',rgb('#3a3848'));m.cone(0,.2,.65,.08,.2,0,4,'white',rgb('#3a3848'));
      for(const sx of [-1,1])m.sphere(sx*.11,.32,.62,.04,4,2,'white',rgb('#e83048'));m.cone(0,-.05,-.55,.25,-.08,0,4,'white',c);},[0,0,0],'body'),
    part(m=>{m.quad([0,0,-.3],[0,0,.3],[-1.3,.2,.1],[-1.3,.2,-.4],'white',rgb('#2a2836'));},[-.3,.1,0],'wingL'),part(m=>{m.quad([0,0,.3],[0,0,-.3],[1.3,.2,-.4],[1.3,.2,.1],'white',rgb('#2a2836'));},[.3,.1,0],'wingR'));}
  else if(t=='wraith'){const c=rgb('#b8c8e8');P.push(part(m=>{m.lathe(0,-1.4,0,[[0,.9],[.4,.75],[1.2,.6],[1.8,.5],[2.1,.3],[2.3,0]],10,'white',c);m.sphere(0,1.2,.05,.38,8,5,'white',[.9,.92,1]);
      m.quad([-.25,1.05,.42],[.25,1.05,.42],[.25,1.42,.42],[-.25,1.42,.42],'eyes');for(const sx of [-1,1])m.tube([sx*.5,.7,0],[sx*1,.1,.4],.12,.06,6,'white',c,true);m.lathe(0,1.1,0,[[0,.45],[.3,.48],[.6,.2]],8,'white',[.4,.4,.55]);},[0,0,0],'body'));}
  else if(t=='bell'){P.push(part(m=>{m.lathe(0,0,0,[[0,1.7],[.15,1.75],[.3,1.55],[1,1.2],[1.8,1],[2.2,.7],[2.4,0]],12,'gold',rgb('#c08840'));m.tube([0,2.4,0],[0,2.9,0],.15,.15,6,'black');m.sphere(0,.3,0,.3,6,3,'black');
      m.quad([-.4,1.3,1.13],[.4,1.3,1.13],[.4,1.7,1.08],[-.4,1.7,1.08],'eyes');},[0,0,0],'body'));}
  else if(t=='foreman'){const ir=rgb('#5a5e6a'),dk=rgb('#3a3c44');P.push(part(m=>{m.lathe(0,0,0,[[0,.5],[.9,.55],[1.2,.75],[2.2,.85],[2.5,.6],[2.6,0]],10,'white',ir,1,.8);m.box(-.6,1.2,.55,.6,2.3,.7,'white',rgb('#8e909c'));
      for(let i=0;i<3;i++)m.sphere(-.4+i*.4,1.7,.7,.07,4,2,'white',rgb('#c8c8d0'));m.sphere(0,2.9,0,.42,8,5,'white',dk);m.box(-.3,2.85,.36,.3,3,.42,'white',rgb('#f8a030'));m.tube([.2,3.2,-.2],[.2,3.9,-.2],.12,.14,6,'black');
      for(const sx of [-1,1]){m.tube([sx*.85,2.3,0],[sx*1.1,1.2,.3],.22,.2,7,'white',ir,true);m.sphere(sx*1.1,1.05,.35,.3,7,4,'white',dk);m.tube([sx*.3,.9,0],[sx*.35,0,.05],.24,.26,7,'white',dk);}},[0,0,0],'body'));}
  else if(t=='arum'){P.push(part(m=>{m.lathe(0,0,0,[[0,1.1],[.5,1.2],[.9,.9]],8,'white',rgb('#6a4a2a'),1,1,true);for(let i=0;i<6;i++){const a=i/6*6.283;m.tube([Math.cos(a)*.6,.6,Math.sin(a)*.6],[Math.cos(a)*1.4,1.4,Math.sin(a)*1.4],.25,.08,5,'leaves2');}
      m.lathe(0,.8,0,[[0,.5],[1.2,.8],[2.2,.9],[2.8,.6]],10,'white',rgb('#6a1a3a'));m.lathe(0,2,0,[[0,.18],[2.6,.12],[3,0]],6,'white',rgb('#e8d070'));},[0,0,0],'body'));}
  else if(t=='vampire'){const c=rgb('#1a1423');P.push(part(m=>{m.lathe(0,0,0,[[0,.7],[.6,.55],[1.4,.4],[1.7,.3]],10,'white',c);m.sphere(0,2,0,.3,8,5,'white',rgb('#d8d4e8'));m.quad([-.2,1.85,.3],[.2,1.85,.3],[.2,2.15,.3],[-.2,2.15,.3],'eyes');
      m.lathe(0,1.6,-.05,[[0,.55],[.9,.45]],10,'white',rgb('#8a1424'),1,.7);for(const sx of [-1,1])m.cone(sx*.12,2.25,0,.06,2.5,0,3,'white',c);},[0,0,0],'body'));}
  return P;}
function pigeonModel(){if(typeof realPigeon=='function')return realPigeon();const g=rgb('#8a8a96'),d=rgb('#6a6a76');return[part(m=>{m.sphere(0,.2,0,.16,8,4,'pigeon',null,.85,.9,1.3);m.sphere(0,.36,.17,.09,6,3,'white',rgb('#5a8a7a'));m.cone(0,.36,.25,.03,.36,0,4,'white',rgb('#e8c070'));m.cone(0,.18,-.2,.1,.22,0,4,'white',d);
    for(const sx of [-1,1])m.tube([sx*.04,.06,0],[sx*.04,0,.02],.012,.012,3,'white',rgb('#e86870'));},[0,0,0],'body'),
  part(m=>m.quad([0,0,-.12],[0,0,.12],[-.32,.02,.08],[-.32,.02,-.14],'white',d),[-.1,.24,0],'wingL'),part(m=>m.quad([0,0,.12],[0,0,-.12],[.32,.02,-.14],[.32,.02,.08],'white',d),[.1,.24,0],'wingR')];}
const LIFE_KINDS=new Set(['tomato','frog','painting','fish','bike','camera','rod','basket','secret']);
function propModel(t){if(LIFE_KINDS.has(t))return lifeModel(t);const P=[];
  if(t=='coin')P.push(part(m=>{m.cone(0,-.25,0,.3,.25,.3,8,'gold');m.disc(0,.25,0,.3,8,'gold');m.disc(0,-.25,0,.3,8,'gold',null,true);},[0,0,0]));
  else if(t=='heart')P.push(part(m=>{const c=rgb('#e83048');m.box(-.3,0,-.08,0,.3,.08,'white',c);m.box(0,0,-.08,.3,.3,.08,'white',c);m.box(-.2,-.25,-.08,.2,0,.08,'white',c);m.box(-.08,-.4,-.08,.08,-.25,.08,'white',c);},[0,0,0]));
  else if(t=='key')P.push(part(m=>{const c=rgb('#f2c14e');m.box(-.06,-.35,-.04,.06,.25,.04,'white',c);m.box(-.2,.2,-.04,.2,.5,.04,'white',c);m.box(.06,-.3,-.04,.2,-.2,.04,'white',c);},[0,0,0]));
  else if(t=='keystone')P.push(part(m=>{m.box(-.4,-.4,-.25,.4,.4,.25,'keystone');},[0,0,0]));
  else if(t=='chest'){P.push(part(m=>m.box(-.6,0,-.42,.6,.6,.42,{top:'wood',side:'chest'}),[0,0,0],'base'),part(m=>m.box(-.62,0,-.44,.62,.32,.44,{top:'wood',side:'wood'}),[0,.6,-.42],'lid'));}
  else if(t=='bush')P.push(part(m=>shrub(m,0,0,7,1.15),[0,0,0]));
  else if(t=='rubble')P.push(part(m=>{m.cone(-.3,0,0,.7,.9,.2,5,'rock');m.cone(.4,0,.2,.6,.7,.1,5,'rock');m.cone(0,0,-.3,.5,1.1,0,5,'rock');},[0,0,0]));
  else if(t=='lock')P.push(part(m=>m.box(-TS/2,0,-.3,TS/2,3.2,.3,{top:'wood',side:'lock'}),[0,0,0]));
  else if(t=='crack')P.push(part(m=>m.box(-TS/2,0,-TS/2,TS/2,4,TS/2,{top:'black',side:'crack'}),[0,0,0]));
  else if(t=='bomb')P.push(part(m=>{m.cone(0,0,0,.35,.7,.35,8,'wood');m.disc(0,.7,0,.35,8,'wood');m.box(-.03,.7,-.03,.03,.95,.03,'white',rgb('#f2c14e'));},[0,0,0]));
  else if(t=='trash')P.push(part(m=>{m.box(-.22,0,-.15,.22,.5,.15,'paper');m.box(-.1,.5,-.05,.1,.6,.05,'white',rgb('#3ac2e8'));},[0,0,0]));
  else if(t=='ballpk'||t=='ballfly')P.push(part(m=>{m.sphere(0,0,0,.2,8,5,'white',[.96,.96,.94]);m.tube([-.2,0,.0],[.2,.05,0],.205,.205,8,'white',[.96,.96,.94]);for(let k=0;k<4;k++)m.box(-.15+k*.1,.17,-.02,-.13+k*.1,.2,.02,'white',[.9,.1,.1]);},[0,0,0]));
  else if(t=='powpk')P.push(part(m=>{m.cone(0,-.25,0,.22,.25,.22,8,'wood');m.disc(0,.25,0,.22,8,'wood');m.box(-.02,.25,-.02,.02,.4,.02,'white',[1,.8,.3]);},[0,0,0]));
  else if(t=='container'){P.push(part(m=>{const c=rgb('#e83048');m.sphere(-.17,.1,0,.22,8,4,'white',c);m.sphere(.17,.1,0,.22,8,4,'white',c);m.cone(0,.05,0,.38,-.45,0,8,'white',c);},[0,0,0]));}
  else if(t=='piece')P.push(part(m=>{const c=rgb('#f890a0');m.sphere(-.1,.06,0,.13,6,3,'white',c);m.cone(-.05,.03,0,.2,-.26,0,6,'white',c);},[0,0,0]));
  else if(t=='part')P.push(part(m=>{m.tube([0,-.6,0],[0,.6,0],.05,.05,5,'wood');m.box(-.18,.5,-.04,.18,1,.04,'wood');},[0,0,0]));
  else if(t=='bib')P.push(part(m=>{m.box(-.3,-.25,-.02,.3,.25,.02,'paper');m.box(-.2,-.08,.02,.2,.08,.03,'white',[.1,.1,.1]);},[0,0,0]));
  else if(t=='carkey'||t=='skey')P.push(part(m=>{const c=rgb(t=='carkey'?'#c08840':'#f2c14e');m.tube([0,-.35,0],[0,.2,0],.05,.05,5,'white',c);m.lathe(0,.2,0,[[0,.18],[.08,.2],[.24,.18],[.3,0]],8,'white',c);m.box(.05,-.3,-.03,.18,-.2,.03,'white',c);},[0,0,0]));
  else if(t=='flag')P.push(part(m=>{m.tube([0,-.5,0],[0,1.6,0],.04,.04,5,'black');m.quad([0,1.6,0],[.9,1.6,0],[.9,1.1,0],[0,1.1,0],'awning');},[0,0,0]));
  else if(t=='token'||t=='tap'||t=='lure')P.push(part(m=>{m.sphere(0,0,0,.2,8,4,'gold',null,.6);m.disc(0,.12,0,.12,6,'white',[1,1,.7]);},[0,0,0]));
  else if(t=='melonpk')P.push(part(m=>{m.sphere(0,0,0,.3,8,5,'leaves2',[.7,1.2,.6],.8,1,1.2);},[0,0,0]));
  else if(t=='block')P.push(part(m=>{m.box(-TS/2+.05,0,-TS/2+.05,TS/2-.05,TS*.9,TS/2-.05,{top:'stone',side:'stone'});m.box(-.5,TS*.9,-.5,.5,TS*.9+.04,.5,'gold');},[0,0,0]));
  else if(t=='brazier')P.push(part(m=>{m.lathe(0,0,0,[[0,.35],[.15,.25],[.9,.15],[1,.45],[1.3,.6],[1.35,.5]],8,'black');},[0,0,0]));
  else if(t=='sprout')P.push(part(m=>{m.lathe(0,0,0,[[0,.4],[.4,.5],[.45,.4]],8,'stone',null,1,1,true);m.tube([0,.4,0],[.05,.8,0],.04,.02,4,'white',[.7,.6,.3]);m.sphere(.08,.82,.02,.08,5,3,'white',[.6,.6,.3]);},[0,0,0]));
  else if(t=='grown')P.push(part(m=>{m.swayV=.03;m.lathe(0,0,0,[[0,.85],[.12,.8],[.22,.5],[.26,0]],10,'vine',null,1,1,true);for(let k=0;k<6;k++){const a=k*1.05;m.sphere(Math.cos(a)*.55,.2,Math.sin(a)*.55,.22,6,3,'leaves2');}
    for(let k=0;k<4;k++){const a=k*1.6+.4;m.sphere(Math.cos(a)*.4,.34,Math.sin(a)*.4,.1,5,3,'white',rgb(k&1?'#f08098':'#f8e060'));}},[0,0,0]));
  else if(t=='gate')P.push(part(m=>{m.box(-TS/2,0,-.12,TS/2,3.6,.12,{top:'black',side:'bars'});},[0,0,0]));
  else if(t=='kayak')P.push(part(m=>{m.lathe(0,0,0,[[-1.4,0],[-1,.32],[0,.42],[1,.32],[1.4,0]].map(([z,r])=>[z,r]),8,'white',rgb('#f2c14e'),1,.45);},[0,0,0]));
  else if(t=='bug')P.push(part(m=>{m.sphere(0,0,0,.2,7,4,'gold',null,.8,1,1.3);m.sphere(0,.02,.22,.1,6,3,'gold');for(const sx of [-1,1])m.quad([0,.1,0],[sx*.4,.15,-.1],[sx*.35,.12,.2],[0,.1,.1],'white',[1,1,.8]);},[0,0,0]));
  else if(t=='hookhead')P.push(part(m=>{m.cone(0,0,0,.18,.3,0,4,'black');for(let k=0;k<3;k++){const a=k/3*6.283;m.tube([0,0,0],[Math.cos(a)*.25,-.15,Math.sin(a)*.25],.04,.03,4,'black');}},[0,0,0]));
  else if(t=='shot')P.push(part(m=>{m.sphere(0,0,0,.22,6,4,'white');},[0,0,0]));
  else if(t=='shadow')P.push(part(m=>m.disc(0,.03,0,.55,8,'black'),[0,0,0]));
  return P;}
function getModel(key,build){return MODELS[key]||(MODELS[key]=build());}

/* ---------- everyday life: the dog, the bike, food, fishing and furniture ---------- */
function wheel(m,x,y,z,r,axis,col){const n=10,pts=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;pts.push(axis=='x'?[x,y+Math.sin(a)*r,z+Math.cos(a)*r]:[x+Math.cos(a)*r,y+Math.sin(a)*r,z]);}
  for(let i=0;i<n;i++)m.tube(pts[i],pts[i+1],r*.16,r*.16,4,'white',col||[.12,.12,.14]);m.tube(axis=='x'?[x-.04,y,z]:[x,y,z-.04],axis=='x'?[x+.04,y,z]:[x,y,z+.04],r*.25,r*.25,6,'white',[.6,.6,.66]);}
function lifeModel(t){const P=[];
  if(t=='dog'){const fur=rgb('#c8904a'),dk=rgb('#7a4a22'),wh=rgb('#f0e0c8'),bl=[.08,.07,.07];
    P.push(part(m=>{m.sphere(0,.5,0,.22,8,5,'white',fur,1,1,1.75);m.sphere(0,.44,.16,.15,8,4,'white',wh,1,1,1.3);m.lathe(0,.62,.3,[[0,.1],[.06,.11]],8,'white',rgb('#e83048'));},[0,0,0],'body'),
      part(m=>{m.sphere(0,0,0,.17,8,5,'white',fur);m.sphere(0,-.05,.15,.1,7,4,'white',wh,.75,1,1.3);m.sphere(0,-.02,.27,.04,5,3,'white',bl);
        m.box(-.1,.03,.13,-.05,.07,.16,'white',bl);m.box(.05,.03,.13,.1,.07,.16,'white',bl);m.box(-.2,-.12,-.05,-.13,.12,.07,'white',dk);m.box(.13,-.12,-.05,.2,.12,.07,'white',dk);},[0,.74,.42],'head'),
      part(m=>m.tube([0,0,0],[0,.18,-.24],.05,.025,5,'white',fur),[0,.58,-.36],'tail'));
    for(const [x,z,nm] of [[-.11,.24,'legFL'],[.11,.24,'legFR'],[-.11,-.24,'legBL'],[.11,-.24,'legBR']])P.push(part(m=>{m.box(-.045,-.4,-.045,.045,0,.045,'white',fur);m.box(-.05,-.42,-.03,.05,-.36,.07,'white',wh);},[x,.42,z],nm));}
  else if(t=='bike'){const red=rgb('#e83048');P.push(part(m=>{wheel(m,0,.34,.52,.32,'x');wheel(m,0,.34,-.52,.32,'x');m.tube([0,.34,-.52],[0,.95,-.1],.035,.035,5,'white',red);m.tube([0,.34,.52],[0,1,.42],.035,.035,5,'white',red);
      m.tube([0,.95,-.1],[0,1,.42],.035,.035,5,'white',red);m.tube([0,.34,-.52],[0,.34,.05],.03,.03,5,'white',red);m.tube([0,.34,.05],[0,.95,-.1],.035,.035,5,'white',red);m.box(-.09,.97,-.2,.09,1.04,.02,'white',[.12,.1,.1]);m.tube([-.28,1.12,.4],[.28,1.12,.4],.025,.025,5,'white',[.5,.5,.55]);m.tube([0,1,.42],[0,1.12,.4],.03,.03,5,'white',[.5,.5,.55]);},[0,0,0]));}
  else if(t=='soapbox'){const r=rgb('#e83048');P.push(part(m=>{m.box(-.45,.25,-.9,.45,.6,.9,{top:'planks',side:'planks'},r);m.box(-.4,.6,-.2,.4,.9,-.1,'planks',r);m.cone(0,.3,.9,.45,.6,.1,4,'white',r,Math.PI/4);
      wheel(m,-.52,.25,.6,.25,'x');wheel(m,.52,.25,.6,.25,'x');wheel(m,-.52,.25,-.6,.25,'x');wheel(m,.52,.25,-.6,.25,'x');m.tube([-.52,.25,.6],[.52,.25,.6],.03,.03,4,'white',[.4,.4,.4]);m.tube([-.52,.25,-.6],[.52,.25,-.6],.03,.03,4,'white',[.4,.4,.4]);
      m.box(-.06,.7,.42,.06,.9,.48,'white',[.2,.2,.2]);m.disc(0,.95,.44,.14,8,'white',[.15,.15,.15]);m.box(-.2,.45,-.5,.2,.62,-.15,'white',rgb('#f8e060'));},[0,0,0]));}
  else if(t=='racecar'){const b=rgb('#3d63c8'),y=rgb('#f2c14e');P.push(part(m=>{m.box(-.6,.2,-1.1,.6,.55,1.1,'white',b);m.box(-.5,.55,-.35,.5,.82,.3,'white',[.15,.15,.2]);m.box(-.4,.6,.3,.4,.78,.34,'glass');m.cone(0,.22,1.1,.6,.5,.15,4,'white',b,Math.PI/4);
      m.box(-.7,.85,-1.15,.7,.95,-.9,'white',y);m.box(-.06,.55,-1.05,.06,.86,-.95,'white',[.2,.2,.2]);m.box(-.61,.3,-.2,.61,.5,.2,'white',[.95,.95,.95]);
      for(const [x,z] of [[-.66,.7],[.66,.7],[-.66,-.7],[.66,-.7]]){m.tube([x-.13,.3,z],[x+.13,.3,z],.3,.3,8,'white',[.1,.1,.12]);}},[0,0,0]));}
  else if(t=='bobber')P.push(part(m=>{m.sphere(0,0,0,.12,8,5,'white',rgb('#e83048'),1,1,1,.5,1);m.sphere(0,0,0,.12,8,5,'white',[1,1,1],1,1,1,0,.5);m.tube([0,.1,0],[0,.28,0],.015,.015,4,'white',[.2,.2,.2]);},[0,0,0]));
  else if(t=='frog')P.push(part(m=>{const g=rgb('#58b048');m.sphere(0,.14,0,.17,8,4,'white',g,.75,1,1.2);m.sphere(-.08,.27,.1,.06,6,3,'white',[.95,.95,.85]);m.sphere(.08,.27,.1,.06,6,3,'white',[.95,.95,.85]);
      m.sphere(-.08,.28,.15,.025,4,2,'white',[.05,.05,.05]);m.sphere(.08,.28,.15,.025,4,2,'white',[.05,.05,.05]);m.sphere(-.15,.06,-.08,.08,5,3,'white',g,.6,1,1.6);m.sphere(.15,.06,-.08,.08,5,3,'white',g,.6,1,1.6);},[0,0,0]));
  else if(t=='tomato')P.push(part(m=>{m.sphere(0,.25,0,.24,8,5,'white',rgb('#e83030'),.8);m.cone(0,.42,0,.12,.47,.02,5,'white',rgb('#3d8a3a'));m.tube([0,.44,0],[0,.56,0],.02,.02,4,'white',rgb('#3d8a3a'));},[0,0,0]));
  else if(t=='painting')P.push(part(m=>{m.box(-.5,.2,-.06,.5,1.0,.06,'white',rgb('#c9a26b'));m.quad([-.42,.28,.07],[.42,.28,.07],[.42,.92,.07],[-.42,.92,.07],'mural');},[0,0,0]));
  else if(t=='fish')P.push(part(m=>{const c=rgb('#8aa0b8');m.sphere(0,.3,0,.14,7,4,'white',c,1,.5,2.2);m.cone(0,.3,-.33,.02,.3,.14,4,'white',c);m.sphere(0,.34,.22,.025,4,2,'white',[.05,.05,.05]);},[0,0,0]));
  else if(t=='camera'||t=='rod'||t=='basket'){P.push(part(m=>{if(t=='camera'){m.box(-.3,0,-.15,.3,.4,.15,'white',[.15,.15,.18]);m.tube([0,.2,.1],[0,.2,.3],.14,.12,8,'white',[.3,.3,.35]);m.box(-.25,.4,-.1,-.05,.5,.1,'white',[.6,.6,.65]);}
      else if(t=='rod'){m.tube([0,0,0],[0,1.4,0],.04,.015,5,'white',rgb('#8a5a34'));m.tube([0,.25,0],[.12,.25,0],.08,.08,6,'white',[.5,.5,.55]);}
      else{m.lathe(0,0,0,[[0,.28],[.3,.34],[.32,.36]],8,'planks',rgb('#d8a860'));m.tube([-.3,.32,0],[0,.62,0],.03,.03,4,'white',rgb('#a87830'));m.tube([0,.62,0],[.3,.32,0],.03,.03,4,'white',rgb('#a87830'));m.box(-.3,.3,-.3,.3,.33,.3,'white',[.85,.2,.2]);}},[0,0,0]));}
  else if(t=='bed')P.push(part(m=>{m.box(-.85,0,-1.6,.85,.45,1.6,'wood');m.box(-.8,.45,-1.55,.8,.62,1.55,'white',[.95,.94,.9]);m.box(-.82,.5,-1.0,.82,.68,1.4,'white',rgb('#3d63c8'));m.box(-.5,.62,-1.5,.5,.82,-1.15,'white',[1,1,1]);m.box(-.85,0,-1.7,.85,1.3,-1.6,'wood');},[0,0,0]));
  else if(t=='stove')P.push(part(m=>{m.box(-.8,0,-.6,.8,1.1,.6,'white',[.3,.3,.35]);m.box(-.7,.2,.6,.7,.8,.62,'white',[.15,.15,.18]);for(const x of [-.4,.4])for(const z of [-.25,.25])m.disc(x,1.11,z,.16,8,'white',[.75,.2,.15]);m.box(-.8,1.1,-.6,.8,1.5,-.5,'white',[.25,.25,.3]);},[0,0,0]));
  else if(t=='piano')P.push(part(m=>{m.box(-1.2,0,-.5,1.2,1.6,.2,'wood',rgb('#5a3420'));m.box(-1.15,.85,.2,1.15,.95,.6,'white',rgb('#5a3420'));m.box(-1.1,.95,.25,1.1,1.0,.58,'white',[.97,.97,.95]);for(let i=0;i<14;i++)m.box(-1.05+i*.15,1.0,.25,-.99+i*.15,1.04,.42,'white',[.06,.06,.06]);m.box(-1.2,0,.2,-1.1,.85,.6,'wood');m.box(1.1,0,.2,1.2,.85,.6,'wood');},[0,0,0]));
  else if(t=='tank')P.push(part(m=>{m.box(-.9,0,-.4,.9,.8,.4,'wood');m.box(-.85,.8,-.35,.85,1.6,.35,'white',rgb('#3a8a96'));m.box(-.87,1.6,-.37,.87,1.65,.37,'white',[.2,.2,.25]);m.box(-.8,.82,-.3,.8,.95,.3,'sand');},[0,0,0]));
  else if(t=='fern')P.push(part(m=>{m.swayV=.03;m.lathe(0,0,0,[[0,.25],[.5,.32],[.55,.35]],8,'white',rgb('#a8643a'));for(let k=0;k<7;k++){const a=k*.9;m.tube([0,.5,0],[Math.cos(a)*.6,1.1+(k%2)*.2,Math.sin(a)*.6],.08,.02,4,'leaves2');}},[0,0,0]));
  else if(t=='rug')P.push(part(m=>{m.box(-2,0,-1.3,2,.03,1.3,'white',rgb('#8a2a3a'));m.box(-1.7,.03,-1.05,1.7,.05,1.05,'white',rgb('#c8a060'));m.box(-1.35,.05,-.75,1.35,.07,.75,'white',rgb('#3a5a8a'));},[0,0,0]));
  else if(t=='trophy')P.push(part(m=>{m.lathe(0,0,0,[[0,.12],[.06,.12],[.08,.04],[.2,.04],[.24,.1],[.4,.13],[.42,.0]],8,'gold');},[0,0,0]));
  else if(t=='mailbox')P.push(part(m=>{m.box(-.3,0,-.2,.3,.06,.2,'white',[.95,.93,.85]);m.box(-.25,.06,-.15,.25,.09,.15,'white',[.9,.86,.75]);},[0,0,0]));
  /* mini-game props */
  else if(t=='ball')P.push(part(m=>m.sphere(0,0,0,.11,8,5,'white',[1,1,1]),[0,0,0]));
  else if(t=='bball')P.push(part(m=>{m.sphere(0,0,0,.2,8,5,'white',rgb('#e07a28'));m.lathe(0,0,0,[[-.005,.205],[.005,.205]],8,'white',[.1,.08,.08]);},[0,0,0]));
  else if(t=='tball')P.push(part(m=>m.sphere(0,0,0,.1,8,5,'white',rgb('#d8f060')),[0,0,0]));
  else if(t=='pball')P.push(part(m=>m.sphere(0,0,0,.3,8,5,'white',[.88,.9,.96]),[0,0,0]));
  else if(t=='bumper')P.push(part(m=>{m.lathe(0,0,0,[[0,.62],[.25,.6],[.3,.5],[.55,.5],[.6,.0]],10,'white',rgb('#e83048'));},[0,0,0]));
  else if(t=='flipper')P.push(part(m=>{m.box(0,0,-.16,1.7,.35,.16,'white',rgb('#f2c14e'));m.lathe(0,0,0,[[0,.2],[.35,.2]],8,'white',rgb('#f2c14e'),1,1,true);},[0,0,0]));
  else if(t=='hay')P.push(part(m=>{m.box(-.7,0,-.45,.7,.8,.45,{top:'sand',side:'planks'},rgb('#e8c060'));m.box(-.71,.25,-.46,.71,.3,.46,'white',[.6,.4,.2]);m.box(-.71,.55,-.46,.71,.6,.46,'white',[.6,.4,.2]);},[0,0,0]));
  else if(t=='cone')P.push(part(m=>{m.box(-.3,0,-.3,.3,.06,.3,'white',rgb('#e86a20'));m.cone(0,.06,0,.22,.85,.04,8,'white',rgb('#e86a20'));m.cone(0,.4,0,.15,.55,.11,8,'white',[1,1,1]);},[0,0,0]));
  else if(t=='puddle'||t=='oil')P.push(part(m=>{m.disc(0,.03,0,.9,10,'white',t=='oil'?[.06,.05,.08]:rgb('#5a8ab8'));m.disc(.2,.04,.1,.35,8,'white',t=='oil'?[.3,.2,.45]:[.75,.88,1]);},[0,0,0]));
  return P;}
