# R4 — Registro de implementación y evidencia de entrega

## Dictamen de entrega — 2026-10-05: listo para revisión de R4, no aceptado

Esta sección prevalece sobre **todos** los checkpoints parciales que siguen. PR #6 permanece en borrador. Código verificado: `7262e319025175ee6560b9cdf2d252048ccb8b00`; base `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`. El commit posterior de documentación no altera el código probado. No se fusionó, publicó, ejecutó Pages ni inició R5/BOX-15; partida real y localhost:3000 no utilizados.

**Dictamen:** apto para revisión de aceptación dentro del alcance R4. No quedan fallos obligatorios abiertos en las matrices ejecutadas. Esto no equivale a aceptación por el usuario ni a certificación de todo el juego.

### Evidencia final y trazabilidad

Manifest reproducible: [r4_final_2026-10-05.json](evidence/r4_final_2026-10-05.json). Incluye hashes de **todos** los recursos, cobertura por familia, shard, idioma y viewport; sin datos personales, logs, capturas ni rutas temporales.

| Control | Resultado sobre candidato final |
| --- | --- |
| npm run verify | PASS: 518/518, 23 archivos; suite 4,87s; build 4,25s; total 14,306s. Typecheck/presupuesto/auditoría estructural PASS, 0 errores/0 advertencias estructurales. |
| Canvas: 7 pestañas × 7 estados × 10 tamaños × 3 idiomas | 1.470/1.470 PASS. es 65,865s; en 66,321s; pt-BR 66,056s. |
| Overlays/estados/transacciones: 51 familias × 10 tamaños | 510/510 PASS, **510 identidades únicas**, cada familia 10 y cada viewport 51. Ocho shards independientes, todos PASS y build inalterado. |
| Selector, foco, capas, contratación, notificaciones, composición | 11 focales escritorio PASS en 17,45s; además selector móvil real 390×667 PASS (total 3,95s). El caso llamado selector-mobile dentro del bloque escritorio NO se presenta como prueba móvil. |
| Personal de altura intermedia 1024×576 | RED una tarjeta en vez de dos (0,675s); GREEN dos tarjetas completas, textos/acciones y footer accesibles (0,731s). |
| Catálogo | 1.175 claves verificadas por idioma es/en/pt-BR. UI, contenido nuevo, ayudas, errores, formatos y accesibilidad; activación tras validar carga y recurso. |
| Economía | Seis escenarios exactos R3 conservados, incluidos deficitarios; sin recalibración ni cambio de parámetros. |

Diez tamaños nominales: 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 1024×600, 768×1024, 390×844, 390×667 y 844×390. Matriz con viewport CSS dividido por 1,25, DPR=1, **equivalente CSS documentado**, no zoom nativo ni deviceScaleFactor disfrazado. Pseudo-localización DOM +40%, nombres largos, vacíos, máximos, uno/cuatro/diez alumnos y espera. Se reconstruye literalmente todo texto paginado; se comprueban grafemas, rangos, bounds, hit-testing, foco, fondo inerte, acciones 36/44px, decisiones 14px, secundarios 12px, footer y ausencia de scroll global.

Las 51 familias comprenden ficha, archivo, selector/cierre/reapertura/regeneración/pacto, ajustes/idiomas/carga fallida, Panel/Consejos/Prensa/patrocinios/eventos/respuesta/vencido, cursos/propiedades/personal/Mercado/finanzas, libros extensos, cierre/legado/recuperación real del renderer, combate/esquina/conteo/KO/empate/movimiento reducido y seis transacciones positivas (equipo, curso, empleado, recaudación, propiedad, marca). Aviso vencido: confirmar permanece deshabilitado de acuerdo con el reducer.

### Causas corregidas y demostración por hallazgo

| Hallazgo | Causa y solución mínima | Evidencia / estado |
| --- | --- | --- |
| A18 canvas/controles | Franjas y grillas de escritorio consumían el móvil; detalles sin presupuesto vertical. Composición adaptativa, capacidad medida, detalle/paginación literal y controles semánticos. Personal ancho tenía 8 elementos con solo 2 columnas/2 filas: sincronizados 4×2. Altura intermedia podía alojar 2 pero mostraba 1: capacidad compartida corregida. | Matriz final pestañas/overlays y focales de densidad PASS; muestras inspeccionadas. |
| A19 legibilidad/simetría | Overrides minúsculos y espaciadores distintos por CTA. Mínimos compartidos, iconos centrados, único espaciador antes de acciones. Mercado ancho muestra 8 tarjetas reales en 2 filas, Personal 8, Plantel hasta 6 por página nativa1280, Perfil 3 cursos donde caben. No se inventa contenido para rellenar ni se promete 10 simultáneos en todo tamaño. | RED densidad/CTA → GREEN con diferencia vertical máxima 1px; contrato actual de densidad PASS y fotos nativas inspeccionadas. |
| A20 diálogos/accesibilidad | IDs fijos, foco/capas/atajos no coordinados. IDs únicos, pila, foco inicial/restaurado, Tab/Shift+Tab/Escape y fondo inerte. Detalle de errores y recuperación acotados; lector de notificación conserva snapshot con vencimiento original, sin renovar temporizador. | Tests de capas/foco, 510 estados, casos de fallo real y transacciones PASS. No certificación de lector de pantalla. |
| A23 guía/atención | Progreso derivado del plantel actual retrocedía; enfoque por defecto aparentaba elección. Hitos persistentes y confirmación explícita; migración solo con evidencia fiable de licencia. Paso pendiente puede vincular alumnos actuales por decisión aprobada; nuevas altas no borran logros. | Regresiones de guía/migración/reload/altas/bajas y atención individual PASS. |
| A26 catálogo/historia/contabilidad | Textos incrustados, locale fijo y conceptos contables usados como identidad. Catálogo global tipado + plantillas con parámetros fiables; identidad de dominio separada de presentación. Historia desconocida literal identificada, sin inferencia difusa. Carga idioma validada antes de autosave, rechazo de recurso incompleto/404 y carreras de solicitudes. | Cobertura1175 por idioma, contenido/carga/locale y seis escenarios exactos PASS; en/pt-BR también recorridos en navegador. |
| Selector pendiente | Cierre no efectivo y reapertura confundida con generación. Cierre/reapertura explícitos sin tocar ofertas/contratos/caja/RNG/checkpoints; regeneración solo acción R3. | Comparaciones exactas y recarga, móvil real y 10 tamaños PASS. |

Correcciones visuales adicionales dentro de R4: nombre del rival sin espejo (solo figura SVG se invierte); pose final KO obtenida del resultado persistido, no del estado transitorio; tooltip acotado sin truncar; contratado con tipografía necesaria ≥14px; compra de marca sin dos accesos clonados al mismo detalle; margen y lectura paginada de Mercado horizontal sin esconder beneficios o precio.

### Persistencia, compatibilidad y protección

Schema final **10**. Migraciones explícitas 7→8 (guía), 8→9 (identidad contable), 9→10 (metadata fiable de presentación). 9→10 no inventa identidad ni parámetros para historia antigua. Idempotencia, roundtrip y metadatos en los ocho contenedores pertinentes cubiertos por tests; ceros y campos desconocidos válidos permanecen. Colisiones de campos reservados/metadata inválida rechazan la escritura antes de tocar originales/backups; schema futuro protegido. Idioma nunca determina importe, objetivo, RNG ni lógica deportiva.

Regresiones de navegador R1 y R2 PASS1280/1440 sobre candidato previo index-Xq9Dk7tf.js: promoción/archivo/no-Salón, cero profesional, almacenamiento lleno/denegado/futuro, checkpoint exacto/reanudación/caída/esquina/pago único. Se reutilizan porque el único cambio productivo posterior fue capacidad de Personal en altura intermedia, ajeno a esas rutas; no se atribuye a esos recorridos el hash CsZ. Suite final518 incluye regresiones R1–R3. El harness R1 usa selector semántico de la grilla compacta y fixtures aislados, no elimina assertions ni escribe las capturas personales preexistentes.

### Inspección visual, no solo geometría

Se visualizaron capturas finales de las **siete pestañas en inglés** a1280×720/CSS125/pseudo40; Panel portugués390×667, Mercado instalado/marca1920, Personal contratado/paginado1440, esquina844horizontal, conteo390 y recuperación real844. También fotos nativas de Plantel/Mercado/Personal/Perfil y densidad intermedia. Se revisaron alineación, legibilidad, orientación, contraste de estados, ausencia de oclusión y footer. Es muestreo visual explícito, **no afirmar que se inspeccionaron todas las capturas**.

La geometría verde de una ejecución anterior no detectó por sí sola la subutilización de Personal intermedio: la inspección motivó reproducción RED y corrección. Los antiguos intentos con6 fallos de overlays/21 de Personal NO son evidencia de aceptación; solo las matrices identificadas arriba certifican el candidato final.

### Presupuesto y rendimiento medidos

Artefacto final `index-CsZ02zsU.js`: **572.493/573.440 bytes**, margen **947**; SHA256 `529d282c1cd55016fe2c2912cff3c31d09f7fc0893d421c81ff7877eb65d7704`.
CSS `index-C9SAbxas.css`: **86.239/92.160**, margen **5.921**; SHA256 `258aa070bf969617f061f7617292a79e0756666b41d34cf15136007e8eb28f71`.
Inicial JS+CSS+HTML+favicon **660.015 bytes**; con inglés **729.438**, con portugués **733.557**; total distribuido con ambos catálogos **802.980**. Recursos inglés69.423/portugués73.542. Sin nuevos chunks, sin mover recursos fuera de medición y sin elevar límites. Warning de Vite >500kB se conserva.

LazyMotion con domAnimation elimina funciones de motion no usadas; se retiran bloques siempre ocultos y duplicación real, se comparten plantillas y se eliminan estilos contradictorios. Optimización inicial43452JS/1269CSS contra checkpoint anterior; el catálogo y correcciones posteriores consumen margen. **No prometer margen holgado** ni eliminar funciones para reducirlo.

GPU realmente observada en Chromium: AMD Radeon RX7600XT, driver32.0.31036.15, ANGLE/D3D11; compositor/raster habilitados. No medir ni atribuir aceleración GPU a los tests de dominio CPU. Canvas se ejecutó en3 procesos independientes (~66s cada uno). Overlays en8 shards aislados:433,989–524,658s cada uno (el manifest conserva los8 tiempos), no8 ejecuciones completas duplicadas. El cuello de botella son recorridos exhaustivos de páginas en idiomas/estados extensos (~83–86s algunos horizontales), no el build4,25s. Esperas por readiness/capas/animación, no pausas fijas sustituyendo condiciones. Sin comparación controlada CPU/GPU, no se afirma porcentaje de mejora.

### Límites y siguiente paso

- Chromium verificado; no certificación Firefox/WebKit ni de todos los dispositivos físicos.
- Teclado, semántica y foco probados; falta evaluación humana con tecnologías de asistencia para una certificación de lector de pantalla.
- Historia desconocida queda literal, marcada histórica, por contrato aprobado; no es texto nuevo sin traducir.
- Margen JS947bytes exige volver a medir cada cambio futuro, conservando presupuesto.
- No cambió economía, salarios, precios, recompensas, cupos, reglas deportivas ni estética de fase posterior.
- Próximo: **revisión crítica del PR #6 y decisión de aceptación**. No iniciar otro gate, fusionar ni publicar automáticamente.

---

## Registro histórico de checkpoints — no representa el estado final

## Checkpoint ampliado 2026-10-04 — sin aceptación

Se continúa desde4f507da8debc55ce286bab40a792a9834476cc56. El código de esta tanda queda identificado por el commit que contiene esta adenda y por los hashes del build; no convertir una subida en aceptación. PR6 sigue borrador/NO APTO.

### Presupuesto y eliminación real de duplicación

- LazyMotion síncrono con domAnimation y m conserva animaciones/gestos utilizados y elimina drag/proyección de layout no usados. No hay nuevos chunks ni traslado de recursos fuera de assets para aparentar ahorro.
- Se eliminaron dos bloques JSX de Ciudad siempre ocultos y duplicados de accesos vigentes; se comparte la regla de estaciones no visibles y se retiran overrides tipográficos obsoletos. Funciones activas conservadas.
- Primer build después de la optimización: JS529860, CSS90527; contra checkpoint573312/91796, ahorro43452/1269bytes. Catálogo y composición añadidos después consumen parte del margen.
- Build actual: JS550365/573440, CSS86857/92160, márgenes23075/5303bytes. Carga estática inicial (JS+CSS+HTML+favicon)638505bytes; total incluyendo catálogos externos preexistentes745145bytes. Inglés51782/pt-BR54858bytes. No aumentó ningún límite.
- JS index-3zXq4ElU.js SHA256 c37b604a8d8bf176bb961d7c3da223e007d08862f75ffcc7a3c53198ed94ce27; CSS index-wm-Tb5LT.css SHA256 bbab0dc85371e04e121fa95b8ad638a5f1bbc562ee0abf18731c72d924276970.
- No atribuir todos esos bytes a una única técnica: la diferencia final incluye composición y catálogo. Advertencia informativa chunk>500kB permanece.

### Reproducciones y evidencia focal

| Causa | RED | Solución/evidencia |
|---|---|---|
| Combate acumula escena, tablas, táctica y CTA fuera del canvas | Controles de asalto/final recortados del diseño anterior | Vistas explícitas de esquina/identidad/ring/estadísticas/tarjetas/relato; controles esenciales separados. Simulación, RNG y checkpoints no cambiaron. Pruebas previas de esta tanda de recarga/pago único no sustituyen matriz final. |
| Nombre histórico de marca invade acción en móvil | Mercado con marca extensa | Detalle paginado conserva cada grafema y monto; contratación/compra con guardas existentes. |
| Contratos antiguos múltiples comprimidos o perdidos en tarjeta | Personal con tres coordinadores históricos | Selección individual de contrato, salarios y baja por ID; conserva excesos. Se conserva la assertion fuente de disponibilidad del reducer R3. |
| Propiedades y actividades exceden modal horizontal | Seis propiedades, todas adquiridas, nombres/textos extensos | Selector/vistas explícitas; precios, requisitos, riesgo, ownership y RNG intactos. |
| Ingreso prometido de sucursal no coincide con fórmula | Tres tests de locales fallan por +$800 fijo | Copia variable veraz, no cambio económico: con fama0/gerente el cálculo es650. Tres idiomas conservan +10cupos y no prometen ingreso fijo. |
| Avisos nuevos y antiguos no tienen identidad de presentación fiable | Tests de comisión/prospecto/exhibición/patrocinio inicialmente fallan | Plantillas fuente compartidas; se traduce solo tipo+origen+texto+acciones exactos. Desconocidos literalmente históricos. Seis tests nuevos, generación determinista150iteraciones y metadatos adicionales preservados. |
| Balance largo corta Continuar | Fixture12ingresos+12gastos: CTA/texto fuera de bounds | WeeklyBalance separa conciliación, libros y momento de cobro. Todas24líneas accesibles literalmente; recarga y Continuar no duplican dinero. Portrait16,089s/horizontal28,828s antes de último color; horizontal26,958s en artefacto actual, captura inspeccionada. |
| Medición del selector durante animación | Nuevos casos firma/regeneración fallan antes de estabilizar | Espera observable data-animation-ready, sin tolerancia adicional. Firma3,784s/regeneración3,820s PASS, 390×667 CSS125%/pseudo+40%; contratos/caja/ofertas/RNG exactos tras recarga. |

El fallo transitorio de medición no se presenta como bug corregido de producción. Se corrigieron también dos errores del nuevo harness: envelope.state al leer ofertas y RNG reiniciado del contexto de recarga (comparación contra stream inicial, no contra stream ya consumido antes de recargar).

### Qué está probado y qué no

- Suite actual completa:464/464,18archivos,4,14s. Typecheck/build/presupuesto focales PASS del artefacto señalado. No se declara una nueva ejecución npm run verify completa en este checkpoint; auditoría estructural final pendiente.
- R1–R3 y seis escenarios exactos siguen pasando; no se ajustaron expectativas económicas ni reglas. Suite focal de dominio/persistencia294/294,3,86s, y catálogo63tests/7archivos402ms de esta tanda.
-959claves y slots iguales es/en/pt-BR. NO es cobertura global: solo español habilitado; faltan mensajes persistidos, errores de almacenamiento, prensa y conceptos contables, entre otras ramas.
- Se inspeccionaron capturas de balance portrait/horizontal y Plantel máximo. Plantel puede conservar espacio vertical desaprovechado: los bounds verdes no cierran densidad/simetría.
- Focales actuales de ajustes horizontal4,252s y balance horizontal26,958s corresponden al JS3zXq4ElU. Focales anteriores de Ciudad/Gym/Plantel/Panel/compras corresponden a builds intermedios; no sumarlos como matriz final del artefacto actual.
- GPU RX7600XT ANGLE D3D11, driver32.0.31036.15; firma/regeneración en paralelo con perfiles/puertos independientes. No comparación causal GPU vs software.
- No nueva migración en esta tanda. Schema9/protecciones originales/backups siguen vigentes. Historia desconocida no se elimina ni se traduce por aproximación.

### Pendientes agrupados y siguiente secuencia

1. Catálogo global: errores/toasts/prensa/libros/historia con identidad y parámetros fiables; conservar literales desconocidos y lógica no textual. Idiomas extranjeros siguen bloqueados hasta cobertura.
2. Composición: Planificación, densidad Plantel, controles y lectura completa en máximos; comprobar ópticamente iconos/alineación y Gym.
3. Estados: KO/cuenta/empate/movimiento reducido; compras positivas, todas categorías, contratación/bajas/excesos, cursos completos/bloqueados, actividades pactadas, cierres/legados y ranuras.
4. Build estable final → diez tamaños, CSS125%, pseudo+40%, overlays/extremos, bounds+hit-testing+foco y capturas inspeccionadas → npm run verify y regresiones R1–R3 → diff completo.
5. Mantener checkpoint actualizado y continuar, no detener por resultados parciales. Sin merge, Pages, publicación, partida real, localhost3000, R5 ni BOX15.


Estado: EN CURSO, no apto para aceptación final todavía. Base: `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`. Rama: `feature/r4-interface-accessibility`. Los checkpoints versionables no equivalen al código final de cierre de R4. El hash de revisión de cada checkpoint corresponde al commit/PR, no a una certificación de alcance completo.

## Selector y diálogos

- Causa: la existencia de ofertas en el dominio forzaba apertura; cerrar no tenía estado de presentación independiente. Modal tampoco establecía foco inicial ni contención de teclado.
- Corrección: apertura/cierre local de UI, reapertura explícita sin búsqueda/regeneración; portales, IDs únicos, foco inicial/restauración, Tab/Shift+Tab, Escape y bloqueo del fondo/atajos mientras hay diálogo.
- RED: `tests/browser/r4_dialogs.py` reprodujo dos fallos, selector impuesto y foco inicial ausente, en 3,427 s. Fixture sintética; origen aislado puerto 5235.
- GREEN sobre build final de esta tanda: 2/2 casos, 5,116 s; fingerprint del build inalterado. Cierre por X/Escape, recarga cerrada, reapertura, igualdad exacta del estado/RNG, foco y atajos en Configuración.
- Límite: dos casos en 1280×720 no verifican todos los diálogos anidados, combate, accesibilidad de lector de pantalla ni la matriz completa. No declarar A20 cerrado por esta evidencia.

## Guía persistente y compatibilidad

- Causa: inferencia por combo actual y plantel actual no distinguía elección de default ni conservaba el hito ante altas/bajas. Se introduce metadata de guía, sin pagos, fechas inventadas ni RNG adicional.
- Nueva partida: elegir o confirmar explícitamente cualquier enfoque, incluido Completo, cuenta. Ficha con confirmación del enfoque actual cuando sigue pendiente.
- Migración 7→8: evidencia íntegra de licencia en plantel o archivo permite terminar guía antigua. Sin ella, conserva hitos demostrables y deja ambigua la elección default. La colisión con un campo antiguo desconocido del mismo nombre se rechaza protegiendo el original. Migración explícita y comprobación de idempotencia.
- Decisión aprobada: si salen todos los iniciales, vincular el paso pendiente a alumnos actuales; sin alumnos no inferir cumplimiento; hitos completos y cohorte completada no retroceden.
- RED→GREEN de cohorte: 1 fallo/14 pruebas con cohorte fija, luego 14/14 al aplicar la regla. Duraciones Vitest: 384 ms y 351 ms.
- Punto ciego detectado: archivo con club ausente, fecha no finita o historial corrupto podía dar por terminada la guía. Tres reproducciones fallaron antes del endurecimiento; después 18/18 pasan (407 ms). Se reutiliza la regla de validación del archivo, sin cambiar su contrato R1.
- Fixtures antiguos R1–R3: al simular versiones previas se excluye el campo que todavía no existía. Se conservan assertions; la expectativa exacta de migración avanza a schema 8 y explicita metadata nueva. No se debilita la protección de colisiones para acomodar fixtures.

## Verificación de esta tanda

- `npm run verify`: PASS; 8 archivos, 369/369 tests, 4,67 s de suite. Typecheck, build, presupuesto y auditoría estructural PASS.
- Build: 1,43 s; JS 525,3 KiB/560 KiB; CSS 80,7 KiB/90 KiB. Vite mantiene aviso informativo de chunk mayor de 500 kB, no ocultado; presupuesto aprobado.
- `git diff --check`: PASS. Aviso de normalización CRLF en fixture R3, sin error de whitespace.
- Los seis escenarios económicos exactos permanecen aprobados; sin recalibración de precios, salarios, pagos ni probabilidades.
- Tests focales y typecheck independientes ejecutados en paralelo. Navegador usa flags D3D11/GPU y registra SystemInfo; no atribuir ahorro medido a GPU sin comparación controlada.
- Partida personal y localhost:3000 no se usaron. Se preservan las dos capturas preexistentes modificadas de scratch; no corresponden a R4 ni deben incluirse en su commit.

## Pendientes obligatorios antes de cerrar

1. Matriz de diez tamaños, zoom CSS equivalente documentado, pseudo+40%, nombres largos/estados extremos; bounds, hit-testing y capturas inspeccionadas.
2. Legibilidad y composición en todas las pestañas, móvil/horizontal, acciones y controles esenciales.
3. Catálogo completo es/en/pt-BR para interfaz, contenido nuevo, errores, accesibilidad y formatos; no habilitar por mera existencia de claves.
4. Metadata de plantillas históricas fiables y separación de lógica contable respecto de textos traducidos, sin alterar escenarios.
5. Más regresiones operacionales de migración/backup y pruebas de atención individual, diálogos anidados y demás overlays.
6. Actualizar canónicos e informe final, verificar código final, revisar diff, commit/push y PR en borrador. Nada se fusionó ni publicó; R5 y BOX-15 no se implementan.

## Continuación — catálogo, composición y diagnóstico visual

### Catálogo y formatos

- `scripts/inventory-i18n.mjs` recorre AST de fuentes, guarda fingerprints e informa candidatos de JSX, atributos accesibles, contenido, condiciones y errores. Primera medición: 1.207 candidatos. Hay falsos positivos y expresiones dinámicas que revisar; esta cifra NO certifica cobertura ni completitud del inventario.
- `src/i18n/catalog.ts`: claves semánticas y parámetros comprobados estáticamente y en ejecución; falta de clave o parámetro produce error, no fallback silencioso. Traducciones iniciales es/en/pt-BR, expansión pseudo de copia estática sin alterar parámetros.
- Solo español está habilitado. Inglés/portugués siguen pendientes; no se ofrece un selector parcial. Una preferencia antigua para esos idiomas no se borra y se utiliza español mientras no exista cobertura global aprobada.
- 13 tests nuevos de catálogo/preferencias/formatos: claves y placeholders, parámetros faltantes, claves desconocidas, pseudo+40%, ceros/signos/moneda sin conversión, fecha no mutada, escritura opcional fallida y exclusividad de la clave de preferencia. No certifican traducción global de UI/contenido ni se presenta RED→GREEN donde solo se crearon contratos nuevos.
- Continúan pendientes las plantillas históricas fiables, contenido nuevo y eliminación de dependencia contable de textos. No se alteraron libros ni conceptos contables para aparentar traducción.

### Composición y diálogos

- RED visual: en normal/nombres largos, 390×844, 390×667 y 844×390 tenían canvas central 0 px. Captura de Perfil 390×844 inspeccionada: cabecera/franjas consumían toda la altura.
- Shell compacto: estado del club accesible mediante botón/dialog; selector de pestaña nativo; objetivos/previsión en diálogo explícito. No elimina datos de estado ni acciones, ni genera contenido de relleno.
- Perfil compacto: resumen/legado en detalle explícito, rama y sección seleccionables, cursos paginados; restaura descripción y pisos de legibilidad frente a overrides antiguos. Mercado/Personal limitan tarjetas por página en ventanas estrechas en lugar de recortar acciones de páginas largas.
- Panel del Club móvil deja de expandirse como un cajón de altura fija que roba canvas: diálogo con canal seleccionable. Canal de escritorio también legible mediante selector.
- Captura posterior de Perfil 390×844 inspeccionada: canvas aproximadamente 562 px, controles de curso/paginación y footer alcanzables; Perfil, Mercado, Personal y Calendario pasan el diagnóstico normal 390×667. No extrapolar a todas las páginas/estados ni a horizontal.
- Pila real de diálogos probada adicionalmente: Escape superior/inferior, contención bidireccional, restauración de aria-hidden/inert/foco, desmontaje fuera de orden. El módulo real se bundlea para DOM aislado; eso no verifica por sí solo todas las integraciones de Modal. Un fallo inicial del harness fue por usar la propiedad nativa `window.closed`; corregido a namespace de prueba, no fue un defecto de producción.

### Evidencia vigente de checkpoint

- `npm run verify`: PASS, 382/382 tests en 10 archivos, suite 4,20 s; build 1,27 s; typecheck, presupuestos y auditoría estructural PASS. Los seis escenarios económicos exactos se conservan sin recalibración.
- Assets probados: JS `index-DiCOo-7J.js`, CSS `index-D_U_YtWD.css`. Presupuesto JS 531,8 KiB/560; CSS 81,7 KiB/90. Aviso Vite de chunk >500 kB persiste, no ocultado.
- Navegador `r4_dialogs.py`: 4/4 PASS, 6,42 s, build fingerprint sin cambios. Reejecutado tras cambios de UI; no reutiliza el PASS del build anterior como si fuera idéntico.
- `r4_canvas.py`: 70 casos iniciales (7 pestañas × 10 tamaños), RED; diagnóstico de progreso ejecutado repetidamente solo porque cambió composición. No hubo validación por screenshots ciegas.
- Zoom equivalente CSS: 210 casos (7 pestañas × 10 tamaños × vacío/normal/máximo); 90 PASS y 120 FAIL, 20,49 s. DPR permanece 1; viewport se divide por 1,25. Máximo incluye 10 alumnos +10 amateurs +10 profesionales. Fingerprint estable. No es una certificación de zoom nativo ni una prueba completa de estados máximos de mensajes/equipos/empleados.
- GPU observada por SystemInfo: AMD Radeon RX 7600 XT, driver 32.0.31036.15; canvas2D, composición, rasterización y WebGL habilitados. Se paralelizaron controles de DOM y unitarios sin compartir origen/perfil; no se atribuye un speedup numérico a GPU sin comparar software vs hardware.

### Bloqueos de aceptación aún abiertos

La matriz mantiene cortes/tamaños/fuentes/hit-testing defectuosos en otras superficies y especialmente horizontal. Faltan catálogo completo, pseudo integrado +40% en toda UI, estados extremos de overlays/contenido, diálogos restantes y pruebas operacionales de migración. Parte del detector de fuentes requiere clasificación explícita de detalle secundario frente a texto de decisión, no bajar el mínimo para obtener PASS. No se cierra A18/A19/A20/A23/A26 ni R4 con este checkpoint. No hay una decisión nueva de producto que pedir todavía: continúa el trabajo autorizado.

## Continuación 2026-10-02 — causas compartidas y nuevos puntos ciegos

**Estado: implementación en curso en PR #6, borrador; no apto todavía.** Los resultados siguientes son registros de builds concretos, no una certificación del head futuro.

### Agrupación de los 120 casos visuales fallidos

La entrada tenía 90 PASS/120 FAIL de 210 casos, no 120 defectos distintos. Cada pantalla se repite en tres estados. Los incidentes pueden acumularse dentro de un caso.

| Pantalla | Incidentes de entrada por familia | Causa compartida | Corrección y verificación |
|---|---|---|---|
| Plantel | 155 fuentes de acción, 146 alturas, 80 cortes | Overrides miniaturizados, controles fragmentados y flex que no cedía altura a paginación | Selectores legibles, capacidad neta medida, reserva de paginación, grid flex shrink; grupo/orden combinados explícitamente en horizontal |
| Gimnasio | 90 fuentes, 30 alturas, 26 cortes, 4 solapamientos | Cinco columnas fijas, etiquetas y figuras mayores que estación, barra inferior variable no presupuestada | Estaciones por ancho real, selector de estación, posiciones de dos ocupantes simétricas y reserva medida de barra inferior; acceso al plantel mediante Modal paginado |
| Personal | 42 cortes | Dos tarjetas y confirmación de contratación agregada dentro de tarjeta consumían canvas | Paginación/composición responsive, nómina en detalle explícito y confirmación financiera en Modal, sin alterar reducer ni salario |
| Mercado | 27 cortes, 24 alturas | Alto no flexible y categorías/CTA incompatibles con ventana reducida | Grid flexible, selector de categoría y detalle de instalaciones, pisos de acción conservados |
| Ciudad | 27 cortes, 12 alturas | Inspector lateral y barra de acciones rígidos | Mapa/detalle desacoplados; en compacto selector nativo con todos los inmuebles/ranking/talentos; en amplio inspector explícito |
| Perfil | 24 cortes, 6 solapamientos | Resumen, legado, ramas y CTA compitiendo por el mismo alto | Secciones y rama seleccionables, resumen/actividades explícitos, paginación de cursos |

Entrada por viewport efectivo (CSS /1,25): Plantel y Gimnasio fallaban en los diez tamaños. Ciudad: 1152×720, 312×534, 312×675, 614×819, 675×312 y 819×480. Mercado: 1536×864, 1152×720, 312×534, 675×312 y 819×480. Perfil: 1152×720, 312×534, 675×312 y 819×480. Personal: 1152×720, 312×534, 312×675, 675×312 y 819×480. La corrección se agrupa por causa, no por cada repetición de tamaño/estado.

### RED→GREEN adicional

- Persistencia: cuatro casos RED demostraron que un booleano corrupto de guía schema8 eliminaba la metadata opcional y permitía autosave sobre progreso fiable. Ahora esa ambigüedad bloquea carga/escritura operacional sin tocar original ni backup. No cambia reglas ni schemas; utiliza el mismo descriptor explícito para prevalidación y validación. Diez tests aislados nuevos: roundtrip exacto (incluidos ceros/extensiones desconocidas), migración7→8 idempotente, cuatro hitos dañados, colisión legacy, schema futuro, fallo al proteger original y autosave fallido. Regresiones focales R1–R3/guía: 213 PASS.
- Foco: tres casos RED del selector compacto por apertura programática sin foco previo; foco al activador antes de abrir, luego siete casos PASS de cierre/restauración/contexto/confirmación.
- Ajustes: RED real por reinicio/atajos fuera de viewport móvil; secciones explícitas y paginación conservando los diez atajos. Los cambios locales de edición sobreviven al pasar de sección; guardar/restaurar está en una sección explícita. Reinicio con segunda capa cancelable, sin usar confirmación nativa.
- Notificaciones: RED ejecutable del componente real con reloj sintético: un rerender a los1000ms/recreación de callback reiniciaba el plazo4200ms del primer aviso. Temporizadores por ID y callback estable conservan vencimiento original; el segundo conserva su propio plazo. GREEN exacto a4200/5200ms. Nombre accesible para descartar, región live y acción44px; no se modifican premios ni eventos.

### Evidencia medida y límites de cobertura

- Build de round8: verify PASS, 392/392 tests en11 archivos, suite4,57s; typecheck/build/presupuesto/auditoría estructural PASS. JS548,0KiB/560; CSS87,2KiB/90. Las seis curvas económicas exactas se conservan sin recalibración.
- Diagnóstico principal round8: 210/210 normales20,24s; 210/210 zoom equivalente18,95s; 210/210 pseudo+40%24,58s. Diálogos9/9 PASS13,11s. GPU real AMD RX7600XT / D3D11 / driver32.0.31036.15; controles independientes en paralelo, sin afirmar speedup causal de GPU.
- **No cerrar R4 con esas cifras.** El detector inicial medía botones, no todos los inputs/selectores/SVG. Al ampliarlo, round9 reprodujo30 casos de Ciudad (áreas de marcadores demasiado pequeñas) y2 de Plantel (orden tapado por paginación horizontal). Eso invalida cualquier extrapolación del PASS anterior a esos controles.
- Ciudad compacta: mapa ilustrativo, no falsas acciones táctiles pequeñas; selector44px conserva las seis propiedades y las acciones. Mapa amplio: interacción por teclado y zonas transparentes calculadas desde escala real, conservando dibujo. No se eliminan decisiones ni compras. Se verifica explícitamente la alternativa nativa, no se excluye un control accionable para esconder un fallo.
- Nueva matriz de detalles: ajustes y plantel rápido, diez tamaños, zoom equivalente y expansión+40% también en portales. Primera tanda:19/20 PASS, corte en atajos844×390; corregido título duplicado ya comunicado por selector,20/20 PASS36,64s. La matriz se amplía a las seis ventanas de inmuebles; resultados posteriores deben registrarse antes de aceptar. Se corrigió una expectativa errónea del harness (siete inmuebles); los seis IDs del catálogo se comprueban exactamente y ese fallo no se atribuye a producción.
- Capturas realmente inspeccionadas: Gimnasio768×1024 (nombres superpuestos), Gimnasio390×667 con estrés (barra inferior sobre figuras), Gimnasio844×390 con estrés, Ajustes844×390 con estrés (paginación de atajos debajo del borde). Estos defectos motivan correcciones; no son capturas aprobadas ciegamente.
- Máximo de plantel corregido en el fixture: circuito real `pro`, no `profesional`; assertions exactas de30 pugilistas y10 profesionales cargados. Aún no equivale a máximos de empleados, mensajes, equipos, títulos y todas las capas.
- Catálogo:91 claves tipadas en tres idiomas, con igualdad de claves/parámetros. Se enlazan navegación, filtros, ajustes, estaciones y acciones nuevas. **Catálogo global incompleto**: inventario AST vigente conserva candidatos en19 fuentes; hay falsos positivos/expresiones dinámicas. No habilitar inglés/pt-BR ni presentar esas91 claves como cobertura del juego completo. Falta contenido nuevo, plantillas históricas fiables y separación contable de textos.

La continuación sigue siendo autorizada: completar catálogo, composición/legibilidad fuera de botones, overlays restantes (ficha/combate/archivo/ranking/eventos/cierre), estados extremos y evidencia final exacta. No hubo merge, publicación, Pages, R5 ni BOX-15. Partida personal/origen3000 excluidos; capturas ajenas de scratch preservadas y fuera de commits.

## Continuación 2026-10-03 — evidencia ampliada, no aceptación de R4

**Dictamen vigente: NO APTO para cerrar R4.** Esta sección sustituye extrapolaciones de resultados parciales, no borra las reproducciones anteriores. La autorización continúa en el mismo PR #6; no hace falta otra decisión para continuar los bloques pendientes.

### Correcciones y reproducciones nuevas

- Plantel: RED de superposición de tarjetas durante el reflow de Framer Motion, incluyendo botones tapados. Se retiró únicamente la animación de redistribución `layout`, no tarjetas, acciones ni efecto hover. Capacidad calculada con ancho mínimo300px, alto170px y paginación medida. El activador ya no se remonta como un tipo React definido dentro del render: cancelar transferencia restaura foco al mismo nodo.
- Archivo histórico: RED por una extensión desconocida de atributos tratada como clave traducible; ahora los once atributos conocidos y tres datos derivados son seleccionables, y las extensiones se ofrecen como registro histórico literal paginado. RED adicional por no reiniciar páginas entre dos resultados con texto idéntico y por paginadores fuera del borde horizontal; claves por ficha/resultado y capacidad40 en historial. Se verifica igualdad exacta del fixture archivado después de cargar, todos los resultados y reconstrucción del texto original, incluidos ceros y extensiones anidadas. No se modifica el snapshot.
- Inicio: RED390×667 con emblemas/CTA/footer fuera de pantalla. Secciones explícitas para nombre, gimnasio, emblema, partidas y ayuda, sin cambiar el comando de nueva carrera; datos introducidos sobreviven al cambiar sección. RED horizontal posterior del footer en ayuda; eliminado título duplicado que ya anuncia el selector. Confirmaciones de nueva partida/borrado usan la pila compartida, no diálogos nativos. Las pruebas actuales de inicio aún NO cubren todas las ranuras ocupadas o fallos de borrado.
- Gestión: RED ejecutable al elegir pase profesional y cambiar a otro amateur no elegible. El `<select>` mostraba Ofertas mientras React conservaba `profesional`, dejando el contenido vacío. Se reinicia solamente la acción de presentación y la confirmación de transferencia al cambiar ID. GREEN4,85s: ofertas visibles, vuelta a la primera ficha y estado de carrera idéntico.
- Interlineado: los rangos reales de texto revelaron glifos de19px contenidos en líneas de18,2px. El piso de14px conserva ahora interlineado1,4; los párrafos admiten cadenas sin espacios. No se redujo el tamaño ni se elevó tolerancia del detector. Etiquetas de estaciones estaban situadas4px por encima de un contenedor que recorta; ahora quedan dentro.
- Cabecera compacta: conserva fecha/caja sin ellipsis y un acceso de44px al estado completo. Nombre completo del club/coach, emblema, calendario, ceros, mejoras y legados se reconstruyen desde páginas literales del detalle. RED del detalle horizontal con Semana rápida inaccesible; GREEN10/10 tamaños21,94s tras paginar el texto y conservar la acción fuera de las páginas. Un fallo intermedio fue del harness: pseudo modificaba el nombre accesible del diálogo y un locator exacto quedaba obsoleto; se corrigió la selección del diálogo, no la assertion sobre los datos.

### Evidencia y límites, con artefactos identificados

1. `npm run verify` del código de esta tanda: **410/410 tests,13 archivos; suite4,61s**; typecheck, build, presupuesto y auditoría estructural PASS,0errores/0advertencias estructurales. No se modificaron las assertions ni las seis curvas económicas exactas. Advertencia informativa Vite de chunk>500kB conservada.
2. Build de verify: `index-D_xHqa8n.js`,573197bytes/573440; `index-BZ_nkTAw.css`,92065bytes/92160. Margen pequeño explícito; no se elevaron presupuestos. Inglés/pt-BR son recursos validados y español continúa embebido para arranque offline. Assets y sus hashes se registran por cada informe de navegador.
3. Build anterior `index-KMy4Fid1.js`: **210/210 pestañas26,01s**, diez tamaños×tres estados×siete pestañas, zoom equivalente CSS/DPR1 y pseudo+40%; **60/60 diálogos245,85s**, seis familias×diez tamaños, mismos estreses. Miden acciones, hit-testing, fuentes y footer, NO todos los rangos de texto. Capturas de inicio390×667 y archivo844×390 realmente inspeccionadas. No reutilizar estas cifras como prueba de cambios posteriores de cabecera/interlineado.
4. Al añadir `--text-bounds` se comprueban rangos reales contra viewport y todos los ancestros que recortan, además de fuentes y controles. Primer RED:210/210 casos fallidos35,74s. Tras interlineado/ajuste de palabras y correcciones de cabecera/estaciones, sobre el build de verify: **161PASS/49FAIL de210,27,48s**, fingerprint estable. Hay449 incidentes de texto recortado y3 de hit-testing; son incidentes dentro de casos, NO449 bugs independientes.
5. Los49 casos pendientes se agrupan por pantalla: Calendario21, Plantel22, Gimnasio3, Perfil3. En Perfil390×667 el contenido del curso invade el selector de rama; añadir `shrink-0` no resolvió la causa de distribución, según la reproducción actual. No ocultar ese control ni aumentar tolerancia para conseguir verde. Plantel requiere distinguir presentación compacta de nombre/metadata y acceso completo verificable; Calendario necesita composición de días/agenda compatible con sus pisos. Falta validar agenda realmente máxima, no basta el fixture máximo de boxeadores.
6. Catálogo: **184 claves** con igualdad exacta de claves/slots en es/en/pt-BR, seis enfoques y once capacidades. Recursos rechazados de forma atómica si falta una clave/slot; idioma no se activa con carga fallida. **No es cobertura global**. Inglés/pt-BR siguen deshabilitados. Inventario aún tiene candidatos en20 fuentes; faltan UI/contenido nuevo, errores/ayudas, formatos y metadata fiable histórica/contable.
7. GPU real observada: RX7600XT/D3D11, driver32.0.31036.15. Matrices independientes se ejecutan en paralelo con puertos/perfiles aislados y el build inmutable; se espera servidor, render o animación mediante condiciones. No se atribuye mejora causal de tiempo a GPU sin comparación. RNG medido distingue stream de juego de aleatoriedad de presentación de Framer; no constituye prueba de cero llamadas globales a Math.random.

### Trabajo obligatorio que permanece abierto

- Resolver los rangos de texto y hit-testing RED antes de extrapolar un PASS de controles a toda la composición. Completar matriz sobre el código final, incluidos overlays y capturas inspeccionadas.
- Combate en todas las fases, checkpoints, controles, foco y canvas; agenda/cancelación/vencimiento máxima y los cuatro canales del Panel del Club.
- Todas las categorías/páginas de mercado y personal contratado/excesos históricos; cursos/propiedades/actividades/cierre, rankings/talentos y ranuras ocupadas/fallidas.
- Catálogo global y plantillas conocidas fiables; nunca traducir texto desconocido inventando identidad ni usar traducciones para contabilidad. Paginación Unicode preserva codepoints y texto exacto; segmentación de grafemas combinados requiere comprobación adicional.
- Diferenciar pruebas automatizadas de teclado de certificación manual de lector de pantalla; no confundir viewport CSS equivalente con zoom nativo.

Los originales/backups, schemas futuros y datos desconocidos siguen protegidos por pruebas R1–R3 y diez regresiones nuevas de guía/persistencia. R4 no está cerrado. No se tocó la partida personal ni el origen3000; scratch ajeno no se incluye. No hay merge, despliegue, ejecución Pages, R5 o BOX-15.

### Actualización de la misma tanda — afiche y matriz estricta

La matriz ampliada de **siete familias×diez tamaños** terminó69PASS/1FAIL255,01s, fingerprint estable. El caso pendiente `gym-detail-844x390` detectó que el afiche del gimnasio de70px de ancho excedía el borde con texto legible y pseudo. Se ensanchó a110px conservando el afiche/arte/texto, y se le quitó hit-testing como decoración no interactiva; no se ocultó para silenciar el detector. Caso focal GREEN3,90s; después **10/10 casos de gimnasio GREEN20,421s** sobre el nuevo artefacto. Las otras seis familias tienen60PASS de la ejecución previa y código/CSS correspondiente idéntico: el único cambio de producción posterior fue el afiche de GymView. Eso es evidencia reutilizada por componente, no una nueva ejecución70/70 sobre otro hash.

Último verify sobre esa corrección:410/410,13 archivos, suite4,61s; typecheck/build/presupuesto/auditoría estructural PASS. Artefactos `index-K-carzTg.js`573218bytes (SHA256 `4c78b2980ab1086bb01665474134f9e416c8e6c82e89c9b6cc67af2ddebcd9f0`) y `index-BZ_nkTAw.css`92065bytes (SHA256 `ff96589ba58eb34271155d52c2b689619d02155ef7bd8229ddadd96e861fb728`). No se modificó código después de este build sin nueva prueba.

Matriz estricta de pestañas sobre esos artefactos: **164PASS/46FAIL de210,27,055s**, fingerprint estable;446 incidentes de texto recortado y3 de hit-testing. Se resuelven los tres casos restantes de Gimnasio de la tanda anterior. Pendientes actuales: Calendario21, Plantel22, Perfil3. **NO APTO**: esto no es evidencia final de cierre. Se conserva el RED del selector de rama en Perfil, no se altera la assertion.

Inspección visual adicional tras dos frames y expansión: Gimnasio844×390 muestra afiche/marquesina compitiendo con nombres/figuras aunque sus rangos entren en el viewport. El detector actual no demuestra ausencia de oclusión gráfica del texto no interactivo. Esto permanece como pendiente visual de Gimnasio y exige composición por capas/área útil, no ocultar texto ni considerar el PASS de rangos una aprobación artística. La captura antes de estabilizar el render se descartó como evidencia de aceptación; se conservan únicamente conclusiones de la captura estabilizada. Por tanto46 es el conteo automatizado RED, no el total de defectos visuales restantes.

## Continuación ampliada 2026-10-03 — fuentes compartidas, sin cierre

Esta sección sustituye el estado operacional anterior, no elimina su evidencia RED. Base autorizada `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`; trabajo en PR#6, rama `feature/r4-interface-accessibility`. El commit de esta sección identifica el código medido por los hashes de artefacto siguientes. **R4 continúa NO APTO**: siguen pendientes contratos obligatorios descritos abajo. No hubo merge, publicación, uso de partida personal ni del origen3000.

### Causas y correcciones reproducidas

| Causa | Reproducción/RED | Corrección y evidencia |
|---|---|---|
| Texto completo y estados de Plantel no cabían en la tarjeta mínima |22 casos del RED anterior; nombres/etiquetas largos | Vistas explícitas de nombre, identidad, condición y rendimiento; lectura completa paginada, mismas acciones de licencia/rival/baja. Capacidad por ancho real, nunca una columna forzada por ser compacto. Filtros muestran también la vista actual. |
| Calendario acumulaba resumen y decisiones con alturas fijas |21 casos del RED anterior; tres avisos extensos | Separar semana/agenda/resumen/gestión, lectura íntegra y selección nativa. IDs de presentación prefijados, sin mutar IDs persistidos. |
| Perfil comprimía ramo, curso y paginación |3 casos del RED anterior, selector tapado | Grilla y paginación separadas; detalle explícito del curso con precio/requisitos/compra originales y foco restaurado. Tres ramas recorridas. |
| Gimnasio horizontal tenía oclusión gráfica aunque el texto entrara |Capturas estabilizadas con nombre real largo | Separar pared original de estaciones compactas mediante acceso explícito; reset de variables de transformación, pared con flujo en móvil y figuras/etiquetas en zonas distintas. Prueba de no intersección y capturas inspeccionadas; no rediseño de arte. |
| Bounds verdes ocultaban capacidad desaprovechada |20/210 casos RED al añadir assertions de primera fila y semana completa;25,930s | Grilla compacta usa columnas legibles disponibles; semana completa en tamaños intermedios. Resumen individual disponible donde cabe, sin repetir dinero/globales. Matriz posterior210/210 PASS. La inspección sigue siendo necesaria: no se certifica densidad universal por este mínimo de capacidad. |
| Evento rechazado cerraba la decisión |Reparación de$100 con caja0: RED | Calendario/Panel cierran solo tras desaparecer realmente el aviso seleccionado del estado. Rechazo conserva decisión; aceptación no abre otro aviso automáticamente. |
| IDs antiguos chocaban con actividades virtuales |Avisos con IDs `velada` y `social-0`: RED | Prefijos `evento:`, `pelea:`, `social:` solo en presentación; cuatro opciones únicas, textos/IDs originales y estado exactos preservados. |
| Transferencia horizontal recortaba acciones |1/10 RED a844×390 con nombre largo/pseudo | Explicación paginada separada de CTA;10/10 GREEN20,789s sobre su build. Matriz final la vuelve a incluir. Cancelar/Escape conserva carrera/RNG y restaura foco. |
| Paginación cortaba acentos/emojis compuestos |4 tests RED: acento combinante, ZWJ familiar, bandera, modificador de piel | Segmentación por grafemas;11/11 pruebas de texto GREEN, reconstrucción literal y assertions anteriores conservadas. |
| Contabilidad dependía del texto del préstamo |6/7 tests RED; renombrar desembolso lo computaba como ingreso ganado | Identidad financiera por comando y schema9, migración8→9 explícita/idempotente, colisiones protegidas.7 tests nuevos GREEN más10 operacionales de guía:17/17. Misma caja/préstamo/resultado y dinero ganado exacto294. |
| Resumen confundía contratos futuros con obligaciones actuales |Sábado semana8 con pelea pactada para semana9: RED | Próximo paso usa `peleasVencidas`, no longitud de pendientes. Agenda conserva fecha y bolsa. Etiqueta diaria usa la fecha real del contrato, no supone siempre sábado. |

Los cambios del harness no eliminan criterios: compara energía contra el valor exacto del fixture instalado (0 en los casos de carrera;100 solo donde se exige elegibilidad), navega explícitamente al detalle de gestión y mantiene un locator estable de la capa de aviso al cerrar ventanas anidadas. El antiguo `count==1` de tarjeta compacta se sustituye por capacidad mínima calculada y cobertura exacta de todos los nombres/páginas: la intención es impedir pérdida y desaprovechamiento, no imponer una columna. Primera/última página mantienen assertions diferenciadas por alumnos restantes.

### Evidencia del código actual

- `npm run verify`: **421/421,14 archivos**, suite4,13s; TypeScript/build/presupuestos/auditoría estructural PASS,0 errores/0 advertencias. Las seis curvas económicas exactas y los escenarios deficitarios no se ajustaron. Solo se actualizó8→9 en la expectativa de migración histórica de R2; la igualdad completa y la idempotencia permanecen.
- Pestañas: **210/210 PASS,25,612s**, diez tamaños×tres estados×siete pestañas; zoom viewport CSS/1,25 con DPR1, pseudo de DOM+40%, rangos de texto, fuentes14/12, acciones36/44, hit-testing, footer, scroll global y capacidad útil. Build inmutable. Capturas verdes añadidas para vacíos/máximos a1280×720 y390×844; inspección directa incluyó máximo Plantel1280, semana Calendario1280, Perfil390 y Gimnasio horizontal/pared móvil. No equivale a revisar visualmente cada captura ni a idiomas completos.
- Aceptación funcional: **20/20 PASS,54,606s** sobre el mismo build: selector, foco/pila/Escape, ajustes/contextos/nómina/toast, transferencia/archivo/intro/cambio de gestión, recorridos de Plantel/cursos/Calendario, aviso rechazado/aceptado, panel anidado, IDs legacy y contrato futuro. Cada perfil/puerto/fixture es desechable.
- Matriz ampliada de overlays: **120/120 PASS,480,351s**, doce familias×diez tamaños, zoom CSS/pseudo+40%, rangos/fuentes/hit-testing/foco y lectura completa, build `index-BcArwuVr.js` estable. Familias: ajustes,Gimnasio,Ciudad,ficha,archivo,inicio,estado del club,Plantel,cursos,Calendario,panel de avisos y transferencia. No incluye aún todos los overlays/estados obligatorios del plan54.
- Bundle: `index-BcArwuVr.js`570979bytes, SHA256 `8934b111db58c5c2f139825d6fec6dfcd0f3f54e37d3178adcc29cef9540be87`; `index-jaXA5Yt9.css`92036bytes, SHA256 `b69ca51af3b2fc24167072f71a6ef7378a8a6b57f577fd528461ac175bab7d89`. Límites sin cambios:573440JS/92160CSS.
- Comparación controlada de minificadores sobre el mismo código: esbuild575796bytes/2,702s frente a Terser570979bytes (build Vite2,85s; tiempo total verify separado). Esbuild excedería el presupuesto en2356bytes. Terser reduce4817bytes sin sacar código a recursos no contabilizados, cambiar target ni habilitar opciones inseguras; dependencia de desarrollo fijada5.51.2. No es un speedup: se adopta por tamaño, aceptando el costo medido.
- Catálogos: **241 claves exactas por es/en/pt-BR**, parámetros verificados. Recursos externos medidos: en11236bytes,pt-BR11863bytes; no se ocultan en las cifras de JS. Calendario/controles de eventos migrados a claves; singular de vencimiento corregido. Inglés/portugués continúan deshabilitados porque el catálogo global aún es incompleto.
- GPU: Radeon RX7600XT, driver32.0.31036.15, navegador ANGLE/D3D11. Existe además integrada Radeon32.0.21045.1000. Pruebas independientes en paralelo, puertos5236/5237/5238 y build estable. No atribuir ahorro de tiempos a GPU sin comparación causal.

### Límites obligatorios todavía abiertos

1. Catálogo global y metadata fiable de contenido/errores/toasts/historia nueva:241 claves NO cubren todo el juego. Textos desconocidos no se traducen por coincidencia difusa. La identidad contable ya no depende de etiquetas, pero falta la presentación global localizada de todos los movimientos/contenidos.
2. Estados extremos completos de Mercado/Personal/propiedades/recaudación/cierre/legado, prensa/consejos/patrocinio activo y todas las fases de combate/esquina/final/recarga. La matriz ampliada no certifica superficies que no recorre.
3. Revisión óptica completa de simetría/densidad y todos los assets superpuestos; la primera fila mínima no demuestra que cada tarjeta aproveche óptimamente toda altura disponible. Máximos de vitrinas/espera/títulos y compatibilidad de `Intl.Segmenter` en navegadores objetivo requieren evidencia específica.
4. Certificación manual con lectores de pantalla y cobertura global de movimiento reducido no se sustituyen por Tab/Escape automatizados.

La autorización de continuación sigue vigente; estos pendientes no requieren otra autorización y no justifican declarar apto el gate ni avanzar a R5/BOX-15. Pages se inspeccionó sin ejecutarlo: únicamente `workflow_dispatch`, confirmacióntrue y `refs/heads/main`, sin modificación del workflow.

### Adenda posterior: identidad dañada y build vigente

Revisión crítica de schema9 encontró que una clase contable inválida podía desaparecer en la reparación local, convirtiendo financiación en ingreso operativo. Cuatro reproducciones nuevas RED (libro de ingresos/gastos y resumen de ingresos/gastos) exigieron rechazo sin escribir original ni backup. Guardas explícitas del schema9 las llevan a GREEN; no se elimina metadata dañada para habilitar pagos. La prueba no añade reglas ni defaults económicos.

Último `npm run verify`: **425/425,14 archivos,4,06s de suite**, typecheck/build/presupuesto/auditoría estructural PASS. JS vigente `index-BSrWbQ5D.js`571297bytes, SHA256 `da58101bd72b41da256042080a49346d34fb4ab986ed30030243408ce47e63d7`; CSS sigue92036bytes/SHA256b69ca51af3b2fc24167072f71a6ef7378a8a6b57f577fd528461ac175bab7d89. Presupuesto intacto.

Sobre ese último artefacto se repiten210 casos de pestañas y20 funcionales con PASS y fingerprints estables; tiempos/casos/build exactos quedan en `docs/audits/evidence/r4_shared_composition_2026-10-03.json`. Los120 overlays PASS anteriores se conservan como evidencia por componentes UI/CSS y fixtures sanos idénticos; **no se presentan como120 ejecuciones sobre el nuevo JS**. Al cierre completo de R4 habrá que terminar y ejecutar la matriz obligatoria sobre el código final de todo el alcance. No reconstruir dist durante las pruebas ni sustituir casos faltantes por estos conteos.

Estado: NO APTO para aceptar R4; los cuatro pendientes obligatorios anteriores continúan. No hay una nueva decisión de diseño que requiera frenar los bloques independientes.

## Continuación2026-10-04 — checkpoint abierto, no aceptación

Se preservó el trabajo local anterior y se comprobó primero el aviso vencido. RED: `Confirmar respuesta` estaba habilitado aunque EVENTO rechaza venceEn<=0. GREEN: botón deshabilitado conforme al motor, lectura explícita «Este evento ya venció», estado y RNG exactamente intactos; 2,798s sobre el build vigente. No eliminar el registro ni modificar fechas/reglas de expiración.

Panel del Club: Prensa y Patrocinio activo conservan todos los textos y semanas en detalles paginados, sin listas ilimitadas ni nombres que expulsen acciones. Consejos separa hitos/historial/orientación/licencias/finanzas en acceso explícito; razones de archivo y cobros históricos se conservan literalmente. La recompensa se muestra antes de habilitar Cobrar, y el préstamo informa las condiciones actuales $500→$600/10 cuotas de $60; ningún parámetro cambia. El test de cobro compara exactamente ingreso de $80, fama+2, línea contable original, recarga y ausencia de segundo cobro.

Traducción: todas las etiquetas estáticas del Panel están catalogadas. Los diez objetivos conocidos de Anselmo se traducen solo si objetivoConsejo(ID) y texto exacto coinciden con la plantilla canónica. Texto/ID desconocidos quedan literales e identificados como registro histórico. Esta presentación pura no escribe ni paga ni inventa identidad. Nuevos tests: cinco RED de seis para traducción/compatibilidad, luego seis GREEN. Se detectó una clave duplicada introducida durante esta ampliación; dos tests RED→GREEN verifican los recursos antes de que JSON.parse pueda ocultarla. Se conserva la clave y redacción histórica original.

**Verificación actual:** npm run verify PASS,433/433,15 archivos,4,25s de suite; typecheck/build/presupuesto/auditoría estructural PASS. Artefacto JS index-Bjj631L4.js573312bytes, SHA25693cf41df810b9fb8c7c75bbcd5b6ff856fcf5bd92b59aa50c1fed00f1d31213a; CSS index-0fT3o0a0.css91796bytes, SHA256323c19741f70287d9ce8c713a20ac1cd14863c94c49dd1216a23de9dfc4d34fb. Límites573440/92160 intactos: margenJS128bytes yCSS364bytes, no subir límites. Recursos externos de texto medidos aparte: en14682bytes,pt-BR15510bytes,298 claves exactas cada uno. Inglés/portugués siguen deshabilitados porque la cobertura global no está terminada.

**Sobre ese artefacto estable:** aviso vencido2,798s, Consejo390×667/pseudo+40%/zoomCSS125%8,435s, cobro/recarga4,549s y patrocinio390×667/pseudo/zoom4,151s PASS. Se guardan hashes/casos exactos sin logs ni rutas privadas en docs/audits/evidence/r4_checkpoint_2026-10-04.json. Matrices focales previas: Prensa10/10 en42,363s; Consejos10/10 en67,082s; patrocinio10/10 en25,207s, sobre sus builds identificados en logs locales. No presentarlas como ejecuciones sobre el JS posterior. Se inspeccionaron visualmente capturas del Panel390×844 y patrocinio1280×720; no certifican todos los detalles/estados. La matriz final completa se reserva para el cierre sobre build estable; el runner amplía a17 familias×10 tamaños, todavía no ejecutadas en conjunto.

Rendimiento: controles aislados de Consejo/Patrocinio en paralelo, puertos/perfiles separados, RX7600XT/ANGLE D3D11 activo. Sin afirmar ahorro causal de GPU. Una ejecución inicial de Prensa coincidió con una reconstrucción de dist y tuvo timeout de arranque: no se usa como evidencia GREEN; se repitió10/10 estable. Las pruebas actuales no reconstruyeron dist mientras lo consumían. Comparación aislada del mismo código con Terser compress.passes=2:572465bytes,3,457s de API, versus573312bytes con configuración vigente. **No aplicado**: requiere validación propia si se utiliza; no afirmar reducción del build actual ni aumento de presupuestos.

**Pendientes obligatorios:** catálogo/formato/contenido/errores globales y plantillas fiables fuera de Anselmo; estados completos de combate, todas las categorías de Mercado/Personal/propiedades/recaudación/cierre/legado; mensajes activos/extremos y plazos; revisión óptica/densidad/simetría/activos extremos; compatibilidad Intl.Segmenter y evidencia manual accesible. Las matrices previas210/120 no cierran superficies que no recorrieron ni constituyen matriz final del código actual.

PR6 continúa borrador y R4 NO APTO. Se preservan las dos capturas ajenas de scratch sin incluirlas, la partida y las ramas. No cambios en reglas económicas/deportivas, ni R5/BOX15, merge, Pages o despliegue. El checkpoint no es una entrega de aceptación.
