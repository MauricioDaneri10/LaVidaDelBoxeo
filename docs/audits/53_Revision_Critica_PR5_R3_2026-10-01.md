# Revisión crítica del PR #5 — R3

Base solicitada/verificada: `2c445d2169d2a04c869328a5374c9fa73a469095`. Head de entrada: `023e7e3f42ee6229a88116e40c0afbe6575095b3`. Fecha: 2026-10-01. PR en borrador, sin merge/publicación.

## Dictamen sobre el head de entrada: bloqueado

La suite346/346 no cubría tres defectos reproducidos en esta revisión. Se añadieron primero tests:3 fallos/18 verdes,400ms. No se cambiaron precios, salarios, probabilidades ni assertions para ocultarlos.

| Gravedad | Hallazgo | Reproducción y causa | Corrección |
|---|---|---|---|
| P1 | Evidencia de cobro con identidad corrupta se pierde | Consejo pagado con `id:11` numérico junto a c8 pendiente; evidenciaCobroDanada solo miraba IDs string conocidos. R1 descartaba el registro inválido y permitía otro derecho. | Evidencia pagada con ID inválido/vacío provoca error ambiguo y protege original, sin adjudicar objetivo/pago. IDs externos sanos siguen preservados. |
| P1 | Excepción titular huérfana reutilizable | Migrar contrato titular, cancelarlo, introducir otro contrato de mismo ID y distinta bolsa: puedeEjecutarPelea aún concedía la excepción por el ID antiguo. También ocurría tras liquidar. | Retirar la autorización operacional al cancelar/resolver. Contrato/checkpoint/historial/pagos anteriores intactos; nuevos contratos no heredan el permiso cancelado. |
| P2 | Migración pisa una extensión desconocida | Schema6 con `contratosTitularesHistoricos:{datoExterno:0}`: migración sustituía ese valor por una lista derivada. | Colisión de nombre reservado bloquea migración/escritura por ambigüedad, conserva bytes; no se interpreta la extensión como autorización titular. |

GREEN focalizado tras correcciones:183/183 (R3 carrera21, R1 60, R2 102),4,39s. Cobertura adicional posterior: guardas de licencia/energía/circuito/género/fecha y recibo falsificado, ID externo sano/extensiones/roundtrip, original y writer bloqueados ante colisión y retiro de permiso después de pago. Carrera queda23 tests. Ninguna assertion anterior se debilitó.

## Revisión directa del diff completo

Se contrastaron los24 archivos del diff de entrada, código nuevo de consejos/economía, producción engine/state/saveValidation/types, UI App/Phone/panels, catálogo, tests nuevos/modificados, script sintético y documentación51/52/canónicos. Se comprobó además el diff correctivo. No se incluyeron capturas heredadas ni logs locales. Las diferencias documentales no sustituyen verificación ejecutable.

- **Migración6→7:** explícita y no RNG; current7 no se vuelve a migrar. Protecciones transaccionales/originales/backups siguen siendo R1, sin modificaciones del repositorio de almacenamiento. No nueva decisión sobre recuperar datos ambiguos: se bloquea escritura hasta recuperar identidad/extensión, nunca se inventa un objetivo. IDs desconocidos JSON sanos conservados; conflictos de IDs no seleccionan ganadores.
- **Consejos:** c1–c7 intactos y c8–c10 únicos, $60/$80/$120 y fama1/2/2. Correspondencia de sucesores legacy por modulo coincide con generación anterior. Primer derecho no pagado en orden histórico; archivo no cambia reclamado a true. Cobrados impiden repago; originales y extensiones se preservan, sin fechas ni recobros inventados. Guardas también se aplican al reducer.
- **Contratos:** solo pendientes titulares al migrar desde6 reciben autorización; oferta no pactada nunca la recibe. No altera rival, bolsa ni checkpoint; guardas de salud/licencia/identidad/fecha siguen activas y receipt R2 sigue siendo necesario. La lista es metadata operacional, no evidencia de resultados, por eso expira al terminar/cancelar el contrato. No es una firma criptográfica ni una defensa contra edición maliciosa del archivo de partida completo.
- **Economía:** helper compartido mantiene orden de redondeo/draws, liquidación concilia delta descontando libro ya pagado. Garantizado significa condicionado al estado actual, no promesa inmutable: UI dice ingresos previstos y separa actividades variables. Rangos/media mantienen fórmula anterior. Arena solo elimina alquiler futuro, sin reembolsos. Velada tentativa cero válidos cancela sin beneficios/cargo; con válidos mantiene fórmulas previas y guardas de pago único.
- **Compras/personal:** efectos restringidos a capacidades aprobadas, proteínas semanal/techo/no inmediata. Precios/salarios intactos, empleados legacy/excesos no se borran; selector UI/reducer comparte cupo administrativo y entrenador independiente, coordinador bloqueado. No beneficio nuevo ni sede adicional prometida.
- **Tests/informes:** cambios de contrato autorizados en tests Anselmo/velada/schema explícitos, no relajación genérica. Los seis escenarios exactos y deficitarios no cambiaron. Las120 semanas usan conciliación/roundtrip y cota de premios: no se presentan como playtest completo de combates ni prueba de rentabilidad universal.

## Verificación sobre código corregido

`npm run verify`: **351/351 PASS**,7 archivos, typecheck/build/presupuesto/auditoría PASS; tests4,41s y build1,41s. JS520,2KiB/560; CSS80,7KiB/90. Advertencia orientativa Vite chunk>500kB sigue vigente, no es fallo del presupuesto. Los seis escenarios exactos12/52 y120 semanas×3 semillas se ejecutaron dentro de esta suite.

El código de producción cambió: NO se reutiliza el E2E anterior como prueba del código final. Se vuelven a ejecutar R1/R2/R3 en orígenes aislados5231/5232/5234 sobre build terminado estable, en paralelo sin compartir perfil/almacenamiento. Resultados finales abajo. UI/catálogo sin cambios: evidencia geométrica anterior corroborada por repetición R3. GPU D3D11 según script vigente; sin atribuir velocidad no medida.

## Resultado final y dictamen corregido

- Navegador R3: **22/22 PASS**, 1280×720 y 1440×900, 40,011s, fingerprint del build sin cambios. Log local excluido del commit. Se repitió para obtener un resumen verificable después de que la captura de salida de PowerShell no mostrara el resumen; no se infieren resultados del silencio.
- Navegador R1: **PASS**, migración/carrera/archivo y almacenamiento lleno, denegado y schema futuro en origen aislado5231. Navegador R2: **PASS**, reanudación/checkpoints/resultados/pago único en origen aislado5232, ambos tamaños. Son ejecuciones nuevas sobre el código corregido, no reutilización de los E2E del head de entrada.
- Diff revisado: correcciones limitadas a consejos, migración, retiro de permisos titulares, tests y documentación; package/lock/workflow sin diferencias respecto a la base. Capturas de scratch preexistentes no se incorporan ni se descartan.
- **APTO para integrar R3 dentro del alcance autorizado**, una vez que el usuario lo acepte. Los tres defectos bloqueaban el head de entrada; las reproducciones pasan tras corregirlos. No quedan contratos necesarios de R3 sin resolver detectados en esta revisión. No es certificación integral del juego ni cierre de otros gates. El hash final se registra en la descripción del PR y en la entrega, evitando una autorreferencia imposible dentro del mismo commit.

## Límites y restricciones

Defecto previo de cierre del selector (toast sin cerrar) sigue documentado fuera de R3; regeneración directa sí opera. Coordinadores nuevos suspendidos hasta decisión diferenciada. Datos ambiguos bloqueados requieren recuperación, no reseteo silencioso. Estos límites no implican habilitar otro gate. R4/R5/BOX15 no iniciados; workflow sin cambios: Pages exclusivamente manual, confirmación explícita y main. Partida del usuario/localhost3000 no utilizados. PR permanece borrador, integración solo por decisión posterior del usuario.
