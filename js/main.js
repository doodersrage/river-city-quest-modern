"use strict";
/* River City Quest 3D: start-up, the frame loop and the test hook. */
let glOK=false,last=0,acc=0;
function titleScene(){if(st&&lv)return;st=newState();p=newPlayer();cam={yaw:0,pitch:.4,dist:8,x:0,y:0,z:0,manual:0};lv=buildLevel('ow:2,1');npcs=[];enemies=[];picks=[];chests=[];st.clock=CYC*.62;}
function titleCam(){const t=frame*.0025,cx=22*TS,cz=8*TS;cam.x=cx+Math.sin(t)*22;cam.z=cz+Math.cos(t)*22;cam.y=7+Math.sin(t*.7)*1.5;cam.tx=cx;cam.ty=3.5;cam.tz=cz;cam.yaw=Math.atan2(cam.x-cx,cam.z-cz);}
function onSceneLoaded(){}
function fit(){const box=document.getElementById('screen'),c=document.getElementById('gl'),r=box.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);}
function frameLoop(t){requestAnimationFrame(frameLoop);acc+=Math.min(100,t-last);last=t;
  while(acc>=16.67){readInput();if(mode=='title'){titleScene();titleCam();}update();acc-=16.67;}
  if(glOK){const fade=trans?(trans.t<18?trans.t/18:1-(trans.t-18)/18):0;render(fade);}drawHud();musicTick();}
function boot(){initHud(document.getElementById('hud'));initTouch();fit();addEventListener('resize',fit);
  glOK=initGL(document.getElementById('gl'));if(!glOK){document.getElementById('nogl').style.display='flex';}
  titleScene();requestAnimationFrame(t=>{last=t;frameLoop(t);});
  if('serviceWorker' in navigator&&location.protocol=='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});}
window.__g={get st(){return st},get p(){return p},get lv(){return lv},get cam(){return cam},get mode(){return mode},set mode(v){mode=v},get dlg(){return dlg},set dlg(v){dlg=v},get menu(){return menu},set menu(v){menu=v},
  get npcs(){return npcs},get birds(){return birds},get enemies(){return enemies},get picks(){return picks},get chests(){return chests},get bombs(){return bombs},get trans(){return trans},get chal(){return chal},get boss(){return boss},get toastMsg(){return toastMsg},
  get deathT(){return deathT},inp,update,startGame,loadScene,newState,saveGame,loadSave,give,say,RCQ,buildLevel,buildMesh,tileAt,walkable,EDEF,hitEnemy,explode,dark,hour,goalScene,goalText,TS,CYC,
  get frame(){return frame},Mesh,bakeAO,QUAL,skelPose,skelFK,CLIPS,BODYDATA,LMK,traffic(){return{cars:traffic,lanes:TLANES,walkers}},sigState,frameSet(v){frame=v},textUV,textList,roadKind,bodyMesh,realHuman,clipSample,clipBase,Qt,enemyModel,pigeonModel,propModel,qualityTick,QL,lifeModel,humanoid,get shots(){return shots},get hook(){return hook},get shop(){return shop},set shop(v){shop=v},useItem,isSolved,camClear,enterDoor,get mini(){return mini},get fish(){return fish},set fish(v){fish=v},get dog(){return dog},startMini,TALK3,SECRETS,weatherLook,events,firstFriday,PHOTOS,FISHES,EXTRA_NPCS,MINI,CYC,get fireflies(){return fireflies},set fakeDate(v){fakeDate=v},interact,refreshDyn,passable,DUNGEONS,ITEMORDER,SHOPS,busList,render,set titleSel(v){titleSel=v}};
if(typeof document!='undefined'&&document.getElementById&&document.getElementById('gl'))addEventListener('load',boot);
