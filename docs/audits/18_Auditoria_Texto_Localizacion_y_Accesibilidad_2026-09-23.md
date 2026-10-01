# Auditoría 6 — Texto, localización, accesibilidad y consistencia semántica

Fecha: 2026-09-23\
Estado: diagnóstico completado; implementación pendiente

## 1. Objetivo

Verificar que el juego sea comprensible, traducible y usable sin depender de textos largos dentro de tarjetas pequeñas.

## 2. Hallazgos de texto

### TXT-01 — El catálogo i18n existe, pero la interfaz todavía está mayormente hardcodeada

`src/i18n/index.ts` prepara Español, English y Português (Brasil), pero la mayoría de los textos visibles siguen escritos directamente en componentes, reducer, motor, datos y pantallas de combate.

Esto afecta:

- navegación;
- encabezado;
- mensajes y toasts;
- nombres de botones;
- eventos;
- licencias;
- calendario;
- economía;
- estadísticas;
- combate;
- fichas técnicas;
- cursos y personal.

**Criterio:** ningún texto visible nuevo se agrega sin una clave de traducción.

### TXT-02 — Los botones deben expresar acción, no explicación completa

Se detectan labels con precio o frases extensas, por ejemplo acciones de compra, préstamo y actividades. El detalle debe permanecer en la tarjeta o tooltip; el botón debe ser breve:

- Comprar
- Contratar
- Aceptar
- Rechazar
- Agendar
- Tramitar licencia
- Continuar
- Avanzar día

### TXT-03 — Hay vocabulario que debe mantenerse canónico

| Concepto | Forma canónica |
|---|---|
| Persona que entrena boxeo | Boxeador / pugilista según contexto definido |
| Licencia de competencia amateur | Licencia Amateur |
| Licencia de competencia profesional | Licencia Profesional |
| Entrenamiento contra compañero | Guanteo / sparring |
| Acción diaria | Avanzar día |
| Bandeja lateral | Panel del Club |
| Actividad económica planificada | Actividad del Club |
| Evento externo | Propuesta del Barrio |

No se deben alternar “atleta”, “pugilista”, “boxeador”, “licencia individual” y “gestión profesional” sin una razón contextual.

### TXT-04 — La información secundaria debe salir de la tarjeta

Descripciones largas de equipamiento, enfoques, personal y eventos deben usar tooltip accesible, modal o detalle expandible. La tarjeta debe contener sólo lo necesario para decidir.

## 3. Hallazgos de accesibilidad

### A11Y-01 — Foco y navegación por teclado

Hay controles con `role="button"` y `tabIndex`, pero el foco visual, el orden de tabulación y el retorno de foco desde modales deben validarse de forma sistemática.

### A11Y-02 — Estados comunicados sólo por color

Estados como pendiente, cobrado, recomendado, bloqueado y en cartelera usan color con frecuencia. Cada estado debe tener texto o icono equivalente.

### A11Y-03 — Texto truncado y tooltips

El truncamiento es válido para nombres secundarios si existe ficha completa. No es válido para requisitos, coste, estado, licencia o acción principal. Todo tooltip debe ser accesible con hover, foco y alternativa táctil.

### A11Y-04 — Movimiento

La transición de día, el Panel del Club, combate y animaciones decorativas deben respetar `prefers-reduced-motion`. La aplicación ya contiene una base, pero debe comprobarse en cada modal y vista.

### A11Y-05 — Targets táctiles

La versión para tablet y móvil debe mantener targets de al menos 44px cuando sea posible. Los botones de paginación y las pestañas pequeñas requieren una pasada específica.

## 4. Casos de texto largo

Antes de aprobar una pantalla se deben probar:

- idioma inglés;
- portugués brasileño;
- nombres de boxeadores extensos;
- nombres de gimnasios extensos;
- monedas con separadores y valores grandes;
- eventos con títulos largos;
- descripciones 50% más largas que el original;
- tamaño de texto aumentado.

## 5. Checklist de aprobación

- [ ] Todo texto visible tiene clave de traducción.
- [ ] Los botones no incluyen explicaciones ni precios innecesarios.
- [ ] Las licencias usan nombres canónicos.
- [ ] Los enfoques y el consejo de esquina comparten el mismo catálogo.
- [ ] Los eventos comunitarios y propuestas del barrio tienen vocabulario distinto.
- [ ] No hay requisitos o costos truncados.
- [ ] El foco se ve en todos los controles.
- [ ] Los modales atrapan y devuelven el foco correctamente.
- [ ] Los estados no dependen sólo del color.
- [ ] La interfaz respeta movimiento reducido y texto grande.

## 6. Dictamen

El juego tiene una base visual consistente, pero la preparación para traducción aún es parcial y la longitud de texto sigue siendo un riesgo directo para las grillas. Esta auditoría bloquea la aprobación de nuevas tarjetas hasta que exista un presupuesto de texto y una clave i18n para cada cadena visible.
