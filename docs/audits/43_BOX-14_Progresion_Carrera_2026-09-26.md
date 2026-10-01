# BOX-14 — Progresión de carrera de boxeadores

**Fecha:** 2026-09-26\
**Estado:** regla crítica corregida; recorrido funcional y UI probados en aislado. La carrera larga del jugador y el playtest manual siguen pendientes.\
**Alcance:** licencia, búsqueda de rival, programación, simulación/resolución, récord, pago, cooldown, lesión, cupos y pase amateur→profesional. No se rediseñó el balance ni se cambió la cadencia de peleas.

## Auditoría de raíz

El Diseño de Juego Canónico especifica que las 50 peleas amateurs habilitan una oferta: el jugador puede aceptarla o mantener al pugil amateur. El cierre semanal, sin embargo, trasladaba automáticamente a todo boxeador con 50 peleas si quedaba cupo profesional. Era un cambio de carrera irreversible sin decisión del jugador y contradecía el contrato canónico.

El motor ya limitaba amateur/profesional a 10 por circuito y ya condicionaba rival por experiencia del circuito activo (±3). También había protecciones contra licenciar sin prácticas/curso/dinero, pactar con licencia ausente, pelea pendiente, lesión, energía menor de 70 o cooldown. Los resultados eliminaban la pelea pendiente para impedir doble liquidación. Sin embargo, las pruebas estaban repartidas en escenarios aislados y no recorrían licencia → rival → pelea → pago/record → cooldown como una sola historia.

## Cambios aplicados

- Se eliminó la promoción automática al cerrar el domingo.
- Se añadió `puedeProfesionalizar`, selector central del dominio que valida rol/circuito, 50 peleas amateurs, ausencia de cartelera propia y plaza profesional libre.
- El comando `PROMOVER_PRO` revalida esos requisitos en el reducer: los controles de la UI no son autoridad de dominio.
- La ficha del pugil muestra el progreso y, a las 50 peleas, ofrece **Aceptar pase profesional**. No pulsar el botón conserva al boxeador amateur. Si hay cartelera o el cupo pro está lleno, la decisión queda bloqueada con el motivo explícito. El plantel destaca el pase cuando se puede aceptar.
- El cambio de circuito conserva récord y cantidad de peleas amateur. Doble ejecución, pelea pendiente o cupo completo no permiten exceder 10 profesionales.
- Se añadieron pruebas de transferencia de campeón al Salón de la Fama con récord/títulos conservados y sin duplicación. No se alteró la regla actual de elegibilidad del Salón.
- Actualicé el plan y el contrato técnico/QA canónico para que esta regla no vuelva a implementarse como transición automática.

## Gates

- `npm run verify`: **PASS**, TypeScript, build, auditoría estructural sin errores/advertencias; pruebas unitarias subieron a **73/73**.
- `python scratch/test_box14_career.py`: **PASS**. Dos recorridos de navegador aislados: aceptar el pase preservando trayectoria; cupo de 10 profesionales bloquea y explica el motivo.
- Prueba de reglas integrada: alumno con diez guanteos → licencia amateur → tres ofertas del circuito correcto y experiencia de debut compatible → simulación de combate completa → resolver una sola vez → récord/estadística/historial/bolsa/cooldown actualizados → nueva búsqueda bloqueada hasta la semana indicada.
- Prueba de transición: cumplir 50 no cambia circuito; pase explícito conserva los datos; cupo lleno, pelea pendiente y segundo intento se bloquean.
- Campaña automatizada de **50 combates amateurs reales del simulador durante 100 semanas**: el récord y la cuenta del circuito llegan a 50, el descanso/cooldown permite retomar en el intervalo configurado, y el pase profesional sigue esperando la decisión del jugador.
- Las pruebas no usaron ni avanzaron la partida real. El servidor local permanece activo.

## Límites y pendientes concretos

- El historial global de resultados recientes está limitado a 12; el récord y contadores de trayectoria sí sobreviven, pero no hay libro biográfico completo por pugilista. Debe decidirse si la carrera requiere historial ilimitado/archivado antes de producir más contenido histórico.
- No está implementado el nacimiento/retiro autónomo de rivales de la ciudad, ni declive por edad; no queda certificado como sistema de población de largo plazo.
- El Salón de la Fama actual se alimenta al transferir/retirar boxeadores con criterios existentes (título alto, 15 victorias o 10 KO). Esta fase prueba conservación/idempotencia, no valida si esos umbrales son los definitivos.
- La campaña sintética de 50 combates no reemplaza un playtest humano ni valida todos los casos de títulos/retiradas repetidos durante varios años.
- El build mantiene el aviso informativo de Vite por bundle JS minificado superior a 500 kB; el presupuesto establecido sigue dentro de su límite configurado.

## Dictamen

**BOX-14 pasa el gate automatizado de carrera inicial, integridad de resultado/cooldown y decisión amateur-profesional.** No significa que se haya completado la simulación de población histórica ni la campaña de largo plazo. El siguiente paso del plan es revisar esas dependencias y la persistencia/historia de carrera antes de declarar listo el candidato al playtest final.
