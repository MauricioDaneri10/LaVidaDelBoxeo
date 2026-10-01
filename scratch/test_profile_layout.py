"""BOX-03 Mi Perfil visual/functional browser gate. Uses an isolated synthetic save."""
import json
import os
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright
from run_multi_viewport_audit import make_save

BASE = "http://localhost:5221/"
DIST = r"e:\AI Factory\projects\la-vida-del-boxeo\workspaces\phase-audit-hardening\dist"
VIEWPORTS = [(1280, 720), (1440, 900), (1024, 600), (1920, 1080), (970, 900)]


def assert_no_canvas_overflow(page, width, height):
    metrics = page.evaluate("""() => {
      const main = document.querySelector('.app-main');
      const screen = document.querySelector('.game-screen');
      const sr = screen.getBoundingClientRect();
      const footer = document.querySelector('.app-footer').getBoundingClientRect();
      const courseCards = [...document.querySelectorAll('.profile-course-card')];
      const propertyCards = [...document.querySelectorAll('.profile-property-card')];
      const outside = [...courseCards, ...propertyCards].filter(e => {
        const r = e.getBoundingClientRect();
        return r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1;
      }).map(e => {const r=e.getBoundingClientRect();return {text:e.innerText,rect:{x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}};});
      const clipped = [...courseCards, ...propertyCards].flatMap(card => [...card.querySelectorAll('*')]
        .filter(e => e.textContent?.trim())
        .filter(e => { const s=getComputedStyle(e); const clipped=((s.overflowX==='hidden'||s.overflowX==='clip'||s.textOverflow==='ellipsis')&&e.scrollWidth>e.clientWidth+2)||((s.overflowY==='hidden'||s.overflowY==='clip'||(s.webkitLineClamp&&s.webkitLineClamp!=='none'))&&e.scrollHeight>e.clientHeight+2); return clipped&&!e.title&&!e.getAttribute('aria-label')&&!e.closest('[title]'); })
        .map(e => `${e.tagName}.${String(e.className).replace(/\\s+/g,'.')}: ${e.innerText || e.textContent}`));
      return {viewport:[innerWidth,innerHeight], bodyScroll:document.documentElement.scrollHeight,
        mainScroll:main.scrollHeight, mainClient:main.clientHeight, screenScroll:screen.scrollHeight,
        screenClient:screen.clientHeight, footerVisible:footer.top >= -1 && footer.bottom <= innerHeight + 1,
        footerBottom:footer.bottom, courseCount:courseCards.length, propertyCount:propertyCards.length,
        blocks:[...document.querySelectorAll('.game-screen > *')].map(e=>{const r=e.getBoundingClientRect();return {cls:e.className,top:r.top,bottom:r.bottom,h:r.height}}),
        overflowEls:[...screen.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+2||e.getBoundingClientRect().bottom>sr.bottom+1).slice(-12).map(e=>({tag:e.tagName,cls:e.className,text:(e.innerText||'').slice(0,35),scroll:e.scrollHeight,client:e.clientHeight,bottom:Math.round(e.getBoundingClientRect().bottom),parent:e.parentElement?.className})),
        outside, clipped};
    }""")
    assert metrics["bodyScroll"] <= height + 2, metrics
    assert metrics["screenScroll"] <= metrics["screenClient"] + 2, metrics
    assert metrics["footerVisible"], metrics
    assert not metrics["outside"], metrics
    assert not metrics["clipped"], metrics
    return metrics


def main():
    report = []
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5221", "--directory", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(.75)
    try:
      with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            page.set_default_timeout(5000)
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(BASE, wait_until="domcontentloaded")
            envelope = make_save(alumnos_count=4)
            page.evaluate("""save => {
              localStorage.clear();
              localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(save));
              localStorage.setItem('vida-del-boxeo-v2:partidas', JSON.stringify([save.state]));
            }""", envelope)
            page.reload(wait_until="networkidle")
            page.get_by_role("button", name="Mi Perfil", exact=True).click()
            page.get_by_role("button", name="Cursos", exact=True).wait_for(state="visible")

            metrics = assert_no_canvas_overflow(page, width, height)
            branch_labels = ["Deportiva", "Promotora", "Empresarial"]
            for label in branch_labels:
                page.get_by_role("button", name=label, exact=True).click()
                card_text = page.locator(".profile-branch-card").inner_text()
                assert "Nv.1" in card_text and "Nv.2" in card_text and "Nv.3" in card_text, (label, card_text)
                assert page.get_by_role("button", name="Ver cursos", exact=True).count() == 0
                assert_no_canvas_overflow(page, width, height)

            page.get_by_role("button", name="Deportiva", exact=True).click()
            level2 = page.locator(".profile-course-card").nth(1)
            level3 = page.locator(".profile-course-card").nth(2)
            assert level2.locator("button").is_enabled()
            assert not level3.locator("button").is_enabled()
            level2.locator("button").click()
            assert "APROBADO" in level2.inner_text()
            assert page.get_by_text('Aprobaste "Nutrición Deportiva"', exact=False).is_visible()

            page.get_by_role("button", name="Bienes raíces", exact=True).click()
            properties = page.locator(".profile-property-card")
            assert properties.count() == 6
            property_metrics = assert_no_canvas_overflow(page, width, height)
            property_metrics["courseCount"] = 0
            property_metrics["propertyCount"] = 6

            page.get_by_role("button", name="Cursos", exact=True).click()
            page.get_by_role("button", name="Actividades del club", exact=True).click()
            assert page.get_by_text("Gran Bingo Familiar del Club", exact=True).is_visible()
            page.keyboard.press("Escape")
            assert not errors, errors
            report.append({"viewport": f"{width}x{height}", "courses": metrics["courseCount"], "properties": property_metrics["propertyCount"], "footer_visible": property_metrics["footerVisible"], "no_canvas_scroll": property_metrics["screenScroll"] <= property_metrics["screenClient"] + 2})
            context.close()
        browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)
    print(json.dumps({"BOX-03": "PASS", "scenarios": report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
