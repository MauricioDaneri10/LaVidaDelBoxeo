"""Read-only project audit: isolated browser saves, all seven tabs and network telemetry."""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_save

ROOT = r'E:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening'
URL = 'http://127.0.0.1:5230/'

def main():
    server = subprocess.Popen([sys.executable,'-m','http.server','5230','--bind','127.0.0.1','--directory',ROOT+r'\dist'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    time.sleep(.5)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for width,height in [(1280,720),(1366,768),(1024,768),(390,844)]:
                context=browser.new_context(viewport={'width':width,'height':height})
                page=context.new_page()
                errors=[]; failed=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('response',lambda r:failed.append([r.status,r.url]) if r.status>=400 else None)
                save=make_save(alumnos_count=10,amateurs_count=2,pros_count=2)
                page.goto(URL)
                page.evaluate("s=>localStorage.setItem('vida-del-boxeo-v2',JSON.stringify(s))",save)
                page.reload(wait_until='networkidle')
                for tab in ['Gimnasio','Ciudad','Plantel','Mercado','Mi Perfil','Personal','Calendario']:
                    page.get_by_role('button',name=tab,exact=True).click()
                    page.wait_for_timeout(120)
                    metrics=page.evaluate("""()=>{
                        const footer=document.querySelector('.app-footer').getBoundingClientRect();
                        const main=document.querySelector('.app-main').getBoundingClientRect();
                        const screen=document.querySelector('.game-screen');
                        return {footerVisible:footer.bottom<=innerHeight+1&&footer.top>=0,
                          noPageScroll:document.documentElement.scrollHeight<=innerHeight+1,
                          mainHeight:main.height, screenHeight:screen?.clientHeight,
                          screenScrollHeight:screen?.scrollHeight};
                    }""")
                    print(json.dumps({'viewport':[width,height],'tab':tab,**metrics},ensure_ascii=False))
                    if width in [1280,390] and tab in ['Mi Perfil','Ciudad','Plantel']:
                        page.screenshot(path=f'scratch/integral-{width}-{tab.replace(" ","-")}.png')
                print(json.dumps({'viewport':[width,height],'pageErrors':errors,'httpErrors':failed},ensure_ascii=False))
                # Validate modal keyboard isolation without touching real data.
                page.get_by_role('button',name='Plantel',exact=True).click()
                target=page.get_by_role('button',name='Ver ficha').first
                if target.count():
                    target.click()
                    page.wait_for_timeout(100)
                    page.keyboard.press('Tab')
                    print('MODAL_FOCUS',page.evaluate("()=>({active:document.activeElement?.tagName,inDialog:!!document.activeElement?.closest('[role=dialog]')})"))
                context.close()
            browser.close()
    finally:
        server.terminate();server.wait()

if __name__=='__main__':main()
