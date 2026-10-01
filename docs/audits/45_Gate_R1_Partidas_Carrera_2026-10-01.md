# Gate R1 — Partidas/carrera: informe de cierre

Fecha: 2026-10-01. Entrada: auditoría integral 44, pre-BOX-15.

## 1. Dictamen y alcance

**R1 cerrado para los escenarios de aceptación enumerados aquí. No certifica todo el juego.** A01, A02, A12, A13 y A28 exclusivamente operacional tienen corrección y evidencia ejecutable. BOX-15 y R2–R5 no se iniciaron ni se implementaron durante este trabajo.

La igualdad exacta de roundtrip corresponde al estado válido del schema actual: valores, orden, arrays vacíos, ceros, falsos, resumen, libros y contadores. La reparación solo modifica elementos inválidos, diagnostica y protege los bytes originales antes de reemplazarlos. Una incompatibilidad o identidad ambigua bloquea escritura; no autoriza inventar progreso.

Pruebas: adaptadores en memoria, fixtures sintéticos y Chromium nuevo en `127.0.0.1:5231`. No se usó el almacenamiento de `localhost:3000` ni el perfil del propietario. No se modificó su partida real para pruebas ni se reinició su servidor.

## 2. Estado individual y causas raíz

| Hallazgo | Estado | Causa raíz | Solución |
|---|---|---|---|
| A01 — trayectoria profesional | Cerrado | `Number(campo) || récord` sustituía ceros profesionales por estadísticas amateur; la carga ejecutaba generación/normalización de juego. | Validación sin reglas de progresión ni RNG. Contadores separados conservados. Trayectoria profesional antigua sin separación suficiente se bloquea, no se adivina. |
| A02 — ceros | Cerrado | Defaults por truthiness: energía 0→100 y seguidores 0→estimación. | Validación estricta de tipos/números finitos preserva todos los valores válidos, incluido cero. |
| A12 — baja histórica | Cerrado | El reducer borraba al boxeador; solo ciertas leyendas entraban al Salón. | Archivo separado con snapshot completo de todas las bajas competitivas y resultados disponibles; consulta desde Plantel tras recarga. |
| A13 — validación | Cerrado | Casts y coerciones parciales, arrays sin validar, versiones/referencias insuficientemente protegidas. | Validación recursiva localizada, diagnósticos, migraciones explícitas/idempotentes, huérfanas filtradas, duplicados idénticos deduplicados y conflictivos bloqueados. |
| A28 — guardado operacional | Cerrado | Autosave ignoraba false; escrituras de varias claves sin recuperación, truncamiento de seis ranuras, memoria presentada como persistencia. | Repositorio inyectable con resultado observable, readback, checksum, journal y copias originales; aviso/reintento y cinco ranuras sin expulsión silenciosa. |

### Archivo histórico

- Toda baja competitiva se archiva, sin exigir título ni elegibilidad de leyenda. Snapshot independiente del objeto mutable del plantel: atributos, energía, licencia, trayectoria, récord y restantes campos.
- Salón conserva criterios anteriores. Alumnos sin licencia mantienen política previa de salida; no se inventó historia competitiva para ellos. Baja con pelea pendiente sigue bloqueada.
- Cierre del club conserva archivo de solo lectura como historia; no traslada activos ni ventajas. Se corrigió la notificación del alumno promovido desde espera tras una baja, incluida expresamente en A12.
- No se reconstruyen bajas anteriores ni resultados que el historial antiguo ya había descartado. Se conserva la ficha completa existente y los resultados disponibles. UI muestra ficha, récord, trayectoria y resumen del último resultado disponible; no promete reconstruir todas las peleas perdidas.

## 3. Migraciones y política de protección

Schema actual **5**, envelope **1**, versión de juego **2**, con transición explícita desde versión conocida 1.

| Transición | Operación |
|---|---|
| Schema 1→2 | Comunidad y nombre faltantes; ausencia/null no sustituye cero. |
| Schema 2→3 | Identidad legacy determinista por contenido y campos faltantes; sin fecha ni RNG. |
| Schema 3→4 | Mantiene migración previa aprobada: libro sin semana fiable comienza limpio; saldo/progreso permanecen. |
| Schema 4→5 | Archivo vacío cuando falta. |

Una migración cambia schema/campos faltantes por definición. La excepción histórica 3→4 **no se amplió**: se conservó su assertion y comportamiento previo, añadiendo protección íntegra de bytes originales antes de persistir. Si la copia falla, no se reemplaza la partida. La carga de ranuras actuales ya no descarta libros válidos por comparación de semanas.

Un pro antiguo sin contadores separados suficientes, IDs iguales con historias distintas, envelope contradictorio o schema futuro bloquean autosave. No se elige arbitrariamente una historia ni se reemplaza el original por un estado inicial. Metadata dañada como savedAt se diagnostica conservando el cuerpo sano.

### Protocolo operacional

1. Validar antes de serializar: no convertir NaN/infinito silenciosamente a null.
2. Comprobar primaria, backup y ranuras; conservar originales dañados/migrados e índices reparados en `:recuperacion:<hash>`, con readback exacto.
3. Guardar journal before/after con checksum; escribir claves modificadas y confirmar cada lectura.
4. Eliminar journal para concluir; solo entonces devolver éxito.
5. Ante fallo, rollback best effort. Si sigue denegado, journal conserva ambos lados; reinicio lee before y siguiente intento protege journal antes de restaurarlo.

Journal corrupto bloquea nuevas escrituras. Primaria/backup ambos corruptos no se reemplazan con una nueva carrera. Backup corrupto con primaria sana se protege antes de sustituirlo. Incompatibilidad no se degrada a backup antiguo para sobrescribir el original. Memoria fallback informa falta de persistencia durable.

Se mantienen cinco ranuras: actualizar existente permitido; sexta nueva rechazada con mensaje y eliminación explícita requerida. No se trunca lista heredada más larga. Eliminar también verifica escritura y anuncia fallo real.

## 4. Evidencia red → green

Primera batería de 13 casos, antes de corregir: **12 FAILED / 1 PASSED**. Reprodujo trayectoria, ceros, mutación del roundtrip válido, archivo ausente, null, duplicados/huérfanas, schema futuro, sexta ranura y escritura parcial. El caso verde de migración se reforzó con determinismo/idempotencia y ausencia de RNG.

Durante revisión se añadieron reproducciones rojas y luego verdes: legado sin identidad y libros válidos descartados (2), versión antigua conocida y validación consumiendo RNG (2), IDs conflictivos (1), savedAt inválido ignorado (1).

Navegador reprodujo un error de render al abrir configuración con storage lleno por preferencias no protegidas. Se protegió el acceso mínimo para poder informar/reintentar; también se evitó que el aviso interceptara controles del juego. No se rediseñaron preferencias ni otras pantallas.

### Checklist ejecutable

| Aceptación | Evidencia | Resultado |
|---|---|---|
| Promoción y debut sin mezclar circuito | Reducer + repositorio + igualdad profunda; Chromium promoción/recarga | PASS |
| Ceros, falsos, orden, arrays vacíos, resumen, extensiones JSON seguras | Casos parametrizados y roundtrips profundos | PASS |
| Archivo no legendario accesible tras recarga | Debutante/campeón/alumno/pendiente, snapshot no alias; Chromium | PASS |
| Corrupción localizada sin borrar vecinos sanos | Diagnóstico/idempotencia y bytes originales protegidos | PASS |
| Duplicados, huérfanas, arrays malformados, tipos y no finitos | Validación recursiva y bloqueo conflictivo | PASS |
| Schema antiguo/futuro, formato y versión de juego | Migraciones y originales sin alteración | PASS |
| Autosave/manual, almacenamiento full/denied y reintento | Fault injection + Chromium, sin falso éxito | PASS |
| Escrituras interrumpidas/truncadas | Fallos por clave, readback/journal/reinicio | PASS |
| Backup corrupto y fallo al proteger original | Combinaciones primaria/backup y copia fallida | PASS |
| Política cinco/seis ranuras | Update, rechazo sexta, índice localizado y futuro protegido | PASS |
| Persistencia larga | 120 semanas, **840 ciclos guardar/cargar**, igualdad exacta por ciclo | PASS |
| Regresión existente | 73 tests originales completos | PASS |

La prueba larga es determinista y de persistencia; no certifica economía/combate ni todos los caminos de 120 semanas de UI.

### Ejecución final

```text
npm test -- src/game/r1.test.ts --reporter=dot       60/60 PASS
npm test -- src/game/game.test.ts --reporter=dot    73/73 PASS
npm run verify                                    exit 0
  TypeScript                                      PASS
  Vitest: 2 archivos                              133/133 PASS
  Vite build: 408 módulos                          PASS
  JS: 521.95 kB / 509.7 KiB; límite 560 KiB         PASS
  CSS: 82.86 kB / 80.9 KiB; límite 90 KiB           PASS
  Auditoría estructural: 0 errores/0 advertencias   PASS
python scratch/test_r1_persistence.py              exit 0
  1280x720 y 1440x900: promoción/recarga/archivo     PASS
  full, denied, future: aviso y original intacto    PASS
```

Vite mantiene advertencia de chunk mayor de 500 kB, pero cumple presupuesto. No se hizo refactor de bundle fuera de R1. Capturas: `scratch/r1_archive_1280.png` y `scratch/r1_archive_1440.png`.

## 5. Archivos modificados y diff incremental

Checkout ya tenía cambios sin commit de BOX y documentos anteriores. Se revisó el incremento contra contenidos de inicio: **no atribuir todo el diff contra HEAD a R1**.

| Archivo | Cambio de este gate |
|---|---|
| `src/game/saveValidation.ts` (nuevo) | Validación, diagnósticos, migraciones, bloqueos. |
| `src/game/saveRepository.ts` (nuevo) | Copias, journal, readback, slots y errores. |
| `src/game/engine.ts` | Fachada de validación, base sin población/RNG, schema5/archivo; elimina sanitización mutante. |
| `src/game/state.tsx` | Integra repositorio/autosave; snapshot de baja, historia al cerrar, ID de legado y conservación de libros actuales. |
| `src/game/types.ts` | Archivo histórico y checksum opcional. Otros cambios contra HEAD son previos. |
| `src/game/storage.ts` | Memoria fallback marcada no durable. |
| `src/App.tsx` | Aviso de fallo y reintento sin interceptar controles. |
| `src/components/panels.tsx` | Acceso al archivo, mensaje manual veraz y preferencias protegidas. |
| `src/components/CareerArchive.tsx` (nuevo) | Archivo de solo lectura separado del Salón. |
| `src/components/Intro.tsx` | Aviso si falla eliminar ranura; footer en diff contra HEAD es previo. |
| `src/game/r1.test.ts` (nuevo) | 60 casos ejecutados, incluidas parametrizaciones/faults. |
| `src/game/game.test.ts` | Única assertion existente cambiada: schema esperado 4→5. Ninguna debilitada/eliminada. |
| `scratch/test_r1_persistence.py` (nuevo) | Aceptación aislada/capturas. |
| Canónicos 02/05 y este informe | Contrato/checklist operacional R1, no reconciliación general R5. |

Sin cambios de balance, calendario, contratación ni simulador para hacer pasar tests; sin refactor general ni funcionalidad borrada. Sondas antiguas de auditoría quedan como diagnóstico histórico, no como tests vigentes. `git diff --check`: PASS, exit 0, sin errores de whitespace. La comparación del numstat inicial/final confirmó que BoxerSheet, CalendarView, CityMap, FightScreen, GymView, Phone, TopBar, ui, data, index.css y canónicos 01/04 conservan exactamente su diff previo.

## 6. Riesgos y decisiones

- Journal certificado para **un escritor de sesión** y recuperación tras interrupción, no concurrencia de dos pestañas. Multi-tab exige diseño adicional.
- Checksum para corrupción accidental, no autenticación ni protección contra manipulación deliberada.
- LocalStorage no evita borrado deliberado del navegador/fallo físico; nube/cuentas quedan fuera de R1.
- Copias originales inmutables sin purga automática. Si no hay cuota se anuncia fallo; no se borra una copia recuperable para guardar.
- Fichas/results descartados antes del archivo no se reconstruyen. No se afirma recuperarlos.
- ID conflictivo, pro antiguo ambiguo o journal corrupto requieren decisión manual sobre datos correctos si aparecen en una partida real. El programa los bloquea/protege; no se improvisó una regla.
- No hay decisiones adicionales pendientes para los escenarios normales corregidos. Resolver ambigüedad, purgar originales o permitir escritores simultáneos necesita aprobación futura.

**Detención al terminar R1. BOX-15 y R2–R5 no se modificaron ni se iniciaron.** La auditoría integral 44 mantiene sus otros hallazgos abiertos. Continuar requiere nueva indicación del propietario.
