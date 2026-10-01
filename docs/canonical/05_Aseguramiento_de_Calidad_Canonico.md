# Aseguramiento de Calidad Canónico

## Actualización R3 aprobada — 2026-10-01

R3: RED→GREEN por contrato; unicidad y compatibilidad legacy, schema7/originales/backups, regresiones R1/R2. Contratos titulares antiguos mantienen checkpoint/pago único; nuevos sin excepción. Seis escenarios12/52 exactos y deficitarios intactos; 120 semanas×3 semillas con conciliación y roundtrip. Navegador aislado5234 y regresiones5231/5232; nunca partida personal/3000. Evidencia final y límites en informe52; gate no certifica juego completo.


**Proyecto:** La Vida del Boxeo  
**Versión:** 1.0  
**Estado:** Contrato de calidad para cada cambio

## 1. Objetivo

### Gate R2 — tiempo, salud y combate; evidencia 2026-10-01

- [x] A03/A04: cartelera detiene avance normal/rápido; efectos de sábado únicos tras reload.
- [x] A05/A06/A07/A09: diez sesiones reales, salud/descanso/compañero, rival individual del DT y crecimiento no negativo.
- [x] A14/A15/A16: reducer valida resultado completo/sesión y legado; caídas penalizan, igualdad 10–10 y consenso simétrico.
- [x] A17: última caída recuperable termina asalto; snapshot y RNG reanudan dominio exactamente sin repetir golpes/cobros.
- [x] A22: fecha civil, envejecimiento anual y vencimientos incluidos fines de semana.
- [x] 102 R2 + 60 R1 + 73 históricos = 235 tests tras revisión PR #2; verify aprobado. Checkpoints semánticamente imposibles rechazados sin sobrescribir original/backup; finales UI/rápido/KO válidos preservados (informe 49). Baselines económicos exactos recalibrados con autorización, sin modificar parámetros.
- [x] Chromium aislado en dos resoluciones: recarga parcial/esquina/final y aplicación única. Compatibilidad y almacenamiento R1 preservados.

Informe 46 detalla red/green y límites; informe 47 mide GPU y tiempos. Reutilizar controles aprobados solo si código/fixtures/build/entorno relevante permanecen iguales. Pruebas afectadas durante cambios, verificación completa al cierre; no debilitar assertions. Comprobaciones independientes pueden correr en paralelo sin compartir artefactos mutables. R2 queda pendiente de aceptación del propietario; no certifica toda la auditoría ni inicia otros gates.

### Gate R1 — persistencia, contrato vigente 2026-10-01

- [x] Promoción profesional/debut: guardar→cargar no traslada estadísticas amateur.
- [x] Ceros/falsos, arrays vacíos, orden, resumen/libros y campos válidos sobreviven exactamente.
- [x] Baja competitiva con ficha archivada independiente del Salón, accesible tras recargar.
- [x] Corrupción localizada diagnostica y conserva elementos sanos; originales protegidos antes de escribir.
- [x] Duplicados idénticos, conflictivos, huérfanas, arrays/tipos inválidos y no finitos tienen tratamiento explícito.
- [x] Migraciones por versión deterministas/idempotentes; futuro incompatible no se sobrescribe.
- [x] Autosave/manual fallido, cuota/denegación, interrupción/readback, backup/journal corruptos y cinco/seis ranuras probados.
- [x] Memoria fallback no anuncia guardado durable; fallo visible y reintento operativo.
- [x] 840 roundtrips en 120 semanas; 60 tests R1 + 73 originales; `npm run verify` PASS, 133/133.
- [x] Chromium aislado 1280×720/1440×900: archivo accesible y fallos full/denied/future veraces.

Evidencia y límites: `docs/audits/45_Gate_R1_Partidas_Carrera_2026-10-01.md`. No certifica multi-tab ni recupera historia previamente descartada. No habilita BOX-15 ni cierra R2–R5. No probar sobre la partida real. Conservar assertions existentes y exigir fallo reproducido antes de corrección.

Evitar regresiones, reglas contradictorias, partidas rotas, pantallas cortadas, vocabulario confuso y errores que solo aparecen después de muchas semanas. La calidad se demuestra con evidencia, no con una inspección superficial.

## 2. Severidades

- **P0 — bloqueante:** rompe una partida, permite una regla inválida, borra progreso o impide continuar.
- **P1 — crítico:** sistema central incompleto, contradicción de diseño o pantalla esencial inutilizable.
- **P2 — importante:** confusión, riesgo de regresión, balance defectuoso o inconsistencia visible.
- **P3 — pulido:** detalle visual, texto menor o mejora no bloqueante.

No se cierra una versión con P0 abierto. El criterio para P1 debe quedar explícito antes del playtest.

## 3. Pirámide de pruebas

```text
                 Playtest humano
              E2E y regresión visual
          Integración y persistencia
       Reducer / comandos / invariantes
             Unitarias de dominio
```

Cada nivel cubre un riesgo distinto. Un test de motor no reemplaza una revisión de canvas y una captura visual no reemplaza una prueba de migración.

## 4. Checklist por cambio

### Antes de programar

- [ ] El pedido está escrito en términos observables.
- [ ] Se identificó la fuente de verdad.
- [ ] Se revisaron los cinco documentos canónicos.
- [ ] Se definió severidad.
- [ ] Se identificaron persistencia, economía, UI, traducción y calendario afectados.
- [ ] Existe criterio de aceptación.

### Durante la implementación

- [ ] No se duplicó una regla existente.
- [ ] Se agregó o actualizó un tipo estable.
- [ ] Se usaron IDs, no textos visibles como lógica.
- [ ] Se agregó migración si cambia el estado persistido.
- [ ] Se agregó texto traducible.
- [ ] Se registró el movimiento económico si corresponde.
- [ ] Se contemplaron estados vacío, bloqueado, máximo y error.

### Antes de cerrar

- [ ] `npm run typecheck` pasa.
- [ ] `npm test -- --run` pasa.
- [ ] `npm run build` pasa.
- [ ] auditoría estructural pasa.
- [ ] `git diff --check` pasa.
- [ ] pruebas visuales en resoluciones objetivo pasan.
- [ ] la partida se guarda y carga.
- [ ] la traducción no deja claves faltantes.
- [ ] el documento canónico fue actualizado.
- [ ] el commit describe el cambio.

## 5. Invariantes del dominio

Siempre deben cumplirse:

1. Un alumno en espera no entrena ni suma guanteos.
2. Un pugil sin licencia no compite oficialmente.
3. Un pugil lesionado o con energía insuficiente no puede pactar pelea.
4. Una pelea pendiente no puede duplicarse.
5. Transferir no borra historia.
6. El cupo amateur y profesional no se supera.
7. El saldo y el libro contable coinciden.
8. Un evento vencido no se puede cobrar.
9. Una recompensa cobrada no vuelve a cobrarse.
10. El ranking no altera records.
11. Un idioma no altera reglas ni valores.
12. Una partida anterior puede migrarse o rechazarse con diagnóstico, nunca romperse silenciosamente.

## 6. Matriz de pruebas funcionales

### Inicio

- crear partida con nombres cortos y largos;
- elegir emblema;
- continuar partida;
- guardar en ranura;
- reiniciar sin perder otra partida.

### Alumnos

- cupo normal;
- lista de espera;
- retiro y liberación de plaza;
- recreativo sin ficha competitiva;
- guanteo 0/10, 9/10, 10/10 y más de 10;
- licencia sin curso;
- licencia sin dinero;
- licencia con cupo amateur lleno.

### Entrenamiento

- enfoque manual;
- Director Técnico contratado;
- asignación inmediata;
- lesión y descanso;
- energía menor a 70;
- cambio de enfoque con rival;
- descanso automático y retorno al enfoque.

### Peleas

- rival debutante ±3 peleas;
- rival parejo;
- rival desafío;
- energía baja;
- lesión;
- cooldown;
- cancelación;
- resultado, record, bolsa, fama, seguidores y lesión posterior.

### Economía

- cuotas;
- recreativos;
- sueldo;
- compra;
- sponsor;
- actividad social;
- comisión de reparación;
- entrevista;
- colecta;
- caja negativa;
- balance y libro.

### Carrera larga

- 50 peleas amateurs;
- aceptar o postergar profesionalismo;
- verificar que el umbral no cambie el circuito automáticamente y que el pase explícito preserve récord y contadores;
- diez profesionales;
- título nacional, regional y mundial;
- retiro;
- Salón de la Fama;
- nacimiento/retiro futuro de rivales.

## 7. Pruebas de persistencia

Crear fixtures para:

- versión mínima;
- versión actual;
- campos ausentes;
- arrays corruptos;
- dinero negativo;
- eventos vencidos;
- pugiles sin record;
- nombres con caracteres especiales;
- partida grande;
- partida con múltiples clubes futuros.

Cada fixture debe verificarse antes y después de migrar. Se debe comprobar que el jugador conserva identidad, progreso, economía, record, títulos y configuración.

## 8. Pruebas visuales

Cada pantalla se captura en:

- 1280×720;
- 1366×768;
- 1024×768;
- ventana no maximizada;
- zoom 125%;
- idioma expandido;
- estado mínimo;
- estado máximo.

Se revisa:

- superposición;
- texto cortado;
- botón fuera del panel;
- acción esencial invisible;
- modal sin cierre;
- columnas que cambian de altura;
- panel del club saturado;
- scroll inesperado;
- foco de teclado;
- contraste.

## 9. Pruebas de internacionalización

- inventario de claves faltantes;
- pseudo-localización +40%;
- inglés;
- portugués brasileño;
- pluralización;
- género;
- moneda;
- fechas;
- nombres largos;
- tooltips y errores;
- fallback al español.

Una traducción incompleta es un defecto de calidad, aunque el motor funcione.

## 10. Simulación prolongada

Ejecutar 120 semanas con varias semillas o escenarios:

- gestión conservadora;
- inversión agresiva;
- caja negativa;
- muchas derrotas;
- muchas victorias;
- plantel lleno;
- múltiples lesiones;
- contratación de personal;
- sucursales;
- sponsors y eventos;
- promoción profesional;
- retiro y Salón de la Fama.

La simulación verifica que no existan excepciones, crecimiento infinito, dinero infinito no explicado, records imposibles, fechas inválidas o listas sin límite.

## 11. Auditoría de regresión

Antes de cada release:

1. comparar cambios de estado;
2. ejecutar la suite completa;
3. ejecutar fixtures de migración;
4. ejecutar auditoría estructural;
5. construir producción;
6. revisar cuatro pantallas visuales críticas;
7. revisar consola;
8. iniciar, guardar, recargar y continuar una partida;
9. revisar documentos canónicos;
10. registrar versión y evidencia.

## 12. Observabilidad

En desarrollo, cada fallo debe reportar:

- comando;
- semana/día;
- entidad;
- estado previo resumido;
- motivo;
- estado posterior;
- versión de schema.

Los logs no deben incluir información sensible. La producción debe mostrar un mensaje amigable y ofrecer recuperación.

## 13. Criterio de aceptación

Una solución queda aceptada solo cuando:

- reproduce el problema original;
- demuestra la corrección;
- no rompe invariantes;
- pasa las pruebas automáticas;
- pasa revisión visual si tiene UI;
- pasa migración si toca estado;
- pasa traducción si agrega texto;
- queda documentada;
- tiene una evidencia reproducible.

## 14. Política de cierre

No se declara “funciona end-to-end” por una sola partida corta. Se necesita motor, persistencia, visual, traducción, simulación larga y playtest humano. Si aparece un fallo, se reabre la auditoría especializada correspondiente y luego la integración; no se tapa con un parche aislado.

## 15. Regla universal para cualquier proyecto

Esta metodología es reutilizable fuera de este juego:

```text
idea → diseño canónico → contrato técnico → dirección visual
     → plan ejecutable → QA con evidencia → release
```

Toda modificación futura debe declarar qué documento afecta y actualizarlo si cambia una decisión de producto, una regla técnica, un criterio visual, un plazo o un requisito de calidad.

## 16. Contrato obligatorio de pulido pre-playtest

La matriz vinculante por pestaña, presupuesto del canvas, simetría, densidad, resoluciones, evidencia y gates previos al playtest está en:

`docs/plans/Contrato_Pulido_Pre_Playtest_y_Matriz_de_Canvas.md`

Debe leerse y aplicarse junto con esta pirámide de QA. Una captura aislada no demuestra que se pase en otras resoluciones o estados. No se llena espacio con información repetida ni se considera terminado un layout por evitar solamente el recorte. Se exige que las pestañas pasen sus estados mínimo, normal y máximo y que se registren las combinaciones verificadas. El playtest del propietario se habilita solo después de que la matriz integral esté en PASS y no queden P0/P1 ni P2 que contradigan requisitos aprobados.

## 17. Evidencia de implementación vigente

Al 2026-09-23, `npm run verify` pasa con 36/36 tests, build y límites de bundle aprobados, y auditoría estructural 0 errores/0 advertencias. La evidencia visual más reciente cubre únicamente 970×910 CSS px. Los hallazgos corregidos y la lista explícita de tamaños/estados aún no verificados están en `docs/audits/24_Implementacion_Canvas_Densidad_y_Alta_Automatica_2026-09-23.md`. No habilitar playtest humano hasta completar la matriz multi-viewport y los gates de lógica, persistencia, localización, economía, accesibilidad y E2E del plan vigente.

### Reconciliación económica — gate de prototipo (2026-09-23)

- [x] Las transacciones de caja quedan en un libro semanal persistido.
- [x] Compra/inversión de actividad aparece una vez como gasto; su liquidación dominical aparece como ingreso.
- [x] Bolsa y neto de velada del sábado sobreviven al resumen semanal y no vuelven a aplicarse a la caja.
- [x] Guardar/recargar entre semana conserva el libro sin duplicar movimientos.
- [x] Tras liquidar el domingo, `resumen.total = ingresos − gastos = saldo final − saldo al inicio del período contabilizado`.
- [x] El libro activo se vacía al abrir una semana nueva.
- [x] La migración desde esquemas previos conserva saldo/progreso y descarta solo líneas ambiguas que no se podían atribuir a una semana fiable.
- [x] Prueba larga: 120 cierres semanales consecutivos satisfacen la identidad de conciliación.

Evidencia actualizada: `npm run verify`, 42/42 tests, build y auditoría estructural PASS. La proyección del domingo continúa siendo una estimación (los eventos tienen liquidación variable) y debe presentarse como previsión, no como importe garantizado. Esta aprobación cubre contabilidad semanal local del prototipo, no una contabilidad multi-sede futura ni todo el gate general de economía.

### Seguimiento económico y eventos — gates 25–27 (2026-09-23)

- [x] El evento recién generado mantiene todo su plazo en el primer día en que se muestra.
- [x] La deuda de emergencia se limita en el reducer a caja menor de $300 y una deuda activa como máximo.
- [x] El desembolso se concilia en caja, no se confunde con dinero operativo ganado y se amortiza en diez cuotas de $60.
- [x] La progresión semanal de seguidores está acotada a +90/−60 mientras converge al objetivo por fama/resultados.
- [x] Las cuatro actividades sociales verifican inversión, rango del retorno y conciliación del saldo al domingo.
- [x] Calibrar y congelar provisionalmente curvas deterministas de caja a semanas 12 y 52 para seis escenarios semilla; impedir cambios silenciosos mediante aserciones exactas.
- [x] Limitar el costo semanal por caja negativa a $50, con la misma fórmula en proyección y liquidación; probar mínimo y máximo.
- [x] Simular recuperación leve con saldo −$143, préstamo único, recaudación financiable y amortización completa en 12 semanas.
- [x] Aprobar e implementar la política E de insolvencia severa: advertencia informada de flujo recurrente antes de contratar; cierre voluntario confirmado bajo −$1.500 y reconstrucción sin rescate de efectivo.
- [x] Probar umbral exacto, rechazo sin confirmación, historial preservado y reinicio de activos/bonificaciones de legado; verificar que el autosave conserva el identificador de la partida.
- [ ] Probar visualmente el modal de cierre y el flujo de nómina en viewports estrechos/amplios; todavía no hay evidencia manual de esas vistas en este gate.
- [ ] Añadir incertidumbre/riesgo real a las recaudaciones y establecer objetivos de caja aprobados por producto; hoy todas devuelven más que su inversión.

Evidencia: `docs/audits/25_Gate_Calendario_Eventos_2026-09-23.md` a `docs/audits/30_Gate_Politica_Insolvencia_y_Cierre_2026-09-23.md`. Gate 27 fija seis curvas semilla a 12/52 semanas; Gate 28 limita el costo financiero a $50 y verifica recuperación leve; Gate 30 implementa prevención y reconstrucción para insolvencia severa. Última verificación de código: `npm run verify` **PASS**, 53/53 tests, TypeScript, build, presupuesto de bundle y auditoría estructural (0 errores/0 advertencias). Las recaudaciones siguen sin riesgo y los gates visuales/E2E y la verificación manual del cierre continúan abiertos; no habilita todavía el playtest final.
