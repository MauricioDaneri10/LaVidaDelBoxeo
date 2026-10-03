"""R4 isolated RED/GREEN acceptance; never connects to the owner's origin.

Build first, then: python tests/browser/r4_dialogs.py --build-ready
JSON summary and nonzero exit if any required assertion fails.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
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
from r4_canvas import MEASURE, SIZES, EXPAND

URL = "http://127.0.0.1:5235/"
KEY = "vida-del-boxeo-v2"


def route_local(route):
    if route.request.url.startswith(URL):
        route.continue_()
    else:
        route.abort()


def offers_case(page):
    # Reload must not force an old decision open. Reopening does not regenerate.
    assert page.get_by_role("dialog").count() == 0, "Saved offers forced modal open"
    before = state(page)
    rng_before = page.evaluate("window.__qaRandom")
    navigation = page.locator('.app-nav select')
    reopen = navigation if navigation.count() else page.get_by_role("button", name="Ver ofertas pendientes", exact=True)
    def open_offers():
        if navigation.count(): navigation.select_option(value='contexto-ofertas')
        else: reopen.click()
    open_offers()
    dialog = page.get_by_role("dialog")
    dialog.wait_for()
    assert dialog.locator("button").count() > 1
    dialog.get_by_role("button", name="Cerrar ventana", exact=True).click()
    dialog.wait_for(state="detached")
    assert state(page) == before, "Closing altered persisted game data"
    assert page.evaluate("window.__qaRandom") == rng_before, "Closing/reopening consumed game RNG"
    open_offers()
    page.keyboard.press("Escape")
    dialog.wait_for(state="detached")
    assert state(page) == before
    assert reopen.evaluate("e=>e===document.activeElement"), "Focus did not return to trigger"
    page.reload(wait_until="networkidle")
    assert page.get_by_role("dialog").count() == 0
    assert state(page) == before


def focus_case(page):
    trigger = page.locator("button[title='Configuración y partidas']")
    trigger.click()
    dialog = page.get_by_role("dialog")
    dialog.wait_for()
    assert dialog.evaluate("e=>e.contains(document.activeElement)"), "No initial dialog focus"
    title_id = dialog.get_attribute("aria-labelledby")
    assert title_id and page.locator(f"[id='{title_id}']").count() == 1
    before = state(page)
    for _ in range(30):
        page.keyboard.press("Tab")
        assert dialog.evaluate("e=>e.contains(document.activeElement)"), "Tab escaped modal"
    for _ in range(30):
        page.keyboard.press("Shift+Tab")
        assert dialog.evaluate("e=>e.contains(document.activeElement)"), "Reverse Tab escaped modal"
    page.keyboard.press(" ")
    assert state(page)["dia"] == before["dia"], "Management shortcut advanced day in modal"
    page.keyboard.press("Escape")
    dialog.wait_for(state="detached")
    assert trigger.evaluate("e=>e===document.activeElement"), "Focus did not return to settings"


def context_case(page):
    before = state(page)
    navigation = page.locator('.app-nav select')
    for value, title in [('contexto-plan','Objetivos y previsión'),('contexto-club','Panel del club')]:
        navigation.select_option(value=value)
        dialog=page.get_by_role('dialog',name=title,exact=True)
        dialog.wait_for()
        assert dialog.evaluate('e=>e.contains(document.activeElement)')
        page.keyboard.press('Escape')
        dialog.wait_for(state='detached')
        assert navigation.evaluate('e=>e===document.activeElement')
        assert state(page)==before, 'Context details altered saved game'
    navigation.select_option(value='perfil')
    page.get_by_role('combobox',name='Sección del perfil').select_option(value='resumen')
    page.get_by_role('dialog',name='Perfil del coach',exact=True).wait_for()
    page.keyboard.press('Escape')
    navigation.select_option(value='ciudad')
    city=page.get_by_role('combobox',name='Gestión de ciudad e inmuebles')
    city.select_option(value='arena')
    page.get_by_role('dialog',name='Arena Central',exact=True).wait_for()
    page.keyboard.press('Escape')
    assert state(page)==before


def hiring_case(page):
    before=state(page)
    page.locator('.app-nav select').select_option(value='personal')
    page.get_by_role('button',name='Contratar',exact=True).first.click()
    dialog=page.get_by_role('dialog',name='Revisar costo de contratación',exact=True)
    dialog.wait_for()
    assert state(page)==before, 'Opening financial confirmation hired someone'
    assert dialog.evaluate('e=>e.contains(document.activeElement)')
    page.keyboard.press('Escape')
    dialog.wait_for(state='detached')
    assert state(page)==before, 'Cancelling confirmation mutated game'
    page.get_by_role('button',name='Contratar',exact=True).first.click()
    page.get_by_role('dialog').get_by_role('button',name='Contratar igualmente',exact=True).click()
    page.get_by_role('dialog').wait_for(state='detached')
    page.get_by_text('Contratado',exact=True).wait_for()
    assert len(state(page)['personal'])==1


def toast_deadline_case(page):
    """A presentation rerender/new toast must not restart an existing deadline."""
    code = subprocess.check_output(['node','--input-type=module','-e',
        "import {build} from 'esbuild'; const r=await build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {ContenedorToast} from './src/components/ui'; const root=createRoot(document.getElementById('root')); window.__closed=[]; window.__renderToasts=items=>root.render(React.createElement(ContenedorToast,{toasts:items,onCerrar:id=>window.__closed.push(id)}));`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife'});process.stdout.write(r.outputFiles[0].text);"],cwd=ROOT,text=True)
    page.set_content('<div id="root"></div>')
    page.clock.install()
    page.add_script_tag(content=code)
    first={'id':101,'texto':'Aviso persistente','tono':'ok','tiempo':4200}
    second={'id':102,'texto':'Segundo aviso','tono':'ok','tiempo':4200}
    page.evaluate('items=>window.__renderToasts(items)',[first])
    page.get_by_text(first['texto'],exact=True).wait_for()
    page.clock.fast_forward(1000)
    page.evaluate('items=>window.__renderToasts(items)',[first,second])
    page.get_by_text(second['texto'],exact=True).wait_for()
    page.clock.fast_forward(3200)
    assert page.evaluate('window.__closed')==[101], 'Original 4200ms deadline was restarted by a rerender'
    page.clock.fast_forward(1000)
    assert page.evaluate('window.__closed')==[101,102]


def measure_detail(page):
    if page.evaluate('Boolean(window.__r4Pseudo)'):
        page.evaluate(EXPAND.replace("document.getElementById('root')", 'document.body'))
    page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
    return page.evaluate(MEASURE)


def gym_drawer_case(page):
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='gimnasio')
    else: page.locator('.app-nav').get_by_role('button',name='Gimnasio',exact=True).click()
    before=state(page)
    station=page.get_by_role('combobox',name='Estación del gimnasio')
    if station.count():
        for value in ['1','2','3','4','5']:
            station.select_option(value=value)
            page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            report=measure_detail(page)
            assert not report['failures'], ('station',value,report['failures'])
            if value=='1': page.screenshot(path=str(page.r4_open_capture))
    trigger=page.get_by_role('button',name=re.compile(r'^Ver plantel'))
    trigger.click()
    page.get_by_role('dialog').wait_for()
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    seen=set()
    while True:
        report=measure_detail(page)
        assert not report['failures'], ('drawer',report['failures'])
        seen.update(page.get_by_role('dialog').locator('button[aria-label^="Ver ficha de"]').evaluate_all('es=>es.map(e=>e.getAttribute("aria-label"))'))
        nxt=page.get_by_role('button',name=re.compile(r'^Siguiente(?:\s|$)'))
        if not nxt.count() or nxt.is_disabled(): break
        nxt.click()
    assert len(seen)==len([p for p in before['plantel'] if not p.get('enEspera')]), seen
    page.keyboard.press('Escape')
    assert trigger.evaluate('e=>e===document.activeElement')
    assert state(page)==before


def transfer_cancel_case(page):
    before=state(page)
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='plantel')
    else: page.locator('.app-nav').get_by_role('button',name='Plantel',exact=True).click()
    native=[]
    page.on('dialog',lambda dialog: (native.append(dialog.type),dialog.dismiss()))
    trigger=page.get_by_role('button',name='Transferir',exact=True).first
    trigger.click()
    assert not native, 'Transfer uses a native dialog outside the accessible layer stack'
    dialog=page.get_by_role('dialog',name='Transferir fuera del club')
    dialog.wait_for()
    page.keyboard.press('Escape')
    assert page.get_by_role('dialog').count()==0
    assert state(page)==before, 'Cancel must preserve career, money and RNG'
    assert trigger.evaluate('e=>e===document.activeElement')


def boxer_detail_case(page):
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='gimnasio')
    else: page.locator('.app-nav').get_by_role('button',name='Gimnasio',exact=True).click()
    before=state(page)
    page.get_by_role('button',name=re.compile('^Ver ficha de ')).first.click()
    page.get_by_role('dialog').wait_for()
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    boxer=page.get_by_role('combobox',name='Boxeador de la ficha')
    if boxer.count(): boxer.select_option(value=before['plantel'][0]['id'])
    report=measure_detail(page)
    assert not report['failures'], report['failures']
    sections=page.get_by_role('combobox',name='Sección de la ficha')
    if sections.count():
        values=sections.locator('option').evaluate_all('es=>es.map(e=>e.value)')
        assert values==['nombre','identidad','figura','record','rasgo','radar','atributos','enfoque','confirmacion','consejo','practicas','gestion','historial'], values
        for section in values:
            sections.select_option(value=section)
            report=measure_detail(page)
            assert not report['failures'], (section,report['failures'])
            if section=='atributos':
                for pillar in ['0','1','2']:
                    page.get_by_role('combobox',name='Pilar de atributos').select_option(value=pillar)
                    report=measure_detail(page)
                    assert not report['failures'], (section,pillar,report['failures'])
            if section=='enfoque':
                focus=page.get_by_role('combobox',name='Enfoque para revisar antes de asignar')
                choices=focus.locator('option').evaluate_all('es=>es.map(e=>e.value)')
                assert len(choices)==6, choices
                for choice in choices:
                    focus.select_option(value=choice)
                    report=measure_detail(page)
                    assert not report['failures'], (section,choice,report['failures'])
                    assert state(page)==before, 'Preview must not assign focus or consume RNG'
            if section=='historial' and before['historial']:
                fights=page.get_by_role('combobox',name='Combate del historial')
                assert fights.locator('option').count()==5
                for index in range(5):
                    fights.select_option(value=str(index))
                    report=measure_detail(page)
                    assert not report['failures'], (section,index,report['failures'])
            if section=='gestion' and before['plantel'][0]['rol']=='boxeador':
                actions=page.get_by_role('combobox',name='Acción de gestión del boxeador')
                for action in actions.locator('option').evaluate_all('es=>es.map(e=>e.value)'):
                    actions.select_option(value=action)
                    report=measure_detail(page)
                    assert not report['failures'], (section,action,report['failures'])
    page.keyboard.press('Escape')
    assert state(page)==before


def management_switch_case(page):
    boxer_detail_case(page)
    before=state(page)
    page.get_by_role('button',name=re.compile('^Ver ficha de ')).first.click()
    page.get_by_role('dialog').wait_for()
    selector=page.get_by_role('combobox',name='Boxeador de la ficha')
    selector.select_option(before['plantel'][0]['id'])
    page.get_by_role('combobox',name='Sección de la ficha').select_option('gestion')
    actions=page.get_by_role('combobox',name='Acción de gestión del boxeador')
    actions.select_option('profesional')
    assert actions.input_value()=='profesional'
    selector.select_option(before['plantel'][1]['id'])
    actions=page.get_by_role('combobox',name='Acción de gestión del boxeador')
    assert actions.input_value()=='ofertas', 'New boxer retained an unavailable management action'
    assert page.get_by_role('button',name='Buscar Ofertas de Combate',exact=True).is_visible()
    selector.select_option(before['plantel'][0]['id'])
    assert actions.input_value()=='ofertas'
    assert state(page)==before, 'Switching UI selection mutated the career'
    page.keyboard.press('Escape')


def club_status_case(page):
    before=state(page)
    trigger=page.get_by_role('button',name='Ver estado del club',exact=True)
    if not trigger.count(): return
    trigger.click()
    dialog=page.get_by_role('dialog',name='Estado del club',exact=True)
    dialog.wait_for()
    dialog=page.get_by_role('dialog')
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    chunks=[]
    while True:
        report=measure_detail(page)
        assert not report['failures'], report['failures']
        chunks.append(dialog.get_by_test_id('literal-text-page').evaluate("e=>[...e.childNodes].map(n=>window.__r4PseudoNodes?.get(n)===n.textContent ? window.__r4PseudoOriginals.get(n) : n.textContent).join('')"))
        next_page=dialog.get_by_role('button',name=re.compile('^Siguiente'))
        if not next_page.count() or next_page.is_disabled():break
        next_page.click()
    original=''.join(chunks)
    assert before['nombreGimnasio'] in original, (original,chunks)
    assert before['nombreJugador'] in original
    assert 'Cuenta del club: $0 · Fama: 0 · Seguidores: 0' in original
    assert 'Legados: '+str(before['legados']) in original
    page.keyboard.press('Escape')
    dialog.wait_for(state='detached')
    assert trigger.evaluate('e=>e===document.activeElement')
    assert state(page)==before


def city_detail_case(page):
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='ciudad')
    else: page.locator('.app-nav').get_by_role('button',name='Ciudad',exact=True).click()
    before=state(page)
    selector=page.get_by_role('combobox',name='Gestión de ciudad e inmuebles')
    if selector.count():
        values=selector.locator('optgroup option').evaluate_all('es=>es.map(e=>e.value)')
        assert sorted(values)==['apartamento','arena','local','mansion','sucursal','terreno'], values
        openers=[lambda value=v: selector.select_option(value=value) for v in values]
    else:
        pins=page.locator('svg [role=button]')
        assert pins.count()==6
        def open_pin(i):
            pins.nth(i).focus()
            page.keyboard.press('Enter')
            page.get_by_role('button',name='Ver inmueble · Detalles y compra',exact=True).click()
        openers=[lambda i=i: open_pin(i) for i in range(6)]
    for open_property in openers:
        open_property()
        page.get_by_role('dialog').wait_for()
        page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
        sections=page.get_by_role('combobox',name='Sección del inmueble')
        for section in ['detalle','beneficio','compra']:
            sections.select_option(value=section)
            report=measure_detail(page)
            assert not report['failures'], (section,report['failures'])
        page.keyboard.press('Escape')
        assert state(page)==before


def settings_bounds_case(page):
    page.locator("button[title='Configuración y partidas']").click()
    page.get_by_role('dialog').wait_for()
    page.evaluate('document.fonts.ready')
    # Bounds must be measured after the real entrance transform settles, not
    # against a transient scaled frame (deviceScaleFactor is not zoom).
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    before=state(page)
    selector=page.get_by_role('combobox', name='Sección de configuración')
    for section in ['partida','lectura','sonido','atajos','atajos-guardar','riesgo']:
        selector.select_option(section)
        page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
        report=measure_detail(page)
        assert not report['failures'], (section,report['failures'])
        if section=='atajos':
            labels=set()
            while True:
                labels.update(page.locator('input[aria-label^="Atajo para"]').evaluate_all('es=>es.map(e=>e.getAttribute("aria-label"))'))
                next_button=page.get_by_role('button',name=re.compile(r'^Siguiente(?:\s|$)'))
                if next_button.is_disabled(): break
                next_button.click()
                report=measure_detail(page)
                assert not report['failures'], ('atajos',report['failures'])
            assert len(labels)==10, labels
    page.get_by_role('button',name=re.compile(r'^Reiniciar carrera(?:\s|$)')).click()
    page.get_by_role('button',name='Cancelar',exact=True).wait_for()
    page.keyboard.press('Escape')
    assert page.get_by_role('dialog').count()==1
    assert state(page)==before, 'Presentation and cancelling reset must not alter the save'


def stacked_dialog_case(page):
    """Exercise the real stack module with isolated DOM, not a fake implementation."""
    code = subprocess.check_output(["node", "--input-type=module", "-e",
        "import {build} from 'esbuild'; const r=await build({entryPoints:['src/ui/dialogs.ts'],bundle:true,write:false,format:'iife',globalName:'R4Dialogs'}); process.stdout.write(r.outputFiles[0].text);"], cwd=ROOT, text=True)
    page.set_content("<div id='root' aria-hidden='false'><button id='trigger'>Abrir</button></div>")
    page.add_script_tag(content=code)
    page.evaluate("""() => {
      window.__r4Closed=[];
      document.querySelector('#trigger').focus();
      function open(id) {
        const layer=document.createElement('div');
        layer.innerHTML=`<section role="dialog" tabindex="-1" aria-label="${id}"><button>${id}-uno</button><button>${id}-dos</button></section>`;
        document.body.append(layer);
        const dialog=layer.firstElementChild;
        const dispose=R4Dialogs.mountDialog(layer,dialog,()=>{window.__r4Closed.push(id);dispose();layer.remove();});
        return {layer,dialog,dispose};
      }
      window.lower=open('inferior');
      window.upper=open('superior');
    }""")
    assert page.locator("#root").evaluate("e=>e.inert")
    assert page.evaluate("window.lower.layer.inert && !window.upper.layer.inert")
    for key in ["Tab", "Tab", "Shift+Tab", "Tab"]:
        page.keyboard.press(key)
        assert page.evaluate("window.upper.dialog.contains(document.activeElement)")
    page.keyboard.press("Escape")
    assert page.evaluate("window.__r4Closed") == ["superior"]
    assert page.evaluate("window.lower.dialog.contains(document.activeElement) && !window.lower.layer.inert")
    assert page.locator("#root").evaluate("e=>e.inert")
    page.keyboard.press("Escape")
    assert page.evaluate("window.__r4Closed") == ["superior", "inferior"]
    assert page.locator("#root").get_attribute("aria-hidden") == "false"
    assert page.locator("#root").evaluate("e=>!e.inert")
    assert page.locator("#trigger").evaluate("e=>e===document.activeElement")
    assert page.evaluate("!R4Dialogs.dialogOpen()")


def out_of_order_dialog_case(page):
    stacked_dialog_case(page)
    page.evaluate("""() => {
      const make=id=>{const layer=document.createElement('div');layer.innerHTML='<section tabindex="-1"><button>Acción</button></section>';document.body.append(layer);return {layer,dispose:R4Dialogs.mountDialog(layer,layer.firstElementChild,()=>{})};};
      window.lower=make('lower');window.upper=make('upper');
      window.lower.dispose();window.lower.layer.remove();
    }""")
    assert page.locator("#root").evaluate("e=>e.inert")
    assert page.evaluate("!window.upper.layer.inert && window.upper.layer.contains(document.activeElement)")
    page.evaluate("window.upper.dispose();window.upper.layer.remove()")
    assert page.locator("#root").evaluate("e=>!e.inert")
    assert page.locator("#root").get_attribute("aria-hidden") == "false"


def intro_case(page):
    assert page.locator('h1').inner_text().replace('\n', ' ').strip() == 'LA VIDA DEL BOXEO'
    page.evaluate('document.fonts.ready')
    page.wait_for_function("() => [...document.getAnimations()].every(a=>a.playState==='finished'||a.playState==='idle')")
    report=measure_detail(page)
    assert not report['failures'], report['failures']
    before=state(page)
    section=page.get_by_role('combobox', name='Sección de inicio', exact=True)
    if section.count():
        for value in ['coach','gimnasio','emblema','partidas','ayuda']:
            section.select_option(value)
            if value=='coach': page.get_by_role('textbox',name='Tu nombre de coach',exact=True).fill('Coach QA')
            if value=='gimnasio': page.get_by_role('textbox',name='Nombre de tu gimnasio',exact=True).fill('Club QA')
            if value=='emblema':
                emblem=page.get_by_role('combobox',name='Emblema del gimnasio',exact=True)
                assert emblem.locator('option').count()==6
                for option in emblem.locator('option').evaluate_all('es=>es.map(e=>e.value)'):
                    emblem.select_option(option)
                    report=measure_detail(page)
                    assert not report['failures'], report['failures']
            report=measure_detail(page)
            assert not report['failures'], (value,report['failures'])
        section.select_option('coach')
        assert page.get_by_role('textbox',name='Tu nombre de coach',exact=True).input_value()=='Coach QA'
        section.select_option('gimnasio')
        assert page.get_by_role('textbox',name='Nombre de tu gimnasio',exact=True).input_value()=='Club QA'
    page.screenshot(path=str(page.r4_open_capture))
    assert state(page)==before, 'Start-screen navigation changed the saved game'


def archive_case(page):
    def literal():
        parts=[]
        while True:
            parts.append(page.get_by_test_id('literal-text-page').evaluate("e=>[...e.childNodes].map(n=>window.__r4PseudoNodes?.get(n)===n.textContent ? window.__r4PseudoOriginals.get(n) : n.textContent).join('')"))
            report=measure_detail(page)
            assert not report['failures'], ('literal page', report['failures'])
            following=page.get_by_role('dialog').last.get_by_role('button', name=re.compile(r'^Siguiente(?:\s|$)'))
            if not following.count() or following.is_disabled(): break
            following.click()
        return ''.join(parts)
    before = state(page)
    nav = page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='plantel')
    else: page.locator('.app-nav').get_by_role('button', name='Plantel', exact=True).click()
    management=page.get_by_role('button', name='Plantel · Cupos y gestión', exact=True)
    if management.count(): management.click()
    trigger = page.get_by_role('button', name='Archivo de carreras', exact=True)
    trigger.click()
    dialog = page.get_by_role('dialog').filter(has=page.get_by_test_id('career-archive'))
    dialog.wait_for()
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    for index in range(len(before['archivoCarreras'])):
        dialog.get_by_role('combobox', name='Boxeador archivado', exact=True).select_option(str(index))
        for section in ['nombre', 'club', 'licencia', 'record', 'atributos', 'historial']:
            dialog.get_by_role('combobox', name='Sección del archivo', exact=True).select_option(section)
            if section == 'nombre':
                assert literal()==before['archivoCarreras'][index]['pugilista']['nombre']
            if section == 'atributos':
                attribute = dialog.get_by_role('combobox', name='Dato de la ficha histórica', exact=True)
                assert attribute.locator('option').count() == 14
                for value in attribute.locator('option').evaluate_all('es=>es.map(e=>e.value)'):
                    attribute.select_option(value)
                    report = measure_detail(page)
                    assert not report['failures'], (section, value, report['failures'])
            elif section == 'historial':
                history = dialog.get_by_role('combobox', name='Combate archivado', exact=True)
                assert history.locator('option').count() == 5
                for result in range(5):
                    history.select_option(str(result))
                    if result == 0: page.screenshot(path=str(page.r4_open_capture))
                    caption=dialog.locator('p[data-text-role="secondary"]')
                    assert caption.evaluate("e=>[...e.childNodes].map(n=>window.__r4PseudoNodes?.get(n)===n.textContent ? window.__r4PseudoOriginals.get(n) : n.textContent).join('')") == 'Registro histórico — texto original'
                    assert literal()==before['archivoCarreras'][index]['historial'][result]['resumen']
            report = measure_detail(page)
            assert not report['failures'], (section, report['failures'])
        dialog.get_by_role('combobox', name='Sección del archivo', exact=True).select_option('extras')
        assert json.loads(literal())=={'extensionDesconocida':{'fuente':'dato histórico intacto','valor':0}}
    assert state(page) == before, 'Read-only archive changed saved snapshots'
    page.keyboard.press('Escape')
    dialog.wait_for(state='detached')
    assert trigger.evaluate('e=>e===document.activeElement')


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-ready", action="store_true", required=True)
    parser.add_argument("--matrix", action="store_true", help="Settings and gym detail at all ten required sizes")
    parser.add_argument("--case", help="Run one representative acceptance case")
    parser.add_argument("--career", action="store_true", help="Long-name licensed boxer with zero energy and five historical results")
    parser.add_argument("--zoom", action="store_true", help="CSS viewport /1.25; DPR remains 1")
    parser.add_argument("--pseudo", action="store_true", help="Expand visible DOM text by 40%%, including portals; no coverage certification")
    parser.add_argument("--text-audit", action="store_true", help="Assert primary/secondary floors on visible dialog copy")
    parser.add_argument("--text-bounds", action="store_true", help="Assert actual visible text-range bounds too")
    args = parser.parse_args()
    started = time.perf_counter()
    captures=Path(tempfile.mkdtemp(prefix='r4-dialogs-'))
    dist = ROOT / "dist"
    fingerprint = {str(p.relative_to(dist)): hashlib.sha256(p.read_bytes()).hexdigest()
                   for p in dist.rglob("*") if p.is_file()}
    assert (dist / "index.html").exists()
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 5235))
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5235", "--bind", "127.0.0.1", "--directory", str(dist)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    report = {"origin": URL, "cases": [], "build": fingerprint, "captures": str(captures), "pseudo": args.pseudo, "zoom": "CSS /1.25; DPR=1" if args.zoom else "100%"}
    try:
        deadline = time.monotonic() + 5
        while True:
            try:
                urlopen(URL, timeout=.3).close()
                break
            except OSError:
                if time.monotonic() > deadline:
                    raise RuntimeError("Isolated server unavailable")
                time.sleep(.05)
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=["--enable-gpu", "--use-angle=d3d11"])
            report["gpu"] = browser.new_browser_cdp_session().send("SystemInfo.getInfo")["gpu"]
            callers = []
            for p in dist.rglob("*.js"):
                callers.extend(re.findall(r"(?:const|,)\s*([\w$]+)=\(\{children:[^}]*presenceAffectsLayout:", p.read_text(encoding="utf-8")))
            rng = "window.__qaPresenceCallers=" + json.dumps(callers) + ";" + DETERMINISTIC
            ctx = browser.new_context()
            ctx.add_init_script(rng)
            ctx.route("**/*", route_local)
            page = ctx.new_page()
            page.goto(URL, wait_until="networkidle")
            page.wait_for_function("localStorage.getItem('vida-del-boxeo-v2')!==null")
            base = state(page)
            ctx.close()
            report["dialog_source_sha256"] = hashlib.sha256((ROOT / "src/ui/dialogs.ts").read_bytes()).hexdigest()
            checks=[("selector-close-reopen-preserve", offers_case), ("selector-mobile-preserve", offers_case), ("dialog-focus-keyboard", focus_case),
                                ("nested-stack-focus-escape", stacked_dialog_case), ("out-of-order-unmount", out_of_order_dialog_case),
                                ('compact-contexts-preserve',context_case),('hiring-confirmation',hiring_case),('settings-mobile-bounds',settings_bounds_case),('toast-original-deadline',toast_deadline_case),('transfer-cancel',transfer_cancel_case),('archive',archive_case),('intro',intro_case),('management-switch',management_switch_case)]
            cases=[(name,check,None) for name,check in checks]
            if args.matrix:
                cases=[(f'{name}-{w}x{h}',check,(w,h)) for w,h in SIZES for name,check in [('settings',settings_bounds_case),('gym-detail',gym_drawer_case),('city-detail',city_detail_case),('boxer-detail',boxer_detail_case),('archive',archive_case),('intro',intro_case),('club-status',club_status_case)]]
            if args.case:
                cases=[case for case in cases if case[0]==args.case or (args.matrix and case[0].startswith(args.case+'-'))]
                assert cases, f'Unknown acceptance case: {args.case}'
            for name,check,size in cases:
                fixture = copy.deepcopy(base)
                fixture.update(creado=True, partidaId="r4-disposable", semana=8, semanaLibro=8, dia=2,
                               eventos=[], consejos=[], prensa=[], toasts=[], personal=[], pendientes=[],
                               ofertas=[], ofertasPara=None, combateActivo=None, resumen=None)
                if name.startswith('intro'): fixture.update(creado=False, nombreJugador='')
                if name.startswith('club-status'):
                    fixture.update(nombreGimnasio='Club de los Campeones de Nombres Extraordinariamente Largos',nombreJugador='María de los Ángeles Fernández de la Cruz',dinero=0,seguidores=0,fama=0)
                if name.startswith('archive'):
                    punches={'jab':{'lanzados':0,'conectados':0},'poder':{'lanzados':0,'conectados':0}}
                    fixture['archivoCarreras']=[]
                    for index in range(2):
                        boxer=copy.deepcopy(fixture['plantel'][0])
                        boxer.update(id=f'archived-{index}',nombre='Nombre histórico muy extenso '*6,rol='boxeador',licenciaFederativa=True,energia=0)
                        boxer['atrib']['extensionDesconocida']={'fuente':'dato histórico intacto', 'valor':0}
                        results=[{'miId':boxer['id'],'rivalNombre':f'Rival histórico {i}','gane':False,'empate':True,'metodo':'Empate','tarjetas':[],'caidasA':0,'caidasB':0,'registroA':punches,'registroB':punches,'bolsa':0,'fama':0,'tituloGanado':0,'resumen':'Historia desconocida 🥊 que conserva todos sus datos. '*6} for i in range(5)]
                        fixture['archivoCarreras'].append({'id':f'archive-{index}','pugilista':boxer,'club':'Club histórico '*12,'semanaSalida':7,'motivo':'Transferencia','historial':results})
                if args.career:
                    own=fixture['plantel'][0]
                    own.update(nombre='María de los Ángeles Fernández de la Cruz ' * 3,rol='boxeador',licenciaFederativa=True,circuito='amateur',energia=0,peleasAmateur=50,record={'v':35,'d':10,'e':5,'ko':12})
                    punches={'jab':{'lanzados':0,'conectados':0},'poder':{'lanzados':0,'conectados':0}}
                    fixture['historial']=[{'miId':own['id'],'rivalNombre':'Rival histórico con nombre extenso '+str(i),'gane':False,'empate':True,'metodo':'Empate','tarjetas':[],'caidasA':0,'caidasB':0,'registroA':punches,'registroB':punches,'bolsa':0,'fama':0,'tituloGanado':0,'resumen':'Registro histórico desconocido que debe conservarse literalmente. '*3} for i in range(5)]
                if name=='management-switch':
                    fixture['plantel'][1].update(rol='boxeador',licenciaFederativa=True,circuito='amateur',peleasAmateur=0)
                if name.startswith("selector") or name=='transfer-cancel':
                    own = fixture["plantel"][0]
                    own.update(rol="boxeador", licenciaFederativa=True, circuito="amateur", energia=100)
                    rival = copy.deepcopy(own)
                    rival.update(id="r4-rival", nombre="Rival Fixture")
                    fixture["ofertasPara"] = own["id"]
                    fixture["ofertas"] = [{"id":"r4-offer", "nivel":"parejo", "rival":rival,"bolsa":100,"esTitulo":0,"etiqueta":"Oferta sintética", "detalle":"Fixture válido"}]
                mobile=name in ['selector-mobile-preserve','settings-mobile-bounds','intro']
                w,h=size or ((390,667) if mobile else (1280,720))
                ctx = browser.new_context(viewport={"width":round(w/1.25) if args.zoom else w,"height":round(h/1.25) if args.zoom else h},device_scale_factor=1,has_touch=w<=844)
                ctx.add_init_script(rng)
                ctx.add_init_script('window.__r4Pseudo='+str(args.pseudo).lower()+';')
                ctx.add_init_script('window.__r4TextAudit='+str(args.text_audit or args.text_bounds).lower()+';window.__r4TextBounds='+str(args.text_bounds).lower()+';')
                ctx.add_init_script("if(!localStorage.getItem('r4-seeded')){localStorage.setItem(" + json.dumps(KEY) + "," + json.dumps(json.dumps(fixture)) + ");localStorage.setItem('r4-seeded','yes');}")
                ctx.route("**/*", route_local)
                page = ctx.new_page()
                page.r4_open_capture = captures/(name+'-open.png')
                page.set_default_timeout(5000)
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                result = {"case":name}
                try:
                    page.goto(URL, wait_until="networkidle")
                    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state!==undefined")
                    if name.startswith('archive'):
                        assert state(page)['archivoCarreras']==fixture['archivoCarreras'], 'Archived fixture changed during load'
                    if args.career:
                        loaded=state(page)
                        assert loaded['plantel'][0]['nombre']==fixture['plantel'][0]['nombre']
                        assert loaded['plantel'][0]['energia']==0
                        assert loaded['historial']==fixture['historial'], 'Synthetic history fixture was repaired instead of exercised'
                    check(page)
                    assert not errors, errors
                    result["status"] = "PASS"
                    if page.r4_open_capture.exists(): result['open_capture']=str(page.r4_open_capture)
                except Exception:
                    result.update(status="FAIL", error=traceback.format_exc())
                if result['status']=='FAIL' or size in [(1280,720),(390,844)]:
                    path=captures/(name+'.png')
                    page.screenshot(path=str(path));result['capture']=str(path)
                report["cases"].append(result)
                ctx.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)
    current = {str(p.relative_to(dist)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob("*") if p.is_file()}
    report["build_unchanged"] = current == fingerprint
    report["elapsed_seconds"] = round(time.perf_counter()-started, 3)
    report["status"] = "PASS" if current==fingerprint and all(c["status"]=="PASS" for c in report["cases"]) else "FAIL"
    print(json.dumps(report, ensure_ascii=False), flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(run())
