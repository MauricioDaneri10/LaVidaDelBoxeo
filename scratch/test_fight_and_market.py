"""Isolated browser regression for fight viewport and BOX-04 market capacity."""
import os
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_save, make_athlete

BASE = "http://localhost:5222/"
DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
VIEWPORTS = [(1280, 720), (1440, 900), (1024, 600), (1920, 1080), (970, 900)]


def seed_save(page, save):
    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate("""save => {
      localStorage.clear();
      localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
      localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
    }""", save)
    page.reload(wait_until="networkidle")


def test_fight(browser):
    base = make_save(amateurs_count=1)
    own = base["state"]["plantel"][0]
    rival = make_athlete(80, rol="boxeador", circuito="amateur")
    base["state"]["dia"] = 6
    base["state"]["pendientes"] = [{
        "id": "fight-layout-regression", "miId": own["id"], "rival": rival,
        "bolsa": 250, "esTitulo": 0, "velada": False,
        "semanaProgramada": base["state"]["semana"], "diaProgramado": 6,
    }]
    base["state"]["plantel"][0]["rol"] = "boxeador"
    base["state"]["plantel"][0]["licenciaFederativa"] = True

    for width, height in VIEWPORTS:
        context = browser.new_context(viewport={"width": width, "height": height})
        page = context.new_page()
        page.set_default_timeout(15000)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        seed_save(page, base)
        page.get_by_role("button", name="Noche de peleas", exact=False).click()
        page.get_by_role("button", name="¡Que suene la Campana!").click()
        button = page.get_by_role("button", name="Salir al Asalto")
        button.scroll_into_view_if_needed()
        assert button.is_visible(), (width, height, "start-round button not visible")
        layout = page.evaluate("""() => {
          const root = document.querySelector('.fight-screen-overlay');
          const button = [...root.querySelectorAll('button')].find(b => b.textContent.includes('Salir al Asalto'));
          const r = button.getBoundingClientRect();
          return {rootScroll: root.scrollHeight, rootClient: root.clientHeight,
            buttonBottom: r.bottom, viewport: innerHeight, text: button.innerText};
        }""")
        assert layout["buttonBottom"] <= height + 1, (width, height, layout)
        for next_round in (2, 3):
            button.click()
            page.get_by_text(f"Asalto {next_round} de 3", exact=True).wait_for(timeout=30000)
            button = page.get_by_role("button", name="Salir al Asalto")
            button.scroll_into_view_if_needed()
            assert button.is_visible(), (width, height, f"round {next_round} not actionable")
        button.click()
        page.get_by_text("Fallo Oficial de los Jueces", exact=True).wait_for(timeout=30000)
        page.get_by_role("button", name="Continuar Velada").scroll_into_view_if_needed()
        assert page.get_by_role("button", name="Continuar Velada").is_visible()
        assert not errors, (width, height, errors)
        print(f"FIGHT {width}x{height}: rounds 1-3 + official result OK; {layout}")
        context.close()


def test_market(browser):
    base = make_save(alumnos_count=4)
    for width, height in VIEWPORTS:
        context = browser.new_context(viewport={"width": width, "height": height})
        page = context.new_page()
        page.set_default_timeout(10000)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        seed_save(page, base)
        page.get_by_role("button", name="Mercado", exact=True).click()
        cards = page.locator(".market-card")
        count = cards.count()
        expected = 8 if width >= 1440 and height >= 850 else 6 if width >= 900 and height >= 900 else 4
        assert count == min(expected, 10), (width, height, count, expected)
        first_page_text = "\n".join(cards.all_inner_texts())
        assert cards.first.locator("button").is_visible()
        assert page.get_by_text("Mercado del Gimnasio", exact=True).is_visible()
        assert page.get_by_text("Instalado: 0/23", exact=False).is_visible()
        recommendation = page.locator(".market-card").filter(has_text="Sogas de Salto")
        assert "recomendado ahora" in recommendation.inner_text().lower()
        footer = page.locator("footer").bounding_box()
        for i in range(cards.count()):
            card = cards.nth(i)
            box = card.bounding_box()
            assert box and footer and box["x"] >= 0 and box["y"] >= 0
            assert box["x"] + box["width"] <= width + 1
            assert box["y"] + box["height"] <= footer["y"] + 1, (width, height, box, footer)
        if 10 > expected:
            assert page.get_by_role("button", name="Más", exact=True).is_enabled()
            page.get_by_role("button", name="Más", exact=True).click()
            assert cards.count() == min(expected, 10 - expected), (width, height, "equipment page 2", cards.count(), expected)
            assert "\n".join(cards.all_inner_texts()) != first_page_text
            if 10 > expected * 2:
                page.get_by_role("button", name="Más", exact=True).click()
                assert cards.count() == 10 - (expected * 2), (width, height, "equipment page 3", cards.count(), expected)
                page.get_by_role("button", name="Anterior", exact=True).click()
                assert cards.count() == min(expected, 10 - expected)
            page.get_by_role("button", name="Anterior", exact=True).click()
            assert cards.count() == expected
        capacity = expected
        for label, total_items in (("Indumentaria", 4), ("Instalaciones y Salud", 4), ("Difusión y Marca Propia", 5)):
            page.get_by_role("button", name=label, exact=False).click()
            assert cards.count() == min(capacity, total_items), (width, height, label, cards.count())
            assert all(cards.nth(i).is_visible() for i in range(cards.count()))
            if total_items > capacity:
                page.get_by_role("button", name="Más", exact=True).click()
                assert cards.count() == total_items - capacity, (width, height, label, cards.count())
                page.get_by_role("button", name="Anterior", exact=True).click()
                assert cards.count() == capacity
        assert not errors, (width, height, errors)
        print(f"MARKET {width}x{height}: {count} cards on first page; category navigation OK")
        context.close()

    # Purchase and insufficient-funds states are exercised only in disposable contexts.
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    seed_save(page, make_save(alumnos_count=4))
    page.get_by_role("button", name="Mercado", exact=True).click()
    affordable = page.locator(".market-card").filter(has_text="Sogas de Salto")
    affordable.get_by_role("button", name="Comprar").click()
    page.get_by_text("Sogas de Salto instalado", exact=False).wait_for(timeout=3000)
    assert "instalado" in affordable.inner_text().lower(), affordable.inner_text()
    context.close()

    poor = make_save(alumnos_count=4)
    poor["state"]["dinero"] = 0
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    seed_save(page, poor)
    page.get_by_role("button", name="Mercado", exact=True).click()
    unaffordable = page.locator(".market-card").filter(has_text="Sogas de Salto")
    assert unaffordable.get_by_role("button", name="Comprar").is_disabled()
    context.close()


def main():
    assert os.path.isdir(DIST), f"Run npm run build before test: {DIST}"
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5222", "--directory", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(.7)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            if os.environ.get("MARKET_ONLY") != "1":
                test_fight(browser)
            test_market(browser)
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
