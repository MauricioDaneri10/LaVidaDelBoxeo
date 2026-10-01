# Plan de cierre — revisión 2

## Correcciones implementadas

- Consejo de esquina conectado al nombre visible del enfoque recomendado.
- Descripciones de los enfoques normalizadas con `+ capacidad`.
- Cursos centrados y sin botón duplicado.
- Panel del Club renombrado.
- Don Anselmo paginado para evitar cortes.
- Finanzas sociales accesibles desde Mi Perfil.
- Transición y resumen breve al avanzar el día.
- Ficha técnica compacta para ventanas de poca altura.

## Control que debe repetirse después de cada cambio

1. Abrir una ficha y comparar el enfoque activo con el consejo recomendado.
2. Avanzar un día y comprobar la transición y el día real del calendario.
3. Abrir Panel del Club → Don Anselmo y recorrer sus páginas.
4. Abrir Mi Perfil → Finanzas Sociales y agendar una actividad.
5. Recargar el navegador y verificar que la partida continúe.
6. Ejecutar typecheck, tests, build y auditoría estructural.

## Criterio visual

Ningún elemento debe depender de scroll global. La información larga debe resolverse mediante paginación, modal o ayuda contextual. Los botones deben describir una acción corta y mantener tamaños coherentes.

## Criterio de continuidad

No se agregan assets ni se inicia una fase 3D hasta que el flujo end-to-end sea aceptado manualmente. La implementación actual queda en estado jugable para esa aceptación.
