# Revisión 2 — diez fases de playtest, auditoría y solución

Fecha: 23 de septiembre de 2026  
Motivo: corregir los nuevos problemas lógicos y visuales detectados en ficha, cursos, panel lateral, finanzas sociales y avance diario.

## Resultado

La segunda ronda quedó implementada y validada. El juego conserva la regla de no usar scroll global y ahora resume el avance diario con una transición breve. Los assets 2D/3D siguen fuera del alcance.

## Fase 1 — Auditoría de vocabulario

Se revisaron los textos visibles de la ficha y se confirmó que “presión” como texto suelto era ambiguo. Se reemplazó por `Enfoque recomendado: Enfoque Asfixiante` —o el enfoque exacto que corresponda— usando el nombre oficial de `COMBOS`.

## Fase 2 — Auditoría de reglas del consejo

Se siguió el origen de `consejoEsquina`: energía baja produce Descanso; contra un rival se elige Noqueador, Táctico, Asfixiante o Estilista según la situación; sin rival se analiza el atributo más débil. La ficha ya no imprime el identificador interno (`presion`), sino el nombre amigable y exacto.

## Fase 3 — Auditoría de descripciones de enfoque

Se unificaron los seis enfoques. Todas las capacidades usan el mismo formato, con `+` delante de cada mejora: `+ Potencia · + Eficacia · + Fuerza · + Ataque`. Descanso quedó resumido como `+ Energía · + Recuperación`.

## Fase 4 — Auditoría de cursos

Se quitó el botón duplicado `Ver cursos` de la fila de ramas. Quedaron únicamente Deportiva, Promotora y Empresarial en esa fila; el detalle se abre desde el botón inferior correspondiente a la rama. El título `Cursos del Coach · elegí una rama` quedó centrado.

## Fase 5 — Auditoría del panel lateral

`Teléfono del Club` se renombró a `Panel del Club`, que describe mejor su función de mensajes, patrocinios, prensa y Don Anselmo. Los hitos de Don Anselmo se paginaron de a dos tarjetas, con `Anterior`, indicador de página y `Más consejos`. El panel ya no corta la lista inferior ni necesita scroll.

## Fase 6 — Auditoría de finanzas sociales

Finanzas Sociales se retiró de Ciudad y se agregó a Mi Perfil. Se validó su modal con Bingo, Torneo de Juegos de Mesa y Festival, cada uno con inversión, retorno y acción `Agendar`.

## Fase 7 — Auditoría de avance diario

Al cambiar el día se muestra una transición animada y un resumen contextual: preparación, sábado de guanteos/peleas o domingo de balance. La notificación desaparece sola y no bloquea la interacción. También se conserva el toast de la semana de entrenamiento.

## Fase 8 — Auditoría de ficha y viewport

Se agregó un modo compacto específico para la ficha técnica en ventanas de poca altura. Se redujeron espacios y alturas sin eliminar información. En el navegador a 1280×720 se verificó que pilares, enfoques, consejo, progreso y historial entren completos.

## Fase 9 — Playtest funcional extendido

Se recargó la partida, se avanzó un día, se abrió Mi Perfil, se abrió Finanzas Sociales, se volvió al Plantel y se abrió una ficha. Se verificaron el nombre del panel, los textos de enfoque, la recomendación exacta, la paginación de Don Anselmo y la transición de día.

## Fase 10 — Regresión y cierre

- `npm run typecheck`: OK.
- `npm test -- --run`: 16/16 OK.
- `npm run build`: OK.
- `node audit_engine.js`: 0 errores, 0 advertencias.
- Simulación de 120 semanas: OK; semana 121, plantel 10, sin excepciones ni crecimiento infinito.

## Estado posterior

Esta revisión está lista para que el usuario juegue y valide el flujo. Si aparece otro error, debe abrirse una nueva ronda con el mismo esquema. Los siguientes temas siguen siendo decisiones de producto: economía final, lesiones avanzadas, retiros, generaciones, negociación de bolsas y cuenta online.
