# Contexto de continuidad — R2 local

Actualizado: 2026-10-01. R2 preparado para versionado y revisión en GitHub por autorización explícita del propietario. No confundir con `ESTADO_PUBLICADO_R1.md`, que documenta la publicación histórica de R1. Disponibilidad del PR/commits se confirma en la entrega, no se infiere de este documento.

Checkout de trabajo: `E:/AI Factory/projects/la-vida-del-boxeo/workspaces/phase-audit-hardening`, rama `feature/audit-hardening`, base `ec2b72dda7bac0434bd37ce8cf6d9a7c5299d38c`.

## Leer antes de continuar

1. Los cinco documentos en `docs/canonical`: diseño, técnico, arte, plan y QA.
2. `docs/audits/44_Auditoria_Integral_Pre_BOX-15_2026-10-01.md`: hallazgos y gates, no certificación de cierre.
3. `docs/audits/45_Gate_R1_Partidas_Carrera_2026-10-01.md`: garantías de partidas que no deben degradarse.
4. `docs/audits/46_Gate_R2_Tiempo_Salud_Combate_2026-10-01.md`: implementación actual, decisiones, pruebas, comparación económica y límites.
5. Diff local y suites R1/R2; no asumir que el commit base contiene las correcciones R2.

## Contratos que deben conservarse

- Dominio/reducer son autoridad; botones/atajos no pueden saltar guardas.
- Un avance diario compartido; sábado se procesa al entrar, una sola vez. Pendientes de la fecha impiden liquidar domingo.
- Diez sesiones reales (`guanteosRealizados`), no `fogueo`, habilitan licencia. Sesiones siguen aumentando después de diez.
- Disponibilidad de guanteo contempla salud, descanso, compañero y pelea del día.
- DT y ficha usan `enfoqueRecomendado` por púgil y su propio rival.
- Crecimiento no baja valores por superar un techo heredado.
- Resultado completo e inalterado, fecha y salud actuales, identidad y sesión correcta antes de pagar. Legado revalida sus requisitos históricos.
- Caídas sufridas restan mérito. Igualdad exacta sin sesgo: 10–10. Decisión mayoritaria: 2–0 con un juez empatado, aprobadas por el propietario.
- Combate incremental con snapshots. `combateActivo` y RNG propio permiten reanudación del último checkpoint confirmado sin curar ni rerollear.
- Schema 6; migración explícita 5→6; corrupción de sesión no se disimula reseteando el combate. Mantener protección de backups, journal, ranuras, ceros, historial y schemas incompatibles R1.
- Fecha civil única; TTL descuenta todos los días. No inventar cumpleaños ni reparar edades antiguas sin datos.

## Evidencia y autorización

229 tests: 96 nuevos R2 + 60 R1 + 73 históricos; `npm run verify` aprobado. E2E aislados en 5231/5232. No se tocó la partida real ni localhost:3000.

El propietario autorizó recalibrar las seis assertions económicas exactas afectadas por la trayectoria R2. Antes/después en el informe 46. No autorizó una reforma de economía y no se modificaron sus parámetros.

El propietario autorizó commits, push de `feature/audit-hardening` y PR borrador contra main exclusivamente para revisar R2. No autorizó merge ni despliegue. No iniciar R3–R5 o BOX-15 automáticamente. Esperar revisión y siguiente autorización. No prometer que estos tests certifiquen todo el juego. La rama contiene historia previa hasta R1; no atribuir todo el diff contra main a R2.
# Política de eficiencia verificada

Consultar `docs/audits/47_R2_GPU_y_Tiempos_2026-10-01.md`: RX 7600 XT accesible por Chromium/D3D11; script R2 con GPU en Windows y fallback `R2_GPU=0`. Mantener assertions y perfiles aislados. Solapar controles independientes; no ejecutar build y navegador consumidor de ese build simultáneamente. Durante cambios, tests afectados; al cierre, verify completo. No repetir controles cuyo resultado sigue válido. La GPU no aceleró de forma medible el E2E completo en esta muestra; no prometer mejoras generales.
