# Gate R2 — Tiempo, salud y combate

Fecha: 2026-10-01. Proyecto: La Vida del Boxeo · MadArt Studios.

## Resultado y alcance

R2 implementado y verificado para A03, A04, A05, A06, A07, A09, A14, A15, A16, A17 y A22. No equivale a certificar todo el juego ni a cerrar la auditoría integral.

Base versionada: `ec2b72dda7bac0434bd37ce8cf6d9a7c5299d38c`, rama `feature/audit-hardening`. Trabajo local en `workspaces/phase-audit-hardening`. No se hizo commit, push ni despliegue en esta fase. La publicación anterior sigue siendo R1.

La partida del propietario y su navegador en localhost:3000 no se usaron para probar. Tests con fixtures y almacenamiento en memoria; navegador Chromium descartable en puertos 5231 y 5232.

## Estado por hallazgo

| Hallazgo | Estado | Evidencia principal |
|---|---|---|
| A03 · Cartelera saltada | Verificado | Avance normal y rápido, días 1/5/6, varias peleas, representante, cancelar y recargar. |
| A04 · Sábado repetido | Verificado | Guanteo y entradas una sola vez, incluso tras recargar sábado. |
| A05 · Puntos versus sesiones | Verificado | 0/9/10/11 sesiones, licencia por contador real, continuar después de diez. |
| A06 · Disponibilidad médica | Verificado | Lesión, descanso, espera, energía, recuperación, compañero y cartelera del día. |
| A07 · Rival del DT | Verificado | Dos peleas en orden invertido; contratación, alta posterior, 35/69/70 y lesión. |
| A09 · Crecimiento negativo | Verificado | Debajo/en/sobre techo; entrenamiento, descanso mental y guanteo. |
| A14 · Caller como autoridad | Verificado | Resultados incompletos, alterados o de otra sesión rechazados; legado revalidado. |
| A15 · Caídas y simetría | Verificado | Caídas sufridas restan mérito; lados invertidos, doble caída e igualdad 10–10. |
| A16 · Consenso de jueces | Verificado | 3–0, 2–1, 2–0, 1–1 en ambos lados; roundtrip de decisión mayoritaria. |
| A17 · Cola, finalización y recarga | Verificado | Última caída reproducida en navegador, snapshots, simulación parcial y checkpoint determinista. |
| A22 · Relojes y vencimientos | Verificado | Fecha civil en avances normales/rápidos, meses/años, TTL viernes→sábado y comando vencido. |

## Reproducción, causa y solución

### A03 — Semana rápida salta peleas pendientes

- Antes: desde viernes, la ruta rápida procesaba sábado y domingo sin detenerse ante la pelea. El comando directo también podía saltar la guarda visual.
- Causa: dos rutas de avance y una comprobación limitada al estado inicial del sábado.
- Solución: `avanzarDia` como transición compartida; `peleasVencidas` como selector de obligaciones actuales/vencidas. El reducer bloquea avance y cierre de semana hasta resolver o cancelar. El representante agenda antes del guanteo, por lo que su nueva pelea también detiene la ruta rápida.
- UI: barra superior y atajo consultan el selector; el combate mostrado prioriza la sesión activa. Una pelea de la semana siguiente no bloquea el sábado actual.
- Tests: cartelera múltiple, recarga, cancelación parcial/total, comando normal, rápido y alta automática. RED original: llegaba al día 7. GREEN: se detiene en día 6, sin balance.

### A04 — Sábado puede procesarse dos veces

- Antes: activar Semana rápida estando ya en sábado repetía `diaSabado`.
- Causa: la ruta rápida reconstruía el sábado aunque ya estaba procesado.
- Solución: efectos al entrar en el día, no al solicitar un recorrido. La fecha guardada conserva la etapa procesada.
- Tests: sábado guardado/recargado; guanteos, contador de veladas y línea de entradas permanecen únicos. RED original: sumaba otra sesión. GREEN: no vuelve a procesar.

### A05 — Licencia por diez sesiones reales

- Antes: siete sesiones podían alcanzar diez puntos, que el dominio aceptaba como diez guanteos.
- Causa: `fogueo` aleatorio era autoridad de licencia y se mostraba como sesiones.
- Solución: `guanteosRealizados >= 10` en selector, comando, ficha, plantel y guía. Cada participación suma una sesión; el contador sigue después de diez y después de licenciar.
- Compatibilidad: `fogueo`/`fogueoMeta` siguen existiendo para no destruir datos heredados, pero no habilitan licencias ni se presentan como sesiones reales. No se revoca una licencia existente al cargar.
- Tests: 0/9/10/11, alumno con puntos heredados y siete sesiones, alumno que decide esperar, amateur y profesional que continúan. RED original: admitía siete. GREEN: necesita diez reales.

### A06 — Salud, descanso y compañero

- Antes: un lesionado participaba automáticamente y perdía energía.
- Causa: se filtraba solo espera/energía, sin lesión, descanso, recuperación médica ni combate del día.
- Solución: selector `puedeGuantear`, con disponibilidad individual y compañero disponible. Excluye lesión, enfoque descanso, espera, energía menor de 20, recuperación médica pendiente y pelea obligatoria propia de esa fecha. El calendario automático se define antes de seleccionar participantes.
- Tests: siete causas de bloqueo y retorno después de recuperación. RED original: lesión obtenía progreso. GREEN: no suma sesión ni consume energía. La ubicación visual del gimnasio contempla lesión sin rediseñar la pantalla.

### A07 — Recomendación individual del DT

- Antes: el segundo púgil utilizaba el rival de `pendientes[0]`. Ficha y DT discrepaban también en descanso.
- Causa: rival global y dos umbrales médicos.
- Solución: `enfoqueRecomendado(p, estado)` busca su propia pelea y delega en un consejo común: lesión o energía inferior a 70 priorizan descanso. Se usa al contratar, incorporar, entrenar y mostrar la ficha.
- Tests: rivales diferentes, arrays invertidos, sin rival, contratación inmediata y alta posterior; energía 35/69/70, lesión y recuperación. RED original: recomendación dependía del orden. GREEN: cada púgil conserva su recomendación individual.

### A09 — Entrenar no reduce atributos heredados

- Antes: potencia 60/talento 35 podía terminar en 38.
- Causa: aplicar el techo al valor total bajaba capacidades ya superiores al techo.
- Solución: `crecerAtributo` permite solo crecimiento no negativo; preserva el valor heredado y detiene crecimiento por encima del límite. Misma operación para guanteo y descanso mental. La notificación de subida usa el delta aplicado, no una ganancia teórica descartada por el techo.
- Tests: 37/38/60 con techo 38, potencia, técnica, defensa y mentalidad. RED original: 60→38. GREEN: 60 permanece 60. No se añadió declive ni se reescribieron atributos al cargar.

### A14 — Autoridad de resultado y legado

- Antes: un resultado incompleto o alterado podía pagar y modificar récord; LEGADO no revalidaba su requisito.
- Causa: payload de UI aceptado como prueba de combate y requisito delegado al botón.
- Solución: el motor emite un comprobante en memoria únicamente para resultados completos. El reducer verifica identidad, fecha exacta, pendiente, rival, circuito, división/género, salud y recuperación actuales, bolsa/fama/título inalterados y, si existe, la sesión activa exacta. No basta copiar el payload. Tras resolver, la pendiente desaparece y se limpia el checkpoint: no hay segundo cobro.
- LEGADO revalida la regla ya existente: título mundial o 85 de fama. No se rediseñó legado ni se añadió una regla de progresión nueva.
- Tests: resolución anticipada, otro púgil, rival modificado, salud/circuito incompatibles, título incorrecto, bolsa/fama alteradas, payload copiado, resultado incompleto y de una sesión rerolleada; doble resolución antes/después de reload. Caja, libro, historia, títulos y plantel permanecen iguales en rechazos.
- Cruce con A17: no se cambia el enfoque/élite del púgil activo ni se contrata el DT que cambiaría su preparación antes de terminar/cancelar. Una exhibición no consume energía del púgil de una sesión activa; puede usar otro disponible. Importes de la exhibición no se modificaron.

### A15 — Caídas sufridas y simetría

- Antes: sufrir una caída sumaba nueve puntos al mérito propio.
- Causa: `kdAsalto` cuenta caídas sufridas, pero se añadía como ventaja.
- Solución: resta nueve al mérito del lado caído. Se mantiene la penalización de tarjeta 8/7 existente, sin una reforma general de puntuación. Igualdad exacta sin sesgo produce 10–10, aprobada por el propietario.
- Tests: dominio A/B, una/dos caídas, caídas de ambos, igualdad y lados invertidos. La assertion de simetría incluye también igualdad; no se excluyó el caso para obtener verde. RED: el lado caído era favorecido y el empate daba 10–9 a A. GREEN: penalización y simetría.

### A16 — Nombre por consenso real

- Antes: un 2–1 del jugador se llamaba unánime; perder 0–3 se llamaba dividida.
- Causa: el nombre dependía del lado A en vez del consenso ganador.
- Solución: 3–0 unánime, 2–1 dividida, 2–0 mayoritaria, 1–1 empate, simétricos. La categoría mayoritaria fue aprobada explícitamente.
- Tests: mismos escenarios con ganador invertido y guardado/carga del nuevo método. RED: etiquetas incorrectas. GREEN: nombres por consenso y conservación exacta.

### A17 — Finalización, snapshots y reanudación

- Antes: la caída recuperable del último intercambio retiraba el último elemento de la cola; después del conteo, la cola vacía retornaba sin cerrar el asalto. Además, se simulaba todo el asalto antes de mostrar el primer golpe y la sesión solo vivía en un `ref` React.
- Reproducción de navegador: en el build base anterior, la espera de «Asalto 2 de 3» terminó en timeout. En el corregido, una caída recuperable dirigida con semilla 72 en el tercer intercambio alcanza la siguiente esquina.
- Solución de ejecución: contadores de intercambios/asaltos cerrados, cierre idempotente, simulación incremental y snapshot independiente por golpe. Cola vacía puede significar fin de asalto; no significa esperar eternamente. Simular resto consume solo intercambios restantes.
- Reanudación aprobada: `combateActivo` conserva salud, energía, caídas, estadísticas, tarjetas, planes, asalto, intercambios, condiciones del combate y semilla del azar propio. Se emiten checkpoints al iniciar, simular intercambios, cerrar asaltos y finalizar. El stream del combate se restaura sin depender del azar global consumido por la interfaz.
- Al reabrir se vuelve a una pausa segura del mismo asalto, con el intercambio ya calculado conservado; no se repite, no cura, no se reinician tarjetas. Un resultado terminado pendiente de confirmar se vuelve a mostrar idéntico y se aplica una sola vez.
- Protección de datos: snapshot inválido/no finito/huérfano no se «repara» reiniciando salud. Se informa corrupción y se mantiene la recuperación/backup de R1. Un fallo de escritura no informa éxito.
- Tests: caída en intercambio 1/2/3, KO, TKO, agotamiento de ambos, final normal, snapshots, simulación parcial, continuación determinista tras roundtrip, final recargado, ceros, corrupción, almacenamiento lleno y resultados de otra sesión. Casos iniciales RED documentados; suite final GREEN.

### A22 — Un reloj civil

- Antes: semana 49 almacenaba año 2027 mientras la fecha visible seguía en 2026; un aviso de un día del viernes podía sobrevivir hasta el lunes.
- Causa: calendario manual de meses de cuatro semanas/años de 48; TTL descontado solo en días de gestión.
- Solución: transiciones usan `fechaDelJuego(semana, dia)`; metadatos mes/año y envejecimiento derivan del cruce civil. TTL baja por cada día civil, incluidos sábado, domingo y lunes. Se rechaza ejecutar un evento con plazo cero por comando directo.
- Compatibilidad: no se reescriben campos válidos durante la carga. Metadatos temporales heredados se sincronizan en la siguiente transición; vistas de fecha ya usan la fecha civil. No se intenta deshacer retrospectivamente edades erróneas sin una fecha de nacimiento almacenada.
- Tests: semanas 4/8/9/12/48/52/53/109, avance normal/rápido y reload; cambio de año, febrero, fin de mes, vencimiento viernes→sábado y evento vencido. RED: año adelantado y TTL sin descuento. GREEN: fecha y transición civil coherentes.

## Decisiones y compatibilidad R1

Decisiones aprobadas expresamente por el propietario durante esta fase:

1. Añadir «Decisión Mayoritaria» para 2–0 con un juez empatado.
2. Puntuar 10–10 un mérito exactamente igual sin sesgo del juez.
3. Incluir reanudación del combate en R2, no dejarla como pendiente.
4. Recalibrar únicamente evidencia económica afectada por R2, después de comparar los seis escenarios, manteniendo assertions exactas y sin cambiar parámetros económicos.

Schema actual 6. Migración explícita 5→6: conserva campos existentes y añade `combateActivo: null` si no existía. Es idempotente. La subida de schema también impide que un lector antiguo descarte silenciosamente el nuevo método de decisión. No se cambiaron `storage.ts` ni `saveRepository.ts`: journal, backups, protección de futuros y política de ranuras siguen sus contratos R1.

Las fixtures históricas que representaban licencia deben contener diez sesiones reales; las que resolvían combate deben estar en su fecha y ejecutar un combate completo compatible. La fixture R1 de legado ahora cumple 85 de fama y añade una comprobación de cambio de identidad. No se eliminaron tests ni se debilitaron sus assertions funcionales.

## Comparación de calibración económica autorizada

Los números son evidencia de los mismos seis escenarios deterministas, no precios ni recompensas nuevas. Quitar tiradas de puntos de guanteo, corregir participantes y transiciones cambia la trayectoria del azar y sus resultados derivados. No se tocaron catálogos, tasas de interés, salarios, precios ni fórmulas de ingreso.

Cada celda muestra `antes → después`. Las assertions siguen siendo `toEqual` con valores exactos.

| Escenario | Caja semana 12 | Mínimo hasta 12 | Caja semana 52 | Mínimo hasta 52 |
|---|---:|---:|---:|---:|
| base | 600 → 546 | 570 → 546 | 1800 → 1584 | 570 → 534 |
| recaudacion | 1783 → 1703 | 800 → 800 | 5963 → 5971 | 800 → 800 |
| plantel_lleno_recaudacion | 3037 → 3268 | 800 → 800 | 9794 → 10170 | 800 → 800 |
| nomina_temprana | −2450 → −1979 | −2450 → −1979 | −10842 → −10299 | −10842 → −10299 |
| entrenador_recaudacion | 133 → −180 | 94 → −180 | −4951 → −6076 | −4951 → −6076 |
| entrenador_bingo | 1295 → 1288 | 688 → 587 | 3831 → 3156 | 688 → 587 |

La pérdida de algunos escenarios sigue visible: no se forzó rentabilidad para pasar la suite. El balance económico y su evaluación de diseño siguen siendo R3, no un trabajo realizado aquí.

## Verificación ejecutada

| Control | Resultado |
|---|---|
| Tests R2 nuevos (`src/game/r2.test.ts`) | 96 aprobados |
| Regresión R1 (`src/game/r1.test.ts`) | 60 aprobados |
| Regresión histórica (`src/game/game.test.ts`) | 73 aprobados |
| Total final | 229/229; 3 archivos de tests aprobados |
| `npm run typecheck` | Aprobado |
| `npm run build` | Aprobado; 408 módulos |
| `npm run check:budget` | JS 515.9/560 KiB; CSS 80.7/90 KiB |
| `node audit_engine.js` | 0 errores, 0 advertencias estructurales |
| `npm run verify` | Exit 0; ejecuta los controles anteriores |
| `git diff --check` | Sin errores de whitespace; Git avisa sobre normalización LF/CRLF |

Vite mantiene el aviso de chunk JS mayor de 500 kB. No se silenció ni se cambió el presupuesto para obtener verde; modularización de bundle queda fuera de R2.

### Navegador reproducible

`scratch/test_r2_combat.py`, Chromium headless, perfiles nuevos, origen 127.0.0.1:5232. En 1280×720 y 1440×900:

- Recarga después del primer intercambio preserva checkpoint y no repite golpes ni restaura salud.
- Semilla 72 provoca caída recuperable del tercer intercambio y llega al asalto 2.
- Recarga de esquina conserva salud, energía, caídas, estadísticas, tarjetas, asalto y semilla.
- Simular resto desde ejecución parcial llega al resultado.
- Recargar el resultado sin confirmar vuelve a mostrar el mismo checkpoint final.
- Confirmar aplica un solo combate, un historial y un récord; limpia sesión y pendiente. Recarga posterior conserva el estado completo.
- Sin errores JavaScript de página en ambos recorridos.

`scratch/test_r1_persistence.py`, origen 127.0.0.1:5231: pase profesional y baja no legendaria con archivo histórico accesible en ambas resoluciones; almacenamiento lleno, denegado y schema futuro con avisos y sin sustitución de la partida. Cinco grupos aprobados.

Los tiempos de animación se aceleran solo en QA. No se acelera el calendario ni se cambia lógica del motor para hacer pasar el navegador.

### Repetir las comprobaciones

Desde `E:/AI Factory/projects/la-vida-del-boxeo/workspaces/phase-audit-hardening`:

```powershell
npx vitest run src/game/r2.test.ts
npx vitest run src/game/r1.test.ts
npx vitest run src/game/game.test.ts
npm run verify
git diff --check
$env:PYTHONIOENCODING = 'utf-8'
python scratch/test_r2_combat.py
python scratch/test_r1_persistence.py
```

Los scripts requieren Python con Playwright/Chromium, disponible en el entorno usado. El de R1 regenera sus capturas QA; no son partidas del propietario.

## Archivos y revisión del diff

Producción:

- `src/game/engine.ts`: selectores, crecimiento, comprobantes, puntuación, pasos del combate y RNG de sesión.
- `src/game/state.tsx`: avance temporal único, participación, licencia, checkpoint, resolución y guardas relacionadas.
- `src/game/random.ts`: fuente de azar temporal con restauración en `finally`.
- `src/game/types.ts`: método de decisión, estado activo y comando de checkpoint.
- `src/game/saveValidation.ts`: schema 6, migración y validación estricta del checkpoint.
- `src/App.tsx`: guía por sesiones reales, pelea activa y guarda del atajo.
- `src/components/TopBar.tsx`: guarda de dominio compartida.
- `src/components/BoxerSheet.tsx`: recomendación compartida y sesiones reales.
- `src/components/panels.tsx`: contador, ARIA y barra de sesiones, limitada visualmente al 100%.
- `src/components/GymView.tsx`: lesión contemplada en ubicación de recuperación.
- `src/components/FightScreen.tsx`: cierre independiente de cola, snapshots y reanudación.

Tests/documentación: `src/game/r2.test.ts` nuevo; fixtures/baselines aprobados en `game.test.ts` y fixture reforzada en `r1.test.ts`; `scratch/test_r2_combat.py` nuevo; este informe y `docs/context/ESTADO_LOCAL_R2.md`.

Revisión manual de los hunks de producción y tests: no cambios en `data.ts`, fórmulas económicas, CSS general, dependencias, infraestructura de publicación ni implementación R1 del repositorio de partidas. Los cambios en eventos son exclusivamente vencimiento y proteger la sesión activa frente a una exhibición; no expansión de contenido R3. Los cambios visuales son reflejo de invariantes R2, no trabajo de canvas R4.

## Límites y pendientes explícitos

- La reanudación conserva el estado de dominio del último checkpoint confirmado. No reconstruye el milisegundo del sonido/animación ni el conteo visual en curso; vuelve a una pausa segura sin resimular el intercambio. El desglose visual por asalto de la sesión React no se reconstruye retrospectivamente; las tarjetas acumuladas y estadísticas oficiales sí se conservan.
- Si el navegador deniega o llena almacenamiento, no puede prometerse persistencia de operaciones que no consiguió escribir. Se mantiene el aviso R1 y la última copia recuperable, sin falso éxito.
- El modelo existente almacena edad, no fecha de nacimiento. Se corrigió el reloj del incremento anual al año civil; cumpleaños individuales y reparación de edades históricas sin datos de nacimiento no se inventaron.
- La penalización 8/7 por caída es la regla histórica del prototipo. Este gate corrige el signo y la simetría; no certifica una equivalencia reglamentaria con todas las federaciones.
- Comprobantes son autoridad de ejecución local, no seguridad anti-cheat de servidor. Una futura economía online necesita validación del lado servidor; no está implementada aquí.
- Esta evidencia no garantiza ausencia de bugs en caminos no probados ni resuelve los otros gates. No quedan decisiones de diseño solicitadas sin respuesta en R2.

R3, R4, R5 y BOX-15 no se iniciaron. Próximo paso: revisión/aceptación del informe por el propietario y autorización explícita para el gate siguiente.
