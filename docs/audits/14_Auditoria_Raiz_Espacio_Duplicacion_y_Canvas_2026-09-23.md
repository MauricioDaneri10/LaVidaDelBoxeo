# Auditoría raíz — espacio vacío, duplicación y canvas

Fecha: 2026-09-23\
Estado: hallazgos confirmados; corrección pendiente\
Build auditada: commit `0811524` en `http://localhost:3000/`

## Dictamen ejecutivo

La aplicación compila y la verificación técnica base está en verde, pero la solución visual aplicada recientemente no cumple la intención del pedido.

El espacio vacío se resolvió agregando información redundante en lugar de expandir y redistribuir las grillas existentes. Esto ocurre en:

- Mercado: “Caja disponible”, “Mejoras instaladas” y “Consejo”.
- Mi Perfil: “Seguidores”, “Resultado histórico” y “Caja de emergencia”.
- Personal: “Nómina actual”, “Gestión automática” y “Próximo criterio”.
- Calendario: “Caja prevista”, “Seguidores actuales” y “Recordatorio”.

La caja y los seguidores ya están visibles en el encabezado global. La nómina, el resultado histórico y la deuda deben aparecer únicamente en una pantalla donde tengan contexto financiero o histórico, no como relleno de todas las vistas.

## Evidencia de código

El commit `0811524` agregó los bloques redundantes en:

- `src/components/panels.tsx`, líneas de Mercado, Perfil y Personal.
- `src/components/CalendarView.tsx`, bloque final de resumen.

La implementación usa `mt-auto`, que empuja esos bloques al fondo del canvas y produce exactamente el efecto observado: un espacio grande que se “rellena” con métricas repetidas, sin aumentar la grilla principal.

## Evidencia visual en navegador

Resolución observada: 1280×720.

### Gimnasio

- El canvas entra en pantalla.
- No se observan duplicados en la vista principal.
- El Panel del Club queda con mucho espacio libre cuando no hay mensajes, aunque su contenido vacío es comprensible.

### Plantel

- La grilla muestra cuatro tarjetas en el caso auditado.
- Las tarjetas son pequeñas y terminan aproximadamente a mitad del área disponible.
- No se aprovecha el espacio inferior para hacer tarjetas más legibles o aumentar la cantidad visible.
- La paginación existe para listas mayores, pero no se beneficia del espacio disponible.

### Ciudad

- El contenido principal llega cerca del fondo.
- Las acciones “Ranking Mundial”, “Salón de la Fama” y “Buscar Talentos” están separadas correctamente, pero requieren validación de modal y contenido completo.

### Mercado

- La grilla de cuatro tarjetas termina antes del fondo.
- Los bloques inferiores repiten caja e inventario ya presentes en la cabecera de la sección o en el encabezado global.
- La solución correcta es aumentar el área útil de las tarjetas, normalizar su altura y mantener la paginación, no agregar un resumen inferior.

### Mi Perfil

- Cursos, ramas y actividades no ocupan proporcionalmente el ancho disponible.
- El botón de actividades tiene contenido propio, pero el layout de ramas debe ser más uniforme.
- Los resúmenes inferiores agregados son redundantes y no solucionan la composición.

### Personal

- Las tarjetas aparecen agrupadas de a dos y queda un área inferior amplia.
- El resumen de nómina y automatización no debe usarse como relleno.
- La solución debe ser una grilla más amplia o una paginación con tarjetas de altura consistente.

### Calendario

- La semana de siete días es visible.
- El panel de cuatro indicadores ya contiene información contextual suficiente.
- El bloque inferior de caja, seguidores y recordatorio duplica información y debe retirarse o reemplazarse por contenido de agenda realmente único.

### Panel del Club

- El nombre “Panel del Club” es correcto.
- Con estado vacío queda una zona grande sin contenido, pero no debe llenarse con dinero o seguidores.
- Debe mostrar mensajes, eventos, consejos, recompensas y tareas propias; cuando no existan, debe tener un estado vacío compacto y útil.
- En `Phone.tsx` el dock de escritorio usa una altura fija `calc(100vh - 140px)` y `overflow-hidden`; esto requiere una auditoría específica para no ocultar mensajes largos.

## Verificación técnica base

`npm run verify` pasó completamente:

- TypeScript: correcto.
- Tests: 34 correctos.
- Build: correcto.
- Bundle JS: 481.9 KiB / 560 KiB.
- Bundle CSS: 68.8 KiB / 90 KiB.
- Auditoría estructural: 0 errores, 0 advertencias.

Esto confirma que el problema actual no es un fallo de compilación. Es un fallo de interpretación de diseño, jerarquía de información y estrategia de layout.

## Hallazgos prioritarios

| ID | Hallazgo | Prioridad | Estado |
|---|---|---:|---|
| ROOT-01 | Se agregaron métricas globales duplicadas para ocupar espacio | P0 | Confirmado |
| ROOT-02 | Plantel no usa el espacio libre para una grilla más legible | P0 | Confirmado |
| ROOT-03 | Mercado no usa el espacio libre para tarjetas más consistentes | P0 | Confirmado |
| ROOT-04 | Mi Perfil tiene acciones y ramas con composición desigual | P1 | Confirmado |
| ROOT-05 | Personal depende de pocas tarjetas y deja área vacía | P1 | Confirmado |
| ROOT-06 | Calendario tiene un resumen inferior redundante | P0 | Confirmado |
| ROOT-07 | Panel del Club no tiene una estrategia suficiente para estado vacío y crecimiento | P1 | Confirmado |
| ROOT-08 | `overflow-hidden` puede ocultar información variable | P0 | Riesgo confirmado por código |
| ROOT-09 | Seguidores, préstamos y actividades requieren auditoría económica integrada | P1 | Pendiente de validación prolongada |
| ROOT-10 | La auditoría visual P4 anterior quedó obsoleta en los puntos modificados por `0811524` | P0 | Confirmado |

## Criterio de solución

Antes de escribir código se debe aprobar esta jerarquía:

1. Encabezado global: día, caja, fama y seguidores.
2. Pestaña: datos propios de la función actual.
3. Tarjeta: estado, nombre, descripción corta y acción.
4. Panel del Club: novedades y decisiones accionables.
5. Modal: detalle largo, histórico o gestión avanzada.

Ninguna pantalla puede repetir la capa superior sólo para llenar espacio.

## Próximo orden de trabajo

1. Cerrar la matriz de intención y datos únicos.
2. Retirar los cuatro bloques redundantes.
3. Recalcular grillas y tamaños con el espacio liberado.
4. Validar Plantel, Mercado, Mi Perfil, Personal y Calendario en la matriz de resoluciones.
5. Auditar Panel del Club y estados vacíos.
6. Recién después revisar economía, traducción y regresión.

No se considera aprobada la solución visual mientras una pestaña necesite información repetida para aparentar densidad.
