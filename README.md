# La Vida del Boxeo · MadArt Studios

Prototipo web de gestión de un gimnasio y carreras de boxeo. Esta rama contiene el estado de trabajo completo hasta **Gate R1 — Partidas/carrera**; no es una aprobación integral ni una versión final del juego.

## Clonar el estado actual

```sh
git clone --branch feature/audit-hardening https://github.com/MauricioDaneri10/LaVidaDelBoxeo.git
cd LaVidaDelBoxeo
npm ci
npm run verify
npm run dev
```

Usar **Node.js 22.12 o superior dentro de la rama 22**, como el workflow de verificación. Vitest 5 requiere `^22.12.0 || ^24.0.0 || >=26.0.0`; Node 20 no es compatible con este lockfile. `npm run dev` usa el puerto 3000. Las partidas se guardan en el navegador; Git no incluye datos de jugadores, perfiles ni partidas reales.

La rama `main` y GitHub Pages no se actualizan al publicar esta rama de trabajo. El workflow existente de Pages se ejecuta al publicar en `main` o mediante ejecución manual autorizada. La build de Pages utiliza `VITE_BASE_PATH=/LaVidaDelBoxeo/`; `dist` se genera, no se versiona.

## Verificación

```sh
npm run verify
npm test -- src/game/r1.test.ts
npm test -- src/game/game.test.ts
```

Referencia al publicar: **60 tests R1 + 73 previos = 133 PASS**, TypeScript, build, presupuesto y auditoría estructural PASS. El resultado se debe repetir, no asumir a partir del documento.

Aceptación R1 en navegador, opcional y separada de `npm run verify`:

```sh
python -m venv .venv
# Activar .venv según el sistema operativo antes de instalar.
python -m pip install playwright
python -m playwright install chromium
python scratch/test_r1_persistence.py
```

El script sirve la build en `127.0.0.1:5231`, necesita ese puerto libre y usa contextos nuevos con datos sintéticos. Ejecutar `npm run build` previamente; nunca trasladar las pruebas al perfil o almacenamiento del propietario.

## Continuar el proyecto

Leer primero [el estado publicado](docs/context/ESTADO_PUBLICADO_R1.md), los cinco [documentos canónicos](docs/canonical/), la [auditoría integral 44](docs/audits/44_Auditoria_Integral_Pre_BOX-15_2026-10-01.md) y el [cierre R1](docs/audits/45_Gate_R1_Partidas_Carrera_2026-10-01.md).

R2, R3, R4 y R5 continúan abiertos. **No iniciar BOX-15 ni otro gate sin autorización.** Los informes anteriores son evidencia histórica, no certificación vigente de todo el juego. Este snapshot integra trabajo anterior y R1 en archivos compartidos; no atribuir todo su diff a R1.

`scratch/` contiene pruebas auxiliares y capturas; consultar su README antes de ejecutar scripts históricos. Los scripts gráficos de `scripts/` son herramientas previas opcionales con rutas/dependencias locales; no se ejecutan para compilar o verificar el juego web.
