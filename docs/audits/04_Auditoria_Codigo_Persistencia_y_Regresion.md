# Auditoría 4 — Código, persistencia y regresión

Fecha: 23/09/2026  
Estado: diagnóstico previo a implementación. No se modificó código.

## Alcance

Tipos, reducer, engine, catálogos, componentes, persistencia, acciones, atajos, tests, build, consola y recorrido de regresión.

## Mapa de control

| Área | Fuente | Verificación |
|---|---|---|
| Tipos | `src/game/types.ts` | Cada campo visible tiene tipo y valor inicial. |
| Reglas | `src/game/engine.ts` | No duplicar fórmulas en componentes. |
| Estado | `src/game/state.tsx` | Toda acción actualiza estado, libro, toast y persistencia cuando corresponde. |
| Catálogo | `src/game/data.ts` | IDs, precios, requisitos, efectos y nombres coinciden. |
| UI | `src/components/*.tsx` | Cada botón dispara una acción real y muestra resultado. |
| Persistencia | `state.tsx`, panel de ajustes | Guardado, carga, reinicio y migración. |
| Atajos | `src/game/shortcuts.ts`, `App.tsx` | No interfieren con inputs ni acciones duplicadas. |
| Verificación | `game.test.ts`, scripts npm | Tests, typecheck, build y auditoría estructural. |

## Hallazgos

### P0 — persistencia orientada a desarrollador

La implementación actual expone exportar/importar JSON y guarda una sola carrera local. Eso no corresponde a la experiencia esperada.

Debe reemplazarse por:

- Nueva partida.
- Nombre de partida.
- Guardar partida.
- Continuar partida.
- Listado de partidas con coach, gimnasio, semana, dinero y última fecha.
- Cargar una partida.
- Borrar una partida con confirmación.
- Reiniciar la partida activa.

El JSON puede permanecer como mecanismo interno de desarrollo únicamente si no aparece en la interfaz del jugador.

### P0 — pruebas insuficientes para economía y calendario

La suite actual valida reglas importantes, pero se deben ampliar casos para:

- tres alumnos iniciales;
- guanteos en alumno, amateur y profesional;
- frecuencia quincenal/mensual;
- recuperación después de una pelea;
- doble resolución de una pelea;
- bolsa y libro contable;
- previsión igual al balance;
- guardar varias partidas;
- cargar y borrar ranuras.

### P1 — acciones con riesgo de doble ejecución

Hay que probar doble clic y repetición de eventos para compras, licencias, selección de rival, resolución de pelea y cierre de domingo. Cada acción irreversible debe ser idempotente o bloquearse mientras se procesa.

### P1 — migración de partidas

Al cambiar el modelo de alumno, guanteo, calendario y partidas guardadas, las partidas existentes necesitarán sanitización/migración. No se debe asumir que todos los campos nuevos existen.

### P1 — consola y errores visuales

La validación final debe revisar consola del navegador, warnings de React, errores de eventos, elementos que desbordan y foco de teclado. TypeScript y build exitosos no garantizan la ausencia de errores de interacción.

### P2 — nombres y constantes

Los IDs internos pueden conservar nombres técnicos por compatibilidad, pero los textos deben centralizarse para que “fogueo”, “guanteo”, “práctica” y “pelea” no se mezclen sin intención.

## Plan de pruebas de regresión

### Partida nueva

1. Crear partida con nombre de coach y gimnasio.
2. Confirmar tres alumnos.
3. Guardar y cerrar.
4. Continuar y verificar datos.

### Progresión

1. Preparar físicamente.
2. Obtener licencia del entrenador.
3. Emitir licencia individual.
4. Ejecutar guanteo.
5. Verificar que no cambia récord.
6. Pactar y resolver pelea.
7. Verificar récord, bolsa, fama, ranking y libro.

### Economía

1. Semana inicial con subsidio.
2. Semana sin subsidio.
3. Compra de equipo.
4. Contratación de personal.
5. Sponsor.
6. Evento.
7. Velada.
8. Sucursal.
9. Resultado positivo y negativo.

### Persistencia

1. Dos partidas con nombres diferentes.
2. Cambiar entre partidas.
3. Borrar una y conservar la otra.
4. Reiniciar carrera activa.
5. Simular datos antiguos sin campos nuevos.

### Interfaz

1. Recorrer cada pestaña.
2. Abrir y cerrar cada modal.
3. Usar teclado.
4. Probar cinco tamaños de viewport.
5. Revisar consola y elementos cortados.

## Criterios de aceptación

- No existe JSON visible para el jugador.
- Varias partidas pueden guardarse, identificarse y continuar.
- Los datos nuevos se migran sin romper partidas anteriores.
- Toda acción importante tiene test automático o caso manual documentado.
- No hay errores en consola durante el recorrido completo.
- `npm run typecheck`, `npm test -- --run`, `npm run build` y `node audit_engine.js` pasan.
- El usuario puede validar la build sin encontrar errores estructurales.
