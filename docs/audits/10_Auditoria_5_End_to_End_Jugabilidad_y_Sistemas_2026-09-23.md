# Auditoría 5 — Jugabilidad end-to-end y conexión entre sistemas

**Fecha:** 23/09/2026  
**Alcance:** flujo completo desde crear/cargar partida hasta progresar semanas, entrenar, guantear, licenciar, pactar y resolver peleas, administrar plantel, economía, eventos, calendario, personal, guardado y recuperación.  
**Objetivo:** detectar cabos sueltos entre sistemas que pueden pasar los tests unitarios pero romper una carrera real.

## 1. Resultado ejecutivo

La base del loop funciona y tiene una cobertura inicial valiosa: el entrenador automático asigna enfoque al instante, el cupo de amateur/profesional está controlado, la búsqueda de talentos tiene límite semanal, el rival conserva género/división/circuito, la licencia del púgil está separada de la del entrenador y el ciclo semanal avanza durante 120 semanas en la prueba existente.

Sin embargo, todavía no es correcto afirmar que el juego esté verificado end-to-end. Los principales bloqueos son:

| Prioridad | Hallazgo | Impacto |
|---|---|---|
| P0 | El límite general del plantel es `capacidadAlumnos + 4`; con la base actual se llega a 14, aunque la interfaz anuncia 10 amateurs + 10 profesionales. | El jugador nunca puede administrar la plantilla máxima prometida. |
| P0 | El flujo de “Semana rápida” retorna antes de validar el sábado: la condición `if (s.dia >= 6) return s` hace inalcanzable su propia comprobación de peleas del sábado. | El botón puede no hacer nada cuando el jugador espera avanzar o resolver el día. |
| P0 | No existe una prueba de aceptación que recorra la carrera completa con acciones de UI, guardado, recarga y continuación. | Los 23 tests no garantizan que el usuario pueda completar el loop real. |
| P1 | Los resultados de pelea actualizan al púgil propio, pero no consolidan la evolución del rival en `rivales` ni el ecosistema mundial. | Ranking, clubes rivales y récords históricos pueden quedar estáticos. |
| P1 | Las operaciones de compra, cursos, propiedades y algunas actividades no alimentan de forma uniforme el libro/resultado neto. | La decisión económica y el balance semanal pueden contradecirse. |
| P1 | La promoción a profesional ocurre automáticamente al llegar a 50 peleas amateurs. | Se pierde una decisión importante del jugador y puede producir una promoción involuntaria. |
| P1 | `IMPORTAR` sigue existiendo en el contrato de acciones aunque la experiencia oficial ya no debe ofrecer JSON. | Queda una API histórica sin política clara de compatibilidad. |
| P2 | El sistema de legado crea una nueva partida, pero no existe una prueba de continuidad de progreso, historial y compatibilidad de versiones. | Riesgo de pérdida o reinicio incoherente en carreras largas. |

## 2. Recorrido canónico auditado

### 2.1 Inicio y onboarding

**Estado actual:** `NUEVO_JUEGO` crea el estado base, conserva legado y asigna nombre de partida. El estado base inicia con plantel y recursos predeterminados. El siguiente paso de la interfaz orienta al jugador hacia el plantel.

**Puntos ciegos:**

- El diseño histórico pedía comenzar con pocos alumnos —idealmente tres—, pero el estado base actual debe verificarse contra ese contrato; la interfaz observada ha mostrado cuatro alumnos en algunas carreras.
- No hay una prueba de aceptación que confirme el orden completo del tutorial: elegir enfoque → equipar gimnasio → completar 10 guanteos → tramitar licencia.
- Las metas del tutorial se calculan en más de una capa y pueden quedar desfasadas después de licenciar, retirar o cargar una partida.
- Los consejos de Don Anselmo y el “Siguiente paso” no comparten un identificador de objetivo único; pueden describir estados distintos.

**Criterio de cierre:** una partida nueva debe presentar exactamente el plantel inicial definido en el Documento de Diseño, mostrar un único siguiente paso activo y actualizarlo inmediatamente después de cada acción relevante.

### 2.2 Entrenamiento y entrenador automático

**Estado actual:** contratar `directorTecnico` asigna inmediatamente un combo recomendado a los púgiles que no están en espera; el entrenamiento semanal vuelve a calcular descanso/enfoque según energía, lesión y rival.

**Puntos ciegos:**

- La contratación asigna el enfoque en el momento, pero no hay una prueba que agregue un nuevo boxeador después de contratarlo y compruebe que recibe el enfoque en el mismo instante. El requisito del jugador debe quedar cubierto explícitamente.
- La automatización usa `consejoEsquina` y puede reemplazar el enfoque elegido por el jugador en la siguiente semana. Debe estar claro si el DT tiene autoridad total o si respeta una asignación manual.
- El descanso automático no se modela como una orden persistente con fecha de retorno; se recalcula por energía/lesión. Eso puede ser correcto, pero debe explicarse y probarse.
- Los boxeadores en lista de espera no entrenan, mientras los boxeadores activos y recreativos comparten reglas parciales. Hace falta una matriz de quién entrena, quién guantea y quién paga.

### 2.3 Guanteos, licencia y federación

**Estado actual:** los sábados se asignan guanteos automáticamente; alumnos, amateurs y profesionales pueden participar; con 10 prácticas y licencia del entrenador se puede tramitar la licencia individual por $200.

**Puntos ciegos:**

- El contador `fogueo` se detiene en la meta, mientras `guanteosRealizados` sigue aumentando. La interfaz debe distinguir “sesiones realizadas” de “sesiones que habilitan la licencia”.
- Alumnos con más de 10 guanteos pueden seguir entrenando y ayudando, pero no hay un estado explícito para “listo, aún no licenciado” ni una razón visible de por qué sigue fuera de competencia.
- La licencia requiere dinero, cupo amateur y DT; la secuencia debe explicar cuál requisito falta sin mezclar licencia del club con licencia del púgil.
- El sábado puede generar lesión, pero no existe una prueba de continuidad que compruebe recuperación, bloqueo de pelea y tratamiento durante varias semanas.

### 2.4 Selección de rival y agenda

**Estado actual:** sólo púgiles federados, con al menos 70 de energía, sin lesión, sin pelea pendiente y fuera de cooldown pueden pactar. Las ofertas limitan experiencia rival a ±3 peleas y respetan género, división y circuito.

**Puntos ciegos:**

- La oferta se genera con una función, pero no hay un `id` de generación o fecha de expiración; una oferta vieja puede sobrevivir a cambios de energía, lesión, circuito o semana.
- `ELEGIR_OFERTA` vuelve a validar parte de las condiciones, pero no valida que la oferta pertenezca a la generación más reciente para ese púgil.
- La pelea se agenda siempre en sábado aunque el modelo contiene `diaProgramado`; esto contradice la idea futura de pactar fechas flexibles.
- No se prueba la cancelación, reprogramación, conflicto entre varias peleas, ni el caso de avanzar hasta sábado con una pelea sin resolver.
- La negociación de bolsa aún no es una decisión del jugador: la bolsa sale de una tabla fija y del estado del récord. Falta el flujo de propuesta, contraoferta y riesgo.

### 2.5 Combate y resultado

**Estado actual:** el combate tiene asaltos, planes, tarjetas, CompuBox, caídas, resultado, bolsa, fama y lesiones. Los récords del púgil propio se actualizan y el historial conserva resultados.

**Puntos ciegos:**

- El reductor acepta un `ResultadoPelea` ya calculado; no existe una validación de que el resultado corresponda a la pelea, rival, púgil, bolsa y título pendientes. La UI normal no lo explota, pero el contrato interno permite inconsistencias.
- Se actualiza el récord del púgil propio, pero no se consolida el rival persistente en `rivales`; por eso el ranking mundial puede mostrar rivales con récords congelados.
- Se conserva sólo una ventana de 12 resultados en `historial`; el Salón de la Fama necesita una fuente histórica independiente para no perder récords relevantes.
- La lesión postpelea modifica energía y estado, pero no registra un gasto automático ni ofrece tratamiento/recuperación como transacción económica conectada.
- El ingreso de la bolsa se registra, pero el coste operativo de la pelea, comisión o evento no tiene un contrato único. Esto puede inflar el resultado neto.

### 2.6 Profesionalización y títulos

**Estado actual:** con 50 peleas amateurs el púgil pasa automáticamente a profesional si existe cupo; los títulos dependen de peleas profesionales, victorias y nocauts.

**Puntos ciegos:**

- La promoción automática elimina la decisión “seguir amateur / pasar a profesional”. Debe ser una acción confirmada o una regla de diseño explícita.
- Si no hay cupo profesional, el púgil queda amateur con 50 o más peleas, pero no hay estado de “elegible para promoción” ni prioridad visible.
- El salto de división, edad, retiro, ranking, títulos y bolsa profesional todavía no forma una progresión vital completa.
- Los requisitos de títulos están en `tituloAspirable`, pero la selección de rivales no demuestra que una pelea nacional/regional/mundial se ofrezca en el momento correcto y con oponentes coherentes.

### 2.7 Economía completa

**Estado actual:** el balance semanal liquida cuotas, recreativos, aportes federados, sucursales, marca, patrocinio, eventos sociales, alquiler, sueldos y costo financiero por saldo negativo.

**Puntos ciegos:**

- La proyección previa y el balance real no comparten necesariamente todas las líneas: veladas, bolsas, actividades y ciertos eventos pueden aparecer sólo en una de las dos vistas.
- Comprar equipamiento, cursos y propiedades reduce `dinero`, pero no siempre actualiza `stats.resultadoNeto` ni un libro de gastos persistente.
- La velada se registra como ingreso neto, no como ingreso y gasto separados; esto impide auditar margen, coste y rentabilidad.
- El costo financiero por saldo negativo se muestra, pero no existe una política de deuda, límite, préstamo, embargo o recuperación definida.
- Los recreativos se recalculan semanalmente por fama y derrotas, pero la capacidad, cuota y relación con asistentes no están expresadas como un contrato único.
- Los seguidores se calculan con `Math.max`, por lo que no caen aunque baje la fama o el rendimiento. La reputación, seguidores y fama no tienen un modelo de pérdida coherente.

### 2.8 Eventos, recompensas y calendario

**Estado actual:** los eventos se generan durante la semana, vencen por días, se limitan a cuatro visibles y pueden producir dinero, fama, seguidores, alumnos, patrocinio, mantenimiento o recaudación. El calendario muestra semana y eventos agendados.

**Puntos ciegos:**

- El evento se elimina al ejecutar una opción, pero las acciones no tienen un recibo único para confirmar qué cambió en dinero, fama, seguidores, plantel y libro.
- Algunas acciones registran libro y otras sólo modifican saldo, por lo que el jugador puede no reconstruir la causa de un cambio.
- No hay prueba de expiración que confirme que un evento vencido no puede cobrarse ni reaparece duplicado.
- Los consejos de Don Anselmo generan uno nuevo al reclamar, pero no hay garantía de no repetir contenido ni de que el nuevo consejo sea alcanzable con el estado actual.
- Los eventos comunitarios, comisiones del club, recaudaciones y torneos necesitan tipos y nombres separados; la semántica debe ser única en datos, UI y traducción.

### 2.9 Personal, sucursales y expansión

**Estado actual:** personal tiene requisitos de semana, fama, cursos, sueldos y efectos. Gerentes/entrenadores locales se relacionan con sucursales.

**Puntos ciegos:**

- El límite de personal para sucursales agrupa gerente, coordinador y entrenador local en una sola condición; no está claro qué empleado administra qué sucursal.
- La expansión anuncia más gimnasios, pero falta una entidad “club/sucursal” propia con caja, plantel, calendario y responsable; por ahora los efectos son globales.
- Despedir personal no prorratea sueldo, contrato ni penalización, y no se prueba en el mismo día del cierre semanal.
- El costo de contratar se valida sólo como requisito, no como una compra; el jugador puede contratar y pagar únicamente por nómina futura.

### 2.10 Guardado, cargar y continuidad

**Estado actual:** se guarda después de cada acción, se mantienen hasta cinco partidas, existe respaldo de la clave principal y hay sanitización al cargar.

**Puntos ciegos:**

- La partida principal y la ranura guardan copias completas; una escritura parcial puede dejar ambas inconsistentes.
- Si el JSON está corrupto, `cargarInicial` cae silenciosamente al estado base; no informa al jugador que perdió una carga ni ofrece restaurar el respaldo.
- No hay prueba de guardar → recargar navegador → continuar con el mismo `partidaId`, historial, pendientes, eventos, balances y fecha.
- No hay migraciones por `schemaVersion`; actualizar el juego puede interpretar campos viejos como valores actuales.
- `IMPORTAR` sigue en el tipo de acción aunque la experiencia oficial ya no ofrece exportar/importar JSON; debe retirarse o reservarse a una herramienta de desarrollo claramente aislada.

## 3. Pruebas existentes y huecos

Las pruebas actuales pasan:

- `npm run typecheck` — correcto.
- `npm test -- --run` — **23/23**.
- `npm run build` — correcto.
- `node audit_engine.js` — 0 errores y 0 advertencias.

La cobertura existente valida funciones aisladas y un avance de 120 semanas, pero faltan estas pruebas de aceptación:

1. Crear partida y completar exactamente el onboarding en el orden visible.
2. Contratar DT, incorporar un nuevo púgil y verificar enfoque inmediato.
3. Llegar a 10 guanteos, tramitar licencia, competir y mantener el mensaje actualizado.
4. Simular una pelea completa, lesión, recuperación y bloqueo por energía.
5. Simular récord negativo, baja bolsa, caída de seguidores y decisión de retirar.
6. Completar cupos: 10 amateurs + 10 profesionales + alumnos/recreativos sin superar el límite anunciado.
7. Avanzar 20 semanas con eventos, pelea pendiente, velada, patrocinio y saldo negativo.
8. Guardar, recargar la aplicación y continuar sin perder agenda, libro, historial ni recompensas.
9. Verificar expiración de eventos, reemplazo de consejos y ausencia de duplicados.
10. Comparar proyección previa, balance real y saldo final línea por línea.
11. Verificar ranking después de una pelea propia y una pelea de un club rival.
12. Ejecutar el flujo de legado y cargar la carrera resultante desde cero.

## 4. Plan de solución antes del playtest final

### Fase A — contratos únicos

- Crear funciones de dominio para `limitePlantel`, `capacidadCompetitiva`, `resultadoEconomico`, `aplicarEvento`, `actualizarRanking` y `avanzarFecha`.
- Definir un recibo de acción con cambios de saldo, libro, fama, seguidores, plantel, agenda y notificaciones.
- Eliminar duplicación entre proyección, balance y estadísticas.

### Fase B — loop de carrera

- Corregir Semana Rápida y definir qué ocurre si se pulsa en sábado/domingo.
- Convertir ofertas en entidades con generación, vencimiento y validación.
- Separar preparación, guanteo, pelea, lesión, tratamiento y recuperación.
- Hacer explícita la promoción profesional y el estado “elegible”.

### Fase C — población y mundo

- Permitir realmente 10 amateurs y 10 profesionales, separando capacidad de alumnos en formación.
- Persistir resultados de rivales, retiros, nacimientos y clubes activos.
- Conectar ranking, Salón de la Fama, récords y calendario.

### Fase D — economía y comunicación

- Registrar cada movimiento con categoría, origen, costo, ingreso y semana.
- Hacer que la proyección sea una vista del mismo cálculo usado por el cierre.
- Definir deuda, tratamiento, patrocinio, recaudación y eventos con límites claros.
- Actualizar seguidores con ganancias y pérdidas explicables.

### Fase E — persistencia y aceptación

- Añadir migraciones versionadas, recuperación del respaldo y diagnóstico visible.
- Retirar JSON de la UX de jugador.
- Implementar las 12 pruebas de aceptación y un escenario largo determinista con semilla.

## 5. Criterio de aprobación end-to-end

La Auditoría 5 no se considera cerrada hasta que una carrera determinista pueda:

- comenzar y terminar el onboarding;
- entrenar y guantear sin duplicar sesiones;
- licenciar un púgil y pactar una pelea válida;
- resolverla y actualizar récord, bolsa, fama, seguidores, lesión, ranking e historial;
- avanzar varias semanas con eventos y economía reconciliada;
- llenar y liberar cupos sin perder alumnos;
- guardar, recargar y continuar idénticamente;
- retirar una leyenda y verla en el Salón de la Fama;
- completar el legado sin destruir el historial anterior;
- ejecutarse sin excepciones, recursos faltantes ni estados imposibles.

## Conclusión

La lógica central ya tiene una buena base y las pruebas actuales son útiles, pero todavía cubren más el motor que la experiencia de una carrera. Los dos defectos funcionales más urgentes son el límite real de plantilla —14 frente a las 20 plazas anunciadas— y el flujo de Semana Rápida en sábado. Antes del playtest final hay que convertir los contratos implícitos en invariantes, agregar pruebas de aceptación de carrera completa y reconciliar economía, población, ranking y persistencia.
