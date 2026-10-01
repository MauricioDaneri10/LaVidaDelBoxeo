# Contrato de pulido previo al playtest

**Proyecto:** La Vida del Boxeo\
**Versión:** 1.0\
**Fecha:** 2026-09-23\
**Estado:** norma operativa para cerrar el prototipo jugable antes del playtest final del propietario\
**Alcance:** interfaz y canvas existentes, claridad del loop, consistencia de sistemas, pruebas y preparación para futuras expansiones. Assets finales 2D/3D y animaciones quedan fuera de esta fase.

## 1. Objetivo

El próximo playtest del propietario debe servir para valorar ritmo, balance económico, diversión y proponer ideas. No debe descubrir de nuevo que una pantalla está descentrada, que un botón se cortó, que quedó espacio sin criterio, que se repitió un dato o que una acción no explica su efecto.

Para habilitar el playtest, cada pestaña y flujo pasa esta matriz con geometría medida, estados representativos, pruebas funcionales y evidencia reproducible. “Se ve bien en mi pantalla” no es criterio de cierre.

## 2. Regla permanente para cualquier sesión o agente

1. Antes de editar, leer los cinco documentos de `docs/canonical/`, este contrato, el handoff y la auditoría más reciente relacionada.
2. Revisar Git y preservar cambios existentes.
3. Convertir el pedido en hallazgos observables y criterios de aceptación. Un requisito ya registrado no se vuelve a preguntar ni queda solo en el chat.
4. Revisar fuentes de verdad e impacto en código, guardado, economía, calendario, traducción, layout y documentos.
5. Implementar un bloque coherente; no mezclar pulido con rediseño ni agregar contenido para maquillar espacios.
6. Ejecutar pruebas automatizadas, de flujo y visuales pertinentes. Corregir una falla antes de avanzar al bloque siguiente.
7. Actualizar el documento canónico afectado, el informe de fase y el handoff con resultado y evidencia.

Si una solicitud nueva contradice una regla aprobada, registrar la decisión y actualizar la regla antes de implementarla. El propietario no tiene que repetir estándares ya aprobados.

## 3. Invariantes de producto

### Canvas y composición

- El shell reserva espacio explícito para cabecera, agenda, navegación, guías, canvas, Panel del Club y footer.
- En escritorio no hay scroll global. En pantallas pequeñas se usa una composición responsive documentada que mantiene todas las acciones accesibles; no se recorta contenido para aparentar “sin scroll”.
- El footer `MadArt Studios` es el límite inferior visual; permanece visible y no tapa contenido.
- Cada dato tiene una ubicación principal. Caja, fama, seguidores, nómina, previsión y resultados no se repiten dentro de pestañas si ya aparecen en la cabecera.
- El espacio libre se resuelve con grillas, distribución equilibrada, paginación o estados contextuales. Nunca con datos clonados, métricas sin acción ni botones estirados artificialmente.
- Las grillas responden al ancho y alto reales y a la densidad máxima, no solo al estado inicial.

### Simetría y legibilidad

- Elementos de la misma familia comparten alto, padding, radio, borde, tipografía, separación y alineación.
- Icono y texto quedan centrados; cada icono dispone de una caja estable.
- Tarjetas equivalentes reservan las mismas zonas para título, descripción, estado, efecto y CTA. Los CTA de una fila se alinean abajo.
- Nombres, valores y etiquetas no se truncan. El detalle largo pasa a tooltip accesible o ficha/modal.
- Idioma, zoom y nombres largos no deben provocar superposición ni desplazar acciones esenciales.

### Alcance

- Assets finales no se producen hasta que el propietario habilite esa fase.
- Roles, fuentes de dinero y eventos nuevos requieren reglas, costes, límites, feedback, persistencia y pruebas.
- Los textos usan vocabulario aprobado y describen acciones con claridad.
- Una acción automática informa qué hizo y cómo administrarla cuando corresponda.

## 4. Presupuesto de pantalla

```text
Viewport
├── Cabecera global: identidad, fecha, caja, fama/seguidores y avance
├── Mejoras activas (si existen)
├── Agenda semanal
├── Zona de trabajo
│   ├── Navegación
│   ├── Guía compacta: siguiente paso / primeros pasos / previsión
│   ├── Canvas de pestaña
│   └── Panel del Club
└── Footer MadArt Studios
```

- Las franjas de guía no crecen acumulativamente sin límite: una línea principal, detalle breve y modo compacto cuando el progreso ya se conoce.
- El canvas usa el alto restante. Panel del Club mantiene cabecera y pestañas estables y pagina su contenido.
- Si una vista supera el presupuesto, se reduce la cantidad visible o se pagina/modaliza. Nunca se oculta overflow dejando contenido inaccesible.
- En viewport bajo, prioridad: navegación, acción primaria, datos necesarios para decidir, footer. La información secundaria pasa a detalle bajo demanda.

## 5. Matriz pantalla por pantalla

### Inicio, nueva partida y continuar

- Campos, opciones y CTA completos; nombres largos no rompen la composición.
- Continuar identifica partida por nombre/fecha y distingue ranuras cuando haya varias.
- Estados: sin partidas, una, múltiples, nombre largo y guardado inválido con diagnóstico.
- Prueba: crear, guardar, recargar, continuar y confirmar identidad y progreso.

### Gimnasio

- Escena y estaciones tienen límites claros; su uso no depende de assets finales.
- Mejoras compradas y efectos provienen de una misma fuente de estado. Compra, efecto y coste se entienden.
- Estados: inicial, varias mejoras, todas las estaciones y fondos insuficientes.
- Prueba: comprar, avanzar el día y comprobar efecto y persistencia.

### Ciudad

- Mapa y panel de distrito conservan proporción; precio, beneficio y CTA caben completos.
- Ranking Mundial, Salón de la Fama, Talentos y Finanzas Sociales tienen acciones distintas y controles centrados.
- Talento encontrado tiene origen y acción clara; incorporarlo no lo duplica ni lo pierde.
- Estados: sin presupuesto, ubicación comprable/no comprable, talentos vacíos/llenos y ranking corto/largo.
- Prueba: buscar, reclutar y comprobar el resultado en Plantel y guardado.

### Plantel

- Alumnos en formación/práctica, recreativos, amateurs y profesionales están diferenciados.
- Hasta diez alumnos se presentan con dos filas o paginación según el viewport, sin cortar tarjetas ni footer.
- Cupos amateur/profesional se muestran y aplican por separado. Cada tarjeta alinea identidad, valoración, energía, guanteos/record y acción.
- Talento nuevo tiene distintivo temporal y acción para asignar enfoque. Con Entrenador Automático, el enfoque se asigna al incorporarlo y el estado visual confirma el resultado.
- Estados: 0, 1, 4, 10 y cupo lleno; talento nuevo; licencia lista/no lista; lesión; primera/última página.
- Prueba: recorrer grupos, abrir ficha y conservar selección/estado al volver.

### Mercado

- Tarjetas con plantilla común; hasta dos filas en escritorio cuando el área y catálogo lo permitan; en altura baja se pagina.
- Precio, efecto, estado y CTA alineados. No se duplica caja global.
- Estados: fondos suficientes/insuficientes, adquirido, recomendado, catálogo corto y última página.
- Prueba: comprar/no comprar, avanzar semana y verificar efecto.

### Mi Perfil

- Cursos/Bienes Raíces comparten jerarquía. Deportiva, Promotora y Empresarial tienen iconos, texto y alturas centrados.
- Tarjeta de rama y CTA `Ver cursos` están alineados y el CTA aparece una sola vez por flujo.
- Finanzas/actividades sociales e historial viven donde dicta su jerarquía, sin duplicar cabecera.
- Estados: cada rama, curso bloqueado/disponible/completado, bienes raíces con/sin fondos.
- Prueba: alternar ramas, completar acción y comprobar resultado guardado.

### Personal

- Plantilla uniforme con espacio reservado para retrato futuro, contenido flexible y CTA alineado abajo.
- Mostrar hasta cuatro tarjetas por fila cuando caben; paginar el resto sin forzar el mismo conteo en cada viewport.
- Coste semanal, alcance, efecto y despido son claros; despedir no borra historia.
- Ojeador, contador/gerente financiero y nuevos roles permanecen en diseño hasta definir coste, permisos, límites y pruebas.
- Estados: vacante, contratado, fondos insuficientes, límite, despido y varias páginas.
- Prueba: contratar/despedir, cerrar semana y conciliar efecto con libro contable.

### Calendario

- Fecha, actividad y eventos usan la misma fuente temporal del juego.
- Evento muestra inicio, duración, vencimiento, consecuencia y acciones; uno vencido deja de ser accionable.
- La grilla ocupa el canvas sin duplicar la fecha global.
- Estados: semana libre, varios eventos, pelea agendada, vencimiento y resolución.
- Prueba: programar/editar/cancelar según reglas, avanzar días y comprobar transiciones.

### Panel del Club

- Se percibe como unidad cerrada: cabecera, pestañas, contenido y borde inferior.
- Mostrar hasta cuatro tarjetas en escritorio si siguen legibles; paginar cuando excedan espacio.
- Mensajes, patrocinios, prensa y Don Anselmo usan patrones uniformes; una recompensa cobrada no reaparece y se reemplaza según sus reglas.
- Estados: vacío, 1, 4 y más de 4 tarjetas; recompensa pendiente/cobrada; evento próximo a vencer.
- Prueba: cobrar, verificar estado/reemplazo y comprobar idempotencia tras recargar.

### Ficha técnica, modales y combate

- Modal dentro del viewport, cierre visible, foco de teclado y contenido íntegro.
- Atributos en retícula común; licencia con etiqueta única; enfoque recomendado con nombre inequívoco; barras uniformes y detalle largo accesible.
- Estadísticas de combate con nombre `Estadísticas`; controles de avanzar/salir siempre accesibles.
- Estados: primer/último pugilista, nombres largos, baja altura, combate pausado/finalizado y retorno.
- Prueba: abrir/cerrar con ratón y teclado, navegar fichas y evitar duplicar día/resultado.

### Intro, footer y overlays

- Intro y overlays no recortan acciones. Mensajes permanecen o desaparecen conforme a reglas claras.
- Footer `MadArt Studios` no se monta sobre modales, avisos ni controles.
- Prueba: primera carga, viewport bajo, zoom, overlay y retorno.

## 6. Viewports y mediciones

Probar pestañas y overlays en 1920×1080, 1440×900, 1366×768, 1280×720, 1024×600, 1024×768, 768×1024, 390×844 y zoom 125% en escritorio. Aplicar pseudo-localización de +40%; luego inglés y portugués cuando estén habilitados.

Mediciones:

- Ningún control clave queda fuera del viewport o debajo del footer.
- Footer visible; scroll global cero donde se exige canvas sin scroll.
- `scrollWidth <= clientWidth` para títulos, botones y etiquetas primarias.
- Controles equivalentes difieren como máximo 1 px en alto.
- CTA equivalentes alineados; tarjetas sin solapamiento ni estiramiento artificial.
- Panel del Club conserva su última acción y paginación visibles.
- Foco de teclado y estado activo se distinguen.

En móvil se permite cambiar a tarjetas apiladas, navegación compacta o paginación; el requisito es acceso completo y claridad, no copiar columnas de escritorio.

## 7. Gates antes del playtest

**A. Baseline:** registrar Git, comandos reales, resultados, consola y capturas. No declarar pruebas no ejecutadas.

**B. Shell compartido:** cerrar alturas, presupuesto, botones, iconos, tarjetas, grillas, modales, breakpoints y footer.

**C. Pestañas:** cerrar Mi Perfil/alineación, Plantel, Mercado, Personal, Panel del Club, Ciudad y Gimnasio con estados límite antes de pasar a otra.

**D. Loop:** elegir enfoque → equipar → 10 guanteos → licencia → programar/negociar pelea → resolver → lesión/descanso/retorno → finanzas y progresión. Fechas y mensajes deben coincidir.

**E. Robustez:** guardado/carga/migración, varias semanas, límites de plantel, retiro, eventos, sponsors y contabilidad. Sin login, monetización, publicación ni assets finales en esta fase.

**F. Candidato de playtest:** recorrer toda la matriz. P0/P1 bloquean; P2 que contradice requisitos aprobados también bloquea. Entregar checklist y evidencia antes de invitar al propietario.

## 8. Checklist de cada cambio

- [ ] Pantalla, flujo, viewport y estado afectados identificados.
- [ ] Fuente de verdad y dato principal identificados.
- [ ] No se agrega información para llenar espacio.
- [ ] Densidad máxima de grilla documentada.
- [ ] Estados vacío, normal, máximo, bloqueado, error y éxito cubiertos según aplique.
- [ ] Familias de componentes compartidas; desktop/tablet/móvil/zoom/texto largo cubiertos.
- [ ] Persistencia, economía, calendario y traducción evaluados.
- [ ] Typecheck/tests pertinentes/build ejecutados según alcance.
- [ ] Flujo y capturas/mediciones visuales revisados.
- [ ] Consola revisada.
- [ ] Informe y handoff actualizados con resultado y pendientes reales.

## 9. Definición de “listo para el playtest del propietario”

- Todas las pestañas de la matriz pasan en estados normales y límite.
- No hay P0/P1 ni P2 abiertos que contradigan requisitos aprobados (cortes, simetría, duplicación o acciones incomprensibles).
- El loop se completa en varias semillas sin intervención de desarrollo.
- Varias decenas de semanas no rompen economía, calendario, plantel ni rendimiento.
- Partidas guardadas se cargan/migran o se rechazan con diagnóstico claro.
- Textos visibles están catalogados y pasan pseudo-localización.
- Hay evidencia repetible para cada fila de la matriz.

Este estándar reduce fallos básicos en el playtest, pero no promete que nunca aparezcan defectos ni sustituye el juicio del propietario sobre balance y diversión.

## 10. Orden de ejecución recomendado

1. Baseline y capturas por pestaña/viewport.
2. Shell: franjas compactas, canvas, Panel del Club, footer y breakpoints.
3. Componentes compartidos: botón, icono, tarjeta, CTA y grilla.
4. Mi Perfil y Plantel.
5. Mercado y Personal.
6. Panel del Club y Ciudad.
7. Gimnasio, Calendario, ficha técnica y combate.
8. Loop end-to-end, economía y guardado durante varias semanas.
9. Repetir matriz en viewports y pseudo-localización; preparar candidato y evidencia.

## 11. Evidencia por combinación pantalla × viewport × estado

Registrar pantalla/flujo, viewport/zoom/idioma, fixture/estado, hallazgo, severidad, prueba ejecutada, captura/log, PASS/FAIL/BLOCKED y commit/build. Un PASS solo cubre esa combinación y no se extrapola a otras resoluciones, idiomas o estados.

## 12. Documentos que gobiernan

Leer junto con los cinco documentos de `docs/canonical/`, el plan de auditorías 13, las auditorías visuales 20 y 22 y cualquier auditoría del dominio afectado. El handoff de raíz debe enlazar a este contrato.
