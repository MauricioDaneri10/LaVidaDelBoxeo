# Auditoría 9 — Feedback del usuario: grillas, alineación y automatización

Fecha: 2026-09-23\
Estado: diagnóstico; implementación pendiente\
Fuente: playtest visual del usuario y capturas adjuntas

## Dictamen

El juego funciona y la base visual está encaminada, pero quedan mejoras concretas de densidad y alineación. El usuario no pidió agregar indicadores nuevos: pidió que las entidades existentes usen mejor el espacio disponible, manteniendo una estética profesional, simétrica y preparada para futuros assets.

## 1. Plantel

### Hallazgo

Con 4 alumnos de 10, las tarjetas quedan agrupadas arriba y sobra área antes del footer. El problema no se resuelve agregando números o resúmenes.

### Requisito funcional y visual

- La grilla debe soportar hasta 10 alumnos activos sin desbordar el canvas.
- Las tarjetas deben reducirse de manera controlada o distribuirse en dos filas.
- La altura, padding, avatar, nombre, valoración, energía, guanteos y CTA deben mantenerse normalizados.
- La paginación debe seguir disponible cuando el conjunto supere el área visible.
- Con 4 elementos, la composición debe ocupar el espacio útil de forma equilibrada sin estirar de manera artificial los textos.
- Con 10 elementos, no debe aparecer scroll del canvas ni cortar el footer.

### Distinción de talento nuevo

Cuando `SCOUT` incorpore un talento, el pugilista debe recibir un estado temporal `nuevo` o equivalente:

- mostrar “Recién incorporado” en la tarjeta;
- resaltar que necesita elegir enfoque;
- permitir abrir la ficha desde esa tarjeta;
- desaparecer después de asignar enfoque o después de un periodo definido;
- no convertirlo en una notificación permanente.

Si hay Director Técnico/Entrenador Automático, el estado debe resolverse inmediatamente al incorporarse y la distinción debe cambiar a “Enfoque asignado” o desaparecer.

## 2. Mi Perfil

### Hallazgos visuales

- Los iconos de Deportiva, Promotora y Empresarial deben quedar centrados vertical y horizontalmente respecto del texto.
- La tarjeta “Rama Deportiva/Promotora/Empresarial” tiene desalineación interna.
- El botón “Ver cursos” debe estar centrado dentro de la tarjeta y alineado con la estructura de las otras ramas.
- La barra superior de Cursos/Bienes Raíces debe usar una única familia de botones.

### Requisito

Crear un patrón compartido para botones con icono:

- `inline-flex`;
- `items-center`;
- `justify-center`;
- altura fija por tamaño;
- gap constante;
- icono con caja cuadrada estable;
- texto con `leading-none` o line-height controlado.

No corregir estos desfases con márgenes particulares por botón.

## 3. Presupuesto vertical global

### Hallazgo

Siguiente Paso, Primeros Pasos del Club y Previsión del Domingo ocupan una proporción importante del alto antes de la pestaña. Son útiles, pero reducen el área de trabajo y hacen que el cambio de pestaña se perciba más pequeño.

### Requisito

- Mantener la información guiada.
- Compactar la altura vertical, no eliminarla.
- Usar una línea principal y un detalle corto.
- Permitir que Primeros Pasos se contraiga cuando ya está resuelto o tenga una variante compacta.
- Mantener la previsión legible en una sola fila cuando el ancho lo permita.
- Garantizar que el footer siga visible.

## 4. Personal

### Hallazgo

Actualmente se muestran dos tarjetas por página, aunque el espacio permite cuatro o más en resoluciones amplias. La tarjeta individual tiene una buena base para incorporar retrato, especialidad y nivel.

### Requisito

- Usar una grilla responsive de hasta cuatro tarjetas por fila/página cuando el ancho y alto lo permitan.
- Calcular la cantidad visible con un presupuesto de canvas, no con un número fijo universal.
- Mantener paginación para catálogos largos.
- Conservar altura uniforme, CTA alineado abajo y espacio reservado para futuros retratos.

### Nuevos roles de automatización a diseñar

No se implementan automáticamente sin una especificación económica previa. Deben auditarse como roles delegables:

- Ojeador: automatiza búsqueda de talentos con límites de uso y coste.
- Contador/Gerente financiero: prepara proyecciones, alerta por caja y puede ejecutar pagos autorizados, nunca gastar sin límites.
- Gestor de sucursal: administra una sede concreta.
- Coordinador de operaciones: prioriza tareas y eventos.

Cada rol debe definir: coste semanal, requisitos, alcance, permisos, límites, feedback visible y posibilidad de despido.

## 5. Mercado

### Hallazgo

La página muestra cuatro tarjetas arriba y deja espacio inferior sin usar. Las categorías tienen suficientes elementos para una segunda fila.

### Requisito

- Mostrar hasta 8 elementos en una vista de escritorio si la categoría lo permite.
- Mantener 4 columnas × 2 filas en resoluciones amplias.
- En alturas reducidas, usar 4 × 1 con paginación.
- En tablet/móvil, recalcular columnas y cantidad visible.
- Normalizar título, icono, precio, descripción, efecto y CTA.
- No repetir caja global ni inventario como tarjetas inferiores.

## 6. Panel del Club

### Hallazgo

El panel mejoró visualmente, pero con cuatro consejos de Don Anselmo sólo muestra dos tarjetas y deja espacio inferior. El usuario espera que entren al menos dos más.

### Requisito

- Mostrar cuatro consejos en escritorio cuando el alto real lo permita.
- Mantener paginación como respaldo para listas mayores.
- Usar una cuadrícula de dos columnas sólo si cada tarjeta conserva legibilidad; en caso contrario, cuatro filas compactas.
- Mantener cabecera y pestañas fijas.
- No repetir caja, fama, seguidores o nómina.
- Los consejos cobrados deben reemplazarse por nuevos sin duplicar recompensas.

## 7. Criterios visuales globales

- Ningún botón equivalente puede tener una altura diferente.
- Los iconos deben estar centrados con `inline-flex items-center justify-center`.
- Las tarjetas equivalentes deben compartir una plantilla.
- Los CTA deben alinearse en la misma línea inferior.
- El footer MadArt Studios debe permanecer visible.
- El canvas no debe generar scroll.
- El contenido debe adaptarse a 1280×720, 1366×768, 1440×900, 1024×600, tablet y móvil.
- Los assets futuros deben poder ocupar un slot reservado sin romper la grilla.

## 8. Checklist de validación

- [ ] 4 alumnos ocupan el área con composición equilibrada.
- [ ] 10 alumnos entran mediante dos filas o paginación sin corte.
- [ ] Talento recién incorporado queda identificado y accionable.
- [ ] Entrenador Automático asigna enfoque inmediatamente a talento nuevo.
- [ ] Iconos de ramas perfectamente centrados.
- [ ] Tarjeta de rama y CTA alineados.
- [ ] Cabecera contextual compacta sin perder información.
- [ ] Personal muestra cuatro tarjetas cuando corresponde.
- [ ] Mercado muestra ocho tarjetas cuando corresponde.
- [ ] Panel del Club muestra cuatro consejos cuando corresponde.
- [ ] Footer visible y canvas sin scroll.
- [ ] Consola sin errores.
- [ ] Tests técnicos y visuales pasan en todas las resoluciones objetivo.

## 9. Dictamen

La devolución es clara y no requiere preguntas. Antes de agregar automatizaciones nuevas, se debe corregir la densidad de las grillas y crear los contratos visuales compartidos. Los nuevos roles de personal deben pasar por una auditoría económica separada para evitar automatizaciones que generen dinero infinito o decisiones opacas.
