# Auditoría completa de arquitectura, diseño y escalabilidad

## Propósito

Este documento audita el juego tal como existe hoy. No propone rehacer la identidad visual, cambiar el estilo artístico ni iniciar un playtest de usuario. El objetivo es detectar puntos ciegos que puedan impedir:

- mejorar lo existente sin romperlo;
- agregar sistemas, contenido, gimnasios, ligas y temporadas;
- traducir el juego completamente;
- mantener partidas antiguas;
- sostener una interfaz sin cortes;
- trabajar con más de una persona o equipo a futuro.

## Conclusión ejecutiva

La base es jugable y tiene una separación inicial razonable entre componentes, motor, estado, datos y tipos. Sin embargo, todavía no conviene declarar la arquitectura lista para expansión grande. El riesgo principal no está en una función aislada, sino en la acumulación de reglas dentro de pocos archivos centrales y en que varias fuentes de verdad todavía están duplicadas.

### Diagnóstico general

| Área | Estado | Riesgo para escalar |
|---|---|---|
| Motor de reglas | Funcional, pero concentrado | Alto |
| Estado y reducer | Funcional, con demasiadas responsabilidades | Alto |
| Datos de contenido | Tipados, pero mezclados con reglas y textos | Alto |
| Persistencia | Tiene sanitización y versión, sin migraciones formales | Alto |
| Calendario | Visible y jugable, con lógica de fecha duplicada | Medio/alto |
| Economía | Conectada, pero distribuida en varios puntos | Alto |
| Interfaz | Mejorada y sin scroll intencional, pero frágil ante densidad | Alto |
| Traducción | Preparada parcialmente, no integrada en toda la UI | Alto |
| Pruebas | 23 pruebas de motor, sin matriz visual/E2E completa | Alto |
| Modularidad de contenido | Baja: agregar una mecánica exige tocar varios archivos | Alto |
| Assets 2D/3D | Correctamente fuera de alcance | Bajo |

## 1. Auditoría de arquitectura de código

### 1.1 Estado actual

La aplicación tiene estas capas reconocibles:

```text
App / componentes visuales
        ↓
GameProvider + reducer
        ↓
engine.ts + data.ts + types.ts
        ↓
localStorage / partida local
```

Esto es una buena base, pero `state.tsx`, `engine.ts`, `panels.tsx`, `CityMap.tsx` y `FightScreen.tsx` concentran demasiado comportamiento. En particular:

- `engine.ts` mezcla generación procedural, economía proyectada, entrenamiento, matchmaking, combate, ranking, sanitización y utilidades;
- `state.tsx` mezcla transición de días, eventos, finanzas, personal, licencias, consejos, scouting, guardado y mensajes;
- `panels.tsx` contiene Plantel, Mercado, Perfil, Personal y partes de eventos;
- `data.ts` contiene contenido, precios, requisitos, textos y nombres de reglas;
- los componentes visuales conocen detalles internos del dominio.

### 1.2 Punto ciego principal

Agregar una nueva mecánica todavía obliga a editar varios archivos manualmente. Esto aumenta el riesgo de que exista una acción visible sin efecto, una regla aplicada solo desde un botón, una regla aplicada solo al avanzar el día o un texto desactualizado.

### 1.3 Mejora recomendada, sin rediseño

Separar gradualmente por dominios, conservando las funciones públicas actuales como fachada:

```text
src/game/
  domain/
    club/
    roster/
    training/
    bouts/
    economy/
    events/
    calendar/
    progression/
  content/
    equipment.ts
    courses.ts
    staff.ts
    events.ts
    localization-keys.ts
  persistence/
    schema.ts
    migrations.ts
    storage.ts
  application/
    commands.ts
    selectors.ts
    reducer.ts
```

No es necesario hacer una reescritura inmediata. La migración debe hacerse módulo por módulo, dejando adaptadores para no romper el juego actual.

## 2. Auditoría del estado y del reducer

### Hallazgos

1. El estado es un objeto grande y válido, pero contiene datos derivados junto con datos fuente.
2. Muchas operaciones recorren todo `plantel` y recalculan conteos en la UI.
3. Algunas reglas dependen de texto, tipo de evento o combinaciones de campos en lugar de una entidad de dominio explícita.
4. El reducer es la puerta correcta para el juego, pero algunas transiciones podrían convertirse en comandos más pequeños.
5. Los mensajes y toasts son efectos visuales mezclados con cambios de estado.

### Riesgos

- una futura actualización puede guardar datos contradictorios;
- dos pantallas pueden calcular un contador de forma distinta;
- agregar multiclub, ligas o temporadas puede volver costosa la actualización del estado completo;
- los efectos de economía y progreso pueden ejecutarse dos veces si se añade otro camino de transición.

### Solución arquitectónica

Definir tres tipos de datos:

- **fuente:** dinero, fama, seguidores, identidad, IDs, récords y fechas;
- **derivado:** cupos, balance proyectado, ranking, estado del récord y agenda;
- **evento histórico:** ingresos, gastos, lesiones, peleas, decisiones y recompensas.

Los derivados deben vivir en selectores puros. Los históricos deben registrarse como hechos inmutables o entradas de libro. Esto facilita estadísticas, replays, auditoría económica y sincronización futura.

## 3. Auditoría de persistencia y actualización futura

### Estado actual

Existe guardado local, ranuras, respaldo, `schemaVersion` y sanitización. Eso es positivo, pero todavía no hay un sistema formal de migraciones por versión.

### Puntos ciegos

- partidas antiguas pueden tener campos nuevos ausentes, pero también valores semánticamente viejos;
- la sanitización corrige tipos, no necesariamente transforma reglas antiguas;
- no existe un registro explícito de migraciones aplicadas;
- no hay checksum, control de corrupción ni reporte detallado de qué se reparó;
- la futura cuenta Google no tiene aún un modelo de identidad separado del estado local.

### Requisito para escalar

Crear migraciones explícitas:

```text
v1 → v2: nombres antiguos de licencia
v2 → v3: seguidores y recreativos
v3 → v4: calendario canónico
v4 → v5: entidades normalizadas y contenido por ID
```

Cada migración debe ser idempotente, testeable y reversible en memoria. La cuenta, la partida y la configuración deben separarse:

```text
Cuenta del jugador
  ├─ preferencias
  ├─ atajos
  └─ partidas
       └─ estado de una carrera
```

## 4. Auditoría del calendario y del tiempo

### Hallazgo

El calendario ya existe, pero la fecha se calcula en más de un componente. El encabezado y la vista de calendario necesitan una única función de fecha canónica.

### Riesgos futuros

- meses con 28, 29, 30 y 31 días;
- años largos;
- eventos que duran días reales y no solo contadores;
- peleas agendadas fuera del sábado;
- temporadas y torneos superpuestos;
- partidas antiguas con mes desincronizado.

### Solución

Crear `calendarService` con:

- `fechaDesdeEstado`;
- `estadoDesdeFecha`;
- `sumarDias`;
- `inicioDeSemana` y `finDeSemana`;
- `venceEvento`;
- reglas de disponibilidad.

Ningún componente visual debería volver a construir `new Date(...)` por su cuenta.

## 5. Auditoría de economía

### Hallazgos

La economía ya conecta cuotas, recreativos, aportes federados, sucursales, patrocinio, marca, veladas, eventos, alquiler y sueldos. El problema de escalamiento es que los ingresos y gastos están distribuidos entre proyección, cierre semanal, eventos, pelea y compras.

### Puntos ciegos

- no existe todavía un catálogo único de fuentes económicas;
- algunas acciones cambian dinero y libro en lugares diferentes;
- los multiplicadores pueden acumularse sin una explicación visible común;
- faltan límites y presupuestos por etapa;
- deuda, préstamo, patrocinio y caja negativa no forman todavía un sistema financiero único;
- el balance puede ser correcto numéricamente pero difícil de auditar si se incorpora un nuevo ingreso.

### Mejora recomendada

Crear una transacción económica única:

```ts
type Movimiento = {
  id: string;
  semana: number;
  dia: number;
  tipo: "ingreso" | "gasto" | "deuda" | "inversion";
  categoria: string;
  monto: number;
  origen: string;
};
```

Toda modificación de dinero debe generar un movimiento. El balance, la previsión, la pantalla de finanzas y futuras estadísticas deben leer ese libro único.

## 6. Auditoría de progresión y contenido

### Riesgos detectados

- límites amateur/profesional están definidos correctamente ahora, pero otras capacidades futuras podrían volver a codificarse a mano;
- requisitos de cursos y personal viven en mapas dispersos;
- consejos de Don Anselmo y eventos pueden crecer en cantidad sin un sistema de objetivos común;
- títulos, ranking y Salón de la Fama aún dependen de campos específicos del pugil;
- falta una definición común para “temporada”, “generación”, “retiro” y “historial”.

### Solución

Declarar contenido como datos versionados:

```ts
type RuleDefinition = {
  id: string;
  requisitos: Requirement[];
  efectos: Effect[];
  textoKey: string;
};
```

Esto permite agregar títulos, ligas, promociones, sponsors, cursos y eventos sin añadir una cadena de `if` nueva cada vez.

## 7. Auditoría de rivalidad, ranking y población

### Estado

Hay generación de rivales, clubes, ranking, cupos, récords, transición profesional y Salón de la Fama.

### Puntos ciegos para expansión

- los rivales generados no tienen todavía una vida persistente completa;
- retiro, nacimiento, caída de rendimiento y cambios de club deben convertirse en simulación poblacional;
- el ranking necesita una temporada y una fecha de corte;
- un ranking mundial, regional y local no debería compartir exactamente la misma fórmula;
- la identidad del club rival debería ser una entidad, no solamente un texto.

### Recomendación

Separar:

- `Club`;
- `Pugil`;
- `Carrera`;
- `Temporada`;
- `RankingSnapshot`;
- `HallOfFameEntry`.

Así se podrá generar una ciudad viva sin inflar la partida del jugador.

## 8. Auditoría de interfaz, canvas y diseño existente

No se recomienda rediseñar la identidad actual. Sí se deben endurecer sus reglas visuales.

### Puntos ciegos

1. La aplicación usa `h-dvh`, `overflow-hidden` y paneles densos. Esto cumple el objetivo de no usar scroll, pero puede ocultar contenido cuando aumenta la cantidad de información.
2. Hay componentes que calculan su layout por pestaña y otros que dependen de clases globales.
3. Las modales tienen overflow oculto; cualquier contenido nuevo debe tener paginación, resumen o expansión controlada.
4. La barra superior puede crecer con sponsors, legados, seguidores y mejoras activas.
5. Los botones todavía pueden romper simetría si el texto traducido es más largo.
6. La ficha técnica, combate, teléfono y ciudad necesitan un contrato común de altura, densidad y jerarquía.

### Sistema visual que falta formalizar

Definir tokens de diseño para:

- alturas de panel;
- tamaños de botón pequeño/normal/principal;
- densidad de texto;
- truncado permitido;
- tooltip permitido;
- paginación;
- estado vacío, bloqueado, recomendado, error y éxito;
- breakpoint mínimo soportado.

Esto mejora lo existente sin cambiar su apariencia.

### Criterio de layout

Cada pantalla debe tener una de estas estrategias, declarada explícitamente:

- **resumen fijo:** todo entra en viewport;
- **paginado:** una colección grande se divide en páginas;
- **modal detallada:** el resumen queda en la pantalla y el detalle se abre;
- **panel por etapas:** se muestra una decisión por vez.

No se debe resolver un recorte agregando más `overflow-hidden`.

## 9. Auditoría de traducción e internacionalización

Existe una base de locales y formateadores, pero la mayoría de los textos visibles siguen escritos directamente en componentes, motor y datos.

### Puntos ciegos

- no todos los textos tienen una clave traducible;
- nombres de acciones, toasts y requisitos salen directamente del reducer;
- pluralización, género y formato de fechas no están abstraídos;
- botones cortos en español pueden desbordar en inglés, portugués u otros idiomas;
- nombres de estilos, títulos y récords pueden requerir contexto.

### Solución

Separar `textoKey` de `textoVisible`, incorporar interpolaciones y probar cada idioma con la misma matriz visual. El idioma no debe modificar reglas, IDs ni datos guardados.

## 10. Auditoría de accesibilidad y UX

### Hallazgos

- la navegación tiene nombres comprensibles;
- existen títulos y ayudas en varias tarjetas;
- aún falta una matriz completa para foco de teclado, contraste, lectura de botones y feedback de errores;
- `window.confirm` sigue siendo una dependencia de UX que no encaja igual en desktop, móvil o futura versión web;
- los elementos visuales con iconos deben tener etiquetas consistentes;
- los mensajes temporales deben tener duración y prioridad normalizadas.

### Mejora

Crear componentes de sistema para confirmación, tooltip, toast, modal y botón. Luego probarlos en todas las pantallas en vez de repetir variantes locales.

## 11. Auditoría de pruebas

### Estado actual

La suite de motor cubre 23 casos y el build/typecheck/auditoría estructural pasan. Eso valida reglas importantes, pero no cubre suficientemente:

- render real de cada pestaña;
- ausencia de cortes en tamaños de ventana;
- navegación de modales;
- atajos y conflictos en UI;
- carga de partidas viejas reales;
- traducciones;
- eventos que vencen;
- balance a largo plazo con decisiones diferentes;
- regresión visual.

### Requisito de escalamiento

Agregar cuatro capas:

1. tests puros de dominio;
2. tests de reducer y persistencia;
3. tests de componentes con estados límite;
4. tests E2E/visual por viewport y recorrido.

Cada nueva mecánica debe nacer con un test de regla, un test de persistencia y un test de interfaz si tiene representación visual.

## 12. Cantidad de auditorías necesarias

Para rellenar los puntos ciegos sin hacer auditorías repetidas o genéricas, hacen falta **10 auditorías especializadas y 2 auditorías de cierre**.

### Las 10 auditorías especializadas

| Fase | Auditoría | Pregunta que debe responder |
|---:|---|---|
| 1 | Arquitectura y dependencias | ¿Qué módulos están demasiado acoplados? |
| 2 | Estado, reducer y comandos | ¿Toda transición tiene una única fuente de verdad? |
| 3 | Persistencia y migraciones | ¿Una partida vieja sobrevive a futuras versiones? |
| 4 | Calendario y simulación temporal | ¿Todos los sistemas comparten el mismo reloj? |
| 5 | Economía y libro contable | ¿Cada peso tiene origen, destino y explicación? |
| 6 | Reglas, progresión y población | ¿El crecimiento del juego es sostenible y extensible? |
| 7 | Contenido y configuración | ¿Agregar contenido evita tocar lógica central? |
| 8 | UI, canvas y sistema visual | ¿Cada pantalla puede crecer sin recortes ni superposición? |
| 9 | UX, accesibilidad y localización | ¿El juego sigue siendo entendible en idioma, tamaño y dispositivo? |
| 10 | Testing, observabilidad y regresión | ¿Podemos demostrar que una actualización no rompe el juego? |

### Las 2 auditorías de cierre

11. **Auditoría de integración completa:** revisa que las diez anteriores no se contradigan.

12. **Auditoría de preparación para expansión:** simula la incorporación de una nueva liga, un nuevo gimnasio, un nuevo idioma, una nueva temporada y un nuevo sistema económico sin implementarlos todavía. Si para agregar cualquiera de ellos hay que duplicar reglas o romper partidas, la arquitectura no está lista.

Estas doce auditorías son suficientes para el cierre arquitectónico inicial. No significan que nunca se audite de nuevo: cada expansión futura debe repetir únicamente las auditorías afectadas y luego pasar una reauditoría de integración.

## 13. Orden recomendado de trabajo

```text
Arquitectura
   ↓
Estado y persistencia
   ↓
Calendario y economía
   ↓
Reglas y contenido
   ↓
UI / UX / traducción
   ↓
Pruebas y observabilidad
   ↓
Integración
   ↓
Preparación para expansión
```

No conviene comenzar por nuevos assets ni por nuevas pantallas. Primero deben quedar estables los contratos que permiten que esos assets y pantallas sean reemplazables.

## 14. Criterio de aprobación

La arquitectura se considera preparada cuando:

- una nueva regla no exige modificar componentes visuales que no la usan;
- una nueva pantalla consume selectores y comandos, no lógica duplicada;
- una partida antigua migra con evidencia y sin pérdida silenciosa;
- el calendario tiene una sola fuente de verdad;
- todo movimiento económico queda registrado;
- el contenido nuevo se agrega por configuración versionada;
- las traducciones no cambian IDs ni reglas;
- cada colección grande tiene resumen, paginación o modal;
- la matriz de pruebas cubre dominio, persistencia, UI y regresión;
- las dos auditorías de cierre no encuentran contradicciones.

## Estado actual de esta auditoría

Esta revisión es diagnóstica y de planificación. No modifica la arquitectura ni rediseña la interfaz. Su siguiente paso correcto es ejecutar las diez auditorías especializadas en orden, documentar cada hallazgo con severidad y solo después implementar los cambios estructurales aprobados.
