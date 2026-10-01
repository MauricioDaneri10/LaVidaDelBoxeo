# Gate 27 — Calibración económica por escenarios

**Fecha:** 2026-09-23\
**Estado:** calibración de recaudaciones implementada y reproducible. La fórmula financiera original fue corregida en Gate 28; la sostenibilidad de nómina/insolvencia severa sigue abierta. No habilita playtest final.

## Propósito y alcance

Comparar una economía temprana (semanas 1–12) y una carrera de un año (semanas 1–52) con semilla fija, en lugar de decidir balance a partir de una sola partida. Se probaron caja semanal, alumnos, nómina temprana y dos estrategias de recaudación. No se cambiaron partidas guardadas.

No cubre todavía peleas y bolsas, ingresos reales de sponsors, ventas de marca, sucursales, préstamos en escenarios combinados, sucesos adversos ni varianza estadística entre múltiples semillas. Estos dominios necesitan un gate económico integrado posterior.

## Parámetros vigentes de eventos

| Actividad | Inversión | Retorno bruto | Margen antes de extras | Margen esperado* | Efecto adicional |
|---|---:|---:|---:|---:|---|
| Gran Bingo Familiar | $200 | $250–$420 | +$50 a +$220 | +$135 | Atrae alumnos |
| Juegos de Mesa y Naipes | $100 | $130–$220 | +$30 a +$120 | +$75 | Noche de camaradería |
| Festival y Exhibición | $500 | $580–$850 | +$80 a +$350 | +$215 | +3 fama |
| Clase Abierta | $60 | $80–$140 | +$20 a +$80 | +$50 | Puede sumar 1 recreativo por una semana; límite 12 |

\* Punto medio del rango menos la inversión. Si está contratado el jefe de difusión, el retorno bruto recibe ×1,15; por tanto, no debe confundirse margen esperado base con margen efectivo de esa combinación. Todas las actividades siguen teniendo retorno bruto mínimo mayor que el coste: diversificamos escala y propósito, pero aún no existe riesgo de pérdida del evento.

Los recreativos de clase abierta son temporales: cobran una cuota semanal de $10 al liquidar esa semana y luego se retiran; no crean ingreso recurrente permanente. Si ya hay 12 recreativos, no se excede el límite.

## Escenarios reproducibles

Semilla: **260923**. Saldo inicial: **$900**. Sin aleatoriedad distinta entre casos, sin compras/peleas adicionales salvo donde se indica. Se captura mínimo de caja tras agendar y durante los días, así como saldo tras cierre de las semanas 12 y 52. “Nómina temprana” contrata entrenador automático al inicio y asistente/preparador en semana 2. “Entrenador + recaudación” contrata solo entrenador desde el inicio y programa naipes semanalmente; comparación alternativa usa bingo semanal.

| Escenario | Saldo fin S12 | Mínimo S1–12 | Saldo fin S52 | Mínimo S1–52 | Lectura |
|---|---:|---:|---:|---:|---|
| Base, sin acciones sociales ni empleados | $600 | $570 | $1.800 | $570 | Operación estable en esta semilla |
| Naipes semanal | $1.783 | $800 | $5.963 | $800 | Acumula caja rápido para el coste de $100 |
| Plantel lleno (10 alumnos), fama 40, naipes semanal | $3.037 | $800 | $9.794 | $800 | Cuotas elevan ingresos; no representa el crecimiento orgánico del plantel |
| Nómina temprana, sin recaudación | −$2.474 | −$2.474 | −$20.249 | −$20.249 | Insolvencia estructural; combinación de salarios no se paga sola |
| Entrenador + naipes semanal | $133 | $94 | −$6.350 | −$6.350 | La actividad pequeña no sostiene esa nómina en el horizonte largo |
| Entrenador + bingo semanal | $1.295 | $688 | $3.831 | $688 | Bingo sostiene esta combinación en esta semilla |

La actividad semanal barata baja de **$3.602 a $1.783** en semana 12 y de **$12.783 a $5.963** en semana 52 frente a los parámetros previos. Con plantel lleno baja de **$4.445 a $3.037** y **$15.805 a $9.794** respectivamente. La referencia de base sin acciones permanece igual.

## Hallazgos y decisiones

1. **No se deben contratar todos los cargos al principio.** Los resultados de −$20.249 al año y −$6.350 con entrenador+naipes hacen visible una barrera económica auténtica, pero también exponen una espiral sin recuperación.
2. **Los ingresos no pueden esconder esta presión.** Las estimaciones deben mostrar qué cuotas, eventos y salarios componen el saldo; los cierres siguen sujetos al libro transaccional.
3. **La elección de evento ya tiene distintas escalas y extras**, pero ninguna opción puede perder dinero en el rango actual. El balance de riesgo permanece abierto a decisión de producto, no se simula como si ya estuviese resuelto.
4. **La cuota recreativa temporal tiene un ciclo explícito**, evita crear renta permanente por repetir clases y respeta el límite global.
5. **Punto ciego de insolvencia identificado.** En este gate la fórmula era `max($10, ceil(3% de deuda))` semanal, sin tope. Gate 28 la limitó a $50 por semana y validó recuperación desde una crisis leve. La nómina temprana aún deja deuda severa; revisar Gate 28 antes de usar este diagnóstico histórico.

## Cambios técnicos relacionados

- `COMUNITARIOS` queda como fuente única de datos de actividades (nombre, inversión, rango de retorno, efecto y emoji); se eliminó el catálogo duplicado que conservaba números antiguos.
- La clase abierta añade un recreativo temporal bajo el tope y avisa si no hay cupo.
- Tests fijan inversión/rango/conciliación y resultado exacto de los seis escenarios a semanas 12 y 52.
- `CityMap` y `panels` leen el emoji del catálogo único.

## Verificación y límites de aprobación

Verificación final: `npm run verify` **PASS** — TypeScript PASS; **47/47 tests PASS**; build PASS; JS **485.2/560 KiB**, CSS **70.5/90 KiB**; auditoría estructural **0 errores / 0 advertencias**. `git diff --check` PASS.

Este gate valida una parte acotada: economía recurrente y recaudación comunitaria en escenarios controlados. No demuestra solvencia bajo todo el contenido ni economía end-to-end; no se debe describir el juego como listo para horas de playtest todavía.

## Siguiente gate recomendado (actualizado tras Gate 28)

**Gate 29 — Decisión de producto sobre insolvencia severa.** Gate 28 mostró que retirar personal evita que la nómina siga aumentando, pero no recupera una carrera ya hundida alrededor de −$10.000: las actividades requieren capital que el jugador insolvente no tiene y el crédito actual es pequeño. Elegir entre rescate excepcional condicionado, reestructuración con obligaciones, liquidación/cierre, o dejar que la carrera requiera reinicio; simular explotación y persistencia antes de implementarlo.
