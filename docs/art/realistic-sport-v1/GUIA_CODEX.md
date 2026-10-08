# Guía para Codex — aplicar la dirección visual

## Objetivo

Conservar el juego de gestión integrado hasta R4 y darle la presentación deportiva realista de este paquete. El usuario prefiere gestionar al peleador, construir un club y sentir progreso constante. La UI debe hacer claras la próxima decisión, sus requisitos, el estado del atleta y la situación del club.

La entrega actual es un paquete de diseño. Al integrarlo, trabajar de forma incremental sobre el código vigente y conservar las reglas que ya tienen evidencia. La migración a Unreal no es parte de este paquete.

## Fuente de verdad

El código, los catálogos es/en/pt-BR y los documentos canónicos vigentes determinan nombres, atributos, requisitos, precios, fechas, efectos y mensajes de error. Una imagen generada nunca autoriza un cambio de esas reglas.

Usar las imágenes para composición, fotografía ficticia, color, materiales y jerarquía. Renderizar los textos y los controles como DOM/SVG/CSS accesibles. No incrustar estadísticas, nombres, precios, botones o traducciones dentro de una imagen de fondo. No implementar la pantalla entera como un bitmap.

## Mapa de integración

Archivos consultados en el árbol base; verificar su estado actual antes de editar.

| Vista o elemento | Puntos de integración actuales | Contrato visual |
| --- | --- | --- |
| Marca, navegación y marco | `src/App.tsx`, `src/components/TopBar.tsx`, `src/index.css` | Las siete pestañas y la barra de estado siguen accesibles. |
| Ciudad | `src/components/CityMap.tsx`, `src/components/panels.tsx` | Todas las propiedades y acciones actuales, con mapa y alternativa en lista. |
| Gimnasio | `src/components/GymView.tsx` | Selección y estaciones legibles, cantidad visible adaptable y paginación. |
| Plantel y archivo | `src/components/panels.tsx`, `src/components/CareerArchive.tsx`, `src/game/plantelLayout.ts` | Orden, filtros, bajas e historial conservados. |
| Mercado, Perfil y Personal | `src/components/panels.tsx` | Mostrar estados comprados, disponibles, bloqueados y contratos antiguos. |
| Calendario | `src/components/CalendarView.tsx`, `src/components/EventDetail.tsx`, `src/components/PlanningDetail.tsx` | Usar las operaciones y tipos de evento existentes. |
| Ficha | `src/components/BoxerSheet.tsx` | Tres pilares, seis enfoques y todas las acciones de la ficha actual. |
| Combate | `src/components/FightScreen.tsx`, `src/components/OfferDetail.tsx` | Guardas R2, reanudación y liquidación única intactas. |
| Avisos, guía y balances | `src/components/Phone.tsx`, `src/components/Intro.tsx`, `src/components/WeeklyBalance.tsx` | Errores precisos, guía persistente y cifras conciliadas. |
| Diálogos y controles | `src/components/ui.tsx`, `src/components/LanguagePicker.tsx` | Foco inicial y restaurado, contención de teclado, Escape y fondo inerte. |
| Traducción | `src/i18n/` y los recursos vigentes del proyecto | es/en/pt-BR desde catálogos completos, nunca OCR de una lámina. |

## Diferencias conocidas en los bocetos

Estas correcciones forman parte de la lectura del diseño; no son defectos nuevos del código.

| Elemento dibujado | Qué debe hacer la implementación |
| --- | --- |
| Mateo Cruz, Lucía Torres, nacionalidades, edades y medidas | Usar la identidad y los campos existentes de cada boxeador. Los personajes de muestra son ficticios. |
| GRL, niveles de Gimnasio/Ciudad, divisiones de ejemplo o un atributo genérico “Técnica” | No crear atributos, niveles ni divisiones. Renderizar los selectores y estadísticas reales. |
| Enfoques móviles simplificados como “Fuerza/Técnica” | Usar exactamente Noqueador, Estilista, Asfixiante, Táctico, Completo y Descanso. |
| Descripciones, bonificaciones, salarios o requisitos de compra/personal | Leer los datos actuales; no adoptar una promesa inventada en la imagen. |
| “Guardar historial” como checkbox en transferencia | El archivo competitivo se conserva según el contrato vigente; no volverlo opcional. |
| Error de guardado con consejo sobre conexión | Mostrar la causa real: cuota, acceso, corrupción, schema u otra condición detectada. No suponer que el almacenamiento local exige red. |
| Aviso vencido con una supuesta ventana de transferencias | Respetar el vencimiento existente y deshabilitar la confirmación sin mutar estado ni RNG. No introducir ventanas de mercado. |
| Agenda con audiencia, actos de clínica, botón de añadir o fecha específica | Solo mostrar funciones existentes. Fechas reales del calendario de partida; sin nuevas fuentes de ingreso. |
| Temporizador o tácticas de esquina de ejemplo | Usar las fases, datos y opciones actuales del combate. La fotografía no exige simulación 3D ni un reloj nuevo. |
| Solo dos ubicaciones en Ciudad o dos tarjetas “Panel del Club” en Gimnasio | Mantener acceso a todas las propiedades; una acción por función, sin duplicados decorativos. |
| Coordinador con nuevos requisitos o una capacidad insinuada | Mantener suspensión de nuevas contrataciones y salarios/contratos antiguos. No inventar una ventaja. |
| Firma de estudio, emblemas o uniformes de muestra | Tratar como propuestas de marca; no suponer que son datos corporativos o elementos ya adoptados. |

## Reglas visuales

Usar `design-tokens.json` como propuesta inicial. El ámbar identifica acciones principales; el cian identifica selección y foco; los avisos usan icono y texto, además de color. Un estado bloqueado debe explicar el requisito.

Los títulos pueden ser condensados. Para textos de lectura y cifras usar una familia clara ya disponible en el proyecto, con números tabulares. No depender de una fuente descargada para que aparezcan los controles. Reconstruir el lettering de marca de forma separada de la UI.

Mantener los mínimos R4: 14 px para texto principal, 12 px para secundario, botones de 36 px en escritorio y objetivos táctiles de 44 px. El tamaño final se adapta al contenido; no reducir texto para encajar una captura. Usar superficies sólidas o degradados de apoyo sobre fondos con detalle. Comprobar contraste en la composición real, incluidos estados deshabilitados, foco y traducciones largas.

Mantener navegación visual entre las siete páginas. El usuario prefiere pestañas visibles y un canvas visual; no reemplazar el paso entre Ciudad, Perfil y otras páginas por un selector desplegable. En móvil, adaptar la franja de pestañas mediante desplazamiento o filas accesibles, conservando nombres y selección.

Móvil: la escena puede ser una cabecera compacta, seguida del panel de decisión y el plantel. Paginación/listas permiten llegar a todos los elementos. Evitar que el footer o una barra fija tapen acciones. Nombres largos, zoom y traducción no deben cambiar el significado del botón.

Los diálogos mantienen su comportamiento R4: capa activa única, identificación accesible, foco inicial, Tab/Shift+Tab, Escape, foco restaurado y fondo sin atajos activos. La estética nueva no debe remontar tarjetas que destruyen el disparador del diálogo.

## Uso de los fondos

Los archivos de `plates/` son candidatos de fondo sin UI. Los archivos de `references/` son láminas de diseño y no deben importarse desde producción.

En Ciudad, definir anclas normalizadas sobre el fondo concreto y comprobar su área de interacción después del recorte responsive. Separar anclas de los tipos de propiedad y de la lógica de compra. Conservar una lista accesible de todas las ubicaciones.

En Gimnasio, la imagen vacía es la base decorativa. La ocupación, selección y estados salen del juego. El ring o una bolsa dibujada no crean una estación ni una mejora comprada. Para atletas sobre la escena se necesitarán activos separados o una representación compatible con el estilo; no recortar controles de un mockup.

Los seis retratos son una referencia de casting. Una integración de avatares debe asignar identidad estable por boxeador, conservarla tras ordenar/recargar y usar un fallback. No elegir el rostro por su posición en la grilla ni alterar el RNG de la simulación para variar el arte. Cualquier nuevo dato persistente exige compatibilidad con las partidas actuales. No usar nombres, caras, sponsors o equipaciones de deportistas reales para completar el catálogo.

## Integración y rendimiento

Secuencia sugerida: marco y tokens; Gimnasio como pantalla piloto; Plantel/ficha; Ciudad; Mercado/Perfil/Personal/Calendario; combate y overlays; revisión visual móvil e idiomas. Entregar avances concretos que puedan jugarse y revisar la estética antes de extenderla a todas las pantallas.

Conservar el presupuesto vigente: JavaScript 573440 bytes y CSS 92160 bytes. El último margen JS informado tras R4 era 538 bytes; comprobar los valores actuales antes de implementar. No incrustar imágenes como base64 en JavaScript ni añadir una biblioteca grande para reproducir paneles CSS.

El peso total del paquete de documentación no es el peso de descarga del juego. Para producción generar tamaños adecuados, cargar el fondo de la pestaña necesaria, reservar dimensiones y presentar un fallback legible. Medir por separado el bundle, las imágenes iniciales y el total transferido. No cambiar la definición del presupuesto para esconder peso añadido.

Para el trabajo incremental, correr los tests afectados y comprobaciones visuales relevantes sobre una build estable. Reutilizar evidencia vigente cuando sus entradas no cambiaron. En el cierre, ejecutar los controles requeridos por el alcance real. No repetir toda la batería R1–R4 para un cambio de documentación o una imagen aislada.

Mantener la partida personal fuera de fixtures y orígenes de prueba. Pages conserva su ejecución manual. Esta rama de referencias no publica el juego.
