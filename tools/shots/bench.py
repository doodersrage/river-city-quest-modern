import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':1280,'height':800});pg.set_default_timeout(900000);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..','index.html'))+'?bench=1');await pg.wait_for_function('window.__bench',timeout=900000);print(await pg.evaluate('window.__bench'));print(errs[:4]);await pg.screenshot(path='bench.png');await b.close()
asyncio.run(main())
