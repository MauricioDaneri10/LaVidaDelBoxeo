# Auditoría integral end-to-end sin assets

Fecha: 23/09/2026  
Alcance: código, reglas, economía, persistencia, navegación, texto, canvas, layout y recorrido completo del jugador.  
Fuera de alcance: generación o selección de assets 2D, modelos 3D, ilustraciones y animaciones finales. Esa etapa queda bloqueada hasta autorización expresa del responsable del juego.

## Objetivo

Determinar si el juego puede jugarse de principio a fin sin cabos sueltos: crear una carrera, gestionar el gimnasio, formar alumnos, emitir licencias, organizar combates, cobrar bolsas, cerrar semanas, invertir, competir en ranking, guardar/cargar y recuperar la partida sin contradicciones.

Esta auditoría no declara que el sistema esté terminado. Define qué debe verificarse y separa los problemas ya observados de los controles todavía pendientes.

## Mapa de arquitectura revisado

| Capa | Archivos principales | Responsabilidad | Control requerido |
|---|---|---|---|
| Entrada y ciclo de React | `src/main.tsx`, `src/App.tsx` | Montaje, estado raíz, navegación y overlays | No duplicar reglas ni bloquear rutas de salida. |
| Estado y acciones | `src/game/state.tsx` | Reducer, semanas, compras, peleas, guardado lógico | Cada acción debe actualizar dinero, historial, toasts y capacidad correspondiente. |
| Motor | `src/game/engine.ts` | Cálculos, progresión, ranking, capacidad y simulaciones | Las fórmulas deben ser únicas y reutilizadas por UI y cierre semanal. |
| Tipos | `src/game/types.ts` | Contratos de datos | Cada dato visible debe tener dueño y tipo; no usar valores mágicos dispersos. |
| Catálogo | `src/game/data.ts` | Equipamiento, cursos, personal, propiedades, rivales y textos | ID, nombre, precio, efecto, requisito y visual deben coincidir. |
| Persistencia | `state.tsx`, panel de ajustes | Guardado automático, JSON, importación y reinicio | Cargar partidas antiguas sin romper reglas ni perder campos. |
| Interfaz | `src/components/*.tsx`, `src/index.css` | Pantallas, modales, teléfono y canvas | Sin recortes, superposiciones ni acciones inaccesibles. |
| Accesibilidad y control | `src/game/shortcuts.ts`, `ui.tsx` | Atajos, foco, mensajes y cierre | Toda acción debe poder descubrirse por texto y teclado. |

## Auditoría económica integral

### Fuentes de ingreso que deben estar conectadas

- Cuotas de alumnos activos.
- Aporte del plantel federado.
- Bolsas de combates amateur y profesionales.
- Entradas y resultado neto de veladas.
- Patrocinios semanales.
- Eventos comunitarios y actividades sociales.
- Sucursales con gerente y, cuando corresponda, entrenador local.
- Ventas de marca de ropa.
- Subsidio de apertura y cualquier ayuda extraordinaria.
- Premios por títulos, logros o hitos, si la regla los habilita.

### Fuentes de gasto que deben estar conectadas

- Alquiler del local.
- Sueldos semanales del personal.
- Costos de velada.
- Bolsas o costos operativos de combate, según la regla definida.
- Compras de equipamiento, indumentaria, salud e instalaciones.
- Cursos y licencias.
- Propiedades, sucursales y mantenimiento si se incorpora.
- Cualquier comisión de promotor, representante o evento.

### Riesgos detectados

1. La previsión de la cabecera no usa el mismo libro que el balance dominical: omite el subsidio de apertura y los ingresos extraordinarios. Esto explica la diferencia entre `−$96` proyectado y un resultado positivo al cerrar la semana.
2. La UI dice “ingresos seguros”, aunque parte de la cifra puede depender de condiciones no confirmadas. Debe distinguir confirmado, probable y extraordinario.
3. La velada registra una línea de ingreso con el resultado neto. Hay que decidir si el libro muestra entradas brutas y costos separados, o solamente neto, y mantener esa convención en todos los lugares.
4. Bolsa de pelea, premio, fama, récord y dinero deben seguir una sola ruta de resolución. Hay que probar victoria, derrota, empate, nocaut, título y pelea cancelada.
5. El balance debe explicar el origen de cada monto. Una cifra final sin desglose no es verificable por el jugador.
6. Las compras opcionales no deben aparecer como gastos semanales si son inversiones únicas; deben reflejarse como salida inmediata y no mezclarse con nómina/alquiler.

## Auditoría de progresión y alumnos

- Capacidad máxima, lista de espera, bajas, transferencia y scouting deben usar una única función de capacidad.
- Buscar talentos debe consumir exactamente un uso semanal y dejar evidencia visible del próximo reinicio.
- Un alumno debe poder pasar por: alumno → prácticas → licencia individual → amateur → profesional → títulos.
- La licencia del entrenador y la licencia del atleta deben permanecer separadas.
- Récord amateur y profesional deben mostrarse por separado y alimentar el ranking correcto.
- Un boxeador con récord negativo debe afectar bolsa, interés y continuidad sin quedar inutilizable sin explicación.
- Eliminar, liberar, transferir o retirar un boxeador debe actualizar cupos, lista de espera, récord y economía.
- Cada transición debe producir un mensaje útil y una ruta clara para continuar.

## Auditoría de pantallas y layout

### Pantallas base

- Inicio: formulario completo, botón de crear/continuar visible y sin recorte.
- Gimnasio: estaciones, alumnos, estado de capacidad y acceso a ficha sin solapamiento.
- Ciudad: mapa + inspector como canvas principal; ranking y scouting como vistas secundarias.
- Plantel: tarjetas, filtros, lista de espera, baja/transferencia y ficha.
- Mercado: categorías con tarjetas de altura estable y acciones alineadas.
- Mi Perfil: resumen del coach; cursos y bienes en vistas ampliadas.
- Personal: tarjetas alineadas, costo semanal y límites de contratación.
- Teléfono: mensajes, sponsors, prensa y Don Anselmo sin tapar el canvas.

### Vistas secundarias que deben existir

- Ficha técnica completa.
- Ranking Mundial completo.
- Detalle de producto del mercado.
- Detalle de rama de cursos.
- Selección de rival.
- Combate y resultado.
- Balance semanal.
- Configuración, atajos, guardado, carga y reinicio.

### Controles visuales obligatorios

- Ningún botón funcional fuera del viewport.
- Ningún texto esencial truncado sin tooltip o detalle.
- Precio, estado, recomendación y acción en lugares constantes.
- La navegación nunca se superpone al canvas.
- No se usa scroll de página para ocultar fallos de composición.
- Las vistas ampliadas deben abrirse y cerrarse con claridad.

## Auditoría de texto y vocabulario

- Usar nombres cortos en tarjetas: Bucal, Cabezal, Botas, Botiquín, Vestuarios, Proteínas, Sauna.
- Explicar el nombre completo solo en detalle, tooltip o descripción.
- Reemplazar “roster” por “Plantel”.
- Reemplazar términos técnicos sin contexto por frases accionables.
- Cada recomendación debe decir qué hacer, cuánto cuesta y qué cambia.
- Las cifras económicas deben incluir motivo, periodo y signo.
- Los estados “bloqueado”, “sin fondos”, “ya usado” y “requiere” deben explicar la solución.

## Persistencia y consistencia

- Crear una partida nueva y cerrar el navegador.
- Continuar una partida guardada.
- Exportar e importar JSON.
- Importar una partida de una versión anterior con campos faltantes.
- Reiniciar carrera y confirmar que se borra también el estado dependiente.
- Confirmar que toasts, ranking, libros, récords y capacidad no quedan en memoria vieja.
- Verificar que doble clic o doble acción no descuenta dos veces.

## Cobertura mínima de pruebas

### Pruebas automáticas

- Economía de partida nueva.
- Economía con alumnos, boxeadores, personal y patrocinio.
- Cierre con velada, pelea, evento y sucursal.
- Victoria, derrota, empate y nocaut.
- Compra con fondos exactos, fondos insuficientes y requisito bloqueado.
- Scouting semanal y capacidad llena.
- Licencias y promoción amateur/profesional.
- Ranking con rivales externos y boxeadores propios.
- Guardado, carga, reinicio y migración.

### Pruebas manuales jugables

- Recorrido de una semana completa.
- Recorrido de cuatro semanas y cambio de mes.
- Camino de alumno a boxeador amateur.
- Camino de amateur a profesional.
- Combate por título.
- Partida en pérdida y recuperación económica.
- Pantallas en 1024×768, 1280×720, 1366×768, 1440×900 y 1920×1080.

## Criterio de salida de la auditoría

El juego solo pasa a “listo para validación del usuario” cuando:

1. El recorrido completo puede jugarse sin usar scroll para encontrar acciones.
2. La previsión y el cierre muestran el mismo origen de dinero.
3. Todos los ingresos y gastos tienen dueño, periodo y explicación.
4. No existen IDs, textos o sistemas visibles sin conexión real.
5. Las pruebas automáticas cubren las transiciones económicas y de carrera principales.
6. El usuario puede jugar una partida completa y reportar solo ajustes de balance o preferencia, no errores estructurales.

## Exclusión explícita

No se auditan ni se producen assets 2D/3D, personajes finales, modelos, texturas ni animaciones artísticas en esta etapa. El arte queda bloqueado hasta que el juego funcional sea validado por el usuario.
