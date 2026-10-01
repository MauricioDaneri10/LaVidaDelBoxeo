"""BOX-14 browser gate: career milestones and player-controlled pro transition."""
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_athlete, make_save

BASE = "http://127.0.0.1:5227/"
DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"


def seed(page, pro_count=0):
    save = make_save(amateurs_count=1, pros_count=pro_count)
    candidate = next(p for p in save["state"]["plantel"] if p["id"] == "ath-1")
    candidate["peleasAmateur"] = 50
    candidate["record"] = {"v": 32, "d": 18, "e": 0, "ko": 8}
    candidate["energia"] = 100
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate("""save => {
      localStorage.clear();
      localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
      localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
    }""", save)
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="Plantel", exact=True).click()
    page.get_by_text("Pase profesional · decisión pendiente").wait_for(state="visible") if pro_count < 10 else None


def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5227", "--directory", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(.6)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            seed(page)
            card = page.locator(".roster-card").filter(has_text="Boxeador 1")
            card.get_by_text("Pase profesional · decisión pendiente").wait_for(state="visible")
            card.locator("button").first.click()
            sheet = page.get_by_role("dialog")
            sheet.get_by_text("Trayectoria amateur completa: el pase profesional queda a decisión del jugador.").wait_for(state="visible")
            sheet.get_by_role("button", name="Aceptar pase profesional").click()
            sheet.get_by_text("Licencia Profesional").wait_for(state="visible")
            assert "50" in sheet.inner_text()
            assert not errors, errors
            print("CAREER UI: opt-in professional transition keeps the career record and updates circuit")
            context.close()

            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            seed(page, pro_count=10)
            card = page.locator(".roster-card").filter(has_text="Boxeador 1")
            card.locator("button").first.click()
            sheet = page.get_by_role("dialog")
            disabled = sheet.get_by_role("button", name="Aceptar pase profesional")
            assert disabled.is_visible() and not disabled.is_enabled()
            assert sheet.get_by_text("Cupo profesional completo: seguirá amateur hasta que liberes una plaza.").is_visible()
            print("CAREER UI: ten-pro cap blocks transition with explicit explanation")
            context.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
