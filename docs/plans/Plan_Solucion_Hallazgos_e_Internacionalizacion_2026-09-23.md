# Plan de solución de hallazgos e internacionalización

## La Vida del Boxeo · Documento de implementación y cierre

**Fecha:** 23 de septiembre de 2026  
**Alcance:** reglas, economía, progresión, persistencia, UI, UX, textos, accesibilidad, pruebas e internacionalización.  
**Fuera de alcance:** assets 2D/3D, modelos, animaciones y arte final.

---

## 1. Objetivo

Convertir los hallazgos de la auditoría completa en un plan ejecutable, verificable y ordenado por riesgo. El objetivo no es solamente “corregir bugs”: cada sistema debe tener una fuente de verdad, una interfaz comprensible, una prueba reproducible y un texto preparado para cualquier idioma.

El plan se divide en:

1. Integridad competitiva y datos.
2. Carrera de los boxeadores.
3. Economía y eventos.
4. Persistencia y compatibilidad.
5. UI, UX y canvas sin scroll.
6. Limpieza técnica.
7. Internacionalización completa.
8. Pruebas, playtest y cierre.

No se debe avanzar a assets finales hasta cerrar los bloques 1 a 8 y completar el playtest de regresión.

---

## 2. Criterio de prioridad

| Prioridad | Significado | Regla de salida |
|---|---|---|
| P0 | Puede romper una partida o permitir una regla inválida | Sin P0 abierto no hay build candidata |
| P1 | Sistema incompleto o contradicción con el diseño acordado | Debe estar resuelto antes del playtest final |
| P2 | Confusión, riesgo de regresión o deuda técnica | Puede ir después de la integridad del motor |
| P3 | Pulido y consistencia | Se cierra antes de publicar |

Cada tarea se considera terminada solamente cuando tiene: implementación, prueba automatizada o manual documentada, revisión visual y texto localizado.

---

## 3. Bloque A — Integridad competitiva

### A1. Enfriamiento entre peleas — P0

**Problema:** el motor guarda `proximaPeleaSemana`, pero la búsqueda manual y la confirmación de una oferta no siempre la respetan.

**Solución:** crear una única regla `puedePactarPelea(boxeador, estado)` y utilizarla en:

- representante automático;
- búsqueda manual;
- selección de oferta;
- confirmación final de cartelera;
- cualquier futura API o evento que programe combates.

La respuesta debe incluir motivo y fecha: “Disponible nuevamente en la semana X”. También debe validar energía mínima, lesión, licencia, pelea pendiente y día elegible.

**Pruebas:** amateur después de una pelea, profesional después de una pelea, energía baja, lesión, pelea pendiente y avance hasta la semana permitida.

### A2. Transferencia con pelea pendiente — P0

**Problema:** retirar o transferir un atleta puede quitarlo del plantel sin cancelar su pelea pendiente.

**Solución:** separar las acciones de negocio:

- `TRANSFERIR_ATLETA`: conserva historia, registra destino y resuelve cartelera;
- `RETIRAR_ATLETA`: cancela o resuelve cartelera según regla explícita;
- `LIBERAR_CUPO`: solo para alumnos sin carrera competitiva.

Bloquear la transferencia si existe pelea pendiente o mostrar una confirmación con consecuencias: cancelación, penalización, pérdida de bolsa y liberación de cupo.

**Pruebas:** transferencia sin pelea, con pelea, con patrocinio asociado, con lesión y con record histórico.

### A3. Requisitos de títulos — P1

**Problema:** los primeros títulos aparecen demasiado pronto y los requisitos están codificados en más de un lugar.

**Solución:** centralizar una tabla `TITULOS` con categoría, peleas profesionales mínimas, victorias, nocauts, ranking, costo y rivalidad requerida. La función `tituloAspirable` debe leer esa tabla; la UI debe mostrar el requisito exacto.

Propuesta inicial a validar durante playtest:

- nacional: desde 10–15 peleas profesionales y record positivo;
- regional: desde 25 peleas profesionales, ranking y record sólido;
- mundial: desde 25+ peleas, ranking alto, victorias y condiciones especiales.

### A4. Paso amateur → profesional — P1

**Problema:** al alcanzar 50 peleas amateurs el cambio puede ocurrir automáticamente, quitando una decisión importante.

**Solución:** convertirlo en una propuesta visible. El jugador debe poder:

- aceptar el salto profesional;
- mantener al atleta amateur;
- ver costo, riesgo, bolsa estimada, calendario y consecuencias.

El atleta que permanece amateur puede seguir entrenando y guanteando, pero no compite por títulos profesionales.

---

## 4. Bloque B — Carrera y gestión de alumnos

### B1. Alumnos recreativos — P1

Agregar una ruta explícita:

`interesado → recreativo → alumno competitivo → amateur → profesional`.

El recreativo paga cuota, ocupa un cupo de entrenamiento configurable y puede mejorar salud/condición, pero no genera record ni aparece en el ranking. Debe poder convertirse más adelante con una decisión clara.

### B2. Guanteos después de la licencia — P1

Mantener separados:

- `guanteosRealizados`: total histórico;
- `guanteosRequeridos`: requisito de licencia;
- `guanteosDesdeLicencia`: actividad posterior;
- `fogueo`: compatibilidad histórica, si todavía es necesario.

La ficha debe mostrar “10/10 para licencia” y debajo “18 guanteos totales”, evitando que el progreso parezca congelado.

### B3. Lesiones, médico y kinesiología — P1

Convertir `tratamiento` en sistema jugable:

- diagnóstico visible;
- gravedad y semanas restantes;
- tratamiento básico, médico y kinesiología;
- costo, reducción de recuperación y riesgo;
- bloqueo de pelea hasta energía y salud mínimas;
- historial médico resumido.

El personal médico debe ser opcional, con automatización configurable, igual que el Director Técnico.

### B4. Retiro, transferencia y salón de la fama — P1

Definir estados de ciclo de vida: activo, recreativo, amateur, profesional, transferido, retirado y fallecido históricamente solo si el diseño futuro lo requiere. El salón de la fama debe conservar nombre, gimnasio, record, títulos, nocauts y motivo de ingreso.

### B5. Rivales vivos y generaciones — P2

Los rivales deben tener edad, actividad, retiro, reemplazo y club. El ranking debe poder mostrar competidores activos y una sección histórica global, sin hacer crecer la lista indefinidamente.

---

## 5. Bloque C — Economía, eventos y balance

### C1. Fuente única de economía — P1

Toda entrada y salida debe pasar por un libro contable común con:

- fecha;
- semana;
- categoría;
- concepto visible;
- importe;
- origen;
- referencia de entidad;
- balance antes y después.

Las cuotas, bolsas, sponsors, eventos, personal, alquiler, equipamiento, cursos, propiedades, lesiones y financiación deben usar ese mismo registro.

### C2. Resumen diario, semanal, mensual y anual — P1

Agregar vistas progresivas:

- diario: qué ocurrió y qué queda pendiente;
- semanal: ingresos, gastos fijos, variables y resultado;
- mensual: tendencia y principales categorías;
- anual: crecimiento, temporadas negativas, títulos y rentabilidad.

La previsión debe distinguir “seguro”, “probable” y “variable”, y mostrar peleas/eventos ya agendados.

### C3. Eventos y patrocinio idempotentes — P1

Cada acción debe comprobar nuevamente el estado al ejecutarse: vigencia, fondos, cupo, sponsor activo, frecuencia y versión del evento. Una tarjeta vieja nunca debe aceptar dos veces una recompensa ni reemplazar silenciosamente un patrocinio actual.

### C4. Caja negativa y salvataje — P2

Definir una política clara: interés, límite, consecuencias, aviso, suspensión de compras y opciones de recuperación. Los préstamos y sponsors de emergencia deben ser decisiones con costo, no dinero gratis.

### C5. Equipamiento y propiedades — P2

Mostrar si cada compra es del club, de un boxeador o de todo el plantel. Separar inversión única, mantenimiento y mejora activa. Antes de comprar, mostrar requisito, efecto, costo total y posibilidad de venta si se implementa.

---

## 6. Bloque D — Persistencia y compatibilidad

### D1. Migraciones versionadas — P0/P1

Reemplazar casts genéricos por migraciones explícitas:

`v1 → v2 → v3 → v4`.

Cada migración debe:

- detectar versión;
- transformar campos;
- agregar valores por defecto;
- eliminar incompatibilidades;
- validar invariantes;
- guardar un registro de migración.

Una partida vieja nunca debe romperse por faltar un array o una propiedad nueva.

### D2. Validación de estado — P1

Validar profundamente atletas, historial, eventos, cursos, personal, pendientes, economía y configuración. Si un dato es inválido, reparar de forma segura y registrar la reparación.

### D3. Guardado automático y ranuras — P1

Mantener guardado automático por acción segura, guardado al cambiar de día y guardado semanal. La pantalla de continuar debe mostrar nombre, fecha, semana, saldo y última actividad. Eliminar ranuras mediante modal propio, no `window.confirm`.

### D4. Exportar/importar JSON — decisión vigente

No debe aparecer en la interfaz de juego. Si se mantiene código interno por compatibilidad o soporte técnico, debe quedar aislado, documentado y fuera del vocabulario visible.

---

## 7. Bloque E — UI, UX y canvas sin scroll

### E1. Contrato de layout

Cada pantalla debe tener una especificación de altura:

- 1280×720;
- 1366×768;
- 1024×768;
- ventana no maximizada;
- zoom 100%, 110% y 125%.

No se permite contenido esencial fuera del viewport. Si una sección crece, debe usar resumen, paginación, modal seguro o vista secundaria.

### E2. Modal seguro

Crear un único modal con:

- encabezado fijo;
- contenido medido;
- pie fijo;
- paginación cuando corresponda;
- cierre por botón y Escape;
- foco accesible;
- alerta visual si falta contenido.

No usar `overflow-hidden` como solución silenciosa para contenido nuevo.

### E3. Componentes visuales compartidos

Centralizar botones, tarjetas, estados, barras, etiquetas, paginación, tooltips, avisos, confirmaciones y estados vacíos. Los botones deben tener jerarquía y ancho natural, sin textos largos que deformen la grilla.

### E4. Accesibilidad y legibilidad

Probar contraste, texto grande, foco de teclado, lectura por pantalla, colores no exclusivos para estados, nombres accesibles de iconos y mensajes de error comprensibles.

### E5. Atajos

Agregar detector de conflictos, tecla reservada, restaurar valores por defecto, descripción de cada acción y bloqueo de atajos cuando el foco está en un campo de texto.

### E6. Flujo diario

El avance de día debe mostrar transición breve y resumen factual: entrenamiento, guanteos, energía, lesiones, mensajes, cambios de economía y pendientes. “Semana rápida” debe resumir los días que saltea.

---

## 8. Bloque F — Textos y vocabulario

### F1. Glosario único

Crear un glosario de producto con definiciones para:

- alumno;
- recreativo;
- amateur;
- profesional;
- guanteo/sparring;
- práctica;
- licencia del entrenador;
- licencia del boxeador;
- Director Técnico;
- consejo de esquina;
- enfoque de entrenamiento;
- record;
- bolsa;
- sponsor;
- ranking;
- salón de la fama.

Cada término debe tener una forma principal visible y sinónimos permitidos solo en textos explicativos.

### F2. Mensajes y estados

Revisar todas las etiquetas para que cada estado responda: qué pasó, por qué pasó, qué puede hacer el jugador y qué consecuencia tiene. Evitar “victoria segura”, promesas ambiguas y palabras técnicas sin explicación.

### F3. Texto corto + información ampliada

La tarjeta muestra una frase corta. Tooltip o modal muestra la explicación completa. Nunca se debe depender únicamente del tooltip para una acción obligatoria o un requisito de progresión.

---

## 9. Bloque G — Internacionalización completa

### G1. Principio técnico

Ningún texto visible debe quedar escrito directamente dentro de componentes, reducer, motor o datos de contenido. La lógica usa claves estables; la interfaz resuelve esas claves mediante el idioma activo.

Ejemplo conceptual:

```ts
t("training.focus.noqueador.description", {
  effects: [t("stat.power"), t("stat.efficacy")]
})
```

La clave no debe depender de la traducción ni de la capitalización visible.

### G2. Estructura propuesta

```text
src/i18n/
  index.ts
  types.ts
  locales/
    es.ts
    en.ts
    pt-BR.ts
    fr.ts
    it.ts
    de.ts
  formatters.ts
  glossary.ts
  pseudo.ts
```

El español actual será la fuente editorial inicial, pero no debe ser una excepción técnica.

### G3. Catálogos por dominio

Separar claves por dominio:

- `common`: botones, estados, navegación;
- `calendar`: días, meses, fechas;
- `gym`: estaciones y mejoras;
- `roster`: roles, categorías y etiquetas;
- `training`: enfoques, atributos y consejos;
- `fights`: cartelera, rounds, jueces y resultado;
- `economy`: cuotas, bolsas, gastos y balance;
- `city`: ranking, clubes, propiedades y eventos;
- `profile`: cursos, legado y finanzas;
- `phone`: mensajes, patrocinio, prensa y Don Anselmo;
- `settings`: idioma, accesibilidad y atajos;
- `errors`: validaciones y recuperación.

### G4. Variables y pluralización

No concatenar frases manualmente. Usar variables nombradas, pluralización y género cuando el idioma lo requiera:

- `{count} alumno / {count} alumnos`;
- `{amount}` con formato monetario;
- fechas localizadas;
- nombres propios sin traducir;
- unidades y porcentajes localizados.

### G5. Números, fechas, moneda y record

Usar `Intl.NumberFormat`, `Intl.DateTimeFormat` y un formateador de moneda por partida. El idioma no debe cambiar el valor económico; solamente cambia su representación. El record debe tener una plantilla localizada y no concatenarse con strings sueltos.

### G6. Datos del juego

Los datos deben almacenar IDs y no textos finales:

- `focusId: "noqueador"`;
- `traitId: "potenciaGolpe"`;
- `clubName` como nombre propio;
- `eventType: "bingo"`;
- `titleId: "nacional"`.

La UI traduce nombres, descripciones y efectos al vuelo.

### G7. Idioma y guardado

Guardar la preferencia de idioma en configuración de usuario y en la partida solo si se desea conservarla por ranura. Si falta un idioma, usar fallback `es` y mostrar un diagnóstico de claves faltantes en modo desarrollo, nunca en la interfaz normal.

### G8. Traducción completa por etapas

1. Inventario automático de todos los textos visibles.
2. Extracción de textos de componentes, datos, eventos, errores y tooltips.
3. Conversión a claves estables.
4. Catálogo español completo.
5. Selector de idioma y persistencia.
6. Inglés como primer idioma adicional.
7. Portugués brasileño como segundo idioma adicional.
8. Francés, italiano y alemán después del playtest de los dos primeros.
9. Revisión humana nativa y glosario por idioma.
10. Capturas visuales por idioma y pruebas de texto largo.

### G9. Pseudo-localización

Antes de traducir, crear un idioma artificial que:

- expanda textos 30–40%;
- agregue caracteres acentuados;
- altere longitudes;
- detecte textos hardcodeados;
- pruebe botones, modales y tarjetas.

La pantalla se considera apta cuando el idioma expandido no corta información esencial.

### G10. Calidad lingüística

Cada idioma debe pasar:

- revisión de terminología boxística;
- revisión de tono y edad objetivo;
- revisión de género y plural;
- revisión de moneda y fechas;
- revisión de texto corto en botones;
- revisión de texto largo en tooltips;
- prueba de fallback y claves faltantes.

No se deben traducir automáticamente nombres propios, nombres de clubes, apodos elegidos por el jugador ni estadísticas.

---

## 10. Bloque H — Limpieza técnica

1. Eliminar o modularizar las secciones duplicadas ocultas de Ciudad y Cursos.
2. Centralizar títulos, categorías, efectos, vocabulario y requisitos.
3. Separar acciones de dominio de componentes visuales.
4. Retirar `IMPORTAR` de la interfaz o aislarlo como compatibilidad documentada.
5. Sustituir `window.confirm` por confirmaciones visuales propias.
6. Crear un error boundary con código de diagnóstico y recuperación segura.
7. Agregar logs de desarrollo para migraciones, eventos y correcciones de estado.
8. Mantener una sola función para cada regla crítica: pelea, licencia, cupo, economía y traducción.

---

## 11. Plan de pruebas y playtest

### Fase 1 — Motor

Tests unitarios de cooldown, transferencia, títulos, licencias, lesiones, cupos y economía.

### Fase 2 — Persistencia

Fixtures de partidas antiguas, migraciones sucesivas, datos incompletos y guardados duplicados.

### Fase 3 — Integración

Flujo completo: crear partida → entrenar → guantear → licenciar → pactar → pelear → lesionarse → recuperarse → cobrar → guardar.

### Fase 4 — UI

Recorrer todas las pestañas y modales en los tamaños de ventana definidos, sin scroll y sin solapamientos.

### Fase 5 — Internacionalización

Español, pseudo-localización, inglés y portugués. Verificar texto corto, texto largo, fechas, números y moneda.

### Fase 6 — Simulación extensa

Simular como mínimo 120 semanas con:

- caja positiva y negativa;
- alumnos recreativos;
- peleas amateurs y profesionales;
- títulos;
- retiros;
- transferencias;
- eventos y patrocinios;
- partidas guardadas y migradas.

### Fase 7 — Playtest humano

Registrar cada bloqueo, confusión, texto ambiguo, decisión sin explicación, pantalla cortada y resultado económico inesperado. Ningún hallazgo se cierra solo con “funciona”: debe tener reproducción y criterio de aceptación.

---

## 12. Criterios de cierre

El juego puede pasar a la etapa de assets cuando:

- no existen P0 abiertos;
- no se pueden pactar peleas inválidas;
- no quedan carteleras huérfanas;
- la progresión amateur/profesional/títulos coincide con el diseño;
- lesiones, tratamientos y recuperación son comprensibles;
- la economía tiene trazabilidad completa;
- una partida antigua migra sin perder progreso;
- ninguna pantalla corta contenido esencial en las resoluciones acordadas;
- todos los textos visibles usan claves de traducción;
- español, inglés y portugués pasan pseudo-localización;
- el flujo completo fue jugado durante muchas semanas;
- el documento de regresión queda actualizado.

## Veredicto del plan

La siguiente implementación debe comenzar por los dos bloqueantes competitivos, seguir por carrera y economía, y recién después cerrar el sistema visual y la internacionalización. La traducción no debe agregarse al final como una capa superficial: debe incorporarse ahora como infraestructura para evitar rehacer componentes, datos, mensajes y pruebas cuando el juego se publique internacionalmente.
