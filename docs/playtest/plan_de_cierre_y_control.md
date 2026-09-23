# Plan de cierre y control — La Vida del Boxeo

## Alcance cerrado

El objetivo inmediato es que el prototipo sea jugable de principio a fin en local, con una interfaz legible sin scroll, economía trazable, plantel controlado, licencias claras y partidas guardadas por nombre. Los assets visuales 2D/3D y las animaciones nuevas quedan fuera hasta que el funcionamiento sea aceptado manualmente.

## Criterios de aceptación

1. Todas las pestañas principales entran completas en el viewport objetivo y los listados largos tienen paginación o modal.
2. El onboarding explica la secuencia de enfoque, equipamiento, 10 guanteos y licencia.
3. La licencia del entrenador y la licencia individual del pugilista son conceptos separados.
4. El balance semanal muestra entradas, gastos fijos, eventos y resultado neto.
5. El plantel no crece indefinidamente: alumnos, espera y boxeadores comparten la capacidad.
6. Guardar y continuar partida conservan nombre, semana, día, dinero y plantel.
7. Cada cambio futuro pasa typecheck, tests, build, auditoría estructural y una prueba visual breve.

## Orden de trabajo posterior

### A. Aceptación manual del flujo principal

Iniciar partida, configurar los tres alumnos, equipar una mejora, avanzar diez guanteos, obtener la licencia del entrenador, emitir la licencia individual, abrir el record y avanzar el calendario.

### B. Prueba económica dirigida

Revisar una semana con solo cuotas, una con personal contratado, una con evento social y una con patrocinio. Cada monto debe aparecer en el balance con una descripción comprensible.

### C. Prueba de capacidad

Intentar scouting con plantel lleno, retirar un integrante, comprobar que se libera el cupo y volver a buscar talento. No deben aparecer duplicados ni incorporaciones invisibles.

### D. Prueba de persistencia

Guardar dos partidas con nombres distintos, continuar cada una, recargar el navegador y confirmar que el estado correcto se restaura. Las migraciones deben agregar valores nuevos sin destruir campos antiguos.

### E. Prueba de viewport

Validar al menos 1280×720 y una ventana alta. Revisar Gimnasio, Ciudad, Plantel, Mercado, Mi Perfil, Personal, ficha técnica, ranking y balance. No aceptar texto cortado, botones desparejos ni overlays fuera de pantalla.

## Pendientes de producto, separados de bugs

- Diseñar retiros, generaciones y salón de la fama histórico.
- Terminar el calendario de peleas pactadas y la negociación de bolsas.
- Definir lesión, recuperación, médico y kinesiología con números finales.
- Balancear patrocinio, préstamos, cuotas, bolsas, gastos y fama con datos de telemetría.
- Diseñar sincronización online con cuenta Google más adelante; no pertenece al prototipo local.
- Crear assets 2D/3D y animaciones únicamente después de la aceptación end-to-end.

## Regla de mantenimiento

Cada nueva funcionalidad debe incluir: una regla de dominio testeable, un estado visual compacto, un texto corto con ayuda contextual si hace falta, una ruta de guardado/migración y una prueba de regresión. Si un contenido no entra en la pantalla, debe paginarse, abrirse como modal o resumirse con ayuda al pasar el mouse; no se debe resolver con scroll global.

## Estado de cierre de esta iteración

La iteración técnica está cerrada y el servidor local queda disponible para el playtest manual. El siguiente ciclo solo debe abrirse cuando aparezca un fallo reproducible o una decisión de producto, y debe repetir la misma secuencia: playtest → auditoría → plan → implementación → tests → playtest.
