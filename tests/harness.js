// Loads the game's scripts into a Node VM, in index.html order, with no WebGL or audio.
// Exposes the game's test hook (window.__g) so tests can play it frame by frame.
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const store={};
const sb={atob,console,Math,JSON,Object,Array,String,Number,Set,Map,Error,Float32Array,performance,
  document:{getElementById:()=>null,createElement:()=>({getContext:()=>null}),querySelectorAll:()=>[]},
  addEventListener(){},requestAnimationFrame(){},navigator:{userAgent:process.env.RCQ_UA||''},location:{protocol:'file:'},
  localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);}}};
sb.window=sb;vm.createContext(sb);
for(const f of files)vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
module.exports=sb.__g;
