# Auditoría 8 — Geometría, simetría, Panel del Club y footer

Fecha: 2026-09-23\
Estado: completada como diagnóstico; implementación pendiente

## 1. Motivo de esta auditoría adicional

Las auditorías anteriores cubrían canvas, densidad, UX y arquitectura, pero no convertían la simetría visual ni el footer en condiciones medibles de aceptación. El nuevo requisito agrega tres contratos explícitos:

1. controles, tarjetas y recuadros normalizados;
2. Panel del Club con apariencia de panel holográfico, cerrado y estilizado;
3. footer visible con la marca **MadArt Studios**, utilizado como límite inferior de verificación.

Por lo tanto, esta auditoría adicional es necesaria antes de implementar.

## 2. Definición de simetría profesional

La simetría no significa que todo tenga el mismo ancho. Significa que elementos equivalentes compartan reglas consistentes:

- misma altura para botones equivalentes;
- mismo radio, borde, sombra y padding por familia de control;
- misma línea base para precios, títulos, estados y CTA;
- misma separación entre tarjetas de una grilla;
- títulos y contenidos alineados en una retícula común;
- botones centrados dentro de su contexto, sin ocupar ancho artificial;
- tarjetas con áreas reservadas para título, descripción, efecto y acción;
- estados de igual tipo representados con el mismo patrón visual;
- ningún texto debe forzar una tarjeta a crecer o cortar la tarjeta vecina.

## 3. Hallazgos actuales

### GEO-01 — No existe un contrato global de dimensiones

`Btn` comparte una base visual, pero muchas pantallas agregan clases locales con distintos paddings, anchos, alturas y tamaños de texto. Las acciones equivalentes no tienen todavía tokens explícitos de tamaño.

**Riesgo:** dos botones con el mismo propósito pueden verse diferentes al cambiar de pestaña o traducirse.

### GEO-02 — Las tarjetas tienen plantillas distintas

Mercado, Personal, Plantel, eventos y cursos reservan alturas y espacios de manera diferente. Algunas usan `min-h`, otras `mt-auto`, otras contenido libre.

**Riesgo:** una descripción larga desplaza el CTA o genera huecos desiguales.

### GEO-03 — El footer no existe como elemento verificable

El shell utiliza `h-dvh` y `overflow-hidden`, pero no hay un footer visible con “MadArt Studios”. Por lo tanto, no existe un límite visual inequívoco para demostrar que todo el canvas está contenido.

### GEO-04 — El Panel del Club funciona como un rectángulo vertical genérico

El panel actual tiene borde, fondo y sombra, pero no tiene un tratamiento visual suficientemente diferenciado que comunique “bandeja/panel holográfico”. Al mismo tiempo, su altura fija y `overflow-hidden` pueden hacer que el estilizado o el contenido compitan con el espacio disponible.

**Criterio:** mejorar el marco sin agregar complejidad ni contenido redundante. El panel debe parecer una unidad de interfaz cerrada, con cabecera, pestañas, área de contenido y cierre visual inferior.

### GEO-05 — El footer debe respetar el no-scroll

El footer no puede agregarse debajo del canvas provocando que la aplicación necesite scroll. Debe formar parte del presupuesto vertical del shell y el `main` debe ocupar el espacio restante.

## 4. Contrato de layout actualizado

La estructura canónica debe ser:

```text
Shell de viewport
├── TopBar
├── Agenda semanal
├── Área de trabajo
│   ├── Navegación
│   ├── Guía / previsión contextual
│   ├── Canvas de pestaña
│   └── Panel del Club
└── Footer: MadArt Studios
```

El footer debe ser `shrink-0`, de altura pequeña y estable. El área de trabajo debe ser `min-h-0` y el canvas debe adaptarse a la altura restante.

## 5. Reglas de normalización propuestas

### Botones

- `button-sm`: acciones secundarias y paginación.
- `button-md`: acciones principales de tarjeta.
- `button-icon`: controles sólo de icono con tooltip.
- `button-wide`: sólo para acciones de contexto completo, nunca para texto breve.

Cada familia debe tener altura, padding, radio, tipografía y sombra compartidos. El precio debe mostrarse fuera del botón salvo que sea una decisión explícita de compra.

### Tarjetas

- encabezado de altura estable;
- descripción con límite de líneas y tooltip/detalle completo;
- área de beneficio con altura reservada;
- CTA en la misma línea inferior;
- estado siempre en la misma esquina o fila;
- misma altura por grupo de tarjetas.

### Grillas

- columnas determinadas por el ancho real disponible;
- gap constante;
- máximo de elementos visibles calculado por altura;
- paginación cuando el conjunto excede el presupuesto;
- no usar bloques redundantes para ocupar el final de la pantalla.

## 6. Panel del Club — dirección visual

El panel debe:

- tener un borde exterior más definido y un marco interno sutil;
- usar una cabecera claramente separada;
- tener pestañas con estados activos consistentes;
- usar un brillo holográfico leve, no una animación agresiva;
- cerrar visualmente su parte inferior con padding y borde;
- mostrar estado vacío dentro de una tarjeta propia y centrada;
- usar paginación o modal si el contenido excede el área;
- conservar el título “Panel del Club”.

No se deben agregar caja, fama, seguidores o nómina al panel sólo para darle densidad.

## 7. Footer — criterios de aceptación

- [ ] Se ve “MadArt Studios” en el juego.
- [ ] Es visible en las pestañas principales y en estados vacíos.
- [ ] No aparece encima de tarjetas, modales o el Panel del Club.
- [ ] No provoca scroll del documento.
- [ ] El canvas termina visualmente antes del footer.
- [ ] En alturas reducidas sigue visible o usa una variante compacta documentada.
- [ ] En combate y pantalla de introducción tiene un comportamiento definido.
- [ ] No tapa contenido ni compite con botones principales.

## 8. Tests visuales requeridos

Para cada resolución objetivo se debe medir:

- `document.documentElement.scrollHeight === clientHeight`;
- footer visible dentro del viewport;
- cada canvas con `bottom <= footer.top`;
- tarjetas equivalentes con la misma altura;
- botones equivalentes con la misma altura;
- CTAs alineados en cada fila;
- ningún texto primario con `scrollWidth > clientWidth`;
- ningún elemento relevante con `bottom > viewportHeight`;
- Panel del Club con borde inferior visible y contenido accesible.

Resoluciones mínimas: 1280×720, 1366×768, 1440×900, 1024×600, 1024×768, 768×1024 y 390×844.

## 9. Dictamen

La Auditoría 8 es necesaria y queda completada como diagnóstico. Agrega un nuevo gate visual: no se aprobará ninguna pantalla sólo porque “no corta”; también debe respetar retícula, simetría, normalización de controles, footer visible y Panel del Club estilizado.

La siguiente fase puede ser la implementación controlada de estos contratos junto con la retirada de los resúmenes redundantes.
