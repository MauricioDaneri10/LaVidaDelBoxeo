"""BOX-13 browser gate: civil calendar, day agenda, active-event list and canvas geometry."""
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_athlete, make_save

BASE = "http://127.0.0.1:5226/"
DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
VIEWPORTS = [(1280, 720), (1440, 900), (1024, 600), (970, 900), (390, 844)]


def seed(page, dia=3, agenda=True):
    save = make_save(alumnos_count=1)
    state = save["state"]
    state["semana"], state["dia"] = 5, dia
    state["comunitarios"] = [{"tipo": "bingo", "nombre": "Bingo del Club"}] if agenda else []
    state["veladaProgramada"] = False
    state["pendientes"] = []
    state["eventos"] = [{
        "id": "cal-evento", "tipo": "entrevista", "de": "Radio Guante",
        "titulo": "Entrevista de prueba", "texto": "Un aviso vigente para probar el calendario.",
        "venceEn": 2, "opciones": [{"texto": "Declinar", "accion": {"tipo": "nada"}}],
    }]
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate("""save => {
      localStorage.clear();
      localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
      localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
    }""", save)
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="Calendario", exact=True).click()
    page.get_by_role("heading", name="Calendario del club").wait_for()


def geometry(page):
    return page.evaluate("""() => {
      const footer = document.querySelector('.app-footer').getBoundingClientRect();
      const main = document.querySelector('.app-main').getBoundingClientRect();
      const grid = document.querySelector('.calendar-grid');
      const gr = grid.getBoundingClientRect();
      const days = [...grid.children].map(d => {
        const r=d.getBoundingClientRect();
        return {left:r.left, right:r.right, top:r.top, bottom:r.bottom,
          width:r.width, scrollWidth:d.scrollWidth, clientWidth:d.clientWidth,
          scrollHeight:d.scrollHeight, clientHeight:d.clientHeight};
      });
      return {viewport:[innerWidth,innerHeight], footer:{top:footer.top,bottom:footer.bottom},
        footerVisible:footer.top>=0&&footer.bottom<=innerHeight, documentHeight:document.documentElement.scrollHeight,
        main:{top:main.top,bottom:main.bottom}, grid:{left:gr.left,right:gr.right,top:gr.top,bottom:gr.bottom}, days};
    }""")


def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5226", "--directory", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(.6)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            for width, height in VIEWPORTS:
                context = browser.new_context(viewport={"width": width, "height": height})
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                seed(page)
                values = geometry(page)
                assert values["footerVisible"] and values["documentHeight"] <= height + 2, (width, height, values)
                assert len(values["days"]) == 7 and values["grid"]["top"] >= values["main"]["top"] - 1
                assert values["grid"]["right"] <= width + 1, (width, values)
                assert page.locator(".calendar-grid > div").nth(0).inner_text().splitlines()[:2] == ["LUN", "2"], page.locator(".calendar-grid > div").nth(0).inner_text()
                saturday = page.locator(".calendar-grid > div").nth(5).inner_text()
                sunday = page.locator(".calendar-grid > div").nth(6).inner_text()
                assert "Guanteo" in saturday, (width, saturday)
                assert "Bingo del Club" in sunday and "Balance" not in sunday, (width, sunday)
                active = page.get_by_role("region", name="Agenda y avisos activos")
                assert active.get_by_text("Entrevista de prueba").is_visible()
                assert active.get_by_label("Vence en 2 días").count() == 1
                if (width, height) == (1280, 720):
                    list_box = page.locator(".calendar-agenda-list").bounding_box()
                    button_box = active.get_by_role("button", name="Declinar").bounding_box()
                    assert button_box["y"] + button_box["height"] <= list_box["y"] + list_box["height"] + 1, (list_box, button_box)
                    page.screenshot(path="scratch/box13-calendar-1280x720.png", full_page=True)
                assert not errors, (width, height, errors)
                print(f"CALENDAR {width}x{height}: date/day map, sparring, community activity, event deadline and footer OK")
                context.close()

            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            seed(page, dia=7, agenda=False)
            next_action = page.locator(".calendar-summary").inner_text()
            assert "Revisar balance" in next_action, next_action
            context.close()

            # Calendar event decisions use the same reducer/state as the Club Panel.
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            page = context.new_page()
            seed(page)
            agenda = page.get_by_role("region", name="Agenda y avisos activos")
            assert agenda.get_by_text("Entrevista de prueba").is_visible()
            agenda.get_by_role("button", name="Declinar").click()
            assert agenda.get_by_text("Entrevista de prueba").count() == 0
            assert page.get_by_text("No hay actividades ni avisos pendientes.").count() == 0  # Bingo remains active.
            context.close()

            # Fight cancellation is a deliberate two-step action; retaining is non-mutating.
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            page = context.new_page()
            save = make_save(amateurs_count=1)
            fight = {"id": "fight-test", "miId": "ath-1", "rival": make_athlete(99, "boxeador", "amateur"),
                     "bolsa": 500, "esTitulo": 0, "velada": False, "semanaProgramada": 5, "diaProgramado": 6}
            save["state"]["semana"], save["state"]["dia"] = 5, 3
            save["state"]["pendientes"] = [fight]
            save["state"]["eventos"] = []
            page.goto(BASE, wait_until="domcontentloaded")
            page.evaluate("""save => { localStorage.clear(); localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
                localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state])); }""", save)
            page.reload(wait_until="networkidle")
            page.get_by_role("button", name="Calendario", exact=True).click()
            agenda = page.get_by_role("region", name="Agenda y avisos activos")
            pelea = agenda.locator("article").filter(has_text="Pelea: Boxeador 99")
            assert pelea.is_visible()
            pelea.get_by_role("button", name="Bajar pelea").click()
            assert pelea.get_by_text("¿Bajar esta pelea?").is_visible()
            pelea.get_by_role("button", name="Conservar").click()
            assert pelea.get_by_role("button", name="Bajar pelea").is_visible()
            pelea.get_by_role("button", name="Bajar pelea").click()
            pelea.get_by_role("button", name="Sí, bajar pelea").click()
            assert agenda.get_by_text("Pelea: Boxeador 99").count() == 0
            assert "Peleas agendadas\n0" in page.locator(".calendar-summary").inner_text()
            context.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
