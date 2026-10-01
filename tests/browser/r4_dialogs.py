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
import time
import traceback
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scratch"))
from test_r3_content import DETERMINISTIC, state

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
    reopen = page.get_by_role("button", name="Ver ofertas pendientes", exact=True)
    reopen.click()
    dialog = page.get_by_role("dialog")
    dialog.wait_for()
    assert dialog.locator("button").count() > 1
    dialog.get_by_role("button", name="Cerrar ventana", exact=True).click()
    dialog.wait_for(state="detached")
    assert state(page) == before, "Closing altered persisted game data"
    assert page.evaluate("window.__qaRandom") == rng_before, "Closing/reopening consumed game RNG"
    reopen.click()
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


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-ready", action="store_true", required=True)
    args = parser.parse_args()
    started = time.perf_counter()
    dist = ROOT / "dist"
    fingerprint = {str(p.relative_to(dist)): hashlib.sha256(p.read_bytes()).hexdigest()
                   for p in dist.rglob("*") if p.is_file()}
    assert (dist / "index.html").exists()
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 5235))
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5235", "--bind", "127.0.0.1", "--directory", str(dist)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    report = {"origin": URL, "cases": [], "build": fingerprint}
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
            for name, check in [("selector-close-reopen-preserve", offers_case), ("dialog-focus-keyboard", focus_case),
                                ("nested-stack-focus-escape", stacked_dialog_case), ("out-of-order-unmount", out_of_order_dialog_case)]:
                fixture = copy.deepcopy(base)
                fixture.update(creado=True, partidaId="r4-disposable", semana=8, semanaLibro=8, dia=2,
                               eventos=[], consejos=[], prensa=[], toasts=[], personal=[], pendientes=[],
                               ofertas=[], ofertasPara=None, combateActivo=None, resumen=None)
                if name.startswith("selector"):
                    own = fixture["plantel"][0]
                    own.update(rol="boxeador", licenciaFederativa=True, circuito="amateur", energia=100)
                    rival = copy.deepcopy(own)
                    rival.update(id="r4-rival", nombre="Rival Fixture")
                    fixture["ofertasPara"] = own["id"]
                    fixture["ofertas"] = [{"id":"r4-offer", "nivel":"parejo", "rival":rival,"bolsa":100,"esTitulo":0,"etiqueta":"Oferta sintética", "detalle":"Fixture válido"}]
                ctx = browser.new_context(viewport={"width":1280,"height":720})
                ctx.add_init_script(rng)
                ctx.add_init_script("if(!localStorage.getItem('r4-seeded')){localStorage.setItem(" + json.dumps(KEY) + "," + json.dumps(json.dumps(fixture)) + ");localStorage.setItem('r4-seeded','yes');}")
                ctx.route("**/*", route_local)
                page = ctx.new_page()
                page.set_default_timeout(5000)
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                result = {"case":name}
                try:
                    page.goto(URL, wait_until="networkidle")
                    page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state!==undefined")
                    check(page)
                    assert not errors, errors
                    result["status"] = "PASS"
                except Exception:
                    result.update(status="FAIL", error=traceback.format_exc())
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
