# R3 — Plan de alcance: contenido y economía

Fecha: 2026-10-01. Estado: **alcance aprobado e implementado; entrega y aceptación pendientes de revisión del PR R3**. Las secciones de recomendaciones conservan el análisis previo; la autorización vigente es la sección 6.
Base exacta: `main`, `2c445d2169d2a04c869328a5374c9fa73a469095`.
Checkout aislado: `workspaces/r3-scope`, rama `feature/r3-content-economy`.

## 1. Contrato y evidencia

Entrada: auditoría 44, A08/A10/A11/A21/A24; canónicos 01–05 (diseño, técnica, arte, proyecto, QA). No se encontraron archivos AGENTS.md en los directorios ancestros consultados ni en el inventario del checkout. Los informes históricos describen sus fechas, no sustituyen el código actual.

R1/R2 integrados. Se reutilizan 235/235 tests y E2E R2 del informe 49 por igualdad comprobada de `src/`, package/lockfile entre checkout de diagnóstico y main. Esto NO prueba los cinco hallazgos de R3 ni cierra economía. No se repitió verify para redactar un documento.

Diagnóstico focalizado: módulos actuales cargados mediante Vite SSR en modo middleware, sin servidor HTTP, almacenamiento real ni navegador; fixtures sintéticas y semilla 1001, restaurada al finalizar. Ejecución ~0,58 s. Los valores observados abajo son diagnóstico, no assertions de aceptación futuras. GPU no aporta a estos cálculos CPU; se reserva para futuros controles gráficos afectados, en contextos aislados.

Prohibiciones: no cambios de producción/parámetros, no R4/R5/BOX-15, no merge/publicación, no partida personal ni localhost:3000. Pages permanece manual/confirmado/main. Este plan no cambia reglas por sí mismo.

## 2. Orden priorizado

| Orden | Hallazgo | Prioridad | Entrega propuesta |
|---|---|---|---|
| 1 | A10 | P1 | Eliminar oferta ordinaria con rival/bolsa titular heredados. |
| 2 | A21 | P1 | Cortar recompensas nuevas por el mismo progreso pasado, tras aprobar su política. |
| 3 | A08 | P1 | Aplicar efectos prometidos y demostrar el contrato de cada compra. |
| 4 | A11 | P1 | Cupos de personal coherentes entre UI/reducer y sin dependencia del orden. |
| 5 | A24 | P2 | Reglas económicas compartidas, previsión honesta y decisiones pendientes separadas. |

Cada entrega: reproducción → test RED → causa raíz → solución mínima → GREEN focalizado → control de regresión pertinente. No pasar al punto siguiente con solución incompleta o decisión pendiente: cerrar el bloque ejecutable y registrar el bloqueo, no inventar reglas.

## 3. Hallazgos, reproducción y aceptación

### A10 — Bolsa titular sin título habilitado

**Actual:** `engine.ts`, `generarOfertas` construye campeón/bolsa; `ofertasValidasPara` cambia solo `esTitulo`, etiqueta y detalle cuando falta TV. La guarda R2 de resultado no elimina una oferta degradada que ya declara título 0.

**Reproducción:** profesional con 25 peleas, 20 victorias, 10 KO, título 0 y sin TV; pedir ofertas. Diagnóstico: tercer rival título 4, oferta título 0, bolsa $93.000, «Pelea de experiencia». Importe ligado a esta secuencia RNG, no universal. Impacto: ingreso internacional sin requisito y contrato rival/título/bolsa incoherente.

**Recomendación registrada, no autorizada:** comprobar elegibilidad del club antes de construir la alternativa titular. Sin TV, generar una pelea ordinaria con bolsa ordinaria y rival coherente; con TV, preservar fórmula titular actual. La alternativa de mostrar una titular bloqueada queda descartada como recomendación actual. No cambiar precios, umbrales ni progresión de títulos (A25 queda fuera). Las ofertas antiguas requieren la decisión específica de la sección 4; esta recomendación no autoriza modificar contratos ya pactados.

**Aceptación/tests:** fixture por título 0–4, TV sí/no, debut pro y récord negativo; igualdad exacta de bolsa según fórmula/semilla, no solo «menor de X». Verificar elección manual y representante, pactar/resolver/cobrar una vez, reload. Guardados con ofertas antiguas: revalidar al pactar/refrescar y explicar rechazo; no alterar silenciosamente pendientes/combateActivo o resultados ya aceptados. Decidir tratamiento de oferta antigua antes de migrar, sin confiscar caja existente.

Archivos previstos: `src/game/engine.ts`, `state.tsx`, tests R3; texto mínimo del selector si se aprueba bloqueo. No tocar motor de puntuación R2.

### A21 — Consejos repetidos sin nuevo logro

**Actual:** `state.tsx`, `objetivoConsejoCumplido` reduce c8+ a las mismas tres metas absolutas. `RECLAMAR_CONSEJO` genera otro ID con mismos umbrales; evaluación semanal marca cumplido sin progreso nuevo. Guardas de cobro del mismo ID sí existen: no confundir ese PASS con impedir el bucle entre IDs.

**Reproducción:** estado con 3 recreativos, 1.500 seguidores, 3 victorias: c8/c9/c10 y c11/c12/c13 resultan todos true. Cobrar y volver a evaluar el nuevo consejo mantiene la cadena sin otro logro. Impacto: fama/dinero repetibles y colección sin límite de presentación.

**Recomendación registrada, no autorizada:** usar hitos únicos en R3, identificados por objetivo lógico, no solo por ID. No generar sucesores repetibles ni inventar incrementos o frecuencias. Como catálogo mínimo propuesto para revisar: conservar c1–c7 y ofrecer una sola vez cada objetivo de 3 recreativos, 1.500 seguidores y 3 victorias, con sus importes existentes 60/80/120 y fama 1/2/2. El usuario recomendó unicidad, pero todavía no aprobó este catálogo definitivo ni el tratamiento legacy. La propuesta previa de baselines/deltas queda sustituida, no se implementa. Esto reduce la frecuencia de recompensas, sin modificar los importes nominales ni recuperar pagos históricos.

**Aceptación/tests:** máximo un pago por objetivo lógico, incluso con IDs legacy diferentes; ningún sucesor repetible tras cobrar. Para el catálogo propuesto: recreativos 2/3/4, seguidores 1.499/1.500/1.501 y victorias 2/3/4 verifican exactamente los umbrales. Doble clic/reload/reentrada no duplican el cobro; bajar y recuperar seguidores no vuelve a premiar. Hitos iniciales siguen alcanzables y con sus recompensas originales. Migración legacy preserva IDs y evidencia histórica, pagos y caja; la elegibilidad de duplicados pendientes depende de la decisión de la sección 4. Archivo/paginación no elimina evidencia ni exige rediseño R4.

**Contradicción de tests:** `game.test.ts`, «mantiene alcanzables las metas repetibles ...», exige true en c11/c14 con los mismos 3 recreativos. No borrar ni debilitar esa assertion para obtener verde: aprobar primero el contrato de hitos únicos y reemplazar explícitamente el escenario contradictorio por assertions exactas de unicidad y del tratamiento legacy aprobado, conservando alcanzabilidad y pago único. No cambiar resultados de calibración sin evidencia y autorización.

Archivos: `state.tsx`, `data.ts`, `types.ts`, `saveValidation.ts` (si hay campos/version nuevos), `Phone.tsx` solo para progreso/archivo necesario; tests de migración y R3. No rediseño global.

### A08 — Compras sin todos sus efectos

**Actual/reproducido:** `data.ts` promete +10% velocidad para `cuerdaVelocidad`, +10% defensa/eficacia para `plataformaReaccion`; `calcularModificadores` devuelve 1 en esas capacidades. Diagnóstico adicional: `barraProteinas` aplica fuerza ×1,2, pero recuperación permanece 30 pese a «+4 energía»; se debe definir si es recuperación semanal o energía inmediata. No asumir la semántica.

**Propuesta:** aplicar los multiplicadores ya prometidos, sin modificar costos (700/1.200). Para proteínas, registrar la recomendación de +4 de recuperación semanal, conservando fuerza ×1,2 y precio 3.200: comprar no acredita energía retroactiva ni inmediata. Inventario contractual de TODOS los artículos: efecto inmediato, entrenamiento, salud, combate, ingreso, habilitación o cosmético explícito; mismo inventario para cursos/rasgos/personal relacionados. Tabla declarativa pequeña y adaptadores existentes; no refactor general de contenido. Otras ambigüedades de energía/apilamiento se elevan, no se resuelven cambiando textos para esconder un efecto ausente.

**Aceptación/tests:** compra debitada exactamente una vez, duplicado sin débito/efecto extra, reload conserva instalación, un artículo modifica solo su objetivo. Cuerda sola velocidad 1,1; plataforma sola defensa/eficacia 1,1; combinación con peras reproduce el apilamiento multiplicativo vigente cuando corresponda. Probar valores antes del redondeo y delta real bajo semilla fija/atributo lejos del techo; no exigir aumento visible si redondeo/techo legítimamente lo impide. Combatir/habilitar/vender con fixtures específicas para efectos que no son de entrenamiento. Mantener monotonía y checkpoints R2.

Archivos: `data.ts`, `engine.ts`, `state.tsx` solo efectos inmediatos, tests R3. Precios intactos. Restaurar efecto prometido cambia resultados reales: registrar impacto, no llamarlo cambio de precio.

**Aceptación específica de proteínas:** recuperación base 30 → 34 con proteínas solas; compra mantiene exactamente la energía previa, incluso 0. El próximo cierre semanal aplica el +4 una vez, respetando el techo vigente; recargar no acredita una recuperación extra. Instalaciones antiguas reciben el efecto en cierres futuros, nunca compensación por semanas pasadas. Probar también acumulación con equipamiento existente y fuerza ×1,2 sin duplicarla.

### A11 — Orden de contratación cambia capacidad

**Actual:** `CONTRATAR` usa gerentes+coordinadores para limitar también entrenador local. UI compara contratados del propio tipo y permite al menos 1 aunque no haya sucursal; no comparte la guarda del reducer.

**Reproducción:** semana 5, cursos clubes/franquicias, una sucursal, caja 10.000, contratación confirmada: gerente→entrenador deja solo gerente; entrenador→gerente deja ambos. Impacto: automatización/ingreso bloqueados según orden y botón incoherente.

**Recomendación registrada, no autorizada:** selector de disponibilidad compartido; gerente/coordinador comparten cupo administrativo y entrenador local tiene cupo independiente. No modelar sedes nuevas en este gate. Conservar representación global y salarios: gerente 110, entrenador local 80 y coordinador 140 por semana.

**Nueva propuesta del usuario para coordinadores:** conservar empleados existentes y sus salarios; bloquear TODAS las nuevas contrataciones de coordinadores mientras no se haya definido una función diferenciada. No basta tener cupo libre. UI y reducer deben aplicar la misma indisponibilidad y explicar el motivo, sin prometer capacidad adicional. Texto propuesto para revisar: «Nuevas contrataciones no disponibles: falta definir una función diferenciada para este puesto. Los coordinadores existentes conservan su contrato». No convertirlos en gerentes, despedirlos, reducirles el sueldo ni darles beneficios nuevos durante carga/migración.

**Consecuencias:** se conserva el gasto semanal de los contratos existentes y su participación en el cupo administrativo, aunque el salario 140 todavía no tenga una ventaja diferencial justificada. La oferta de nuevos coordinadores queda suspendida; el resto del personal mantiene sus reglas. Conservar el despido voluntario vigente no implica permitir recontratación del coordinador mientras dure el bloqueo. No añadir sedes/capacidad/automatizaciones como compensación. Levantar el bloqueo exige una decisión posterior sobre función, alcance y pruebas; no es condición para aprobar esta suspensión temporal.

**Aceptación/tests:** ambas permutaciones producen mismos roles, número y flujo recurrente con una sucursal; cero sucursales rechaza en UI/reducer; duplicado excedente rechazado; despido/recontratación; requisitos de semana/curso y confirmación de nómina conservados. Proyección y liquidación de una sucursal con gerente+entrenador: ingreso exacto `650 + 8*fama + 200`, sueldos 190 antes de otros gastos. Legacy con exceso de empleados: conservar personas/salarios, bloquear nuevas altas excedentes; no despedir automáticamente. No prometer asignación por sede inexistente ni certificar multi-sede futuro.

Archivos: `engine.ts`, `state.tsx`, `panels.tsx`, tests R3; `data.ts` solo contrato aprobado de coordinador.

**Aceptación específica del coordinador:** fixtures con 0/1/varios coordinadores preservan IDs, personas, salarios y nómina tras roundtrip; UI explica la suspensión aunque haya sucursales y cupo libre. Una contratación intentada por acción directa no modifica caja, personal ni capacidad; puede emitir únicamente el aviso correspondiente. Gerente/coordinador existentes consumen el mismo cupo administrativo; entrenador no consume ese cupo. Exceso legacy no provoca bajas automáticas. Despedir uno voluntariamente actualiza la nómina, pero no permite una nueva alta del puesto suspendido. No quedan textos que prometan sede adicional; el panel de empleados existentes no los presenta como despedidos o inexistentes.

### A24 — Economía conectada y previsión honesta

**Actual confirmado:** previsión (`engine.ts`) y liquidación (`state.tsx`) duplican cuotas/nómina/alquiler/pasivos/deuda; «Entradas seguras» en `App.tsx` incluye promedio aleatorio de recaudaciones. Arena sigue cobrando 150 de alquiler, aunque `PROPIEDADES.arena.beneficio` promete eliminarlo. Velada programada sin pendientes cobra `300 + fama*18 + bonus/multiplicadores + azar(0,120) − 250`, suma velada/fama/prensa. Los retornos mínimos de bingo/naipes/festival/clase abierta son 250/130/580/80 frente a inversiones 200/100/500/60: margen siempre positivo.

**Obsoleto en 44:** `crearEstadoBase().dinero` ya es 900 y texto de reconstrucción dice 900; NO cambiarlo a 400 ni abrir corrección ficticia. Sí proponer derivar el texto de configuración para evitar divergencia futura.

**Correcciones propuestas:** extraer solo reglas económicas duplicadas a cálculo puro compartido, sin alterar fórmulas/orden de redondeo ni tiradas. Separar garantizado/estimado y mostrar incertidumbre sin llamar segura la media. Derivar saldo inicial visible. Registrar la recomendación de Arena: elimina alquiler futuro, sin devolver pagos históricos; precio 80.000 y multiplicador ×1,5 intactos. Afecta el gasto real futuro, por lo que sigue pendiente de autorización. Libro y caja conservan transacciones/pagos únicos.

**Recomendaciones de producto registradas:** sin combate válido, la velada no genera entradas, fama, prensa ni contador; no diseñar una exhibición como sustituto. Reutilizar la validación de combate vigente en R2, sin reglas deportivas nuevas. Mantener precios, salarios y riesgo/distribución de recaudaciones actuales. Sigue pendiente aclarar manejo de la programación vacía y sus costos antes de modificarlo, además de cualquier contrato ambiguo de pasivos afectados por Imperio. No rescates, préstamos adicionales, seguidores ni bolsas nuevos por iniciativa técnica. Transacciones tipadas solo si necesarias para trazabilidad de R3; no migrar todo el libro ni rehacer arquitectura.

**Aceptación/tests:** matriz cuotas/recreativos/aportes/ayuda/sponsor/marca/sucursal/actividad/velada/alquiler/nómina/caja negativa/préstamo/devolución/cierre. Para componentes deterministas: previsión = liquidación exacta con mismo estado de referencia; para aleatorios: rango mínimo/máximo/media correctamente etiquetados y resultado exacto con RNG fijo, NO exigir media = cobro. `resumen.total = sum(ingresos) − sum(gastos)`, delta de caja concilia incluyendo operaciones ya liquidadas, sin repetir sábado/domingo tras reload. Préstamo 10 cuotas de 60 y cargo negativo 3% acotado 10–50 permanecen; caja −143 y cierre ≤−1.500 con confirmación siguen cubiertos. Legacy y combateActivo conservados en roundtrip.

Archivos: `engine.ts`, `state.tsx`, `App.tsx`, `panels.tsx`, `data.ts` solo si hay decisión; posible helper económico focalizado/tests R3. No rediseño UI R4.

## 4. Recomendaciones consolidadas y decisiones pendientes

### 4.1 Dirección propuesta; ninguna fila autoriza implementación

| Tema | Recomendación consolidada | Consecuencia / compatibilidad |
|---|---|---|
| Ofertas sin TV | Generar pelea ordinaria con rival y bolsa coherentes. | Corrige ingresos futuros incoherentes; contratos antiguos pendientes requieren política separada. |
| Consejos | Hitos únicos, sin sucesores repetibles. | Menor frecuencia de recompensa; conservar importes nominales e historial. Catálogo y duplicados legacy todavía por decidir. |
| Cupos de personal | Administración compartida gerente/coordinador; entrenador independiente. | El orden no altera capacidad; contratos existentes intactos. |
| Coordinadores | Conservar empleados/salarios; suspender nuevas altas hasta definir función diferencial. | Sin capacidad extra prometida, sin despidos automáticos ni recontratación mientras siga suspendido. |
| Proteínas | +4 recuperación semanal, no retroactiva. | Efecto en cierres futuros; fuerza ×1,2 y precio 3.200 conservados. |
| Arena | Alquiler futuro cero, sin devolución histórica. | Menor gasto futuro; precio 80.000 y ×1,5 conservados. |
| Velada vacía | Sin combate válido: cero entradas, fama, prensa y contador. | No premiar cartelera inexistente; programación y costos requieren aclaración. |
| Calibración | Solo evidencia afectada por correcciones aprobadas, antes/después. | Mantener assertions exactas, seis escenarios y casos deficitarios. No forzar rentabilidad. |

Los multiplicadores anunciados de cuerda/plataforma y la promesa de alquiler de Arena provienen del contenido existente; corregir los dos primeros es restaurar un contrato. La semántica semanal de proteínas, unicidad de consejos y suspensión del coordinador son recomendaciones nuevas, no autorizaciones ni contratos canónicos ya aprobados. El catálogo final y las políticas legacy deben quedar explícitos en los canónicos cuando se autorice su implementación.

### 4.2 Decisiones necesarias antes de implementar

1. **Catálogo de consejos:** confirmar si se conservan c1–c7 más los tres objetivos únicos propuestos (3 recreativos / 1.500 seguidores / 3 victorias), o definir otro catálogo. No inventar hitos adicionales. Aprobar el reemplazo del test contradictorio de repetición por el contrato exacto de unicidad, sin perder cobertura.
2. **Consejos antiguos cobrados:** propuesta: mantener IDs, evidencia de pagos y caja; un objetivo ya cobrado no vuelve a pagarse aunque tenga otros IDs. Sin devolución ni sanción retroactiva. Requiere aprobación como política de compatibilidad.
3. **Consejos antiguos pendientes, incluidos cumplidos sin cobrar:** elegir entre conservar excepcionalmente todos sus cobros pendientes o consolidar a un único derecho por objetivo lógico. Recomiendo consolidar: si no hubo cobro previo, conservar un derecho; si ya lo hubo, archivar duplicados sin nuevo pago. Esto cancela expectativas de cobro legacy, por lo que no se debe aplicar sin decisión explícita. Preservar registros/IDs, distinguir archivado de cobrado y explicar la transición; no inventar fechas ni pagos. Los casos no clasificables deben reportarse, no eliminarse mediante defaults.
4. **Ofertas antiguas no pactadas:** propuesta: impedir pactar una oferta incoherente y ofrecer regeneración ordinaria explícita, sin costo; no consumir RNG ni reemplazar silenciosamente ofertas al cargar. Confirmar esta política y su aviso. Ofertas sanas se conservan.
5. **Ofertas antiguas ya pactadas, aún no iniciadas:** decidir conservar excepcionalmente el contrato existente (recomendación de compatibilidad) o permitir cancelación/reemplazo explícito sin penalización. No cambiar rival/bolsa unilateralmente ni recalcular al cargar. Testear el contrato elegido de forma exacta, sin confundir esta excepción histórica con habilitar nuevas ofertas incorrectas.
6. **Combates antiguos ya iniciados y resultados liquidados:** propuesta: preservar checkpoint, contrato y pagos; no reescribir el combate en curso ni reclamar dinero histórico. La reanudación exacta R2 sigue siendo innegociable; si la política elegida exigiera modificarla, detenerse y solicitar ampliación antes de actuar.
7. **Veladas vacías:** confirmar si se bloquea su programación o se permite una agenda tentativa y se cancela cuando no quede combate válido. Aclarar si la cancelación evita también los costos de organización; la recomendación recibida define cero beneficios, pero no autoriza inventar una devolución ni un cargo nuevo. Una pelea huérfana/cancelada no cuenta como válida.
8. **Autorización de ejecución y evidencia:** aprobar expresamente implementación de las recomendaciones seleccionadas y recalibración limitada a sus efectos demostrados. Mantener precios/salarios/riesgo; documentar antes/después por hallazgo. La autorización previa de R2 no se extiende a R3. Si el inventario descubre otros efectos ambiguos necesarios para A08/A24, elevarlos antes de resolverlos.

### 4.3 Pruebas de compatibilidad exigidas para estas decisiones

- Consejos: guardados con objetivo único, duplicados pendientes, duplicados cumplidos sin cobrar, uno o varios ya cobrados, IDs desconocidos y objetivo inicial; roundtrip preserva datos sanos y las transacciones históricas. El derecho futuro coincide exactamente con la política aprobada; carga repetida no paga ni migra dos veces.
- Ofertas: sana/incoherente × no pactada/pactada/iniciada/liquidada; comprobar rival, bolsa, título, caja, RNG y checkpoint antes/después. La regeneración autorizada solo afecta la oferta solicitada; no toca otros contratos.
- Coordinadores: existentes con y sin sucursales, exceso legacy, cupo libre, contratación directa y despido voluntario. Preservar contratos y salarios; rechazo coherente y explicable sin alterar caja/capacidad.
- Arena/proteínas: compras nuevas y antiguas, carga antes/después del cierre; sin reembolsos ni energía retroactiva. Velada sin válidos y con al menos uno válido: diferencias exactas de ingresos/fama/prensa/contador, costos según la decisión pendiente.
- Si se requiere migración: versión explícita, idempotencia y originales/backup protegidos como R1; no reparar destructivamente una partida recuperable. Solo fixtures o copias aisladas.

## 5. Controles y condición de cierre

- [ ] Fixtures sintéticas con semilla restaurable, IDs/fechas estables; cada bug tiene reproducción RED antes de implementar y assertions exactas GREEN después. Inventario de contratos, no solo aumento del número de tests.
- [ ] Tests específicos `r3.test.ts` por hallazgo; R1/R2 afectados cuando toque carga/combate/resultado. Controles independientes en paralelo sin compartir RNG global, build, storage o perfil mutable entre procesos.
- [ ] Mantener los seis escenarios de calibración (seed 260923, horizontes 12/52); simulación focalizada a 120 semanas/varias semillas para recompensas/contabilidad. Conservar escenarios deficitarios; no forzar rentabilidad. Reportar estado completo/conciliación además de caja final.
- [ ] Toda modificación de schema requiere migración explícita/idempotente, roundtrip y originales/futuros protegidos. No borrar historia o recuperar dinero perdido inventándolo.
- [ ] Pruebas aisladas de compra/contratación/consejo/previsión/recarga si hay UI afectada; GPU solo en renderizado compatible, no para motor. No playtest del usuario ni certificación visual R4.
- [ ] Al cierre autorizado: `npm run verify` completo, diff y alcance revisados, evidencias por hallazgo y canónicos actualizados. Reusar verde solo para código/fixtures/entorno idénticos.
- [ ] A08/A10/A11/A21/A24 cerrados solo con decisiones resueltas y evidencia; distinguir bloqueado de pendiente de implementación. No declarar cierre R3 si quedan contratos ambiguos necesarios para estos hallazgos.

**Salida original de la preparación:** únicamente este plan; ver autorización y ejecución posteriores abajo.

## 6. Autorización y consolidación final de R3

El usuario aprobó A08/A10/A11/A21/A24, commits, push y PR en borrador contra main. No autorizó merge, Pages, R4/R5 ni BOX-15.

- Ofertas sin TV: ordinarias coherentes; antiguas incoherentes no pactadas se rechazan, con regeneración explícita gratuita. Carga sin RNG. Contratos pactados y checkpoints históricos conservados.
- Anselmo: c1–c7 y c8/c9/c10 únicos, recompensas originales. No sucesores. Un objetivo pagado no repaga; duplicados pendientes conservan el primer derecho en orden histórico, los demás se archivan sin simular cobro. IDs desconocidos se conservan.
- Gerente/coordinador comparten cupo administrativo; entrenador local independiente. Contratos y salarios existentes preservados, nuevas altas de coordinadores suspendidas con explicación UI/reducer.
- Cuerda velocidad ×1,10; plataforma defensa/eficacia ×1,10; proteínas fuerza ×1,20 y recuperación semanal +4, techo 100, sin efecto inmediato/retroactivo.
- Arena: alquiler futuro cero; precio 80.000 y ×1,5 intactos, sin reembolsos históricos.
- Velada tentativa sin combate válido al ejecutarse: cancelación sin beneficio ni organización, sin restituciones históricas. Con válidos, fórmulas anteriores y pago único R2.
- Economía: cálculos deterministas compartidos; actividades aleatorias separadas con rango/media. Precios, salarios, riesgo y fórmulas no aprobadas permanecen intactos.

Migración explícita 6→7: consolida derechos y registra IDs de contratos titulares ya pactados para conservar su elegibilidad contractual, no sus requisitos médicos/identidad/fecha. No modifica checkpoint ni contrato. Evidencia de cobro dañada bloquea recuperación/escritura por ambigüedad; no se elimina para desbloquear otro premio. Originales/backups R1 protegidos.

Los seis escenarios exactos 12/52 semanas no requieren recalibración: ninguna de sus operaciones usa los efectos modificados. Se conservan déficits y assertions. Además se ejecutan 120 semanas con tres semillas y roundtrips/conciliación por cierre.

Evidencia y límites definitivos: informe 52. Los puntos históricos de decisión de la sección 4 están resueltos por esta autorización; no constituyen pendientes nuevos. La función diferenciada de coordinador queda para una decisión futura, con suspensión aprobada en R3.
