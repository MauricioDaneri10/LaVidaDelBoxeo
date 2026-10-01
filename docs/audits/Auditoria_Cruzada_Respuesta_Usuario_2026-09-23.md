# Auditoría cruzada de la respuesta del usuario

## Objetivo

Verificar, después de implementar la última tanda de correcciones, cada punto señalado por el usuario: lógica de entrenamiento, economía, plantel, vocabulario, eventos, calendario, capacidad visual, navegación y error de consola. Los assets artísticos 2D/3D y las animaciones finales quedan fuera de alcance por decisión explícita del usuario.

## Resultado ejecutivo

La iteración queda **apta para el playtest manual del usuario**. No se detectaron errores de TypeScript, pruebas rotas, fallos de build, advertencias estructurales ni el 404 del favicon. La simulación automatizada recorrió 120 semanas sin excepción, con el calendario avanzando y sin crecimiento ilimitado del plantel.

## Auditoría punto por punto

| Hallazgo solicitado | Solución aplicada | Verificación |
|---|---|---|
| El entrenador automático esperaba una semana | Al contratarlo asigna de inmediato el enfoque recomendado o descanso por lesión/energía | Test de contratación inmediata + playtest visual |
| Eventos de comisión iguales a finanzas sociales | Comisión ahora genera reparación, entrevista o colecta; bingo/naipes/festival quedan solo como actividades sociales | Tipos de evento separados y acciones distintas |
| Ganancia demasiado rápida | Se redujeron retornos de actividades sociales y se agregaron gastos/decisiones: mercado, reparaciones, personal y sucursales | Tests + balance de 120 semanas |
| Decidir en qué gastar | Más equipamiento, recuperación, reacción y sucursales; las inversiones compiten por la caja | Build y navegación de mercado |
| Recreativos invisibles pero rentables | Contador separado, sin nombres ni fichas; aporta cuota y evoluciona con fama/asistente; baja con derrotas | Estado, balance y panel Plantel |
| Fama sin consecuencia clara | Nuevo contador de seguidores visible en la barra; fama, victorias y derrotas lo actualizan | AX/UI: “SEGUIDORES 480” |
| Faltaban compras en mercado | Se añadieron Cuerda de Velocidad y Plataforma de Reacción | Catálogo y sanitización de partidas |
| Botones de ranking/talentos descentrados y ranking con “·20” | Botones centrados, ancho ajustado al texto y etiqueta “Ranking mundial” | Inspección visual de Ciudad |
| “Ver cursos” demasiado ancho/desordenado | Ramas y botones usan ancho del contenido, centrado; el detalle queda en modal | Inspección de Mi Perfil |
| Pocas opciones de personal | Se agregaron Coordinador de Sucursales y Ojeador de Talentos, con requisitos y sueldo | Typecheck, sanitización y catálogo |
| Cupos de competidores | 10 amateurs y 10 profesionales; la promoción automática al profesionalismo respeta el cupo | Test específico de diez plazas |
| Eventos de comisión acumulados | Máximo de eventos activos reducido a cuatro y cada evento vence por contador de días | Motor de expiración + calendario |
| Faltaba Calendario | Nueva pestaña con semana, fechas, preparación, guanteo, balance, peleas, velada y eventos | AX/UI: pestaña Calendario visible |
| Error 404 | Se agregó `public/favicon.svg` y referencia en `index.html` | `GET /favicon.svg` devuelve 200 |
| “Zona Élite VIP” confusa | Visible como “Zona Élite”; descripción aclara cupos y propósito | Búsqueda de texto y build |
| “Gestión profesional del pugilista” | Se simplificó a “Gestión” | Ficha técnica |
| Licencia individual + Amateur duplicadas | La etiqueta del pugil ahora es “Licencia Amateur” o “Licencia Profesional” | Ficha técnica y flujo de licencia |
| Selección de rivales con demasiadas peleas | Cada rival generado queda a ±3 peleas del historial del pugil, limitado en el debut | Test de generación de ofertas |
| Plantel se cortaba al federar | Plantel de boxeadores y alumnos usa páginas compactas de cinco tarjetas | Captura visual y AX sin desborde |
| Mensaje de primeros pasos persistente | El progreso acepta el primer boxeador federado y el siguiente paso deja de pedir guanteos | Lógica de `siguientePaso` |
| Don Anselmo no renovaba recompensas | Al cobrar se agrega un nuevo consejo con recompensa gradual de fama y dinero | Flujo de reducer y persistencia |
| CompuBox largo/cortado | Encabezado visible simplificado a “Estadísticas” | Fuente y build |
| “Atletas” e “individual” en textos | Vocabulario visible prioriza pugil, boxeador, licencia amateur/profesional y tramitar | Revisión de textos visibles |

## Playtest y controles ejecutados

1. `npm run typecheck` — aprobado.
2. `npm test -- --run` — **23/23 pruebas aprobadas**.
3. `npm run build` — build de producción aprobada.
4. `node audit_engine.js` — 0 errores y 0 advertencias.
5. Simulación de 120 semanas dentro de la suite — sin excepciones, calendario consistente y plantel acotado.
6. Navegador local — se verificaron barra superior, navegación, Plantel, Ciudad y Calendario.
7. Consola del navegador — sin errores capturados tras recargar.
8. Recurso faltante — `/favicon.svg` respondió 200.

## Puntos ciegos que quedan controlados

- Las partidas anteriores que no tenían seguidores o recreativos se normalizan automáticamente al cargarse.
- Las partidas anteriores que conservan el contador de mes inconsistente usan una fecha canónica basada en semana/día para que el calendario no se desincronice.
- La promoción amateur → profesional no puede superar diez profesionales.
- Las actividades sociales no crean perfiles infinitos: el bingo puede atraer un alumno solo si hay cupo y el plantel sigue normalizado.
- Los eventos no son permanentes: expiran y el teléfono limita su acumulación.
- La caja negativa sigue siendo posible, pero queda visible y aplica costo financiero; no se corrige silenciosamente.
- Los assets finales no se mezclaron con la lógica: todavía no hay una dependencia de arte que pueda romper el loop.

## Criterio de entrega

La versión está lista para que el usuario haga el playtest end-to-end. Si aparece un error durante ese recorrido, debe registrarse con semana, día, pestaña, acción exacta y estado de caja/plantel; ese dato abrirá una auditoría focalizada, no una reescritura indiscriminada del juego.

## Archivos principales modificados

- `src/game/engine.ts` — reglas, eventos, cupos, sanitización y rivales.
- `src/game/state.tsx` — flujos económicos, personal, licencias, consejos y progresión.
- `src/game/types.ts` y `src/game/data.ts` — vocabulario, eventos, mercado y personal.
- `src/components/CalendarView.tsx` — calendario del club.
- `src/components/panels.tsx` — plantel paginado y perfil.
- `src/components/CityMap.tsx`, `BoxerSheet.tsx`, `FightScreen.tsx`, `Phone.tsx`, `TopBar.tsx` — textos y layout.
- `public/favicon.svg`, `index.html` — resolución del 404.
