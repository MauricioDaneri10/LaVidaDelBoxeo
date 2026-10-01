"""Read-only GPU/render probe using disposable browser profiles and origin."""
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def main():
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "5233", "--bind", "127.0.0.1", "--directory", str(ROOT / "dist")],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        deadline = time.monotonic() + 5
        while True:
            if server.poll() is not None:
                raise RuntimeError("El servidor de diagnóstico no pudo iniciar en 5233")
            try:
                with urlopen("http://127.0.0.1:5233/", timeout=.5) as response:
                    if response.status == 200:
                        break
            except OSError:
                if time.monotonic() >= deadline:
                    raise RuntimeError("El servidor de diagnóstico no respondió antes del plazo")
                time.sleep(.05)
        with sync_playwright() as pw:
            for name, args in [("default", []), ("d3d11", ["--enable-gpu", "--use-angle=d3d11"])]:
                started = time.perf_counter()
                browser = pw.chromium.launch(headless=True, args=args)
                info = browser.new_browser_cdp_session().send("SystemInfo.getInfo")["gpu"]
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                page.goto("http://127.0.0.1:5233/", wait_until="networkidle")
                renderer = page.evaluate("""() => {
                  const gl = document.createElement('canvas').getContext('webgl');
                  if (!gl) return 'WebGL unavailable';
                  const ext = gl.getExtension('WEBGL_debug_renderer_info');
                  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
                }""")
                # Warm-up excluded; in-memory captures never overwrite artifacts.
                page.screenshot()
                render_started = time.perf_counter()
                for _ in range(12):
                    page.screenshot()
                render_seconds = time.perf_counter() - render_started
                print(json.dumps({"mode": name, "renderer": renderer,
                    "devices": info.get("devices"), "features": info.get("featureStatus"),
                    "aux": {k: v for k, v in info.get("auxAttributes", {}).items() if k in ["glRenderer", "glVendor", "softwareRendering", "directRendering"]},
                    "screenshots_12_seconds": round(render_seconds, 3),
                    "total_seconds": round(time.perf_counter() - started, 3)}, ensure_ascii=False), flush=True)
                browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    main()
