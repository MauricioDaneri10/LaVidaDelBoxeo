# Auditoría 2 — Economía y calendario

Fecha: 23/09/2026  
Estado: diagnóstico previo a implementación. No se modificó código.

## Alcance

Cuotas, bolsas, sponsors, eventos, veladas, personal, alquiler, equipamiento, cursos, propiedades, sucursales, previsión, libro contable, balance semanal y frecuencia de peleas.

También se incorpora el costo de lesiones, médico, kinesiología y recuperación, siempre que se conviertan en sistemas jugables.

## Flujo económico esperado

```text
Ingresos
  cuotas de alumnos
  aportes de boxeadores federados
  bolsas de peleas
  entradas de veladas
  sponsors
  eventos comunitarios
  sucursales
  ventas de marca
  subsidios

Gastos
  alquiler
  sueldos
  costos de veladas
  costos de combate si corresponden
  compras únicas
  cursos y licencias
  propiedades

Resultado = ingresos confirmados + ingresos extraordinarios - gastos del período
```

## Hallazgos

### P0 — previsión y balance usan escenarios diferentes

En `src/App.tsx`, la previsión calcula cuotas, aportes y sponsor, y resta alquiler y personal. No incluye el subsidio de apertura.

En `domingoBalance` de `src/game/state.tsx`, la semana 1 sí agrega `Subsidio de apertura del club` por `$240`. Esto explica el caso observado:

```text
Ingresos estimados: $54
Gastos previstos: $150
Previsión: -$96
```

Luego el balance suma la ayuda de apertura y produce otro resultado. No es necesariamente un error matemático: es una contradicción de presentación y de escenario.

### P0 — falta una función económica única

La previsión y el cierre deben usar el mismo cálculo base y distinguir:

- confirmado;
- probable;
- extraordinario;
- compra opcional;
- resultado neto.

### P0 — bolsas y veladas necesitan convención contable

Una pelea resuelta suma la bolsa al dinero y al libro de ingresos. La velada propia registra el resultado neto como una línea de ingreso. Debe definirse una única convención:

- opción A: entradas brutas y costos separados;
- opción B: solo neto, claramente etiquetado.

No se deben mezclar ambas.

### P1 — `resultadoNeto` mezcla períodos

El histórico acumula peleas, veladas y cierres semanales. Es útil, pero la interfaz debe diferenciar resultado de la semana, resultado del mes y histórico total.

### P1 — compras únicas y gastos recurrentes

Equipamiento, cursos, licencias y propiedades son inversiones puntuales. Alquiler, sueldos y costos de eventos son gastos del período. La previsión no debe sugerir que comprar equipamiento crea un gasto semanal.

### P1 — calendario competitivo

El día sábado concentra guanteos, peleas pendientes y veladas. El modelo necesita reservar el sábado como fecha de actividad, pero no generar una pelea obligatoria cada sábado para cada boxeador.

La pelea debe poder pactarse para una fecha concreta. La frecuencia recomendada funciona como una regla de recuperación y disponibilidad, no como una obligación de pelear todos los sábados.

Frecuencia recomendada:

- amateur: una pelea posible cada dos semanas;
- profesional: una pelea posible cada tres o cuatro semanas;
- título: recuperación y requisitos adicionales.

### P1 — economía de lesiones

Si el sistema incorpora lesiones, debe existir un circuito económico completo:

```text
daño de pelea → lesión visible → diagnóstico → descanso/tratamiento
→ costo y tiempo → regreso al 70% o alta médica → próxima fecha
```

No se debe cobrar un costo médico sin que el jugador vea qué lesión trata, cuánto tarda y qué pasa si no paga.

### P1 — monetización futura sin ventaja competitiva

El diseño debe poder escalar a monetización sin romper la experiencia:

- no vender victorias, récords, títulos, energía, licencias ni rivales fáciles;
- no vender ventajas de ranking o bolsas garantizadas;
- priorizar cosméticos, emblemas, temas de interfaz, elementos decorativos y personalización del club;
- un pase, si existe, debe entregar objetivos extra o cosméticos y no bloquear el recorrido principal;
- todo contenido comprable debe ser opcional y no afectar la competencia justa;
- el jugador que no paga debe tener la misma progresión funcional.

Antes de monetizar hará falta definir costos, moneda, reembolsos, privacidad, compras accidentales y límites para menores. No se implementa en esta etapa.

### P2 — transparencia de caja

Antes de comprar o contratar, el jugador debe ver:

- caja actual;
- caja después de la compra;
- gastos fijos próximos;
- ingresos confirmados próximos;
- margen de seguridad.

## Criterios de aceptación

- Previsión y balance comparten las mismas líneas económicas.
- La ayuda inicial aparece en la previsión de la semana 1.
- Cada bolsa se refleja una sola vez.
- Cada costo tiene concepto, monto y momento.
- El resultado semanal no se confunde con el histórico.
- Las peleas respetan el período de recuperación.
- El jugador puede entender por qué gana o pierde dinero sin abrir herramientas técnicas.
- Los costos de tratamiento y recuperación son opcionales, transparentes y no crean una obligación de pago real.
- Existen tests de partida nueva, personal, sponsors, veladas, sucursales, compras, pelea y semana con pérdida.
