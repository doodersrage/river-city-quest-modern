"use strict";
/* River City Quest Modern: the animals as they really look. Norway rats, eastern gray squirrels,
   Canada geese, Chesapeake blue crabs, big brown bats, rock pigeons, a snapping turtle and a raven,
   plus a pale, half-seen spirit for the ghosts. Each keeps the part names the game animates. */
function realCreature(t){const P=[];const eye=(m,x,y,z,r)=>{m.sphere(x,y,z,r,8,4,'white',[.03,.02,.02]);m.sphere(x+r*.3,y+r*.35,z+r*.6,r*.3,5,3,'white',[.9,.9,.9]);};
  if(t=='rat'){const c=rgb('#6e6258'),bl=rgb('#c8b4a8'),pk=rgb('#d0a098');
    P.push(part(m=>{m.sphere(0,.17,-.02,.17,14,8,'fur',c,.78,.95,1.65);m.sphere(0,.12,.02,.15,12,6,'fur',bl,.6,.9,1.5,0,.45);
      m.sphere(0,.2,.3,.1,12,6,'fur',c,.85,.9,1.35);m.cone(0,.19,.38,.06,.19,.012,8,'fur',c,-Math.PI/2);m.lathe(0,.19,.38,[],1);
      const sn=new Mesh();sn.lathe(0,0,0,[[0,.055],[.12,.012]],8,'fur',c);for(let i=0;i<sn.pos.length;i+=3){const y=sn.pos[i+1],z=sn.pos[i+2];sn.pos[i+1]=.18+z*.2;sn.pos[i+2]=.36+y;const ny=sn.nrm[i+1],nz=sn.nrm[i+2];sn.nrm[i+1]=nz;sn.nrm[i+2]=ny;}m.add(sn);
      m.sphere(0,.18,.49,.016,6,3,'skin',pk);for(const sx of [-1,1]){eye(m,sx*.05,.23,.39,.016);m.sphere(sx*.06,.29,.3,.035,8,4,'skin',pk,1,.35,1);
        for(let k=0;k<3;k++)m.tube([sx*.02,.18,.47],[sx*.16,.19+k*.015-.015,.42],.002,.001,3,'white',[.9,.9,.9]);
        for(const z of [.15,-.15])m.tube([sx*.07,.1,z],[sx*.08,0,z+.03],.018,.014,5,'skin',pk);}},[0,0,0],'body'),
      part(m=>{m.tube([0,0,0],[0,-.02,-.22],.022,.016,6,'skin',pk.map(v=>v*.85));m.tube([0,-.02,-.22],[0,.02,-.48],.016,.006,6,'skin',pk.map(v=>v*.85));},[0,.14,-.26],'tail'));}
  else if(t=='squirrel'){const c=rgb('#8a8680'),r=rgb('#9a7a5a'),w=rgb('#e8e2d8');
    P.push(part(m=>{m.sphere(0,.2,0,.14,12,7,'fur',c,1.05,.9,1.35);m.sphere(0,.17,.05,.11,10,5,'fur',w,.9,.7,1.1,0,.5);m.sphere(0,.37,.16,.085,12,6,'fur',c,1.05,.9,1.15);m.sphere(0,.34,.24,.04,8,4,'fur',r);
      for(const sx of [-1,1]){eye(m,sx*.045,.4,.21,.016);m.cone(sx*.04,.43,.13,.022,.5,.004,6,'fur',c);m.tube([sx*.06,.12,.12],[sx*.06,0,.15],.022,.018,5,'fur',c);m.tube([sx*.08,.12,-.1],[sx*.09,0,-.06],.035,.02,5,'fur',c);}},[0,0,0],'body'),
      part(m=>{const pts=[[0,0,0],[0,.12,-.1],[0,.3,-.14],[0,.46,-.08],[0,.52,.02]];for(let i=0;i<4;i++)m.tube(pts[i],pts[i+1],.07+i*.01,.08+i*.01,8,'fur',i>2?r.map(v=>v*.9):c);m.sphere(0,.52,.02,.085,8,4,'fur',c);},[0,.18,-.18],'tail'));}
  else if(t=='goose'){const b=rgb('#5e5244'),bk=rgb('#151413'),w=rgb('#ece8e0'),br=rgb('#b8aa98');
    P.push(part(m=>{m.sphere(0,.55,-.05,.27,14,8,'feather',b,.78,.9,1.55);m.sphere(0,.48,.02,.24,12,6,'feather',br,.7,.85,1.4,0,.5);m.sphere(0,.5,-.42,.12,10,5,'feather',w,.9,.8,1.2);m.cone(0,.55,-.5,.1,.62,.02,8,'feather',bk);
      for(const sx of [-1,1]){m.sphere(sx*.2,.6,-.12,.15,12,6,'feather',b.map(v=>v*.75),.5,.55,1.5);m.tube([sx*.07,0,0],[sx*.07,.36,-.02],.02,.028,6,'skin',[.12,.12,.12]);m.box(sx*.07-.06,0,-.02,sx*.07+.06,.02,.12,'skin',[.12,.12,.12]);}},[0,0,0],'body'),
      part(m=>{m.tube([0,0,0],[0,.32,.06],.075,.055,10,'feather',bk);m.tube([0,.32,.06],[0,.52,.12],.055,.05,10,'feather',bk);m.sphere(0,.56,.14,.07,10,6,'feather',bk,1,.9,1.3);
        m.sphere(0,.5,.12,.064,10,5,'feather',w,.9,.82,1.15,.25,.75);m.cone(0,.55,.22,.032,.555,.008,8,'white',bk,0);const bill=new Mesh();bill.lathe(0,0,0,[[0,.03],[.1,.012]],8,'white',[.1,.1,.1]);
        for(let i=0;i<bill.pos.length;i+=3){const y=bill.pos[i+1],z=bill.pos[i+2];bill.pos[i+1]=.54-z*.1;bill.pos[i+2]=.2+y;const ny=bill.nrm[i+1],nz=bill.nrm[i+2];bill.nrm[i+1]=nz;bill.nrm[i+2]=ny;}m.add(bill);for(const sx of [-1,1])eye(m,sx*.045,.58,.18,.012);},[0,.6,.3],'neck'));}
  else if(t=='crab'){const top=rgb('#5a6e5c'),bl=rgb('#3a6aa8'),wh=rgb('#e8e4d8'),rd=rgb('#c84a32');
    P.push(part(m=>{m.sphere(0,.2,0,.2,16,6,'carapace',top,.35,1.75,.8,.45,1);m.sphere(0,.19,0,.2,16,4,'carapace',wh,.25,1.72,.78,0,.5);
      for(const sx of [-1,1]){m.cone(sx*.33,.21,0,.05,.21,.0,6,'carapace',top);const sp=new Mesh();sp.lathe(0,0,0,[[0,.04],[.14,0]],6,'carapace',top);for(let i=0;i<sp.pos.length;i+=3){const y=sp.pos[i+1],x=sp.pos[i];sp.pos[i]=sx*(.32+y);sp.pos[i+1]=.22+x*.2;}m.add(sp);
        eye(m,sx*.06,.3,.15,.018);m.tube([sx*.06,.24,.14],[sx*.06,.29,.15],.008,.008,4,'white',top);
        for(let i=0;i<3;i++){const z=-.1+i*.08;m.tube([sx*.22,.17,z],[sx*.42,.24,z+.02],.022,.02,6,'carapace',bl);m.tube([sx*.42,.24,z+.02],[sx*.55,0,z+.06],.02,.008,6,'carapace',bl);}
        m.tube([sx*.2,.18,-.16],[sx*.4,.2,-.26],.02,.02,6,'carapace',bl);m.sphere(sx*.45,.2,-.29,.06,8,4,'carapace',bl,.25,1,1.2);}},[0,0,0],'body'),
      ...[-1,1].map(sx=>part(m=>{m.tube([0,0,0],[sx*.08,.02,.2],.035,.04,8,'carapace',bl);m.sphere(sx*.08,.03,.3,.075,10,5,'carapace',bl,.7,.9,1.5);m.cone(sx*.08,.03,.38,.04,.06,0,6,'carapace',rd,-Math.PI/2);
        m.tube([sx*.06,.03,.36],[sx*.04,.03,.48],.02,.006,6,'carapace',rd);m.tube([sx*.1,.03,.36],[sx*.12,.03,.47],.018,.005,6,'carapace',rd);},[sx*.22,.2,.12],sx<0?'clawL':'clawR')));}
  else if(t=='bat'){const c=rgb('#5a4234'),w=rgb('#3a2a24');
    P.push(part(m=>{m.sphere(0,0,0,.08,10,6,'fur',c,1.3);m.sphere(0,.11,.02,.05,10,5,'fur',c);for(const sx of [-1,1]){m.cone(sx*.03,.14,.01,.025,.2,0,6,'skin',w);eye(m,sx*.02,.12,.065,.008);}},[0,0,0],'body'),
      ...[-1,1].map(sx=>part(m=>{const tip=[sx*.5,.02,-.05],el=[sx*.2,.06,.04];m.tube([0,0,0],el,.012,.01,4,'skin',w);m.tube(el,tip,.008,.005,4,'skin',w);
        m.tri([0,0,.02],el,tip,[0,0],[1,0],[1,1],w,w,w);m.tri([0,0,.02],tip,[sx*.32,-.04,-.16],[0,0],[1,1],[0,1],w,w,w);m.tri([0,0,.02],[sx*.32,-.04,-.16],[0,-.04,-.12],[0,0],[1,1],[0,1],w,w,w);},[sx*.06,0,0],sx<0?'wingL':'wingR')));}
  else if(t=='ghost'){const c=rgb('#d8e4f0');P.push(part(m=>{m.lathe(0,0,0,[[.1,.05],[.4,.22],[.8,.28],[1.2,.26],[1.45,.2],[1.6,.13],[1.72,0]],14,'cloth',c,1,.8);
      m.sphere(0,1.5,.05,.13,12,6,'skin',c.map(v=>v*1.02),1.2,.9,1);for(const sx of [-1,1]){m.sphere(sx*.045,1.53,.15,.022,6,3,'white',[.05,.06,.1]);m.tube([sx*.2,1.3,0],[sx*.38,.95,.18],.05,.03,8,'cloth',c);}},[0,0,0],'body'));}
  else if(t=='turtle'){const sh=rgb('#3e3a2c'),sk=rgb('#5a5640'),pl=rgb('#b8a878');
    P.push(part(m=>{m.sphere(0,.4,0,1.4,18,9,'carapace',sh,.42,1,1.25,.5,1);m.sphere(0,.38,0,1.35,16,4,'carapace',pl,.12,1,1.2,.35,.5);
      for(const xo of [-.55,0,.55])for(let i=0;i<5;i++){const z=-1.1+i*.55;m.cone(xo,.38+Math.sqrt(Math.max(0,1-(xo*xo)/1.96-(z*z)/3))*.55,z,.2,.82+Math.sqrt(Math.max(0,1-(xo*xo)/1.96-(z*z)/3))*.55-(xo?0.08:0),.02,6,'carapace',sh.map(v=>v*.85));}
      for(let i=0;i<7;i++){const a=Math.PI+(i-3)*.18;m.cone(Math.sin(a)*1.3,.4,Math.cos(a)*1.65,.12,.42,.0,4,'carapace',sh,0);}
      for(const [x,z] of [[-1.1,-.85],[1.1,-.85],[-1.1,.85],[1.1,.85]]){m.tube([x*.75,.45,z*.75],[x,0,z],.3,.24,10,'carapace',sk,true);for(let k=-1;k<=1;k++)m.cone(x+k*.1,.04,z+.24*Math.sign(z),.04,.04,0,5,'white',[.15,.13,.1]);}
      m.tube([0,.35,-1.5],[0,.2,-2.3],.24,.04,8,'carapace',sk);for(let k=0;k<5;k++)m.cone(0,.4-k*.04,-1.6-k*.15,.05,.55-k*.06,0,4,'carapace',sk.map(v=>v*.8));},[0,0,0],'body'),
      part(m=>{m.tube([0,0,-.15],[0,.08,.4],.32,.3,12,'carapace',sk);m.sphere(0,.12,.58,.34,14,8,'carapace',sk,.8,1.05,1.25);m.cone(0,.0,.92,.16,-.02,.0,8,'white',[.25,.22,.16],-Math.PI/2);
        for(const sx of [-1,1])eye(m,sx*.2,.28,.82,.045);},[0,.55,1.4],'head'));}
  else if(t=='raven'){const c=rgb('#121218');P.push(part(m=>{m.sphere(0,0,0,.32,14,8,'feather',c,.9,.85,1.5);m.sphere(0,.22,.38,.18,12,6,'feather',c);m.cone(0,.2,.52,.07,.2,.0,8,'white',[.08,.08,.1],-Math.PI/2);
      const bk=new Mesh();bk.lathe(0,0,0,[[0,.06],[.22,.008]],8,'white',[.08,.08,.1]);for(let i=0;i<bk.pos.length;i+=3){const y=bk.pos[i+1],z=bk.pos[i+2];bk.pos[i+1]=.2-y*.15+z;bk.pos[i+2]=.5+y;}m.add(bk);
      for(const sx of [-1,1])eye(m,sx*.09,.28,.5,.025);m.cone(0,-.02,-.45,.22,-.05,.02,6,'feather',c,0);},[0,0,0],'body'),
      ...[-1,1].map(sx=>part(m=>{m.tri([0,0,.25],[sx*1.0,.05,.0],[sx*.9,-.02,-.4],[0,0],[1,0],[1,1],c,c,c);m.tri([0,0,.25],[sx*.9,-.02,-.4],[0,0,-.35],[0,0],[1,1],[0,1],c,c,c);},[sx*.25,.1,0],sx<0?'wingL':'wingR')));}
  const SC={crab:1.9,rat:1.25,squirrel:1.2,bat:1.6};if(SC[t])for(const pt of P){const k=SC[t],m=pt.mesh;for(let i=0;i<m.pos.length;i++)m.pos[i]*=k;pt.pivot=pt.pivot.map(v=>v*k);}
  return P.length?P:null;}
function realPigeon(){const g=rgb('#8e8e98'),d=rgb('#5a5a64'),ir=rgb('#4a7a6a');return[part(m=>{m.sphere(0,.16,0,.13,12,6,'feather',g,.85,.9,1.4);m.sphere(0,.28,.13,.07,10,5,'feather',ir);m.sphere(0,.34,.18,.05,10,5,'feather',g);
    m.cone(0,.34,.22,.012,.33,.004,6,'skin',[.25,.22,.2],-Math.PI/2);for(const sx of [-1,1]){m.sphere(sx*.03,.355,.21,.008,6,3,'white',[.85,.4,.15]);m.tube([sx*.03,.06,0],[sx*.03,0,.02],.008,.008,4,'skin',rgb('#c86870'));}
    m.cone(0,.17,-.18,.07,.15,.01,6,'feather',d,0);},[0,0,0],'body'),
  part(m=>m.tri([0,0,-.1],[0,0,.1],[-.26,.02,-.1],[0,0],[1,0],[1,1],d,d,d),[-.08,.2,0],'wingL'),part(m=>m.tri([0,0,.1],[0,0,-.1],[.26,.02,-.1],[0,0],[1,0],[1,1],d,d,d),[.08,.2,0],'wingR')];}
