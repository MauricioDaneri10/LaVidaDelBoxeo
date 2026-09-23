# Auditoría 1 — Reglas y progresión

Fecha: 23/09/2026  
Estado: diagnóstico previo a implementación. No se modificó código.

## Alcance

Alumnos, preparación física, guanteos, licencias, amateurs, profesionales, récords, recuperación, títulos, ranking y capacidad del gimnasio.

## Evidencia revisada

- `src/game/types.ts`: modelo de `Pugilista`, roles, circuitos, récords, fogueo y peleas.
- `src/game/engine.ts`: generación de atletas, capacidad, habilitación, ranking, ofertas y progresión.
- `src/game/state.tsx`: entrenamiento semanal, guanteos del sábado, licencias, peleas y ascenso profesional.
- `src/components/BoxerSheet.tsx`: ficha individual y acciones.
- `src/components/panels.tsx`: plantel, lista de espera y acciones de gestión.
- `src/App.tsx`: guía inicial y próximos pasos.

## Hallazgos

### P0 — recorrido inicial confuso

El recorrido actual mezcla “prácticas de combate”, “fogueo” y “guanteos”. Para un jugador nuevo no queda suficientemente claro qué es entrenamiento normal, qué es guanteo y qué habilita la licencia.

Recorrido que debe quedar explícito:

1. Preparación física.
2. Licencia del entrenador.
3. Licencia individual del boxeador.
4. Guanteos programados.
5. Peleas oficiales.

### P0 — demasiados alumnos iniciales

La partida base genera varios alumnos. Para enseñar el sistema conviene comenzar con tres perfiles diferenciados y no generar más alumnos si la capacidad está completa.

### P0 — frecuencia de competición incorrecta

`diaSabado` se ejecuta cada semana y el representante puede agendar una pelea semanal para un boxeador disponible. Esto contradice una progresión realista.

Debe existir en cada atleta:

- próxima fecha elegible;
- fecha de última pelea;
- semanas de recuperación;
- circuito amateur/profesional;
- estado disponible, recuperándose o con pelea pactada.

### P1 — guanteo incompleto

Actualmente `diaSabado` procesa guanteos únicamente para `rol === "alumno"`. Los boxeadores amateur y profesionales también deben tener guanteos, separados conceptualmente de las peleas oficiales.

El guanteo debe:

- consumir energía;
- aportar más técnica, defensa y experiencia que el entrenamiento común;
- no modificar el récord oficial;
- tener fecha o frecuencia visible;
- poder ser automático o elegido según la intención del diseño.

### P1 — datos mezclados

`fogueo` y `fogueoMeta` representan progreso previo a la licencia, pero la UI los presenta también como prácticas de combate. Deben diferenciarse:

- entrenamiento semanal;
- guanteos realizados;
- progreso para licencia;
- próxima actividad.

### P1 — salida del plantel

La lista de espera existe, pero el jugador necesita acciones comprensibles para liberar un cupo: retirar, transferir o liberar. Cada acción debe actualizar capacidad, estado, mensajes y posibles efectos económicos.

### P1 — transición amateur/profesional

La promoción a profesional se activa al llegar a 50 peleas amateurs, pero debe ser una decisión visible del jugador, con requisitos explicados y confirmación. No debería cambiar silenciosamente de circuito.

### P2 — ranking y títulos

El ranking ya reúne competidores propios y rivales, pero debe verificarse que:

- amateur y profesional no se mezclen sin etiqueta;
- el récord usado corresponda al circuito correcto;
- títulos, nocauts y calidad de rival pesen de forma consistente;
- un boxeador sin peleas no aparezca artificialmente por encima de veteranos.

## Modelo recomendado

```text
Alumno
  └─ preparación física semanal
      └─ licencia del entrenador habilita licencias individuales
          └─ licencia individual → boxeador amateur
              └─ guanteos periódicos
                  └─ peleas amateurs espaciadas
                      └─ 50 peleas → opción de pasar a profesional
                          └─ guanteos profesionales + peleas cada 3/4 semanas
                              └─ títulos y ranking
```

## Criterios de aceptación

- La partida inicia con tres alumnos.
- El juego explica el próximo paso con una sola acción principal.
- El guanteo se entiende como entrenamiento especial, no como pelea oficial.
- Alumnos, amateurs y profesionales pueden tener guanteos.
- Las peleas respetan recuperación y calendario.
- El récord cambia únicamente por peleas oficiales.
- La promoción profesional requiere decisión y requisitos visibles.
- La lista de espera nunca bloquea al jugador sin una acción para resolverla.
- La ficha muestra circuito, próxima actividad, récord y estado de forma.
