import asyncio,json,sys
from playwright.async_api import async_playwright
# name: (map, [[camx,camz,camy, tx,tz,ty] in metres])
SH={'bus':('ow:1,0',[['U',0],['U',1]]),'rev1':('ow:3,1',[['H',1],['H',-1]]),'rev2':('ow:-1,2',[['H',1]]),'rev3':('ow:2,1',[['H',1],['L','capitol']]),'rev4':('ow:1,3',[['H',-1]]),'pier':('ow:4,1',[['B'],['K']]),'steep':('ow:3,0',[['H',1],['H',-1]]),'steep2':('ow:2,1',[['H',1]]),'tpot':('ow:4,1',[['B']]),'sign':('ow:2,1',[['S',0],['S',3]]),'sign2':('ow:3,0',[['S',1]]),'lee':('ow:2,2',[[230,180,7,300,90,10]]),'fan2':('ow:1,1',[['R','r',10,3.2],['R','s',12,4]]),'chill2':('ow:3,0',[['R','r',10,3.2],['R','r',-14,5]]),'jw2':('ow:2,0',[['R','r',10,3.2]]),'lm1':('ow:3,1',[['L','station']]),'lm2':('ow:3,0',[['L','church']]),'lm3':('ow:0,1',[['L','byrd']]),'lm4':('ow:0,2',[['L','carillon']]),'lm5':('ow:2,1',[['L','capitol'],['L','cityhall']]),'cap':('ow:2,1',[['P',14,5],['P',30,12]]),'play':('ow:1,1',[['G']]),'fan':('ow:1,1',[[200,150,120,200,149,0],['P',14,5]]),'cary':('ow:0,1',[['P',14,5],[200,150,120,200,149,0]]),'chill':('ow:3,0',[['P',14,5]]),'belle':('ow:2,2',[['G'],[60,60,30,200,150,0]]),
 'shockoe':('ow:3,1',[['P',16,6],[200,150,120,200,149,0]]),'holly':('ow:1,2',[['P',14,5],['G']]),'broad':('ow:1,0',[['P',14,5]]),'jward':('ow:2,0',[['P',14,5]]),'canal':('ow:4,1',[[200,150,260,200,149,0],['P',14,5],[200,330,40,200,150,0]]),'rock':('ow:3,2',[[200,150,260,200,149,0],['P',14,5]]),'texas':('ow:-1,2',[[200,150,260,200,149,0]])}
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':800});pg.set_default_timeout(400000);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..','index.html')));await pg.wait_for_timeout(3500);s=pg.locator('#screen')
        await pg.evaluate("(()=>{startGame(null);dlg=null;QUAL.auto=false;window.__ck=%s;})()"%__import__('os').environ.get('CK','.32'))
        for name in sys.argv[1:]:
            mp,shots=SH[name]
            await pg.evaluate("(()=>{const t=performance.now();loadScene('%s',200,150,0);window.__bt=performance.now()-t;})()"%mp);await pg.wait_for_timeout(1500)
            print(name,'load ms',await pg.evaluate('window.__bt'))
            await pg.evaluate("(()=>{dlg=null;st.clock=CYC*(window.__ck||.32);window.__px=p.x;window.__pz=p.z;window.__upd=window.__upd||window.update;window.update=function(){frame++;bannerT=0;toastT=0;};window.__camLock=1;enemies.length=0;for(let i=0;i<300;i++){frame++;trafficUpdate();}})()")
            for i,sh in enumerate(shots):
                if sh[0]=='G':
                    await pg.evaluate("(()=>{window.__camLock=0;window.update=window.__upd;const rn=roadNear(lv.world,p.x,p.z,80,r=>r.car&&r.n&&r.wm>7);if(rn){p.x=(rn.a[0]+rn.b[0])/2+3;p.z=(rn.a[1]+rn.b[1])/2;}settle();cam.snap=true;for(let i=0;i<120;i++)update();})()")
                elif sh[0]=='L':
                    await pg.evaluate("(()=>{const L=lv.world.landmarks.find(q=>q.art=='%s'),o=L.obb,f=L.face,d=Math.max(o.hu,o.hv)*1.6+14;cam.x=o.cx+f[0]*d+f[1]*d*.45;cam.z=o.cz+f[1]*d-f[0]*d*.45;cam.y=9;cam.tx=o.cx;cam.tz=o.cz;cam.ty=5;p.x=o.cx+f[0]*(Math.max(o.hu,o.hv)+6);p.z=o.cz+f[1]*(Math.max(o.hu,o.hv)+6);})()"%sh[1])
                elif sh[0]=='R':
                    await pg.evaluate("(()=>{const w=lv.world,k='%s',d=%f,h=%f;let best=null;for(const r of w.roads){if(!(k+'t').includes(r.k)||r.b)continue;for(let i=0;i<r.pp.length-1;i++){const a=r.pp[i],b=r.pp[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if(mx<30||mz<30||mx>370||mz>270)continue;if(!best||l>best[0])best=[l,a,b];}}const [l,a,b]=best,dx=(b[0]-a[0])/l,dz=(b[1]-a[1])/l,sg=d<0?-1:1,mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;cam.x=mx-dx*d+dz*2.5*sg;cam.z=mz-dz*d-dx*2.5*sg;cam.y=h;cam.tx=mx+dx*sg*14;cam.tz=mz+dz*sg*14;cam.ty=2.6;p.x=mx;p.z=mz;})()"%(sh[1],sh[2],sh[3]))
                elif sh[0]=='S':
                    print(await pg.evaluate("(()=>{const g=lv.world.signs,q=g[%d%%g.length];const l=Math.hypot(q[3]-q[0],q[4]-q[1]);cam.x=q[0]+(q[3]-q[0])/l*5;cam.z=q[1]+(q[4]-q[1])/l*5;cam.y=2.5;cam.tx=q[0];cam.tz=q[1];cam.ty=3;p.x=q[3];p.z=q[4];return g.length+' signs: '+q[2];})()"%sh[1]))
                elif sh[0]=='H':
                    print(await pg.evaluate("(()=>{window.__camLock=0;window.update=window.__upd;const w=lv.world;let best=null;for(const r of w.roads){if(!r.car||r.b||!'str'.includes(r.k))continue;for(let i=0;i<r.pp.length-1;i++){const a=r.pp[i],b=r.pp[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<12)continue;const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if(mx<40||mz<40||mx>360||mz>260)continue;const sl=(worldY(w,b[0],b[1])-worldY(w,a[0],a[1]))/l;if(!best||Math.abs(sl)>Math.abs(best[0]))best=[sl,a,b,l];}}const [sl,a,b,l]=best,sg=%d*(sl>0?1:-1);p.x=(a[0]+b[0])/2;p.z=(a[1]+b[1])/2;p.yaw=Math.atan2((b[0]-a[0])*sg,(b[1]-a[1])*sg);cam.yaw=p.yaw+Math.PI;cam.snap=true;enemies.length=0;for(let i=0;i<90;i++){update();dlg=null;}return 'slope '+(sl*100).toFixed(1)+'%% at '+p.x.toFixed(0)+','+p.z.toFixed(0)+' gy '+gY(p.x,p.z).toFixed(1);})()"%sh[1]))
                elif sh[0]=='B':
                    print(await pg.evaluate("(()=>{let sp=null;const q=(()=>{let best=null;for(const S of lv.world.spans)for(let d=3;d<S.L;d+=3){const c=lineAt(S.p,d);if(c.x>20&&c.z>20&&c.x<380&&c.z<280){const l=deckLift(lv.world,c.x,c.z);if(!best||l>best.l){best=c;best.l=l;sp=S;}}}return best;})();window.__camLock=0;window.update=window.__upd;p.x=q.x;p.z=q.z;p.yaw=Math.atan2(q.dx,q.dz);cam.yaw=p.yaw+Math.PI;cam.snap=true;enemies.length=0;for(let i=0;i<60;i++){const x=p.x,z=p.z;update();dlg=null;p.x=x;p.z=z;}return 'on '+(sp.r.n||'span')+' lift '+deckLift(lv.world,p.x,p.z).toFixed(1);})()"))
                elif sh[0]=='K':
                    await pg.evaluate("(()=>{window.update=function(){frame++;bannerT=0;toastT=0;};window.__camLock=1;cam.x=p.x+22;cam.z=p.z+14;cam.y=3;cam.tx=p.x;cam.tz=p.z;cam.ty=0;})()")
                elif sh[0]=='U':
                    print(await pg.evaluate("(()=>{const g=(lv.world.shelters||[]).filter(q=>q[0]>10&&q[1]>10&&q[0]<390&&q[1]<290);if(!g.length)return 'no shelters';const q=g[%d%%g.length];cam.x=q[0]+q[2]*7+q[3]*6;cam.z=q[1]+q[3]*7-q[2]*6;cam.y=4.5;cam.tx=q[0];cam.tz=q[1];cam.ty=1;p.x=q[0]+q[2]*2;p.z=q[1]+q[3]*2;return g.length+' shelters';})()"%sh[1]))
                elif sh[0]=='P':
                    await pg.evaluate("(()=>{const d=%f,h=%f,rn=roadNear(lv.world,p.x,p.z,60,r=>r.car&&r.wm>7);let dx=0,dz=1;if(rn){const l=Math.hypot(rn.b[0]-rn.a[0],rn.b[1]-rn.a[1]);dx=(rn.b[0]-rn.a[0])/l;dz=(rn.b[1]-rn.a[1])/l;const t=((p.x-rn.a[0])*dx+(p.z-rn.a[1])*dz);window.__q=[rn.a[0]+dx*t,rn.a[1]+dz*t];}else window.__q=[p.x,p.z];cam.x=__q[0]-dx*d+dz*1.5;cam.z=__q[1]-dz*d-dx*1.5;cam.y=h;cam.tx=__q[0]+dx*20;cam.tz=__q[1]+dz*20;cam.ty=2.5;})()"%(sh[1],sh[2]))
                else:
                    cx,cz,cy,tx,tz,ty=sh
                    await pg.evaluate("(()=>{cam.x=%f;cam.z=%f;cam.y=%f;cam.tx=%f;cam.tz=%f;cam.ty=%f;dlg=null;})()"%(cx,cz,cy,tx,tz,ty))
                await pg.wait_for_timeout(4000);await s.screenshot(path='W_%s%d.png'%(name,i));print(await pg.evaluate('JSON.stringify([chunkStat,traffic.length,walkers.length,[p.x,p.z]])'))
        print(errs[:8]);await b.close()
asyncio.run(main())
