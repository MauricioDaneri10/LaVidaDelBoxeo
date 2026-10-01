import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import json, http.server, socketserver, threading, time
from playwright.sync_api import sync_playwright

DIST = r"e:/AI Factory/projects/la-vida-del-boxeo/workspaces/phase-audit-hardening/dist"
PORT = 5202

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)
    def log_message(self, format, *args): pass

server = socketserver.TCPServer(('', PORT), H)
threading.Thread(target=server.serve_forever, daemon=True).start()
time.sleep(0.5)

def make_athlete(id_num, rol="alumno"):
    return {
        "id": f"ath-{id_num}", "nombre": f"Boxeador {id_num}", "genero": "M",
        "edad": 18 + (id_num % 10), "piel": "piel_1", "pantalon": "pantalon_1", "pelo": "pelo_1",
        "atrib": {"ataque":50,"defensa":50,"fuerza":50,"velocidad":50,"resistencia":50,"potencia":50,"tecnica":50,"inteligencia":50,"mentalidad":50,"recuperacion":50,"eficacia":50},
        "rol": rol, "circuito": "amateur", "division": "Welter",
        "record": {"v":5,"d":1,"e":0,"ko":3},
        "peleasAmateur":10,"peleasProfesionales":0,"victoriasProfesionales":0,"derrotasProfesionales":0,
        "empatesProfesionales":0,"kosProfesionales":0,"titulo":0,
        "licenciaFederativa": rol=="boxeador","energia":90,"combo":"acondicionamiento",
        "fogueo":4,"fogueoMeta":10,"guanteosRealizados":4,
        "lesion":None,"proximaPeleaSemana":None,"ultimaPeleaSemana":None,
        "rasgo":"disciplinado","elite":False,"bonusDebut":False,"enEspera":False,"semanaIngreso":1
    }

def make_save(total=10, fed=0):
    athletes = [make_athlete(i, "alumno") for i in range(1, total + 1)]
    state = {
        "version":1,"schemaVersion":4,"creado":True,
        "partidaId":"audit-test-slot","nombreJugador":"Coach Test",
        "nombreGimnasio":"Club Test","dinero":5000,"deuda":0,
        "fama":15,"seguidores":50,"recreativos":12,
        "semana":5,"dia":3,"plantel":athletes,"personal":[],
        "cursos":["dt"],"equipamiento":[],"propiedades":[],
        "pendientes":[],"eventos":[],"historialPeleas":[],
        "ranking":[],"toasts":[],"veladaProgramada":False,
        "nombrePartida":"Carrera Audit"
    }
    return {
        "formatVersion":1,"gameVersion":1,"schemaVersion":4,
        "saveId":"audit-test-slot","savedAt":"2026-09-24T00:00:00Z",
        "state": state
    }

envelope = make_save(10, 0)
env_json = json.dumps(envelope)
partidas_json = json.dumps([envelope["state"]])

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for vp_name, w, h in [("1280x720", 1280, 720), ("1440x900", 1440, 900), ("1024x600", 1024, 600), ("1920x1080", 1920, 1080)]:
        ctx = browser.new_context(viewport={"width": w, "height": h})
        page = ctx.new_page()
        page.goto(f"http://localhost:{PORT}")
        page.evaluate(f"""() => {{
            localStorage.clear();
            localStorage.setItem('vida-del-boxeo-v2', {json.dumps(env_json)});
            localStorage.setItem('vida-del-boxeo-v2:partidas', {json.dumps(partidas_json)});
        }}""")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(600)
        btn = page.locator("button", has_text="Plantel").first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(500)

        metrics = page.evaluate("""() => {
            const main = document.querySelector('.app-main');
            const gs = document.querySelector('.game-screen');
            const grid = document.querySelector('.plantel-grid');
            const cards = Array.from(document.querySelectorAll('.roster-card'));
            const pagination = document.querySelector('.plantel-grid + div');
            const footer = document.querySelector('.app-footer');

            // Get computed grid columns and rows
            let gridComputed = null;
            if (grid) {
                const style = window.getComputedStyle(grid);
                gridComputed = {
                    gridTemplateColumns: style.gridTemplateColumns,
                    gridTemplateRows: style.gridTemplateRows,
                    columnCount: style.gridTemplateColumns.split(' ').filter(Boolean).length,
                    rowCount: style.gridTemplateRows.split(' ').filter(Boolean).length
                };
            }

            const cardInfo = cards.map((c, i) => {
                const r = c.getBoundingClientRect();
                return {
                    i,
                    w: Math.round(r.width),
                    h: Math.round(r.height),
                    top: Math.round(r.top),
                    bottom: Math.round(r.bottom),
                    left: Math.round(r.left),
                    right: Math.round(r.right),
                    visible: r.bottom <= (gs ? gs.getBoundingClientRect().bottom + 2 : window.innerHeight) && r.top >= 0
                };
            });

            return {
                mainW: main ? Math.round(main.getBoundingClientRect().width) : 0,
                mainH: main ? Math.round(main.getBoundingClientRect().height) : 0,
                gridW: grid ? Math.round(grid.getBoundingClientRect().width) : 0,
                gridH: grid ? Math.round(grid.getBoundingClientRect().height) : 0,
                gridScrollH: grid ? grid.scrollHeight : 0,
                gsScrollH: gs ? gs.scrollHeight : 0,
                gsClientH: gs ? gs.clientHeight : 0,
                hasGsScroll: gs ? gs.scrollHeight > gs.clientHeight : false,
                gridComputed,
                cardCount: cards.length,
                allCardsVisible: cardInfo.every(c => c.visible),
                cardInfo
            };
        }""")
        print(f"\n=================== {vp_name} ===================")
        print(f"mainW: {metrics['mainW']}, mainH: {metrics['mainH']}")
        print(f"gridW: {metrics['gridW']}, gridH: {metrics['gridH']}, gridScrollH: {metrics['gridScrollH']}")
        print(f"gsClientH: {metrics['gsClientH']}, gsScrollH: {metrics['gsScrollH']}, hasGsScroll: {metrics['hasGsScroll']}")
        print(f"gridComputed: {metrics['gridComputed']}")
        print(f"cardCount: {metrics['cardCount']}, allCardsVisible: {metrics['allCardsVisible']}")
        for c in metrics['cardInfo']:
            print(f"  card {c['i']}: top={c['top']}, bottom={c['bottom']}, w={c['w']}, h={c['h']}, visible={c['visible']}")
        ctx.close()
    browser.close()
server.shutdown()
