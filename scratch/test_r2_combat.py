"""R2 acceptance on a disposable origin/profile. Build first; never uses port 3000."""
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = Path(os.environ.get("R2_DIST", str(ROOT / "dist")))
URL = "http://127.0.0.1:5232/"
KEY = "vida-del-boxeo-v2"


def open_bill(page):
    navigation = page.locator('.app-nav select')
    if navigation.count(): navigation.select_option(value='contexto-cartelera')
    else: page.get_by_role('button', name='Noche de peleas', exact=False).click()


def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", "5232", "--bind", "127.0.0.1", "--directory", str(DIST)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        deadline = time.monotonic() + 5
        while True:
            if server.poll() is not None:
                raise RuntimeError("El servidor QA no pudo iniciar en 5232")
            try:
                with urlopen(URL, timeout=.5) as response:
                    if response.status == 200:
                        break
            except OSError:
                if time.monotonic() >= deadline:
                    raise RuntimeError("El servidor QA no respondió antes del plazo")
                time.sleep(.05)
        with sync_playwright() as pw:
            # Windows headless Chromium otherwise defaults to software rendering.
            # R2_GPU=0 retains a portable software fallback for diagnostics.
            gpu_args = ["--enable-gpu", "--use-angle=d3d11"] if sys.platform == "win32" and os.environ.get("R2_GPU", "1") != "0" else []
            browser = pw.chromium.launch(headless=True, args=gpu_args)
            ctx = browser.new_context(); page = ctx.new_page(); page.goto(URL)
            page.wait_for_function("localStorage.getItem('vida-del-boxeo-v2') !== null")
            s = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state")
            s.update(creado=True, nombreJugador="QA R2", nombreGimnasio="Fixture R2", partidaId="fixture-r2", nombrePartida="Fixture", dia=6, semana=1, cursos=["dt"], toasts=[], eventos=[])
            p = s["plantel"][0]; p.update(id="r2-own", nombre="Propio QA", rol="boxeador", licenciaFederativa=True, circuito="amateur", energia=100, lesion=None, rasgo="", bonusDebut=False)
            p["atrib"] = {k: 70 for k in p["atrib"]}
            rival = json.loads(json.dumps(p)); rival.update(id="r2-rival", nombre="Rival QA")
            rival["atrib"] = {k: 1 for k in rival["atrib"]}
            s["plantel"] = [p]
            s["pendientes"] = [{"id": "r2-last-knockdown", "miId": p["id"], "rival": rival, "bolsa": 600, "esTitulo": 0, "velada": False, "semanaProgramada": 1, "diaProgramado": 6}]
            ctx.close()
            for width, height in [(1280, 720), (1440, 900)]:
                ctx = browser.new_context(viewport={"width": width, "height": height})
                # Seed 72 is also covered by the deterministic engine regression.
                # Speed up animation only, not simulation or civil time.
                ctx.add_init_script("""(() => {
                  const initial = STATE;
                  if (!localStorage.getItem('r2-seeded')) {
                    localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(initial));
                    localStorage.setItem('r2-seeded', 'yes');
                  }
                  Math.random = () => .12;
                  const timeout = window.setTimeout;
                  window.__qaTimerNormal = timeout;
                  window.setTimeout = (fn, ms, ...args) => timeout(fn, ms >= 200 && ms <= 750 ? 15 : ms, ...args);
                })();""".replace("STATE", json.dumps(s)))
                page = ctx.new_page(); errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto(URL, wait_until="networkidle")
                open_bill(page)
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo !== null")
                # Synthetic checkpoint on the disposable origin only. Never a user's save.
                fixture = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state")
                combat = fixture["combateActivo"]
                combat["semillaAzar"] = 72
                combat["A"].update(poderDmg=18.2, precision=1, plan="equilibrado")
                combat["B"].update(hp=100, hpMax=100, evasion=0, precision=0, plan="equilibrado")
                page.evaluate("s => localStorage.setItem('vida-del-boxeo-v2', JSON.stringify(s))", fixture)
                page.reload(wait_until="networkidle")
                open_bill(page)
                page.evaluate("window.setTimeout = (fn, ms, ...args) => window.__qaTimerNormal(fn, ms >= 200 && ms <= 750 ? 500 : ms, ...args)")
                page.get_by_role("button", name="Salir al Asalto", exact=True).click()
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo.intercambiosAsalto === 1")
                partial = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo")
                page.reload(wait_until="networkidle")
                open_bill(page)
                assert page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo") == partial
                print(f"PASS A17 {width}x{height}: recarga en intercambio parcial no repite golpes ni cura")
                page.get_by_role("button", name="Salir al Asalto", exact=True).click()
                page.get_by_text("Asalto 2 de 3", exact=True).wait_for(timeout=12000)
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo.asalto === 2")
                checkpoint = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo")
                assert checkpoint["B"]["caidas"] == 1 and checkpoint["B"]["hp"] > 0
                print(f"PASS A17 {width}x{height}: última caída recuperable → esquina siguiente")
                page.reload(wait_until="networkidle")
                open_bill(page)
                assert page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo") == checkpoint
                page.get_by_text("Asalto 2 de 3", exact=True).wait_for()
                print(f"PASS A17 {width}x{height}: recarga conserva salud, tarjetas, caídas, asalto y semilla")
                page.evaluate("window.setTimeout = (fn, ms, ...args) => window.__qaTimerNormal(fn, ms >= 200 && ms <= 750 ? 500 : ms, ...args)")
                page.get_by_role("button", name="Salir al Asalto", exact=True).click()
                page.get_by_role("button", name="Simular", exact=False).first.click()
                page.get_by_text("Fallo Oficial de los Jueces", exact=True).wait_for()
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo.finalizada")
                final_checkpoint = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo")
                page.reload(wait_until="networkidle")
                open_bill(page)
                page.get_by_text("Fallo Oficial de los Jueces", exact=True).wait_for()
                assert page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.combateActivo") == final_checkpoint
                page.get_by_role("button", name="Continuar Velada", exact=True).click()
                page.wait_for_function("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state.pendientes.length === 0")
                saved = page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state")
                assert saved["stats"]["peleas"] == 1 and len(saved["historial"]) == 1
                assert saved["combateActivo"] is None
                assert saved["plantel"][0]["record"]["v"] == 1
                page.reload(wait_until="networkidle")
                assert page.evaluate("JSON.parse(localStorage.getItem('vida-del-boxeo-v2')).state") == saved
                assert not errors, errors
                print(f"PASS A14/R1 {width}x{height}: resultado aplicado una vez y recarga exacta")
                ctx.close()
            browser.close()
    finally:
        server.terminate(); server.wait(timeout=5)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
