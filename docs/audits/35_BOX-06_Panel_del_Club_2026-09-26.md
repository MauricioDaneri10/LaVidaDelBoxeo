# BOX-06 — Panel del Club, consejos y ciclo de avisos

**Fecha:** 2026-09-26\
**Estado:** gate técnico aprobado; playtest del propietario pendiente.\
**Auditoría de alcance:** [34 — Auditoría previa a BOX-06](34_Auditoria_Previa_BOX-06_Panel_del_Club_2026-09-26.md)

## Resultado

Se corrigieron causas de progresión bloqueada y señales ambiguas sin tocar el guardado activo del usuario. La suite automatizada verifica la cadena repetible de Don Anselmo, el límite del inbox, las decisiones de eventos y el representante. La pantalla fue inspeccionada en una sesión local aislada; esa comprobación no constituye validación de todos los estados del Panel del Club en navegador ni del guardado del jugador.

## Cambios implementados

### 1. Consejos de Don Anselmo siguen progresando

- La evaluación de hitos está centralizada en `objetivoConsejoCumplido`.
- Los IDs repetibles a partir de `c8` rotan entre tres objetivos: tres alumnos recreativos, 1.500 seguidores y tres victorias oficiales. La correspondencia continúa más allá de `c10` (`c11` hasta recreativos, `c12` seguidores, `c13` victorias, y vuelve a repetirse).
- El objetivo de “ganar tres peleas” usa victorias y ya no se satisface con derrotas/empates por el solo hecho de disputar tres combates.
- El siguiente ID se calcula desde el mayor ID existente, no desde el largo de la lista. Cobrar dos veces el mismo consejo no vuelve a premiar ni duplica su reemplazo.
- Los consejos cobrados se conservan dentro del estado guardado, pero se ocultan de la bandeja visible. Así no se borra evidencia/historial interno ni se llena el Panel con tarjetas ya terminadas.

### 2. Inbox acotado sin descartar asuntos vigentes

- El Panel admite como máximo cuatro eventos activos.
- Los eventos existentes se mantienen mientras estén vigentes. Una llegada nueva solo usa espacios libres; no elimina silenciosamente un evento anterior para entrar en el límite.
- Una acción válida retira el evento y confirma el resultado con un toast; si faltan fondos para una acción pagable, conserva el evento y el saldo. Una segunda resolución del mismo ID no vuelve a aplicar consecuencias.
- Los eventos que no se resuelven expiran según su contador. Los eventos resueltos no se mantienen como historial visible persistente; el feedback de resolución es el toast y la vista de calendario solo refleja eventos vigentes conforme al modelo actual.
- Esta fase no incorpora una cola de espera persistente para novedades generadas cuando ya hay cuatro eventos activos. Las nuevas propuestas adicionales no se agregan a la bandeja. El límite evita inundación, pero el jugador podría no recibir una oportunidad aleatoria en una semana llena.

### 3. Estados y vocabulario más claros

- El contador/badge se presenta como cantidad de asuntos pendientes, no como un estado “no leído”. No se añadió seguimiento de lectura por usuario/canal, porque abrir una pestaña no equivale a resolver un evento.
- Se retiró el pulso constante del panel/tabs cuando hay contenido activo; los indicadores numéricos y el borde seleccionado distinguen los canales sin simular una notificación nueva.
- El estado vacío de Mensajes ahora comunica que no hay asuntos pendientes.
- Los botones de cada evento muestran el texto de la opción concreta (`“Reparar por $120”`, `“Declinar la entrevista”`, etc.) en lugar de los genéricos “Aceptar/No aceptar”.
- La confirmación de déficit de Personal se llama **“Contratar igualmente”** y conserva la alternativa para cancelar/volver. Las tarjetas muestran el chip **“Contratado”** junto a cada miembro activo.

## Pruebas añadidas

En `src/game/game.test.ts`:

1. Un buzón lleno conserva sus cuatro eventos activos al llegar el día de generación; sus plazos avanzan normalmente.
2. Los objetivos c11–c15 se resuelven en ciclo y “tres victorias” no equivale a “tres peleas”.
3. Cobrar c10 genera un solo c11; repetir el cobro no duplica el consejo ni la fama.
4. Contratar Representante lo incorpora una vez, sobrevive la sanitización de guardado y bloquea la contratación duplicada.
5. Una colecta pagable no desaparece si no hay fondos; al rechazarla se retira y una acción duplicada no muta el estado.

Verificación final: `npm run verify` **PASS** — TypeScript, **62/62 tests**, build, presupuesto y auditoría estructural con **0 errores / 0 advertencias**.

El build muestra el aviso ya conocido de Vite porque el JS minificado pesa ~503.65 kB, por encima del umbral informativo de 500 kB. El presupuesto configurado pasa: **491.8 KiB / 560 KiB JS**, **78.4 KiB / 90 KiB CSS**.

## Límites y validación pendiente

- La prueba del Representante cubre reducer, unicidad y sanitización de estado; no se ejecutó todavía un recorrido de UI guardando/recargando una partida real del jugador ni se simuló su agenda semanal completa. La sesión de navegador de inspección quedó en semana 1, antes de los requisitos de contratación.
- El badge significa “hay evento que sigue pendiente de decisión” o “consejo listo para cobrar”; no implementa unread/read persistente. El canal de Panel del Club puede permanecer seleccionado deliberadamente al navegar: permanecer en Don Anselmo no es por sí solo una notificación abierta.
- No se agregó historial durable de eventos resueltos, ni se cambió su generación/economía. Las opciones de barrio y la recaudación propia continúan siendo sistemas distintos.
- Validación de densidad percibida, textos, calendario y frecuencia de notificaciones requiere el playtest del propietario. **BOX-06 no certifica que el juego entero esté libre de errores.**

## Siguiente paso

BOX-06 queda cerrado para su gate técnico. El próximo trabajo puede volver a la pasada pestaña por pestaña que propuso el jugador; las reglas de Plantel (filtros, lista de espera y liberación de cupo al federar) deben definirse como seguimiento de BOX-02 antes de modificar capacidades. Mientras tanto, el jugador puede continuar el playtest y registrar la semana, fecha, pestaña, acción y estado observado si aparece un fallo.
