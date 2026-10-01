"""BOX-05 browser gate: staff card capacity, pagination, hiring and dismissal."""
import os
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_save

BASE = "http://localhost:5223/"
DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
VIEWPORTS = [(1280, 720, 4), (1440, 900, 4), (1024, 600, 2), (1920, 1080, 4), (970, 900, 2)]
ROLES = ["directorTecnico", "representante", "preparador", "asistente", "difusion", "gerente", "entrenadorLocal", "coordinadorSucursal", "ojeador"]


def seed(page, people):
    save = make_save(alumnos_count=4)
    save["state"]["semana"] = 5
    save["state"]["cursos"] = ["dt", "veladas", "franquicias"]
    save["state"]["personal"] = [
        {"id": f"staff-{i}", "tipo": role, "nombre": f"Empleado {i+1}"}
        for i, role in enumerate(ROLES[:people])
    ]
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate("""save => {
      localStorage.clear();
      localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
      localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
    }""", save)
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="Personal", exact=True).click()
    page.get_by_text("Cuerpo Técnico & Empleados", exact=True).wait_for()


def seed_week_one(page):
    save = make_save(alumnos_count=4)
    save["state"]["semana"] = 1
    save["state"]["cursos"] = ["dt"]
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate("""save => {
      localStorage.clear();
      localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
      localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
    }""", save)
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="Personal", exact=True).click()
    page.get_by_text("Cuerpo Técnico & Empleados", exact=True).wait_for()


def check_geometry(page, width, height):
    values = page.evaluate("""() => {
      const grid = document.querySelector('.staff-grid');
      const header = grid?.previousElementSibling;
      const pager = grid?.nextElementSibling;
      const canvas = document.querySelector('.app-main');
      const footer = document.querySelector('.app-footer').getBoundingClientRect();
      const gr = grid.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const cards = [...grid.querySelectorAll('.staff-card')].map(card => {
        const r=card.getBoundingClientRect(), b=card.querySelector('button');
        const br=b?.getBoundingClientRect();
        return {x:r.x, y:r.y, w:r.width, h:r.height, bottom:r.bottom,
          contentOverflow:card.scrollHeight>card.clientHeight+2,
          buttonBottom:br?.bottom, buttonWidth:br?.width, text:b?.innerText};
      });
      return {viewport:[innerWidth,innerHeight], cards, header:header?{height:header.clientHeight,scrollHeight:header.scrollHeight,overflow:header.scrollHeight>header.clientHeight+2}:null,
        grid:{x:gr.x,y:gr.y,w:gr.width,h:gr.height}, pager:pager?{bottom:pager.getBoundingClientRect().bottom}:null,
        canvas:{y:cr.y,bottom:cr.bottom}, footer:{top:footer.top,bottom:footer.bottom},
        footerVisible:footer.top>=0&&footer.bottom<=innerHeight,
        docScroll:document.documentElement.scrollHeight, bodyScroll:document.body.scrollHeight};
    }""")
    assert values["footerVisible"], (width, height, values)
    assert not values["header"]["overflow"], (width, height, values)
    assert values["pager"] is None or values["pager"]["bottom"] <= values["footer"]["top"] + 1, (width, height, values)
    assert values["docScroll"] <= height + 2 and values["bodyScroll"] <= height + 2, (width, height, values)
    assert all(c["y"] >= values["canvas"]["y"] - 1 and c["bottom"] <= values["canvas"]["bottom"] + 1 for c in values["cards"]), (width, height, values)
    assert all(not c["contentOverflow"] for c in values["cards"]), (width, height, values)
    assert all(c["buttonBottom"] <= c["bottom"] + 1 and c["buttonWidth"] > 0 for c in values["cards"] if c["buttonBottom"]), (width, height, values)
    return values


def main():
    assert os.path.isdir(DIST), "Run npm run build before browser test"
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5223", "--directory", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(.7)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            for width, height, capacity in VIEWPORTS:
                for people in (0, 1, 4, 9):
                    context = browser.new_context(viewport={"width": width, "height": height})
                    page = context.new_page()
                    errors = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    seed(page, people)
                    cards = page.locator(".staff-card")
                    assert cards.count() == min(capacity, len(ROLES)), (width, height, people, cards.count())
                    check_geometry(page, width, height)
                    if people == 9:
                        seen = []
                        while True:
                            seen.extend(cards.all_inner_texts())
                            more = page.get_by_role("button", name="Más personal", exact=True)
                            if not more.is_enabled():
                                break
                            more.click()
                        for role in ("Entrenador Automático", "Representante Deportivo y Promotor", "Preparador Físico", "Asistente de Clases", "Jefe de Difusión", "Gerente de Sucursal", "Entrenador Local", "Coordinador de Sucursales", "Ojeador de Talentos"):
                            assert sum(role in card for card in seen) == 1, (width, height, role, seen)
                        page.get_by_role("button", name="Anterior", exact=True).click()
                        check_geometry(page, width, height)
                    assert not errors, (width, height, people, errors)
                    context.close()
                print(f"STAFF {width}x{height}: capacity {capacity}; 0/1/4/9 personnel cases OK")

            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            seed_week_one(page)
            assert page.locator(".staff-header span[title*='Excluye ayuda inicial']").count() == 1
            representative = page.locator(".staff-card").filter(has_text="Representante Deportivo y Promotor")
            assert "se habilita: semana 2" in representative.inner_text().lower(), representative.inner_text()
            locked_seen = []
            while True:
                for staff_card in page.locator(".staff-card").all():
                    contents = staff_card.inner_text().lower()
                    name = staff_card.locator(".font-display").first.inner_text()
                    if name != "Entrenador Automático":
                        assert "se habilita:" in contents, (name, contents)
                        assert staff_card.get_by_role("button", name="Contratar", exact=True).count() == 0, (name, contents)
                        unavailable = staff_card.get_by_role("button", name="No disponible", exact=True)
                        assert unavailable.count() == 1 and not unavailable.is_enabled(), (name, contents)
                        locked_seen.append(name)
                    else:
                        assert staff_card.get_by_role("button", name="Contratar", exact=True).is_visible()
                more = page.get_by_role("button", name="Más personal", exact=True)
                if not more.is_enabled():
                    break
                more.click()
            assert len(locked_seen) == 8, locked_seen
            context.close()

            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            seed(page, 0)
            card = page.locator(".staff-card").filter(has_text="Representante Deportivo y Promotor")
            card.get_by_role("button", name="Contratar").click()
            confirm = card.get_by_role("button", name="Contratar igualmente", exact=True)
            assert confirm.is_visible(), card.inner_text()
            assert "En contra" in card.inner_text()
            assert card.get_by_role("button", name="Revisando costo", exact=True).count() == 0
            confirm.click()
            assert "personal activo" in card.inner_text().lower() and "contratado" in card.inner_text().lower() and "despedir" in card.inner_text().lower(), card.inner_text()
            card.get_by_role("button", name="Despedir").click()
            assert "personal activo" not in card.inner_text().lower()
            assert card.get_by_role("button", name="Contratar").is_visible()
            print("STAFF actions: hire → active employee → dismiss → vacancy restored")
            context.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
