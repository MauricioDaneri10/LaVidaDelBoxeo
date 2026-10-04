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


def selector_action_case(page):
    before=state(page)
    rng=page.evaluate('window.__qaRandom')
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-ofertas')
    else: page.get_by_role('button',name='Ver ofertas pendientes',exact=True).click()
    dialog=page.get_by_role('dialog');dialog.wait_for()
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    measured=measure_detail(page)
    assert not measured['failures'], measured['failures']
    sign=dialog.get_by_role('button',name=re.compile(r'^Firmar pelea(?:\s|$)'))
    if page.r4_case.startswith('selector-regenerate'):
        assert sign.is_disabled(), 'Incoherent old offer must not be signable'
        assert state(page)==before and page.evaluate('window.__qaRandom')==rng
        dialog.get_by_role('button',name=re.compile(r'^Volver a buscar rival(?:\s|$)')).click()
        page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.ofertas.every(o=>o.id!=='r4-offer')")
        after=state(page)
        assert len(after['ofertas'])==3 and len({o['id'] for o in after['ofertas']})==3
        assert after['ofertasPara']==before['ofertasPara'] and after['dinero']==before['dinero']
        assert after['pendientes']==before['pendientes'] and after['historial']==before['historial'] and after['stats']==before['stats']
        assert page.evaluate('window.__qaRandom')!=rng, 'Explicit regeneration must generate rivals'
        assert sign.is_enabled(), 'Generated ordinary offer must be signable'
        regenerated=after['ofertas']
        page.keyboard.press('Escape');dialog.wait_for(state='detached')
        page.reload(wait_until='networkidle')
        assert state(page)['ofertas']==regenerated
        assert page.evaluate('window.__qaRandom')==rng, 'Reload consumed game RNG instead of preserving generated offers'
    else:
        assert sign.is_enabled()
        offer=before['ofertas'][0]
        sign.click();dialog.wait_for(state='detached')
        after=state(page)
        assert after['ofertas']==[] and after['ofertasPara'] is None
        assert len(after['pendientes'])==1
        contract=after['pendientes'][0]
        assert contract['miId']==before['ofertasPara'] and contract['rival']==offer['rival'] and contract['bolsa']==200
        assert after['dinero']==before['dinero'] and after['historial']==before['historial'] and after['stats']==before['stats']
        page.reload(wait_until='networkidle')
        assert state(page)['pendientes']==after['pendientes'], 'Reload rerolled or duplicated a signed fight'
        assert page.get_by_role('dialog').count()==0


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
    def request_hire():
        hire=page.get_by_role('button',name=re.compile(r'^Contratar(?:\s|$)')).first
        if not hire.count():
            page.locator('.staff-card').first.get_by_role('button',name=re.compile(r'^Ver detalle(?:\s|$)')).click()
        page.get_by_role('button',name=re.compile(r'^Contratar(?:\s|$)')).first.click()
    request_hire()
    dialog=page.get_by_role('dialog',name=re.compile(r'^Revisar costo de contratación(?:\s|$)'))
    dialog.wait_for()
    assert state(page)==before, 'Opening financial confirmation hired someone'
    assert dialog.evaluate('e=>e.contains(document.activeElement)')
    page.keyboard.press('Escape')
    dialog.wait_for(state='detached')
    assert state(page)==before, 'Cancelling confirmation mutated game'
    request_hire()
    dialog.get_by_role('button',name=re.compile(r'^Contratar igualmente(?:\s|$)')).click()
    dialog.wait_for(state='detached')
    if page.get_by_role('dialog').count(): page.keyboard.press('Escape')
    page.get_by_text(re.compile(r'^Contratado · 1(?:\s|$)')).wait_for()
    assert len(state(page)['personal'])==1
    assert state(page)['personal'][0]['tipo']=='directorTecnico'


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
            assert page.locator('.gym-stations > div').evaluate_all("(es, value)=>{const host=es[0].parentElement,start=Number(host.dataset.start),end=Number(host.dataset.end);return es.every((e,i)=>Boolean(e.getClientRects().length)===(i+1>=start&&i+1<=end)) && start<=Number(value)&&end>=Number(value);}",value), 'Station range hides an available station or reveals one outside the page'
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
                    if page.get_by_test_id('literal-text-page').count():
                        copy=complete_literal(page,page.get_by_role('dialog'))
                        assert before['historial'][index]['resumen'] in copy and before['historial'][index]['metodo'] in copy
                        assert before['historial'][index]['rivalNombre'] in copy
                        assert 'Registro histórico · texto original' in copy
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


def city_records_case(page):
    go_tab(page,'ciudad','Ciudad')
    before=state(page)
    rng=page.evaluate('window.__qaRandom')
    selector=page.get_by_role('combobox',name='Gestión de ciudad e inmuebles')
    for value,title in [('ranking','Ranking Mundial'),('salon','Salón de la Fama')]:
        if selector.count(): selector.select_option(value=value)
        else: page.get_by_role('button',name=re.compile('^'+title,re.I)).click()
        page.get_by_role('dialog',name=title,exact=True).wait_for()
        # Pseudo expansion changes the heading, not the layer identity.
        dialog=page.locator('[role=dialog]').last
        page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
        report=measure_detail(page)
        assert not report['failures'], (value,report['failures'])
        records=dialog.get_by_role('combobox',name='Registro seleccionado')
        assert records.count()==1, dialog.locator('select').evaluate_all('es=>es.map(e=>({label:e.getAttribute("aria-label"),options:e.options.length}))')
        values=records.locator('option').evaluate_all('es=>es.map(e=>e.value)')
        assert values, 'No access to ranking/history records'
        full=[]
        for record in values:
            records.select_option(value=record)
            full.append(complete_literal(page,dialog))
        if value=='salon':
            assert len(full)==len(before['salonFama'])
            for saved,copy in zip(before['salonFama'],full):
                for field in ['nombre','club','motivo']: assert saved[field] in copy, (field,copy)
                assert str(saved['semanaRetiro']) in copy
        else:
            assert before['plantel'][0]['nombre'] in ''.join(full)
        for key in ['Tab','Shift+Tab']:
            for _ in range(12):
                page.keyboard.press(key)
                assert dialog.evaluate('e=>e.contains(document.activeElement)'), 'Focus escaped city records'
        page.keyboard.press('Escape')
        dialog.wait_for(state='detached')
        if selector.count(): assert selector.evaluate('e=>e===document.activeElement')
        assert state(page)==before and page.evaluate('window.__qaRandom')==rng


def gym_belts_case(page):
    go_tab(page,'gimnasio','Gimnasio')
    before=state(page)
    station=page.get_by_role('combobox',name='Estación del gimnasio')
    if station.count() and station.locator('option[value="club"]').count(): station.select_option(value='club')
    page.get_by_role('button',name=re.compile('^Ver cinturones')).click()
    dialog=page.locator('[role=dialog]').last
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    picker=dialog.get_by_role('combobox',name='Cinturón seleccionado')
    assert picker.locator('option').count()==len(before['cinturones'])
    for index,saved in enumerate(before['cinturones']):
        picker.select_option(value=str(index))
        copy=complete_literal(page,dialog)
        assert saved['dueno'] in copy and str(saved['semana']) in copy
    page.keyboard.press('Escape')
    assert state(page)==before, 'Inspecting belts mutated historical ownership'


def offers_detail_case(page):
    before=state(page)
    rng=page.evaluate('window.__qaRandom')
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='contexto-ofertas')
    else: page.get_by_role('button',name='Ver ofertas pendientes',exact=True).click()
    dialog=page.locator('[role=dialog]').last
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    report=measure_detail(page)
    assert not report['failures'], report['failures']
    picker=dialog.get_by_role('combobox',name='Oferta seleccionada')
    assert picker.locator('option').count()==3
    for index,offer in enumerate(before['ofertas']):
        picker.select_option(value=str(index))
        views=dialog.get_by_role('combobox',name='Detalle de la oferta')
        copy=''
        for view in ['rival','condiciones','oferta']:
            views.select_option(value=view)
            copy+=complete_literal(page,dialog)
        for value in [offer['rival']['nombre'],offer['etiqueta'],offer['detalle']]: assert value in copy
        assert not dialog.get_by_role('button',name=re.compile('^Firmar pelea')).is_disabled()
    page.keyboard.press('Escape')
    assert state(page)==before and page.evaluate('window.__qaRandom')==rng


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


def market_extremes_case(page):
    go_tab(page,'mercado','Mercado')
    before=state(page)
    picker=page.get_by_role('combobox',name='Categoría del mercado',exact=True)
    for category in ['equipamiento','indumentaria','instalaciones','difusion']:
        picker.select_option(value=category)
        while True:
            assert not measure_detail(page)['failures'], (category,measure_detail(page)['failures'])
            for card in page.locator('.market-card').all():
                detail=card.get_by_role('button',name=re.compile(r'^Ver detalle(?:\s|$)'))
                if detail.count():
                    detail.click()
                    dialog=page.get_by_role('dialog').last
                    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
                    assert complete_literal(page,dialog)
                    page.keyboard.press('Escape');dialog.wait_for(state='detached')
                    assert detail.evaluate('e=>e===document.activeElement')
            following=page.locator('.market-pagination button').last
            if not following.count() or following.is_disabled(): break
            following.click()
    page.screenshot(path=str(page.r4_open_capture))
    assert state(page)==before, 'Reading installed equipment changed the save'


def staff_extremes_case(page):
    go_tab(page,'personal','Personal')
    before=state(page)
    while True:
        assert not measure_detail(page)['failures'], measure_detail(page)['failures']
        for card in page.locator('.staff-card').all():
            detail=card.get_by_role('button',name=re.compile(r'^Ver detalle(?:\s|$)'))
            if detail.count():
                detail.click();dialog=page.get_by_role('dialog').last
                page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
                assert complete_literal(page,dialog)
                assert not measure_detail(page)['failures']
                view=dialog.get_by_role('combobox',name='Detalle del puesto',exact=True)
                view.select_option(value='disponibilidad')
                reason=complete_literal(page,dialog)
                role=card.get_attribute('data-staff-type')
                if role=='coordinadorSucursal':
                    assert 'función diferenciada' in reason and 'conservan su contrato' in reason
                view.select_option(value='contratos')
                contracts=[p for p in before['personal'] if p['tipo']==role]
                employee=dialog.get_by_role('combobox',name='Empleado del contrato',exact=True)
                assert employee.locator('option').count()==len(contracts)
                for contract in contracts:
                    employee.select_option(value=contract['id'])
                    assert contract['nombre'] in complete_literal(page,dialog), 'Historical employee inaccessible or truncated'
                    assert dialog.get_by_role('button',name=re.compile(r'^Despedir(?:\s|$)')).is_enabled()
                    assert not measure_detail(page)['failures']
                page.keyboard.press('Escape');dialog.wait_for(state='detached')
                assert detail.evaluate('e=>e===document.activeElement')
        following=page.locator('.staff-pagination button').last
        if not following.count() or following.is_disabled(): break
        following.click()
    page.screenshot(path=str(page.r4_open_capture))
    assert state(page)==before, 'Reading payroll altered historical employees or salaries'


def properties_extremes_case(page):
    go_tab(page,'perfil','Mi Perfil')
    before=state(page)
    page.get_by_role('combobox',name='Sección del perfil',exact=True).select_option(value='bienes')
    assert not measure_detail(page)['failures'], measure_detail(page)['failures']
    picker=page.get_by_role('combobox',name='Propiedad del club',exact=True)
    assert picker.locator('option').count()==6
    for prop in ['local','terreno','sucursal','apartamento','mansion','arena']:
        picker.select_option(value=prop)
        detail=complete_literal(page,page.locator('.profile-property-detail'))
        assert 'Escriturada' in detail and 'Adquirí propiedades desde Ciudad.' in detail
        if prop=='arena': assert '$80.000' in detail and '×1.5' in detail and 'alquiler' in detail
    page.screenshot(path=str(page.r4_open_capture))
    assert state(page)==before, 'Reading properties changed ownership'


def profile_decisions_case(page):
    go_tab(page,'perfil','Mi Perfil')
    before=state(page)
    page.get_by_role('combobox',name='Sección del perfil',exact=True).select_option(value='resumen')
    summary=page.get_by_role('dialog',name=re.compile(r'^Perfil del coach(?:\s|$)'))
    summary.wait_for()
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    legacy=summary.get_by_role('button',name=re.compile(r'^Sistema de Legado(?:\s|$)'))
    expected=before['fama']>=85 or any(c['nivel']==4 for c in before['cinturones'])
    assert legacy.is_enabled()==expected, 'Legacy UI disagrees with the domain belt guard'
    assert not measure_detail(page)['failures'], measure_detail(page)['failures']
    page.screenshot(path=str(page.r4_open_capture))
    if expected:
        legacy.click()
        dialog=page.get_by_role('dialog',name=re.compile(r'^Sistema de Legado(?:\s|$)'))
        page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
        copy=complete_literal(page,dialog)
        assert 'nueva carrera' in copy and 'no se conserva' in copy and before['nombreGimnasio']+' II' in copy
        page.keyboard.press('Escape');dialog.wait_for(state='detached')
        assert legacy.evaluate('e=>e===document.activeElement')
    close=summary.get_by_role('button',name=re.compile(r'^Cerrar el club(?:\s|$)'))
    close.click()
    dialog=page.get_by_role('dialog',name=re.compile(r'^Cerrar el club y reconstruir(?:\s|$)'))
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    copy=complete_literal(page,dialog)
    assert 'Archivo de carreras competitivas' in copy and '$900' in copy
    assert 'resultado neto' in copy and 'reinicia' in copy
    page.keyboard.press('Escape');dialog.wait_for(state='detached')
    assert close.evaluate('e=>e===document.activeElement')
    page.keyboard.press('Escape');summary.wait_for(state='detached')
    assert state(page)==before, 'Reviewing/cancelling destructive decisions changed the save'


def fundraising_case(page):
    go_tab(page,'perfil','Mi Perfil')
    before=state(page)
    page.get_by_role('combobox',name='Sección del perfil',exact=True).select_option(value='actividades')
    dialog=page.get_by_role('dialog').last
    picker=dialog.get_by_role('combobox',name='Actividad para recaudar fondos',exact=True)
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")
    assert picker.locator('option').count()==4
    assert picker.locator('option').evaluate_all('es=>es.map(e=>e.value)')==['bingo','naipes','festival','claseAbierta']
    for activity in ['bingo','naipes','festival','claseAbierta']:
        picker.select_option(value=activity)
        copy=complete_literal(page,dialog)
        assert 'Inversión' in copy and 'retorno base' in copy and 'no está garantizado' in copy
        assert not measure_detail(page)['failures'], measure_detail(page)['failures']
        schedule=dialog.get_by_role('button',name=re.compile(r'^(Agendar|Agendado)(?:\s|$)'))
        assert schedule.is_disabled(), 'Zero cash or already-scheduled fundraiser must not offer a valid booking'
    page.screenshot(path=str(page.r4_open_capture))
    page.keyboard.press('Escape');dialog.wait_for(state='detached')
    assert state(page)==before


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
    assert 'Próximo paso: Guanteos del sábado' in complete_literal(page,page.locator('.calendar-content'))
    view.select_option(value='agenda')
    literal=complete_literal(page,page.locator('.calendar-content'))
    assert 'Semana 9' in literal and 'Rival Fixture' in literal and '$100' in literal
    assert state(page)==before, 'Reading a future contract altered its dates or payment'


def weekly_balance_case(page):
    before=state(page)
    assert len(before['resumen']['ingresos'])==12 and len(before['resumen']['gastos'])==12
    dialog=page.get_by_role('dialog')
    dialog.wait_for()
    assert not measure_detail(page)['failures'], 'Weekly settlement must not clip its decisions or ledger'
    view=dialog.get_by_role('combobox',name='Sección del balance',exact=True)
    rng=page.evaluate('window.__qaRandom')
    for section,field in [('ingresos','ingresos'),('gastos','gastos')]:
        view.select_option(value=section)
        picker=dialog.get_by_role('combobox',name='Movimiento del balance',exact=True)
        assert picker.locator('option').count()==12
        for i,line in enumerate(before['resumen'][field]):
            picker.select_option(value=str(i))
            text=complete_literal(page,dialog)
            assert line['concepto'] in text and '$100' in text, 'Ledger line or exact amount lost'
    view.select_option(value='resumen')
    assert 'Resultado neto de la semana' in complete_literal(page,dialog)
    view.select_option(value='informacion')
    assert 'se cobran el sábado' in complete_literal(page,dialog)
    page.screenshot(path=str(page.r4_open_capture))
    page.keyboard.press('Escape')
    assert dialog.count()==1, 'Escape dismissed mandatory Sunday settlement'
    assert state(page)==before and page.evaluate('window.__qaRandom')==rng
    page.reload(wait_until='networkidle')
    dialog=page.get_by_role('dialog');dialog.wait_for()
    assert state(page)==before
    dialog.get_by_role('button',name=re.compile(r'^Continuar(?:\s|$)')).click()
    dialog.wait_for(state='detached')
    after=state(page)
    assert after['semana']==9 and after['dia']==1 and after['resumen'] is None
    assert after['dinero']==before['dinero'], 'Continue paid an already settled balance again'
    assert after['stats']==before['stats']


def calendar_views_case(page):
    go_tab(page,'calendario','Calendario')
    before=state(page)
    assert len(before['eventos'])==3, 'Synthetic events must survive loading exactly'
    view=page.get_by_role('combobox',name='Vista del calendario',exact=True)
    for value in ['semana','resumen','agenda']:
        view.select_option(value=value)
        if value=='resumen': assert 'Próximo paso' in complete_literal(page,page.locator('.calendar-content'))
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
            assert literal.startswith('Registro histórico en su idioma original\n'), 'Unknown fixture must be identified, not guessed or rewritten'
            dialog.get_by_role('combobox',name='Sección del aviso',exact=True).select_option(value='respuesta')
            response=dialog.get_by_role('combobox',name='Respuesta al evento',exact=True)
            for index,choice in enumerate(event['opciones']):
                response.select_option(value=str(index))
                assert complete_literal(page)=='Registro histórico en su idioma original\n'+choice['texto']
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


def fight_screen_case(page):
    navigation=page.locator('.app-nav select')
    if navigation.count(): navigation.select_option(value='contexto-cartelera')
    else: page.get_by_role('button',name=re.compile('^Noche de peleas')).click()
    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo!==null")
    page.get_by_role('button',name='¡Que suene la Campana!',exact=True).click()
    report=measure_detail(page)
    assert not report['failures'], ('corner',report['failures'])
    assert not report['globalScroll']
    assert page.get_by_role('button',name=re.compile('^Salir al Asalto(?:\\s|$)')).is_visible()
    dialog=page.get_by_role('dialog',name=re.compile('^Combate(?:\\s|$)'))
    assert dialog.evaluate('e=>e.contains(document.activeElement)'), 'Fight must trap initial focus'
    before=state(page)
    for _ in range(12):
        page.keyboard.press('Tab')
        assert dialog.evaluate('e=>e.contains(document.activeElement)')
    for _ in range(12):
        page.keyboard.press('Shift+Tab')
        assert dialog.evaluate('e=>e.contains(document.activeElement)')
    page.keyboard.press('Escape')
    assert dialog.is_visible() and state(page)==before, 'Escape must not cancel/pay a fight'
    selector=dialog.get_by_role('combobox',name='Vista del combate',exact=True)
    for view in ['identidad','ring','estadisticas','tarjetas','relato','decision']:
        selector.select_option(value=view)
        report=measure_detail(page)
        assert not report['failures'], (view,report['failures'])
        assert not report['globalScroll']
        if view=='identidad':
            original=complete_literal(page,dialog)
            assert before['plantel'][0]['nombre'] in original and before['pendientes'][0]['rival']['nombre'] in original
            assert 'Bolsa del contrato: $100' in original
        elif view!='ring': complete_literal(page,dialog)
    assert state(page)==before, 'Reading fight details changed the checkpoint'
    page.screenshot(path=str(page.r4_open_capture))
    plans=dialog.get_by_role('combobox',name='Estrategia de combate',exact=True)
    assert plans.locator('option').evaluate_all('es=>es.map(e=>e.value)')==['equilibrado','presionar','distancia','nocaut','recuperar']
    for plan in ['presionar','distancia','nocaut','recuperar','equilibrado']:
        plans.select_option(value=plan)
        complete_literal(page,dialog)
        assert state(page)==before, 'Inspecting a strategy consumed RNG or advanced a round'
    # Only presentation timers are shortened in this isolated context; never civil time or RNG.
    page.evaluate("() => { const original=window.setTimeout; window.setTimeout=(fn,ms,...args)=>original(fn,ms>=200&&ms<=750?20:ms,...args); }")
    page.get_by_role('button',name=re.compile('^Salir al Asalto(?:\\s|$)')).click()
    page.get_by_role('button',name=re.compile('^Simular resto del combate(?:\\s|$)')).wait_for()
    running=measure_detail(page)
    assert not running['failures'], ('running',running['failures'])
    page.get_by_role('button',name=re.compile('^Simular resto del combate(?:\\s|$)')).click()
    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo.finalizada")
    final_checkpoint=copy.deepcopy(state(page)['combateActivo'])
    votes_a=sum(card['a']>card['b'] for card in final_checkpoint['tarjetas'])
    votes_b=sum(card['b']>card['a'] for card in final_checkpoint['tarjetas'])
    won=final_checkpoint['ko']=='b' if final_checkpoint['ko'] else votes_a>votes_b
    expected_purse=100 if won else 30  # Existing R2 rule: 30% for loss/draw; not a new economy parameter.
    report=measure_detail(page)
    assert not report['failures'], ('final',report['failures'])
    assert f'Bolsa del resultado: ${expected_purse}' in complete_literal(page,dialog)
    page.reload(wait_until='networkidle')
    navigation=page.locator('.app-nav select')
    if navigation.count(): navigation.select_option(value='contexto-cartelera')
    else: page.get_by_role('button',name=re.compile('^Noche de peleas')).click()
    assert state(page)['combateActivo']==final_checkpoint, 'Reopening a final fight changed its checkpoint'
    terminal=page.get_by_role('button',name=re.compile('^Continuar Velada(?:\\s|$)'))
    page.wait_for_function("Boolean(document.querySelector('[data-dialog-layer]'))")
    report=measure_detail(page)
    assert not report['failures'], ('final-reload',report['failures'])
    money=state(page)['dinero']
    terminal.click()
    page.get_by_role('dialog').wait_for(state='detached')
    paid=state(page)
    assert paid['dinero']==money+expected_purse and len(paid['historial'])==len(before['historial'])+1
    assert paid['historial'][0]['bolsa']==expected_purse
    assert paid['combateActivo'] is None and not paid['pendientes']
    page.reload(wait_until='networkidle')
    assert state(page)['dinero']==paid['dinero'] and state(page)['historial']==paid['historial'], 'Reload duplicated a fight payment'


def run():
    global URL
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-ready", action="store_true", required=True)
    parser.add_argument("--port", type=int, default=5235, help="Isolated ephemeral test origin; never use the owner's port")
    parser.add_argument("--matrix", action="store_true", help="Settings and gym detail at all ten required sizes")
    parser.add_argument("--case", help="Run one representative acceptance case")
    parser.add_argument("--viewport", type=int, nargs=2, metavar=("WIDTH", "HEIGHT"), help="Focused real-size case (CSS zoom remains separate)")
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
            cases.append(('weekly-balance',weekly_balance_case,(390,667)))
            cases.append(('press-panel',press_panel_case,(390,667)))
            cases.append(('advice-panel',advice_panel_case,(390,667)))
            cases.append(('sponsor-panel',sponsor_panel_case,(390,667)))
            cases.append(('advice-payment',advice_payment_case,(390,667)))
            cases.append(('event-expired',expired_event_case,(390,667)))
            cases.append(('fight-screen',fight_screen_case,(390,667)))
            cases.append(('club-status',club_status_case,(390,667)))
            cases.append(('boxer-detail',boxer_detail_case,(390,667)))
            cases.append(('city-records',city_records_case,(390,667)))
            cases.append(('city-detail',city_detail_case,(390,667)))
            cases.append(('gym-belts',gym_belts_case,(390,667)))
            cases.append(('gym-detail',gym_drawer_case,(390,667)))
            cases.append(('selector-detail',offers_detail_case,(390,667)))
            cases.extend([('selector-sign',selector_action_case,(390,667)),('selector-regenerate',selector_action_case,(390,667))])
            cases.extend([('market-extremes',market_extremes_case,(390,667)),('staff-extremes',staff_extremes_case,(390,667)),('properties-extremes',properties_extremes_case,(390,667))])
            cases.extend([('profile-belt',profile_decisions_case,(390,667)),('profile-title-only',profile_decisions_case,(390,667)),('fundraising',fundraising_case,(390,667))])
            if args.matrix:
                cases=[(f'{name}-{w}x{h}',check,(w,h)) for w,h in SIZES for name,check in [('settings',settings_bounds_case),('gym-detail',gym_drawer_case),('city-detail',city_detail_case),('boxer-detail',boxer_detail_case),('archive',archive_case),('intro',intro_case),('club-status',club_status_case),('roster-views',roster_views_case),('courses',courses_case),('calendar-views',calendar_views_case),('event-panel',event_panel_case),('transfer-cancel',transfer_cancel_case),('press-panel',press_panel_case),('advice-panel',advice_panel_case),('sponsor-panel',sponsor_panel_case),('advice-payment',advice_payment_case),('event-expired',expired_event_case),('fight-screen',fight_screen_case)]]
            if args.case:
                if args.matrix and args.case in ['press-panel','advice-panel','sponsor-panel']:
                    check={'press-panel':press_panel_case,'advice-panel':advice_panel_case,'sponsor-panel':sponsor_panel_case}[args.case]
                    cases=[(f'{args.case}-{w}x{h}',check,(w,h)) for w,h in SIZES]
                cases=[case for case in cases if case[0]==args.case or (args.matrix and case[0].startswith(args.case+'-'))]
                assert cases, f'Unknown acceptance case: {args.case}'
            if args.viewport:
                assert not args.matrix and all(n > 0 for n in args.viewport), 'Viewport is for focal cases, not matrix replacement'
                cases=[(name,check,tuple(args.viewport)) for name,check,_ in cases]
            for name,check,size in cases:
                fixture = copy.deepcopy(base)
                fixture.update(creado=True, partidaId="r4-disposable", semana=8, semanaLibro=8, dia=2,
                               eventos=[], consejos=[], prensa=[], toasts=[], personal=[], pendientes=[],
                               ofertas=[], ofertasPara=None, combateActivo=None, resumen=None)
                if name.startswith('intro'): fixture.update(creado=False, nombreJugador='')
                if name.startswith('club-status'):
                    fixture.update(nombreGimnasio='Club de los Campeones de Nombres Extraordinariamente Largos',nombreJugador='María de los Ángeles Fernández de la Cruz',dinero=0,seguidores=0,fama=0)
                if name.startswith('city-records'):
                    fixture['plantel'][0].update(nombre='Boxeadora de nombre histórico muy extenso 🥊 '*3,rol='boxeador',licenciaFederativa=True,record={'v':50,'d':0,'e':0,'ko':30})
                    fixture['salonFama']=[{'id':f'r4-legend-{i}','nombre':'Leyenda histórica con nombre extenso 🥊 '+str(i),'club':'Club histórico de nombre extraordinario '*2,'record':{'v':30,'d':5,'e':2,'ko':20},'titulos':4,'semanaRetiro':i+1,'motivo':'Razón histórica desconocida que se conserva literalmente. '*3} for i in range(12)]
                if name.startswith('gym-belts'):
                    fixture['equipamiento']=['vitrina']
                    fixture['cinturones']=[{'id':f'r4-belt-{i}','dueno':'Propietario histórico 🥊 de nombre extenso '*3+str(i),'nivel':i%4+1,'semana':i+1} for i in range(8)]
                if name.startswith('market-extremes'):
                    fixture.update(dinero=0,equipamiento=['vendasGel','sacosCuero','perasDoble','manoplasPro','soga','pisoGoma','cuerdaVelocidad','plataformaReaccion','ringReglamentario','zonaElite','bucal','cabezal','botas','batas','botiquin','vestuarios','barraProteinas','sauna','carteles','sonido','marquesina','vitrina','estudioMarca'],marcaRopa='Marca histórica de nombre extenso 🥊 '+('muy largo '*6))
                if name.startswith('staff-extremes'):
                    fixture.update(dinero=-500,cursos=['dt','veladas','clubes','franquicias'],propiedades=['sucursal'],personal=[{'id':f'r4-staff-{i}','tipo':t,'nombre':'Empleado histórico con nombre extraordinariamente largo '+str(i)} for i,t in enumerate(['directorTecnico','representante','preparador','asistente','difusion','gerente','entrenadorLocal','coordinadorSucursal','coordinadorSucursal','coordinadorSucursal','ojeador'])])
                if name.startswith('properties-extremes'):
                    fixture.update(dinero=0,propiedades=['local','terreno','sucursal','apartamento','mansion','arena'])
                if name.startswith('profile-'):
                    fixture.update(dinero=-1500,fama=0,nombreJugador='María de los Ángeles Fernández de la Cruz '*3,nombreGimnasio='Club de nombres extraordinariamente largos '*3)
                    fixture['plantel'][0]['titulo']=4 if name.startswith('profile-title-only') else 0
                    fixture['cinturones']=[{'id':'r4-historical-world','dueno':'Boxeador histórico transferido','nivel':4,'semana':1}] if name.startswith('profile-belt') else []
                if name.startswith('fundraising'): fixture.update(dinero=0)
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
                if name.startswith('weekly-balance'):
                    fixture.update(dia=7,resumen={'ingresos':[{'concepto':f'Concepto histórico de ingreso {i} '+('con parámetros literales 🥊 '*4),'monto':100} for i in range(12)],'gastos':[{'concepto':f'Concepto histórico de gasto {i} '+('con parámetros literales 🥊 '*4),'monto':100} for i in range(12)],'total':0})
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
                    if name.startswith('selector-detail') or name.startswith('selector-sign'):
                        own.update(record={'v':0,'d':0,'e':0,'ko':0})
                        fixture['ofertas']=[]
                        for index,(level,purse) in enumerate([('accesible',200),('parejo',480),('desafio',1440)]):
                            opponent=copy.deepcopy(own)
                            opponent.update(id=f'r4-opponent-{index}',nombre='Rival histórico de nombre extenso 🥊 '*3+str(index))
                            fixture['ofertas'].append({'id':f'r4-offer-{index}','nivel':level,'rival':opponent,'bolsa':purse,'esTitulo':0,'etiqueta':'Oferta histórica desconocida '+str(index),'detalle':'Condiciones históricas desconocidas que se conservan sin inventar parámetros. '*3})
                    if name.startswith('calendar-future'):
                        fixture.update(dia=6,ofertas=[],ofertasPara=None,pendientes=[{'id':'r4-future','miId':own['id'],'rival':rival,'bolsa':100,'esTitulo':0,'velada':False,'semanaProgramada':9,'diaProgramado':6}])
                if name.startswith('fight-screen'):
                    own=fixture['plantel'][0]
                    own.update(rol='boxeador',licenciaFederativa=True,circuito='amateur',energia=100)
                    rival=copy.deepcopy(own)
                    rival.update(id='r4-fight-rival',nombre='Rival de prueba')
                    fixture.update(dia=6,pendientes=[{'id':'r4-fight','miId':own['id'],'rival':rival,'bolsa':100,'esTitulo':0,'velada':False,'semanaProgramada':8,'diaProgramado':6}])
                mobile=name in ['selector-mobile-preserve','settings-mobile-bounds','intro']
                w,h=size or ((390,667) if mobile else (1280,720))
                ctx = browser.new_context(viewport={"width":round(w/1.25) if args.zoom else w,"height":round(h/1.25) if args.zoom else h},device_scale_factor=1,has_touch=w<=844)
                ctx.add_init_script(rng)
                ctx.add_init_script('window.__r4Pseudo='+str(args.pseudo).lower()+';')
                ctx.add_init_script('window.__r4TextAudit='+str(args.text_audit or args.text_bounds).lower()+';window.__r4TextBounds='+str(args.text_bounds).lower()+';')
                ctx.add_init_script("if(!localStorage.getItem('r4-seeded')){localStorage.setItem(" + json.dumps(KEY) + "," + json.dumps(json.dumps(fixture)) + ");localStorage.setItem('r4-seeded','yes');}")
                ctx.route("**/*", route_local)
                page = ctx.new_page()
                page.r4_case = name
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
                    if name.startswith('city-records'): assert state(page)['salonFama']==fixture['salonFama'], 'Hall fixture was altered during load'
                    check(page)
                    if name.startswith('staff-extremes'): assert state(page)['personal']==fixture['personal'], 'Historical contracts changed during load or presentation'
                    if name.startswith('market-extremes'): assert state(page)['marcaRopa']==fixture['marcaRopa'], 'Historical brand changed during load or presentation'
                    if name.startswith('properties-extremes'): assert state(page)['propiedades']==fixture['propiedades'], 'Ownership changed during load or presentation'
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
