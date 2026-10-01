# Pruebas auxiliares y evidencia

## Regresión actual R1

`test_r1_persistence.py` prueba promoción/recarga, baja archivada y fallos de almacenamiento con Playwright/Chromium en contextos sintéticos. Raíz derivada del propio archivo, build en `dist`, puerto aislado 5231. No utiliza perfiles reales ni `localhost:3000`.

Las capturas `r1_archive_1280.png` y `r1_archive_1440.png` son evidencia de fixtures QA, no partidas del propietario. Tests Vitest vigentes: `src/game/game.test.ts` y `src/game/r1.test.ts`.

## Regresión y diagnóstico R2

`test_r2_combat.py` conserva las assertions de recarga parcial/final, caída recuperable del último intercambio y resultado único en 1280×720/1440×900. Build en `dist`, puerto 5232, datos sintéticos y contextos nuevos. GPU/D3D11 en Windows; `R2_GPU=0` para software. `probe_r2_gpu.py` mide CDP/WebGL y capturas en memoria en el puerto 5233; el modo D3D11 es un diagnóstico Windows, no una promesa de aceleración portable. Ambos esperan disponibilidad HTTP observable antes de iniciar, con plazo acotado. No generan capturas versionables ni usan el puerto 3000. Requieren Python y Playwright/Chromium; no son parte de `npm run verify`. Evidencia: informes 46 y 47.

## Evidencia histórica (BOX y auditorías anteriores)

Los restantes scripts y capturas pertenecen a auditorías y BOX previos. Algunas sondas de `integral_probes.audit.ts` afirman deliberadamente defectos del baseline anterior: **no son assertions vigentes ni parte de npm run verify**, y pueden fallar después de reparar esos defectos. Su configuración está separada en `audit-vitest.config.mjs`.

Algunos scripts históricos contienen rutas Windows del entorno original y fixtures antiguos; inspeccionar rutas, puerto y origen antes de usarlos. No ejecutarlos como reemplazo de los tests actuales ni apuntarlos al guardado real. Se conservan para rastrear cómo se midieron problemas anteriores, sin alterar su evidencia.

Cachés de Python y tres helpers locales de reescritura puntual (`apply_plantel_layout.py`, `compact_plantel.py`, `update_game_tests.py`) quedan ignorados y conservados en disco: no son tests ni pasos necesarios de build.
