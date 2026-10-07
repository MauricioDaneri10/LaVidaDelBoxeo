# Revisión crítica del PR #6 — R4

## Identidad y dictamen

Base revisada: `8b0075ea35fb23d6f4d797fd2da647fd14fe9ce3`. Head recibido: `915f852d61f8a0ad81b1cbc0af015487fea64c1a`. Código de la evidencia previa: `7262e319025175ee6560b9cdf2d252048ccb8b00`.

Entre el código probado y el head recibido solo cambiaron nueve archivos documentales: informe55, manifest, cinco canónicos, contexto y plan54. No cambiaron producción, tests, recursos ni workflow. La evidencia previa era aplicable a ese código, pero no cubría todos los casos adversos encontrados en esta revisión.

**Dictamen: APTO para integrar dentro del alcance R4, pendiente decisión del usuario.** Código final revisado `6c715786a6cf5d98b6f4eff23baef856207a57b9`; harness final `d9efc91f35aa42b9908954acb804b758bad568a8`. El commit documental posterior conserva exactamente esa producción. PR permanece en borrador. No merge, Pages, despliegue, R5, BOX-15, nueva estética ni acceso a la partida real/origen3000. Ningún bloqueo R4 identificado permanece abierto; los límites siguientes no son una certificación integral.

## Defectos reproducidos y corregidos

| ID / gravedad | Causa y reproducción | Corrección y evidencia RED → GREEN |
|---|---|---|
| C1 / P1: pérdida de extensiones | `fields` confundía claves propias JSON `constructor`, `toString` y `__proto__` con campos heredados del esquema. Era una debilidad heredada del validador genérico, relevante para las migraciones R4. | Cuatro tests nuevos, schemas7/8/9/10: **4FAIL/18PASS antes**; conservación exacta, prototipo normal, roundtrip y copia de recuperación después. Usar propiedad propia del esquema y definir extensiones JSON sin activar el setter `__proto__`. La inferencia de equipamiento también exige clave propia. No inventar los datos que ya hubiera perdido una versión anterior. |
| C2 / P2: foco perdido tras contratar | El disparador de una confirmación anidada permanece conectado, pero la contratación lo deshabilita; `.focus()` no devuelve el foco al diálogo padre. | Reproducción Chromium móvil **FAIL1,613s**. Restauración comprueba foco efectivo y disponibilidad; fallback dentro de la capa superior o control disponible del root. Caso GREEN2,070s. Se mantienen Tab/Shift+Tab, Escape, inert y guardas del motor. |
| C3 / P1: carrera de restauración de idioma | Durante la descarga de inglés, la preferencia pasa a portugués aún no cargado; el arranque informaba éxito y montaba GameProvider/autosave en fallback español. | Unitario **1FAIL/11PASS antes** y navegador **FAIL1,788s**. Exigir catálogo validado para la preferencia vigente antes de informar éxito; retry explícito carga portugués. GREEN1,797s, partida original sin modificar mientras está pendiente. Otros dos tests nuevos verifican que la última selección gana y que su fallo no permite activar una anterior. |
| C4 / P2: cursos cortados en Perfil amplio | A1920×1080, nombres largos y cabecera expandida dejan menos canvas que el presupuesto del perfil completo; las compras quedan bajo el footer aunque la ventana sea alta. | Dos casos nativos RED con CTA a1066,906px y footer por encima. `ResizeObserver` mide el área neta; composición compacta existente cuando no cabe resumen+navegación+ramas+tarjetas legibles. Resumen y compra permanecen accesibles mediante controles explícitos. Cuatro focales nativos GREEN19,89s, incluyendo lectura/cancelación de cierre/legado sin mutar el estado. |

No cambia schema10, fechas, premios, RNG, precios, ingresos, salarios, riesgo, cupos ni reglas deportivas. No se recuperan ni fabrican registros perdidos. Los cambios mínimos de producción están en `saveValidation.ts`, `dialogs.ts`, `i18n/index.ts` y `components/panels.tsx`; regresiones en `r4-content-persistence.test.ts`, `i18n/language.test.ts` y harnesses R4.

## Revisión de contratos y calidad de evidencia

- **Migraciones:**7→8 deriva guía solo de evidencia sana;8→9 separa financiación mediante plantilla legacy exacta aprobada;9→10 no deduce identidad de prosa. Colisiones reservadas, guía dañada, metadata inválida y schemas futuros bloquean escrituras. Originales se protegen antes del commit y backups incompatibles no se sustituyen silenciosamente. Los tests nuevos amplían la conservación de extensiones; no se presenta un test nuevo como garantía universal de cualquier corrupción.
- **Guía:** confirmación ambigua de Completo sigue explícita; licencia fiable o archivo competitivo fiable permite inferencia aprobada. Hitos no retroceden por altas/bajas/cambio de enfoque. Paso pendiente usa alumnos actuales cuando salen los iniciales; no inventa elección si no queda alumno.
- **Catálogo:**1175 claves exactas por es/en/pt-BR, slots coincidentes y recursos sin duplicados; validación precede activación.404/offline/JSON dañado/retry y selección concurrente se ejercitan. Interpolación conserva nombres, ceros y datos desconocidos. Cambiar idioma no cambia importes ni semilla; contabilidad usa identidad, no traducciones. Inventario AST revisado: literales restantes son marcas, abreviaturas o arte, no decisiones nuevas pendientes de traducir. Inventario/paridad no certifican por sí solos calidad lingüística humana.
- **Diálogos:** cierre real del selector sin regeneración; pila, inert, Escape por capa, confirmaciones reales, foco y pago/checkpoint intactos. C2 era un caso omitido importante, no una mera diferencia óptica.
- **Matrices:** identidades incluyen familia, viewport, estado y locale; comprobar unión sin duplicados, hashes y ausencia de errores. Fortalecida la matriz canvas: espera autosave y exige igualdad completa del fixture instalado tras cargar y navegar cada pestaña, no solo30 boxeadores o10 profesionales. Overlays verifican fixtures específicos, recorren páginas/secciones, pulsan acciones positivas y comparan efectos exactos.
- **Harness:** una ejecución nativa adicional de520 casos detectó2 cortes de Perfil y3 fallos de locator en planificación/combate (515PASS/5FAIL). No se utiliza como aceptación. El recorrido ahora distingue planificación inline y selector compacto, y busca cartelera en `.app-nav`, no en una clase inexistente. Medición de confirmación financiera espera `data-animation-ready`: una escala de entrada transitoria no modifica los mínimos36/44 ni sirve de zoom. Nada se oculta para obtener verde.
- **Economía/R1–R3:** assertions de los seis escenarios económicos exactos siguen sin cambios. Se repiten guardado/archivo/errores y combate parcial/esquina/final/pago único sobre el candidato nuevo; el número525 no sustituye esos recorridos.

## Presupuesto

JS `index-D8aU2KBJ.js`: **572902/573440bytes**, margen **538**; CSS `index-C9SAbxas.css`: **86239/92160**, margen **5921**. Incremento JS409bytes respecto del candidato recibido, CSS y catálogos idénticos. Contabilizar también HTML/favicon y JSON: cifras y SHA256 exactos en el manifest de revisión. Sin nuevos chunks, funciones eliminadas, límites ampliados ni recursos movidos fuera de medición. Warning Vite de chunk>500kB permanece.

Margen538bytes es un riesgo de mantenimiento, no holgura. Cada próximo cambio exige volver a medir; no subir el presupuesto para aceptarlo. GPU RX7600XT/driver32.0.31036.15 con ANGLE/D3D11 y compositor/raster habilitados; matrices independientes en paralelo, artefacto inmutable y puertos/perfiles aislados. No se atribuye un porcentaje de aceleración GPU sin comparación causal.

## Evidencia final y límites

Evidencia exacta en [manifest de revisión](evidence/r4_review_2026-10-05.json); el manifest anterior permanece histórico, no se modifica para atribuirle el candidato nuevo.

- `npm run verify`: **525/525,23 archivos**; suite4,67s, build3,99s, TypeScript/budget/auditoría estructural PASS,0 errores/0 advertencias estructurales. Cambios posteriores al verify: únicamente harness y documentación; producción idéntica.
- Canvas: **1470/1470 PASS**,490 únicos por idioma,66,355/66,829/67,129s. Diez tamaños×siete pestañas×siete estados, pseudo+40%, CSS125/DPR1, fixture completo exacto antes/después de navegación, hashes inmutables.
- Overlays: **520 identidades únicas con cobertura efectiva PASS**,52 familias×diez tamaños. La tanda original fue **518PASS/2FAIL**, no520 verdes: lectura prematura de navegación de Perfil en actividad y legado. No fueron nuevos cortes del producto. Esperar los frames de layout antes de elegir el control; assertions económicas, datos, fuentes, bounds, foco y acciones sin cambios. Repetición íntegra de actividad10/10 en27,377s, cierre10/10 en33,801s y legado10/10 en34,298s reemplaza esas30 identidades, no se suma para afirmar550 casos distintos. Los otros490 casos conservan código de producción exactamente idéntico; todos los fingerprints coinciden. Shards originales278,619–680,179s: el manifest conserva fallos/timing y supersesión, no oculta el RED.
- Suplemento nativo: **40/40 PASS**,cuatro familias×diez tamaños sin zoom simulado; shards26,396–77,823s. Foco/pila/notificaciones/densidad nativos:11/11 PASS20,058s y1/1 PASS3,605s.
- Navegador R1: **5/5 PASS16,421s**, promoción/recarga/archivo1280×720 y1440×900, lleno/denegado/schemafuturo. R2: **8 comprobaciones PASS12,187s**, parcial/última caída recuperable/esquina/final/pago único en ambos tamaños. Seis escenarios económicos exactos PASS sin cambios en assertions ni salidas esperadas.
- Inicial JS+CSS+HTML+favicon: **660424bytes**; con en729847, con pt-BR733966; total distribuido con ambos catálogos **803389**. No nuevos chunks ni recursos fuera de medición. SHA256 JS `97dda9801a4a95fe03ab18e902c61ac2786e951538b8c32ff8c3e7617fef4d73`; CSS `258aa070bf969617f061f7617292a79e0756666b41d34cf15136007e8eb28f71`.

La cifra520 describe cobertura efectiva sobre el mismo artefacto, **no una única ejecución íntegramente verde ni la misma revisión de harness para todas las ejecuciones**. No se repite verify por cambios exclusivos de documentación/harness. El costo mayor son recorridos exhaustivos de detalles/páginas, no el build; ejecución independiente en paralelo no implica un speedup GPU medido.

Diff adicional a la entrega recibida: cuatro archivos de producción, cuatro archivos de tests/harness, documentación y nuevo manifest; no workflow, parámetros ni arte nuevos. Se preservaron y excluyeron los dos PNG R1 ajenos, inventarios/logs locales, dist y capturas. Revisar el hash documental final en el PR; este archivo no intenta autocontener su propio commit.

La revisión visual es por muestras representativas, no aprobación humana de cada captura. Chromium únicamente; no certificación Firefox/WebKit, dispositivos físicos ni lector de pantalla humano. Zoom es equivalente CSS/DPR1, no `deviceScaleFactor` presentado como zoom. Historia desconocida queda literal identificada conforme a la decisión aprobada.

El workflow no cambió: exclusivamente `workflow_dispatch`, confirmacióntrue y `refs/heads/main`, con verify/build/budget antes del deploy. No se ejecutó. Aceptar R4 dentro de su alcance no acepta R5/BOX-15 ni certifica el juego integral o ausencia de todos los errores futuros.
