# Auditoría 6 — Publicación, rendimiento, seguridad, compatibilidad y escalabilidad

**Fecha:** 23/09/2026  
**Alcance:** build de producción, GitHub Pages, rutas de assets, rendimiento, compatibilidad, seguridad del cliente, almacenamiento, migraciones, observabilidad y preparación para futuras cuentas/sincronización.

## 1. Evidencia ejecutada

- `npm run typecheck` — correcto.
- `npm test -- --run` — 23/23 pruebas correctas.
- `npm run build` — correcto; 399 módulos transformados.
- `node audit_engine.js` — 0 errores, 0 advertencias.
- `npm audit --omit=dev` — 0 vulnerabilidades informadas en dependencias de producción.
- Tamaño actual de `dist`: aproximadamente 557 KB sin comprimir; JavaScript aproximadamente 486 KB y CSS aproximadamente 70 KB.

## 2. Resumen de riesgos

| Área | Estado | Prioridad | Hallazgo |
|---|---:|---:|---|
| GitHub Pages | No listo | P0 | Vite genera `/assets/...` y el favicon usa `/favicon.svg`; fallará bajo la ruta de proyecto estándar. |
| CI/CD | No listo | P0 | No hay workflow versionado para typecheck, tests, build, auditorías y publicación. |
| SPA/fallback | Parcial | P0 | No existe estrategia documentada para recarga directa o fallback en GitHub Pages. |
| Guardado | Local únicamente | P0 | `localStorage` es modificable, limitado por navegador y no sincroniza entre dispositivos. |
| Migraciones | No listo | P0 | `schemaVersion` existe, pero se fuerza a un valor actual; no hay cadena de migraciones. |
| Rendimiento | Parcial | P1 | Bundle único grande, sin presupuesto ni carga diferida por combate, ranking o gráficos. |
| Seguridad | Demo local | P1 | No hay sinks peligrosos detectados, pero no existe integridad ni autoridad de servidor. |
| Compatibilidad | Parcial | P1 | No hay matriz automatizada de navegadores, touch, reduced-motion ni fuentes offline. |
| Observabilidad | No listo | P1 | Los errores se imprimen en consola y se muestra un fallback, sin diagnóstico persistente. |
| Escalabilidad | Parcial | P1 | Supabase está instalado pero no integrado; estado, economía y UI siguen acoplados a cliente/localStorage. |

## 3. Publicación en GitHub Pages

### 3.1 Rutas de Vite y recursos

`vite.config.js` no define `base`. `index.html` importa `/src/main.tsx` en desarrollo y el build produce `/assets/index-*.js`, `/assets/index-*.css` y `/favicon.svg`. Esto funciona en la raíz de un dominio, pero no en `usuario.github.io/repositorio/`.

**Corrección:** definir `base` según el repositorio en producción o usar una variable de entorno; cambiar favicon y recursos a URLs derivadas del base; probar el build servido bajo un subdirectorio real.

### 3.2 Workflow y artefacto

No hay `.github/workflows`. Falta un pipeline que instale con lockfile, ejecute typecheck, tests, auditoría estructural, smoke, build y publicación de `dist`. Debe fallar ante 404, errores de consola o referencias absolutas incorrectas y conservar el artefacto para inspección.

### 3.3 SPA, navegación y fuentes

El juego es una SPA con pestañas internas, pero una recarga directa debe producir una pantalla válida. Si en el futuro aparecen rutas profundas, habrá que agregar fallback compatible con Pages. Las fuentes se cargan desde Google Fonts: sin red, cambia la métrica tipográfica y puede reaparecer el clipping auditado. Conviene empaquetar fuentes licenciadas o probar una fallback con métricas equivalentes.

## 4. Rendimiento

### 4.1 Bundle y carga inicial

El bundle principal ronda 486 KB y el CSS 70 KB. Es aceptable para escritorio moderno, pero no existe presupuesto, análisis de chunks ni carga diferida. Animación, gráficos y combate deberían cargarse bajo demanda.

**Objetivos:** primer JavaScript comprimido menor a 250 KB para inicio; combate, gráficos y ranking bajo demanda; medición de LCP, INP y CLS en móvil y notebook; presupuesto controlado en CI.

### 4.2 Estado y serialización

`GameProvider` persiste la partida después de cada cambio de estado. Hoy es simple, pero serializa el estado completo y las ranuras repetidamente. Cuando crezcan historial, ranking, prensa y eventos puede bloquear el hilo principal.

**Corrección:** separar preferencias, snapshot y log; guardar con debounce seguro; medir serialización; mantener una única fuente persistente y copias controladas.

### 4.3 Aleatoriedad reproducible

El motor usa `Math.random()` para IDs, nombres, eventos, lesiones, entrenamiento y combate. Esto impide reproducir bugs y comparar dos builds con la misma partida.

**Corrección:** introducir un RNG inyectable, guardar semilla/estado para soporte y activar modo determinista en tests. El azar del juego no debe confundirse con aleatoriedad de seguridad.

## 5. Seguridad y privacidad

No se detectaron `dangerouslySetInnerHTML`, `eval`, `Function` ni `fetch` en el código auditado. Es positivo. Sin embargo, todo el progreso está en `localStorage`, por lo que puede editarse desde DevTools. Es aceptable para una demo offline, no para premios, monetización, ranking competitivo o cuentas.

**Regla:** mientras sea local, no confiar en el guardado para recompensas reales. Con cuentas, el servidor debe validar acciones, saldos, inventario, progreso y compras.

La dependencia `@supabase/supabase-js` está instalada, pero no existe integración de autenticación, esquema, RLS, sincronización ni resolución de conflictos. Antes de conectar Google/Supabase hay que definir identidad, permisos, migración local→cuenta, offline-first, conflictos, borrado, privacidad y separación entre progreso y pagos.

GitHub Pages tampoco aporta por sí solo una política de seguridad completa. Conviene empaquetar recursos, minimizar dependencias externas y documentar una CSP posible. Analytics, login y monetización requieren política de privacidad y consentimiento.

## 6. Persistencia y migraciones

`EstadoJuego` tiene `version` y `schemaVersion`, pero `sanitizarEstado` combina el objeto con la base y fija `version: 2`, `schemaVersion: 3`. Eso no es una migración: no transforma explícitamente una estructura anterior ni registra el paso aplicado.

**Contrato requerido:**

```text
SaveEnvelope {
  formatVersion,
  gameVersion,
  saveId,
  savedAt,
  checksum opcional,
  state
}
```

Cada versión debe tener `migrateVnToVn1`, fixtures de prueba y backup. Si falla, debe conservar el original y explicar cómo recuperarlo; nunca caer silenciosamente a una partida nueva. La ranura y el autoguardado tampoco deberían quedar divergentes por escrituras separadas.

## 7. Compatibilidad

No hay `browserslist` ni matriz automatizada. Validar Chrome/Edge actuales, Firefox actual y Safari reciente, con atención a `dvh`, backdrop blur, Web Audio, `Intl`, fuentes y `localStorage` en modo privado.

Además de la matriz de resoluciones de la Auditoría 4, probar touch, orientación, teclado externo, zoom 125%/200%, texto grande, contraste, reduced-motion, ausencia de audio, almacenamiento bloqueado, almacenamiento lleno, conexión lenta y modo offline.

No hay axe, Lighthouse CI ni snapshots de accesibilidad versionados. Añadir pruebas de nombre/rol/estado para navegación, modales, tarjetas, calendario, compras y mensajes.

## 8. Recuperación y observabilidad

El boundary de React registra el error en consola y muestra reintentar/recargar. Faltan código reproducible, versión, `saveId`, `schemaVersion`, última acción, recuperación desde backup y separación entre error de vista y corrupción de partida.

Los errores de guardado se convierten en `false` sin aviso visible. El jugador debe saber si la partida no pudo guardarse, con reintento e indicador de guardado confirmado. El smoke debe fallar ante errores de consola y 404.

## 9. Arquitectura para escalar

El estado sigue centralizado en `state.tsx` y el motor en `engine.ts`. Para cuentas, más clubes, mercado y contenido internacional hay que separar:

1. dominio puro y reglas;
2. comandos y eventos de juego;
3. persistencia local;
4. adaptador remoto;
5. presentación y traducción;
6. contenido de datos;
7. telemetría opcional.

El motor no debe conocer React, localStorage ni textos traducidos. La UI debe enviar comandos válidos y renderizar resultados/eventos, permitiendo cambiar de local a sincronizado sin reescribir las reglas.

## 10. Plan de cierre técnico

### P0 — publicación segura del prototipo

- Configurar base de Vite y workflow de Pages.
- Probar build bajo subpath y corregir favicon/assets.
- Añadir smoke de carga, 404 y errores de consola.
- Definir backup/migración mínima y no perder partidas corruptas silenciosamente.

### P1 — calidad y rendimiento

- Añadir budgets de bundle, análisis de chunks y lazy loading.
- Inyectar RNG determinista para tests y soporte.
- Añadir matriz de browsers, resoluciones, teclado, touch y accesibilidad.
- Mejorar indicador y diagnóstico de guardado.

### P2 — preparación online

- Diseñar SaveEnvelope, identidad, backend, RLS y reconciliación.
- Migrar reglas a dominio puro y persistencia por adaptador.
- Definir privacidad, monetización sin ventaja competitiva y recuperación de cuenta.
- Integrar Supabase sólo después de cerrar el contrato.

## 11. Checklist de aprobación

- [ ] Build publicado funciona en la URL de proyecto de GitHub Pages.
- [ ] No existen assets absolutos rotos ni recursos 404.
- [ ] CI ejecuta typecheck, tests, auditoría estructural, smoke y build.
- [ ] Existe una migración probada desde cada schema anterior.
- [ ] Una partida corrupta se recupera desde backup o muestra explicación clara.
- [ ] El guardado confirma éxito o informa el fallo.
- [ ] La versión funciona sin Google Fonts y en modo offline básico.
- [ ] Budgets de bundle y tiempo de interacción están definidos y pasan.
- [ ] El combate y los eventos pueden reproducirse con semilla de soporte.
- [ ] Chrome/Edge/Firefox/Safari y la matriz móvil pasan.
- [ ] No se conectan cuentas ni pagos sin autoridad server-side y privacidad.
- [ ] El dominio no depende de React ni localStorage y puede cambiar de adaptador.

## Conclusión

Las seis auditorías dejan el diagnóstico completo: el juego tiene un motor funcional y una base de pruebas saludable, pero todavía necesita implementación antes del playtest final o publicación. El bloqueo inmediato es GitHub Pages con rutas de subdirectorio; el bloqueo estructural es la ausencia de migraciones y frontera de persistencia; el bloqueo de escalabilidad es depender de `Math.random`, `localStorage` y un estado central sin adaptadores. Resueltos los P0 y repetida esta auditoría, podrá prepararse una build pública con riesgos conocidos y controlados.
