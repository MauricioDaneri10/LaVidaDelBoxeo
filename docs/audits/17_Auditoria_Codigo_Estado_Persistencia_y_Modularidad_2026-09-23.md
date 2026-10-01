# Auditoría 5 — Código, estado, persistencia y modularidad

Fecha: 2026-09-23\
Estado: diagnóstico completado; refactor pendiente

## 1. Objetivo

Verificar que las reglas estén separadas de la presentación, que exista una única fuente de verdad para cada dato, que las partidas puedan evolucionar y que el juego se pueda ampliar sin volver a introducir inconsistencias.

## 2. Estado actual positivo

- El motor y el reducer están separados de los componentes visuales.
- Existe un adaptador de persistencia aislado del navegador.
- Existen versión de juego, versión de esquema y migración de partidas.
- Hay semilla determinista para pruebas.
- Hay diagnóstico de cliente separado del estado de la partida.
- El build y el bundle tienen presupuesto automatizado.
- Los tests cubren licencia, lista de espera, préstamos, scouting, límites de plantel, calendario, persistencia y playtest de 52 semanas.

## 3. Hallazgos técnicos

### TECH-01 — Métricas derivadas se calculan en varias capas

La proyección económica está centralizada en `proyeccionSemanal`, pero la interfaz vuelve a calcular algunos datos, por ejemplo la nómina semanal en Personal. Esto permite que una tarjeta muestre un valor distinto al balance futuro si se modifica una regla en un solo lugar.

**Acción:** crear selectores de estado compartidos para caja, nómina, capacidad, seguidores y resumen de agenda. Los componentes no deben repetir fórmulas económicas.

### TECH-02 — La presentación contiene textos de reglas

`App.tsx`, `state.tsx`, `engine.ts` y varios componentes contienen frases finales en español. Esto mezcla reglas, narración y UI, y dificulta la traducción y el mantenimiento.

**Acción:** las reglas deben emitir códigos/eventos y parámetros; la capa de presentación debe resolver el texto mediante catálogo i18n.

### TECH-03 — Los bloques redundantes fueron introducidos como una modificación localizada, no como un componente de layout

El commit `0811524` agregó resúmenes inferiores directamente en cuatro pantallas. No existe un contrato compartido que impida repetir datos globales o que garantice que el espacio se use en la grilla.

**Acción:** retirar esos bloques y crear componentes de layout con variantes semánticas: `EntityGrid`, `SectionHeader`, `Pagination`, `EmptyState` y `ContextPanel`. Los componentes no deben conocer ni copiar métricas globales salvo que su propósito lo requiera.

### TECH-04 — `overflow-hidden` se usa como regla general

El shell, el canvas, el Panel del Club, el gimnasio, la ciudad y diversas tarjetas usan `overflow-hidden`. En elementos decorativos es correcto; en contenedores de información puede ocultar contenido sin error técnico.

**Acción:** clasificar cada `overflow-hidden` como decorativo, estructural o de viewport. Todo contenedor estructural debe tener paginación, modal, truncamiento explícito o un test de geometría.

### TECH-05 — El Panel del Club tiene altura fija

El dock de escritorio usa `h-[calc(100vh-140px)]`. El contenido crece de forma independiente y el contenedor lo oculta. En móvil, la apertura se limita a 220px.

**Acción:** definir un presupuesto de contenido y una salida completa: paginación, detalle modal o bandeja expandida. Nunca eliminar silenciosamente una tarjeta visible.

### TECH-06 — Hay rutas y assets que necesitan prueba de producción

`index.html` referencia `%BASE_URL%favicon.svg` y la aplicación depende de rutas de assets. La verificación local no asegura que el subpath de GitHub Pages no produzca 404.

**Acción:** fijar `base`, comprobar el favicon real y añadir un smoke test de producción que falle ante cualquier recurso 404.

### TECH-07 — Los contratos de UI no están suficientemente tipados

Las pestañas, etiquetas, textos de botones y categorías se definen parcialmente como strings libres. Eso permite que aparezcan variaciones semánticas o que un componente reciba nombres largos sin una estrategia de compactación.

**Acción:** centralizar catálogos de etiquetas, acciones, estados y categorías con tipos y claves de traducción.

### TECH-08 — El modelo permite crecimiento, pero falta una política de migración para cada nueva colección

La migración existente agrega valores por defecto, pero cada futura colección —eventos, seguidores, deuda, salón de la fama, locales— necesita una estrategia explícita de compatibilidad.

**Acción:** versionar cambios de esquema, probar partidas antiguas y documentar el comportamiento de campos nuevos, eliminados y renombrados.

## 4. Matriz de fuentes únicas

| Dato | Fuente canónica actual | Riesgo |
|---|---|---|
| Caja | `EstadoJuego.dinero` | Bajo, pero se repite visualmente |
| Seguidores | `EstadoJuego.seguidores` | Medio: recalculo dominical y eventos pueden sobrescribirse |
| Nómina | `EstadoJuego.personal` + `PERSONAL_INFO` | Medio: UI calcula por separado |
| Capacidad | `capacidadAlumnos`, `capacidadAmateurs`, `capacidadProfesionales` | Bajo |
| Proyección | `proyeccionSemanal` | Medio: debe permanecer igual al balance |
| Balance real | `domingoBalance` | Medio: reemplaza libros visibles de operaciones anteriores |
| Calendario | `dia`, `semana`, `pendientes`, `comunitarios`, `eventos` | Medio: debe evitar modelos paralelos |
| Textos | Componentes, engine, state y i18n | Alto: catálogo incompleto |
| Layout | Clases locales por pantalla | Alto: no hay contrato de densidad común |

## 5. Tests técnicos necesarios antes de corregir

- [ ] Selector de nómina coincide con la línea de gastos del balance.
- [ ] Proyección y balance producen las mismas líneas para el mismo estado.
- [ ] Una entrevista no se pierde al cerrar la semana.
- [ ] Un préstamo no puede duplicarse ni quedar con saldo negativo.
- [ ] Una migración de cada versión histórica conserva identidad y progreso.
- [ ] Todas las pantallas respetan `scrollHeight === clientHeight` del canvas principal.
- [ ] Todo contenido variable tiene paginación, modal o estado vacío explícito.
- [ ] El smoke test de producción no encuentra 404.
- [ ] Los catálogos i18n cubren todos los textos visibles.

## 6. Dictamen

La arquitectura técnica es suficientemente sólida para continuar, pero todavía no es modular en el punto que provocó el problema actual: layout y métricas visuales se resuelven localmente. La próxima implementación debe consolidar selectores, componentes de grilla y contratos de contenido antes de ajustar tamaños manualmente.

La Auditoría 5 queda aprobada como diagnóstico y bloquea nuevos parches visuales aislados sin componente o regla compartida.
