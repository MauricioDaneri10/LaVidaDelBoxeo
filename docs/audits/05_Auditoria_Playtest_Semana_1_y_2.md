# Auditoría 5 — Playtest de semana 1 y 2

Fecha: 23/09/2026  
Fuente: recorrido real del usuario y ocho capturas de pantalla.  
Estado: diagnóstico, sin modificaciones de código.

## Resumen

La partida ya tiene una base jugable clara, pero el playtest descubrió problemas de tres tipos:

1. El tutorial y la progresión comunican estados antes de que realmente estén completos.
2. El layout funciona mejor en pantalla completa que en una ventana normal.
3. Varias reglas todavía permiten crecimiento, gasto y recompensas demasiado rápidos.

## Hallazgos confirmados por captura

### P0 — tutorial incorrecto

En la captura inicial aparece `Completar prácticas de combate` como completado aunque el boxeador todavía no alcanzó los 10 guanteos necesarios para licenciarse.

Causa localizada en `src/App.tsx`: el hito se considera hecho con `fogueo > 0`. Debe considerarse hecho únicamente cuando se alcanza el objetivo real, idealmente `10/10 guanteos` y la acción siguiente queda disponible.

Orden corregido del tutorial:

1. Elegir enfoque de entrenamiento.
2. Equipar el gimnasio.
3. Completar 10 guanteos.
4. Obtener licencia individual del primer boxeador.

El paso 3 nunca debe aparecer verde después del primer guanteo.

### P0 — Ciudad cortada en ventana normal

La captura muestra mapa, inspector, ranking y scouting compitiendo con guía, previsión y teléfono. En pantalla completa mejora, pero el juego debe adaptarse automáticamente a una ventana normal.

Solución prevista: presupuesto de altura por layout, inspector y ranking como paneles ampliados, scouting como acción independiente y actividades sociales fuera de Ciudad.

### P0 — información inferior inaccesible

El botón de scouting queda cortado. La parte inferior de Ciudad debe dejar de depender de que el usuario maximice la ventana.

### P1 — Perfil con botones excesivamente anchos

`Cursos del Coach`, `Bienes Raíces` y `Ver cursos de esta rama` ocupan mucho más que su texto. La interfaz debe usar botones de ancho natural o una grilla equilibrada, no barras de pantalla completa cuando no es necesario.

### P1 — Personal desalineado

Los botones Contratar aparecen a distinta altura porque las descripciones tienen distinta longitud. Cada tarjeta necesita una estructura fija: encabezado, costo, descripción limitada, estado y acción pegada al borde inferior.

### P1 — vocabulario de navegación

`Cerrar el día` debe pasar a `Avanzar día`.  
`Cerrar el domingo y abrir el gimnasio el lunes` debe pasar a `Continuar`.

### P1 — teléfono con acciones demasiado largas

Los eventos muestran botones como `Aceptar · Organizar (-$200)`. La acción debe decir `Aceptar` o `No aceptar`; costo, retorno y fecha deben quedar en la tarjeta.

### P1 — ficha técnica

La ficha necesita:

- más ancho y mejor distribución;
- todos los indicadores con la misma columna y barra;
- `Talento`, sin el texto recortado de “techo”;
- asignación centrada: `Asignado` arriba y `Enfoque estilista` abajo;
- títulos `Enfoque de entrenamiento semanal` en una sola composición;
- descripción completa y centrada dentro de cada enfoque;
- etiquetas de carrera que evolucionen: Alumno → Amateur → Profesional → Campeón;
- rasgos con nombres comprensibles, no etiquetas confusas como `Tren inferior`.

### P1 — entrenador automático

El Director Técnico debe:

- elegir descanso cuando el boxeador está fatigado o lesionado;
- impedir que la preparación lo siga desgastando;
- reactivar el enfoque recomendado cuando recupera energía;
- respetar una pelea pactada y su fecha;
- no cambiar el enfoque elegido por el jugador sin explicación.

### P1 — calendario superficial

El calendario actual muestra etiquetas resumidas como `Entreno`, `Guanteo` y `Balance`, pero no fechas reales. Debe mostrar día de la semana, número de día, mes y actividades concretas.

Ejemplo:

```text
Lunes 1     Preparación física
Martes 2    Evento del club
Miércoles 3 Descanso
Jueves 4    Guanteo · Abril Martínez
Viernes 5   Preparación física
Sábado 6    Pelea pactada · Tomás Coronel
Domingo 7   Balance semanal
```

### P1 — contratación sin progresión

Actualmente se puede contratar una gran parte del cuerpo técnico inmediatamente si hay dinero. Debe haber requisitos de nivel, fama, cursos, capacidad o reputación, y una ruta gradual de contratación.

### P1 — recompensas de Don Anselmo

Las recompensas cobradas permanecen visibles como `Cobrado` y no generan una nueva misión. La solución debe reemplazar la misión cobrada por una siguiente misión procedural de dificultad controlada.

Las recompensas deben:

- tener fama de 1 a 3 como máximo en la etapa inicial;
- poder incluir dinero, descuentos, oportunidades o desbloqueos;
- escalar por etapa del club;
- evitar entregar 80 de fama en pocas semanas;
- no repetirse sin límite;
- explicar objetivo, recompensa y progreso.

### P1 — crecimiento de boxeadores demasiado rápido

En semana 2 la partida ya tiene seis boxeadores. El crecimiento actual debe separar:

- alumnos recreativos que pagan cuota y no quieren competir;
- talentos en desarrollo;
- boxeadores federados;
- profesionales.

Un alumno no debe convertirse en boxeador solo por existir o por eventos automáticos. El jugador debe emitir licencia y decidirlo.

### P1 — actividades sociales

Las actividades sociales ocupan espacio incómodo en Ciudad. Deben vivir en Mi Perfil o en una sección de agenda social, mientras Ciudad queda enfocada en mapa, scouting, ranking y salón de la fama.

El usuario debe poder elegir una actividad, ver inversión, retorno, día disponible y uso semanal/quincenal, y agendarla desde el calendario.

### P1 — economía y caja negativa

La caja puede caer a valores negativos después de contratar personal. Hace falta una política clara:

- advertencia antes de una contratación;
- gastos fijos visibles;
- penalización gradual por deuda;
- suspensión de compras o contrataciones si la deuda es crítica;
- opción futura de micropréstamo o sponsor de emergencia con costo y límite.

El préstamo no debe resolver la economía sin costo ni convertirse en una deuda infinita.

### P2 — continuidad del boxeador no licenciado

Un alumno puede superar 10 guanteos y no ser licenciado por decisión del jugador. Debe poder:

- seguir entrenando;
- seguir haciendo guanteos;
- ayudar a compañeros en sesiones de sparring;
- seguir pagando cuota recreativa;
- no aparecer en peleas ni ranking oficial;
- no ser convertido automáticamente en boxeador.

## Preguntas de control que quedan incorporadas

- ¿Qué pasa si nunca se emite la licencia? El alumno debe tener una carrera recreativa válida.
- ¿Qué pasa si un boxeador está cansado? El entrenador debe ordenar descanso y bloquear una pelea insegura.
- ¿Qué pasa si gana pero se lesiona? Debe cobrar la bolsa, registrar la victoria y quedar en recuperación.
- ¿Qué pasa si se contrata demasiado personal? La economía debe advertir y la deuda debe tener consecuencias legibles.
- ¿Qué pasa si se cobra una misión? Debe aparecer la siguiente, no quedar una lista muerta.
- ¿Qué pasa si pasan años? Alumnos y boxeadores deben envejecer, retirarse o permanecer recreativos según su trayectoria.
- ¿Qué pasa si se actualiza el juego? La migración debe conservar récord, dinero, licencias, propiedades y calendario.

## Salón de la Fama

Se recomienda agregarlo como sistema histórico separado del ranking actual:

- Ranking Mundial: estado competitivo actual.
- Salón de la Fama: campeones, récords destacados, nocauts, títulos, fama histórica y carreras retiradas.

Un boxeador retirado sale del ranking activo, pero queda en el Salón de la Fama si cumple un umbral de logros. El gimnasio conserva su historia.

## Conclusión

Las cuatro auditorías técnicas anteriores siguen siendo necesarias y suficientes. Esta auditoría de playtest funciona como evidencia de aceptación y agrega una nueva puerta: no se considera cerrada una fase hasta que el usuario juega el loop y confirma que el resultado es comprensible.
