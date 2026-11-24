"use strict";
/* River City Quest Modern: the rock pigeons. The animals that chase you live in creature.js. */
function realPigeon(){const g=rgb('#8e8e98'),d=rgb('#5a5a64'),ir=rgb('#4a7a6a');return[part(m=>{m.sphere(0,.16,0,.13,12,6,'feather',g,.85,.9,1.4);m.sphere(0,.28,.13,.07,10,5,'feather',ir);m.sphere(0,.34,.18,.05,10,5,'feather',g);
    m.cone(0,.34,.22,.012,.33,.004,6,'skin',[.25,.22,.2],-Math.PI/2);for(const sx of [-1,1]){m.sphere(sx*.03,.355,.21,.008,6,3,'white',[.85,.4,.15]);m.tube([sx*.03,.06,0],[sx*.03,0,.02],.008,.008,4,'skin',rgb('#c86870'));}
    m.cone(0,.17,-.18,.07,.15,.01,6,'feather',d,0);},[0,0,0],'body'),
  part(m=>m.tri([0,0,-.1],[0,0,.1],[-.26,.02,-.1],[0,0],[1,0],[1,1],d,d,d),[-.08,.2,0],'wingL'),part(m=>m.tri([0,0,.1],[0,0,-.1],[.26,.02,-.1],[0,0],[1,0],[1,1],d,d,d),[.08,.2,0],'wingR')];}
