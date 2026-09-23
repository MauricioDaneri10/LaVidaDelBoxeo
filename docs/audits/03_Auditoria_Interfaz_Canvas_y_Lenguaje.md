# Auditoría 3 — Interfaz, canvas y lenguaje

Fecha: 23/09/2026  
Estado: diagnóstico previo a implementación. No se modificó código.

## Alcance

Inicio, navegación, Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil, Personal, teléfono, ficha técnica, ranking, matchmaking, combate, balance, configuración y todos los textos visibles.

## Hallazgos principales

### P0 — el canvas pierde contra la información auxiliar

La navegación, “Siguiente paso”, “Primeros pasos”, previsión y teléfono compiten con el canvas. En Ciudad el mapa y el inspector ocupan el espacio principal y el Ranking Mundial queda reducido a una franja ilegible.

Solución de arquitectura:

- canvas primario: información y acciones frecuentes;
- botones de detalle: información extensa en modal o vista secundaria;
- guía inicial: una sola recomendación principal;
- ranking: modal propio;
- mercado: detalle propio;
- cursos: ramas ampliables.

### P0 — contenido cortado

Las áreas observadas con riesgo de recorte son:

- Ranking Mundial en Ciudad;
- tarjetas de Mercado;
- badge “Recomendado ahora”;
- botones Comprar con descripciones de longitud variable;
- cursos de Mi Perfil;
- configuración y atajos;
- balance semanal en resoluciones bajas.

### P0 — tarjetas de altura variable

En Mercado el botón Comprar queda en diferente posición según la longitud de nombre y descripción. El componente necesita slots fijos:

1. icono y nombre corto;
2. precio;
3. efecto principal;
4. estado/recomendación;
5. acción.

La descripción larga debe abrirse en detalle y no cambiar la altura de la tarjeta.

### P1 — vocabulario

Nombres recomendados en la vista principal:

- Bucal Moldeado → Bucal.
- Cabezal Olímpico → Cabezal.
- Botas Antideslizantes → Botas.
- Botiquín con Hielo → Botiquín.
- Vestuarios con Duchas → Vestuarios.
- Barra de Proteínas → Proteínas.
- Sauna Seco y Frío → Sauna.
- Roster → Plantel.
- Prácticas de combate/fogueo → Guanteos, cuando corresponda.

El nombre técnico completo puede permanecer en la descripción secundaria.

### P1 — información ampliada

Debe existir una vista propia para:

- Ranking Mundial completo.
- Detalle de equipamiento.
- Rama de cursos.
- Registro completo de un boxeador.
- Libro de ingresos y gastos.

### P1 — navegación y salida

Cada modal necesita:

- botón cerrar visible;
- cierre por Escape;
- foco correcto;
- no dejar acciones del canvas bloqueadas sin explicación;
- estado vacío legible;
- confirmación cuando la acción sea irreversible.

### P2 — densidad y consistencia

- Unificar padding, radios, tipografía y altura de botones.
- No usar mayúsculas extensas para frases completas.
- Reservar espacio para estados “Recomendado”, “Instalado”, “Bloqueado” y “Sin fondos”.
- Evitar que una etiqueta cambie el ancho de la acción.

## Matriz de revisión

| Pantalla | Acción crítica | Riesgo actual | Revisión obligatoria |
|---|---|---|---|
| Inicio | Crear/continuar | Recorte en alturas bajas | Formulario y CTA completos |
| Gimnasio | Abrir ficha | Elementos decorativos compiten | Ficha accesible y estaciones legibles |
| Ciudad | Comprar/consultar | Ranking cortado | Ranking en modal |
| Plantel | Licenciar/retirar | Muchas tarjetas | Tres alumnos claros y acciones visibles |
| Mercado | Comprar | Tarjetas desalineadas | Slots fijos y nombres cortos |
| Perfil | Comprar curso | Cursos cortados | Ramas ampliables |
| Personal | Contratar | Alturas distintas | Acción alineada y costo visible |
| Teléfono | Leer consejo | Puede ocupar canvas | Dock colapsable |
| Combate | Resolver | Overlay denso | Resultado completo y cierre claro |
| Balance | Entender resultado | Desglose insuficiente | Libro transparente |
| Configuración | Guardar/atajos | JSON expuesto | Partidas amigables |

## Criterios de aceptación

- Ninguna acción importante queda fuera del viewport.
- Ninguna tarjeta tiene botones en alturas arbitrarias.
- El ranking se puede leer completo en una vista ampliada.
- El texto principal es entendible sin conocer términos técnicos.
- Cada página tiene una acción primaria y una salida clara.
- Se validan 1024×768, 1280×720, 1366×768, 1440×900 y 1920×1080.
