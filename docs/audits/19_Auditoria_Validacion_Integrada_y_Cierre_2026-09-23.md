# Auditoría 7 — Validación integrada y cierre

Fecha: 2026-09-23\
Estado: primera pasada completada; cierre bloqueado por hallazgos P0

## 1. Objetivo

Comprobar si la build actual puede considerarse lista para el playtest del usuario después de combinar UI, economía, estado, persistencia, texto y progresión.

## 2. Pruebas ejecutadas

### Verificación automatizada

`npm run verify` pasó:

- TypeScript: OK.
- Vitest: 34/34 OK.
- Build Vite: OK.
- Bundle JavaScript: 481.9 KiB de 560 KiB.
- Bundle CSS: 68.8 KiB de 90 KiB.
- Auditoría estructural: 0 errores, 0 advertencias.

### Prueba visual real

Se abrió la aplicación local y se inspeccionaron las siete pestañas a 1280×720. El canvas principal no presenta scroll de página, pero se observaron:

- espacio libre no utilizado debajo de las grillas;
- bloques redundantes en Mercado, Mi Perfil, Personal y Calendario;
- tarjetas de Plantel demasiado compactas para el espacio disponible;
- riesgo de ocultación en el Panel del Club por altura fija y `overflow-hidden`.

### Prueba de estabilidad del motor

La suite existente contiene un playtest automatizado de 52 semanas con semilla fija y verifica límites de plantel, energía, dinero, fama y calendario. Esto demuestra estabilidad básica del reducer, pero no sustituye la validación de layout en múltiples resoluciones ni la revisión de intención visual.

## 3. Matriz de recorrido

| Recorrido | Estado | Motivo |
|---|---|---|
| Partida nueva | Parcial | El loop inicial funciona, pero la densidad visual no cumple el contrato aprobado |
| Elegir enfoques | Parcial | La acción existe; falta validar textos largos y consejo contextual en todos los casos |
| Equipar gimnasio | Parcial | La compra funciona; Mercado contiene resumen redundante |
| Diez guanteos y licencia | Parcial | La regla está testeada; falta validar toda la experiencia visual en distintas resoluciones |
| Primer combate | Parcial | El combate funciona en la suite, pero requiere smoke test visual de estadísticas y salida |
| Balance dominical | Parcial | El motor registra líneas, pero seguidores y operaciones requieren trazabilidad mejorada |
| Caja negativa y préstamo | Parcial | Existe la regla, pero la entrada está escondida en el Panel del Club |
| Actividades del Club | Parcial | Hay modelos; debe diferenciarse totalmente de Propuestas del Barrio |
| Partida existente | OK técnico / pendiente visual | Migración y persistencia tienen tests; falta recorrido visual con datos abundantes |
| 52/120 semanas | 52 OK automatizado / 120 pendiente | La suite actual cubre 52; falta ampliar el escenario de larga duración |

## 4. Bloqueos de cierre

### P0-01 — Duplicación de información

La build actual no puede aprobarse porque utiliza datos globales repetidos para llenar espacio. Esto contradice la arquitectura de información definida por el producto.

### P0-02 — Densidad de grillas

Plantel, Mercado y Personal no usan el espacio libre para mejorar sus entidades principales. La corrección debe cambiar la composición, no sumar indicadores.

### P0-03 — Contenido variable potencialmente oculto

El Panel del Club y otros contenedores usan recortes que pueden ocultar información a medida que la partida crece.

### P1-01 — Economía explicable

Seguidores, préstamos, actividades y resultados necesitan una prueba integrada donde cada variación quede explicada y no sea sobrescrita silenciosamente.

### P1-02 — Traducción completa

El catálogo i18n aún no cubre todos los textos visibles.

## 5. Condiciones de aprobación final

La build podrá pasar a playtest del usuario cuando cumpla todas estas condiciones:

- [ ] P0-01, P0-02 y P0-03 resueltos.
- [ ] No quedan resúmenes duplicados en ninguna pestaña.
- [ ] Todas las grillas ocupan el espacio disponible sin deformar tarjetas.
- [ ] Plantel conserva paginación y soporta crecimiento.
- [ ] Panel del Club tiene paginación/modal para contenido largo.
- [ ] Proyección y balance usan las mismas líneas.
- [ ] Seguidores se actualizan gradualmente y de forma explicable.
- [ ] Préstamo y actividades tienen entrada visible y condiciones claras.
- [ ] No hay recursos 404 en build de producción.
- [ ] Textos principales están localizados y no se cortan.
- [ ] Se ejecutan recorridos de partida nueva y existente.
- [ ] Se ejecutan simulaciones de 12, 52 y 120 semanas.
- [ ] Se repite la verificación completa después de los cambios.

## 6. Dictamen final de esta fase

La build actual es técnicamente ejecutable, pero **no está lista para el playtest final del usuario**. La razón no es una falla de compilación: es que la solución visual reciente resolvió el espacio vacío con redundancia y dejó pendientes de arquitectura, economía explicable y escalabilidad de contenido.

La próxima fase autorizada por el plan es la implementación controlada:

1. retirar bloques redundantes;
2. ampliar y reordenar grillas;
3. asegurar el Panel del Club;
4. revisar selectores económicos;
5. ejecutar nuevamente todos los tests y auditorías.

No se debe abrir el playtest final hasta que estos gates estén en verde.
