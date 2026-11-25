// Offline cache. Bump VERSION when files change.
const VERSION='rcqm-v27';
const FILES=['./','index.html','js/data.js','js/streetplan.js','js/bigmap.js','js/worlddata.js','js/worldelev.js','js/world.js','js/text.js','js/mesh.js','js/tex.js','js/tex2.js','js/flora.js','js/bodydata.js','js/body.js','js/anim.js','js/skel.js','js/level.js','js/landmarks.js','js/worldmesh.js','js/roomplan.js','js/models.js','js/fauna.js','js/creature.js','js/audio.js','js/game.js','js/talk.js','js/render.js','js/gfx.js','js/hud.js','js/life.js','js/traffic.js','js/mini.js','js/input.js','js/main.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('rcqm-')&&k!==VERSION).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));});
