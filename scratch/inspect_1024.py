import http.server, socketserver, threading, time, json
from playwright.sync_api import sync_playwright

DIST = r"e:/AI Factory/projects/la-vida-del-boxeo/workspaces/phase-audit-hardening/dist"
PORT = 5206
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=DIST, **kwargs)
    def log_message(self, *args): pass

s = socketserver.TCPServer(('', PORT), H)
threading.Thread(target=s.serve_forever, daemon=True).start()
time.sleep(0.5)

envelope = {'version': 1, 'schemaVersion': 4, 'creado': True, 'partidaId': 'audit-slot', 'nombreJugador': 'Test', 'nombreGimnasio': 'Club', 'dinero': 5000, 'deuda': 0, 'fama': 15, 'seguidores': 50, 'recreativos': 12, 'semana': 5, 'dia': 3, 'plantel': [{'id': f'ath-{i}', 'nombre': f'B{i}', 'genero': 'M', 'edad': 20, 'piel': 'piel_1', 'pantalon': 'pantalon_1', 'pelo': 'pelo_1', 'atrib': {'ataque':50,'defensa':50,'fuerza':50,'velocidad':50,'resistencia':50,'potencia':50,'tecnica':50,'inteligencia':50,'mentalidad':50,'recuperacion':50,'eficacia':50}, 'rol': 'alumno', 'circuito': 'amateur', 'division': 'Welter', 'record': {'v':0,'d':0,'e':0,'ko':0}, 'peleasAmateur':0,'peleasProfesionales':0,'victoriasProfesionales':0,'derrotasProfesionales':0,'empatesProfesionales':0,'kosProfesionales':0,'titulo':0,'licenciaFederativa':False,'energia':90,'combo':'acondicionamiento','fogueo':0,'fogueoMeta':10,'guanteosRealizados':0,'lesion':None,'proximaPeleaSemana':None,'ultimaPeleaSemana':None,'rasgo':'disciplinado','elite':False,'bonusDebut':False,'enEspera':False,'semanaIngreso':5} for i in range(1, 11)], 'personal': [], 'cursos': ['dt'], 'equipamiento': [], 'propiedades': [], 'pendientes': [], 'eventos': [], 'historialPeleas': [], 'ranking': [], 'toasts': [], 'veladaProgramada': False, 'nombrePartida': 'Audit'}
save_env = {'formatVersion': 1, 'gameVersion': 1, 'schemaVersion': 4, 'saveId': 'audit-slot', 'savedAt': '2026-09-24T00:00:00Z', 'state': envelope}
raw_save = json.dumps(json.dumps(save_env))
raw_partidas = json.dumps(json.dumps([envelope]))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={'width': 1024, 'height': 600})
    page = ctx.new_page()
    page.goto(f'http://localhost:{PORT}')
    page.evaluate("""() => {
        localStorage.clear();
        localStorage.setItem('vida-del-boxeo-v2', %s);
        localStorage.setItem('vida-del-boxeo-v2:partidas', %s);
    }""" % (raw_save, raw_partidas))
    page.reload(wait_until='networkidle')
    page.wait_for_timeout(500)
    page.locator('button', has_text='Plantel').first.click()
    page.wait_for_timeout(500)

    elems = page.evaluate("""() => {
        const gs = document.querySelector('.game-screen');
        const main = document.querySelector('.app-main');
        const footer = document.querySelector('.app-footer');
        const fRect = footer ? footer.getBoundingClientRect() : null;
        const mainRect = main ? main.getBoundingClientRect() : null;
        const gsRect = gs ? gs.getBoundingClientRect() : null;

        const children = gs ? Array.from(gs.children).map((ch, i) => {
            const r = ch.getBoundingClientRect();
            return {
                i,
                tag: ch.tagName,
                cls: ch.className.slice(0, 45),
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                height: Math.round(r.height)
            };
        }) : [];

        // Also check elements above main
        const topBar = document.querySelector('.topbar-club, header');
        const nav = document.querySelector('nav');
        const forecast = document.querySelector('.forecast-strip');
        const action = document.querySelector('.action-banner');

        return {
            winH: window.innerHeight,
            main: mainRect ? { top: Math.round(mainRect.top), bottom: Math.round(mainRect.bottom), height: Math.round(mainRect.height) } : null,
            gs: gsRect ? { top: Math.round(gsRect.top), bottom: Math.round(gsRect.bottom), height: Math.round(gsRect.height) } : null,
            footer: fRect ? { top: Math.round(fRect.top), bottom: Math.round(fRect.bottom) } : null,
            aboveMain: {
                topBar: topBar ? Math.round(topBar.getBoundingClientRect().height) : 0,
                nav: nav ? Math.round(nav.getBoundingClientRect().height) : 0,
                forecast: forecast ? Math.round(forecast.getBoundingClientRect().height) : 0,
                action: action ? Math.round(action.getBoundingClientRect().height) : 0,
            },
            children
        };
    }""")
    print(json.dumps(elems, indent=2))
    b.close()
s.shutdown()
