# Auditoría 1 — Arquitectura, dependencias y preparación para GitHub Pages

**Proyecto:** La Vida del Boxeo  
**Fecha:** 23 de septiembre de 2026  
**Alcance:** estructura del código, límites entre módulos, dependencias, build web, persistencia local y preparación para publicación pública en GitHub.  
**Estado:** auditoría realizada; implementación de correcciones pendiente de la fase de solución.

## 1. Criterio de esta auditoría

Esta auditoría no rediseña el juego ni agrega assets. Verifica si la arquitectura actual puede sostener:

- una versión jugable pública mediante GitHub Pages;
- ejecución en computadora, celular y tablet;
- evolución del juego sin romper partidas guardadas;
- incorporación futura de cuenta, sincronización y backend;
- separación clara entre reglas, contenido, persistencia y presentación;
- pruebas reproducibles y mantenimiento por varias personas.

Se revisaron \`package.json\`, \`vite.config.js\`, \`tsconfig.json\`, \`index.html\`, \`src/main.tsx\`, \`src/App.tsx\`, \`src/game/*\`, \`src/components/*\`, los cinco documentos canónicos, el build producido en \`dist/\` y el historial reciente del repositorio.

## 2. Veredicto ejecutivo

La base actual es funcional y publicable como prototipo web estático, pero todavía no está lista para declarar “release público en GitHub” sin una fase de endurecimiento.

### Estado por área

| Área | Estado | Severidad | Conclusión |
|---|---:|---:|---|
| Cliente React/Vite | Verde | — | El juego compila y tiene una entrada única clara. |
| Motor de reglas | Amarillo | P1 | Está probado, pero concentra demasiados dominios en \`engine.ts\`. |
| Estado y comandos | Amarillo | P1 | \`state.tsx\` mezcla reducer, persistencia, economía, eventos y flujos. |
| Contenido | Amarillo | P2 | \`data.ts\` mezcla datos de juego y textos visibles. |
| GitHub Pages | Rojo | P1 | El build actual usa rutas absolutas y no está preparado para project pages. |
| Guardado local | Amarillo | P1 | Funciona en el navegador actual, no sincroniza dispositivos y carece de migraciones formales. |
| Responsive/canvas | Amarillo | P1 | La política \`overflow-hidden\` protege el canvas, pero aumenta el riesgo de clipping cuando crece el contenido. |
| Internacionalización | Amarillo | P1 | Existe base i18n, pero todavía hay strings visibles fuera del catálogo. |
| Pruebas | Amarillo | P1 | Hay tests de dominio y simulación larga, pero falta matriz visual/E2E automatizada. |
| Seguridad/publicación | Amarillo | P2 | No hay secretos en el cliente; faltan política de contenido, licencia y límites de publicación. |

## 3. Lo que está correctamente encaminado

1. La aplicación tiene una entrada única en \`src/main.tsx\` y un \`ErrorBoundary\` visible para fallos de renderizado.
2. La lógica importante está mayormente fuera de los componentes visuales, en \`src/game/engine.ts\` y \`src/game/state.tsx\`.
3. Existen tipos explícitos para estado, pugiles, peleas, eventos y acciones.
4. Hay sanitización defensiva de partidas guardadas y respaldo del guardado anterior.
5. Los tests actuales cubren invariantes importantes, incluida una simulación de 120 semanas.
6. El proyecto ya tiene un punto de entrada claro para una futura separación entre UI, aplicación, dominio y persistencia.
7. No se detectó uso de \`fetch\`, API keys ni secretos embebidos en el cliente.
8. El archivo \`public/favicon.svg\` resolvió el 404 del favicon observado anteriormente.

## 4. Hallazgos críticos y puntos ciegos

### A1 — El build no está preparado para una URL de repositorio de GitHub Pages

**Severidad:** P1 — crítico para publicación.  
**Evidencia:** \`dist/index.html\` contiene rutas absolutas para JavaScript, CSS y favicon:

    /assets/index-....js
    /assets/index-....css
    /favicon.svg

En una project page, la URL será \`/LaVidaDelBoxeo/\`, por lo que esas rutas apuntan al dominio raíz y no necesariamente al repositorio. El juego puede mostrar HTML pero fallar al cargar JavaScript, CSS o favicon.

**Solución requerida:** configurar \`base\` en Vite para que use la ruta del repositorio en GitHub Pages y validar el build desde una URL con subruta. La solución debe conservar el funcionamiento de localhost y permitir dominio personalizado en el futuro.

**Test de cierre:** servir \`dist/\` bajo \`/LaVidaDelBoxeo/\`, abrirlo en un navegador limpio y comprobar que carga, navega, guarda, abre modales y no genera 404 de assets.

### A2 — No existe todavía un pipeline oficial de publicación

**Severidad:** P1.  
**Evidencia:** no se encontró workflow de GitHub Actions en \`.github/workflows/\`.

**Riesgo:** publicar manualmente el contenido equivocado, olvidar ejecutar tests o desplegar una compilación que no coincide con el commit revisado.

**Solución requerida:** agregar workflow que ejecute typecheck, tests, build y publique únicamente si todo pasa. El workflow debe usar permisos mínimos y dejar visible el commit desplegado.

**Test de cierre:** un commit que rompe typecheck no puede desplegar; un commit válido genera la página; la URL de Pages corresponde al artefacto del commit.

### A3 — \`state.tsx\` es simultáneamente almacenamiento, aplicación y dominio

**Severidad:** P1.  
**Evidencia:** el archivo concentra \`localStorage\`, listado de partidas, carga inicial, guardado, reducer, cambios de economía, eventos, plantel, scouting, licencias y avance de días.

**Riesgo:** una modificación de una regla puede romper guardado, UI o economía sin que el compilador lo detecte. También hace difícil incorporar sincronización remota después.

**Solución requerida:** extraer gradualmente:

- \`persistence/storage.ts\`;
- \`persistence/schema.ts\` y \`migrations.ts\`;
- \`app/commands.ts\`;
- \`app/reducer.ts\`;
- selectores puros;
- servicios de calendario, economía y eventos.

\`state.tsx\` puede permanecer temporalmente como fachada de compatibilidad.

**Test de cierre:** el reducer puede probarse sin DOM ni \`localStorage\`; la persistencia puede sustituirse por un adaptador en memoria; ningún componente importa directamente claves de almacenamiento.

### A4 — \`engine.ts\` concentra demasiadas reglas heterogéneas

**Severidad:** P1.  
**Evidencia:** el archivo contiene generación procedural, capacidades, ranking, economía, entrenamiento, matchmaking, pelea, títulos, eventos y sanitización, con aproximadamente 800 líneas.

**Riesgo:** las dependencias ocultas crecen y se vuelve difícil verificar que una regla tenga una única fuente de verdad.

**Solución requerida:** separar por dominio sin cambiar comportamiento en la primera extracción:

    src/game/domain/
      calendar/
      economy/
      events/
      progression/
      roster/
      training/
      bouts/
    src/game/content/
    src/game/persistence/

Las funciones públicas actuales deben conservarse como fachadas durante la migración.

**Test de cierre:** los tests existentes siguen pasando sin cambiar resultados; cada módulo nuevo tiene tests propios; no se introducen imports circulares.

### A5 — La persistencia local no es todavía una estrategia multiplataforma

**Severidad:** P1 para la visión futura; P2 para la demo local.  
**Evidencia:** las partidas y preferencias se guardan en \`localStorage\`.

**Comportamiento real:** una partida queda vinculada al navegador y al dispositivo. Abrir el enlace desde otro celular o computadora no recuperará esa partida.

**Solución requerida por etapas:**

1. formalizar el sobre de guardado y migraciones locales;
2. mantener exportación técnica interna solo para desarrollo, sin mostrarla como función de jugador;
3. definir un adaptador \`SaveStore\`;
4. agregar luego autenticación y almacenamiento remoto cuando exista backend.

**Test de cierre:** una partida vieja migra a la versión actual; una partida corrupta no rompe la aplicación; el futuro adaptador remoto puede reemplazar el local sin modificar reglas del juego.

### A6 — La regla \`overflow-hidden\` protege el “sin scroll”, pero puede ocultar contenido futuro

**Severidad:** P1 visual/UX.  
**Evidencia:** varias vistas usan \`h-full overflow-hidden\` y la política visual exige que todo entre en pantalla.

**Riesgo:** al sumar eventos, más personal, ranking, calendario o traducciones más largas, elementos pueden quedar fuera del canvas sin que exista una vía de acceso.

**Solución requerida:** contrato explícito de layout:

- cada vista define densidad máxima y contenido visible;
- información extensa se mueve a modal, paginador o detalle contextual;
- ningún panel puede depender de scroll accidental;
- cada viewport objetivo tiene captura de regresión;
- los textos traducidos se prueban con expansión de 30–100%.

**Test de cierre:** 1280×720, 1366×768, 1920×1080, tablet y móvil no cortan acciones principales ni títulos; las vistas extensas tienen acceso visible al detalle.

### A7 — El calendario aún contiene lógica de fecha dentro del componente

**Severidad:** P2 actualmente; P1 al crecer.  
**Evidencia:** \`CalendarView.tsx\` construye directamente \`new Date(2026, 0, ...)\` y vuelve a calcular días para las celdas.

**Riesgo:** se duplica la fuente de verdad con \`TopBar\` y futuras agendas; eventos con duración, vencimiento o zonas horarias pueden divergir.

**Solución requerida:** crear \`calendarService\` con \`dateFromGameState\`, \`weekRange\`, \`dateForDay\`, \`isExpired\` y \`advanceDay\`. Los componentes solo consumen el view-model.

**Test de cierre:** TopBar, Calendario, eventos y balance muestran exactamente la misma fecha durante 120 semanas y al cargar una partida guardada.

### A8 — La internacionalización aún no es completa ni segura para contenido procedural

**Severidad:** P1 para publicación mundial.  
**Evidencia:** existe \`src/i18n/index.ts\`, pero hay strings visibles en \`App.tsx\`, \`state.tsx\`, componentes y generación procedural. También \`data.ts\` guarda nombres y descripciones directamente como español.

**Riesgo:** una futura traducción dejará textos mezclados, gramática rota o reglas dependientes de un idioma.

**Solución requerida:** separar \`content\` de traducciones mediante claves estables y evitar concatenar frases en el reducer. Los eventos deben emitir \`labelKey\` y parámetros.

**Test de cierre:** auditoría de claves sin faltantes en español, inglés y un idioma de expansión; pseudo-localización con textos largos sin clipping; ninguna regla cambia al cambiar idioma.

### A9 — Los atajos omiten la pestaña Calendario

**Severidad:** P2.  
**Evidencia:** \`App.tsx\` define seis pantallas en el arreglo de atajos, aunque existen siete pestañas y Calendario no aparece en la navegación por teclado.

**Riesgo:** la nueva pestaña queda inconsistente con la promesa de accesibilidad y opciones configurables.

**Solución requerida:** agregar atajo de Calendario, etiqueta traducible, detección de conflicto y test de persistencia de la configuración.

**Test de cierre:** cada pestaña navegable tiene un atajo configurable, sin conflictos y sin activarse dentro de inputs.

### A10 — El contenido está acoplado a \`data.ts\`

**Severidad:** P2.  
**Evidencia:** \`data.ts\` combina nombres, rasgos, divisiones, equipamiento, cursos, personal, títulos, propiedades, eventos, sponsors, medios y vocabulario.

**Riesgo:** agregar contenido requiere tocar un archivo monolítico y aumenta la probabilidad de errores de balance o traducción.

**Solución requerida:** separar datos por dominio y usar IDs declarativos. El motor debe interpretar efectos, requisitos y categorías, no comparar nombres visibles.

**Test de cierre:** agregar un equipo, staff o evento nuevo solo requiere un registro de contenido y sus tests, sin modificar reglas generales.

## 5. Dependencias y acoplamientos observados

### Grafo actual simplificado

    main.tsx
      └─ App.tsx
          ├─ componentes visuales
          ├─ game/state.tsx
          │   ├─ game/engine.ts
          │   ├─ game/data.ts
          │   └─ game/types.ts
          ├─ game/shortcuts.ts
          └─ game/audio.ts

    componentes
      ├─ importan state directamente
      ├─ importan engine directamente
      ├─ importan data directamente
      └─ renderizan reglas y textos en algunos casos

El grafo no presenta un ciclo de imports evidente, pero sí presenta acoplamiento de conocimiento: muchos componentes conocen simultáneamente estado, motor y contenido. Esto debe transformarse gradualmente en \`selector/view-model → componente\`.

## 6. Compatibilidad con GitHub Pages

### Compatible hoy

- Aplicación cliente React/Vite.
- Sin backend requerido para la partida local.
- Sin secretos detectados.
- Build reproducible localmente.
- Assets propios servidos desde \`public\`.

### Pendiente antes de publicar

- \`base\` de Vite para project pages.
- Workflow de GitHub Actions.
- Prueba de navegación directa y recarga.
- Página 404 compatible con la SPA si se usan rutas.
- Política de licencia y README para colaboradores.
- Aviso de privacidad si se agregan métricas o cuentas.
- Separación entre versión pública jugable y herramientas internas.

## 7. Plan de solución de esta auditoría

### Fase A — Publicación segura del cliente

1. Configurar base path sin romper localhost.
2. Agregar build de producción reproducible.
3. Agregar workflow de Pages con typecheck, tests y build.
4. Probar subruta, recarga y assets.

### Fase B — Fronteras de arquitectura

1. Extraer persistencia detrás de una interfaz.
2. Extraer migraciones y sobre de guardado.
3. Extraer calendario.
4. Extraer selectores.
5. Mantener fachadas para no romper el juego.

### Fase C — Modularidad de contenido y traducción

1. Separar contenido por dominio.
2. Reemplazar textos usados como lógica por IDs.
3. Completar claves i18n.
4. Agregar auditoría de claves y pseudo-localización.

### Fase D — Contrato visual y pruebas

1. Definir viewports y densidad máxima.
2. Crear estados límite visuales.
3. Automatizar captura o inspección E2E.
4. Probar pantallas largas con traducciones expandidas.

## 8. Criterios para pasar a la Auditoría 2

La siguiente auditoría — estado, reducer y persistencia— puede comenzar cuando exista este registro y se hayan identificado los puntos de entrada concretos. No es necesario esperar la solución completa de todos los hallazgos, pero no se debe declarar la arquitectura cerrada hasta que A1, A2, A3 y A5 estén resueltos o tengan una excepción documentada.

## 9. Conclusión

El juego puede evolucionar hacia una publicación gratuita jugable desde GitHub, pero la primera publicación debe ser una aplicación estática versionada, no una promesa de cuentas sincronizadas. La base actual permite hacerlo; el principal bloqueo técnico es el path de despliegue de Vite y el principal riesgo de escalabilidad es la concentración de reglas y persistencia en \`engine.ts\` y \`state.tsx\`.

La decisión arquitectónica queda fijada así:

    GitHub público
      ├─ código y documentación
      ├─ Issues y feedback
      ├─ Releases descargables
      ├─ GitHub Pages para jugar
      └─ GitHub Sponsors para apoyar

    Futuro backend separado
      ├─ inicio de sesión
      ├─ partidas sincronizadas
      └─ servicios online

No se deben generar assets 2D/3D ni iniciar una expansión de producción hasta cerrar los bloqueos P1 de arquitectura, persistencia, publicación y pruebas.

