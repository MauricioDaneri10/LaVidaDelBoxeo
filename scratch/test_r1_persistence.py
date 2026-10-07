"""R1 browser acceptance. Fresh Chromium contexts, synthetic data, isolated port 5231.
Never connects to localhost:3000 or the user's profile.
"""
import json
import subprocess
import sys
import time
import tempfile
from urllib.request import urlopen
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:5231/"
K = "vida-del-boxeo-v2"

def roster(page):
    nav=page.locator('.app-nav select')
    if nav.count(): nav.select_option(value='plantel')
    else: page.locator('.app-nav').get_by_role('button',name='Plantel',exact=True).click()
    picker=page.locator('.roster-filters select')
    if picker.locator('option[value="grupo:federados"]').count(): picker.select_option(value='grupo:federados')

def settled(page):
    page.wait_for_function("() => [...document.querySelectorAll('[role=dialog]')].every(e=>e.dataset.animationReady==='true')")

def open_sheet(page):
    page.locator('.plantel-grid button[aria-label^="Abrir ficha técnica de"], .plantel-grid button[title^="Abrir ficha técnica de"]').first.click()
    settled(page)

def sheet_view(page,value):
    picker=page.get_by_role('combobox',name='Sección de la ficha',exact=True)
    if picker.count(): picker.select_option(value=value)

def settings(page):
    page.get_by_title('Configuración y partidas',exact=True).click()
    settled(page)
    view=page.get_by_role('combobox',name='Sección de configuración',exact=True)
    if view.count(): view.select_option(value='partida')

def seed(context, state, fault=""):
    context.add_init_script("""(() => {
      const args = ARGS;
      const storage = localStorage;
      window.__qaStorage = storage;
      const raw = JSON.stringify(args.state);
      storage.setItem('vida-del-boxeo-v2', raw);
      window.__qaOriginal = raw;
      window.__qaSet = Storage.prototype.setItem;
      if (args.fault === 'full') Storage.prototype.setItem = function() { throw new DOMException('Quota full', 'QuotaExceededError'); };
      if (args.fault === 'denied') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage denied', 'SecurityError'); } });
    })();""".replace("ARGS", json.dumps({"state": state, "fault": fault})))

def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5231", "--bind", "127.0.0.1", "--directory", str(ROOT / "dist")], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline=time.monotonic()+5
    while True:
        try:
            urlopen(URL,timeout=.3).close();break
        except OSError:
            if time.monotonic()>=deadline: raise
            time.sleep(.05)
    captures=Path(tempfile.mkdtemp(prefix='r1-isolated-'))
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ctx = browser.new_context()
            page = ctx.new_page(); page.goto(URL)
            page.wait_for_function("localStorage.getItem('vida-del-boxeo-v2') !== null")
            state = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state")
            state.update(creado=True, nombreJugador="QA R1", nombreGimnasio="Fixture R1", partidaId="fixture-r1-browser", nombrePartida="Fixture", cursos=["dt"], seguidores=0, toasts=[])
            p = state["plantel"][0]
            p.update(nombre="Púgil Archivado QA", rol="boxeador", licenciaFederativa=True, circuito="amateur", peleasAmateur=50, record={"v": 32, "d": 18, "e": 0, "ko": 12})
            state["plantel"] = [p]
            ctx.close()

            for width, height in [(1280, 720), (1440, 900)]:
                ctx = browser.new_context(viewport={"width": width, "height": height})
                seed(ctx, state)
                page = ctx.new_page(); errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
                page.set_default_timeout(5000)
                page.goto(URL, wait_until="networkidle")
                roster(page)
                open_sheet(page)
                sheet_view(page,'gestion')
                management=page.get_by_role('combobox',name='Acción de gestión del boxeador',exact=True)
                if management.count(): management.select_option(value='profesional')
                page.get_by_role("button", name="Aceptar pase profesional", exact=True).click()
                sheet_view(page,'identidad')
                page.get_by_text("Licencia Profesional", exact=True).wait_for()
                page.get_by_role("button", name="Cerrar ventana", exact=True).click()
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.plantel[0].circuito === 'pro'")
                saved = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state")
                assert saved["plantel"][0]["peleasProfesionales"] == 0
                # Remove init seeding so reload tests the ACTUAL saved progress.
                ctx2 = browser.new_context(viewport={"width": width, "height": height}, storage_state=ctx.storage_state())
                ctx.close(); page = ctx2.new_page(); page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto(URL, wait_until="networkidle")
                assert page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state") == saved
                roster(page)
                # Demote record to non-legend only inside the isolated fixture before testing the departure.
                isolated = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state")
                isolated["plantel"][0]["record"] = {"v": 1, "d": 1, "e": 0, "ko": 0}
                page.evaluate("s => localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(s))", isolated)
                page.reload(wait_until="networkidle"); roster(page)
                picker=page.locator('.roster-filters select')
                if picker.locator('option[value="vista:rendimiento"]').count(): picker.select_option(value='vista:rendimiento')
                # Both full and bounded cards expose the same explicit transfer action.
                page.locator(".plantel-grid").get_by_role("button", name="Transferir", exact=True).click()
                page.get_by_role('dialog',name='Transferir fuera del club',exact=True).get_by_role('button',name='Transferir',exact=True).click()
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.archivoCarreras.length === 1")
                page.reload(wait_until="networkidle"); roster(page)
                picker=page.locator('.roster-filters select')
                if picker.locator('option[value="gestion:abrir"]').count():
                    picker.select_option(value='gestion:abrir')
                    page.get_by_role('combobox',name='Sección de gestión del plantel',exact=True).select_option(value='acciones')
                page.get_by_role("button", name="Archivo de carreras", exact=True).click()
                assert page.get_by_test_id("career-archive").is_visible()
                archive=page.get_by_role('dialog').filter(has=page.get_by_test_id('career-archive'))
                settled(page)
                archive.get_by_role('combobox',name='Sección del archivo',exact=True).select_option(value='atributos')
                archive.get_by_role('combobox',name='Dato de la ficha histórica',exact=True).select_option(value='pro')
                assert archive.get_by_text('0–0–0 · 0 KO',exact=True).is_visible()
                archived=page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.archivoCarreras[0].pugilista")
                assert archived['circuito']=='pro' and archived['peleasProfesionales']==0
                assert [archived[k] for k in ['victoriasProfesionales','derrotasProfesionales','empatesProfesionales','kosProfesionales']]==[0,0,0,0]
                geometry = archive.evaluate("e => ({bottom:e.getBoundingClientRect().bottom, scroll:e.lastElementChild.scrollHeight > e.lastElementChild.clientHeight + 1})")
                assert geometry["bottom"] <= height and not geometry["scroll"], geometry
                assert not errors, errors
                page.screenshot(path=str(captures / f"r1_archive_{width}.png"))
                print(f"PASS {width}x{height}: pase/recarga exactos, baja no legendaria, archivo accesible sin scroll")
                ctx2.close()

            for fault in ["full", "denied", "future"]:
                ctx = browser.new_context(viewport={"width": 1280, "height": 720})
                broken = dict(state)
                if fault == "future": broken["schemaVersion"] = 999
                seed(ctx, broken, fault)
                page = ctx.new_page(); errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
                page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
                page.goto(URL, wait_until="networkidle")
                page.get_by_test_id("save-error").wait_for()
                page.set_default_timeout(5000)
                assert page.evaluate("window.__qaStorage.getItem('vida-del-boxeo-v2') === window.__qaOriginal")
                if fault == "full":
                    settings(page)
                    assert not errors, errors
                    page.get_by_role("button", name="Guardar ahora", exact=True).click()
                    assert not page.get_by_text("Partida guardada correctamente.", exact=True).is_visible()
                    page.evaluate("() => { Storage.prototype.setItem = window.__qaSet; }")
                    page.get_by_role('button',name='Cerrar ventana',exact=True).click()
                    page.get_by_test_id('save-error').get_by_role('button',name='No se guardó · Ver detalle',exact=True).click()
                    page.get_by_role("button", name="Reintentar guardado", exact=True).click()
                    page.get_by_test_id("save-error").wait_for(state="hidden")
                if fault == "denied":
                    page.get_by_role('textbox',name='Tu nombre de coach',exact=True).fill("QA denegado")
                    page.get_by_role('combobox',name='Sección de inicio',exact=True).select_option(value='gimnasio')
                    page.get_by_role("button", name="¡Que suene la campana!", exact=True).click()
                    settings(page)
                    page.get_by_role("button", name="Guardar ahora", exact=True).click()
                    assert page.get_by_test_id("save-error").is_visible()
                    assert page.evaluate("window.__qaStorage.getItem('vida-del-boxeo-v2') === window.__qaOriginal")
                assert not errors, errors
                print(f"PASS {fault}: aviso real, sin falso éxito ni sustitución de la partida")
                ctx.close()
            browser.close()
    finally:
        server.terminate(); server.wait(timeout=5)

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
