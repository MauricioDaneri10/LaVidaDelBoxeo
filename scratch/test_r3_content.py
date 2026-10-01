"""Isolated R3 acceptance. Parent builds production; this script never builds it.

Run only after the parent confirms the build:
  python scratch/test_r3_content.py --parent-build-ready
Optional --selectors JSON supplies exact accessible names/CSS agreed with parent.
Evidence is JSON on stdout; no screenshots, profiles or user saves are retained.
"""
import argparse
import copy
import hashlib
import json
import re
import socket
import subprocess
import sys
import time
import traceback
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
URL = "http://127.0.0.1:5234/"
KEY = "vida-del-boxeo-v2"
VIEWPORTS = [(1280, 720), (1440, 900)]
SELECTORS = {
    "staff_card": ".staff-card", "staff_next": "Más personal",
    "staff_previous": "Anterior", "coordinator": "Coordinador de Sucursales",
    "manager": "Gerente de Sucursal", "trainer": "Entrenador Local",
    "advice_tab": "Don Anselmo", "active_view": "Ver hitos pendientes",
    "archive_view": "Ver historial de hitos", "regenerate": "Volver a buscar rival",
    "forecast": ".forecast-strip", "footer": ".app-footer",
}
DETERMINISTIC = r"""(() => {
  // Synthesized audio consumes Math.random for noise. Use the app's supported
  // mute preference in this disposable context to measure game RNG only.
  localStorage.setItem('vida-del-boxeo:sonido', 'off');
  let seed = 1001;
  let uiCalls = 0;
  window.__qaRandom = {calls: 0, seed};
  window.__qaRandomTrace = [];
  Math.random = () => {
    const trace = new Error().stack;
    const caller = trace.split('\n')[2] || '';
    // Framer Motion PresenceChild uses a random dependency when layout affects
    // presence. Its rendering stream must not advance the game's test stream.
    if ((window.__qaPresenceCallers || []).some(name => caller.includes('at ' + name + ' ('))) {
      return (++uiCalls % 997) / 997;
    }
    window.__qaRandomTrace.push(trace);
    if (window.__qaRandomTrace.length > 12) window.__qaRandomTrace.shift();
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    window.__qaRandom = {calls: window.__qaRandom.calls + 1, seed};
    return seed / 4294967296;
  };
  Date.now = () => 1790856000000;
})();"""


def state(page):
    return page.evaluate("""key => {const s=JSON.parse(localStorage.getItem(key));
      return s.state ?? s;}""", KEY)


def isolated_route(route):
    url = route.request.url
    parsed = urlsplit(url)
    if url.startswith(URL) or (parsed.scheme == "https" and parsed.hostname in
                              {"fonts.googleapis.com", "fonts.gstatic.com"}):
        route.continue_()
    else:
        route.abort()


def fresh_fixture(baseline):
    s = copy.deepcopy(baseline)
    s.update(creado=True, nombreJugador="QA R3", nombreGimnasio="Fixture R3",
             nombrePartida="Disposable R3", partidaId="qa-r3-isolated", semana=8,
             semanaLibro=8, dia=2, dinero=100000, fama=40, seguidores=1500,
             recreativos=3, cursos=["dt", "clubes", "franquicias"], personal=[],
             propiedades=["sucursal"], eventos=[], toasts=[], consejos=[],
             pendientes=[], ofertas=[], ofertasPara=None, combateActivo=None,
             comunitarios=[], patrocinio=None, prestamo=None, resumen=None,
             libroIngresos=[], libroGastos=[])
    return s


def geometry(page, selectors, controls=()):
    metrics = page.evaluate("""footerSelector => {
      const rect=e=>{const r=e.getBoundingClientRect(); return {left:r.left,
        top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      const f=document.querySelector(footerSelector);
      return {viewport:[innerWidth,innerHeight],footer:f?rect(f):null,
        document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
        panels:[...document.querySelectorAll('.game-screen,aside')]
          .filter(e=>e.getBoundingClientRect().width>0).map(e=>({class:e.className,...rect(e)}))};
    }""", selectors["footer"])
    metrics["controls"] = []
    for control in controls:
        assert control.is_visible(), "Essential control not visible"
        box = control.bounding_box()
        metrics["controls"].append({"text": control.inner_text(), "bounds": box})
        assert box and box["x"] >= -1 and box["y"] >= -1, metrics
        assert box["x"] + box["width"] <= metrics["viewport"][0] + 1, metrics
        assert box["y"] + box["height"] <= metrics["footer"]["top"] + 1, metrics
        assert control.evaluate("e=>e.scrollWidth<=e.clientWidth+2"), metrics
    f = metrics["footer"]
    assert f and f["top"] >= 0 and f["bottom"] <= metrics["viewport"][1] + 1, metrics
    assert metrics["document"][0] <= metrics["viewport"][0] + 2, metrics
    assert metrics["document"][1] <= metrics["viewport"][1] + 2, metrics
    return metrics


def staff_card(page, selectors, name):
    screen = page.locator(".staff-screen")
    previous = screen.get_by_role("button", name=selectors["staff_previous"], exact=True)
    for _ in range(12):
        if not previous.count() or not previous.is_enabled():
            break
        previous.click()
    for _ in range(12):
        card = page.locator(selectors["staff_card"]).filter(has_text=name)
        if card.count():
            assert card.count() == 1, f"Ambiguous staff selector: {name}"
            return card
        nxt = screen.get_by_role("button", name=selectors["staff_next"], exact=True)
        assert nxt.count() and nxt.is_enabled(), f"Staff card absent: {name}"
        nxt.click()
    raise AssertionError(f"Staff pagination did not reach {name}")


def coordinator(page, fixture, selectors):
    page.get_by_role("button", name="Personal", exact=True).click()
    card = staff_card(page, selectors, selectors["coordinator"])
    text = card.inner_text()
    assert re.search(r"función diferenciada|contrataciones.*(?:suspend|no disponibles)|puesto.*suspend", text, re.I), text
    assert not re.search(r"(?:sede|sucursal|capacidad) adicional|permite administrar", text, re.I), text
    enabled_hires = [b for b in card.get_by_role("button", name=re.compile("Contratar")).all() if b.is_enabled()]
    assert not enabled_hires, text
    before = state(page)
    assert before["personal"] == fixture["personal"], before["personal"]
    assert before["dinero"] == fixture["dinero"]
    assert before["propiedades"] == fixture["propiedades"]
    assert "$140" in text, text
    expected_payroll = 140 * len(fixture["personal"])
    payroll = page.locator(".staff-header").get_by_text("Costo nómina semanal:", exact=False).inner_text()
    assert f"${expected_payroll:,}".replace(",", ".") in payroll, payroll
    for employee in fixture["personal"]:
        assert employee["nombre"] in text, text
    controls = card.get_by_role("button", name="Despedir", exact=True).all()
    result = geometry(page, selectors, controls)
    page.reload(wait_until="networkidle")
    assert state(page)["personal"] == before["personal"]
    if controls:
        page.get_by_role("button", name="Personal", exact=True).click()
        card = staff_card(page, selectors, selectors["coordinator"])
        card.get_by_role("button", name="Despedir", exact=True).first.click()
        page.wait_for_function("n=>JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.personal.length===n", arg=len(before["personal"])-1)
        card = staff_card(page, selectors, selectors["coordinator"])
        assert not any(b.is_enabled() for b in card.get_by_role("button", name=re.compile("Contratar")).all())
    return result


def hire_order(page, fixture, selectors, order):
    page.get_by_role("button", name="Personal", exact=True).click()
    metrics = []
    for index, role in enumerate(order):
        card = staff_card(page, selectors, selectors[role])
        hire = card.get_by_role("button", name=re.compile(r"^Contratar(?:\s|$)"))
        assert hire.count() == 1 and hire.is_enabled(), card.inner_text()
        metrics.append(geometry(page, selectors, [hire]))
        hire.click()
        confirmation = card.get_by_role("button", name="Contratar igualmente", exact=True)
        if confirmation.count():
            confirmation.click()
        page.wait_for_function("n=>JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.personal.length===n", arg=index+1)
    saved = state(page)
    assert sorted(p["tipo"] for p in saved["personal"]) == ["entrenadorLocal", "gerente"]
    assert saved["propiedades"] == fixture["propiedades"]
    assert saved["dinero"] == fixture["dinero"]
    for role in order:
        card = staff_card(page, selectors, selectors[role])
        assert not any(b.is_enabled() for b in card.get_by_role("button", name=re.compile("Contratar")).all()), card.inner_text()
    page.reload(wait_until="networkidle")
    assert state(page)["personal"] == saved["personal"]
    return metrics


def advice(page, fixture, selectors):
    migrated = state(page)
    assert migrated["dinero"] == fixture["dinero"] and migrated["fama"] == fixture["fama"]
    assert {"c1", "c8", "c11"} <= {c["id"] for c in migrated["consejos"]}, "Legacy history lost"
    tab = page.get_by_role("button", name=re.compile(r"^" + re.escape(selectors["advice_tab"])))
    tab.click()
    dock = page.locator(".club-panel:visible")
    archive = dock.get_by_role("button", name=selectors["archive_view"], exact=True)
    assert dock.get_by_text("QA R3 first objective", exact=True).is_visible()
    assert not dock.get_by_text("QA R3 legacy paid", exact=True).is_visible()
    assert not dock.get_by_text("QA R3 legacy duplicate", exact=True).is_visible()
    claim = dock.get_by_role("button", name="Cobrar", exact=True)
    assert claim.count() == 1, "Only the unpaid unique objective may be claimed"
    metrics = geometry(page, selectors, [archive, claim])
    claim.click()
    page.wait_for_function("() => JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.consejos.find(c=>c.id==='c1').reclamado")
    paid = state(page)
    assert paid["fama"] == fixture["fama"] + 2
    assert paid["dinero"] == fixture["dinero"]
    assert len(paid["consejos"]) == len(migrated["consejos"]), "Claim spawned another objective"
    archive.click()
    for text in ("QA R3 first objective", "QA R3 legacy paid", "QA R3 legacy duplicate"):
        dock.get_by_text(text, exact=True).wait_for(state="visible")
    assert dock.get_by_role("button", name="Cobrar", exact=True).count() == 0
    metrics["archive"] = geometry(page, selectors, [dock.get_by_role("button", name=selectors["active_view"], exact=True)])
    dock.get_by_role("button", name=selectors["active_view"], exact=True).click()
    assert dock.get_by_role("button", name="Cobrar", exact=True).count() == 0
    page.reload(wait_until="networkidle")
    reloaded = state(page)
    assert reloaded["consejos"] == paid["consejos"]
    assert (reloaded["dinero"], reloaded["fama"]) == (paid["dinero"], paid["fama"])
    page.get_by_role("button", name=re.compile(r"^" + re.escape(selectors["advice_tab"]))).click()
    assert dock.get_by_role("button", name=selectors["archive_view"], exact=True).is_visible()
    assert dock.get_by_role("button", name="Cobrar", exact=True).count() == 0
    return metrics


def forecast(page, fixture, selectors):
    strip = page.locator(selectors["forecast"])
    text = strip.inner_text()
    for label in ("Ingresos previstos", "Actividades estimadas", "no son cobros garantizados"):
        assert label in text, text
    assert "Entradas seguras" not in text, text
    assert state(page)["comunitarios"] == fixture["comunitarios"]
    metrics = geometry(page, selectors)
    metrics["forecast"] = {"text": text, "bounds": strip.bounding_box()}
    assert strip.bounding_box()["y"] + strip.bounding_box()["height"] <= metrics["footer"]["top"]
    return metrics


def offers(page, fixture, selectors):
    loaded = state(page)
    assert loaded["ofertas"] == fixture["ofertas"], "Load altered legacy offers without user action"
    assert loaded["dinero"] == fixture["dinero"] and loaded["pendientes"] == []
    assert loaded["ofertasPara"] == fixture["ofertasPara"]
    # Same modal shape in both contexts: framework animation may use randomness.
    # Only validity differs; legacy loading must not add domain generation draws.
    control_fixture = copy.deepcopy(fixture)
    control_fixture["ofertas"][0]["rival"]["titulo"] = 0
    control_fixture["ofertas"][0]["bolsa"] = 2070
    context = page.context.browser.new_context(viewport=page.viewport_size)
    try:
        context.add_init_script(DETERMINISTIC)
        context.route("**/*", isolated_route)
        context.add_init_script("localStorage.setItem(" + json.dumps(KEY) + ", " + json.dumps(json.dumps(control_fixture)) + ");")
        control_page = context.new_page()
        control_errors = []
        control_page.on("pageerror", lambda error: control_errors.append(str(error)))
        control_page.on("requestfailed", lambda req: control_errors.append(f"{req.url}: {req.failure}"))
        control_page.goto(URL, wait_until="networkidle")
        assert not control_errors, control_errors
        load_rng = page.evaluate("window.__qaRandom")
        control_rng = control_page.evaluate("window.__qaRandom")
        assert load_rng == control_rng, {"error": "Loading old offers consumed RNG", "legacy": load_rng, "coherent": control_rng}
    finally:
        context.close()
    page.reload(wait_until="networkidle")
    assert state(page)["ofertas"] == fixture["ofertas"]
    assert page.evaluate("window.__qaRandom") == load_rng, "Reload consumed extra offer RNG"
    sign = page.get_by_role("button", name="Firmar pelea", exact=True)
    metrics = geometry(page, selectors, [sign])
    rng_before = page.evaluate("window.__qaRandom")
    sign.click()
    page.get_by_text("Esta oferta antigua no es válida.", exact=False).wait_for(state="visible")
    rejected = state(page)
    assert rejected["ofertas"] == fixture["ofertas"]
    assert rejected["dinero"] == fixture["dinero"] and rejected["pendientes"] == []
    assert page.evaluate("window.__qaRandom") == rng_before, {"error": "Rejecting old offer consumed RNG",
        "before": rng_before, "after": page.evaluate("window.__qaRandom"),
        "traces": page.evaluate("window.__qaRandomTrace")}
    page.evaluate("e=>window.__qaOfferEvidence=e", {"legacy_preserved_on_load": True,
                  "load_reload_rng_unchanged": True, "reject_toast_visible": True,
                  "reject_rng_unchanged": True, "money_unchanged": True,
                  "nothing_booked": True, "geometry": metrics})
    regenerate = page.get_by_role("button", name=selectors["regenerate"], exact=True)
    if regenerate.count():
        metrics["regenerate"] = geometry(page, selectors, [regenerate])
        regenerate.click()
    else:
        close = page.get_by_role("button", name="Cerrar ventana", exact=True)
        metrics["close"] = geometry(page, selectors, [close])
        close.click()
        page.get_by_text("Selección de Rival · 3 ofertas del promotor", exact=True).wait_for(state="hidden")
        # Closing the offer overlay returns to the existing boxer sheet.
        # Only open the sheet ourselves when no underlying dialog remains.
        if not page.get_by_role("dialog").count():
            page.get_by_role("button", name="Plantel", exact=True).click()
            page.get_by_role("button", name="Abrir ficha técnica de " + fixture["plantel"][0]["nombre"], exact=True).click()
        search = page.get_by_role("dialog").get_by_role("button", name=re.compile(r"^(?:Buscar rival|Buscar Ofertas de Combate)$", re.I))
        assert search.count() == 1, "Expected BoxerSheet's explicit rival search"
        metrics["search"] = geometry(page, selectors, [search])
        search.click()
    page.wait_for_function("()=>JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.ofertas.length===3")
    generated = state(page)
    assert generated["dinero"] == fixture["dinero"] and generated["pendientes"] == []
    assert [o["bolsa"] for o in generated["ofertas"]] == [288, 690, 2070]
    for offer in generated["ofertas"]:
        assert offer["esTitulo"] == 0 and offer["rival"]["titulo"] == 0, offer
        assert offer["id"] != "r3-incoherent", offer
    page.get_by_text("Selección de Rival · 3 ofertas del promotor", exact=True).wait_for()
    metrics["generated"] = geometry(page, selectors, page.get_by_role("button", name="Firmar pelea", exact=True).all())
    page.reload(wait_until="networkidle")
    after = state(page)
    assert after["ofertas"] == generated["ofertas"], "Reload regenerated coherent offers again"
    assert after["dinero"] == fixture["dinero"] and after["pendientes"] == []
    return metrics


def purchase_gear(page, fixture, selectors, gear):
    gear_id, name, category, cost, effect = gear
    page.get_by_role("button", name="Mercado", exact=True).click()
    screen = page.locator(".game-screen").filter(has_text="Mercado del Gimnasio")
    screen.get_by_role("button", name=category, exact=True).click()
    for _ in range(12):
        card = screen.locator(".market-card").filter(has_text=name)
        if card.count():
            break
        nxt = screen.get_by_role("button", name="Más", exact=True)
        assert nxt.count() and nxt.is_enabled(), f"Missing gear {name}"
        nxt.click()
    assert card.count() == 1, name
    assert effect in card.inner_text(), card.inner_text()
    buy = card.get_by_role("button", name=re.compile(r"^Comprar"))
    metrics = geometry(page, selectors, [buy])
    before = state(page)
    buy.click()
    page.wait_for_function("id=>JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.equipamiento.includes(id)", arg=gear_id)
    purchased = state(page)
    assert purchased["dinero"] == before["dinero"] - cost
    assert purchased["equipamiento"] == before["equipamiento"] + [gear_id]
    assert [p["energia"] for p in purchased["plantel"]] == [p["energia"] for p in before["plantel"]]
    assert purchased["libroGastos"] == before["libroGastos"] + [{"concepto": "Compra · " + name, "monto": cost}]
    assert card.get_by_role("button", name=re.compile(r"^Comprar")).count() == 0
    page.reload(wait_until="networkidle")
    reloaded = state(page)
    for key in ("dinero", "equipamiento", "plantel", "libroGastos"):
        assert reloaded[key] == purchased[key], key
    return {"geometry": metrics, "effect_text": effect, "cost_once": cost,
            "note": "UI purchase contract; training/weekly attribute effects belong to parent domain tests"}


def run():
    started = time.perf_counter()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--parent-build-ready", action="store_true")
    parser.add_argument("--selectors", type=Path)
    parser.add_argument("--case", action="append", help="Run an exact case name; repeat to select multiple")
    args = parser.parse_args()
    if not args.parent_build_ready:
        parser.error("Browser execution is gated: wait for parent build-ready confirmation.")
    if not (DIST / "index.html").is_file():
        parser.error("Parent build missing at this checkout's dist/index.html")
    from playwright.sync_api import sync_playwright
    selectors = dict(SELECTORS)
    if args.selectors:
        selectors.update(json.loads(args.selectors.read_text(encoding="utf-8")))
    # Never accidentally reuse another process's origin or profile.
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 5234))
    fingerprint = {str(p.relative_to(DIST)): hashlib.sha256(p.read_bytes()).hexdigest()
                   for p in sorted(DIST.rglob("*")) if p.is_file()}
    report = {"origin": URL, "build_sha256": fingerprint, "cases": []}
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5234", "--bind", "127.0.0.1",
                               "--directory", str(DIST)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        deadline = time.monotonic() + 5
        while True:
            if server.poll() is not None:
                raise RuntimeError("QA server could not start on 5234")
            try:
                with urlopen(URL, timeout=.5) as response:
                    if response.status == 200:
                        break
            except OSError:
                if time.monotonic() >= deadline:
                    raise RuntimeError("QA server did not respond")
                time.sleep(.05)
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=["--enable-gpu", "--use-angle=d3d11"])
            report["gpu"] = browser.new_browser_cdp_session().send("SystemInfo.getInfo")["gpu"]
            presence_callers = []
            for asset in DIST.rglob("*.js"):
                presence_callers.extend(re.findall(
                    r"(?:const|,)\s*([\w$]+)=\(\{children:[^}]*presenceAffectsLayout:",
                    asset.read_text(encoding="utf-8")))
            global DETERMINISTIC
            DETERMINISTIC = "window.__qaPresenceCallers=" + json.dumps(presence_callers) + ";" + DETERMINISTIC
            report["rng_instrumentation"] = {"excluded_render_callers": presence_callers,
                                             "reason": "Framer Motion PresenceChild dependency; independent UI stream"}
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            context.add_init_script(DETERMINISTIC)
            context.route("**/*", isolated_route)
            page = context.new_page()
            baseline_errors, baseline_resources = [], []
            page.on("pageerror", lambda error: baseline_errors.append(str(error)))
            page.on("requestfailed", lambda req: baseline_resources.append({"url": req.url, "error": req.failure}))
            page.on("response", lambda res: baseline_resources.append({"url": res.url, "status": res.status}) if res.status >= 400 else None)
            page.goto(URL, wait_until="networkidle")
            page.wait_for_function("localStorage.getItem('vida-del-boxeo-v2') !== null")
            baseline = state(page)
            assert not baseline_errors, baseline_errors
            assert not baseline_resources, baseline_resources
            report["baseline"] = {"schemaVersion": baseline["schemaVersion"], "pageerrors": baseline_errors,
                                  "resource_errors": baseline_resources}
            context.close()
            cases = []
            for count in (0, 1, 3):
                fixture = fresh_fixture(baseline)
                fixture["schemaVersion"] = 6
                if count == 1:
                    fixture["propiedades"] = ["sucursal", "sucursal"]  # Free administrative seat still blocks coordinator.
                fixture["personal"] = [{"id": f"r3-coord-{i}", "tipo": "coordinadorSucursal",
                                         "nombre": f"Existing coordinator {i}"} for i in range(count)]
                cases.append((f"coordinator-{count}", fixture, coordinator))
            for order in (("manager", "trainer"), ("trainer", "manager")):
                cases.append(("hire-" + "-".join(order), fresh_fixture(baseline),
                              lambda p, f, s, order=order: hire_order(p, f, s, order)))
            fixture = fresh_fixture(baseline)
            fixture["schemaVersion"] = 6
            fixture["consejos"] = [
                {"id": "c1", "texto": "QA R3 first objective", "fama": 2, "cumplido": True, "reclamado": False},
                {"id": "c8", "texto": "QA R3 legacy paid", "fama": 1, "dinero": 60, "cumplido": True, "reclamado": True},
                {"id": "c11", "texto": "QA R3 legacy duplicate", "fama": 1, "dinero": 60, "cumplido": True, "reclamado": False},
            ]
            cases.append(("advice-legacy-active-archive-once", fixture, advice))
            fixture = fresh_fixture(baseline)
            fixture["comunitarios"] = [{"tipo": "bingo", "nombre": "Gran Bingo Familiar del Club"}]
            cases.append(("forecast-guaranteed-estimated", fixture, forecast))
            fixture = fresh_fixture(baseline)
            fixture["schemaVersion"] = 6
            own = fixture["plantel"][0]
            own.update(id="r3-own", rol="boxeador", circuito="pro", licenciaFederativa=True,
                       energia=100, lesion=None, titulo=2, peleasProfesionales=20,
                       victoriasProfesionales=18, derrotasProfesionales=2, kosProfesionales=0,
                       peleasAmateur=0, record={"v": 18, "d": 2, "e": 0, "ko": 0})
            rival = copy.deepcopy(own)
            rival.update(id="r3-old-champion", nombre="Legacy champion", titulo=3)
            fixture["ofertasPara"] = own["id"]
            fixture["ofertas"] = [{"id": "r3-incoherent", "nivel": "desafio", "bolsa": 8000,
                                    "esTitulo": 0, "rival": rival, "etiqueta": "Pelea de experiencia",
                                    "detalle": "Necesitás el curso de Televisión para aspirar a títulos internacionales."}]
            fixture["plantel"] = [own]
            cases.append(("offers-preserve-reject-explicit-regeneration", fixture, offers))
            for gear in (
                ("cuerdaVelocidad", "Cuerda de Velocidad", "Equipamiento", 700, "+10% de ganancia en Velocidad"),
                ("plataformaReaccion", "Plataforma de Reacción", "Equipamiento", 1200, "+10% de ganancia en Defensa y Eficacia"),
                ("barraProteinas", "Barra de Proteínas", "Instalaciones y Salud", 3200, "+20% de ganancia en Fuerza y +4 energía de recuperación semanal"),
            ):
                fixture = fresh_fixture(baseline)
                fixture["equipamiento"] = []
                for boxer in fixture["plantel"]:
                    boxer["energia"] = 50
                cases.append(("purchase-" + gear[0], fixture,
                              lambda p, f, s, gear=gear: purchase_gear(p, f, s, gear)))
            for width, height in VIEWPORTS:
                for name, fixture, check in cases:
                    if args.case and name not in args.case:
                        continue
                    context = browser.new_context(viewport={"width": width, "height": height})
                    context.add_init_script(DETERMINISTIC)
                    context.route("**/*", isolated_route)
                    context.add_init_script("if (!localStorage.getItem('r3-seeded')) {localStorage.setItem(" +
                                            json.dumps(KEY) + ", " + json.dumps(json.dumps(fixture)) +
                                            ");localStorage.setItem('r3-seeded','yes');}")
                    page = context.new_page()
                    page.set_default_timeout(6000)
                    errors, resources = [], []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on("requestfailed", lambda req: resources.append({"url": req.url, "error": req.failure}))
                    page.on("response", lambda res: resources.append({"url": res.url, "status": res.status}) if res.status >= 400 else None)
                    result = {"case": name, "viewport": [width, height]}
                    try:
                        page.goto(URL, wait_until="networkidle")
                        page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state !== undefined")
                        result["geometry"] = check(page, fixture, selectors)
                        assert not errors, errors
                        assert not resources, resources
                        result["status"] = "PASS"
                    except Exception:
                        result.update(status="FAIL", error=traceback.format_exc())
                        try:
                            result["dom_excerpt"] = page.locator("body").inner_text()[:6000]
                            result["offer_checkpoints"] = page.evaluate("window.__qaOfferEvidence ?? null")
                            result["geometry_at_failure"] = geometry(page, selectors)
                        except Exception as diagnostic_error:
                            result["geometry_error"] = str(diagnostic_error)
                    finally:
                        result.update(pageerrors=errors, resource_errors=resources)
                        report["cases"].append(result)
                        print(json.dumps(result, ensure_ascii=False), flush=True)
                        context.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)
    current = {str(p.relative_to(DIST)): hashlib.sha256(p.read_bytes()).hexdigest()
               for p in sorted(DIST.rglob("*")) if p.is_file()}
    report["build_unchanged"] = current == fingerprint
    report["status"] = "PASS" if current == fingerprint and all(c["status"] == "PASS" for c in report["cases"]) else "FAIL"
    report["elapsed_seconds"] = round(time.perf_counter() - started, 3)
    print(json.dumps(report, ensure_ascii=False), flush=True)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(run())
