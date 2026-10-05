# Documento Técnico Canónico

## Contrato R4 vigente — 2026-10-05

Schema actual10. Migraciones7→8 (guía),8→9 (financiación) y9→10 (presentación) son explícitas e idempotentes.9→10 no inventa identidad de registros anteriores. Un campo reservado presentacion previo, una metadata inválida o un schema futuro bloquean escritura; no se eliminan para permitir autosave. Originales y backups siguen protegidos por R1, incluidas escrituras fallidas y colisiones. Extensiones válidas desconocidas y ceros sobreviven al roundtrip.

Revisión crítica PR6 (informe56): el esquema se consulta por propiedades propias. Extensiones JSON `constructor`, `toString` y `__proto__` se conservan sin invocar setters de prototipo. El arranque valida la preferencia de idioma vigente después de la descarga, no únicamente la leída al iniciarla; si quedó pendiente otro catálogo, no monta autosave y ofrece reintento explícito. Restauración de foco comprueba el resultado efectivo y descarta disparadores deshabilitados. Perfil decide composición también por área neta observada, no solo por ventana: conserva acceso explícito a resumen, cursos y compras cuando la cabecera crece. No se modifican economía ni reglas.

Contenido nuevo comparte plantillas fuente en game/messageContent.ts y añade presentacion:{id,parametros} opcional a libros, prensa, avisos y resultados. Importe, concepto literal y método deportivo siguen siendo datos de dominio. Traducir requiere ID, slots exactos y coincidencia de texto fuente; referencias a equipos/cursos/propiedades/eventos/resultados se validan, nombres propios no se reinterpretan. Historia sin identidad fiable queda literal y marcada histórica. Ninguna decisión contable compara texto traducido; financiación utiliza claseContable.

PrepararIdioma resuelve el catálogo validado antes de montar GameProvider/autosave. Fallo de recurso/almacenamiento no cambia preferencia ni partida; reintento o español solo para esta sesión son explícitos. es/en/pt-BR comparten1175 claves y parámetros. Conservación de guía es independiente de nuevos alumnos, bajas y cambios de enfoque; si salieron todos los iniciales antes de confirmar, el paso pendiente usa alumnos actuales, según decisión aprobada.

Los diálogos comparten pila, IDs únicos, foco y fondo inert. Detalle se pagina por grafemas sin partir ZWJ, banderas ni acentos. La capacidad de grilla y sus columnas/filas se deciden juntas, no con breakpoints contradictorios. No cambiar motor, economía ni RNG para resolver layout. Evidencia y límites por artefacto en informe55; esto no es aceptación del gate ni compatibilidad universal.

## Continuación R4 — 2026-10-03, sin aceptación

Schema9 incorpora migración explícita8→9 para separar financiación de etiquetas visibles. Solo el desembolso de ingreso legacy con la plantilla exacta conocida recibe `claseContable: "financiacion"`; importes, textos, orden y extensiones permanecen intactos. Gastos y etiquetas desconocidas no se reclasifican. Colisiones antiguas con el campo reservado bloquean migración/escritura, conservando originales y backups. Los desembolsos nuevos usan el tipo de comando, no el texto; el costo financiero comparte su función numérica entre previsión y aviso. No hay fechas, pagos ni cambios de parámetros nuevos.

El progreso de guía dañado sigue protegido para schema8 y9. La actualización de la assertion histórica de R2 cambia exclusivamente el destino exacto de schema8 a9, conservando la igualdad completa del estado y la idempotencia. El detalle literal se pagina por grafemas con `Intl.Segmenter`, preservando acentos compuestos, banderas y secuencias ZWJ; verificar la disponibilidad en los navegadores objetivo antes de certificar compatibilidad universal.

Minificación Terser como dependencia de desarrollo fijada, sin opciones inseguras ni cambios de target. Los límites560KiB JS/90KiB CSS permanecen iguales; medir además recursos JSON externos. La nueva configuración invalida evidencia de navegador del bundle anterior: ejecutar sobre artefactos nuevos e inmutables. Ver informe55; catálogo global y aceptación R4 todavía pendientes.

## Actualización R3 aprobada — 2026-10-01

Revisión PR5 (informe53): la autorización titular operacional expira al cancelar/resolver, sin borrar resultados ni contratos del historial. Una identidad de cobro dañada o una extensión antigua que colisione con el nuevo campo reservado bloquea migración/escritura; no se asigna objetivo ni se reemplaza extensión. ID externo sano permanece intacto.

Schema7 y migración explícita6→7 idempotente: consolidación por objetivo, archivo sin falso cobro y preservación de IDs/extensiones. Evidencia de pago dañada bloquea escritura ambigua, original protegido. contratosTitularesHistoricos deriva IDs pactados pre-R3, excepción solo título/TV, no seguridad médica/identidad/fecha. Checkpoints intactos. economy.ts comparte importes deterministas; RNG separado. UI/reducer comparten puedeContratarPersonal. Carga no regenera ofertas.


**Proyecto:** La Vida del Boxeo  
**Versión:** 1.0  
**Estado:** Contrato técnico para futuras implementaciones

## 1. Objetivo

Este documento define cómo se programa, prueba, persiste y extiende el juego. Toda modificación futura debe respetar estas reglas o actualizar explícitamente este documento.

## 2. Arquitectura objetivo

```text
UI React
  ↓ selectors / view-models
Application commands
  ↓
Domain modules
  ├─ club
  ├─ roster
  ├─ training
  ├─ bouts
  ├─ economy
  ├─ events
  ├─ calendar
  └─ progression
  ↓
Persistence + migrations
```

La UI no debe implementar reglas de negocio. El motor no debe conocer clases CSS. Los datos de contenido no deben depender de textos traducidos.

### Regla de transición de circuito

La elegibilidad para el profesionalismo se deriva del pugilista y del estado del club: debe ser federado amateur con 50 peleas amateurs, sin combate pendiente y con plaza profesional disponible. Llegar al umbral no modifica el circuito por sí solo; la UI despacha el comando `PROMOVER_PRO`, y el reducer vuelve a validar todos los requisitos. El cambio conserva contadores y récord históricos; las validaciones de UI nunca sustituyen las del dominio.

## 3. Estructura recomendada

```text
src/
  app/
    commands.ts
    selectors.ts
    reducer.ts
  domain/
    calendar/
    club/
    economy/
    events/
    progression/
    roster/
    training/
    bouts/
  content/
    equipment.ts
    staff.ts
    courses.ts
    titles.ts
    events.ts
  persistence/
    schema.ts
    migrations.ts
    storage.ts
  ui/
    primitives/
    layout/
    feedback/
  i18n/
    locales/
```

La migración es incremental. Se pueden conservar `engine.ts` y `state.tsx` como fachadas mientras las reglas se extraen.

## 4. Contratos de dominio

### IDs

Todas las entidades persistentes deben tener ID estable. No se usa el nombre visible como clave.

### Estado fuente y estado derivado

Estado fuente: identidad, dinero, movimientos, pugiles, clubes, fechas, contratos y eventos.  
Estado derivado: ranking, cupos, proyecciones, etiquetas de record y agenda calculada.

Los derivados se obtienen mediante selectores puros y no se guardan salvo que exista una razón de rendimiento documentada.

### Comandos

Toda acción del jugador debe ser un comando explícito, por ejemplo:

```ts
type Command =
  | { type: "TRAINING_SET_FOCUS"; pugilId: string; focusId: string }
  | { type: "LICENSE_AMATEUR"; pugilId: string }
  | { type: "SCHEDULE_BOUT"; pugilId: string; offerId: string }
  | { type: "BUY_EQUIPMENT"; itemId: string }
  | { type: "ADVANCE_DAY" };
```

Cada comando debe validar requisitos, producir cambios deterministas y registrar consecuencias.

## 5. Reglas de implementación

1. Una regla crítica debe tener una sola función fuente.
2. Las funciones de dominio son puras siempre que sea posible.
3. El azar se inyecta o encapsula para poder reproducir una partida de prueba.
4. No usar `Math.random()` directamente en diez sistemas diferentes sin un servicio común.
5. No duplicar cálculos de fecha, cupos, dinero, record o ranking en componentes.
6. Evitar `as` para datos externos; validar antes de convertir.
7. No usar textos visibles como lógica.
8. No esconder una incompatibilidad con `any` o un cast amplio.
9. Las acciones económicas son atómicas.
10. Los efectos visuales no pueden cambiar reglas.

## 6. Economía técnica

Toda modificación de saldo utiliza un servicio transaccional:

```ts
type LedgerEntry = {
  id: string;
  day: number;
  week: number;
  kind: "income" | "expense" | "investment" | "debt";
  category: string;
  amount: number;
  sourceId?: string;
  labelKey: string;
};
```

El saldo se deriva del saldo inicial más el libro o, si se mantiene materializado, se verifica contra el libro en cada cierre.

**Implementación vigente (2026-09-23, gate de prototipo):** el reducer mantiene libros semanales de ingresos/gastos en `EstadoJuego`, registra automáticamente deltas de caja de las acciones, incluye los movimientos previos al cierre y aplica el domingo solo la liquidación nueva. El balance concilia contra el cambio de saldo del período y el libro se reinicia al comenzar la semana siguiente. `schemaVersion` 4 limpia las líneas históricas ambiguas en la migración, conservando saldo y progreso. Esto es una base transicional; antes de añadir multi-sede/contabilidad detallada se debe extraer al servicio transaccional tipado indicado arriba (IDs estables, categoría, día/semana y origen), manteniendo la invariante y migración.

Las actividades sociales toman inversión, rango de retorno, nombre y emoji desde `COMUNITARIOS` (fuente única; no mantener tablas paralelas de valores). `claseAbierta` añade un recreativo temporal sujeto al tope 12 y genera su cuota semanal. Los valores vigentes y pruebas seed 260923 para horizontes 12/52 semanas están documentados en el gate 27. El costo de caja negativa se calcula como `clamp(ceil(3% de deuda), $10, $50)` tanto en el cierre real como en la proyección. Reduce el crecimiento compuesto sin límite, pero la carrera aún puede quedar bloqueada por una deuda severa; consultar Gate 28. No agregar rescates/re-préstamos antes de acordar topes, frecuencia y penalizaciones, y probarlos por varios horizontes.

## 7. Tiempo y calendario

Crear un servicio único con:

- `dateFromGameState`;
- `advanceDay`;
- `weekRange`;
- `isExpired`;
- `isAvailableForBout`.

Ningún componente debe construir fechas manualmente. Todos los eventos temporales almacenan una fecha o un intervalo, no solo texto.

## 8. Persistencia y migraciones

La partida persistida debe incluir:

```ts
type SaveEnvelope = {
  format: "vida-del-boxeo";
  schemaVersion: number;
  savedAt: string;
  checksum?: string;
  state: GameState;
};
```

Cada versión tiene una migración:

```ts
const migrations: Record<number, (old: unknown) => unknown> = {};
```

Una migración debe ser idempotente, registrar diagnóstico y ejecutar validación posterior. Las partidas corruptas se conservan en respaldo antes de reparar.

## 9. Contenido modular

Equipos, cursos, personal, títulos, eventos, rasgos y sponsors se definen por IDs y datos. Un contenido nuevo debe especificar:

- ID;
- nombre traducible;
- descripción traducible;
- requisitos;
- costo;
- efectos;
- categoría;
- versión de introducción;
- pruebas.

La lógica interpreta efectos declarativos en lugar de conocer cada nombre por separado.

## 10. UI técnica

La UI consume view-models. Un view-model prepara:

- texto localizado;
- estados de habilitado/bloqueado;
- acciones posibles;
- datos de accesibilidad;
- paginación;
- resumen y detalle.

Los componentes compartidos obligatorios son: botón, modal, tarjeta, toast, tooltip, tab, barra de estadística, estado vacío, confirmación y paginador.

## 11. Internacionalización

El código usa `t(key, params)`. Los datos guardan `nameKey`, `descriptionKey` y `effectKey`. No se concatena texto visible en el reducer. Los nombres propios del jugador y clubes se preservan.

## 12. Errores y observabilidad

Toda operación puede producir:

- resultado exitoso;
- bloqueo explicado;
- reparación de compatibilidad;
- error inesperado con código diagnóstico.

En desarrollo se registran comando, entidad, semana y motivo. En producción no se exponen datos privados ni se rompe el flujo.

## 13. Pruebas obligatorias

- unitarias de dominio;
- reducer y comandos;
- migraciones con fixtures;
- propiedad/invariantes;
- componentes y estados límite;
- E2E de rutas principales;
- visuales por viewport;
- pseudo-localización;
- simulación larga;
- build y auditoría estructural.

Una feature no se acepta si solo tiene una prueba manual.

## 14. Definition of Done técnica

- typecheck verde;
- tests verdes;
- build verde;
- lint o auditoría estructural verde;
- migración o compatibilidad documentada;
- selector y comando sin duplicación;
- UI comprobada en las resoluciones objetivo;
- textos con claves;
- documento canónico actualizado;
- commit pequeño y descriptivo.

## 15. Integración futura

Google Login, sincronización online, monetización y backend deben ser adaptadores. No se permite introducir SDK, autenticación o red directamente en el dominio del juego.

## Contrato vigente R2 — 2026-10-01

Schema actual **6**, con migración explícita/idempotente 5→6 que añade `combateActivo` sin transformar campos válidos existentes. El contrato R1 siguiente permanece vigente; su referencia a schema 5 describe su cierre histórico. Un checkpoint inválido se rechaza con protección de originales, no se reemplaza por un combate curado.

El avance normal/rápido comparte transición civil; las obligaciones pendientes bloquean avanzar/liquidar. Sesiones reales gobiernan licencia; disponibilidad médica, rival individual y crecimiento monotónico se obtienen por selectores comunes. Resultados completos requieren comprobante del motor y validación del reducer; no se paga dos veces. RNG propio/checkpoint permiten reanudar dominio sin rerollear; presentación vuelve a pausa segura. Empate exacto sin sesgo: 10–10; consenso 2–0: Decisión Mayoritaria. No se alteran precios ni parámetros económicos. Evidencia y límites: informe 46; rendimiento/hardware: informe 47. No autoriza R3–R5 ni BOX-15.

## Contrato operacional R1 — 2026-10-01

Schema actual 5. `saveValidation.ts` contiene migraciones explícitas 1→2→3→4→5 y validación recursiva con diagnósticos; `saveRepository.ts` gobierna lectura/escritura mediante adaptador inyectable. Cargar no genera población, consume RNG ni aplica progresión. Todo dato válido actual se conserva exactamente en guardar→cargar: ceros, falsos, orden, arrays vacíos, resumen y libros.

Reparación/migración exige proteger y verificar bytes originales antes de reemplazar. Se conserva la transición histórica 3→4 del libro ambiguo, sin aplicarla a partidas actuales. Schema futuro, envelope contradictorio e identidad conflictiva bloquean escritura. No se infiere récord profesional desde el agregado. Memoria fallback no es persistencia durable.

Solo hay éxito después de readback exacto y cierre de journal before/after. Journal corrupto bloquea recuperación automática. Cinco ranuras sin expulsión silenciosa; sexta exige eliminación explícita. Error operacional visible/reintentable, no serializado como progreso.

`archivoCarreras` conserva snapshots de toda baja competitiva separado del Salón y sin ventajas de juego; datos ya perdidos no se inventan. Garantía de journal limitada a un escritor; multi-tab requiere diseño aprobado. Evidencia: `docs/audits/45_Gate_R1_Partidas_Carrera_2026-10-01.md`.
# Gate 30 — guardas de nómina y reconstrucción de carrera

`proyeccionSemanalRecurrente(estado)` reutiliza la proyección del motor con semana mínima 2 y vacía actividades comunitarias y patrocinio temporal, para no presentar ingresos no recurrentes como sostenibilidad. `CONTRATAR` vuelve a calcular después de aplicar el salario propuesto: si el total recurrente es negativo y `confirmado` no es true, no muta el estado y devuelve advertencia. La interfaz presenta el mismo cálculo y solicita una acción afirmativa; el reducer es la autoridad final.

`CERRAR_CLUB` es una acción separada, nunca automática: el reducer exige `dinero <= -1500` y `confirmado: true`. Se construye el estado de inicio nuevo manteniendo `partidaId`, el nombre del entrenador, récord acumulado (`peleas`, `victorias`, `kos`, `veladas`, `titulos`) y `salonFama`. Todo lo demás procede de `crearEstadoBase`, incluido `legados = 0`, para impedir transferencia de beneficios o bucles de cierre. La interfaz explica expresamente las pérdidas y el saldo inicial de $900. El autosave del estado reconstruido sustituye la carrera anterior con el mismo id tras la confirmación. Tests y límites: `docs/audits/30_Gate_Politica_Insolvencia_y_Cierre_2026-09-23.md`.
