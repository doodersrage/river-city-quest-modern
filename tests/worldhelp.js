// Helpers for tests in the polygon world: places are found by what they are, not by fixed squares.
module.exports=G=>({
  // a spot a few steps in from an edge with a clear run out to it: side is 'n','s','e' or 'w'
  edgeSpot(side){const w=G.lv.world,W=w.w,H=w.h;for(let k=0;k<400;k++){const t=((k*37)%100+.5)/100,x=side=='w'?5:side=='e'?W-5:6+t*(W-12),z=side=='n'?5:side=='s'?H-5:6+t*(H-12);let ok=true;
      for(let s=0;s<=5.5;s+=.4){const px=side=='w'?x-s:side=='e'?x+s:x,pz=side=='n'?z-s:side=='s'?z+s:z;if(px>.3&&pz>.3&&px<W-.3&&pz<H-.3&&G.blockedCircle(px,pz,.6)){ok=false;break;}}if(ok)return[x,z];}return null;},
  door(to){return(G.lv.doors||[]).find(d=>d.to==to);},
  // stand just outside a door, facing it
  atDoor(to){const d=this.door(to);if(!d)return null;G.p.x=d.x+d.nx*1.6;G.p.z=d.z+d.nz*1.6;G.p.yaw=Math.atan2(-d.nx,-d.nz);return d;},
  // open ground at least r clear, nearest to a point
  open(x,z,r){for(let R=0;R<80;R+=1)for(let a=0;a<16;a++){const px=x+Math.sin(a/16*6.283)*R,pz=z+Math.cos(a/16*6.283)*R;if(px>2&&pz>2&&px<G.lv.world.w-2&&pz<G.lv.world.h-2&&!G.blockedCircle(px,pz,r||.8))return[px,pz];}return null;}});
