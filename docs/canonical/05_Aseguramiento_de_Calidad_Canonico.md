# Aseguramiento de Calidad Canónico

**Proyecto:** La Vida del Boxeo  
**Versión:** 1.0  
**Estado:** Contrato de calidad para cada cambio

## 1. Objetivo

Evitar regresiones, reglas contradictorias, partidas rotas, pantallas cortadas, vocabulario confuso y errores que solo aparecen después de muchas semanas. La calidad se demuestra con evidencia, no con una inspección superficial.

## 2. Severidades

- **P0 — bloqueante:** rompe una partida, permite una regla inválida, borra progreso o impide continuar.
- **P1 — crítico:** sistema central incompleto, contradicción de diseño o pantalla esencial inutilizable.
- **P2 — importante:** confusión, riesgo de regresión, balance defectuoso o inconsistencia visible.
- **P3 — pulido:** detalle visual, texto menor o mejora no bloqueante.

No se cierra una versión con P0 abierto. El criterio para P1 debe quedar explícito antes del playtest.

## 3. Pirámide de pruebas

```text
                 Playtest humano
              E2E y regresión visual
          Integración y persistencia
       Reducer / comandos / invariantes
             Unitarias de dominio
```

Cada nivel cubre un riesgo distinto. Un test de motor no reemplaza una revisión de canvas y una captura visual no reemplaza una prueba de migración.

## 4. Checklist por cambio

### Antes de programar

- [ ] El pedido está escrito en términos observables.
- [ ] Se identificó la fuente de verdad.
- [ ] Se revisaron los cinco documentos canónicos.
- [ ] Se definió severidad.
- [ ] Se identificaron persistencia, economía, UI, traducción y calendario afectados.
- [ ] Existe criterio de aceptación.

### Durante la implementación

- [ ] No se duplicó una regla existente.
- [ ] Se agregó o actualizó un tipo estable.
- [ ] Se usaron IDs, no textos visibles como lógica.
- [ ] Se agregó migración si cambia el estado persistido.
- [ ] Se agregó texto traducible.
- [ ] Se registró el movimiento económico si corresponde.
- [ ] Se contemplaron estados vacío, bloqueado, máximo y error.

### Antes de cerrar

- [ ] `npm run typecheck` pasa.
- [ ] `npm test -- --run` pasa.
- [ ] `npm run build` pasa.
- [ ] auditoría estructural pasa.
- [ ] `git diff --check` pasa.
- [ ] pruebas visuales en resoluciones objetivo pasan.
- [ ] la partida se guarda y carga.
- [ ] la traducción no deja claves faltantes.
- [ ] el documento canónico fue actualizado.
- [ ] el commit describe el cambio.

## 5. Invariantes del dominio

Siempre deben cumplirse:

1. Un alumno en espera no entrena ni suma guanteos.
2. Un pugil sin licencia no compite oficialmente.
3. Un pugil lesionado o con energía insuficiente no puede pactar pelea.
4. Una pelea pendiente no puede duplicarse.
5. Transferir no borra historia.
6. El cupo amateur y profesional no se supera.
7. El saldo y el libro contable coinciden.
8. Un evento vencido no se puede cobrar.
9. Una recompensa cobrada no vuelve a cobrarse.
10. El ranking no altera records.
11. Un idioma no altera reglas ni valores.
12. Una partida anterior puede migrarse o rechazarse con diagnóstico, nunca romperse silenciosamente.

## 6. Matriz de pruebas funcionales

### Inicio

- crear partida con nombres cortos y largos;
- elegir emblema;
- continuar partida;
- guardar en ranura;
- reiniciar sin perder otra partida.

### Alumnos

- cupo normal;
- lista de espera;
- retiro y liberación de plaza;
- recreativo sin ficha competitiva;
- guanteo 0/10, 9/10, 10/10 y más de 10;
- licencia sin curso;
- licencia sin dinero;
- licencia con cupo amateur lleno.

### Entrenamiento

- enfoque manual;
- Director Técnico contratado;
- asignación inmediata;
- lesión y descanso;
- energía menor a 70;
- cambio de enfoque con rival;
- descanso automático y retorno al enfoque.

### Peleas

- rival debutante ±3 peleas;
- rival parejo;
- rival desafío;
- energía baja;
- lesión;
- cooldown;
- cancelación;
- resultado, record, bolsa, fama, seguidores y lesión posterior.

### Economía

- cuotas;
- recreativos;
- sueldo;
- compra;
- sponsor;
- actividad social;
- comisión de reparación;
- entrevista;
- colecta;
- caja negativa;
- balance y libro.

### Carrera larga

- 50 peleas amateurs;
- aceptar o postergar profesionalismo;
- diez profesionales;
- título nacional, regional y mundial;
- retiro;
- Salón de la Fama;
- nacimiento/retiro futuro de rivales.

## 7. Pruebas de persistencia

Crear fixtures para:

- versión mínima;
- versión actual;
- campos ausentes;
- arrays corruptos;
- dinero negativo;
- eventos vencidos;
- pugiles sin record;
- nombres con caracteres especiales;
- partida grande;
- partida con múltiples clubes futuros.

Cada fixture debe verificarse antes y después de migrar. Se debe comprobar que el jugador conserva identidad, progreso, economía, record, títulos y configuración.

## 8. Pruebas visuales

Cada pantalla se captura en:

- 1280×720;
- 1366×768;
- 1024×768;
- ventana no maximizada;
- zoom 125%;
- idioma expandido;
- estado mínimo;
- estado máximo.

Se revisa:

- superposición;
- texto cortado;
- botón fuera del panel;
- acción esencial invisible;
- modal sin cierre;
- columnas que cambian de altura;
- panel del club saturado;
- scroll inesperado;
- foco de teclado;
- contraste.

## 9. Pruebas de internacionalización

- inventario de claves faltantes;
- pseudo-localización +40%;
- inglés;
- portugués brasileño;
- pluralización;
- género;
- moneda;
- fechas;
- nombres largos;
- tooltips y errores;
- fallback al español.

Una traducción incompleta es un defecto de calidad, aunque el motor funcione.

## 10. Simulación prolongada

Ejecutar 120 semanas con varias semillas o escenarios:

- gestión conservadora;
- inversión agresiva;
- caja negativa;
- muchas derrotas;
- muchas victorias;
- plantel lleno;
- múltiples lesiones;
- contratación de personal;
- sucursales;
- sponsors y eventos;
- promoción profesional;
- retiro y Salón de la Fama.

La simulación verifica que no existan excepciones, crecimiento infinito, dinero infinito no explicado, records imposibles, fechas inválidas o listas sin límite.

## 11. Auditoría de regresión

Antes de cada release:

1. comparar cambios de estado;
2. ejecutar la suite completa;
3. ejecutar fixtures de migración;
4. ejecutar auditoría estructural;
5. construir producción;
6. revisar cuatro pantallas visuales críticas;
7. revisar consola;
8. iniciar, guardar, recargar y continuar una partida;
9. revisar documentos canónicos;
10. registrar versión y evidencia.

## 12. Observabilidad

En desarrollo, cada fallo debe reportar:

- comando;
- semana/día;
- entidad;
- estado previo resumido;
- motivo;
- estado posterior;
- versión de schema.

Los logs no deben incluir información sensible. La producción debe mostrar un mensaje amigable y ofrecer recuperación.

## 13. Criterio de aceptación

Una solución queda aceptada solo cuando:

- reproduce el problema original;
- demuestra la corrección;
- no rompe invariantes;
- pasa las pruebas automáticas;
- pasa revisión visual si tiene UI;
- pasa migración si toca estado;
- pasa traducción si agrega texto;
- queda documentada;
- tiene una evidencia reproducible.

## 14. Política de cierre

No se declara “funciona end-to-end” por una sola partida corta. Se necesita motor, persistencia, visual, traducción, simulación larga y playtest humano. Si aparece un fallo, se reabre la auditoría especializada correspondiente y luego la integración; no se tapa con un parche aislado.

## 15. Regla universal para cualquier proyecto

Esta metodología es reutilizable fuera de este juego:

```text
idea → diseño canónico → contrato técnico → dirección visual
     → plan ejecutable → QA con evidencia → release
```

Toda modificación futura debe declarar qué documento afecta y actualizarlo si cambia una decisión de producto, una regla técnica, un criterio visual, un plazo o un requisito de calidad.
