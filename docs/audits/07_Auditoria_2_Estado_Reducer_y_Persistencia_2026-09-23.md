# Auditoría 2 — Estado, reducer y persistencia

**Proyecto:** La Vida del Boxeo  
**Fecha:** 23 de septiembre de 2026  
**Alcance:** estado fuente, acciones del reducer, guardado automático, partidas guardadas, sanitización, compatibilidad de versiones y recuperación ante corrupción.  
**Estado:** auditoría realizada; correcciones pendientes de implementación.

## 1. Resultado

La lógica principal está funcionando y tiene buena cobertura de invariantes: el typecheck pasa y los 23 tests actuales pasan. Sin embargo, la persistencia todavía no cumple completamente el contrato técnico para un juego que debe actualizarse durante años sin romper partidas.

| Área | Estado | Severidad | Hallazgo |
|---|---:|---:|---|
| Reducer central | Amarillo | P1 | Tiene todas las acciones, pero concentra muchos dominios. |
| Guardado automático | Amarillo | P1 | Guarda cada cambio, pero ignora fallos y duplica estado. |
| Versionado | Rojo | P0/P1 | No hay envelope ni migraciones formales. |
| Sanitización | Amarillo | P1 | Se valida parcialmente el pugil, pero no todas las entidades. |
| Recuperación | Amarillo | P1 | Hay respaldo, pero falta diagnóstico y restauración explícita. |
| Idempotencia | Amarillo | P1 | Hay algunas guardas, pero faltan tests sistemáticos. |
| Futuro multiplataforma | Rojo | P1 | No existe adaptador para reemplazar localStorage por nube. |

## 2. Lo que funciona

1. GameProvider centraliza el estado React.
2. El reducer puede probarse sin montar React.
3. Las acciones críticas validan licencia, energía, lesión, cupo, dinero y peleas pendientes.
4. guardarPartida conserva un respaldo previo.
5. sanitizarEstado rellena campos nuevos y genera rivales faltantes.
6. normalizarListaEspera se ejecuta al cargar y después de operaciones relevantes.
7. Las partidas tienen nombre, coach, gimnasio, semana, día, dinero e identificador.
8. Los tests cubren 120 semanas, licencias, cupos, espera, peleas, atajos y sanitización básica.

## 3. Modelo observado

El estado persistido contiene identidad, dinero, fama, seguidores, fecha, plantel, rivales, ofertas, peleas, equipamiento, cursos, personal, propiedades, patrocinio, eventos, actividades sociales, consejos, prensa, cinturones, Salón de la Fama, libros contables, resumen, estadísticas, toasts y metadatos.

Hay valores temporales o derivados guardados junto al progreso:

- resumen;
- toasts;
- ofertas y ofertasPara;
- libros de ingresos y gastos;
- estadísticas agregadas;
- mes y año, que también se calculan desde semana y día;
- parte de la agenda calculada.

Esto aumenta el riesgo de contradicción después de una migración.

## 4. Hallazgos

### B1 — No existe un envelope ni una migración formal

**Severidad:** P0 para escalabilidad de partidas; P1 para la versión actual.

El código guarda directamente EstadoJuego. Aunque existen version y schemaVersion, sanitizarEstado fuerza los valores actuales en vez de ejecutar transformaciones por versión.

**Riesgos:**

- una partida futura puede aceptarse como actual;
- no se sabe qué reparaciones se ejecutaron;
- no se puede distinguir estado legítimo de objeto parcial;
- una actualización grande puede cambiar reglas sin migración explícita.

**Solución:** crear un sobre con format, schemaVersion, savedAt, state y diagnostics. Crear una cadena idempotente de migraciones, validación y sanitización.

**Test de cierre:** fixtures de versiones antiguas, actual y futura; migración repetida dos veces sin cambios adicionales; versión futura rechazada sin sobrescribir la válida.

### B2 — La sanitización profunda es incompleta

**Severidad:** P1.

Se validan parcialmente los pugiles, pero eventos, historial, estadísticas, cursos, personal, propiedades, prensa, cinturones, consejos y actividades aceptan casts amplios. Una pelea puede conservar un miId inexistente y una lesión puede llegar con forma inválida.

**Solución:** validadores por entidad: pugil, evento, resultado, pelea, stats, personal, consejo y catálogo. Todo dato inválido debe eliminarse o repararse con diagnóstico.

**Test de cierre:** cargar null, strings, arrays incompletos, NaN, campos desconocidos y referencias inexistentes en todas las colecciones sin romper la aplicación.

### B3 — El estado está duplicado en guardado principal y ranuras

**Severidad:** P1.

La misma partida completa se guarda en la clave principal y dentro de la lista de ranuras. Además existen respaldo y fecha separadas.

**Riesgos:** más consumo de cuota, estados desfasados, escritura parcial y falta de transacción real.

**Solución:** una fuente principal clara, ranuras con metadatos y estado definido, operación de escritura preparada y verificada, y política explícita ante fallos.

**Test de cierre:** simular cuota insuficiente o fallo de escritura y comprobar que nunca desaparece la última partida válida.

### B4 — Los fallos de guardado automático se silencian

**Severidad:** P1.

GameProvider llama guardarPartida, pero ignora el resultado booleano. El jugador puede cerrar la pestaña creyendo que su partida está guardada.

**Solución:** devolver un resultado estructurado, informar cuota agotada o almacenamiento bloqueado, mostrar “Guardado pendiente” y permitir reintento.

**Test de cierre:** bloquear localStorage, llenar la cuota y provocar error de serialización; la interfaz debe informar y nunca afirmar falsamente que guardó.

### B5 — Un guardado inválido se reemplaza por el estado base sin diagnóstico

**Severidad:** P1.

Si el JSON no parsea, cargarInicial devuelve una partida nueva base. Luego el efecto de GameProvider puede guardar ese estado base. Hay respaldo, pero no hay aviso claro de recuperación.

**Solución:** preservar el original con fecha, devolver diagnóstico, mostrar recuperación parcial y permitir continuar con el estado reparado.

**Test de cierre:** JSON roto, JSON incompleto y versión futura deben producir mensajes distintos y conservar el guardado previo.

### B6 — La acción IMPORTAR sigue en el contrato de producto

**Severidad:** P2 actual; P1 de consistencia.

La interfaz visible ya no expone importar/exportar JSON, pero Accion todavía incluye IMPORTAR y el reducer acepta un EstadoJuego externo sin pasar por el flujo formal de migración.

**Solución:** eliminarla del contrato de jugador o aislarla en herramientas internas. Si se conserva, debe migrar, sanitizar y validar antes de usarse.

**Test de cierre:** el build público no muestra controles JSON y el reducer no acepta estado externo sin validación.

### B7 — No todas las acciones validan en tiempo de ejecución

**Severidad:** P1.

CAMBIAR_COMBO no verifica combo válido; EVENTO confía en opciones y acciones; compras asumen IDs de catálogo; TOAST no limita texto; CONTINUAR solo fuerza creado.

**Solución:** frontera única de comandos validados. Las acciones inválidas deben producir un bloqueo diagnosticable, nunca una excepción ni una mutación parcial.

**Test de cierre:** IDs desconocidos, números extremos, strings vacíos y estados incompletos en cada acción.

### B8 — Falta una prueba de idempotencia general

**Severidad:** P1.

Hay guardas para varias acciones, pero no existe una suite que pruebe doble ejecución de compra, contratación, recompensa, pelea, evento, avance de día, licencia y actividad social.

**Solución:** definir idempotencia por comando y probar doble clic o reenvío para cada acción económica y competitiva.

### B9 — Dinero, libros y resumen no tienen reconciliación única

**Severidad:** P1.

El saldo cambia en varias ramas del reducer y el libro se actualiza por operación, pero no existe un ledger único ni un reconciliador. Algunos movimientos se registran netos y otros separados.

**Riesgo:** dinero, resultado neto, libro y balance visible pueden divergir.

**Solución:** aplicar todo movimiento mediante una operación atómica con tipo, categoría, monto, origen y etiqueta. Verificar saldo y resumen contra el libro.

**Test de cierre:** toda acción monetaria genera exactamente una línea; la suma del libro coincide con la variación de caja; reproducir movimientos reconstruye el saldo.

### B10 — Estadísticas globales y récords individuales no tienen reconciliación

**Severidad:** P1.

El reducer actualiza estadísticas globales y récord individual por caminos diferentes. Falta detectar victorias, KOs, títulos y peleas profesionales inconsistentes.

**Solución:** definir qué dato es histórico fuente y qué dato es resumen. Si el historial se limita a 12 resultados, los contadores acumulados deben quedar validados como fuente.

**Test de cierre:** 100 peleas simuladas, guardar/cargar, migrar y comprobar todos los contadores.

### B11 — La fecha tiene varias representaciones

**Severidad:** P1.

El estado guarda día, semana, mes y año, mientras el Calendario vuelve a calcular la fecha desde semana y día. Esto puede hacer que TopBar y Calendario diverjan después de muchas semanas o al cargar una partida vieja.

**Solución:** usar una representación canónica o un servicio de calendario que normalice y valide todas.

**Test de cierre:** 120 semanas, cambio de año, febrero, carga y avance desde sábado/domingo deben mostrar la misma fecha en todas las vistas.

### B12 — Estado temporal mezclado con progreso permanente

**Severidad:** P2.

Toasts, resumen y ofertas de UI viven dentro del EstadoJuego. La sanitización limpia algunos al cargar, pero la separación no es explícita.

**Solución:** separar progreso persistente, eventos de aplicación y estado efímero de interfaz.

**Test de cierre:** guardar durante un modal, cerrar, cargar y verificar que no reaparezcan toasts ni modales viejos, pero sí peleas, agenda y progreso.

## 5. Matriz mínima de pruebas

### Carga y recuperación

- [ ] sin guardado;
- [ ] guardado válido;
- [ ] versión anterior;
- [ ] JSON truncado;
- [ ] tipos incorrectos;
- [ ] colecciones con elementos inválidos;
- [ ] referencias inexistentes;
- [ ] dinero negativo;
- [ ] eventos vencidos;
- [ ] nombres Unicode;
- [ ] plantel lleno;
- [ ] 120 semanas.

### Escritura

- [ ] guardado automático;
- [ ] guardado manual;
- [ ] dos guardados seguidos;
- [ ] cuota agotada;
- [ ] localStorage bloqueado;
- [ ] error de serialización;
- [ ] recuperación desde respaldo;
- [ ] borrar una ranura sin borrar otra;
- [ ] cinco ranuras;
- [ ] dos pestañas abiertas.

### Reducer

- [ ] cada comando válido;
- [ ] cada comando inválido;
- [ ] doble ejecución;
- [ ] día incorrecto;
- [ ] dinero insuficiente;
- [ ] cupo lleno;
- [ ] entidad ausente;
- [ ] acción después de cargar;
- [ ] acción después de migrar.

## 6. Plan de solución

### Fase 1 — Contrato de guardado

1. Crear SaveEnvelope.
2. Definir versión actual.
3. Crear migraciones idempotentes.
4. Separar parseo, migración, sanitización y guardado.
5. Crear fixtures.

### Fase 2 — Adaptador de almacenamiento

1. Crear interfaz SaveStore.
2. Implementar LocalStorageSaveStore.
3. Manejar cuota y almacenamiento bloqueado.
4. Mantener respaldo fechado.
5. Preparar adaptador remoto futuro.

### Fase 3 — Comandos y reducer

1. Validar acciones en una frontera.
2. Extraer comandos por dominio.
3. Probar idempotencia.
4. Separar estado persistente y efímero.
5. Mantener compatibilidad con la UI.

### Fase 4 — Ledger y reconciliación

1. Normalizar movimientos económicos.
2. Crear reconciliador de dinero.
3. Crear reconciliador de récords y estadísticas.
4. Ejecutar reconciliación al cargar y en tests largos.

### Fase 5 — Tiempo y agenda

1. Crear servicio de calendario.
2. Normalizar día, semana, mes y año.
3. Migrar Calendario, TopBar y eventos.
4. Probar año, mes y partidas antiguas.

## 7. Criterios de cierre

La auditoría no se considera cerrada hasta que:

- las versiones soportadas migren sin perder progreso;
- el guardado fallido sea visible;
- no exista función pública de importar/exportar JSON;
- los comandos inválidos no lancen excepciones;
- toda modificación monetaria sea reconciliable;
- el doble clic no duplique nada;
- la fecha sea idéntica en todas las pantallas;
- la simulación larga incluya guardar/cargar periódicamente;
- typecheck, tests, build y auditoría estructural pasen.

## 8. Conclusión

La partida es jugable y resistente en los caminos principales, pero la persistencia todavía es una implementación local defensiva, no un sistema de guardado versionado preparado para años de actualizaciones.

Prioridad:

1. envelope y migraciones;
2. validación profunda;
3. almacenamiento con resultado visible;
4. comandos idempotentes;
5. ledger y reconciliación;
6. calendario como fuente única.

Solo después de cerrar estos puntos la partida estará preparada para evolucionar hacia cuentas y sincronización entre dispositivos.

