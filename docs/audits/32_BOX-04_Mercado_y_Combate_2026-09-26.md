# BOX-04 — Mercado y bloqueo de la simulación de combate

Fecha: 2026-09-26\
Estado: **Implementado y verificado automáticamente; queda playtest propietario del candidato**\
Alcance: layout/adaptación del catálogo de Mercado, transiciones del combate y accesibilidad del control para avanzar asaltos. No incluye añadir artículos ni rebalancear precios/efectos.

## Hallazgo P0: el combate quedaba debajo del footer

La capa de combate usaba las clases Tailwind `fixed inset-0`, pero también `fondo-app`. La regla global de `.fondo-app { position: relative }`, cargada después de Tailwind con igual especificidad, anulaba `position: fixed`. Por eso el combate se colocaba dentro del layout normal, empezaba por debajo de la cabecera y podía quedar tapado/cortado por el footer. Además, `overflow-hidden` descartaba cualquier contenido inferior, incluido el botón de esquina.

### Corrección

- La capa de combate ahora impone explícitamente `position: fixed`, `inset: 0` y una capa superior al layout, además de ocupar `100dvh`.
- El panel es opaco y separado del footer subyacente; no se “resuelve” ocultando el footer global.
- Se redujeron y adaptaron el encabezado, barras de salud, ring y controles tácticos para pantallas bajas.
- El overlay permite desplazamiento interno como respaldo en ventanas estrechas/bajas; la página del juego no necesita desplazarse.
- La lista táctica aprovecha dos columnas cuando hay ancho, manteniendo el control `Salir al Asalto` completo y accesible.

## BOX-04 Mercado

- El mercado mantiene una fuente única para cada artículo y su coste, efecto y estado de compra; no se repiten métricas globales ni se inventa contenido para llenar el espacio.
- La capacidad de la página se adapta al canvas: 4 artículos en la vista compacta, 6 en intermedia y hasta 8 en escritorio amplio. La paginación sigue exponiendo el resto del catálogo.
- En el canvas amplio, la grilla de ocho ocupa el espacio disponible con dos filas; al reducir la capacidad, vuelve a altura natural para evitar tarjetas artificialmente altas.
- Se conserva el CTA por artículo y el estado instalado, recomendado, bloqueado o sin fondos.

## Pruebas de navegador aisladas

Archivo reproducible: `scratch/test_fight_and_market.py`; usa contextos privados y saves sintéticos, sin leer ni modificar la partida del jugador.

Viewports probados: 1280×720, 1440×900, 1024×600, 1920×1080 y 970×900.

- **Combate, 5/5:** abrir cartelera, iniciar el primer asalto, completar la secuencia de 3 asaltos mediante `Salir al Asalto`, verificar que vuelve a mostrarse en esquina entre asaltos, llegar al fallo oficial y mostrar `Continuar Velada`. Sin excepciones JavaScript.
- **Mercado, 5/5:** capacidad esperada 4/6/8 por viewport, avanzar y volver la página cuando hay ocho, y navegar por las cuatro categorías con artículos visibles. Sin excepciones JavaScript.
- **Economía del mercado:** compra de Sogas con caja suficiente refleja `Instalado`; caja cero deja deshabilitada la compra. Ambas se ejecutan solo en un save desechable.
- La raíz del overlay ahora coincide con la ventana completa; los botones de asalto permanecen dentro del viewport y no quedan ocultos por el footer.

## Verificación de código

`npm run typecheck` y `npm run build` aprobaron después del cambio. Vite conserva su aviso conocido de chunk JS minificado por encima de 500 kB; no afecta el flujo de combate ni el límite de presupuesto del proyecto. La prueba E2E está separada de `npm run verify` y se ejecuta con `python scratch/test_fight_and_market.py`.

## Límites y siguiente gate

- BOX-04 queda cerrado en lo implementado aquí. Añadir nuevos artículos/precios/efectos no se hizo: primero requiere decisión de diseño y reconciliación económica.
- No se certifica todavía una carrera de muchas semanas ni que todo el juego esté libre de errores.
- Próxima fase según el plan: BOX-05 Personal, manteniendo la regla de completar y probar un gate antes de pasar al siguiente.
- El candidato requiere todavía el playtest del propietario, especialmente observar la pelea en su navegador y confirmar que el ritmo/lectura visual se siente bien.
