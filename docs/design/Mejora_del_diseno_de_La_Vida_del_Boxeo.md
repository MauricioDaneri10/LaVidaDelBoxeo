# 🥊 DOCUMENTO DE DISEÑO Y AUDITORÍA INTEGRAL: LA VIDA DEL BOXEO
**Versión:** 5.0 — Auditoría Microscópica de Fórmulas Matemáticas, Balances Numéricos, Conexiones de Sistemas y Blindaje de Código  
**Idioma:** Español Neutro Universal (100% en Español)  
**Enfoque:** Simulador de Gestión y Vida Deportiva — Tono Gratificante, Relajado, Sin Frustraciones y Automatizable.

---

## 🔬 SECCIÓN I: AUDITORÍA MICROSCÓPICA DE FÓRMULAS Y BALANCES

A nivel microscópico, hemos auditado y calibrado cada ecuación matemática del juego para garantizar que no existan cuellos de botella, estancamientos numéricos ni ventajas desmedidas:

---

### 1.1. Ecuación Microscópica de Crecimiento en Entrenamiento
* **Falla en el código previo:** Al acercarse el atributo a su techo de potencial, la ganancia caía a cero absoluto (`room / 60`), congelando la progresión de los boxeadores avanzados.
* **Fórmula Microscópica Calibrada:**
  $$\Delta \text{Atributo} = 0.45 \times \left(0.60 + \frac{\text{Talento}}{150}\right) \times M_{\text{Instalaciones}} \times M_{\text{Personal}} \times \left(\frac{\text{Potencial} - \text{AtributoActual} + 15}{65}\right)$$
  - **Mínimo Garantizado:** Incluso a nivel 85+, el atleta sigue progresando al menos $+0.12$ por semana de entrenamiento focalizado.
  - **Efecto de Doble Turno (Lun-Mié-Vie):** Multiplicador de $1.35\times$ en ganancia de atributos, con consumo de energía ajustado de $-6$ puntos (en lugar de $-3$).
  - **Válvula de Seguridad de Fatiga:** Si la energía del atleta desciende por debajo de 40 puntos, el sistema reduce automáticamente la intensidad a sesión de recuperación activa para evitar que llegue lesionado al sábado.

---

### 1.2. Ecuación Microscópica del Motor de Combate (Impacto, Daño y Eficacia)
* **Probabilidad de Conectar Golpe (Acierto):**
  $$P_{\text{Acierto}} = 0.50 + \frac{\text{Ataque}_{\text{Atacante}} + \text{Eficacia}_{\text{Atacante}} \times 1.5}{500} - \frac{\text{Defensa}_{\text{Defensor}} + \text{Técnica}_{\text{Defensor}}}{500} + M_{\text{Instrucción}}$$
  *(Acotado estrictamente entre $0.15$ y $0.92$ para evitar invulnerabilidad o fallos permanentes).*

* **Daño por Impacto Limpio:**
  $$\text{DañoBase} = \left(\text{Fuerza} \times 0.40 + \text{Potencia} \times 0.60\right) \times 0.14 \times \left(0.50 + 0.50 \times \frac{\text{Energía}}{100}\right) \times M_{\text{Instrucción}}$$
  - **Golpe Crítico (Probabilidad $\propto \text{Potencia} + \text{Eficacia}$):** Daño multiplicado por $1.85\times$ con destello visual y sonido contundente.
  - **Golpe a la Zona Blanda (Cuerpo):** Además del daño numérico, drena $-4$ de estamina al rival y reduce su velocidad un $5\%$ durante el resto del asalto.

---

### 1.3. Algoritmo de Puntuación de los 3 Jueces (Sistema de 10 Puntos Obligatorios)
Al sonar la campana de cada asalto, el motor calcula el rendimiento independiente de cada boxeador:
$$\text{RendimientoAsalto} = \text{GolpesConectados} \times 1.2 + \text{DañoEfectivo} \times 0.8 + \text{Eficacia} \times 0.5$$
- **Asignación de Puntos Oficial:**
  * Si hubo **1 Caída a la Lona (Knockdown):** Tarjeta **10 - 8** para el agresor.
  * Si hubo **2 Caídas a la Lona:** Tarjeta **10 - 7**.
  * Si no hubo caídas: El púgil con mayor rendimiento gana el asalto **10 - 9** (o 10-10 en empate microscópico).
- **Sesgos Microscópicos de los 3 Jueces:**
  * *Juez 1 (Técnico):* Pondera con $+20\%$ la Eficacia y la Defensa.
  * *Juez 2 (Agresivo):* Pondera con $+20\%$ los Golpes de Poder y el Ataque.
  * *Juez 3 (Neutral):* Puntuación estándar equilibrada.

---

### 1.4. Algoritmo Microscópico de Matchmaking (Terna de 3 Rivales)
Dado el nivel de tu boxeador ($N_{\text{Jugador}}$):
1. 🟢 **Rival Accesible:** Genera un rival con $N_{\text{Rival}} = \text{clamp}(N_{\text{Jugador}} - \text{randInt}(3, 6), 20, 99)$. Récord generado: $2-4$. Bolsa: $\$200-\$350$.
2. 🟡 **Rival Parejo:** Genera un rival con $N_{\text{Rival}} = \text{clamp}(N_{\text{Jugador}} + \text{randInt}(-2, 2), 20, 99)$. Récord generado: $5-2$. Bolsa: $\$500-\$800$.
3. 🔴 **Rival Desafío:** Genera un rival con $N_{\text{Rival}} = \text{clamp}(N_{\text{Jugador}} + \text{randInt}(5, 9), 20, 99)$. Récord generado: $9-1$ ($6$ KOs). Bolsa: $\$1.400-\$2.200$.

* **Invarianza Estricta:** Mismo género ($M/F$) y misma división de peso exacta garantizada al $100\%$.

---

### 1.5. Fórmulas Económicas de Balance Semanal y Eventos del Club
* **Ingresos Semanales por Alumnos:**
  $$\text{IngresoAlumnos} = N_{\text{Alumnos}} \times \left(\$18 + \text{NivelInstalaciones} \times \$6\right)$$
* **Eventos Comunitarios de Fin de Semana:**
  * 🎟️ **Gran Bingo Familiar ($200 costo):** Recauda $\$200 + \text{Fama} \times \$14 + \text{randInt}(150, 450)$ (con Fama 15: $\approx \$650-\$900$).
  * 🃏 **Torneo de Juegos de Mesa ($100 costo):** Recauda $\$100 + \text{Fama} \times \$8 + \text{randInt}(80, 250)$.
  * 🍕 **Festival y Exhibición de Boxeo ($500 costo):** Recauda $\$500 + \text{Fama} \times \$25 + \text{randInt}(300, 800) + 3 \text{ Fama}$.
* **Ingreso Pasivo de Sucursales (con Gerente contratado):**
  $$\text{IngresoPasivoSucursal} = \$650 + \text{FamaGeneral} \times \$8 \quad (\approx \$750 \text{ a } \$1.450/\text{semana por sede})$$

---

## 🔗 SECCIÓN II: AUDITORÍA DE CONEXIONES INTERNAS (SIN FUGAS DE ESTADO)

```
+---------------------------------------------------------------------------------------------------+
|                           MATRIZ DE CONEXIONES Y DEPENDENCIAS CRUZADAS                            |
+------------------------------+-------------------------------+------------------------------------+
| Disparador de Acción         | Efecto Inmediato              | Efecto Secundario Acoplado         |
+------------------------------+-------------------------------+------------------------------------+
| • Ganar Cinturón de Título   | +Bolsa y +Fama inmediata      | Cuelga el cinturón físico en la    |
|                              |                               | pared y atrae patrocinadores caros |
| • Fogueo de 10 Guanteos      | Otorga "Bono de Madurez"      | Habilita la Licencia Federativa sin|
|                              |                               | penalización de nervios en debut   |
| • Comprar Sucursal y Gerente | Abre nueva sede en el mapa    | Genera ingresos pasivos semanales y|
|                              |                               | descubre talentos cada 3 semanas   |
| • Lanzar Marca de Ropa       | Abre catálogo de indumentaria | Ventas automáticas semanales       |
|                              |                               | proporcionales al nivel de Fama    |
| • Retiro con Honores (36+ a) | Libera cupo en el plantel     | Otorga +15 Fama y permite ficharlo |
|                              |                               | como Entrenador Asistente a mitad $│
+------------------------------+-------------------------------+------------------------------------+
```

---

## 🛡️ SECCIÓN III: BLINDAJE DE CÓDIGO Y GESTIÓN DE ERRORES EN RUNTIME

1. **Migración Segura de Partidas (`localStorage`):**
   - Función `sanitizarEstado()` que rellena valores por defecto si el navegador carga una partida antigua v1.0.
2. **Audio Nativo sin Bloqueos del Navegador:**
   - `AudioContext` con inicialización perezosa (*lazy init*) activado con el primer clic del usuario en la pantalla.
3. **Escalabilidad Visual del Gimnasio (Sin solapamiento de muñecos):**
   - Sistema de rotación activa de 6 a 8 atletas en pantalla y contador elegante de vestuarios para el resto.
4. **Acoplamiento Adaptativo del Teléfono:**
   - Dock lateral derecho en monitores (>1280px) y barra inferior con cajón deslizante en pantallas compactas (<1280px).
