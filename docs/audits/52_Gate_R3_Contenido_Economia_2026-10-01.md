# R3 — Contenido y economía: entrega para revisión

Fecha: 2026-10-01. Base main `2c445d2169d2a04c869328a5374c9fa73a469095`; rama `feature/r3-content-economy`. Alcance exclusivo A08/A10/A11/A21/A24, autorización del usuario en plan51 sección6. Implementación preparada para revisión, no aceptación ni certificación integral del juego.

## Hallazgos y evidencia ejecutable

| Hallazgo | Causa raíz y corrección | Evidencia |
|---|---|---|
| A08 | Modificadores de cuerda/plataforma ausentes; proteínas sin recuperación prometida. Velocidad ×1,10, defensa/eficacia ×1,10 y recuperación semanal +4; fuerza ×1,20 intacta. | Compra única, cero energía inmediata, delta de entrenamiento, apilamiento, techo100 y reload. |
| A10 | Oferta titular se degradaba cambiando solo etiqueta/título, conservando campeón/bolsa. Ahora se genera ordinaria antes de sortear campeón; no pactadas incoherentes se rechazan y se regeneran explícitamente gratis. | Matriz 3 semillas/títulos0–4/TV, bolsas exactas, RNG no consumido en carga/rechazo, contratos/checkpoints antiguos y pago único. |
| A11 | Reducer aplicaba cupo administrativo al entrenador; UI tenía otra guarda. Selector compartido y cupos independientes; coordinador suspendido conforme decisión. | Permutaciones, 0/1/3 sucursales/coordinadores, requisitos, salarios legacy y UI real. |
| A21 | Sucesores con IDs nuevos repetían metas absolutas y cobros. Catálogo diez hitos únicos y migración de derechos por objetivo. | Umbrales exactos, pago único, IDs/extensiones, duplicados archivados sin falso cobro, original protegido y schema futuro. |
| A24 | Previsión/liquidación duplicadas, media aleatoria presentada como segura, Arena cobraba alquiler y velada vacía cobraba ingresos. Helper económico puro, estimaciones separadas, alquiler futuro0, cancelación sin cargo/beneficio. | Conciliación, cuotas/loan/salarios/marca/sucursal, rangos y redondeos, carteleras vacías/futuras/lesionadas/huérfanas, regresión pago único R2. |

RED registrado antes de correcciones: ofertas15 fallos/24 verdes (256ms); compras/personal22 fallos/2 verdes (286ms); primera carrera/hitos8 fallos (299ms). Revisión cruzada añadió3 fallos por evidencia de cobro corrupta/duplicados reparables (321ms), luego17 verdes (908ms). Contrato titular antiguo sin TV falló antes de introducir excepción de compatibilidad. Las ampliaciones de cobertura posteriores no se presentan como reproducciones RED adicionales.

GREEN final: 346/346 tests en7 archivos, 111 nuevos y235 existentes con cambios contractuales aprobados. No se debilitaron assertions: repetición de Anselmo sustituida por unicidad exacta autorizada; fixture de velada R2 ahora incluye combate válido, conserva assertions y exige resolverlo; migration assertion exacta actualizada a schema7 y lista derivada. Resultado `npm run verify`: exit0, typecheck PASS, tests4,40s, build1,46s, presupuesto JS519,7/560KiB y CSS80,7/90KiB, auditoría estructural0 errores/0 advertencias. Vite mantiene advertencia orientativa chunk>500kB; presupuesto sí aprobado.

## Persistencia y contratos

Migración explícita6→7 idempotente, sin RNG ni pagos ni fechas inventadas. Consejos conservan orden/IDs y extensiones; primer derecho no pagado prevalece, duplicados archivados, cobrados preservados. Desconocidos se conservan sin inventar objetivos. Un registro conocido con evidencia de cobro dañada/ambigua bloquea escritura y exige recuperación; no se elimina para habilitar otro pago. R1 conserva bytes originales, backups y bloqueo de schemas futuros.

IDs de pendientes titulares pre-R3 se registran en `contratosTitularesHistoricos`: preserva elegibilidad contractual título/TV, no relaja identidad, circuito, género, división, salud ni fecha. Checkpoints y contrato no se alteran; continuación desde copia y resultado equivalente, pago único comprobados. Nuevas ofertas siguen los requisitos actuales. No existe devolución ni recobro histórico.

## Economía: seis escenarios sin recalibrar

Semilla260923, mismo calendario/operaciones, resultados exactos antes=después:

| Escenario | Caja12 / mínimo12 | Caja52 / mínimo52 |
|---|---|---|
| Base |546 /546|1584 /534|
| Recaudación |1703 /800|5971 /800|
| Recaudación completa |3268 /800|10170 /800|
| Nómina temprana |−1979 /−1979|−10299 /−10299|
| Entrenador y recaudación |−180 /−180|−6076 /−6076|
| Entrenador y bingo |1288 /587|3156 /587|

No usan Arena, nuevas mejoras ni cadena de cobros, por eso las correcciones no alteran estas salidas. No se cambió ningún valor esperado para forzar rentabilidad. Además120 semanas×3 semillas(1001/510024/260923), conciliación exacta por cierre, roundtrip, contratos/salarios preservados y hitos sin sucesores. La fórmula multi-sucursal/Imperio y multiplicación existente del bonus del entrenador se conservan; cambiarla requiere otra decisión, no se inventa en R3.

## Navegador y rendimiento

Contextos desechables/orígenes5231/5232/5234, fixtures sintéticas; nunca partida personal ni localhost3000. R1: pase/recarga/baja/archivo en1280×720 y1440×900, almacenamiento lleno/denegado/futuro PASS. R2:8 grupos PASS en ambos tamaños, reanudación parcial/caída/asalto/pago único.

R3 prueba22 casos: coordinadores0/1/3, órdenes de contratación, archivo/cobro/reload, previsión, ofertas/rechazo/regeneración y compras, ambos viewports, bounds/footer/errores de recursos/consola. Resultado final se registra en la sección de cierre debajo. Primeras ejecuciones detectaron la inaccesibilidad de regeneración desde cierre antiguo; se agregó acción directa. Una ejecución se invalidó porque cambió el artefacto durante build; no se cuenta como aceptación, se repitió después del build estable.

GPU detectada por CDP: AMD Radeon RX7600XT, driver32.0.31036.15. Chromium con D3D11: gpu_compositing, rasterization,2d_canvas y WebGL habilitados. Controles CPU/test independientes y navegación se paralelizaron; no se atribuye una mejora temporal a GPU sin benchmark comparativo. El navegador completo es el control más lento (~40s), tests ~4–5s/build~1,5s; esperas de estados, no sleeps arbitrarios para aceptar funcionamiento.

## Archivos y límites

Producción: engine/state/data/types/saveValidation, consejos/economy nuevos, App/Phone/panels únicamente contratos y avisos R3. Tests: r3-content/offers/economy/career y adaptaciones explícitas game/r2. Documentación plan51, canónicos01–05 e informe52; script navegador sintético. Sin cambios package/lock/workflows, precios/salarios/riesgo.

Límites: coordinador sigue suspendido hasta definición futura. Hito desconocido no cobra automáticamente. Evidencia histórica dañada exige recuperar registro, no adjudicar otro pago. Botón de cierre antiguo del selector tiene un defecto de UI previo (solo toast): R3 ofrece regeneración directa operativa; corrección general de cierre corresponde al gate UI, no se oculta ni certifica. Gate R4/R5/BOX15 no iniciado. Pages conserva despacho exclusivamente manual con confirmación y main. No merge, despliegue ni Pages ejecutados.

Capturas heredadas generadas por el script R1 y logs locales se excluyen del commit; ninguna partida personal, credencial ni temporal forma parte de la entrega. La revisión se propone mediante PR en borrador. La decisión de aceptar/integrar es del usuario.

## Cierre de evidencia

Navegador R3 final: **22/22 PASS**,39,37s, artefacto sin cambios durante ejecución; sin errores de página/recursos y controles afectados dentro de viewport/footer. Build comprobado index-CxH5_x8h.js. R1/R2 pasaron sobre el mismo código de motor/persistencia; después solo se agregó el botón explícito de regeneración de App, cubierto por R3 final. No se repitieron esos controles independientes sin motivo. Verify final346/346, exit0. Rama entregada para revisión, sin merge ni aceptación automática de R3.
