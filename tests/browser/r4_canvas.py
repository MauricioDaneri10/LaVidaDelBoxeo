"""R4 read-only synthetic visual diagnostics; fail on bounds/legibility defects.

Build first. Never opens localhost:3000 or an existing browser profile.
CSS viewport reduction models 125% zoom; deviceScaleFactor remains one.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import traceback
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scratch"))
from test_r3_content import DETERMINISTIC, state
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5236/"
KEY = "vida-del-boxeo-v2"
SIZES = [(1920,1080),(1440,900),(1366,768),(1280,720),(1024,600),(1024,768),(768,1024),(390,844),(390,667),(844,390)]
TABS = ["Gimnasio","Ciudad","Plantel","Mercado","Mi Perfil","Personal","Calendario"]
MEASURE = """() => {
 const r=e=>{const v=e.getBoundingClientRect();return {x:v.x,y:v.y,w:v.width,h:v.height,bottom:v.bottom,right:v.right};};
 const screen=document.querySelector('.game-screen');
 const footer=document.querySelector('footer');
 const failures=[];
 const touch=matchMedia('(pointer:coarse)').matches;
 const buttons=[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden' && !e.closest('[inert]'));
 for(const e of buttons) {
  const b=e.getBoundingClientRect(); const name=(e.innerText||e.getAttribute('aria-label')||e.title||'sin etiqueta').trim();
  if(b.width<1||b.height<1) continue;
  let clipped=b.left<-.5||b.top<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5;
  for(let p=e.parentElement;p;p=p.parentElement) {
   const c=getComputedStyle(p),pb=p.getBoundingClientRect();
   if(['hidden','clip','auto','scroll'].includes(c.overflowY) && (b.top<pb.top-.5||b.bottom>pb.bottom+.5)) clipped=true;
   if(['hidden','clip','auto','scroll'].includes(c.overflowX) && (b.left<pb.left-.5||b.right>pb.right+.5)) clipped=true;
  }
  if(clipped) failures.push({kind:'clipped',name,rect:r(e)});
  const target=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
  if(!clipped&&!e.disabled&&target&&!e.contains(target)) failures.push({kind:'covered',name});
  if(b.height<(touch?44:36)-.5) failures.push({kind:'target-height',name,height:b.height,min:touch?44:36});
  const text=[...e.querySelectorAll('span,div,p')].filter(c=>c.childElementCount===0 && c.textContent.trim());
  const fonts=(text.length?text:[e]).map(c=>parseFloat(getComputedStyle(c).fontSize));
  if(fonts.some(f=>f<14-.1)) failures.push({kind:'action-font',name,fonts});
 }
 if(footer) {const b=footer.getBoundingClientRect();if(b.bottom>innerHeight+.5||b.top<0) failures.push({kind:'footer',rect:r(footer)});}
 else failures.push({kind:'footer-missing'});
 return {viewport:{width:innerWidth,height:innerHeight,touch},canvas:screen?r(screen):null,footer:footer?r(footer):null,buttons:buttons.length,failures,globalScroll:document.documentElement.scrollHeight>innerHeight+1};
}"""

def run():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build-ready',action='store_true',required=True)
    parser.add_argument('--all-states',action='store_true')
    parser.add_argument('--zoom',action='store_true')
    args=parser.parse_args()
    started=time.perf_counter()
    dist=ROOT/'dist'
    fingerprint={str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob('*') if p.is_file()}
    output=Path(tempfile.mkdtemp(prefix='r4-canvas-'))
    with socket.socket() as probe: probe.bind(('127.0.0.1',5236))
    server=subprocess.Popen([sys.executable,'-m','http.server','5236','--bind','127.0.0.1','--directory',str(dist)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    report={'status':'RUNNING','build':fingerprint,'origin':URL,'captures':str(output),'cases':[],'zoom':'CSS viewport /1.25; DPR=1' if args.zoom else '100%'}
    try:
        deadline=time.monotonic()+5
        while True:
            try: urlopen(URL,timeout=.3).close();break
            except OSError:
                if time.monotonic()>deadline: raise RuntimeError('Server unavailable')
                time.sleep(.05)
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=['--enable-gpu','--use-angle=d3d11'])
            report['gpu']=browser.new_browser_cdp_session().send('SystemInfo.getInfo')['gpu']
            context=browser.new_context()
            context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(URL) else route.abort())
            context.add_init_script(DETERMINISTIC)
            page=context.new_page();page.goto(URL,wait_until='domcontentloaded')
            page.wait_for_function("localStorage.getItem('vida-del-boxeo-v2')!==null")
            base=state(page);context.close()
            for w,h in SIZES:
                states=['normal','empty','maximum'] if args.all_states else ['normal']
                for mode in states:
                    fixture=copy.deepcopy(base)
                    fixture.update(creado=True,partidaId='r4-canvas-synthetic',dia=2,eventos=[],prensa=[],toasts=[],ofertas=[],ofertasPara=None,pendientes=[],resumen=None,combateActivo=None)
                    fixture['nombreGimnasio']='Club de los Campeones de Nombres Extraordinariamente Largos'
                    fixture['nombreJugador']='Entrenador de Apellido Compuesto Muy Largo'
                    if mode=='empty': fixture['plantel']=[]
                    if mode=='maximum':
                        students=[]
                        for i in range(10):
                            p=copy.deepcopy(base['plantel'][i%len(base['plantel'])]);p.update(id=f'r4-student-{i}',nombre=f'Nombre Extenso Apellido Compuesto {i}',rol='alumno');students.append(p)
                        for i in range(20):
                            p=copy.deepcopy(base['plantel'][i%len(base['plantel'])]);p.update(id=f'r4-competitor-{i}',nombre=f'Competidor de Nombre Extraordinariamente Largo {i}',rol='boxeador',licenciaFederativa=True,circuito='amateur' if i<10 else 'profesional');students.append(p)
                        fixture['plantel']=students
                    viewport={'width':round(w/1.25) if args.zoom else w,'height':round(h/1.25) if args.zoom else h}
                    ctx=browser.new_context(viewport=viewport,device_scale_factor=1,has_touch=w<=844)
                    ctx.route('**/*',lambda route: route.continue_() if route.request.url.startswith(URL) else route.abort())
                    ctx.add_init_script(DETERMINISTIC)
                    ctx.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(fixture,ensure_ascii=False))+');')
                    page=ctx.new_page();page.goto(URL,wait_until='domcontentloaded')
                    page.locator('.app-nav').wait_for()
                    page.evaluate('document.fonts.ready')
                    for tab in TABS:
                        case={'size':[w,h],'mode':mode,'tab':tab}
                        try:
                            navigation=page.locator('.app-nav')
                            selector=navigation.get_by_role('combobox',name='Pestaña del juego')
                            if selector.count(): selector.select_option(label=tab)
                            else: navigation.get_by_role('button',name=tab,exact=True).click(timeout=1500)
                            page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                            case.update(page.evaluate(MEASURE))
                            case['status']='FAIL' if case['failures'] or case['globalScroll'] else 'PASS'
                            if mode=='normal' and tab in ['Mi Perfil','Plantel'] and (w,h) in [(1280,720),(390,844)]:
                                shot=output/f'{w}x{h}-{tab.replace(" ","-")}.png'
                                page.screenshot(path=str(shot));case['capture']=str(shot)
                        except Exception:
                            case.update(status='FAIL',error=traceback.format_exc())
                        report['cases'].append(case)
                    ctx.close()
            browser.close()
    finally:
        server.terminate();server.wait(timeout=5)
    report['elapsed_seconds']=round(time.perf_counter()-started,3)
    report['build_unchanged']=fingerprint=={str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob('*') if p.is_file()}
    report['status']='PASS' if report['build_unchanged'] and all(c['status']=='PASS' for c in report['cases']) else 'FAIL'
    print(json.dumps(report,ensure_ascii=False),flush=True)
    return 0 if report['status']=='PASS' else 1

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');sys.exit(run())
