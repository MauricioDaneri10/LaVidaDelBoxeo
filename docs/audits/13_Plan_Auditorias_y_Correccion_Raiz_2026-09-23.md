# Plan canónico de auditorías y corrección raíz

Fecha: 2026-09-23\
Estado: propuesta previa a implementación\
Alcance: Plantel, Mercado, Mi Perfil, Personal, Calendario, Gimnasio, Ciudad, Panel del Club, economía, persistencia y escalabilidad.

## 1. Hallazgo raíz actual

El espacio libre de algunas pestañas se intentó resolver agregando bloques con información repetida del encabezado global: dinero, seguidores, nómina, resultado histórico y otros resúmenes.

Eso no cumple el objetivo original. El objetivo era aprovechar el canvas ampliando y redistribuyendo la grilla de tarjetas que ya existe, manteniendo una jerarquía clara y evitando que el jugador vea el mismo dato dos veces.

La corrección debe partir de esta regla:

> Cada dato tiene un único lugar principal. El espacio libre se resuelve con layout, densidad útil, tarjetas propias de la pestaña y estados contextuales; nunca copiando indicadores globales sin una función nueva.

## 2. Cantidad de auditorías necesarias

Se necesitan **8 auditorías**, ejecutadas en orden. No son ocho revisiones cosméticas: cada una cierra una clase distinta de riesgo y tiene una condición de aprobación.

### Auditoría 1 — Intención, alcance y criterios de aceptación

Objetivo: traducir cada pedido del juego a reglas comprobables antes de tocar código.

Debe definir:

- qué información pertenece al encabezado global, a una pestaña, a una tarjeta o al Panel del Club;
- qué contenido está prohibido duplicar;
- qué significa “ocupar el espacio” sin agregar ruido;
- qué páginas deben mostrar grillas, paginación, estados vacíos o paneles contextuales;
- qué significa “sin scroll” para el canvas principal, permitiendo scroll únicamente dentro de modales o listas explícitamente diseñadas para ello.

Salida: matriz de intención, fuente única de cada dato y criterios de aceptación por pantalla.

Gate: no puede existir ningún cambio propuesto que no tenga una intención y un criterio visual o funcional asociado.

### Auditoría 2 — Canvas, densidad y composición visual

Objetivo: medir el espacio real disponible y corregir la causa de los huecos, cortes y desbalances.

Se revisarán Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil, Personal, Calendario y Panel del Club en resoluciones representativas:

- 1016×910;
- 1280×720;
- 1366×768;
- 1920×1080;
- una vista horizontal pequeña para detectar quiebres de grilla.

Se comprobará:

- altura útil después del encabezado, agenda, navegación y panel lateral;
- cantidad de columnas y filas por página;
- altura mínima y máxima de cada tarjeta;
- alineación de botones, títulos, precios y estados;
- que la grilla use el espacio disponible sin estirar textos ni inventar indicadores;
- que no haya overlays, clipping, elementos fuera del viewport ni paneles que oculten información;
- que la paginación siga funcionando cuando el contenido supera la capacidad visible.

Regla específica para Plantel: ampliar la grilla de pugilistas y mantener “Anterior / Más alumnos”; no agregar un resumen de dinero o seguidores debajo.

Gate: cada pantalla debe quedar completa, legible y sin scroll del canvas en todas las resoluciones objetivo.

### Auditoría 3 — Arquitectura de información y UX

Objetivo: asegurar que cada pantalla tenga una función única y que el jugador entienda qué hacer sin leer dos veces lo mismo.

Se revisará:

- jerarquía del encabezado global;
- navegación entre pestañas;
- propósito de Mi Perfil frente a Ciudad;
- propósito del Panel del Club frente al contenido principal;
- ubicación de finanzas sociales, préstamos, eventos y calendario;
- consistencia de botones y llamadas a la acción;
- estados vacíos, bloqueados, pendientes, vencidos y completados;
- mensajes de primeros pasos y su desaparición al cumplir el objetivo;
- ficha técnica, licencia, enfoque recomendado y vocabulario de pugilistas.

El Panel del Club podrá ocupar mejor su altura con contenido propio: mensajes, consejos, eventos activos, tareas pendientes y recompensas. No debe repetir la caja global ni los seguidores salvo que muestre una operación contextual distinta, por ejemplo el detalle de una deuda activa.

Gate: un jugador nuevo debe poder identificar la próxima acción y el motivo de cada botón sin depender de un dato duplicado.

### Auditoría 4 — Economía, progresión y simulación

Objetivo: encontrar desequilibrios y cabos sueltos que no se resuelven con CSS.

Se validará de extremo a extremo:

- caja inicial, cuotas, alumnos recreativos y pugilistas;
- gastos fijos, personal, alquiler y equipamiento;
- eventos de recaudación y propuestas del barrio como sistemas distintos;
- préstamos, interés, cuotas y consecuencias del saldo negativo;
- seguidores derivados de fama, resultados y actividad, con crecimiento gradual;
- límites de amateurs y profesionales;
- recompensas de Don Anselmo, reemplazo de objetivos cobrados y escalado por etapas;
- calendario, eventos con duración, expiración y conflictos;
- proyección del domingo contra balance real;
- ausencia de exploits por repetir clics o cobrar dos veces.

El caso obligatorio es la partida con saldo negativo: el jugador debe tener una salida entendible, con riesgo y coste, sin crear dinero infinito.

Gate: una simulación prolongada debe permanecer estable y la economía debe ser explicable línea por línea.

### Auditoría 5 — Código, estado, persistencia y modularidad

Objetivo: corregir la raíz técnica y evitar que futuras mejoras vuelvan a mezclar presentación, estado y reglas.

Se revisará:

- reducer y acciones de estado;
- modelos de datos y nombres canónicos;
- adaptador de persistencia y migraciones;
- compatibilidad con partidas existentes;
- separación entre componentes de layout, tarjetas, paneles y reglas de juego;
- fuente única de verdad para caja, seguidores, capacidad y calendario;
- componentes reutilizables para grids, botones, tabs y estados;
- ausencia de datos derivados duplicados almacenados como si fueran datos primarios;
- errores 404, assets faltantes y rutas de producción;
- cobertura de tests y diagnósticos.

Gate: typecheck, tests, build, presupuesto de bundle, auditoría del motor y migración de una partida existente deben pasar sin warnings nuevos.

### Auditoría 6 — Texto, localización, accesibilidad y consistencia semántica

Objetivo: que el juego sea claro, traducible y entendible para distintos públicos.

Se comprobará:

- vocabulario único: “pugilista/boxeador” según el contexto definido;
- “Licencia Amateur” y “Licencia Profesional” como etiquetas completas;
- nombres cortos de enfoques y descripciones compactas;
- tooltips para información secundaria, sin cortar tarjetas;
- textos de botones breves y consistentes;
- traducción completa de todo texto visible mediante claves, no strings dispersos;
- contraste, foco de teclado, tamaños táctiles y lectura a distancia;
- pluralización, fechas, monedas y formatos por idioma.

Gate: ningún texto visible debe quedar truncado, mezclado, sin clave de traducción o con terminología contradictoria.

### Auditoría 7 — Validación integrada y cierre

Objetivo: probar que las soluciones funcionan juntas y no solo de manera aislada.

Se ejecutarán dos recorridos:

1. Partida nueva: tutorial, primer pugilista, enfoque, equipamiento, diez guanteos, licencia, pelea, balance, economía negativa y recuperación.
2. Partida existente: cargar un save anterior, avanzar varias semanas, abrir todas las pestañas, verificar migración, eventos, paginación y persistencia.

La simulación automatizada cubrirá como mínimo 12, 52 y 120 semanas, además de cambios de resolución y recarga del navegador.

Gate: solo se considera cerrado cuando no hay regresiones funcionales, visuales, de texto ni de persistencia.

### Auditoría 8 — Geometría, simetría, Panel del Club y footer

Objetivo: convertir la calidad visual profesional en condiciones medibles.

Se validará:

- normalización de alturas, radios, bordes, sombras y padding de botones;
- simetría de tarjetas, líneas base, precios, estados y CTA;
- ausencia de textos cortados o elementos desalineados;
- Panel del Club como unidad holográfica estilizada, cerrada y sin contenido redundante;
- footer visible con la marca `MadArt Studios`;
- que el footer cierre el canvas sin provocar scroll;
- que todos los elementos relevantes terminen antes del footer.

Gate: cada resolución objetivo debe mostrar footer, canvas completo y controles equivalentes con geometría equivalente.

## 3. Plan de implementación posterior a las auditorías

### Fase A — Congelamiento del contrato de diseño

Crear la matriz de intención y el inventario de datos. Clasificar cada indicador como global, local, contextual o histórico. Eliminar del diseño cualquier resumen que solo repita el encabezado.

### Fase B — Retiro controlado de redundancias

Retirar los bloques redundantes introducidos para llenar espacio, sin modificar economía ni progresión. Esta fase debe dejar cada pestaña limpia y servir como línea base visual.

### Fase C — Reflujo de grillas

Reorganizar las grillas existentes con tokens compartidos de columnas, gaps, alturas y paginación. Plantel, Mercado y Personal deben mostrar más tarjetas o tarjetas más legibles; Mi Perfil debe usar un layout unificado; Calendario debe aprovechar la semana visible sin duplicar métricas.

### Fase D — Panel del Club con contenido propio

Reordenar el panel lateral para que muestre información accionable y única: mensajes, eventos activos, consejos, tareas y recompensas. Si no hay contenido, debe mostrar un estado vacío útil, no un hueco artificial ni un duplicado financiero.

### Fase E — Economía y progresión

Revisar seguidores, préstamos, recaudación, cuotas, gastos y recompensas con una simulación controlada. Ajustar curvas graduales y explicar siempre el motivo del saldo.

### Fase F — Código modular y traducción

Extraer componentes comunes, centralizar reglas y migrar textos visibles a claves de localización. Resolver rutas 404 y validar producción.

### Fase G — Verificación y entrega

Ejecutar los tests estáticos, visuales, funcionales y de larga duración. Generar un informe de cierre con evidencias y dejar el servidor listo solo después de la aprobación técnica.

## 4. Checklist de no regresión

- [ ] Ninguna pestaña repite dinero, seguidores o nómina ya visibles en el encabezado.
- [ ] El espacio libre se ocupa con grilla, tarjetas y contenido propio de la pantalla.
- [ ] Plantel conserva paginación y muestra más pugilistas sin cortar el canvas.
- [ ] Panel del Club tiene contenido único o un estado vacío útil.
- [ ] Mi Perfil mantiene una sola acción “Ver cursos” por contexto.
- [ ] Los botones quedan normalizados y alineados.
- [ ] No hay scroll del canvas principal ni clipping en las resoluciones objetivo.
- [ ] El saldo negativo tiene una salida explicada y limitada.
- [ ] Los seguidores crecen de forma gradual y trazable.
- [ ] Las finanzas sociales no son el mismo sistema que las propuestas del barrio.
- [ ] Las partidas existentes migran sin perder progreso.
- [ ] No quedan errores 404 ni strings sin traducir.
- [ ] Pasan typecheck, tests, build, bundle budget, audit engine y playtest prolongado.

## 5. Regla de aprobación

No se implementa una corrección visual o económica por intuición aislada. Cada cambio debe indicar:

1. qué hallazgo resuelve;
2. qué dato o componente es su fuente única;
3. qué pantalla y resolución afecta;
4. qué test lo verifica;
5. qué regresión podría provocar.

La aprobación del usuario se solicita después de entregar la auditoría y antes de ejecutar las fases de corrección. Este documento no autoriza todavía cambios de código.
