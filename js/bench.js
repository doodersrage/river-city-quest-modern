"use strict";
/* River City Quest Modern: the benchmark. Open the game with ?bench on the end of the address and it tours six districts
   by itself, measuring on whatever machine it is running on, then shows a report you can copy and send.
   ?bench=0, 1 or 2 picks the quality level (low, medium, high); without a number it uses high.
   Nothing is saved: your own game and your quality setting are left alone. */
const BENCH=typeof location!='undefined'&&/[?&]bench(=|&|$)/.test(location.search||'');
function benchRun(){const errs=[],m=/[?&]bench=(\d)/.exec(location.search),lvl=m?Math.min(2,+m[1]):2,route=['ow:2,1','ow:3,0','ow:1,1','ow:0,1','ow:4,1','ow:2,2'],rows=[];
  addEventListener('error',e=>errs.push(e.message||String(e)));saveGame=function(){};
  const say2=t=>{let d=document.getElementById('benchmsg');if(!d){d=document.createElement('div');d.id='benchmsg';d.style.cssText='position:fixed;left:0;right:0;top:0;padding:8px 12px;background:rgba(10,14,30,.85);color:#fff;font:14px sans-serif;z-index:50;text-align:center';document.body.appendChild(d);}d.textContent=t;};
  let drawMs=0;const r0=render;render=function(f){const t=performance.now();r0(f);drawMs+=performance.now()-t;};
  startGame(null);dlg=null;let keep=null;try{keep=localStorage.getItem('rcqm-quality');}catch(e){}setQuality(false,lvl);try{if(keep==null)localStorage.removeItem('rcqm-quality');else localStorage.setItem('rcqm-quality',keep);}catch(e){}
  const frames=n=>new Promise(res=>{const step=()=>{if(--n<=0)res();else requestAnimationFrame(step);};requestAnimationFrame(step);});
  const one=async id=>{say2('Benchmark: '+RCQ.maps[id].name+' ('+(rows.length+1)+' of '+route.length+')');const t0=performance.now();loadScene(id,200,150,0);dlg=null;st.clock=CYC*.32;await frames(3);const build=performance.now()-t0;
    const dts=[];drawMs=0;let lastT=performance.now(),until=lastT+6000,drawn=0,tot=0,n=0;
    await new Promise(res=>{const step=t=>{const now=performance.now();dts.push(now-lastT);lastT=now;dlg=null;enemies.length=0;cam.yaw+=.012;cam.manual=40;st.clock=CYC*.32;if(typeof chunkStat!='undefined'&&chunkStat){drawn+=chunkStat[0];tot=chunkStat[1];n++;}if(now<until)requestAnimationFrame(step);else res();};requestAnimationFrame(step);});
    dts.sort((a,b)=>a-b);const sum=dts.reduce((a,b)=>a+b,0),avg=1000*dts.length/sum,low=1000/dts[Math.min(dts.length-1,Math.floor(dts.length*.99))];let tris=0;try{for(const c of sceneMeshes().main.chunks)tris+=c.vao.n/3;}catch(e){}
    rows.push({name:RCQ.maps[id].name,build:Math.round(build),fps:avg,low,draw:drawMs/dts.length,tris:Math.round(tris),seen:n?Math.round(100*drawn/n/Math.max(1,tot)):0});};
  (async()=>{for(const id of route){try{await one(id);}catch(e){errs.push(id+': '+(e&&e.message||e));}}
    let gpu='unknown';try{const x=gl.getExtension('WEBGL_debug_renderer_info');gpu=x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch(e){}
    const c=document.getElementById('gl'),pad=(s,n)=>(s+'').padEnd(n),L=['River City Quest benchmark','Graphics: '+gpu,'Screen: '+FW+' x '+FH+' drawn on a '+c.width+' x '+c.height+' canvas ('+(window.devicePixelRatio||1)+'x pixels), quality '+QL[lvl].name+(typeof WLOW!='undefined'&&WLOW?', phone build':''),'Browser: '+navigator.userAgent,'',
      pad('District',30)+pad('fps',8)+pad('worst',8)+pad('draw ms',9)+pad('build ms',10)+pad('triangles',11)+'in view'];
    for(const r of rows)L.push(pad(r.name,30)+pad(r.fps.toFixed(0),8)+pad(r.low.toFixed(0),8)+pad(r.draw.toFixed(1),9)+pad(r.build,10)+pad(r.tris,11)+r.seen+'%');
    L.push('','fps is capped by the screen, usually at 60. "worst" is the slowest 1 in 100 frames. "draw ms" is the time the page spends sending each frame.',errs.length?'Errors: '+errs.slice(0,6).join(' | '):'No errors.');
    const txt=L.join('\n'),box=document.createElement('div');box.style.cssText='position:fixed;inset:0;background:rgba(8,10,24,.94);color:#e8ecff;z-index:60;overflow:auto;padding:16px;font:13px monospace';
    const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;margin:0 0 14px';pre.textContent=txt;pre.id='benchreport';const b=document.createElement('button');b.textContent='Copy report';b.style.cssText='font:16px sans-serif;padding:10px 18px;margin-right:10px';
    b.onclick=()=>{const done=()=>{b.textContent='Copied';};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,()=>{});else{const r=document.createRange();r.selectNode(pre);getSelection().removeAllRanges();getSelection().addRange(r);document.execCommand('copy');done();}};
    box.appendChild(pre);box.appendChild(b);document.body.appendChild(box);const d=document.getElementById('benchmsg');if(d)d.remove();window.__bench=txt;})();}
if(BENCH)addEventListener('load',()=>setTimeout(benchRun,800));
