# Plan de cierre end-to-end sin assets

Fecha: 23/09/2026  
Objetivo: terminar de pulir el juego funcional antes de cualquier trabajo de assets.  
Regla de alcance: no generar ni integrar assets 2D, 3D o animaciones finales hasta la aprobación explícita del usuario.

## Resultado esperado

Una versión que el usuario pueda jugar de principio a fin y validar personalmente: crear carrera, gestionar alumnos, emitir licencias, comprar, contratar, organizar combates, cerrar semanas, leer el balance, competir por títulos, consultar ranking, guardar, cargar y reiniciar sin errores ni contradicciones.

## Fase 0 — inventario y contrato de datos

1. Inventariar cada ID de `types.ts`, cada catálogo de `data.ts` y cada acción del reducer.
2. Marcar para cada dato: quién lo crea, quién lo modifica, quién lo muestra y cuándo se persiste.
3. Eliminar reglas duplicadas entre componentes, engine y state.
4. Definir una única fuente para dinero, capacidad, ranking, récord y economía semanal.

Salida: matriz de trazabilidad `dato → acción → cálculo → pantalla → persistencia`.

## Fase 1 — economía única y explicable

1. Crear el cálculo compartido de proyección semanal.
2. Hacer que previsión, balance, libro y estadísticas usen las mismas líneas.
3. Separar ingresos recurrentes, extraordinarios y extraordinarios condicionados.
4. Separar gastos fijos, variables e inversiones únicas.
5. Resolver la convención de bolsas y veladas: bruto, costos y neto.
6. Mostrar la ayuda de apertura en la previsión de la semana 1.
7. Agregar alertas de caja mínima y compras que comprometen la nómina.

Salida: economía coherente en partida nueva, partida avanzada y partida en pérdida.

## Fase 2 — carrera del alumno y del boxeador

1. Normalizar capacidad, lista de espera y bajas.
2. Implementar acciones claras: retirar, transferir, liberar o promover.
3. Verificar licencia del entrenador y licencia individual del atleta.
4. Separar récord amateur/profesional en UI, motor y ranking.
5. Conectar récord con bolsa, fama, interés, títulos y continuidad.
6. Probar el recorrido completo hasta profesional y títulos.

Salida: ningún alumno queda atrapado ni ningún boxeador aparece sin record o licencia coherente.

## Fase 3 — canvas y arquitectura de información

1. Reservar el canvas para información inmediata y acciones frecuentes.
2. Convertir Ranking Mundial en ventana ampliada.
3. Convertir detalle de producto en ventana ampliada.
4. Convertir ramas de cursos y bienes en vistas ampliadas.
5. Mantener la ficha técnica como vista ampliada de referencia.
6. Reducir o plegar guía inicial, previsión y teléfono cuando compitan por altura.
7. Probar todos los breakpoints y estados de datos vacíos, llenos y extremos.

Salida: todas las páginas se entienden sin recortes, scroll accidental o superposición.

## Fase 4 — mercado, texto y componentes repetidos

1. Crear un componente de tarjeta de compra con slots fijos.
2. Alinear precio, estado, recomendación y botón.
3. Usar nombres cortos en la vista principal.
4. Reservar descripciones completas para detalle.
5. Unificar estados de instalado, recomendado, bloqueado y sin fondos.
6. Revisar cada texto con lenguaje accesible para edades amplias.

Salida: Mercado, Perfil y Personal mantienen la misma lectura visual y no se cortan.

## Fase 5 — persistencia y resiliencia

1. Probar guardado automático después de cada acción.
2. Probar exportación/importación con carrera nueva y avanzada.
3. Probar migración de datos faltantes o antiguos.
4. Evitar doble descuento por doble clic.
5. Confirmar que reinicio limpia estado visual, libros, toasts y modales.

Salida: una partida sobrevive al cierre, carga y reinicio de forma predecible.

## Fase 6 — auditoría pantalla por pantalla

Recorrido obligatorio:

1. Inicio.
2. Gimnasio.
3. Ficha técnica.
4. Ciudad.
5. Ranking Mundial.
6. Scouting.
7. Plantel.
8. Lista de espera y baja/transferencia.
9. Mercado por cada categoría.
10. Detalle de producto.
11. Mi Perfil, cursos y bienes.
12. Personal.
13. Teléfono y consejos.
14. Selección de rival.
15. Combate.
16. Resultado y récord.
17. Balance semanal.
18. Configuración, atajos, guardado, carga y reinicio.

Cada pantalla debe registrarse con: objetivo, entradas, acciones, salida, errores posibles, datos económicos afectados, cierre y tamaño mínimo probado.

## Fase 7 — pruebas de regresión y build final funcional

- Ejecutar typecheck, tests, build y auditoría estructural.
- Ejecutar tests económicos y de carrera.
- Jugar manualmente al menos una semana completa y una carrera avanzada.
- Verificar cinco resoluciones.
- Revisar consola del navegador, errores de red y warnings de React.
- Congelar una build candidata para que el usuario la juegue.

Salida: versión “candidata a validación del usuario”.

## Fase 8 — validación del usuario

Esta fase no se cierra con tests internos. El usuario debe jugar la build y reportar:

- qué no entiende;
- qué no puede encontrar;
- qué cifra económica parece incorrecta;
- qué pantalla se corta;
- qué acción no produce el resultado esperado;
- qué texto resulta confuso.

Los reportes se clasifican como error funcional, error económico, error visual, problema de lenguaje o preferencia personal.

## Fase 9 — congelamiento antes del arte

Solo cuando el usuario confirme que el juego funciona end-to-end:

1. Congelar reglas, IDs y contratos de datos.
2. Congelar layout y tamaños de slots.
3. Crear una lista de assets necesarios basada en pantallas estables.
4. Recién entonces decidir assets 2D, modelos 3D y animaciones.

Esta fase queda bloqueada hasta aprobación explícita del usuario.

## Checklist de cierre

- [ ] Economía única entre previsión, libro y balance.
- [ ] Bolsas y costos de combate conectados.
- [ ] Cuotas, sponsors, eventos y sucursales conectados.
- [ ] Compras únicas separadas de gastos semanales.
- [ ] Licencias y récords separados por boxeador.
- [ ] Lista de espera administrable.
- [ ] Ranking mundial consultable en vista propia.
- [ ] Todas las tarjetas alineadas.
- [ ] Todas las páginas sin recortes ni superposición.
- [ ] Configuración, atajos y guardado visibles.
- [ ] Typecheck, tests, build y auditoría sin errores.
- [ ] Partida completa jugada y aprobada por el usuario.
- [ ] Assets 2D/3D y animaciones todavía fuera del alcance hasta autorización.

## Orden de ejecución

Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8 → Fase 9.

No se debe saltar a contenido visual final si una fase anterior tiene errores funcionales, económicos, de layout o de persistencia abiertos.
