# Diseño de Juego Canónico

## Actualización R3 aprobada — 2026-10-01

Reglas aprobadas R3: hitos Anselmo únicos c1–c10; c8 $60/+1 por 3 recreativos, c9 $80/+2 por 1.500 seguidores, c10 $120/+2 por 3 victorias. Sin pagos repetidos/retroactivos. Cuerda velocidad ×1,10; plataforma defensa/eficacia ×1,10; proteínas fuerza ×1,20 y recuperación semanal +4 techo100 sin energía inmediata. Arena elimina alquiler futuro sin devolución. Velada tentativa vacía cancela sin beneficios/cargo. Gerente/coordinador comparten cupo, entrenador independiente; altas de coordinador suspendidas, empleados existentes conservados. Ofertas sin TV ordinarias coherentes; contratos antiguos preservados.


**Proyecto:** La Vida del Boxeo  
**Versión:** 1.0  
**Estado:** Documento rector  
**Alcance:** idea base, experiencia, reglas y límites de producto

## 1. Propósito

La Vida del Boxeo es un simulador accesible de gestión de un gimnasio y una promotora. El jugador empieza con un local pequeño, pocos alumnos y recursos limitados. Su objetivo es formar boxeadores, sostener una economía sana, construir reputación y convertir el club en una institución histórica.

El juego debe ser entendible para una persona de 10 a 90 años. La profundidad aparece por las decisiones y sus consecuencias, no por vocabulario innecesariamente técnico ni por controles difíciles.

## 2. Fantasía del jugador

“Estoy construyendo un gimnasio de barrio. Descubro personas, las ayudo a progresar, decido cuándo competir, cuido su salud, negocio oportunidades y veo crecer una historia que queda en la ciudad.”

La experiencia combina:

- gestión ligera;
- formación de personas;
- boxeo amateur y profesional;
- economía con decisiones;
- calendario y eventos;
- reputación, seguidores y legado;
- automatización opcional.

## 3. Principios de diseño

1. **Claridad antes que complejidad.** Cada pantalla debe responder qué ocurre, por qué ocurre y qué puede hacer el jugador.
2. **Decisiones con sentido.** El jugador debe elegir qué financiar, quién compite, quién descansa y qué oportunidad aceptar.
3. **Automatización amable.** El personal contratado puede ejecutar tareas repetitivas, pero el jugador conserva el control.
4. **Consecuencias legibles.** Dinero, energía, record, fama, seguidores y lesiones deben explicar sus cambios.
5. **Escala humana.** No se deben generar cientos de perfiles visibles sin necesidad.
6. **Accesibilidad.** Botones claros, textos cortos, detalle ampliado y navegación consistente.
7. **Sin presión artificial.** El juego puede tener riesgo, pero no castigos opacos ni pérdidas irreversibles sin aviso.
8. **Assets después.** El funcionamiento y la comprensión son prioritarios frente a modelos 2D/3D finales.

## 4. Bucle principal

### Día a día

- **Lunes a viernes:** preparación, gestión, compras, cursos, personal, eventos y planificación.
- **Sábado:** guanteos automáticos; peleas agendadas cuando corresponda.
- **Domingo:** balance, cobros, gastos, evolución, envejecimiento y planificación de la semana siguiente.

El jugador puede avanzar día por día o usar Semana rápida. Cada salto debe mostrar un resumen de lo que ocurrió.

### Bucle de una carrera

```text
recibir alumnos
  → formar y guantear
  → tramitar Licencia Amateur
  → competir y cuidar energía/salud
  → mejorar record y ranking
  → pasar a Profesional
  → disputar títulos
  → retirarse o entrar al Salón de la Fama
```

## 5. Entidades principales

- **Coach:** persona que dirige el club.
- **Gimnasio:** sede, equipamiento, mejoras y reputación.
- **Alumno recreativo:** paga cuota, no tiene ficha competitiva pública.
- **Alumno en formación:** entrena y realiza guanteos.
- **Boxeador amateur:** tiene Licencia Amateur y record competitivo.
- **Boxeador profesional:** tiene Licencia Profesional y circuito propio.
- **Personal:** automatiza o potencia áreas del club.
- **Club rival:** institución persistente de la ciudad.
- **Evento:** oportunidad o problema temporal con vencimiento.
- **Movimiento económico:** ingreso, gasto, inversión o deuda trazable.
- **Temporada:** marco temporal para ranking, torneos y cambios poblacionales.

## 6. Formación y competición

### Guanteo

Guanteo, sparring y fogueo representan la misma actividad. El vocabulario visible principal es **guanteo**. Un guanteo:

- entrena más que una sesión común;
- puede producir desgaste y una lesión leve;
- sirve para el requisito de licencia;
- continúa después de licenciar al boxeador como entrenamiento.

### Licencias

- El coach obtiene la **Licencia de Entrenador** mediante el curso correspondiente.
- Cada pugil tramita su propia **Licencia Amateur** tras completar 10 guanteos.
- La etiqueta cambia a **Licencia Profesional** cuando el boxeador pasa de circuito.
- La licencia del coach nunca reemplaza la licencia individual del pugil.

### Frecuencia

- Guanteos: normalmente los sábados.
- Peleas: agendables según disponibilidad; frecuencia recomendada mínima de dos semanas.
- Energía mínima para pactar pelea: 70%.
- Lesión activa: bloquea la pelea.
- El Director Técnico puede asignar descanso automáticamente.

### Profesionalismo

El salto profesional se ofrece al alcanzar 50 peleas amateurs. El jugador puede aceptar o mantener al pugil amateur. El cupo objetivo es 10 amateurs y 10 profesionales por sede.

### Títulos

- Nacional: desde 10–15 peleas profesionales, record y ranking adecuados.
- Regional: desde 25 peleas profesionales y trayectoria positiva.
- Continental/mundial: desde 25+ peleas, ranking alto, victorias y requisitos especiales.

Los números definitivos se balancean con pruebas, pero nunca se contradicen entre UI, motor y documentos.

## 7. Record, salud y reputación

El record incluye victorias, derrotas, empates y nocauts. Un record negativo reduce bolsa y oportunidades. Un record positivo aumenta valor. Los nocauts y los títulos impulsan ranking, fama y seguidores.

La salud incluye energía, lesión, gravedad, semanas restantes y tratamiento. Ninguna pantalla debe permitir pactar una pelea inválida.

La fama representa reconocimiento del club. Los seguidores representan audiencia acumulada y deben crecer más lentamente que la fama.

## 8. Economía

Fuentes:

- cuotas de alumnos;
- cuotas recreativas;
- aportes de boxeadores;
- bolsas y entradas;
- sponsors;
- marca de ropa;
- sucursales;
- eventos sociales y recaudaciones.

Gastos:

- alquiler;
- sueldos;
- equipamiento;
- cursos;
- propiedades;
- tratamientos;
- eventos;
- reparaciones;
- financiamiento.

Todo movimiento debe registrarse y aparecer en el balance. El jugador debe poder detectar si está a favor o en pérdida y por qué.

**Parámetros económicos provisionales calibrados (2026-09-23):** bingo ($200 de inversión, retorno $250–$420), juegos de mesa ($100, $130–$220), festival/exhibición ($500, $580–$850 y +3 fama) y clase abierta ($60, $80–$140; puede aportar un recreativo temporal, con tope global 12). Son parámetros del candidato, no garantía de balance final; la clase temporal cobra una cuota de una semana. El detalle reproducible está en `docs/audits/27_Calibracion_Economica_Escenarios_2026-09-23.md`. El costo por caja negativa tiene un tope de $50/semana; la nómina todavía puede hundir una carrera (`docs/audits/28_Gate_Insolvencia_Nomina_y_Recuperacion_2026-09-23.md`). La salida aprobada para la insolvencia severa está en el apartado siguiente. Los eventos continúan con retorno mínimo superior a la inversión; el riesgo de los eventos también queda pendiente antes del playtest final.

### Política aprobada de insolvencia severa — Gate 30

El dueño aprobó la opción E y confirmó que, al reconstruir una carrera insolvente, deben sobrevivir únicamente el récord del entrenador y los hitos históricos (incluidas las entradas del Salón de la Fama). La caja, deuda, plantel, empleados, cursos, equipamiento, propiedades, patrocinio, fama, seguidores y bonificaciones de legado se reinician. El cierre es voluntario, destructivo, requiere caja ≤ −$1.500 y confirmación explícita; conserva el identificador del guardado para actualizar esa partida en el próximo autosave. No se presenta como “recuperación” de la carrera: es una reconstrucción sin activos heredados. Antes de contratar personal cuyo costo deje negativo el flujo semanal recurrente, se muestra el impacto estimado y se requiere confirmar que se asume el riesgo. El cálculo excluye ayudas iniciales, actividades puntuales y patrocinio temporal. Evidencia/alcance: `docs/audits/30_Gate_Politica_Insolvencia_y_Cierre_2026-09-23.md`.

## 9. Pestañas canónicas

- **Gimnasio:** diorama, estaciones, mejoras activas y acceso al plantel.
- **Ciudad:** clubes, inmuebles, ranking mundial, Salón de la Fama y talentos.
- **Plantel:** recreativos como contador, alumnos, amateurs, profesionales, licencias y transferencias.
- **Mercado:** equipamiento, indumentaria, salud, instalaciones y difusión.
- **Mi Perfil:** record del coach, cursos, bienes raíces, finanzas sociales y legado.
- **Personal:** contratación, automatización, sucursales y costos.
- **Calendario:** fechas, peleas, eventos, guanteos, balance y pendientes.
- **Panel del Club:** mensajes, sponsors, prensa y consejos de Don Anselmo.

## 10. Regla de expansión

Una expansión debe poder agregar una entidad, regla o contenido sin romper las partidas existentes, sin duplicar el cálculo económico y sin exigir que el jugador aprenda vocabulario nuevo sin explicación.

## 11. Fuera de alcance actual

No forman parte de esta versión canónica:

- generación de assets 3D finales;
- modelos humanos finales;
- animaciones artísticas definitivas;
- monetización real;
- login Google y backend online.

Esas áreas se agregan como módulos después del cierre funcional y técnico.
