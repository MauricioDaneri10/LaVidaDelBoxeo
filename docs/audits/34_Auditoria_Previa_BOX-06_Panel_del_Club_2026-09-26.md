# Auditoría previa a BOX-06 — Panel del Club y avisos

**Fecha:** 2026-09-26\
**Estado:** auditoría de alcance; implementación de BOX-06 todavía no iniciada.\
**Objetivo:** comprobar que el próximo cambio resuelva causas y no solo ajuste la apariencia del panel.

## Conclusión ejecutiva

BOX-06 es necesario y su alcance original era insuficientemente preciso: pedía probar densidad, pestañas, consejos y vencimientos, pero no definía el ciclo de vida de los avisos ni pruebas de progresión ilimitada de consejos. La inspección detectó un bloqueo real: Don Anselmo genera consejos `c11+`, pero los hitos que los completan solo están mapeados hasta `c10`. Por eso la repetición de un consejo puede quedar pendiente para siempre. También hay una distinción débil entre novedades actuales y contenido histórico, lo que explica que una pestaña siga pareciendo abierta aunque no haya algo nuevo.

No afirmo que el representante esté contratado ni que su efecto funcione en la partida del jugador: el código ofrece una fila “Personal activo” con nombre cuando `state.personal` contiene el puesto, pero hace falta ejecutar el flujo real bajo sus requisitos y comprobar guardado/carga. Se registra como gate obligatorio, no como defecto ya confirmado.

## Hallazgos

### P1 — La cadena de consejos se bloquea después de los hitos codificados

`src/game/data.ts` define siete consejos iniciales (`c1`–`c7`). Al cobrar uno, `src/game/state.tsx` agrega el siguiente con ID basado en la longitud del historial. `avanzarDia` evalúa condiciones explícitas hasta `c10`; los siguientes IDs no tienen condición asociada. La rotación de textos de recompensa sigue generando objetivos, pero el evaluador nunca los marca cumplidos.

**Riesgo:** progreso imposible, consejo permanentemente pendiente, sensación de recompensa rota y bandeja contaminada con tareas antiguas.

**Criterio de solución:** modelar cada consejo con una condición de dominio evaluable (no deducir comportamiento de un ID sin tipo); para cada consejo encadenado demostrar que su condición puede alcanzarse, que se completa una sola vez y que la recompensa se acredita una sola vez. Prueba determinista más allá de `c10` (mínimo hasta `c15`) y rehidratación guardado/carga.

### P1 — “Hay novedad” mezcla elementos accionables con contenido persistente

En `Phone.tsx`, `hayNovedad` se calcula por la mera existencia de mensajes, patrocinios o consejos listos para cobrar. Las pestañas cuentan eventos activos aunque el usuario ya los haya visto; consejos cobrados continúan en el historial paginado. La pestaña seleccionada vive en estado local de `App`, sin una acción de cierre de escritorio. Esto puede dejar visible/iluminado el Panel del Club sin distinguir entre algo nuevo, algo que requiere decisión y algo ya leído o resuelto.

**Criterio de solución:** definir semánticas separadas y comprensibles:

- **Nuevo/no leído:** contenido que llegó desde la última revisión del canal.
- **Pendiente/accionable:** requiere cobrar, decidir, aceptar/rechazar o resolver.
- **Activo:** evento vigente con vencimiento, se haya leído o no.
- **Resuelto/archivado:** conserva historial útil, pero no prende el indicador de novedad.
- **Toast:** confirmación breve y transitoria, independiente del inbox.

No marcar como leído un evento por el simple hecho de renderizarlo si eso no puede persistirse de forma fiable; probar navegación y recarga. El panel seleccionado no debe confundirse visualmente con una notificación sin leer.

### P1 — Pruebas insuficientes de vencimiento, resolución y límite de avisos

El motor decrementa `venceEn`, descarta eventos vencidos y recorta el arreglo a cuatro al incorporar novedades. Es una protección útil, pero puede descartar eventos activos antiguos por orden de llegada si se supera el límite, sin política explícita ni garantía de visibilidad de eventos importantes. Debe probarse qué ocurre si el usuario no abre la pestaña por varios días, si no tiene dinero para aceptar y si vencen dos eventos el mismo día.

**Criterio de solución:** máximo de avisos activos visible y regla de prioridad/cola explícita; un evento no debe desaparecer antes de su vencimiento solo por la llegada de otro, salvo regla de descarte deliberada con feedback. Resolver dos veces no duplica consecuencias; falta de fondos conserva el evento si todavía se puede elegir; expiración lo archiva y lo quita de pendientes. Las actividades que inicia el jugador siguen siendo distintas de las propuestas de la comisión/barrio.

### P2 — “Confirmar riesgo” no explica la acción

La confirmación de contratación dice literalmente **“Confirmar riesgo”** y aparece junto a “Cancelar”. El aviso previo habla de déficit semanal recurrente; llamar “riesgo” a la acción no indica con precisión qué hará el botón ni cuál es el compromiso asumido.

**Recomendación de microcopia para evaluar en BOX-06:** botón primario **“Contratar igualmente”** y secundario **“Volver”** (o “Cancelar”), manteniendo visible el costo/flujo semanal proyectado. No cambia la regla económica ni implica que el sistema asuma el costo automáticamente.

### P1 — El estado del representante necesita una prueba de flujo completa

La tarjeta de Personal muestra el nombre en “Personal activo” si existe el tipo `representante`, y su botón único deja de ofrecer contratación. Los requisitos de dominio incluyen semana 2 y curso de veladas; además la contratación puede solicitar confirmación si el flujo semanal se vuelve negativo. Aún falta verificar el caso de extremo a extremo en la partida.

**Gate obligatorio:** cumplir requisitos, contratar sin déficit y con déficit confirmado en saves de prueba separados; verificar feedback de éxito, chip/texto inequívoco **“Contratado”**, nombre visible, ausencia de contratación duplicada, persistencia tras cambiar de pestaña y recarga, despido, y efecto de representante sin programar combates duplicados o saltar restricciones. No manipular la partida real del usuario para ejecutar esta matriz.

## Plan BOX-06 auditado

1. **Contrato del dominio:** inventariar toast, evento entrante, patrocinio, noticia, consejo, tarea contextual e historial. Definir estados, persistencia, vencimiento, idempotencia y qué activa cada badge.
2. **Consejos:** sustituir dependencia implícita de IDs `c1..c10` por objetivos tipados/verificables o un evaluador que cubra toda la cadena. Migrar de forma segura partidas antiguas; no borrar progreso, recompensas ni hitos cobrados.
3. **Inbox/eventos:** fijar límite y política de prioridad/cola; conservar los eventos accionables hasta decisión/vencimiento; mostrar fecha límite y motivo de expiración; separar actividad autoprogramada de propuesta externa.
4. **Presentación y estados:** distinguir nuevo, pendiente, activo, resuelto y vacío; conservar historial con paginación sin señales falsas de novedad. Asegurar que abrir/cambiar pestaña/cerrar panel se comporte consistentemente en desktop y móvil.
5. **Personal, transversal:** ejecutar el gate de Representante descrito arriba. Corregir solo fallos demostrados que entren en esta fase; el rediseño general de Personal queda fuera.
6. **Texto:** reemplazar o justificar “Confirmar riesgo” y comprobar que advertencia, CTA, cancelación y feedback usan vocabulario consistente.
7. **Verificación:** unit tests de reducer/dominio, pruebas de persistencia y E2E con eventos/consejos, tamaños de ventana y consola limpia; `npm run verify`; evidencia en informe antes de marcar BOX-06 terminado.

## Matriz de aceptación obligatoria

| Área | Escenarios mínimos | Pasa cuando… |
|---|---|---|
| Consejo | c1–c15, objetivo ya cumplido al generarse, cobro repetido, guardar/cargar | cada objetivo completa una vez, paga una vez y la cadena sigue avanzando |
| Bandeja | 0, 1, 4, 5+ novedades; varios vencimientos; canal no visitado | no se pierden eventos accionables antes de tiempo; contador refleja su semántica |
| Estados | nuevo, leído, pendiente, activo, cobrado/resuelto, vencido | cada estado se comunica sin confundir historial con novedad |
| Caja | evento pagable con fondos y sin fondos; contratación con/sin déficit | una decisión válida se aplica una vez; se entiende el compromiso y la opción de volver |
| Representante | requisitos bloqueados/habilitados, contratar, navegar, recargar, despedir | estado contratado visible y persistente; función no duplica ni invalida peleas |
| Layout | desktop y móvil, panel largo, consejos paginados | panel contenido dentro del canvas/footer; sin recortes ni scroll global inesperado |
| Calidad | suite, build, presupuesto, consola | `npm run verify` pasa y no hay errores nuevos de consola/red |

## Fuera de BOX-06 / cola posterior

- Revisión de Plantel sugerida por el jugador: filtros por valoración, distinguir espera/alumno/competidor y decidir si licenciar libera el cupo de alumnos. Es un cambio de reglas y modelo de capacidad; abrir como seguimiento de BOX-02 y decidir antes de alterar límites.
- Pasada completa de diseño pestaña por pestaña (Gimnasio, Ciudad, Plantel, Mercado, Perfil, Personal y Calendario): se mantiene como trabajo posterior por página, sin añadir contenido repetido para rellenar espacio.
- El efecto de representante se prueba aquí como verificación cruzada, pero automatización avanzada de agenda y expansión multi-sede no se implementan dentro de BOX-06 salvo defecto que bloquee el rol actual.

## Decisión de salida

La auditoría confirmó BOX-06 como siguiente paso. Su implementación y resultado técnico quedan registrados en `35_BOX-06_Panel_del_Club_2026-09-26.md`. El playtest del propietario permanece pendiente; los hallazgos y sus límites no equivalen a certificar el juego completo.
