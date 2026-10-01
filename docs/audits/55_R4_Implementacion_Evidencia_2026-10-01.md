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
