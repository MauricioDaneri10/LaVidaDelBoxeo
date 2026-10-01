# Auditoría 4 — Interfaz, canvas, UX, accesibilidad, responsive y traducción

**Fecha:** 23/09/2026  
**Alcance:** todas las pestañas visibles, modales, panel lateral, navegación, canvas sin scroll, controles de teclado, publicación web y preparación para traducciones.  
**Regla del producto:** el juego no debe depender del scroll de página; la información secundaria debe abrirse en modal, panel paginado o detalle bajo demanda.

## 1. Método y evidencia

Se inspeccionó el código de `src/` y se hizo una pasada real en navegador local sobre las siete pestañas: Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil, Personal y Calendario. La resolución observada fue **1016 × 910**, con `document.documentElement.scrollHeight === 910` y `overflow: hidden` en la aplicación.

La verificación se completó además con:

- `npm run typecheck` — correcto.
- `npm test -- --run` — **23/23 pruebas correctas**.
- `npm run build` — correcto; 399 módulos transformados.

Estos resultados demuestran que el estado actual compila y que las reglas cubiertas por tests pasan, pero no prueban por sí solos que toda la información sea visible ni que los flujos sean usables en otras resoluciones.

## 2. Resumen ejecutivo

| Área | Estado | Prioridad | Hallazgo principal |
|---|---:|---:|---|
| Canvas principal sin scroll | Parcial | P0 | La aplicación oculta overflow global; cuando el contenido excede el alto se pierde en vez de ofrecer una salida usable. |
| Ficha técnica | No conforme | P0 | El modal contiene más contenido que el viewport y `Modal` usa `overflow-hidden`; en la captura real quedan ocultos Pilar Mental, enfoque, consejo y licencia. |
| Personal | No conforme | P0 | En 1016×910 las tarjetas inferiores quedan cortadas sin paginación ni alternativa. |
| Ciudad/Gimnasio/Mercado/Plantel/Perfil/Calendario | Aceptable con riesgos | P1 | El contenido principal entra en la resolución auditada, pero usa mucho texto pequeño, grids rígidos y numerosos `overflow-hidden`. |
| Panel del club | Riesgoso | P1 | El dock móvil limita su contenido a 220px y conserva contenido fuera del viewport; puede cortar mensajes largos. |
| Atajos | Incompleto | P1 | Configuración permite editar atajos, pero no muestra ni administra Calendario. |
| Traducción | No conforme | P1 | El catálogo i18n existe, pero gran parte de la interfaz, engine, errores y toasts están hardcodeados en español. |
| Publicación GitHub Pages | No conforme | P0 | Continúan rutas absolutas `/assets`, `/favicon.svg` y no hay workflow de despliegue comprobado. |
| Accesibilidad | Parcial | P1 | Hay roles y nombres útiles en varios controles, pero faltan foco visible consistente, texto alternativo/estado para decorativos y estrategia para contenido oculto. |

## 3. Auditoría pestaña por pestaña

### 3.1 Gimnasio

**Verificado:** el canvas entra en 1016×910 y la composición general no se superpone.

**Riesgos:** el escenario depende de posicionamiento absoluto y de varios contenedores con `overflow-hidden`; los nombres de estaciones y boxeadores se vuelven muy pequeños. La legibilidad cae antes de que aparezca una estrategia alternativa. Las animaciones y elementos decorativos no tienen una degradación completa para `prefers-reduced-motion`.

**Acción:** definir una escala mínima de texto, usar una ficha/modal para nombres y detalles cuando el canvas no tenga espacio, y validar el gimnasio en 1280×720, 1024×768, 800×600, tablet y móvil.

### 3.2 Ciudad

**Verificado:** mapa, propiedad y botones inferiores son visibles en la resolución probada.

**Riesgos:** el mapa y el panel de propiedad usan `overflow-hidden`; el texto descriptivo puede desaparecer sin indicación. El ranking, salón de la fama, talentos y finanzas se resuelven como botones inferiores, pero la accesibilidad y el foco de esos botones deben conservar el contexto de la sección abierta. La información del panel del club queda fuera del viewport cuando el dock está cerrado.

**Acción:** separar la vista de mapa de los detalles en modales paginados; garantizar que cada botón abra un panel con título, cierre, foco y contenido completo; no dejar información relevante solamente en nodos ocultos.

### 3.3 Plantel

**Verificado:** con cuatro alumnos la cuadrícula visible entra y los contadores de alumnos/amateurs/profesionales/recreativos se leen.

**Riesgos:** al crecer el plantel la vista depende del corte del `main`; no hay un mecanismo evidente de paginación/filtro para listas grandes. Los nombres se truncan visualmente y la tarjeta contiene muchos datos con jerarquía débil. La acción “Programar velada” puede perderse al crecer la cabecera.

**Acción:** paginar o filtrar el plantel por estado/circuito, fijar la barra de acciones, mantener una tarjeta compacta y abrir la ficha completa bajo demanda. El estado de lista vacía, espera y cupo lleno debe ser explícito.

### 3.4 Mercado

**Verificado:** equipamiento, indumentaria, instalaciones y paginación entran en pantalla en la resolución probada.

**Riesgos:** las tarjetas dependen de alturas implícitas; textos de recomendación y beneficios pueden crecer por traducción y romper la simetría. Los botones de compra reciben texto variable y no tienen ancho/alto normalizado por tipo. La paginación no comunica cuántos elementos quedan en cada categoría.

**Acción:** reservar áreas fijas para título, descripción, beneficio y CTA; usar nombre corto más tooltip/detalle; mantener la misma línea base del botón de compra en todas las tarjetas; probar cadenas largas y monedas con separadores internacionales.

### 3.5 Mi Perfil

**Verificado:** el perfil, cursos, ramas, bienes raíces y acceso a Finanzas Sociales entran en pantalla en el caso probado.

**Riesgos:** hay mucho espacio vacío y el bloque de rama es pequeño respecto del ancho disponible. La información de Finanzas Sociales está correctamente dentro del Perfil, pero el modal debe conservar el mismo contrato visual que el resto. La sección de cursos depende de textos hardcodeados y puede crecer al traducirse.

**Acción:** compactar la composición sin estirar botones al ancho del contenedor; centrar ramas y CTA; usar tarjetas de curso con estado, requisito y precio en filas estables; abrir finanzas en modal con categorías paginadas.

### 3.6 Personal

**No conforme:** en la captura real a 1016×910 se ve completa la primera fila de personal, pero la segunda fila queda cortada por el dock inferior. No hay scroll, paginación ni modal de “más personal”.

**Acción P0:** convertir el catálogo en grid paginado o agrupado por categoría, con máximo de tarjetas que quepan en una pantalla; mantener una barra de resumen fija y CTA uniforme. Si se agregan sucursales, separar “personal del club” de “gestores de sucursal” y no permitir que el crecimiento futuro vuelva a cortar el canvas.

### 3.7 Calendario

**Verificado:** calendario semanal visible con siete columnas.

**Riesgos:** siete columnas estrechas reducen la legibilidad; los eventos largos pueden truncarse. La navegación de días y las fechas derivadas deben usar una única fuente temporal —hallazgo ya registrado en Auditoría 3—. La pestaña necesita filtros para peleas, eventos, vencimientos y balance cuando crezca el juego.

**Acción:** mantener la semana completa visible y abrir cada día en detalle; usar abreviaturas traducibles y tooltips; agregar indicadores de evento, conflicto y vencimiento; enlazar cada evento a su acción.

## 4. Modales y paneles

### Ficha técnica — bloqueo P0

La inspección real abrió “Ficha Técnica · Bianca Paz”. El encabezado, identidad, radar y pilares superiores son visibles; el contenido continúa debajo del viewport. La captura muestra el borde inferior del modal cortando el contenido, mientras el snapshot de accesibilidad confirma que debajo existen Pilar Mental, enfoques, Consejo de Esquina, progreso de guanteos, licencia e historial. En `src/components/ui.tsx`, el contenedor usa `max-h-[calc(100vh-1rem)] overflow-hidden` y el cuerpo usa `overflow-hidden`. Eso convierte falta de espacio en pérdida de información.

**Corrección requerida:** modalidad por capas: resumen siempre visible, secciones secundarias colapsables o paginadas y un área interna navegable sólo dentro del modal cuando sea imprescindible. El modal debe tener foco inicial, foco atrapado, cierre por Escape, título accesible y retorno de foco al boxeador.

### Configuración y partidas

El modal entra en pantalla y contiene guardado, accesibilidad, audio, reinicio y atajos. No obstante, el catálogo de atajos visible incluye Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil, Personal, Avanzar Día, Semana Rápida y Cerrar Ventanas, pero no Calendario. Debe agregarse y validarse contra conflictos.

### Panel del club

El panel está bien agrupado por Mensajes, Patrocinios, Prensa y Don Anselmo, pero “Teléfono del Club” no describe su función. El nombre canónico recomendado es **Panel del Club**. En móvil, `Phone.tsx` fija el dock abierto en 220px y lo envuelve en `overflow-hidden`; mensajes, eventos y recompensas de mayor longitud pueden quedar ocultos. Debe existir un contador de pendientes, un resumen compacto y un modal/detalle completo.

## 5. Responsive y canvas

El diseño actual toma como principio correcto que no haya scroll de página, pero lo implementa con ocultación global. Eso funciona únicamente si cada vista cumple un presupuesto estricto de alto.

### Matriz mínima de validación

| Perfil | Resoluciones a validar | Criterio de aprobación |
|---|---|---|
| Escritorio | 1440×900, 1280×720, 1024×768 | Todo texto primario y toda acción principal visible; ningún modal corta contenido. |
| Notebook | 1024×600, 960×540 | Paginación o panel secundario disponible; no desaparecer información. |
| Tablet | 1024×1366, 768×1024 | Navegación y dock no superpuestos; targets táctiles ≥44px. |
| Móvil | 390×844, 360×800 | Navegación agrupada, detalle modal, sin zoom horizontal ni botones fuera de pantalla. |

**Hallazgo estructural:** `App.tsx`, `ui.tsx`, `Phone.tsx`, `CityMap.tsx`, `GymView.tsx`, `CalendarView.tsx` y `panels.tsx` contienen varios `overflow-hidden`. Cada uno debe justificarlo como recorte decorativo, nunca como recorte de información.

## 6. UX y accesibilidad

1. Un botón debe decir una acción breve (“Comprar”, “Aceptar”, “Continuar”, “Avanzar día”); el detalle económico debe ir fuera del label.
2. Toda tarjeta que abra información debe ser un control accesible completo, no sólo un texto clickeable.
3. Se deben diferenciar estados por texto e icono, no sólo por color: pendiente, bloqueado, disponible, cobrado y vencido.
4. Las notificaciones deben desaparecer o quedar en un centro de pendientes; no deben tapar controles ni acumularse indefinidamente.
5. Agregar foco visible, orden de tabulación estable, `aria-label` para iconos y `aria-live` sólo para mensajes realmente importantes.
6. La opción “Texto grande”, contraste y menos movimiento debe afectar también modales, panel inferior, tablas, calendario y combate; no sólo el shell.
7. Añadir `prefers-reduced-motion` para transición de día, combate, dock y animaciones decorativas.
8. Los tooltips deben tener alternativa táctil y de teclado; nunca ser la única forma de acceder a información necesaria.

## 7. Traducción e internacionalización

Existe `src/i18n/index.ts` con formato de número, moneda y fecha, pero la cobertura es insuficiente. Hay textos fijos en `App.tsx`, `main.tsx`, `state.tsx`, `engine.ts`, componentes y datos. Esto afecta mensajes, errores, nombres de acciones, títulos, estadísticas, calendario, combate, eventos y textos de fallback.

**Contrato recomendado:** cada texto visible debe tener una clave estable; las reglas deben producir códigos/eventos y no frases finales; el formato de fecha, moneda, número, plural y género debe resolverse en la capa de presentación. Las claves faltantes deben mostrar un fallback diagnosticable en desarrollo y nunca una cadena vacía.

**Idiomas de preparación:** `es`, `en`, `pt-BR`; ampliar después sin tocar la lógica. Probar textos 30–60% más largos que el español para detectar desbordes.

## 8. Publicación y carga de assets

Auditoría 1 ya identificó rutas absolutas (`/assets`, `/favicon.svg`) y falta de workflow de GitHub Pages. En esta auditoría se confirma que el build local no prueba el subpath real de un repositorio. El contrato de publicación debe definir `base`, rutas de assets, fallback SPA, favicon, manifest y workflow reproducible. El 404 de consola debe clasificarse por URL y corregirse con una prueba de smoke que no acepte recursos 404.

## 9. Backlog priorizado

### P0 — antes del siguiente playtest

- Resolver overflow de ficha técnica y todos los modales con contenido variable.
- Resolver corte de Personal mediante paginación, agrupamiento o vista de detalle.
- Probar layout en alturas reducidas; ningún texto o CTA relevante puede desaparecer.
- Corregir assets/rutas y workflow de GitHub Pages.
- Inventariar recursos 404 y convertirlos en fallo del smoke test.

### P1 — antes de cierre funcional

- Añadir atajo y navegación accesible para Calendario.
- Normalizar panel del club, notificaciones y dock móvil.
- Completar catálogo i18n y extracción de textos.
- Aplicar accesibilidad y reduced-motion a todas las superficies.
- Establecer contrato de paginación/filtros para plantel, mercado, personal, ranking y eventos.

### P2 — expansión

- Validar densidad visual con datos de plantel lleno, múltiples clubes, sucursales, ranking histórico y eventos simultáneos.
- Agregar snapshots visuales automatizados por resolución.
- Añadir pruebas de teclado, lector de pantalla y traducciones largas.

## 10. Criterio de cierre de Auditoría 4

No se considera cerrada hasta que:

- cada pantalla entra sin scroll de página y ofrece detalle paginado/modal cuando no entra;
- ningún `overflow-hidden` recorta información funcional;
- la ficha técnica y Personal pasan la matriz de resoluciones;
- no hay recursos 404 en build/preview;
- Calendario aparece en navegación y atajos;
- todos los textos visibles pasan por i18n;
- smoke tests, tests de teclado y snapshots visuales pasan en las resoluciones definidas;
- la auditoría se repite después de implementar, porque el cambio de densidad puede crear nuevos recortes.

**Conclusión:** la base visual es coherente y las siete pestañas principales funcionan en la resolución de prueba, pero el producto todavía no está listo para un playtest final. Los dos bloqueos más concretos son el recorte real de la ficha técnica y el recorte de Personal; el riesgo sistémico es usar `overflow-hidden` como sustituto de una estrategia de densidad. La siguiente fase debe implementar los P0 y repetir esta auditoría con una matriz de resoluciones y contenido máximo.
