import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
Multi-viewport browser telemetry for BOX-02 audit.
Enhanced suite with:
- Grid density & zero empty rows verification
- Exact card bounds & intersection with grid container
- scrollHeight vs clientHeight clipping checks on text and buttons
- Multi-page interactive pagination (Siguiente -> distinct IDs -> Anterior -> exact return)
- Multi-viewport matrix across 1280x720, 1440x900, 1024x600, 1920x1080
"""
import json, subprocess, time, os

DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
assert os.path.isdir(DIST), f"dist not found at {DIST}"

PORT = 5220

def make_athlete(id_num, rol="alumno", circuito="amateur"):
    return {
        "id": f"ath-{id_num}",
        "nombre": f"Boxeador {id_num}",
        "genero": "M",
        "edad": 18 + (id_num % 10),
        "piel": "piel_1", "pantalon": "pantalon_1", "pelo": "pelo_1",
        "atrib": {
            "ataque": 50, "defensa": 50, "fuerza": 50, "velocidad": 50,
            "resistencia": 50, "potencia": 50, "tecnica": 50, "inteligencia": 50,
            "mentalidad": 50, "recuperacion": 50, "eficacia": 50
        },
        "rol": rol, "circuito": circuito, "division": "Welter",
        "record": {"v": 5, "d": 1, "e": 0, "ko": 3},
        "peleasAmateur": 10, "peleasProfesionales": 0,
        "victoriasProfesionales": 0, "derrotasProfesionales": 0,
        "empatesProfesionales": 0, "kosProfesionales": 0,
        "titulo": 0,
        "licenciaFederativa": rol == "boxeador",
        "energia": 90, "combo": "acondicionamiento",
        "fogueo": 4, "fogueoMeta": 10, "guanteosRealizados": 4,
        "lesion": None, "proximaPeleaSemana": None, "ultimaPeleaSemana": None,
        "rasgo": "disciplinado", "elite": False, "bonusDebut": False,
        "enEspera": False, "semanaIngreso": 5
    }

def make_save(alumnos_count=0, amateurs_count=0, pros_count=0):
    athletes = []
    idx = 1
    for _ in range(amateurs_count):
        athletes.append(make_athlete(idx, rol="boxeador", circuito="amateur"))
        idx += 1
    for _ in range(pros_count):
        athletes.append(make_athlete(idx, rol="boxeador", circuito="pro"))
        idx += 1
    for _ in range(alumnos_count):
        athletes.append(make_athlete(idx, rol="alumno"))
        idx += 1

    state = {
        "version": 1, "schemaVersion": 4, "creado": True,
        "partidaId": "audit-test-slot", "nombreJugador": "Coach Test",
        "nombreGimnasio": "Club Test", "dinero": 5000, "deuda": 0,
        "fama": 15, "seguidores": 50, "recreativos": 12,
        "semana": 5, "dia": 3, "plantel": athletes, "personal": [],
        "cursos": ["dt"], "equipamiento": [], "propiedades": [],
        "pendientes": [], "eventos": [], "historialPeleas": [],
        "ranking": [], "toasts": [], "veladaProgramada": False,
        "nombrePartida": "Carrera Audit"
    }
    return {
        "formatVersion": 1, "gameVersion": 1, "schemaVersion": 4,
        "saveId": "audit-test-slot", "savedAt": "2026-09-24T00:00:00Z",
        "state": state
    }

VIEWPORTS = [
    {"name": "Desktop Estándar", "w": 1280, "h": 720},
    {"name": "Desktop Amplio",   "w": 1440, "h": 900},
    {"name": "Viewport Bajo",    "w": 1024, "h": 600},
    {"name": "Full HD",          "w": 1920, "h": 1080},
]

SCENARIOS = [
    {"name": "4 Alumnos",                         "alumnos": 4,  "amateurs": 0,  "pros": 0,  "filtro": None},
    {"name": "10 Alumnos",                        "alumnos": 10, "amateurs": 0,  "pros": 0,  "filtro": None},
    {"name": "Mixto (2 Federados + 8 Alumnos)",   "alumnos": 8,  "amateurs": 2,  "pros": 0,  "filtro": None},
    {"name": "Máximo (10 Amateurs + 10 Pros)",    "alumnos": 0,  "amateurs": 10, "pros": 10, "filtro": "federados"},
]

def inspect_page_state(page):
    """Evalúa la geometría, bounding boxes, scroll y clipping dentro de la página."""
    return page.evaluate("""() => {
        const winH = window.innerHeight;
        const winW = window.innerWidth;
        const docScrollH = document.documentElement.scrollHeight;
        const bodyScrollH = document.body.scrollHeight;

        const gameScreen = document.querySelector('.game-screen');
        const screenScrollH = gameScreen ? gameScreen.scrollHeight : -1;
        const screenClientH = gameScreen ? gameScreen.clientHeight : -1;

        const footer = document.querySelector('.app-footer') || document.querySelector('footer');
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const footerVisible = footerRect
            ? (footerRect.bottom <= winH + 2 && footerRect.top >= 0)
            : false;

        const grid = document.querySelector('.plantel-grid');
        const gridRect = grid ? grid.getBoundingClientRect() : null;
        let cols = 0, rows = 0;
        let colWidths = [], rowHeights = [];
        if (grid) {
            const cs = window.getComputedStyle(grid);
            colWidths = cs.gridTemplateColumns.split(' ').filter(Boolean).map(x => parseFloat(x));
            rowHeights = cs.gridTemplateRows.split(' ').filter(Boolean).map(x => parseFloat(x));
            cols = colWidths.length;
            rows = rowHeights.length;
        }

        const cards = Array.from(document.querySelectorAll('.roster-card'));
        const cardDetails = cards.map((c, i) => {
            const r = c.getBoundingClientRect();
            const nameEl = c.querySelector('button .font-display');
            const btns = Array.from(c.querySelectorAll('button[type="button"]')).filter(b => !b.contains(nameEl));

            // Check within grid container
            const insideGrid = gridRect ? (
                r.top >= gridRect.top - 1.5 &&
                r.bottom <= gridRect.bottom + 1.5 &&
                r.left >= gridRect.left - 1.5 &&
                r.right <= gridRect.right + 1.5
            ) : false;

            // Check within viewport
            const inViewport = r.bottom <= winH + 1 && r.top >= 0;

            // Detect clipped visible text across the whole card, including button labels.
            // Ellipsis/line-clamp is permitted only when the clipped text has an accessible title.
            const clippedText = [];
            for (const el of [c, ...Array.from(c.querySelectorAll('*'))]) {
                if (!el.textContent?.trim()) continue;
                const s = window.getComputedStyle(el);
                const clipsX = ['hidden', 'clip'].includes(s.overflowX) || s.textOverflow === 'ellipsis';
                const clipsY = ['hidden', 'clip'].includes(s.overflowY) || (s.webkitLineClamp && s.webkitLineClamp !== 'none');
                const overflowX = clipsX && el.scrollWidth > el.clientWidth + 2;
                const overflowY = clipsY && el.scrollHeight > el.clientHeight + 2;
                if (overflowX || overflowY) {
                    const hasAccessibleFullText = !!(el.getAttribute('title') || el.getAttribute('aria-label') || el.closest('[title], [aria-label]'));
                    if (!hasAccessibleFullText) clippedText.push(`${el.tagName}.${String(el.className || '').replace(/\\s+/g, '.')}:${(el.innerText || el.textContent).trim().slice(0, 50)}:${el.scrollWidth}x${el.scrollHeight}/${el.clientWidth}x${el.clientHeight}`);
                }
            }

            // Action controls and their labels must remain inside the card and unclipped.
            const btnsOk = btns.every(b => {
                const br = b.getBoundingClientRect();
                const label = (b.innerText || '').trim();
                const labelClipped = b.scrollWidth > b.clientWidth + 2 || b.scrollHeight > b.clientHeight + 2;
                const hasAccessibleLabel = !!(b.getAttribute('aria-label') || b.getAttribute('title') || label);
                if (labelClipped) clippedText.push(`button:${label}:${b.scrollWidth}x${b.scrollHeight}/${b.clientWidth}x${b.clientHeight}`);
                return br.width > 0 && br.height > 0 && br.bottom <= r.bottom + 1.5 && !labelClipped && hasAccessibleLabel;
            });

            return {
                index: i,
                athleteName: nameEl ? nameEl.innerText.trim() : null,
                w: Math.round(r.width),
                h: Math.round(r.height),
                insideGrid,
                inViewport,
                clippedText,
                btnsOk
            };
        });

        const athleteNames = cardDetails.map(c => c.athleteName).filter(Boolean);
        const allCardsInsideGrid = !!gridRect && cardDetails.every(c => c.insideGrid);
        const allCardsInViewport = cardDetails.every(c => c.inViewport);
        const allCardsNoClip = cardDetails.every(c => c.clippedText.length === 0 && c.btnsOk);

        // Zero empty rows verification:
        // The rows rendered must equal Math.ceil(cards.length / cols)
        const expectedRows = cards.length === 0 ? rows : (cols > 0 ? Math.ceil(cards.length / cols) : 0);
        const noEmptyRows = rows === expectedRows;

        const hasPagination = !!document.querySelector('.plantel-grid + div button');

        return {
            winW, winH,
            hasBodyScroll: docScrollH > winH + 2 || bodyScrollH > winH + 2,
            hasScreenScroll: screenScrollH > screenClientH + 2,
            screenScrollH, screenClientH,
            footerVisible,
            cols, rows,
            cardsRendered: cards.length,
            allCardsInsideGrid,
            allCardsInViewport,
            allCardsNoClip,
            noEmptyRows,
            hasPagination,
            athleteNames,
            cardDetails
        };
    }""")

def run_audit():
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--directory", DIST],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    time.sleep(1)

    results = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            for vp in VIEWPORTS:
                for sc in SCENARIOS:
                    ctx = browser.new_context(
                        viewport={"width": vp["w"], "height": vp["h"]},
                        device_scale_factor=1
                    )
                    page = ctx.new_page()

                    envelope = make_save(sc["alumnos"], sc["amateurs"], sc["pros"])
                    env_json = json.dumps(envelope)
                    partidas_json = json.dumps([envelope["state"]])

                    page.goto(f"http://localhost:{PORT}", wait_until="domcontentloaded")
                    page.evaluate("""() => {
                        localStorage.clear();
                        localStorage.setItem('vida-del-boxeo-v2', %s);
                        localStorage.setItem('vida-del-boxeo-v2:partidas', %s);
                    }""" % (json.dumps(env_json), json.dumps(partidas_json)))

                    page.reload(wait_until="networkidle")
                    page.wait_for_timeout(400)

                    plantel_btn = page.locator("button", has_text="Plantel").first
                    if plantel_btn.is_visible():
                        plantel_btn.click()
                        page.wait_for_timeout(350)

                    if sc.get("filtro"):
                        tab = page.locator(f"button:has-text('{sc['filtro'].capitalize()}')").first
                        if tab.is_visible():
                            tab.click()
                            page.wait_for_timeout(300)

                    # Expected identities are derived independently from the synthetic save.
                    # The default "Todos" filter orders federated boxers first, then pupils.
                    if sc.get("filtro") == "federados":
                        expected_names = [f"Boxeador {i}" for i in range(1, sc["amateurs"] + sc["pros"] + 1)]
                    else:
                        expected_names = [f"Boxeador {i}" for i in range(1, sc["amateurs"] + sc["pros"] + sc["alumnos"] + 1)]

                    # Walk every page forward and backward; assert exact identities and counts.
                    first = inspect_page_state(page)
                    page_capacity = first["cols"] * first["rows"]
                    expected_page_count = max(1, (len(expected_names) + page_capacity - 1) // page_capacity)
                    page_states = [first]
                    pagination_ok = True
                    return_to_first_exact = False

                    for page_index in range(expected_page_count):
                        current = page_states[-1]
                        expected_slice = expected_names[page_index * page_capacity:(page_index + 1) * page_capacity]
                        if current["athleteNames"] != expected_slice or current["cardsRendered"] != len(expected_slice):
                            pagination_ok = False
                        if page_index < expected_page_count - 1:
                            next_btn = page.locator(".plantel-grid + div button").filter(has_text="Siguiente").first
                            if not next_btn.count() or not next_btn.is_visible() or next_btn.is_disabled():
                                pagination_ok = False
                                break
                            next_btn.click()
                            page.wait_for_timeout(100)
                            page_states.append(inspect_page_state(page))

                    # Walk back and require exact page identity/count on every return.
                    if len(page_states) == expected_page_count:
                        return_to_first_exact = expected_page_count == 1
                        for page_index in range(expected_page_count - 2, -1, -1):
                            previous_btn = page.locator(".plantel-grid + div button").filter(has_text="Anterior").first
                            if not previous_btn.count() or not previous_btn.is_visible() or previous_btn.is_disabled():
                                pagination_ok = False
                                break
                            previous_btn.click()
                            page.wait_for_timeout(100)
                            returned = inspect_page_state(page)
                            expected_slice = expected_names[page_index * page_capacity:(page_index + 1) * page_capacity]
                            if returned["athleteNames"] != expected_slice or returned["cardsRendered"] != len(expected_slice):
                                pagination_ok = False
                            page_states[page_index] = returned
                            if page_index == 0:
                                return_to_first_exact = returned["athleteNames"] == first["athleteNames"]
                    else:
                        pagination_ok = False

                    # Pagination controls must match the expected number of pages exactly.
                    final_state = inspect_page_state(page)
                    pagination_present = final_state["hasPagination"]
                    pagination_ok = pagination_ok and return_to_first_exact and (pagination_present == (expected_page_count > 1))
                    m1 = page_states[0]
                    last_metrics = page_states[-1]

                    # Overall status calculation
                    no_scroll = not m1["hasBodyScroll"] and not m1["hasScreenScroll"]
                    footer_ok = m1["footerVisible"] is True
                    grid_in_bounds = m1["allCardsInsideGrid"] is True
                    no_clip = m1["allCardsNoClip"] is True
                    density_ok = m1["noEmptyRows"] is True
                    later_pages_ok = all(
                        not m["hasBodyScroll"] and not m["hasScreenScroll"] and m["footerVisible"] and
                        m["allCardsInsideGrid"] and m["allCardsNoClip"] and m["noEmptyRows"]
                        for m in page_states
                    )

                    status = "PASS" if (no_scroll and footer_ok and grid_in_bounds and no_clip and density_ok and pagination_ok and later_pages_ok) else "FAIL"

                    results.append({
                        "viewport": vp["name"],
                        "resolution": f"{vp['w']}x{vp['h']}",
                        "scenario": sc["name"],
                        "status": status,
                        "cards": m1["cardsRendered"],
                        "grid": f"{m1['cols']}x{m1['rows']}",
                        "noEmptyRows": m1["noEmptyRows"],
                        "allCardsInsideGrid": m1["allCardsInsideGrid"],
                        "noClip": m1["allCardsNoClip"],
                        "footerVisible": m1["footerVisible"],
                        "noScroll": no_scroll,
                        "paginationOk": pagination_ok,
                        "expectedPages": expected_page_count,
                        "pageCounts": [m["cardsRendered"] for m in page_states],
                        "pageNames": [m["athleteNames"] for m in page_states],
                        "returnToFirstExact": return_to_first_exact,
                        "lastPageNames": last_metrics["athleteNames"],
                        "clipDiagnostics": [d for card in m1["cardDetails"] for d in card["clippedText"]][:8]
                    })

                    ctx.close()

            browser.close()
    finally:
        server.terminate()
        server.wait()

    return results

if __name__ == "__main__":
    data = run_audit()
    print("\n=== AUDITORÍA RIGUROSA MULTI-VIEWPORT – PLAYWRIGHT HEADLESS ===")
    header = f"{'Viewport':<18} {'Res':<10} {'Escenario':<32} {'Status':<6} {'Cards':<6} {'Grid':<6} {'NoEmpty':<8} {'InGrid':<7} {'NoClip':<7} {'Footer':<7} {'Pagin':<7}"
    print(header)
    print("-" * len(header))
    all_passed = True
    for r in data:
        if r["status"] != "PASS": all_passed = False
        print(
            f"{r['viewport']:<18} "
            f"{r['resolution']:<10} "
            f"{r['scenario']:<32} "
            f"{r['status']:<6} "
            f"{r['cards']:<6} "
            f"{r['grid']:<6} "
            f"{str(r['noEmptyRows']):<8} "
            f"{str(r['allCardsInsideGrid']):<7} "
            f"{str(r['noClip']):<7} "
            f"{str(r['footerVisible']):<7} "
            f"{str(r['paginationOk']):<7}"
        )
    print(f"\nResultado global: {'100% PASS' if all_passed else 'REVISAR FALLOS'}")
    print("\n--- Resumen Detallado ---")
    print(json.dumps(data, indent=2, ensure_ascii=False))
    if not all_passed:
        raise SystemExit(1)
