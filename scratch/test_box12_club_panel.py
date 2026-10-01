"""BOX-12 browser gate: Club Panel notifications, pending actions and footer geometry."""
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_save

BASE = "http://127.0.0.1:5225/"
DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
VIEWPORTS = [(1280, 720), (1440, 900), (1024, 600), (970, 900), (390, 844)]


def seed(page):
    save = make_save(alumnos_count=1)
    state = save["state"]
    state["semana"], state["dia"] = 5, 3
    state["cursos"] = ["dt"]
    state["plantel"][0]["fogueo"] = 10
    state["plantel"][0]["fogueoMeta"] = 10
    state["consejos"] = [{
        "id": "c1", "texto": "Consejo listo de prueba.", "fama": 1,
        "cumplido": True, "reclamado": False,
    }]
    state["eventos"] = [{
        "id": f"evento-{i}", "tipo": "entrevista", "de": "Prensa",
        "titulo": f"Aviso de prueba {i}", "texto": "Una decisión sigue pendiente.",
        "venceEn": 3,
        "opciones": [
            {"texto": "Hablar", "accion": {"tipo": "entrevista", "fama": 2, "monto": 80}},
            {"texto": "Declinar", "accion": {"tipo": "nada"}},
        ],
    } for i in range(4)]
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate("""save => {
      localStorage.clear();
      localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
      localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
    }""", save)
    page.reload(wait_until="networkidle")


def geometry(page):
    return page.evaluate("""() => {
      const footer = document.querySelector('.app-footer').getBoundingClientRect();
      const panel = document.querySelector('.club-panel');
      const rect = panel?.getBoundingClientRect();
      const content = panel?.querySelector(':scope > .overflow-y-auto');
      return {
        viewport: [innerWidth, innerHeight], footer: {top: footer.top, bottom: footer.bottom},
        footerVisible: footer.top >= 0 && footer.bottom <= innerHeight,
        docHeight: document.documentElement.scrollHeight,
        panel: rect ? {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, height: rect.height} : null,
        panelContent: content ? {clientHeight: content.clientHeight, scrollHeight: content.scrollHeight, scrollable: content.scrollHeight > content.clientHeight + 2} : null,
      };
    }""")


def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5225", "--directory", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
                if width >= 1280:
                    panel = page.locator(".club-panel")
                    g = geometry(page)
                    assert g["footerVisible"] and g["docHeight"] <= height + 2, (width, height, g)
                    assert g["panel"]["bottom"] <= g["footer"]["top"] + 1 and g["panel"]["right"] <= width + 1, (width, height, g)
                    assert panel.get_by_role("button", name="Mensajes, 4 pendientes").count() == 1
                    panel.get_by_role("button", name="Mensajes, 4 pendientes").click()
                    assert panel.locator(".overflow-y-auto").locator("text=Aviso de prueba").count() == 4
                    assert panel.locator(".club-event-card").count() == 4
                    assert panel.get_by_label("Vence en 3 días").count() == 4
                    assert panel.locator(".club-event-card").evaluate_all("cards => cards.every(card => card.scrollHeight <= card.clientHeight + 2)")
                    panel.get_by_role("button", name="Don Anselmo, 2 pendientes").click()
                    assert panel.get_by_text("Consejo listo de prueba.").is_visible()
                    assert panel.locator(":scope > div:first-child > span.bg-blood.rounded-full").count() == 1
                    print(f"PANEL {width}x{height}: full-height bounds, four events, advice channel and footer OK")
                else:
                    tab = page.get_by_role("button", name="Don Anselmo, 2 pendientes")
                    assert tab.get_attribute("aria-expanded") == "false"
                    tab.click()
                    assert tab.get_attribute("aria-expanded") == "true"
                    advice = page.get_by_text("Consejo listo de prueba.").last
                    advice.scroll_into_view_if_needed()
                    assert advice.is_visible()
                    tab.click()
                    assert tab.get_attribute("aria-expanded") == "false"
                    assert page.locator(".app-footer").evaluate("e => {const r=e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight}")
                    assert page.evaluate("document.documentElement.scrollHeight") <= height + 2
                    print(f"PANEL {width}x{height}: opens/closes, advice accessible, footer visible")
                assert not errors, (width, height, errors)
                context.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
