# Documento Técnico Canónico

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
