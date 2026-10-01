# Checklist inteligente de verificación y auditorías

## La Vida del Boxeo · Criterios de avance y control de calidad

**Fecha:** 23 de septiembre de 2026  
**Regla principal:** un punto no se marca como terminado porque el código compile. Se marca como terminado únicamente cuando pasa lógica, persistencia, interfaz, texto, accesibilidad, regresión y playtest.

---

## 1. Regla de avance

Cada hallazgo debe tener una ficha con:

- ID del hallazgo;
- prioridad;
- hipótesis del problema;
- solución implementada;
- test automatizado;
- playtest reproducible;
- validación visual;
- validación de traducción;
- evidencia;
- fecha y commit;
- resultado;
- riesgos restantes.

### Estados permitidos

| Estado | Significado |
|---|---|
| 🔴 Bloqueado | Falla o no tiene evidencia suficiente |
| 🟡 En prueba | Implementado, pero falta una validación |
| 🟢 Verificado | Todas las pruebas pasan y no hay regresión |
| 🔵 Aceptado | Verificado y aprobado en playtest humano |

No se puede comenzar el siguiente bloque mientras exista un P0 o P1 en estado 🔴 o 🟡 dentro del bloque actual.

---

## 2. Tipos de prueba obligatorios

### T — Test de motor

Comprueba la regla pura sin depender de la pantalla. Debe probar resultado válido, resultado inválido, límites, datos faltantes y repetición.

### I — Test de integración

Comprueba una cadena real de acciones: estado inicial, acción del usuario, actualización, guardado, recarga y consecuencia posterior.

### V — Validación visual

Comprueba que todo lo importante sea visible, legible, alineado y accionable en las resoluciones acordadas, sin scroll.

### U — Test de UX

Comprueba que una persona pueda descubrir qué hacer, por qué puede o no puede hacerlo y cuál es el resultado esperado.

### L — Test lingüístico

Comprueba claves, traducción, pluralización, fechas, moneda, texto largo, fallback y ausencia de strings hardcodeados.

### R — Test de regresión

Repite flujos ya cerrados en una partida nueva, una partida antigua y una partida extensa.

### P — Playtest inteligente

No se limita a hacer clic. Intenta romper el sistema: spam de botones, acciones fuera de orden, fondos insuficientes, eventos vencidos, cambios de pestaña, recarga, zoom, idioma y semanas salteadas.

---

## 3. Checklist maestro por solución

### A. Integridad competitiva

#### A-01 — Cooldown entre peleas — P0

- [ ] `T-A01.1`: una pelea amateur fija la próxima semana permitida.
- [ ] `T-A01.2`: una pelea profesional fija la próxima semana permitida.
- [ ] `T-A01.3`: búsqueda manual bloqueada durante cooldown.
- [ ] `T-A01.4`: confirmación de oferta bloqueada aunque la oferta sea vieja.
- [ ] `T-A01.5`: representante automático respeta la misma regla.
- [ ] `T-A01.6`: lesión y cooldown muestran motivos distintos.
- [ ] `I-A01.1`: pelear → guardar → recargar → intentar otra pelea.
- [ ] `U-A01.1`: el jugador entiende cuándo vuelve a estar disponible.
- [ ] `V-A01.1`: el mensaje no se corta en ficha, cartelera ni calendario.
- [ ] `P-A01.1`: hacer spam de “buscar rival” no crea ofertas inválidas.

**Gate:** cero peleas inválidas en 100 intentos automatizados y 10 intentos manuales.

#### A-02 — Transferencia con pelea pendiente — P0

- [ ] `T-A02.1`: transferir sin pelea conserva record y libera cupo.
- [ ] `T-A02.2`: transferir con pelea bloquea o cancela según regla visible.
- [ ] `T-A02.3`: retirar con pelea no deja pendiente huérfano.
- [ ] `T-A02.4`: cobrar bolsa después de transferir no actualiza un atleta inexistente.
- [ ] `I-A02.1`: transferir → recargar → consultar historial.
- [ ] `U-A02.1`: “retirar” y “transferir” tienen consecuencias diferentes y comprensibles.
- [ ] `P-A02.1`: intentar transferir desde Plantel, Ficha y evento de ciudad.

**Gate:** ninguna entidad pendiente puede apuntar a un boxeador que ya no existe en el plantel.

#### A-03 — Títulos

- [ ] `T-A03.1`: requisitos leídos desde una única fuente.
- [ ] `T-A03.2`: nacional no aparece antes del mínimo configurado.
- [ ] `T-A03.3`: regional y mundial respetan peleas, victorias, ranking y KO.
- [ ] `U-A03.1`: el requisito se explica antes de aceptar.
- [ ] `V-A03.1`: nombres de títulos y requisitos caben en todas las vistas.
- [ ] `R-A03.1`: cambiar un requisito no deja valores antiguos en otra pantalla.

#### A-04 — Amateur a profesional

- [ ] `T-A04.1`: llegar a 50 peleas habilita una propuesta, no un salto silencioso.
- [ ] `T-A04.2`: aceptar cambia el circuito correctamente.
- [ ] `T-A04.3`: rechazar mantiene el circuito amateur.
- [ ] `I-A04.1`: aceptar/rechazar sobrevive a guardado y recarga.
- [ ] `U-A04.1`: se explican costo, riesgo, calendario y consecuencias.

---

### B. Carrera de alumnos y boxeadores

#### B-01 — Alumnos recreativos

- [ ] `T-B01.1`: un recreativo paga cuota y no aparece en ranking.
- [ ] `T-B01.2`: un recreativo no genera record ni pelea.
- [ ] `T-B01.3`: convertirlo a competitivo requiere una acción explícita.
- [ ] `I-B01.1`: cupo, cuotas, entrenamiento y conversión sobreviven a recarga.
- [ ] `U-B01.1`: el jugador distingue recreativo de competidor.

#### B-02 — Guanteos posteriores a licencia

- [ ] `T-B02.1`: 10/10 habilita licencia.
- [ ] `T-B02.2`: guanteos posteriores incrementan total histórico.
- [ ] `T-B02.3`: no vuelven a incrementar el requisito ya cumplido.
- [ ] `V-B02.1`: se ven requisito y total histórico por separado.
- [ ] `L-B02.1`: “guanteo”, “sparring” y plural se traducen correctamente.

#### B-03 — Lesiones y tratamientos

- [ ] `T-B03.1`: una lesión bloquea pelea cuando corresponde.
- [ ] `T-B03.2`: tratamiento modifica duración y costo de forma verificable.
- [ ] `T-B03.3`: energía, salud y lesión nunca producen estados imposibles.
- [ ] `I-B03.1`: lesión → contratar tratamiento → avanzar días → recuperar.
- [ ] `U-B03.1`: el jugador entiende el riesgo y la decisión médica.
- [ ] `V-B03.1`: gravedad, semanas y acción caben sin cortar texto.

#### B-04 — Retiro y salón de la fama

- [ ] `T-B04.1`: retiro conserva record, títulos y estadísticas.
- [ ] `T-B04.2`: solo los criterios definidos ingresan al salón de la fama.
- [ ] `T-B04.3`: transferido no aparece como retirado del jugador.
- [ ] `R-B04.1`: el ranking activo no duplica una leyenda histórica.

---

### C. Economía y eventos

#### C-01 — Libro contable único

- [ ] `T-C01.1`: cada ingreso tiene categoría y origen.
- [ ] `T-C01.2`: cada gasto tiene categoría y origen.
- [ ] `T-C01.3`: balance antes + movimientos = balance después.
- [ ] `T-C01.4`: repetir una acción no duplica el movimiento.
- [ ] `I-C01.1`: compra, cuota, sponsor, evento, pelea y sueldo aparecen en el mismo historial.
- [ ] `V-C01.1`: el concepto visible explica la operación en lenguaje simple.

#### C-02 — Resúmenes financieros

- [ ] `T-C02.1`: resumen diario coincide con movimientos del día.
- [ ] `T-C02.2`: resumen semanal coincide con libro contable.
- [ ] `T-C02.3`: mensual y anual suman semanas sin redondeos incorrectos.
- [ ] `U-C02.1`: el jugador identifica si está a favor o en pérdida.
- [ ] `P-C02.1`: caja positiva, cero y negativa.

#### C-03 — Eventos y patrocinio

- [ ] `T-C03.1`: evento vencido no puede cobrarse.
- [ ] `T-C03.2`: recompensa no se cobra dos veces.
- [ ] `T-C03.3`: sponsor nuevo no pisa sponsor activo sin confirmación.
- [ ] `T-C03.4`: frecuencia semanal/quincenal se respeta.
- [ ] `I-C03.1`: aceptar evento → guardar → recargar → intentar repetir.
- [ ] `P-C03.1`: abrir el mismo mensaje desde dos pestañas o rutas de UI.

#### C-04 — Caja negativa

- [ ] `T-C04.1`: interés y penalización son deterministas.
- [ ] `U-C04.1`: el jugador entiende cómo volver a caja positiva.
- [ ] `V-C04.1`: nunca se muestra “a favor” con resultado negativo.

---

### D. Persistencia

#### D-01 — Migraciones

- [ ] `T-D01.1`: cada versión antigua migra a la versión actual.
- [ ] `T-D01.2`: arrays faltantes se crean correctamente.
- [ ] `T-D01.3`: valores inválidos se reparan sin borrar progreso sano.
- [ ] `I-D01.1`: cargar partida antigua → jugar → guardar → recargar.
- [ ] `R-D01.1`: migrar dos veces no duplica datos.

#### D-02 — Guardado y ranuras

- [ ] `T-D02.1`: guardado automático ocurre en acciones seguras.
- [ ] `T-D02.2`: nombre, semana, fecha y saldo se muestran al continuar.
- [ ] `T-D02.3`: borrar una ranura no borra otra.
- [ ] `P-D02.1`: cerrar/recargar durante modal y durante transición de día.

---

### E. UI, UX y canvas

#### E-01 — Layout sin scroll

- [ ] `V-E01.1`: inicio en 1280×720.
- [ ] `V-E01.2`: gimnasio en 1280×720.
- [ ] `V-E01.3`: ciudad en 1280×720.
- [ ] `V-E01.4`: plantel y ficha técnica en 1280×720.
- [ ] `V-E01.5`: mercado, perfil, personal y panel en 1280×720.
- [ ] `V-E01.6`: repetir en 1024×768 y 1366×768.
- [ ] `V-E01.7`: repetir con ventana no maximizada.
- [ ] `V-E01.8`: repetir con zoom 110% y 125%.
- [ ] `P-E01.1`: nombres largos, números grandes, saldo negativo y texto traducido largo.

**Gate:** cero cortes de información esencial, solapamientos o botones inaccesibles.

#### E-02 — Modales

- [ ] `V-E02.1`: encabezado, cuerpo y pie visibles.
- [ ] `V-E02.2`: Escape y botón de cierre funcionan.
- [ ] `U-E02.1`: foco inicial y retorno de foco correctos.
- [ ] `P-E02.1`: contenido de longitud máxima y mínima.

#### E-03 — Atajos y accesibilidad

- [ ] `T-E03.1`: no se permiten teclas duplicadas.
- [ ] `U-E03.1`: los atajos no se activan dentro de inputs.
- [ ] `V-E03.1`: contraste y texto grande en todas las pestañas.
- [ ] `L-E03.1`: nombres accesibles de botones e iconos.

---

### F. Traducción e internacionalización

#### F-01 — Inventario de textos

- [ ] `T-F01.1`: búsqueda automática de strings visibles hardcodeados.
- [ ] `T-F01.2`: eventos, errores, tooltips y datos también están inventariados.
- [ ] `T-F01.3`: nombres propios quedan fuera del catálogo cuando corresponde.

#### F-02 — Catálogos y fallback

- [ ] `T-F02.1`: toda clave usada existe en español.
- [ ] `T-F02.2`: idioma faltante usa fallback controlado.
- [ ] `T-F02.3`: claves faltantes se detectan en desarrollo.
- [ ] `I-F02.1`: cambiar idioma no reinicia ni modifica la partida.

#### F-03 — Formato internacional

- [ ] `T-F03.1`: plural singular/múltiple.
- [ ] `T-F03.2`: género cuando el idioma lo exige.
- [ ] `T-F03.3`: moneda, miles, decimales y porcentajes.
- [ ] `T-F03.4`: días, meses y fechas.
- [ ] `T-F03.5`: record, rounds, KO y títulos.

#### F-04 — Pseudo-localización

- [ ] `V-F04.1`: expansión de 30–40% sin cortes.
- [ ] `V-F04.2`: caracteres acentuados y especiales.
- [ ] `P-F04.1`: botones, tarjetas, modales y panel lateral.

#### F-05 — Idiomas iniciales

- [ ] `L-F05.1`: español completo.
- [ ] `L-F05.2`: inglés completo.
- [ ] `L-F05.3`: portugués brasileño completo.
- [ ] `L-F05.4`: francés, italiano y alemán con fallback mientras estén en traducción.

---

## 4. Auditorías necesarias

No hace falta repetir auditorías indefinidamente ni realizar una auditoría genérica cada vez. Hace falta una secuencia de auditorías especializadas, con reauditoría obligatoria cuando aparece una regresión.

### Auditoría 1 — Línea base y trazabilidad

Inventario de hallazgos, fuente de verdad, dependencias, riesgo y criterio de aceptación. Produce el backlog congelado.

### Auditoría 2 — Motor y reglas

Verifica cooldowns, licencias, peleas, transferencias, títulos, lesiones, retiro y estados imposibles.

### Auditoría 3 — Carrera y progresión

Verifica alumnos recreativos, guanteos, amateur/profesional, ranking, rivales, generaciones y salón de la fama.

### Auditoría 4 — Economía y persistencia

Verifica libro contable, eventos, sponsors, caja negativa, migraciones, guardados y partidas antiguas.

### Auditoría 5 — UI, UX y accesibilidad

Verifica todas las pestañas, modales, resoluciones, zoom, teclado, contraste y ausencia de scroll.

### Auditoría 6 — Internacionalización

Verifica inventario de textos, catálogos, fallback, pluralización, fechas, monedas, pseudo-localización y traducciones.

### Auditoría 7 — Integración y playtest prolongado

Juega la carrera completa durante muchas semanas, incluyendo decisiones buenas, malas, repetidas, inválidas y fuera de orden.

### Auditoría 8 — Cierre y regresión final

Repite los casos críticos desde cero, con partidas antiguas, idiomas y resoluciones objetivo. Confirma que los fixes no hayan creado deuda nueva.

### ¿Cuántas auditorías son necesarias?

**Ocho auditorías especializadas son suficientes para el cierre inicial.** No significa que el trabajo tenga solo ocho revisiones: cada auditoría se repite hasta que su checklist esté completamente verde. Si un cambio de Bloque A rompe un punto de Bloque E, se abre una reauditoría focalizada; no se reinicia todo el proceso desde cero.

La regla práctica es:

```text
auditar → planificar → implementar → testear → playtestear → reauditar
```

El siguiente bloque comienza solamente cuando el bloque actual está en estado 🔵 Aceptado.

---

## 5. Evidencia mínima exigida

Cada bloque debe entregar:

- resultado de typecheck;
- resultado de tests unitarios;
- resultado de tests de integración;
- simulación prolongada cuando aplique;
- capturas de las resoluciones objetivo;
- capturas en idioma expandido;
- lista de casos fallidos y corregidos;
- commit o referencia exacta del cambio;
- fecha del último playtest;
- riesgos que todavía no bloquean el avance.

No se acepta “probado manualmente” sin indicar qué se hizo, con qué estado inicial, qué resultado se esperaba y qué resultado se obtuvo.

---

## 6. Criterio final de aprobación

El juego queda listo para la siguiente etapa cuando:

- todos los P0 y P1 están 🔵 Aceptados;
- todos los checklists críticos tienen evidencia;
- no hay regresiones en la partida extensa;
- ninguna pantalla corta información esencial;
- los textos visibles pasan pseudo-localización;
- español, inglés y portugués pasan los flujos completos;
- la economía coincide con el libro contable;
- las reglas competitivas no admiten estados inválidos;
- una partida vieja puede continuar sin perder progreso;
- el último playtest humano no encuentra bloqueos ni ambigüedades críticas.

## Veredicto

La cantidad recomendada es de **ocho auditorías principales**, con reauditorías focalizadas cada vez que un test falle o una implementación afecte otro bloque. La calidad se controla por gates: ninguna solución se considera completa hasta que su test inteligente, su playtest, su verificación visual y su regresión pasen juntos.
