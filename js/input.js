"use strict";
/* River City Quest 3D: keyboard, gamepad and touch. Each frame fills `inp`:
   x/z is the stick, a/b/item/menu/start are fresh presses, up/down/left/right are fresh d-pad presses for menus. */
const keys={},prevPad={},touch={sx:0,sz:0,stick:null,cam:null,camDX:0,btn:{}};let prevBtn={};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key))e.preventDefault();if(!keys[e.code])keys[e.code]=2;audioStart();});
addEventListener('keyup',e=>{keys[e.code]=0;});
function pressed(...codes){return codes.some(c=>keys[c]==2);}
function held(...codes){return codes.some(c=>keys[c]);}
function readInput(){
  let x=(held('KeyD','ArrowRight')?1:0)-(held('KeyA','ArrowLeft')?1:0),z=(held('KeyS','ArrowDown')?1:0)-(held('KeyW','ArrowUp')?1:0);
  let a=pressed('KeyJ','Space','KeyZ'),b=pressed('KeyK','ShiftLeft','ShiftRight','KeyX'),item=pressed('KeyL','Tab','KeyC'),men=pressed('Enter','Escape','KeyP');
  let up=pressed('KeyW','ArrowUp'),down=pressed('KeyS','ArrowDown'),left=pressed('KeyA','ArrowLeft'),right=pressed('KeyD','ArrowRight');
  let camX=(held('KeyE')?1:0)-(held('KeyQ')?1:0);
  // gamepad (standard mapping)
  const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g):null;
  if(gp){const ax=gp.axes,bt=i=>gp.buttons[i]&&gp.buttons[i].pressed,fresh=i=>bt(i)&&!prevPad[i];
    if(Math.hypot(ax[0],ax[1])>.2){x=ax[0];z=ax[1];}if(Math.abs(ax[2]||0)>.2)camX=ax[2];
    a=a||fresh(0);b=b||fresh(1)||fresh(2);item=item||fresh(3)||fresh(5);men=men||fresh(9)||fresh(8);up=up||fresh(12)||(ax[1]<-.6&&!prevPad.ay);down=down||fresh(13)||(ax[1]>.6&&!prevPad.ay);left=left||fresh(14)||fresh(4);right=right||fresh(15)||fresh(5);
    if(bt(6))camX=-1;if(bt(7))camX=1;for(let i=0;i<17;i++)prevPad[i]=bt(i);prevPad.ay=Math.abs(ax[1])>.6;}
  // touch
  if(touch.stick){x=touch.sx;z=touch.sz;const l=Math.hypot(x,z);if(l>.3&&!touch.dirHeld){const ad=Math.abs(x)>Math.abs(z);if(ad)(x>0?right=1:left=1);else(z>0?down=1:up=1);touch.dirHeld=1;}if(l<.3)touch.dirHeld=0;}
  if(touch.cam){camX=-touch.camDX*.12;touch.camDX*=.5;}
  const B=touch.btn,fb=k=>B[k]&&!prevBtn[k];a=a||fb('a');b=b||fb('b');item=item||fb('item');men=men||fb('menu');prevBtn={...B};
  const gpd=gp?gp.buttons:null;inp.ah=held('KeyJ','Space','KeyZ')||!!(gpd&&gpd[0]&&gpd[0].pressed)||!!B.a;inp.bh=held('KeyK','ShiftLeft','ShiftRight','KeyX')||!!(gpd&&(gpd[1]&&gpd[1].pressed||gpd[2]&&gpd[2].pressed))||!!B.b;
  Object.assign(inp,{x:Math.max(-1,Math.min(1,x)),z:Math.max(-1,Math.min(1,z)),a:a?1:0,b:b?1:0,item:item?1:0,menu:men?1:0,start:0,up:up?1:0,down:down?1:0,left:left?1:0,right:right?1:0,camX});
  for(const k in keys)if(keys[k]==2)keys[k]=1;}
function initTouch(){const stickEl=document.getElementById('stick'),knob=document.getElementById('knob'),camEl=document.getElementById('camzone');
  const ids={};const st0=e=>{e.preventDefault();audioStart();};
  stickEl.addEventListener('pointerdown',e=>{st0(e);stickEl.setPointerCapture(e.pointerId);const r=stickEl.getBoundingClientRect();touch.stick={id:e.pointerId,cx:r.left+r.width/2,cy:r.top+r.height/2,r:r.width/2};move(e);});
  const move=e=>{if(!touch.stick||e.pointerId!==touch.stick.id)return;let dx=(e.clientX-touch.stick.cx)/touch.stick.r,dz=(e.clientY-touch.stick.cy)/touch.stick.r;const l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l;}touch.sx=dx;touch.sz=dz;knob.style.transform='translate('+dx*34+'px,'+dz*34+'px)';};
  stickEl.addEventListener('pointermove',move);const end=e=>{if(touch.stick&&e.pointerId===touch.stick.id){touch.stick=null;touch.sx=touch.sz=0;knob.style.transform='';}};stickEl.addEventListener('pointerup',end);stickEl.addEventListener('pointercancel',end);
  camEl.addEventListener('pointerdown',e=>{st0(e);camEl.setPointerCapture(e.pointerId);touch.cam={id:e.pointerId,x:e.clientX};});
  camEl.addEventListener('pointermove',e=>{if(touch.cam&&e.pointerId===touch.cam.id){touch.camDX+=e.clientX-touch.cam.x;touch.cam.x=e.clientX;}});
  const cend=e=>{if(touch.cam&&e.pointerId===touch.cam.id)touch.cam=null;};camEl.addEventListener('pointerup',cend);camEl.addEventListener('pointercancel',cend);
  for(const el of document.querySelectorAll('[data-btn]')){const k=el.dataset.btn;el.addEventListener('pointerdown',e=>{st0(e);touch.btn[k]=1;el.classList.add('on');try{navigator.vibrate&&navigator.vibrate(8);}catch(_){}});
    const up=()=>{touch.btn[k]=0;el.classList.remove('on');};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up);}}
