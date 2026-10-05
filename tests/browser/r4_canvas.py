"""R4 read-only synthetic visual diagnostics; fail on bounds/legibility defects.

Build first. Never opens localhost:3000 or an existing browser profile.
CSS viewport reduction models 125% zoom; deviceScaleFactor remains one.
"""
import argparse
import copy
import hashlib
import json
import re
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
TAB_IDS = ["gimnasio","ciudad","plantel","mercado","perfil","personal","calendario"]
EXPAND = """() => {
 window.__r4PseudoNodes ||= new WeakMap();
 window.__r4PseudoOriginals ||= new WeakMap();
 const walk=document.createTreeWalker(document.getElementById('root'),NodeFilter.SHOW_TEXT);
 for(let n; (n=walk.nextNode());) {
  if(!n.textContent.trim()||n.parentElement.closest('script,style,svg,[aria-hidden="true"]'))continue;
  const previous=window.__r4PseudoNodes.get(n);
  if(previous===n.textContent)continue;
  window.__r4PseudoOriginals.set(n,n.textContent);
  n.textContent=n.textContent+' '+ '~'.repeat(Math.ceil(n.textContent.trim().length*.4));
  window.__r4PseudoNodes.set(n,n.textContent);
 }
}"""
MEASURE = """() => {
 const r=e=>{const v=e.getBoundingClientRect();return {x:v.x,y:v.y,w:v.width,h:v.height,bottom:v.bottom,right:v.right};};
 const screen=document.querySelector('.game-screen,.gym-scene');
 const footer=[...document.querySelectorAll('footer')].find(e=>!e.closest('[inert]')) ?? document.querySelector('footer');
 const failures=[];
 const touch=matchMedia('(pointer:coarse)').matches;
 const buttons=[...document.querySelectorAll('button,input,select,[role="button"]')].filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden' && !e.closest('[inert]'));
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
  const visibleText=c=>{for(let p=c;p&&p!==e.parentElement;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.display==='none'||Number(s.opacity)===0)return false;}return true;};
  const text=[...e.querySelectorAll('span,div,p')].filter(c=>c.childElementCount===0 && c.textContent.trim() && visibleText(c));
  const fonts=(text.length?text:[e]).map(c=>({size:parseFloat(getComputedStyle(c).fontSize),min:c.closest('[data-text-role="secondary"]')?12:14}));
  if(fonts.some(f=>f.size<f.min-.1)) failures.push({kind:'action-font',name,fonts});
 }
 if(window.__r4TextAudit) {
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let node;(node=walker.nextNode());) {
   const e=node.parentElement;
   if(!node.textContent.trim()||e.closest('script,style,svg,option,.sr-only,[inert],[aria-hidden="true"]'))continue;
   let visible=true;
   for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)===0){visible=false;break;}}
   if(!visible||!e.getClientRects().length)continue;
   const range=document.createRange();range.selectNodeContents(node);
   if(!range.getBoundingClientRect().height)continue;
   const font=parseFloat(getComputedStyle(e).fontSize),min=e.closest('[data-text-role="secondary"]')?12:14;
   if(font<min-.1) failures.push({kind:'content-font',name:node.textContent.trim(),font,min,classes:e.className});
   if(window.__r4TextBounds) {
    const b=range.getBoundingClientRect();
    let clipped=b.left<-.5||b.top<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5;
    for(let p=e;p;p=p.parentElement) {
     const c=getComputedStyle(p),pb=p.getBoundingClientRect();
     if(['hidden','clip','auto','scroll'].includes(c.overflowY)&&(b.top<pb.top-.5||b.bottom>pb.bottom+.5))clipped=true;
     if(['hidden','clip','auto','scroll'].includes(c.overflowX)&&(b.left<pb.left-.5||b.right>pb.right+.5))clipped=true;
    }
    if(clipped)failures.push({kind:'text-clipped',name:node.textContent.trim(),rect:{x:b.x,y:b.y,w:b.width,h:b.height},classes:e.className});
   }
  }
 }
 if(footer) {const b=footer.getBoundingClientRect();if(b.bottom>innerHeight+.5||b.top<0) failures.push({kind:'footer',rect:r(footer)});}
 else failures.push({kind:'footer-missing'});
 return {viewport:{width:innerWidth,height:innerHeight,touch},canvas:screen?r(screen):null,footer:footer?r(footer):null,buttons:buttons.length,failures,globalScroll:document.documentElement.scrollHeight>innerHeight+1};
}"""

def run():
    global URL
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build-ready',action='store_true',required=True)
    parser.add_argument('--dist',type=Path,default=ROOT/'dist',help='Immutable build; fingerprint every asset')
    parser.add_argument('--all-states',action='store_true')
    parser.add_argument('--locale',choices=['es','en','pt-BR'],default='es',help='Actual verified catalog, independent of DOM pseudo-localization')
    parser.add_argument('--density-states',action='store_true',help='Also exercise one, four and ten pupils and the waiting list')
    parser.add_argument('--capture-states',action='store_true',help='Capture empty and maximum green states at the two inspection sizes too')
    parser.add_argument('--text-audit',action='store_true',help='Assert font floors on visible non-interactive copy too')
    parser.add_argument('--text-bounds',action='store_true',help='Also assert actual text ranges fit viewport and clipping ancestors')
    parser.add_argument('--zoom',action='store_true')
    parser.add_argument('--pseudo',action='store_true',help='DOM text stress +40%%; not a certificate of catalog completeness')
    parser.add_argument('--port',type=int,choices=range(5236,5241),default=5236)
    parser.add_argument('--viewport',type=int,nargs=2,metavar=('WIDTH','HEIGHT'),help='Focused case only; omit for all ten required sizes')
    parser.add_argument('--tab',choices=TABS,help='Focused screen only; omit for all seven screens')
    args=parser.parse_args()
    URL=f'http://127.0.0.1:{args.port}/'
    started=time.perf_counter()
    dist=args.dist.resolve()
    fingerprint={str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob('*') if p.is_file()}
    output=Path(tempfile.mkdtemp(prefix='r4-canvas-'))
    with socket.socket() as probe: probe.bind(('127.0.0.1',args.port))
    server=subprocess.Popen([sys.executable,'-m','http.server',str(args.port),'--bind','127.0.0.1','--directory',str(dist)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    report={'status':'RUNNING','build':fingerprint,'origin':URL,'captures':str(output),'cases':[],'pseudo':'visible DOM text +40%, presentation only' if args.pseudo else 'off','zoom':'CSS viewport /1.25; DPR=1' if args.zoom else '100%'}
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
            for w,h in ([tuple(args.viewport)] if args.viewport else SIZES):
                states=['normal','empty','maximum'] if args.all_states else ['normal']
                if args.density_states:states+=['one','four','ten','waiting']
                for mode in states:
                    fixture=copy.deepcopy(base)
                    fixture.update(creado=True,partidaId='r4-canvas-synthetic',dia=2,eventos=[],prensa=[],toasts=[],ofertas=[],ofertasPara=None,pendientes=[],resumen=None,combateActivo=None)
                    fixture['nombreGimnasio']='Club de los Campeones de Nombres Extraordinariamente Largos'
                    fixture['nombreJugador']='Entrenador de Apellido Compuesto Muy Largo'
                    if mode=='empty': fixture['plantel']=[]
                    if mode in ['one','four','ten','waiting']:
                        count={'one':1,'four':4,'ten':10,'waiting':11}[mode]
                        fixture['plantel']=[]
                        for i in range(count):
                            pupil=copy.deepcopy(base['plantel'][i%len(base['plantel'])]);pupil.update(id=f'r4-density-{i}',nombre=f'Alumna de Nombre Extenso Compuesto {i}',rol='alumno',enEspera=(mode=='waiting' and i==10))
                            fixture['plantel'].append(pupil)
                    if mode=='maximum':
                        students=[]
                        for i in range(10):
                            p=copy.deepcopy(base['plantel'][i%len(base['plantel'])]);p.update(id=f'r4-student-{i}',nombre=f'Nombre Extenso Apellido Compuesto {i}',rol='alumno');students.append(p)
                        for i in range(20):
                            p=copy.deepcopy(base['plantel'][i%len(base['plantel'])]);p.update(id=f'r4-competitor-{i}',nombre=f'Competidor de Nombre Extraordinariamente Largo {i}',rol='boxeador',licenciaFederativa=True,circuito='amateur' if i<10 else 'pro');students.append(p)
                        fixture['plantel']=students
                    viewport={'width':round(w/1.25) if args.zoom else w,'height':round(h/1.25) if args.zoom else h}
                    ctx=browser.new_context(viewport=viewport,device_scale_factor=1,has_touch=w<=844)
                    ctx.route('**/*',lambda route: route.continue_() if route.request.url.startswith(URL) else route.abort())
                    ctx.add_init_script(DETERMINISTIC)
                    ctx.add_init_script('window.__r4TextAudit='+str(args.text_audit or args.text_bounds).lower()+';window.__r4TextBounds='+str(args.text_bounds).lower()+';')
                    ctx.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(fixture,ensure_ascii=False))+');')
                    ctx.add_init_script('localStorage.setItem("vida-del-boxeo:idioma",'+json.dumps(args.locale)+');')
                    page=ctx.new_page();page.goto(URL,wait_until='domcontentloaded')
                    page.locator('.app-nav').wait_for()
                    if mode=='maximum':
                        loaded=state(page)
                        assert len(loaded['plantel'])==30, 'Maximum fixture lost pupils or competitors'
                        assert sum(p.get('rol')=='boxeador' and p.get('circuito')=='pro' for p in loaded['plantel'])==10, 'Maximum fixture must retain ten professionals'
                    page.evaluate('document.fonts.ready')
                    for tab in ([args.tab] if args.tab else TABS):
                        case={'size':[w,h],'mode':mode,'tab':tab,'locale':args.locale}
                        try:
                            navigation=page.locator('.app-nav')
                            selector=navigation.locator('select')
                            if selector.count(): selector.select_option(value=TAB_IDS[TABS.index(tab)])
                            else:
                                labels=dict(zip(TABS,['nav.gym','nav.city','nav.roster','nav.market','nav.profile','nav.staff','nav.calendar']))
                                localized=tab if args.locale=='es' else json.loads((ROOT/'public'/'i18n'/f'{args.locale}.json').read_text(encoding='utf-8'))[labels[tab]]
                                navigation.get_by_role('button',name=re.compile('^'+re.escape(localized)+r'(?:\s|$)')).click(timeout=1500)
                            page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                            if args.pseudo:
                                page.evaluate(EXPAND)
                                page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                            case.update(page.evaluate(MEASURE))
                            if tab=='Plantel' and mode!='empty':
                                grid=page.locator('.plantel-grid')
                                width=grid.bounding_box()['width']
                                required=min(len([p for p in fixture['plantel'] if not p.get('enEspera')]),5,max(1,int((width+8)/308)))
                                count=grid.locator('article').count()
                                case['density']={'required_first_row':required,'visible_cards':count,'width':width}
                                if count<required: case['failures'].append({'kind':'roster-capacity-unused','required':required,'actual':count})
                            if tab=='Calendario' and viewport['width']>700 and viewport['height']>450:
                                count=page.locator('.calendar-content > div > div').count()
                                if count!=7: case['failures'].append({'kind':'calendar-week-incomplete','required':7,'actual':count})
                            case['status']='FAIL' if case['failures'] or case['globalScroll'] else 'PASS'
                            if case['status']=='FAIL' or ((mode=='normal' or args.capture_states) and (w,h) in [(1280,720),(390,844)]):
                                shot=output/f'{mode}-{w}x{h}-{tab.replace(" ","-")}.png'
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
