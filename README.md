# La Vida del Boxeo · MadArt Studios

Prototipo web de gestión de un gimnasio y carreras de boxeo. Esta rama contiene el estado de trabajo hasta **Gate R2 — Tiempo/salud/combate**, preparado para revisión en PR borrador; no es una aprobación integral ni una versión final del juego.

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
npm test -- src/game/r2.test.ts
npm test -- src/game/game.test.ts
```

Referencia R2: **96 tests R2 + 60 R1 + 73 previos = 229 PASS**, TypeScript, build, presupuesto y auditoría estructural PASS. Reutilizar evidencia solo si corresponde al código exacto; repetir controles afectados tras cambios, y la verificación completa al cerrar el gate.

Aceptación R1 en navegador, opcional y separada de `npm run verify`:

```sh
python -m venv .venv
# Activar .venv según el sistema operativo antes de instalar.
python -m pip install playwright
python -m playwright install chromium
python scratch/test_r1_persistence.py
python scratch/test_r2_combat.py
```

Los scripts usan `127.0.0.1:5231` (R1) y `127.0.0.1:5232` (R2), necesitan puertos libres y contextos nuevos con datos sintéticos. Ejecutar `npm run build` previamente; nunca trasladar pruebas al perfil o almacenamiento del propietario. R2 habilita GPU/D3D11 en Windows; `R2_GPU=0` permite software. Diagnóstico y límites: [rendimiento R2](docs/audits/47_R2_GPU_y_Tiempos_2026-10-01.md).

## Continuar el proyecto

Leer primero [el contexto R2](docs/context/ESTADO_LOCAL_R2.md), los cinco [documentos canónicos](docs/canonical/), la [auditoría integral 44](docs/audits/44_Auditoria_Integral_Pre_BOX-15_2026-10-01.md), el [cierre R1](docs/audits/45_Gate_R1_Partidas_Carrera_2026-10-01.md) y el [informe R2](docs/audits/46_Gate_R2_Tiempo_Salud_Combate_2026-10-01.md). El estado publicado R1 se conserva como evidencia histórica.

R2 está implementado/verificado y pendiente de aceptación del propietario; R3, R4 y R5 siguen abiertos. **No iniciar BOX-15 ni otro gate sin autorización.** Este branch incluye trabajo histórico anterior y R1: el diff completo contra `main` no es exclusivamente R2. La frontera incremental de R2 es `ec2b72dda7bac0434bd37ce8cf6d9a7c5299d38c..HEAD`. No se autoriza merge ni despliegue.

`scratch/` contiene pruebas auxiliares y capturas; consultar su README antes de ejecutar scripts históricos. Los scripts gráficos de `scripts/` son herramientas previas opcionales con rutas/dependencias locales; no se ejecutan para compilar o verificar el juego web.
