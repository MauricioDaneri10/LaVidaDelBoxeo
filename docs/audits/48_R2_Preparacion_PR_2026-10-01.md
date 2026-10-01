# Gate R2 — Tiempo/salud/combate: revisión en borrador

## Revisión adicional del PR #2

[Informe 49: R2 incremental, historia previa y riesgo de despliegue](https://github.com/MauricioDaneri10/LaVidaDelBoxeo/blob/feature/audit-hardening/docs/audits/49_Revision_PR2_Historia_y_R2_2026-10-01.md). Se encontró y corrigió un P1: checkpoints con final prematuro, cursor saltado o identidad cruzada. Tres reproducciones RED, tres casos positivos terminales y **235/235 PASS** actuales (102 R2 + 60 R1 + 73 históricos), verify 9,007 s y E2E GPU 11,383 s. Los resultados 229 siguientes pertenecen a preparación inicial. PR permanece en borrador; se recomienda separar decisiones de baseline/R1 y R2 sin reestructurarlo aún. Merge dispararía Pages automáticamente; GitHub actualmente informa `has_pages: false`. No merge ni despliegue autorizado.

## Alcance y frontera de revisión

Repositorio oficial: MauricioDaneri10/LaVidaDelBoxeo. Head: `feature/audit-hardening`; base del PR: `main`. Autorizados commits, push y PR borrador; no merge, despliegue ni R3–R5/BOX-15.

Base incremental R2: `ec2b72dda7bac0434bd37ce8cf6d9a7c5299d38c` (snapshot publicado hasta R1). Al preparar el PR, `origin/main` era `9317da96cbb2ed0bd749c49608b8b310e385b9d0`: **0 commits exclusivos de main y 52 commits históricos exclusivos del head**, antes de añadir R2. Main es ancestro; no hizo falta merge, rebase ni resolver conflictos. El PR completo incluye historia anterior hasta R1, no atribuible a R2. Para revisar solo este gate:

```sh
git diff ec2b72dda7bac0434bd37ce8cf6d9a7c5299d38c..feature/audit-hardening
```

No se encontró PR previo para este head al preparar la publicación. Los cambios locales fueron preservados y seleccionados por rutas explícitas; no se agregaron capturas, partidas reales, perfiles, credenciales, dist, caches o helpers temporales. Los scripts Python añadidos son herramientas reproducibles QA, no temporales de reescritura.

## Hallazgos corregidos

| Hallazgos | Corrección |
| --- | --- |
| A03/A04 | Transición civil compartida, cartelera bloqueante, sábado procesado una vez. |
| A05/A06 | Licencia por diez sesiones reales; salud, descanso, recuperación y compañero gobiernan guanteo. |
| A07/A09 | DT/ficha con rival individual; entrenamiento no reduce capacidades heredadas. |
| A14 | Resultado íntegro y completo, comprobante del motor, fecha/identidad/sesión/requisitos revalidados; pago único y legado protegido. |
| A15/A16 | Caídas sufridas penalizan; igualdad 10–10 y nombres de consenso simétricos, incluida Mayoritaria aprobada. |
| A17 | Fin del último conteo, simulación incremental, snapshots y checkpoint/RNG reanudable. |
| A22 | Metadatos civiles, envejecimiento y vencimientos coherentes; comando vencido rechazado. |

## Compatibilidad y pruebas

Schema 6, migración explícita 5→6/idempotente. Preservación de datos válidos y ceros; no se cambió el repositorio operacional R1 ni su política de backups/journal/ranuras/futuros. Checkpoints corruptos no curan ni reinician silenciosamente la pelea. Precios, ingresos y salarios sin modificaciones; seis baselines deterministas recalibrados con aprobación y assertions exactas (comparación en informe 46).

- Verificación previa del código de producción: **229/229** (96 R2, 60 R1, 73 históricos), TypeScript, build, presupuesto y auditoría estructural aprobados.
- Navegador R1 previo, reutilizable sobre producción idéntica: cinco grupos aprobados, incluidos archivo/pase profesional y almacenamiento lleno/denegado/schema futuro.
- Navegador R2: ocho grupos en 1280×720/1440×900; recarga parcial, caída del último intercambio, esquina recargada y resultado único. GPU/D3D11 RX 7600 XT comprobada; todas las assertions conservadas.
- En preparación de PR se sustituyó la espera fija de arranque de los dos scripts R2 por disponibilidad HTTP observable y timeout acotado. **Resultado definitivo:** `npm run verify` exit 0, 229/229, 8,963 s; E2E R2 GPU ocho grupos PASS en 11,489 s; diagnóstico GPU exit 0 en 6,651 s. Los dos scripts se ejecutaron en paralelo después del build, aproximadamente 12 s de pared con orquestación. Capturas medidas en esta pasada: software 1,620 s/GPU 1,506 s; muestra bajo concurrencia, no estimación de aceleración universal. `git diff --check` sin errores. No se debilitaron assertions ni escenarios.
- Workflow existente solo se dispara por push a main o ejecución manual. Push a este head/PR no despliega Pages. No se modifica el workflow ni se dispara manualmente.

## Límites conocidos

- Recarga preserva dominio del último checkpoint confirmado, no el milisegundo de animación/audio/conteo; vuelve a pausa segura. Desglose React retrospectivo por asalto no se reconstruye, sí tarjetas oficiales acumuladas.
- Almacenamiento denegado/lleno no puede garantizar operaciones no escritas; conserva aviso y copia recuperable R1.
- Modelo de edad sin cumpleaños: no se inventa reparación histórica; regla 8/7 por caída preservada.
- Comprobantes locales no son anti-cheat de servidor.
- Warning de chunk JS >500 kB permanece; presupuestos 560 KiB JS/90 KiB CSS no se elevaron.
- Evidencia específica R2, no garantía universal de juego sin bugs. R3–R5 y BOX-15 siguen sin autorización.

## Documentos de revisión

- [Informe por hallazgo, causas y red/green](https://github.com/MauricioDaneri10/LaVidaDelBoxeo/blob/feature/audit-hardening/docs/audits/46_Gate_R2_Tiempo_Salud_Combate_2026-10-01.md).
- [GPU y tiempos medidos](https://github.com/MauricioDaneri10/LaVidaDelBoxeo/blob/feature/audit-hardening/docs/audits/47_R2_GPU_y_Tiempos_2026-10-01.md).
- [Contexto de continuidad](https://github.com/MauricioDaneri10/LaVidaDelBoxeo/blob/feature/audit-hardening/docs/context/ESTADO_LOCAL_R2.md).
- Canonical técnico y QA actualizados; README y guía de scripts distinguen R1 histórico de R2 candidato.

Pendiente: revisión y aceptación explícita del propietario. Mantener PR en borrador.
