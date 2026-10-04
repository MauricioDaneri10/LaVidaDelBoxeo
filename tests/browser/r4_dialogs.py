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
        if station.locator('option[value="club"]').count():
            station.select_option(value='club')
            wall=page.get_by_role('dialog',name='Pared del club',exact=True)
            wall.wait_for()
            page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
            report=measure_detail(page)
            assert not report['failures'], ('wall',report['failures'],page.locator('.gym-wall-detail .gym-marquee').evaluate('e=>({parent:e.parentElement.className,rect:e.getBoundingClientRect().toJSON(),translate:getComputedStyle(e).translate,transform:getComputedStyle(e).transform,left:getComputedStyle(e).left,width:getComputedStyle(e).width})'))
            assert page.locator('.gym-wall-detail .gym-marquee').is_visible()
            assert page.locator('.gym-wall-detail .gym-poster').is_visible()
            assert page.evaluate("() => {const a=document.querySelector('.gym-wall-detail .gym-marquee').getBoundingClientRect(), b=document.querySelector('.gym-wall-detail .gym-poster').getBoundingClientRect();return a.left>=b.right || b.left>=a.right || a.top>=b.bottom || b.top>=a.bottom;}"), 'Poster and marquee occupy overlapping rectangles'
            page.screenshot(path=str(page.r4_open_capture.with_name(page.r4_open_capture.stem+'-wall.png')))
            page.keyboard.press('Escape')
            wall.wait_for(state='detached')
            assert station.evaluate('e=>e===document.activeElement')
        for value in ['1','2','3','4','5']:
            station.select_option(value=value)
            page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            report=measure_detail(page)
            assert not report['failures'], ('station',value,report['failures'])
            assert page.evaluate("() => {const wall=document.querySelector('.gym-scene > .absolute .gym-marquee');return !wall || ![...document.querySelectorAll('.gym-stations .gym-figure')].filter(e=>e.getClientRects().length).some(e=>{const a=wall.getBoundingClientRect(),b=e.getBoundingClientRect();return a.left<b.right && b.left<a.right && a.top<b.bottom && b.top<a.bottom;});}"), 'Marquee occludes a visible boxer'
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
    picker=page.locator('.roster-filters select')
    if picker.locator('option[value="vista:rendimiento"]').count():
        picker.select_option(value='grupo:federados')
        picker.select_option(value='vista:rendimiento')
    native=[]
    page.on('dialog',lambda dialog: (native.append(dialog.type),dialog.dismiss()))
    trigger=page.get_by_role('button',name='Transferir',exact=True).first
    trigger.click()
    assert not native, 'Transfer uses a native dialog outside the accessible layer stack'
    dialog=page.get_by_role('dialog',name='Transferir fuera del club')
    dialog.wait_for()
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    literal=complete_literal(page)
    assert before['plantel'][0]['nombre'] in literal and 'histórica' in literal
    report=measure_detail(page)
    assert not report['failures'], report['failures']
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
    else:
        compact=page.locator('.roster-filters select')
        if compact.locator('option[value="gestion:abrir"]').count(): compact.select_option(value='gestion:abrir')
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


def go_tab(page, value, label):
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value=value)
    else: page.locator('.app-nav').get_by_role('button',name=label,exact=True).click()


def complete_literal(page, scope=None):
    parts=[]
    while True:
        report=measure_detail(page)
        assert not report['failures'], report['failures']
        literal=(scope if scope is not None else page).get_by_test_id('literal-text-page')
        parts.append(literal.evaluate("e=>[...e.childNodes].map(n=>window.__r4PseudoNodes?.get(n)===n.textContent ? window.__r4PseudoOriginals.get(n) : n.textContent).join('')"))
        following=literal.locator('..').get_by_role('button',name=re.compile(r'^Siguiente(?:\s|$)'))
        if not following.count() or following.is_disabled(): break
        following.click()
    return ''.join(parts)


def roster_views_case(page):
    go_tab(page,'plantel','Plantel')
    before=state(page)
    picker=page.locator('.roster-filters select').first
    if not picker.locator('option[value="vista:nombre"]').count():
        assert not measure_detail(page)['failures']
        return
    seen=set()
    while True:
        picker.select_option(value='vista:nombre')
        report=measure_detail(page)
        assert not report['failures'], ('name',report['failures'])
        card=page.locator('.plantel-grid article')
        width=page.locator('.plantel-grid').bounding_box()['width']
        required=min(len(before['plantel'])-len(seen),5,max(1,int((width+8)/308)))
        assert card.count()>=required, 'Readable first-row capacity must not be wasted'
        for i in range(card.count()):
            trigger=card.nth(i).locator('button[aria-label^="Abrir ficha técnica de"]')
            seen.add(trigger.get_attribute('aria-label').removeprefix('Abrir ficha técnica de '))
        for view in ['identidad','estado','rendimiento']:
            picker.select_option(value='vista:'+view)
            if view!='rendimiento':
                for i in range(card.count()): assert complete_literal(page,card.nth(i))
            else: assert not measure_detail(page)['failures']
        page.screenshot(path=str(page.r4_open_capture))
        nxt=page.locator('.roster-pagination').get_by_role('button',name=re.compile(r'^Siguiente(?:\s|$)'))
        if not nxt.count() or nxt.is_disabled(): break
        nxt.click()
    assert seen=={p['nombre'] for p in before['plantel'] if not p.get('enEspera')}
    assert state(page)==before, 'Changing presentation altered career data'


def courses_case(page):
    go_tab(page,'perfil','Mi Perfil')
    before=state(page)
    branch=page.get_by_role('combobox',name='Rama de cursos',exact=True)
    for value,label in [('deportiva','Deportiva'),('promotora','Promotora'),('empresarial','Empresarial')]:
        if branch.count(): branch.select_option(value=value)
        else: page.locator('.profile-branches').get_by_role('button',name=re.compile('^'+label+r'(?:\s|$)')).click()
        for index in range(3):
            assert not measure_detail(page)['failures']
            detail=page.get_by_role('button',name=re.compile(r'^Ver curso(?:\s|$)'))
            if not detail.count(): break
            detail.click()
            dialog=page.get_by_role('dialog').last
            page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
            assert complete_literal(page)
            page.screenshot(path=str(page.r4_open_capture))
            page.keyboard.press('Escape')
            dialog.wait_for(state='detached')
            assert detail.evaluate('e=>e===document.activeElement')
            nxt=page.locator('.profile-pagination').get_by_role('button',name=re.compile(r'^Siguiente(?:\s|$)'))
            if nxt.is_disabled(): break
            nxt.click()
    assert state(page)==before, 'Reading a course changed money or progress'


def calendar_future_case(page):
    go_tab(page,'calendario','Calendario')
    before=state(page)
    assert before['dia']==6 and before['pendientes'][0]['semanaProgramada']==9
    view=page.get_by_role('combobox',name='Vista del calendario',exact=True)
    view.select_option(value='resumen')
    assert 'Próximo paso: Guanteos del sábado' in complete_literal(page)
    view.select_option(value='agenda')
    literal=complete_literal(page)
    assert 'Semana 9' in literal and 'Rival Fixture' in literal and '$100' in literal
    assert state(page)==before, 'Reading a future contract altered its dates or payment'


def calendar_views_case(page):
    go_tab(page,'calendario','Calendario')
    before=state(page)
    assert len(before['eventos'])==3, 'Synthetic events must survive loading exactly'
    view=page.get_by_role('combobox',name='Vista del calendario',exact=True)
    for value in ['semana','resumen','agenda']:
        view.select_option(value=value)
        if value=='resumen': assert 'Próximo paso' in complete_literal(page)
        elif value=='semana':
            days=page.get_by_role('combobox',name='Día de la semana',exact=True)
            for day in range(1,8):
                if days.count(): days.select_option(value=str(day))
                assert not measure_detail(page)['failures']
        else:
            activity=page.get_by_role('combobox',name='Actividad de la agenda',exact=True)
            for event in before['eventos']:
                activity.select_option(value='evento:'+event['id'])
                literal=complete_literal(page)
                assert event['titulo'] in literal and event['texto'] in literal
                view.select_option(value='decision')
                response=page.get_by_role('combobox',name='Respuesta al evento',exact=True)
                for index,choice in enumerate(event['opciones']):
                    response.select_option(value=str(index))
                    assert complete_literal(page)==choice['texto']
                page.screenshot(path=str(page.r4_open_capture))
                view.select_option(value='agenda')
    assert state(page)==before, 'Reviewing calendar choices altered events, money or dates'


def event_response_case(page):
    go_tab(page,'calendario','Calendario')
    before=state(page)
    view=page.get_by_role('combobox',name='Vista del calendario',exact=True)
    view.select_option(value='agenda')
    page.get_by_role('combobox',name='Actividad de la agenda',exact=True).select_option(value='evento:r4-response')
    view.select_option(value='decision')
    response=page.get_by_role('combobox',name='Respuesta al evento',exact=True)
    response.select_option(value='0')
    page.get_by_role('button',name='Confirmar respuesta',exact=True).click()
    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.toasts.some(t=>t.texto.includes('para reparar'))")
    after=state(page)
    assert after['eventos']==before['eventos'] and after['dinero']==0
    assert response.is_visible(), 'Rejected response dismissed the decision instead of retaining it'
    assert view.input_value()=='decision'
    assert not measure_detail(page)['failures']
    response.select_option(value='1')
    page.get_by_role('button',name=re.compile(r'^Confirmar respuesta(?:\s|$)')).click()
    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.eventos.length===0")
    page.wait_for_function("document.querySelector('select[aria-label=\"Vista del calendario\"]').value==='agenda'")
    assert view.input_value()=='agenda', 'Successful response did not dismiss the completed decision'
    assert state(page)['dinero']==0 and state(page)['libroIngresos']==before['libroIngresos'] and state(page)['libroGastos']==before['libroGastos']


def event_panel_case(page):
    before=state(page)
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-club')
    channel=page.get_by_role('combobox',name='Canal del panel del club',exact=True)
    for value in ['mensajes','patrocinios']:
        channel.select_option(value=value)
        notices=[e for e in before['eventos'] if (e['tipo']=='patrocinio')==(value=='patrocinios')]
        picker=page.get_by_role('combobox',name='Aviso del panel',exact=True)
        for event in notices:
            picker.select_option(value=event['id'])
            trigger=page.get_by_role('button',name=re.compile(r'^Leer y gestionar aviso(?:\s|$)'))
            previous_layers=page.get_by_role('dialog').count()
            trigger.click()
            dialog=page.get_by_role('dialog',name=re.compile(r'^Detalle de aviso(?:\s|$)'))
            page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
            literal=complete_literal(page)
            assert event['titulo'] in literal and event['texto'] in literal
            dialog.get_by_role('combobox',name='Sección del aviso',exact=True).select_option(value='respuesta')
            response=dialog.get_by_role('combobox',name='Respuesta al evento',exact=True)
            for index,choice in enumerate(event['opciones']):
                response.select_option(value=str(index))
                assert complete_literal(page)==choice['texto']
            assert state(page)==before, 'Reading event details changed the saved game'
            page.keyboard.press('Escape')
            dialog.wait_for(state='detached')
            assert page.get_by_role('dialog').count()==previous_layers, 'Escape closed another dialog layer'
            assert trigger.evaluate('e=>e===document.activeElement'), 'Event details lost their trigger focus'
        assert not measure_detail(page)['failures']
    if nav.count():
        page.keyboard.press('Escape')
        page.get_by_role('dialog').wait_for(state='detached')
        assert nav.evaluate('e=>e===document.activeElement')
    assert state(page)==before


def press_panel_case(page):
    before=state(page)
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-club')
    page.get_by_role('combobox',name='Canal del panel del club',exact=True).select_option(value='prensa')
    picker=page.get_by_role('combobox',name='Noticia del panel',exact=True)
    assert picker.locator('option').count()==len(before['prensa']), 'News omitted from selector'
    for note in before['prensa']:
        picker.select_option(value=note['id'])
        trigger=page.get_by_role('button',name=re.compile(r'^Leer noticia(?:\s|$)'))
        trigger.click()
        dialog=page.get_by_role('dialog',name=re.compile(r'^Noticias del Ring(?:\s|$)'))
        page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
        assert complete_literal(page,dialog)==f"Semana {note['semana']}\n{note['texto']}", 'News text or week changed'
        page.keyboard.press('Escape')
        dialog.wait_for(state='detached')
        assert trigger.evaluate('e=>e===document.activeElement'), 'News lost trigger focus'
    assert not measure_detail(page)['failures']
    assert state(page)==before, 'Reading press rewrote history or game state'


def advice_panel_case(page):
    before=state(page)
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-club')
    page.get_by_role('combobox',name='Canal del panel del club',exact=True).select_option(value='consejos')
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    sections=page.get_by_role('combobox',name='Sección de consejos',exact=True)
    for section in ['hitos','historial','orientacion','finanzas']:
        sections.select_option(value=section)
        assert not measure_detail(page)['failures'], (section,measure_detail(page)['failures'])
        if section in ['hitos','historial']:
            records=[c for c in before['consejos'] if bool(c.get('archivado') or c['reclamado'])==(section=='historial')]
            picker=page.get_by_role('combobox',name='Hito del club',exact=True)
            assert picker.locator('option').count()==len(records)
            for record in records:
                picker.select_option(value=record['id'])
                trigger=page.get_by_role('button',name=re.compile(r'^Ver hito(?:\s|$)'))
                trigger.click()
                dialog=page.get_by_role('dialog',name=re.compile(r'^Detalle del hito(?:\s|$)'))
                page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
                dialog.get_by_role('combobox',name='Detalle del consejo',exact=True).select_option(value='texto')
                assert complete_literal(page,dialog)==record['texto']
                dialog.get_by_role('combobox',name='Detalle del consejo',exact=True).select_option(value='recompensa')
                reward=complete_literal(page,dialog)
                assert str(record['fama']) in reward
                if record.get('archivado'):
                    assert 'Archivado' in reward and 'sin cobro' in reward
                    assert record['motivoArchivo'] in reward
                if record['reclamado']: assert 'Cobrado' in reward
                page.keyboard.press('Escape')
                dialog.wait_for(state='detached')
                assert trigger.evaluate('e=>e===document.activeElement')
        else:
            page.get_by_role('button',name=re.compile(r'^Leer detalle(?:\s|$)')).click()
            dialog=page.get_by_role('dialog',name=re.compile(r'^Don Anselmo(?:\s|$)'))
            page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
            detail=complete_literal(page,dialog)
            if section=='finanzas':
                assert '$500' in detail and '$600' in detail and '$60' in detail and '10 cuotas' in detail
            page.keyboard.press('Escape')
            dialog.wait_for(state='detached')
    assert state(page)==before, 'Browsing advice paid a reward or changed the save'


def sponsor_panel_case(page):
    before=state(page)
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-club')
    page.get_by_role('combobox',name='Canal del panel del club',exact=True).select_option(value='patrocinios')
    trigger=page.get_by_role('button',name='Contrato activo · Leer detalle',exact=True)
    trigger.click()
    dialog=page.get_by_role('dialog',name=re.compile(r'^Contrato de patrocinio(?:\s|$)'))
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    details=complete_literal(page,dialog)
    assert before['patrocinio']['nombre'] in details
    assert '$200' in details and '10' in details and 'domingo' in details
    page.keyboard.press('Escape')
    dialog.wait_for(state='detached')
    assert trigger.evaluate('e=>e===document.activeElement')
    assert not measure_detail(page)['failures']
    assert state(page)==before, 'Reading sponsorship changed the contract'


def advice_payment_case(page):
    before=state(page)
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-club')
    page.get_by_role('combobox',name='Canal del panel del club',exact=True).select_option(value='consejos')
    page.get_by_role('combobox',name='Hito del club',exact=True).select_option(value='c9')
    page.get_by_role('button',name='Ver hito',exact=True).click()
    dialog=page.get_by_role('dialog',name='Detalle del hito',exact=True)
    assert dialog.get_by_role('button',name='Cobrar',exact=True).count()==0, 'Claim offered before displaying reward'
    dialog.get_by_role('combobox',name='Detalle del consejo',exact=True).select_option(value='recompensa')
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    assert complete_literal(page,dialog)=='Recompensa: +2 fama · $80\nListo para cobrar'
    assert state(page)==before
    dialog.get_by_role('button',name='Cobrar',exact=True).click()
    dialog.wait_for(state='detached')
    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.consejos.find(c=>c.id==='c9').reclamado")
    after=state(page)
    assert after['dinero']==before['dinero']+80 and after['fama']==before['fama']+2
    assert after['libroIngresos']==before['libroIngresos']+[{'concepto':'Recompensa · '+before['consejos'][0]['texto'],'monto':80}]
    page.reload(wait_until='networkidle')
    assert state(page)['consejos']==after['consejos'] and state(page)['dinero']==after['dinero']
    if nav.count(): nav.select_option(value='contexto-club')
    page.get_by_role('combobox',name='Canal del panel del club',exact=True).select_option(value='consejos')
    page.get_by_role('combobox',name='Sección de consejos',exact=True).select_option(value='historial')
    page.get_by_role('combobox',name='Hito del club',exact=True).select_option(value='c9')
    page.get_by_role('button',name='Ver hito',exact=True).click()
    assert page.get_by_role('dialog',name='Detalle del hito',exact=True).get_by_role('button',name='Cobrar',exact=True).count()==0
    page.keyboard.press('Escape')
    assert state(page)['dinero']==after['dinero'] and state(page)['fama']==after['fama']


def expired_event_case(page):
    before=state(page)
    rng=page.evaluate('window.__qaRandom')
    go_tab(page,'calendario','Calendario')
    page.get_by_role('combobox',name='Vista del calendario',exact=True).select_option(value='agenda')
    page.get_by_role('combobox',name='Actividad de la agenda',exact=True).select_option(value='evento:r4-expired')
    view=page.get_by_role('combobox',name='Vista del calendario',exact=True)
    view.select_option(value='decision')
    page.get_by_role('combobox',name='Sección del aviso',exact=True).select_option(value='respuesta')
    assert page.get_by_role('button',name='Confirmar respuesta',exact=True).is_disabled(), 'Expired notice still offers an executable response'
    page.get_by_role('combobox',name='Sección del aviso',exact=True).select_option(value='texto')
    detail=complete_literal(page)
    assert 'Este evento ya venció.' in detail and before['eventos'][0]['texto'] in detail
    assert state(page)==before and page.evaluate('window.__qaRandom')==rng


def calendar_identity_case(page):
    before=state(page)
    go_tab(page,'calendario','Calendario')
    page.get_by_role('combobox',name='Vista del calendario',exact=True).select_option(value='agenda')
    picker=page.get_by_role('combobox',name='Actividad de la agenda',exact=True)
    values=picker.locator('option').evaluate_all('es=>es.map(e=>e.value)')
    assert len(values)==4 and len(set(values))==4, 'Calendar presentation IDs collide across entity types'
    for event in before['eventos']:
        picker.select_option(value='evento:'+event['id'])
        assert event['texto'] in complete_literal(page)
    assert state(page)==before, 'Presentation ID disambiguation changed persisted identities'


def run():
    global URL
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-ready", action="store_true", required=True)
    parser.add_argument("--port", type=int, default=5235, help="Isolated ephemeral test origin; never use the owner's port")
    parser.add_argument("--matrix", action="store_true", help="Settings and gym detail at all ten required sizes")
    parser.add_argument("--case", help="Run one representative acceptance case")
    parser.add_argument("--career", action="store_true", help="Long-name licensed boxer with zero energy and five historical results")
    parser.add_argument("--zoom", action="store_true", help="CSS viewport /1.25; DPR remains 1")
    parser.add_argument("--pseudo", action="store_true", help="Expand visible DOM text by 40%%, including portals; no coverage certification")
    parser.add_argument("--text-audit", action="store_true", help="Assert primary/secondary floors on visible dialog copy")
    parser.add_argument("--text-bounds", action="store_true", help="Assert actual visible text-range bounds too")
    args = parser.parse_args()
    assert args.port != 3000 and 1024 <= args.port <= 65535
    URL=f"http://127.0.0.1:{args.port}/"
    started = time.perf_counter()
    captures=Path(tempfile.mkdtemp(prefix='r4-dialogs-'))
    dist = ROOT / "dist"
    fingerprint = {str(p.relative_to(dist)): hashlib.sha256(p.read_bytes()).hexdigest()
                   for p in dist.rglob("*") if p.is_file()}
    assert (dist / "index.html").exists()
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", args.port))
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(args.port), "--bind", "127.0.0.1", "--directory", str(dist)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
                                ('compact-contexts-preserve',context_case),('hiring-confirmation',hiring_case),('settings-mobile-bounds',settings_bounds_case),('toast-original-deadline',toast_deadline_case),('transfer-cancel',transfer_cancel_case),('archive',archive_case),('intro',intro_case),('management-switch',management_switch_case),('roster-views',roster_views_case),('courses',courses_case),('calendar-views',calendar_views_case)]
            cases=[(name,check,None) for name,check in checks]
            cases.append(('event-response',event_response_case,(390,667)))
            cases.append(('event-panel',event_panel_case,(390,667)))
            cases.append(('calendar-identity',calendar_identity_case,(390,667)))
            cases.append(('calendar-future',calendar_future_case,(390,667)))
            cases.append(('press-panel',press_panel_case,(390,667)))
            cases.append(('advice-panel',advice_panel_case,(390,667)))
            cases.append(('sponsor-panel',sponsor_panel_case,(390,667)))
            cases.append(('advice-payment',advice_payment_case,(390,667)))
            cases.append(('event-expired',expired_event_case,(390,667)))
            if args.matrix:
                cases=[(f'{name}-{w}x{h}',check,(w,h)) for w,h in SIZES for name,check in [('settings',settings_bounds_case),('gym-detail',gym_drawer_case),('city-detail',city_detail_case),('boxer-detail',boxer_detail_case),('archive',archive_case),('intro',intro_case),('club-status',club_status_case),('roster-views',roster_views_case),('courses',courses_case),('calendar-views',calendar_views_case),('event-panel',event_panel_case),('transfer-cancel',transfer_cancel_case),('press-panel',press_panel_case),('advice-panel',advice_panel_case),('sponsor-panel',sponsor_panel_case),('advice-payment',advice_payment_case),('event-expired',expired_event_case)]]
            if args.case:
                if args.matrix and args.case in ['press-panel','advice-panel','sponsor-panel']:
                    check={'press-panel':press_panel_case,'advice-panel':advice_panel_case,'sponsor-panel':sponsor_panel_case}[args.case]
                    cases=[(f'{args.case}-{w}x{h}',check,(w,h)) for w,h in SIZES]
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
                if name.startswith('gym-detail'):
                    fixture['nombreGimnasio']='Club de los Campeones de Nombres Extraordinariamente Largos'
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
                if name.startswith('calendar-views'):
                    fixture['eventos']=[{'id':f'r4-event-{i}','tipo':'mantenimiento','de':'Comisión del club','titulo':'Aviso con identidad extensa '+str(i),'texto':'Descripción completa que debe poder leerse sin cortar ni resolver el evento. '*2,'venceEn':i+1,'opciones':[{'texto':'Respuesta que necesita explicación completa '+str(j),'accion':{'tipo':'nada'}} for j in range(3)]} for i in range(3)]
                if name=='event-response':
                    fixture.update(dinero=0,eventos=[{'id':'r4-response','tipo':'mantenimiento','de':'Comisión del club','titulo':'Reparación pendiente','texto':'El jugador debe poder volver a elegir después de un rechazo.','venceEn':3,'opciones':[{'texto':'Reparar por $100','accion':{'tipo':'mantenimiento','costo':100}},{'texto':'Conservar el dinero','accion':{'tipo':'nada'}}]}])
                if name.startswith('event-panel'):
                    fixture['eventos']=[{'id':f'r4-panel-{i}','tipo':'patrocinio' if i==2 else 'mantenimiento','de':'Comisión del club','titulo':'Aviso histórico con identidad extensa '+str(i),'texto':'Descripción conservada que debe poder leerse entera en todos los tamaños. '*2,'venceEn':3,'opciones':[{'texto':'Respuesta con detalle literal completo '+str(j),'accion':{'tipo':'nada'}} for j in range(2)]} for i in range(3)]
                if name.startswith('press-panel'):
                    fixture['prensa']=[{'id':f'r4-news-{i}','semana':i+1,'texto':f'Noticia histórica {i}: '+('Texto desconocido conservado sin traducir ni inventar identidad. '*2)} for i in range(3)]
                if name.startswith('advice-panel'):
                    fixture.update(dinero=0,consejos=[{'id':'c1','texto':'Objetivo histórico con texto literal extenso. '*3,'fama':2,'cumplido':False,'reclamado':False},{'id':'c2','texto':'Registro ya cobrado que debe conservarse. '*3,'fama':2,'cumplido':True,'reclamado':True},{'id':'c11','texto':'Duplicado archivado sin inventar un cobro. '*3,'fama':1,'cumplido':False,'reclamado':False,'archivado':True,'motivoArchivo':'Razón histórica literal con todos sus parámetros intactos. '*2}])
                if name.startswith('sponsor-panel'):
                    fixture['patrocinio']={'nombre':'Patrocinador histórico con nombre extenso '*5,'semanal':200,'semanas':10}
                if name.startswith('advice-payment'):
                    fixture.update(dinero=0,seguidores=1500,fama=10,libroIngresos=[],consejos=[{'id':'c9','texto':'Llegá a 1.500 seguidores y hacé conocido el nombre del gimnasio.','fama':2,'dinero':80,'cumplido':True,'reclamado':False}])
                if name.startswith('event-expired'):
                    fixture['eventos']=[{'id':'r4-expired','tipo':'mantenimiento','de':'Comisión del club','titulo':'Aviso vencido','texto':'Registro original vencido que no debe eliminarse al consultarlo.','venceEn':0,'opciones':[{'texto':'Conservar','accion':{'tipo':'nada'}}]}]
                if name=='calendar-identity':
                    fixture.update(veladaProgramada=True,comunitarios=[{'tipo':'bingo','nombre':'Bingo ya pactado'}],eventos=[{'id':ident,'tipo':'mantenimiento','de':'Comisión','titulo':'Identidad histórica '+ident,'texto':'Aviso original '+ident,'venceEn':3,'opciones':[{'texto':'Conservar','accion':{'tipo':'nada'}}]} for ident in ['velada','social-0']])
                if name.startswith("selector") or name.startswith('transfer-cancel') or name.startswith('calendar-future'):
                    own = fixture["plantel"][0]
                    own.update(rol="boxeador", licenciaFederativa=True, circuito="amateur", energia=100)
                    rival = copy.deepcopy(own)
                    rival.update(id="r4-rival", nombre="Rival Fixture")
                    fixture["ofertasPara"] = own["id"]
                    fixture["ofertas"] = [{"id":"r4-offer", "nivel":"parejo", "rival":rival,"bolsa":100,"esTitulo":0,"etiqueta":"Oferta sintética", "detalle":"Fixture válido"}]
                    if name.startswith('calendar-future'):
                        fixture.update(dia=6,ofertas=[],ofertasPara=None,pendientes=[{'id':'r4-future','miId':own['id'],'rival':rival,'bolsa':100,'esTitulo':0,'velada':False,'semanaProgramada':9,'diaProgramado':6}])
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
                        assert loaded['plantel'][0]['energia']==fixture['plantel'][0]['energia'], 'Energy changed from the exact installed fixture'
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
