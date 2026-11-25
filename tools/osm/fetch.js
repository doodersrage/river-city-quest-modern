// Downloads the real streets, buildings, parks and water for each neighborhood of the game from OpenStreetMap
// (through the public Overpass API) and writes one raw JSON file per neighborhood. Run by .github/workflows/osm.yml.
// The data is (c) OpenStreetMap contributors and licensed under the ODbL.
const fs=require('fs'),path=require('path');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'districts.json'),'utf8')),out=process.argv[2]||'osm-raw';
const ENDPOINTS=['https://overpass-api.de/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter','https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function query(b){const q=k=>`way[${k}](${b});relation[${k}](${b});`;
  return`[out:json][timeout:120];(${['"building"','"highway"','"railway"','"waterway"','"natural"','"leisure"','"landuse"','"amenity"','"barrier"','"man_made"','"tourism"','"historic"','"bridge"','"area:highway"','"power"'].map(q).join('')}
node["natural"="tree"](${b});node["highway"](${b});node["amenity"](${b});node["historic"](${b});node["tourism"](${b});node["shop"](${b});node["man_made"](${b});node["barrier"](${b});node["power"](${b});node["railway"](${b});node["emergency"](${b});node["leisure"](${b}););out body geom(${b});`;}
async function get(q){let last;for(let attempt=0;attempt<6;attempt++){const url=ENDPOINTS[attempt%ENDPOINTS.length];
    try{const r=await fetch(url,{signal:AbortSignal.timeout(80000),method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'river-city-quest-modern map build (github.com/doodersrage/river-city-quest-modern)'},body:'data='+encodeURIComponent(q)});
      if(r.ok){const j=await r.json();if(j&&Array.isArray(j.elements))return j;last='bad body';}else last=url+' HTTP '+r.status;}catch(e){last=url+' '+e.message;}
    console.log('  retry after: '+last);await sleep(6000+attempt*4000);}
  throw new Error('gave up: '+last);}
(async()=>{fs.mkdirSync(out,{recursive:true});const dLat=cfg.halfNS/111320,index={};let failed=0;
  for(const [id,d] of Object.entries(cfg.districts)){const dLon=cfg.halfEW/(111320*Math.cos(d.lat*Math.PI/180)),b=[d.lat-dLat,d.lon-dLon,d.lat+dLat,d.lon+dLon].map(v=>v.toFixed(6)).join(','),file=id.replace(/[:,]/g,'_')+'.v2.json';
    if(fs.existsSync(path.join(out,file+'.gz'))||fs.existsSync(path.join(out,file))){index[id]={file,name:d.name,kept:true};console.log(id,d.name,'already have it');continue;}
    try{const j=await get(query(b));fs.writeFileSync(path.join(out,file),JSON.stringify({id,name:d.name,lat:d.lat,lon:d.lon,halfEW:cfg.halfEW,halfNS:cfg.halfNS,bbox:b,osm:j.osm3s||null,elements:j.elements}));
      index[id]={file,name:d.name,elements:j.elements.length};console.log(id,d.name,j.elements.length,'elements');}
    catch(e){failed++;console.log(id,d.name,'FAILED',e.message);}
    await sleep(3000);}
  fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({fetched:new Date().toISOString(),license:'Map data (c) OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright',index},null,1));
  console.log(failed+' failed');})();
