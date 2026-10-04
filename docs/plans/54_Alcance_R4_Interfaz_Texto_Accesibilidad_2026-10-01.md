# Plan 54 — R4: interfaz, texto y accesibilidad

## Estado de continuidad prioritario — 2026-10-04

Continúa abierto en PR6. Checkpoint ampliado: suite464/464 (18archivos);959claves verificadas por catálogo, no cobertura global. Optimización real recupera margen: JS550365/573440, CSS86857/92160. No split nuevo ni límites mayores. Informe55 detalla artefactos, tiempos focales y RED→GREEN de combate, libros extensos, contratos, propiedades, avisos y texto veraz de sucursal. Matriz final/verify global de cierre todavía pendientes; conteos históricos posteriores en este documento no certifican este checkpoint. Solo es habilitado. Próximo: mensajes/errores/prensa/contabilidad global, Planificación/densidad y estados extremos restantes; build final inmutable, matriz obligatoria más inspección y regresiones. No detener por checkpoint ni empezar otros gates.

**Estado:** aprobado; implementación EN CURSO, todavía sin cierre. 2026-10-01.
**Continuación2026-10-04:** informe55 y contexto operativo distinguen evidencia actual de la histórica. Checkpoint433 tests/15 archivos,298 claves por idioma y focales de aviso vencido/Panel/cobro exacto. Matrices anteriores corresponden a otros builds, no al nuevo artefacto. Matriz final pendiente: runner17 familias×10 tamaños más estados restantes. Continúan catálogo global y cobertura obligatoria; solo es habilitado, presupuestos intactos. PR6 permanece borrador/NO APTO. No pedir otra autorización para pendientes vigentes.
**Baseline:** main `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`, R3 integrado sin publicación.
**Alcance:** A18, A19, A20, A23, A26 de auditoría44 y cierre pendiente del selector documentado en informes52/53.
**Salida:** pestañas y decisiones utilizables en escritorio/móvil/zoom; texto legible y veraz; foco/idioma completos para el alcance expresamente habilitado. No certifica el juego completo.

## 1. Evidencia de entrada y límites de este análisis

Se contrastaron auditoría44, cinco canónicos, contrato de pulido/matriz de canvas e informe53 con App, CSS, Modal, ficha, Panel del Club, ajustes, tipos, reducer, economía e i18n. El árbol de main coincide exactamente con el head R3 probado, aunque los hashes de commit son distintos por el merge.

Se reutiliza la evidencia vigente de R3: verify351/351 y navegadores R1/R2/R3 aprobados. NO demuestra cierre de R4. En esta preparación no se ejecutaron nuevas pruebas gráficas, no se probó la partida del usuario ni localhost3000, y no se cambió producción. Las reproducciones visuales móviles de auditoría44 son históricas; la vigencia exacta por viewport debe medirse al iniciar implementación. Los diagnósticos siguientes son inspección directa de código, salvo donde se indica evidencia histórica.

No se repite verify por añadir únicamente este documento. GPU no aporta al análisis estático; se reservará para navegador compatible según informe47. Los controles independientes podrán ejecutarse en paralelo sin compartir perfiles, puertos ni builds mutables.

## 2. Contraste por hallazgo

| Prioridad | Hallazgo y estado actual | Reproducción prevista | Impacto y solución mínima propuesta | Archivos principales |
|---|---|---|---|---|
| P1 | A18: App mantiene h-dvh/overflow-hidden y franjas acumulativas. La auditoría44 midió 24,36px de canvas central a390×844; requiere nueva medición sobre main. | Abrir las7 pestañas en móvil con guía activa/completa, dock abierto/cerrado, máximos y nombres largos. Medir área útil y alcance de controles, no solo footer. | Presupuesto móvil propio, cabecera/ayudas compactas bajo demanda, navegación accesible, grillas paginadas según área real. No copiar columnas de escritorio ni ocultar acciones con overflow. | App, TopBar, Phone, index.css, panels, CityMap, GymView, CalendarView, BoxerSheet, FightScreen. |
| P2 | A19: CSS sigue reduciendo controles de Perfil a .5rem/.53rem e incluso .42rem; repite media queries y oculta títulos. | Perfil/ramas/bienes en1280×720 y1024×600, zoom125%, textos largos; comparar dimensiones y captura legible. | Tokens compartidos de texto/controles, icono en caja estable, alineación CTA y densidad adaptativa. Eliminar solo reglas contradictorias cubiertas por tests, no refactor CSS general. | index.css, ui, panels, paginación/capacidad responsive. |
| P2 | A20: Modal usa ID fijo modal-title; no trap/enfoque/restauración/inert propios. App intercepta atajos sin contemplar todos los modales locales/ofertas. Phone tiene acción en div onClick. | Tab/Shift+Tab/Escape en selector, ajustes, cursos, ficha, archivo, ranking, confirmaciones y dock; abrir una segunda capa y probar atajos de gestión. | Primitiva compartida con IDs únicos, pila de diálogos, solo capa superior accionable, foco inicial/restauración, Escape coherente y bloqueo de atajos de juego. Botones semánticos y detalle táctil/teclado, no solo title. | ui, App, Phone, panels, CityMap, CareerArchive, BoxerSheet, shortcuts. |
| P2 | Selector pendiente: onClose solo despacha TOAST «Ofertas retiradas»; ofertas/ofertasPara permanecen y condición del modal sigue true. | Buscar rival, pulsar X/fondo/Escape, comprobar que desaparece, volver a abrir y regenerar explícitamente. | Separar visibilidad del diálogo de datos de ofertas. Cerrar no retira contratos ni genera rivales, no consume RNG ni cambia dinero. Reapertura explícita; eliminar aviso falso. | App, flujo de búsqueda en BoxerSheet/panels, ui; reducer solo si lo exige el contrato de presentación aprobado. |
| P2 | A23: combo distinto de acondicionamiento simula decisión; every exige alumnos presentes. Guía detallada solo semana1 y siguiente paso puede retroceder. No hay progreso explícito en EstadoJuego. | Elegir cada uno de6 enfoques, todos licenciados, alta nueva, baja del primero, cambio a descanso y reload. | Progreso monotónico separado de combo actual, hitos del tutorial persistidos, aviso individual del nuevo alumno independiente. DT y elección manual registran decisión; umbrales/dinero no cambian. Migración legacy necesita decisión, sección5. | App, tipos, state, saveValidation, creación de estado, ficha/selector de progreso. |
| P1 de contrato | A26: i18n tiene locales/Intl pero no t ni catálogo. Ajustes no ofrece selector de idioma completo; fmt/fecha/seguidores fuerzan es-AR. Mensajes/datos persistidos en español y cálculo compara concepto con «Desembolso del préstamo». | Inventario de textos estáticos/dinámicos/errores; cambiar locale y comparar estado, caja, fechas y RNG; pseudo+40%. | Catálogo tipado/IDs y parámetros, Intl centralizado, idioma reactivo de presentación. Separar identificador contable de texto antes de traducir libros. Legacy literal se conserva: no adivinar ni reescribir pagos. Alcance de idiomas/historial por aprobación. | i18n, componentes completos, data, economy, state, tipos, validación/persistencia cuando cambie metadata. |

No reproducir A24 antiguo como si siguiera vigente: crearEstadoBase actualmente tiene$900 y la reconstrucción visible también$900. R3 ya corrigió cálculos/previsión/veladas; R4 debe derivar importes del dato fuente para evitar futuros textos desactualizados, sin alterar esa regla.

## 3. Orden de implementación propuesto

1. **R4.0 — Baseline y RED:** fixtures aislados válidos y mediciones del shell; tests de cierre del selector, foco y guía. Registrar fallos antes de corregir. Inventario i18n en paralelo, sin traducir todavía.
2. **R4.1 — Diálogos/selector/teclado:** cerrar realmente el selector; foco, IDs, pila y atajos compartidos. No borrar ofertas para esconder el modal. No permitir que Escape pague/cancele un combate ni que Enter duplique un comando. Prueba negativa de DOM y de estado.
3. **R4.2 — Shell y retículas:** reducir franjas secundarias, grillas adaptativas y legibilidad por familia, no contenido clonado. Comprobar primero7 pestañas y luego overlays; mantener identidad/arte actual y footer.
4. **R4.3 — Onboarding:** progreso explícito y aviso individual. Implementar solo después de aprobar política legacy; migración explícita/idempotente, originales/backups protegidos y roundtrips R1.
5. **R4.4 — Textos/i18n:** catálogo, vocabulario, formatos y mensajes; migrar metadata sin modificar texto histórico desconocido. Usar IDs estables para lógica, jamás el concepto localizado. Inglés/portugués según decisión aprobada, sin ofrecer traducciones parciales como completas.
6. **R4.5 — Cierre focal:** matriz visual/teclado/idioma completa, regresiones R1–R3 y verify; revisión del diff, informes y canónicos. No iniciar R5 automáticamente.

No pasar de un bloque fallido al siguiente para aumentar conteos. Bloques independientes de inventario/tests pueden adelantarse, pero no dan por aceptado un contrato pendiente. No se estiman horas ficticias: registrar duración real de pruebas focales/build/E2E y paralelizar solo tareas sin dependencias.

## 4. Contratos y tests de aceptación

### Selector y diálogo

- [ ] X/Escape/cierre permitido del fondo eliminan el diálogo activo del DOM; nada depende solo de animar su opacidad.
- [ ] Cerrar/reabrir conserva ofertas, contratos, bolsa, RNG y checkpoint exactamente; regeneración solo por la acción explícita R3, gratuita. Reload no genera ofertas ni abre decisiones de forma accidental: visibilidad inicial cerrada, ofertas disponibles por acceso explícito (propuesta de UX).
- [ ] Tab/Shift+Tab no sale de capa superior; ID de título único, foco inicial visible y restaurado al disparador o fallback estable si desapareció. El fondo no recibe clicks/foco/atajos.
- [ ] Diálogos anidados cierran uno por vez; no se cierran silenciosamente confirmaciones destructivas y combate mediante un atajo global mal dirigido.
- [ ] Banner de alumno listo y acciones del panel se activan con teclado/táctil. Ayudas no dependen solo de hover/title.
- [ ] Toasts/resultados/errores anunciables sin leerlos repetidamente cada render; movimiento reducido respeta preferencia CSS y animaciones JS.

### Canvas por pestaña

Matriz obligatoria del contrato:1920×1080,1440×900,1366×768,1280×720,1024×600,1024×768,768×1024,390×844; añadir390×667 y844×390 para móvil bajo/horizontal. Zoom125% real o viewport CSS equivalente documentado (no fingir zoom con deviceScaleFactor); pseudo-localización+40% y nombres largos. Fixture/viewport/locale/zoom y controles medidos quedan identificados por combinación.

| Pantalla | Estados/acciones que no pueden faltar |
|---|---|
| Gimnasio | Vacío, normal y lleno; estaciones y apertura de ficha/plantel. |
| Ciudad | Mapa/inspector/CTA, presupuesto insuficiente, ranking/talentos/archivo largo. |
| Plantel | 0/1/4/10 alumnos, amateurs/profesionales máximos, espera, nuevo talento, filtros y primera/última página. |
| Mercado | Cada categoría, recomendado/comprado/sin fondos, segunda fila donde cabe y última página. |
| Mi Perfil | Tres ramas, curso bloqueado/completado, propiedades, actividades y cierre del club. |
| Personal | Disponible/contratado/exceso legacy/coordinador suspendido/advertencia de nómina y última página. |
| Calendario | Libre, máximos de avisos, vencimiento, pelea y confirmación de cancelación. |
| Dock y overlays | Panel abierto/cerrado, cuatro canales/historial de consejos, inicio/ranuras/ajustes, ficha/selector/balance/combate/esquina/final. |

- [ ] Medir intersección real de CTA con canvas/footer; hit-testing demuestra que no están tapados. Footer visible es necesario, nunca suficiente.
- [ ] Sin scroll global en escritorio; sin scroll para revelar una decisión esencial. En móvil paginación/detalle/contexto mantienen acceso completo, no contenido cortado en overflow-hidden. Si un caso exige cambiar esta regla, consultar antes.
- [ ] Controles equivalentes difieren como máximo1px en alto y CTA se alinean; medidas más captura revisada para centrado óptico. No aprobar una captura por geometría solamente.
- [ ] El componente tiene una zona realmente útil para una tarjeta legible y acción en cada estado; criterio concreto depende de tokens aprobados, no de una altura arbitraria que oculte el problema de24px.
- [ ] Texto prioritario íntegro; detalles accesibles por una acción visible. No métricas nuevas para rellenar, no letra diminuta ni tarjetas estiradas artificialmente.

### Onboarding/persistencia

- [ ] Las6 elecciones cuentan; Completo no equivale a ausencia de decisión. Asignación automática al contratar/incorporar usa recomendación R2 y marca decisión sin cambiarla.
- [ ] Orden: enfoque por boxeador inicial → equipamiento →10 sesiones reales → primera licencia; requisito de curso conserva su explicación, no inventa un quinto paso.
- [ ] Hito completado no retrocede por nuevo alumno, transferencia, cambio de foco o pasar todos a competitivos. El alumno nuevo sigue mostrando atención individual.
- [ ] Guardar/cargar conserva progreso exactamente; schema antiguo/actual/futuro, datos ambiguos, backups y escritura fallida bajo R1. No inventar cuándo ocurrió una acción ni conceder recompensa por completar la guía.

### Catálogo y economía invariantes

- [ ] Inventario por fuente/superficie: UI, aria, alt, tooltips, toast, validación/almacenamiento, contenido/eventos, ofertas, balance/historial, intro y overlays; cubrir también ramas raras de error, plural y estados bloqueados.
- [ ] Claves completas y parámetros tipados en locales habilitados; pseudo+40% sin claves crudas ni cortes. Falta de traducción falla el test; fallback explícito no cuenta como traducción completa.
- [ ] Nombres del jugador/boxeadores/club y textos desconocidos conservados literalmente; no traducir IDs de combo/división/resultado para tomar decisiones.
- [ ] Cambiar idioma no altera moneda de juego, saldo, préstamo/dineroGanado, bolsa, calendario, RNG, reglas ni checkpoint. Intl modifica presentación, no realiza conversión cambiaria.
- [ ] No traducir concepto usado como lógica. Añadir categoría/ID compatible para nuevas líneas y resolver legacy conocido de modo explícito; desconocidos no se reclasifican ni se eliminan. Migración segura y errores visibles.
- [ ] Mantener las6 curvas exactas y deficitarias y assertions R1–R3. No recalibrar salidas por una traducción/pulido.

Pruebas nuevas propuestas: unitarias de guía y catálogo/formateadores; integración/reducer de progreso y persistencia/metadata; E2E de selector/foco/atajos/táctil y matriz. Los tests visuales usarán DOM/bounds/hit-tests más capturas, no screenshots aprobadas a ciegas. Automatización de teclado no equivale a certificación completa con lectores de pantalla: registrar prueba manual complementaria o limitación explícita.

## 5. Decisiones que requieren aprobación antes de implementar

**D1 — Guía de partidas anteriores.** No hay evidencia para distinguir «eligió Completo» de default. Recomendación: para partidas con evidencia de primera licencia (plantel competitivo o archivo competitivo fiable), considerar terminada la guía inicial sin inventar fechas ni premios; para las demás, conservar hitos demostrables y pedir confirmar solo elección ambigua. Un alumno nuevo no reabre el tutorial global. Alternativa: permitir al jugador omitir la guía antigua explícitamente sin inferencia. Esta es una nueva política de compatibilidad, no está definida suficientemente en el canónico. Si la evidencia histórica no es inequívoca, bloquear inferencia de ese caso y conservar datos.

**D2 — Idiomas e historia anterior.** Canónicos ya exigen catálogo, pseudo+40%, inglés y portugués; la promesa no se reduce. Recomendación: UI y todo contenido nuevo en es/en/pt-BR completos, habilitar cada idioma solo al aprobar su cobertura. Conservar textos históricos desconocidos en idioma original identificados como registro histórico; traducir solo plantillas conocidas con identidad/parámetros fiables, nunca adivinar significado por coincidencias difusas. Aprobar esa excepción legacy o requerir traducción fiel de cada registro antes de habilitar el idioma. Preparación de claves sola NO cierra A26 completo ni certifica inglés/portugués. No elegir una excepción por cuenta propia.

**D3 — Tokens de legibilidad.** Canónicos prohíben miniaturizar letras pero no fijan mínimos numéricos. Propuesta para verificar antes de adoptar:14px para texto necesario para decidir,12px para detalle secundario; botones de acción36px en escritorio/44px táctil. Son valores propuestos de producto, no una certificación normativa. La expansión/zoom usa paginación/detalle en vez de reducirlos; validar ajuste en la baseline y pedir aprobación si requieren otra composición. El tolerado1px de simetría y pseudo+40% ya están definidos.

Selector que se cierra, foco correcto, no perder datos y nombres/etiquetas veraces son errores a corregir, no decisiones económicas. No se solicitan cambios de precios, ingresos, salarios, títulos, frecuencias, riesgo, premios ni cupos.

## 6. Evidencia, documentación y frontera de alcance

Para cada bloque: reproducción → test RED → causa → corrección mínima → GREEN → controles afectados; al cierre verify completo y navegadores afectados aislados, regresiones R1–R3 y diff revisado. No declarar cierres por inspección ni por cantidad de tests.

Actualizar solo cuando corresponda: este plan, canónicos de UI/texto/QA y un informe R4 por hallazgo con matriz ejecutada, timings, hash/build/fixtures, migraciones y limitaciones. Los encabezados actuales de canónicos contienen estados históricos pendientes/schema5/6 pese a R3/schema7 integrado: registrar aquí esa discrepancia; corregir las referencias pertinentes al actualizar R4, sin iniciar la reconciliación integral A28/R5.

Fuera: R5/A25/A27/A28 integral, nuevos roles/economía/sedes/arte, BOX15, publicación y certificación universal. Integración de tests focales reproducibles R4 no equivale a ejecutar todo R5. No commits/push/PR/merge ni Pages autorizados en esta preparación.

## 7. Autorización y seguimiento de implementación

El usuario aprobó D1–D3 y autorizó implementar R4 desde main `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`, con commits, push y PR en borrador. Esa autorización posterior sustituye la restricción de preparación de la sección anterior; no autoriza merge, Pages, publicación, R5 ni BOX-15.

Decisión adicional aprobada: si todos los alumnos iniciales salen antes de confirmar sus enfoques, vincular únicamente ese paso pendiente a los alumnos actuales. No borrar hitos completos ni registrar elecciones inexistentes. Si no quedan alumnos actuales, el paso sigue pendiente. Una guía ya completada conserva su cohorte histórica.

Avance parcial en `feature/r4-interface-accessibility`: selector con cierre/reapertura de presentación; gestión de foco de Modal; progreso persistente y migración 7→8. Véase informe 55 para evidencia y faltantes. No hay aceptación ni cierre de R4: falta la matriz completa, el catálogo es/en/pt-BR y demás controles necesarios del alcance.

Continuación: inventario AST, catálogo tipado inicial y locales incompletos deshabilitados; composición compacta de shell/Perfil/Panel del Club; paginación de Mercado/Personal en ventanas estrechas; matriz de diagnóstico ejecutada con fallos registrados. No marcar esas familias como aceptadas por las pruebas aisladas de dominio.

Seguimiento2026-10-02: las120 ejecuciones fallidas se agrupan por pantalla/viewport/causa en informe55. Correcciones responsive compartidas, persistencia operacional de guía y notificaciones con RED→GREEN. Verify392/392 es evidencia de su build, no cierre global. El diagnóstico se endureció para incluir inputs, selectores y SVG; aparecieron nuevos puntos ciegos que también deben resolverse. Ajustes/plantel rápido con matriz de portales y pseudo; se amplía a inmuebles. Continúan obligatorios catálogo global, historia fiable/contabilidad no textual, ficha/combate/otros overlays, todos los estados extremos y legibilidad de texto no interactivo. PR#6 sigue en borrador. Sin decisiones nuevas ni relajación de mínimos.
