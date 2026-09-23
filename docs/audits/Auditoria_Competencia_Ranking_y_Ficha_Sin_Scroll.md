# Auditoría competitiva y ficha sin scroll

Fecha: 23/09/2026

## Cambios de diseño

- La experiencia principal usa un viewport fijo: se bloqueó el scroll de la página y cada pestaña organiza su contenido en una composición de pantalla.
- Gimnasio, Plantel, Mercado, Perfil, Personal y Ciudad fueron compactados con grillas y alturas de pantalla; los listados largos se presentan como resúmenes visuales accionables.
- La ficha técnica dejó de depender de un scroll interno: se compactaron retrato, radar, pilares, enfoque, consejo, progreso e historial para que entren en una ventana normal.
- Se eliminó la explicación redundante de “dos licencias distintas”. Ahora la ficha comunica una sola ruta: Licencia de Entrenador del club → prácticas de sábado → licencia individual del atleta.
- La ficha muestra el récord como `victorias-derrotas-empates`, nocauts, total de peleas y estado de carrera.

## Progresión competitiva

- Un amateur necesita 50 peleas amateurs para pasar al profesionalismo.
- Un profesional puede aspirar al título nacional desde 10 peleas profesionales, con victorias y nocauts suficientes.
- Los títulos regionales y mundiales requieren al menos 25 peleas profesionales, además de victorias y nocauts.
- El récord amateur y el profesional se cuentan por separado para evitar que una trayectoria amateur infle artificialmente la carrera profesional.
- Un récord negativo reduce la bolsa ofrecida y muestra una alerta de carrera en riesgo.
- Los récords positivos y los nocauts elevan las bolsas y el prestigio; los grandes noqueadores reciben una categoría especial.

## Ranking y ciudad

- Se incorporaron diez gimnasios rivales y dos competidores profesionales por club.
- El ranking mundial combina valoración, victorias, derrotas, nocauts, títulos y circuito.
- La Ciudad muestra seis clubes rivales en el mapa y un ranking visual con atletas propios y visitantes.
- La ficha y el plantel mantienen el récord individual; no se usa un récord global del gimnasio para representar al boxeador.

## Auditoría de canvas y composición

- El shell principal pasó a `flex + h-dvh`: la altura disponible se calcula después de la cabecera real, evitando que la navegación flote sobre la pantalla activa.
- La navegación de Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil y Personal es un bloque propio, no sticky; el canvas comienza debajo y conserva márgenes consistentes.
- El dock móvil inicia colapsado para no tapar el canvas; sus mensajes se abren bajo demanda.
- La pantalla inicial fue compactada para resoluciones con navegador visible: título, formulario, botón de inicio y pie quedan dentro del viewport.
- Configuración y atajos se reorganizaron en tarjetas compactas; todas las opciones principales quedan visibles sin scroll.
- Se revisaron recortes, solapamientos y jerarquía visual en los seis canvas principales y en las ventanas de juego.

## Validación

- TypeScript: correcto.
- Pruebas: 15 correctas.
- Build de producción: correcto.
- Auditoría estructural: 0 errores y 0 advertencias.
- La ficha fue verificada visualmente en navegador a 1100×890 sin scroll visible ni contenido inferior cortado.
