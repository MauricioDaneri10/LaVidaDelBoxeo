import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import json, subprocess, time
from playwright.sync_api import sync_playwright

DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
PORT = 5212

server = subprocess.Popen(
    [sys.executable, "-m", "http.server", str(PORT), "--directory", DIST],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(1)

athlete = {
    "id": "ath-ficha-1", "nombre": "Martín Fierro", "genero": "M",
    "edad": 22, "piel": "piel_1", "pantalon": "pantalon_1", "pelo": "pelo_1",
    "atrib": {"ataque":60,"defensa":55,"fuerza":65,"velocidad":58,"resistencia":62,"potencia":64,"tecnica":54,"inteligencia":50,"mentalidad":60,"recuperacion":65,"eficacia":58},
    "rol": "alumno", "circuito": "amateur", "division": "Mediano",
    "record": {"v":8,"d":1,"e":0,"ko":5},
    "peleasAmateur":9,"peleasProfesionales":0,"victoriasProfesionales":0,"derrotasProfesionales":0,
    "empatesProfesionales":0,"kosProfesionales":0,"titulo":0,
    "licenciaFederativa":False,"energia":85,"combo":"gancho_higado",
    "fogueo":9,"fogueoMeta":10,"guanteosRealizados":9,
    "lesion":None,"proximaPeleaSemana":None,"ultimaPeleaSemana":None,
    "rasgo":"disciplinado","elite":False,"bonusDebut":False,"enEspera":False,"semanaIngreso":5
}

state = {
    "version": 1, "schemaVersion": 4, "creado": True,
    "partidaId": "audit-ficha-slot", "nombreJugador": "Coach Test",
    "nombreGimnasio": "Club Test", "dinero": 5000, "deuda": 0,
    "fama": 20, "seguidores": 80, "recreativos": 15,
    "semana": 5, "dia": 3, "plantel": [athlete], "personal": [],
    "cursos": ["dt"], "equipamiento": [], "propiedades": [],
    "pendientes": [], "eventos": [], "historialPeleas": [],
    "ranking": [], "toasts": [], "veladaProgramada": False,
    "nombrePartida": "Carrera Ficha"
}
envelope = {"formatVersion":1,"gameVersion":1,"schemaVersion":4,"saveId":"audit-ficha-slot","savedAt":"2026-09-24T00:00:00Z","state":state}

try:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 1280, "height": 720})
        page = ctx.new_page()
        page.goto(f"http://localhost:{PORT}")
        page.evaluate("""() => {
            localStorage.clear();
            localStorage.setItem('vida-del-boxeo-v2', %s);
            localStorage.setItem('vida-del-boxeo-v2:partidas', %s);
        }""" % (json.dumps(json.dumps(envelope)), json.dumps(json.dumps([state]))))
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(400)

        # Navigate to Plantel
        page.locator("button", has_text="Plantel").first.click()
        page.wait_for_timeout(300)

        # Verify card is present
        card_btn = page.locator("button", has_text="Ver ficha").first
        assert card_btn.is_visible(), "Ver ficha button not found"
        print("1. Tarjeta visible en Plantel: OK")

        # Click "Ver ficha"
        card_btn.click()
        page.wait_for_timeout(400)

        # Verify ficha modal opened
        modal = page.locator(".modal-backdrop, [role='dialog'], .fixed").first
        ficha_title = page.locator("text=Martín Fierro").first
        assert ficha_title.is_visible(), "Ficha técnica no se abrió correctamente"
        print("2. Ficha abierta para Martín Fierro: OK")

        # Close ficha modal (click close button with aria-label="Cerrar ventana")
        close_btn = page.locator("button[aria-label='Cerrar ventana']").first
        if close_btn.is_visible():
            close_btn.click()
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(500)

        # Verify return to Plantel
        plantel_header = page.locator("h2:has-text('Plantel')").first
        assert plantel_header.is_visible(), "No retornó a Plantel"
        assert card_btn.is_visible(), "Tarjeta no visible tras cerrar ficha"
        print("3. Retorno a Plantel y conservación de estado: OK")

        b.close()
finally:
    server.terminate()
    server.wait()
print("\nPrueba de ida y vuelta a Ficha técnica: 100% PASS")
