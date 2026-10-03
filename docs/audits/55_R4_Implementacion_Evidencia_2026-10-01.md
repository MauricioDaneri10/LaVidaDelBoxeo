# R4 — Registro de implementación y evidencia parcial

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
