# BOX-10 — Revisión de Mercado y cierre del catálogo

Fecha: 2026-09-26\
Estado: **Correcciones aplicadas; pruebas automáticas PASS; inspección manual del propietario pendiente**\
Alcance: coherencia del catálogo, recomendación inicial, categorías, paginación, compra/fondos insuficientes y límite con el footer. No se añadieron artículos ni se alteraron costos o efectos.

## Hallazgo y causa

1. **Contador desfasado:** Mercado anunciaba `Instalado x/21`, aunque `EQUIPOS` tiene 23 artículos (10 equipamiento, 4 indumentaria, 4 instalaciones/salud y 5 difusión). El denominador fijo quedó obsoleto al crecer el catálogo.
2. **Recomendación inicial inadecuada:** con la caja inicial de $400, se destacaban las vendas ($450), que no se podían comprar, antes que las sogas ($200), necesarias para activar una estación y cumplir el primer paso.
3. **Texto de sugerencia impreciso:** “mejora de recuperación” no describía necesariamente el producto resaltado.

## Solución

- El total instalado ahora se deriva del catálogo (`Object.keys(EQUIPOS).length`), eliminando el número duplicado.
- Las prioridades se definen por categoría en `src/game/market.ts`; solo se sugiere un artículo que el jugador ya puede pagar. La primera sugerencia de Equipamiento en la partida inicial es Sogas de Salto. Si no hay una compra pagable en la categoría, no se presenta recomendación.
- El texto comunica el artículo real (“Prioridad sugerida: …”) y el encabezado identifica el Mercado en lugar de afirmar que toda categoría es únicamente “Equipamiento e Instalaciones”. Los detalles, precio, efecto, estado y compra siguen en cada tarjeta.
- No se rellenó el espacio con saldos, métricas o explicaciones duplicadas; no se forzaron alturas artificiales a las tarjetas.

## Pruebas y resultados

- `npm run verify`: PASS, TypeScript PASS, **66/66 tests**, build PASS, presupuesto PASS (JS 493.5/560 KiB; CSS 78.7/90 KiB), auditoría estructural 0 errores / 0 advertencias. Sigue apareciendo el aviso informativo de Vite por chunk minificado superior a 500 kB.
- `MARKET_ONLY=1 python scratch/test_fight_and_market.py`: PASS en 5 viewports (1280×720, 1440×900, 1024×600, 1920×1080, 970×900). Verifica capacidad 4/6/8, categorías, paginación, integridad de las tarjetas con respecto al viewport/footer y ausencia de excepciones de página.
- El escenario desechable comprueba que Sogas se puede comprar con fondos suficientes y queda instalado; con caja en cero el CTA queda deshabilitado. No se usó ni se modificó una partida real.
- Pruebas unitarias cubren el total de 23 productos, cuatro categorías con artículos, prioridad inicial asequible y ausencia de sugerencia cuando no hay opciones pagables.

## Límites / decisión pendiente

- No es un playtest del propietario ni certifica equilibrio económico a largo plazo, comprensión subjetiva de cada efecto, teclado completo de todo el catálogo ni localización integral.
- La sesión temporal visible de in-app browser no respondió a la interacción de navegación; no mostró errores de consola. La navegación se verificó en un Chromium de prueba independiente y aislado, así que no se atribuye ese bloqueo del controlador de inspección al juego. El candidato sigue requiriendo la comprobación manual del propietario.
- No se reequilibraron precios/beneficios ni se sumaron bienes nuevos: requieren decisión de diseño y pruebas económicas propias.

## Dictamen

**BOX-10 Mercado pasa el gate automatizable definido aquí.** El conteo y la recomendación ya concuerdan con el catálogo y con la caja inicial; categorías, paginación, compra/falta de fondos y footer tienen evidencia multi-viewport. Esto cierra esta revisión de Mercado, no el QA global ni el playtest final.
