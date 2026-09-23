# Auditoría integral de La Vida del Boxeo

> **Fecha:** 23/09/2026  ·  **Alcance:** motor, economía, guardado, UI, jugabilidad, gestión, accesibilidad y puntos ciegos  ·  **Criterio:** que un jugador de 10 a 90 años pueda entender qué hacer, cuánto tiene, qué puede perder y cuál es el próximo paso.

## Resumen visual

| Área | Estado | Lectura rápida |
|---|:---:|---|
| Bucle semanal | 🟢 | La secuencia lunes–sábado–domingo es clara y permite automatizar. |
| Gestión de alumnos | 🟢 | Cupos y lista de espera ya están bien encaminados. |
| Combate | 🟡 | Es atractivo, pero faltan blindajes y hay datos de caídas que pueden quedar invertidos. |
| Economía | 🟡 | Hay dinero, cuotas y balance, pero falta separar seguro / probable / riesgo. |
| Guardado | 🟡 | Auto-guardado, respaldo JSON y sonido persistente funcionan; falta migración y más de un respaldo. |
| Navegación | 🟢 | Las seis áreas están disponibles y hay atajos. |
| Onboarding | 🟡 | Indica un siguiente paso, pero no acompaña todo el primer ciclo. |
| UI y legibilidad | 🟢 | La base visual es consistente; todavía puede simplificarse la densidad de información. |
| Accesibilidad | 🟡 | Hay foco y etiquetas principales, pero faltan preferencias de texto y navegación completa por teclado. |
| Robustez | 🟡 | El motor está tipado y probado, pero falta una frontera de errores para proteger la partida. |

## Lo que hay que conservar

- El jugador ve rápidamente la caja del club, la fama, el día y el próximo paso.
- La semana rápida permite una experiencia semiautomática sin eliminar decisiones importantes.
- La lista de espera evita que el gimnasio se rompa cuando se llena.
- El plantel tiene progreso visible: energía, valoración y prácticas de combate.
- La economía tiene feedback positivo y negativo; el resumen dominical es una buena columna vertebral.
- El teléfono, Don Anselmo y los eventos agregan vida sin obligar a leer manuales largos.

## Puntos ciegos encontrados

### 🔴 P0 — Corregir antes de sumar sistemas

#### 1. Datos de caídas potencialmente invertidos

En `resolverPelea`, `caidasA` se construye con las caídas de B y `caidasB` con las de A. El resultado puede mostrar que cayó el boxeador equivocado aunque la simulación haya sido correcta.

**Solución:** definir una convención única: `caidasA = e.A.caidas`, `caidasB = e.B.caidas`, agregar un test de pelea con una caída conocida y revisar el resumen visual.

#### 2. El representante puede saltarse la restricción de televisión

La búsqueda manual filtra títulos internacionales si no existe el curso de televisión, pero el representante llama directamente a `generarOfertas` y puede agendar una oferta de título sin pasar por ese filtro.

**Solución:** centralizar `ofertasValidasPara(p, estado)` y usarla tanto en búsqueda manual como en automatización.

#### 3. El nivel del perfil no coincide con el nivel del motor

El motor considera fama **o** cantidad de equipamiento **o** cinturones. El perfil muestra el nivel usando solamente fama. El usuario puede ver “Nivel 1” aunque el gimnasio ya funcione como nivel 2.

**Solución:** usar `nivelGimnasio(state)` en todas las pantallas y eliminar fórmulas duplicadas.

#### 4. Reducir personal puede dejar alumnos fuera de capacidad

Despedir a un asistente reduce la capacidad, pero la acción no normaliza la lista de espera. Se puede terminar con más alumnos activos que plazas y sin la marca `enEspera` actualizada.

**Solución:** después de contratar, despedir, comprar capacidad o cambiar sucursales, ejecutar una única función de normalización y mostrar qué alumnos pasaron a espera.

#### 5. Falta un escudo contra errores de interfaz

Si un componente React falla, no hay una pantalla de recuperación que permita volver al juego, exportar la partida o recargar de forma segura.

**Solución:** agregar `ErrorBoundary` con tres acciones: “Recargar”, “Volver a intentar” y “Descargar respaldo”. No debe borrar el `localStorage` automáticamente.

### 🟠 P1 — Mejorar antes de ampliar contenido

#### 6. La previsión económica no es todavía una previsión completa

La barra semanal informa ingresos por alumnos, boxeadores y patrocinio, pero no incorpora claramente eventos posibles, veladas, bolsas, compras pendientes ni gastos extraordinarios. Además, el resultado se presenta como una cifra única.

**Propuesta de lectura simple:**

```text
CAJA HOY              $900
INGRESO SEGURO       +$180  cuotas y aportes
INGRESO POSIBLE      +$0–$800 eventos / velada / pelea
GASTO OBLIGATORIO    −$150  alquiler y salarios
CAJA PROYECTADA      $930–$1.730
RIESGO               bajo
```

La interfaz debe distinguir **seguro**, **posible** y **obligatorio**. El jugador entiende así si está ganando o entrando en pérdida sin estudiar una planilla.

#### 7. El balance contable mezcla conceptos

La velada calcula un neto, lo suma como ingreso y no expone el costo en el mismo desglose. `stats.dineroGanado` tampoco registra pérdidas, por lo que puede dar una sensación demasiado optimista.

**Solución:** guardar siempre `ingresoBruto`, `gasto` y `neto`; mostrar “ganado histórico” y “resultado neto histórico” por separado.

#### 8. La ficha del boxeador puede mostrar historial ajeno

La función de historial de la ficha actualmente deja pasar todos los registros, en vez de filtrar por el atleta seleccionado. La ficha puede parecer correcta, pero el historial no necesariamente pertenece al boxeador.

**Solución:** persistir `miId` en cada `ResultadoPelea` o filtrar desde `historial` con un identificador inequívoco.

#### 9. La alerta del teléfono puede anunciar alumnos en espera como listos

El teléfono busca un alumno listo por prácticas, pero no excluye `enEspera` ni comprueba siempre el requisito de habilitación. El plantel sí aplica filtros más estrictos.

**Solución:** crear `puedeHabilitar(p, state)` y reutilizarla en teléfono, plantel, ficha y onboarding.

#### 10. Cursos y personal tienen nombres parecidos, pero funciones distintas

El curso “Director Técnico Federado” habilita licencias. El empleado “Director Técnico Principal” automatiza entrenamiento. Para un jugador nuevo parece el mismo sistema y genera dudas sobre qué comprar.

**Solución de vocabulario:**

| Sistema interno | Nombre para el jugador |
|---|---|
| Curso `dt` | Licencia para competir |
| Personal `directorTecnico` | Entrenador automático |
| Fogueo | Prácticas de combate |
| Fama | Reputación del club |
| Velada | Noche de boxeo |

#### 11. La lista de espera todavía no tiene una política visible

La lógica existe, pero el jugador no ve posición, tiempo estimado ni motivo de ascenso.

**Mejora:** mostrar “#1 en espera”, “entra al liberar una plaza” y un aviso cuando una mejora libera cupos.

#### 12. La simulación tiene demasiadas reglas dispersas

Efectos de equipamiento, cursos y personal están repartidos entre entrenamiento, economía, combate y reducer. Es difícil comprobar si una descripción del mercado coincide con el motor.

**Solución:** crear un catálogo de efectos calculados:

```ts
const modificadores = calcularModificadores(state);
// { recuperacion, capacidad, gananciaFisica, gananciaTecnica,
//   esquiva, resistenciaDanio, famaVictoria, ingresosVelada }
```

Cada sistema consume el mismo resultado y el mercado puede mostrarlo directamente.

### 🟡 P2 — Mejorar para hacer el juego más limpio

#### 13. El primer ciclo todavía requiere leer demasiadas pantallas

Hay banner de siguiente paso, teléfono, Don Anselmo y ficha. Todos ayudan, pero pueden competir entre sí.

**Propuesta:** tutorial de cuatro hitos, siempre visible y con solo una acción recomendada:

```text
1  Equipá una mejora       □
2  Elegí un enfoque         □
3  Completá prácticas       □
4  Habilitá a tu boxeador   □
```

Cuando el jugador termina el hito, el sistema muestra el siguiente y guarda el progreso.

#### 14. El mercado necesita una recomendación de compra

Los 21 artículos aparecen como una grilla plana. Para un principiante, la pregunta es “¿qué compro primero?”.

**Solución:** añadir tres etiquetas: `Recomendado ahora`, `Útil después`, `Meta avanzada`. Ordenar por impacto inicial y caja disponible.

#### 15. Faltan estados de decisión resumidos

Cada pantalla debería responder primero una sola pregunta:

| Pantalla | Pregunta principal |
|---|---|
| Gimnasio | ¿Qué está entrenando mi gente hoy? |
| Plantel | ¿Quién progresa y quién necesita una acción? |
| Mercado | ¿Qué mejora conviene comprar con mi caja? |
| Ciudad | ¿Qué inversión cambia mi economía? |
| Perfil | ¿Qué desbloqueo conviene aprender después? |
| Personal | ¿Qué gasto semanal justifica cada empleado? |

#### 16. Falta un registro sencillo de decisiones

El libro existe en el estado, pero el jugador no tiene una vista fácil de “qué pasó esta semana”.

**Solución:** una tarjeta “Resumen de la semana” con cuatro filas: dinero inicial, ingresos, gastos, dinero final y una frase de aprendizaje.

#### 17. El progreso profesional ocurre automáticamente sin suficiente explicación

Un boxeador puede pasar a profesional por cantidad de victorias. Es sencillo, pero debe aparecer como hito visible para que no parezca un cambio arbitrario.

**Solución:** aviso: “Ganó experiencia suficiente: ahora compite como profesional. Sus rivales y bolsas cambian.”

#### 18. Falta una capa de accesibilidad opcional

Agregar en opciones:

- texto grande;
- alto contraste;
- reducir animaciones;
- mostrar explicaciones siempre;
- sonido activado / silenciado.

## Auditoría por sistema

### Gestión de alumnos

**Bien:** capacidad, espera, prácticas, energía y habilitación ya forman un ciclo jugable.

**Agregar:** estado único del alumno (`activo`, `espera`, `listo`, `habilitado`, `lesionado`), objetivo siguiente, posición en espera y botón contextual único.

### Combate

**Bien:** planes, asaltos, jueces, caída, nocaut, sonido y simulación rápida.

**Agregar:** prueba de invariantes, historial por atleta, explicación de decisión, resumen de daño y caída, y botón “simular resto” siempre visible pero secundario.

### Economía

**Bien:** cuotas, alquiler, sueldos, patrocinio, veladas, eventos y sucursales.

**Agregar:** margen semanal, caja mínima recomendada, proyección de cuatro semanas, ingreso bruto/neto, costo de oportunidad y alertas antes de comprar.

### Guardado

**Bien:** auto-guardado, guardado manual, JSON y validación básica.

**Agregar:** `schemaVersion`, migraciones, dos copias locales rotativas, fecha de último guardado en la barra superior, detección de almacenamiento lleno y prueba automatizada de import/export.

### UI y accesos

**Bien:** seis áreas, teléfono contextual, modal de ficha, atajos `1–6`, `N`, `S` y `Esc`.

**Agregar:** foco visible al cambiar de pantalla, atajo `?` para ayuda, breadcrumbs en modales, contador de notificaciones no leídas y una acción principal por pantalla.

### Gráficos y presentación

**Ahora:** el lenguaje visual es coherente, oscuro y reconocible.

**Antes de producir modelos 3D:**

1. terminar la jerarquía de información;
2. reducir textos duplicados;
3. unificar iconos y estados;
4. definir qué objetos necesitan ilustración real;
5. reemplazar después los muñecos y utilería con arte final.

## Hoja de ruta recomendada

### Fase 1 — Blindaje de reglas

- [ ] Corregir caídas A/B.
- [ ] Centralizar ofertas válidas y requisitos de títulos.
- [ ] Unificar nivel de gimnasio.
- [ ] Normalizar capacidad al despedir personal.
- [ ] Filtrar correctamente historiales.
- [ ] Agregar ErrorBoundary.

### Fase 2 — Economía legible

- [ ] Proyección segura / posible / obligatoria.
- [ ] Ingreso bruto, gasto y neto.
- [ ] Resultado neto histórico.
- [ ] Alerta de caja mínima.
- [ ] Resumen semanal de cuatro números.

### Fase 3 — Simplificación de experiencia

- [ ] Checklist de cuatro hitos.
- [ ] Una acción principal por pantalla.
- [ ] Recomendación de compra.
- [ ] Estados únicos del alumno.
- [ ] Ayuda rápida con `?`.

### Fase 4 — Profundidad opcional

- [ ] Lesiones y recuperación avanzada.
- [ ] Rivalidades y relaciones con clubes.
- [ ] Ranking visible.
- [ ] Contratos y objetivos de temporada.
- [ ] Eventos de carrera con decisiones acumulativas.

### Fase 5 — Arte final

- [ ] Personajes ilustrados o 3D.
- [ ] Objetos del gimnasio con iconografía propia.
- [ ] Animaciones finales de soga, manoplas y ring.
- [ ] Variantes visuales de ciudad, títulos y veladas.

## Criterio de éxito

El juego está listo para la siguiente fase cuando un jugador nuevo pueda responder, sin abrir un manual:

1. ¿Qué puedo hacer hoy?
2. ¿Cuánto dinero tengo y cuánto voy a gastar?
3. ¿Qué pasa si cierro la semana?
4. ¿Quién necesita mi atención?
5. ¿Cuál es la próxima mejora útil?
6. ¿Mi partida está guardada?

Si alguna pantalla no responde una de esas preguntas en menos de cinco segundos, debe simplificarse antes de añadir más contenido o modelos.

## Verificación realizada

- Revisión del motor y reducer.
- Revisión de flujo semanal y economía.
- Revisión de pantallas principales y modales en navegador.
- Revisión del guardado, importación, exportación y atajos.
- `npm run typecheck`: correcto.
- `npm test -- --run`: 7 pruebas correctas.
- `npm run build`: correcto.
- `node audit_engine.js`: 0 errores y 0 advertencias.

**Conclusión:** la base ya es jugable y tiene una identidad clara. La prioridad no es agregar más sistemas todavía: es unificar reglas, hacer transparente la economía y reducir decisiones repetidas. Después de eso, cualquier sistema nuevo —ranking, rivalidades, lesiones o arte 3D— va a entrar sin aumentar el ruido de la interfaz.
