import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1100,'height':760});pg.set_default_timeout(400000);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..','index.html')));await pg.wait_for_timeout(3500);s=pg.locator('#screen')
        await pg.evaluate("(()=>{startGame(null);dlg=null;QUAL.auto=false;window.__upd=window.update;})()")
        for a in sys.argv[1:]:
            mode='G' if a.endswith('!') else 'T';rid=a.rstrip('!')
            await pg.evaluate("(()=>{window.update=window.__upd;window.__camLock=0;loadScene('%s',16,15,Math.PI);dlg=null;enemies.length=0;for(let i=0;i<40;i++){update();dlg=null;}})()"%rid)
            if mode=='T':
                await pg.evaluate("(()=>{window.update=function(){frame++;bannerT=0;toastT=0;};window.__camLock=1;cam.x=16;cam.z=27;cam.y=27;cam.tx=16;cam.tz=11.5;cam.ty=0;})()")
            await pg.wait_for_timeout(3500);await s.screenshot(path='R_%s.png'%rid.replace(':','_').replace(',','_'))
        print(errs[:5]);await b.close()
asyncio.run(main())
