# ⚙️ ESPECIFICACIÓN FUNCIONAL Y MECÁNICAS DE JUEGO
**Título del Proyecto:** La Vida del Boxeo  
**Versión:** 2.0 — Auditoría y Blindaje Funcional Integral  
**Idioma:** Español Neutro Universal  
**Propósito:** Detalle del comportamiento interactivo, flujos de usuario, navegación entre atletas y reglas de negocio para cada pantalla y componente.

---

## 1. FLUJO DEL TIEMPO Y BUCLE PRINCIPAL (CORE LOOP)

El juego opera bajo un ciclo de **Turnos Semanales (Lunes a Domingo)**:

```
+---------------------------------------------------------------------------------------------------+
| LUNES A VIERNES              | SÁBADO                        | DOMINGO                            |
| (Fase de Gestión y Crecimiento)| (Noche de Combates y Guanteos)| (Balance General y Planificación)  |
+------------------------------+-------------------------------+------------------------------------+
| • Asignar entrenamientos     | • Se disputan hasta 2 peleas  | • Se presenta el ticket contable   |
|   en combo de 4 capacidades. |   federadas y 2 guanteos.     |   con superávit semanal.           |
| • Comprar equipamiento en    | • Se cobran las bolsas y      | • Se cobran cuotas de alumnos y    |
|   la tienda y contratar staff|   entradas de veladas.        |   se pagan sueldos consolidados.   |
| • Responder notificaciones   | • Se disputan los títulos     | • Se planifican bingos o eventos   |
|   y oportunidades del móvil. |   regionales o mundiales.     |   sociales para el fin de semana.  |
+------------------------------+-------------------------------+------------------------------------+
```

---

## 2. FUNCIONAMIENTO DE CADA PANTALLA Y COMPONENTE

### 2.1. Pestaña «Gimnasio» (Diorama 2.5D Interactivo)
- **5 Estaciones Estructuradas:**
  1. *Soga y Cardio:* Atletas asignados al combo de acondicionamiento o estilista saltando la cuerda con ritmo.
  2. *Sacos y Potencia:* Sacos de cuero que se balancean con físicas al recibir impactos de los alumnos.
  3. *Ring Central de Práctica:* Dos atletas guanteando con caretas y protector de cabeza.
  4. *Manoplas y Espejo:* Atleta haciendo sombra frente al espejo y entrenador con manoplas.
  5. *Banquito de Hidratación:* Atletas con energía menor a 40 descansando con toalla y agua.
- **Zona de Alto Rendimiento VIP (Desbloqueable con compra):** Ring exclusivo con iluminación neón donde los 3 atletas élite entrenan con $+70\%$ de velocidad de aprendizaje.
- **Vitrina de Cinturones:** Muestra físicamente los 4 cinturones conquistados (Regional, Nacional, Continental y Mundial).
- **Interacción:** Al hacer clic en cualquier atleta en pantalla, se abre instantáneamente su **Ficha Técnica Oficial**.

---

### 2.2. Pestaña «Plantel» (Gestión de Atletas y Cartelera)
- **Lista de Alumnos:** Muestra cuota aportada, nivel de talento descubierto y contador de guanteos previos (ej. 7/10).
- **Lista de Boxeadores Federados:** Muestra valoración general, récord (victorias, derrotas, nocauts) y título actual.
- **Ficha Técnica Oficial del Atleta:**
  * **Navegación Rápida:** Flechas laterales `[ ◄ Anterior ]` y `[ Siguiente ► ]` para revisar todos los atletas del plantel sin cerrar el modal.
  * **Gráfico de Radar Pentagonal/Hexagonal SVG:** Visualización de sus 11 capacidades en un solo gráfico.
  * **Donut de Récord:** Proporción de victorias por KO, decisiones y derrotas.
  * **Selector de 6 Combos de Entrenamiento:** Noqueador, Estilista, Presión Asfixiante, Maestro Táctico, Doble Turno (Lun-Mié-Vie) y Descanso Spa.
  * **Botón de Recomendación Inteligente («Consejo de la Esquina»):** 1 clic para aplicar el combo ideal recomendado.
  * **Tramitar Licencia Federativa ($200):** Se habilita con el curso de Director Técnico y tras acumular los guanteos aconsejados.

---

### 2.3. Cartelera de Sábado y Selección de Rival (Matchmaking)
Al presionar «Programar Pelea (Sábado)», el promotor despliega **3 ofertas transparentes**:
- 🟢 **Rival Accesible:** Nivel menor (-5 global). Récord discreto, bolsa baja ($250). Victoria segura para proteger el récord.
- 🟡 **Rival Parejo:** Nivel equivalente (±2 global). Bolsa media ($600). Combate equilibrado para subir en el ranking.
- 🔴 **Rival Desafío:** Nivel superior (+6 a +10 global). Bolsa alta ($1.800). Riesgo alto con salto masivo en la tabla.

---

### 2.4. Pantalla de Combate 2D (Ringside)
- **Desarrollo del Asalto:** Animaciones de jabs, golpes de poder con giro de cadera, bloqueos de codos y esquivas pendulares de cintura.
- **Botón «⚡ Simular Resto de la Pelea»:** Permite al jugador concluir instantáneamente los asaltos restantes bajo el mismo cálculo matemático exacto.
- **Estadísticas Oficiales de Golpes en Vivo:** Jabs conectados/lanzados, Golpes de poder conectados/lanzados y % de Eficacia.
- **Esquina Táctica Entre Asaltos:** Instrucciones de esquina (*Presionar*, *Distancia*, *Buscar Nocaut*, *Recuperar Aire*).
- **Caída a la Lona (Knockdown):** Conteo de protección del réferi de 1 a 10 con animación de reincorporación o KO definitivo.
- **Tarjetas de los 3 Jueces:** Puntuación independiente asalto por asalto bajo el Sistema de 10 Puntos Obligatorios (10-9, 10-8).
- **Efectos de Audio Sintetizados:** Campana oficial de asalto, impactos secos de guantes, monedas al cobrar y ovación del público.

---

### 2.5. Pestaña «Mercado» (Tienda Don Anselmo en 4 Categorías)
- **Filtros por Categoría:**
  1. *Equipamiento de Entrenamiento:* Vendas de Gel ($450), Sacos de Cuero ($900), Peras Doble Elástico ($550), Manoplas Pro ($650), Soga ($200), Piso Goma ($800), Ring Reglamentario ($2.500), Zona Élite VIP ($15.000).
  2. *Indumentaria de Atletas:* Bucal Moldeado ($180), Cabezal Olímpico ($600), Botas Antideslizantes ($750), Batas de Seda ($1.200).
  3. *Instalaciones y Salud:* Botiquín con Hielo ($350), Vestuarios con Duchas ($1.800), Barra de Proteínas ($3.200), Sauna Seco y Frío ($8.500).
  4. *Difusión y Marca Propia:* Carteles del Barrio ($250), Sonido Motivacional ($1.100), Marquesina Neón ($4.000), Vitrina de Trofeos ($5.500), Estudio de Marca de Ropa ($2.500).
- Cada artículo incluye su icono SVG dedicado y descripción de beneficio permanente.

---

### 2.6. Pestaña «Personal» y Eventos Comunitarios
- **Contratación y Automatización:**
  * *Director Técnico Principal ($850/mes):* Automatiza entrenamientos óptimos de todo el plantel.
  * *Representante Deportivo ($1.000/mes):* Automatiza la cartelera de peleas de los sábados buscando las mejores bolsas.
  * *Preparador Físico ($550/mes):* Duplica recuperación de energía y resistencia.
  * *Entrenador Asistente ($400/mes):* +25% crecimiento a los alumnos regulares.
  * *Jefe de Difusión ($950/mes):* +80% ventas de ropa de marca y organiza eventos sociales.
  * *Gerentes de Sucursal ($750/mes):* Administran sedes secundarias para generar ingresos pasivos semanales.
- **Eventos Comunitarios de Recaudación del Club:**
  * 🎟️ *Gran Bingo Familiar del Club:* Inversión $200 ➔ Recauda $600-$1.400 y atrae nuevos alumnos.
  * 🃏 *Torneo de Juegos de Mesa y Naipes:* Inversión $100 ➔ Recauda $400-$900.
  * 🍕 *Noche de Festival y Exhibición:* Inversión $500 ➔ Recauda $1.000-$2.500 y +3 de Fama.

---

### 2.7. Pestaña «Ciudad» (4 Distritos Interactivos)
1. *Distrito Tradicional (El Barrio):* Tu gimnasio principal, Club Social y gimnasios vecinos (*Club Ferro* y *Gimnasio La Loma*).
2. *Distrito Comercial (Avenida Central):* Tienda de Don Anselmo, imprenta de publicidad y taller de indumentaria.
3. *Distrito Residencial y Financiero:* Inmobiliaria (locales en venta, terrenos para edificar, apartamento personal o mansión) y banco.
4. *Distrito del Espectáculo:* Sede de la Federación y Gran Arena Central de Títulos Mundiales.

---

### 2.8. Pestaña «Perfil», Cursos y Panel de Configuración
- *Rama Deportiva:* Licencia DT ($1.500) ➔ Maestro de Esquina ($4.000) ➔ Director de Alto Rendimiento ($12.000).
- *Rama Promotora:* Organizador de Veladas ($3.500) ➔ Relaciones Públicas ($8.000) ➔ Mega-Eventos y Televisión ($25.000).
- *Rama Empresarial:* Administración de Clubes ($2.500) ➔ Gestión Inmobiliaria ($10.000) ➔ Franquicia Global ($35.000).
- *Viviendas Personales:* Apartamento Céntrico (elimina alquiler personal) o Mansión en Las Lomas (+15 Fama permanente).
- *Sistema de Legado:* Retiro con honores para reencarnar en tu mejor discípulo con multiplicadores de ingresos y prestigio.
- *Panel de Configuración:* Control de volumen de audio (Web Audio API) y exportación/importación de partida guardada en archivo `.json` descargable.
