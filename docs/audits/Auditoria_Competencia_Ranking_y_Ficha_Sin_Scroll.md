# Auditoría competitiva y ficha sin scroll

Fecha: 23/09/2026

## Cambios de diseño

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

## Validación

- TypeScript: correcto.
- Pruebas: 14 correctas.
- La ficha fue verificada visualmente en navegador a 1100×890 sin scroll visible ni contenido inferior cortado.
