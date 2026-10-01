# Biblia de Arte Canónica

## Actualización R3 aprobada — 2026-10-01

Sin rediseño de assets/canvas. UI mínima R3: historial con «Archivado · sin cobro» distinto de «Cobrado»; coordinador suspendido sin prometer sedes; previsión distingue actividades estimadas de ingresos previstos y cobros garantizados. Pruebas afectadas aisladas, footer/bounds: no equivalen a certificación visual R4.


**Proyecto:** La Vida del Boxeo  
**Versión:** 1.0  
**Estado:** Dirección visual y reglas de producción  
**Nota:** Esta biblia define el lenguaje visual. No autoriza todavía la producción de assets finales.

## 1. Identidad

La identidad visual representa un gimnasio de barrio que puede convertirse en una institución. Debe sentirse cálida, artesanal, deportiva y legible. El juego no busca realismo fotográfico ni estética futurista dominante.

Palabras guía:

**barrio · esfuerzo · boxeo · crecimiento · historia · noche de pelea · dignidad**

## 2. Promesa visual

El jugador debe reconocer de inmediato:

- dónde está;
- qué puede hacer;
- qué mejoró;
- quién necesita atención;
- qué decisión tiene consecuencias.

La belleza nunca puede tapar una acción o un dato importante.

## 3. Dirección de color

Paleta base actual:

- tinta/casi negro: fondo y profundidad;
- marrón cálido: madera, gimnasio y superficies;
- crema: lectura principal;
- dorado: progreso, decisión positiva y prestigio;
- rojo/blood: riesgo, pelea, lesión y urgencia;
- verde: salud, éxito y resultado favorable;
- cian/neón: recuperación, tecnología o zona especial.

Reglas:

1. El rojo no se usa para decorar información neutra.
2. El dorado no significa siempre “comprar”; también representa progreso.
3. Un estado debe tener color, texto e icono.
4. El contraste de texto prioritario debe mantenerse en todos los temas.

## 4. Tipografía

La tipografía display se usa en títulos, nombres de secciones y momentos de identidad. La tipografía de lectura se usa en descripciones, números y explicaciones.

Reglas:

- no usar la tipografía display en párrafos largos;
- no reducir el tamaño para forzar un texto dentro de una tarjeta;
- una tarjeta debe resumir y derivar el detalle a tooltip/modal;
- los números económicos deben ser claros y alineados;
- las traducciones largas deben disponer de más alto o de una versión corta.

## 5. Composición y layout

La interfaz mantiene una estructura de paneles, navegación superior, contenido principal y Panel del Club. Se mejora sin rediseñarla.

### Contratos de pantalla

- **Gimnasio:** composición escénica, cinco estaciones, barra inferior de resumen.
- **Ciudad:** mapa + panel de inspección + accesos centrados.
- **Plantel:** resumen de cupos + colecciones paginadas.
- **Mercado:** categorías + tarjetas de altura consistente.
- **Mi Perfil:** estadísticas del coach + cursos/bienes + detalle modal.
- **Personal:** grilla de tarjetas con botones alineados.
- **Calendario:** siete columnas, agenda resumida y métricas.
- **Ficha:** modal amplio con pilares, enfoque, record y acción principal.
- **Combate:** ring central, información de ambos pugiles y estadísticas.

### Regla sin scroll

No se permite scroll para revelar una acción esencial. Si el contenido no entra:

1. reducir la densidad secundaria;
2. resumir texto;
3. paginar;
4. abrir detalle en modal;
5. dividir en estados de decisión.

No se debe ocultar contenido con `overflow-hidden` sin un mecanismo alternativo.

## 6. Sistema de componentes

Cada componente visual debe tener estados:

- normal;
- hover/foco;
- activo;
- bloqueado;
- recomendado;
- error;
- éxito;
- agotado;
- vacío;
- cargando si aplica.

Componentes canónicos:

- botón principal, secundario, peligro y neutro;
- tarjeta de entidad;
- chip de estado;
- barra de progreso;
- modal;
- tooltip;
- toast;
- confirmación;
- pestaña;
- paginador;
- estado vacío;
- resumen económico.

No crear una variante local si el estado puede resolverse con el componente común.

## 7. Personajes y boxeadores

Hasta que se aprueben assets finales, los personajes pueden usar ilustración procedural o vectorial simple. La silueta debe ser reconocible por:

- postura;
- color de ropa;
- tono de piel;
- división visual;
- estado de energía;
- lesión o descanso.

Los personajes no deben depender de estereotipos ofensivos. La diversidad es amplia y no altera estadísticas por género, piel, nombre u origen.

## 8. Gimnasio

Las estaciones representan actividad, no decoración aleatoria:

1. Soga y Cardio: ritmo y resistencia.
2. Sacos y Potencia: fuerza y potencia.
3. Ring: guanteo y práctica.
4. Técnica y Espejo: técnica, defensa y eficacia.
5. Hidratación: descanso y recuperación.

Cada estación debe tener una lectura visual limpia, una etiqueta breve y un estado de “libre” que no parezca un error.

## 9. Ciudad y ranking

El mapa debe comunicar jerarquía urbana: barrio, centro, lomas, espectáculos y clubes rivales. Los iconos deben tener leyenda o tooltip. Las acciones importantes se muestran fuera del mapa en botones alineados.

El ranking mundial es una vista de datos, no una textura dentro del mapa. Se abre como panel/modal para permitir crecer a muchos competidores sin romper el canvas.

## 10. Combate

El ring es el foco. La información secundaria debe permanecer legible sin competir con la acción. Los colores de energía, salud, golpe y caída deben ser constantes.

La animación comunica el estado del motor, pero nunca debe ser la única forma de conocer el resultado.

## 11. Iconografía y assets

Los iconos deben ser consistentes en grosor, tamaño óptico y metáfora. Un asset nuevo necesita:

- nombre de archivo estable;
- ID de contenido;
- versión;
- tamaño fuente;
- variantes claro/oscuro si corresponde;
- licencia/origen;
- texto alternativo;
- pantalla donde se usa.

Los assets 2D/3D finales se producirán solo después de cerrar la etapa funcional y con esta biblia aprobada.

## 12. Animación

La animación debe ser breve, informativa y opcional cuando pueda distraer.

- transición de día: continuidad temporal;
- toast: entrada/salida suave;
- entrenamiento: movimiento sutil;
- pelea: ritmo y feedback;
- compra: confirmación clara;
- lesión: advertencia visible, sin exageración.

No usar animaciones infinitas para elementos no urgentes. Respetar `prefers-reduced-motion`.

## 13. Arte procedural y reemplazabilidad

La UI debe recibir un `assetId` y no conocer si el recurso es SVG, sprite, modelo 3D o fallback. Así se puede cambiar el arte sin cambiar reglas ni componentes.

```ts
type VisualAsset = {
  id: string;
  kind: "icon" | "portrait" | "scene" | "model";
  source: string;
  altKey: string;
};
```

## 14. Control de calidad visual

Cada pantalla se revisa en:

- 1280×720;
- 1366×768;
- 1024×768;
- ventana reducida;
- zoom 125%;
- inglés y portugués;
- texto largo y nombre largo;
- estado vacío y estado máximo.

Se registra cualquier corte, superposición, contraste insuficiente, desalineación o botón ambiguo.

## 15. Regla de aprobación artística

Un asset no se incorpora solo porque “se ve lindo”. Debe:

- tener función clara;
- respetar la paleta y silueta;
- no tapar datos;
- funcionar en estado vacío y activo;
- tener fallback;
- estar documentado;
- pasar revisión visual y técnica.
