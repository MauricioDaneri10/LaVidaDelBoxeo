# Auditoría específica: licencias, récord y progresión de pugilistas

**Fecha:** 23/09/2026  · **Área:** identidad del atleta, federación, licencias, récord, circuito amateur/profesional y ficha técnica.

## Diagnóstico principal

El sistema mezclaba dos conceptos distintos:

1. La autorización del entrenador para dirigir y registrar atletas.
2. La licencia individual que habilita a cada pugilista para competir.

Eso hacía que la ficha pareciera decir que la licencia del club convertía automáticamente al alumno en federado. Además, el modelo no guardaba una marca explícita de licencia individual: infería toda la identidad deportiva desde `rol`.

## Modelo correcto

```text
Club / entrenador
└── Licencia de Entrenador (curso dt, $500)
    └── Pugilista activo
        ├── Prácticas de combate completas
        ├── Licencia individual ($200)
        ├── Récord propio: victorias / derrotas / KO
        └── Circuito: Amateur → Profesional
```

La licencia del entrenador no pertenece al boxeador. La licencia individual sí pertenece al boxeador y se conserva junto con su récord.

## Hallazgos y correcciones

| Prioridad | Hallazgo | Corrección aplicada |
|---|---|---|
| P0 | El curso `dt` parecía ser la licencia del pugilista. | Renombrado a **Licencia de Entrenador** y descrito como autorización del club. |
| P0 | El pugilista no tenía estado explícito de licencia. | Se agregó `licenciaFederativa` a cada `Pugilista`. |
| P0 | La ficha mezclaba “federar” con “licenciar al atleta”. | La ficha ahora separa ambas acciones y muestra el costo de emitir la licencia individual. |
| P0 | El botón podía interpretarse como una licencia global. | Ahora dice **Emitir licencia del atleta ($200)**. |
| P1 | El teléfono anunciaba que el alumno “era profesional”. | Ahora anuncia que está listo para competir oficialmente. |
| P1 | La ayuda del plantel no explicaba la secuencia completa. | Explica: licencia del entrenador → prácticas → licencia individual. |
| P1 | El récord existía, pero no estaba expresamente vinculado a la licencia. | Cada atleta mantiene su récord individual y los resultados guardan `miId`. |
| P1 | Las partidas antiguas no tenían el nuevo campo. | La sanitización considera federados antiguos como licenciados y alumnos antiguos como no licenciados. |
| P2 | El salto profesional podía parecer arbitrario. | El mensaje explica que cambian rivales y bolsas. |

## Flujo esperado

### Alumno

- Tiene `rol: alumno` y `licenciaFederativa: false`.
- Puede entrenar y completar prácticas si está activo.
- No puede buscar rival ni aparecer como boxeador federado.

### Emisión de licencia

- El club debe tener la Licencia de Entrenador.
- El alumno debe estar activo, no en lista de espera y tener las prácticas completas.
- Se descuentan $200.
- El alumno pasa a `rol: boxeador` y `licenciaFederativa: true`.
- Su récord comienza en `0-0 (0 KO)`.

### Boxeador federado

- Puede buscar rivales y entrar en cartelera.
- Su récord se actualiza solo con sus combates.
- El récord queda visible en plantel, ficha, ofertas y pantalla de combate.
- El circuito amateur puede avanzar a profesional luego de las victorias requeridas.

## Validaciones realizadas

- Separación de licencia del entrenador y licencia individual: cubierta por test.
- Un atleta en espera no puede licenciarse.
- Un alumno sin prácticas no puede licenciarse.
- La emisión conserva el récord individual en cero.
- Los resultados se filtran por `miId` en la ficha.
- 12 tests pasando.
- Typecheck, build y auditoría estructural correctos.
- Flujo visible validado en navegador con la ficha técnica actualizada.

## Riesgos pendientes para la siguiente auditoría

- Agregar número visible de licencia individual y fecha de emisión.
- Separar visualmente “federado amateur” de “profesional” en todas las pantallas.
- Definir si una licencia puede suspenderse, renovarse o perderse.
- Revisar si las peleas de exhibición afectan o no el récord oficial.
- Revisar el costo de licencia según división, edad o circuito.

