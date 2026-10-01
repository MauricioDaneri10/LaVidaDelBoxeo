// ============================================================
// Audio sintetizado con Web Audio API (inicialización perezosa)
// Campana de asalto, impacto de guantes, monedas y ovación.
// ============================================================

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null;
let habilitado = (() => {
  try { return localStorage.getItem("vida-del-boxeo:sonido") !== "off"; } catch { return true; }
})();

export function audioHabilitado(): boolean { return habilitado; }
export function setAudioHabilitado(valor: boolean) {
  habilitado = valor;
  try { localStorage.setItem("vida-del-boxeo:sonido", valor ? "on" : "off"); } catch { /* preferencia opcional */ }
  if (!valor && ctx) {
    void ctx.suspend();
  } else if (valor && ctx) {
    void ctx.resume();
  }
}

function contexto(): AudioContext | null {
  if (!habilitado) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      maestro = ctx.createGain();
      maestro.gain.value = 0.5;
      maestro.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Debe llamarse dentro de un gesto del usuario (primer clic). */
export function iniciarAudio() {
  contexto();
}

function tono(freq: number, dur: number, tipo: OscillatorType = "sine", vol = 0.3, retraso = 0, caida = true) {
  const c = contexto();
  if (!c || !maestro) return;
  const t0 = c.currentTime + retraso;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (caida) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.6), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(maestro);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function ruido(dur: number, vol = 0.25, retraso = 0, filtro = 900) {
  const c = contexto();
  if (!c || !maestro) return;
  const t0 = c.currentTime + retraso;
  const largo = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, largo, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < largo; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / largo);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filtro;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(maestro);
  src.start(t0);
}

/** Ding-ding-ding de campana de asalto */
export function campana() {
  for (let i = 0; i < 3; i++) {
    tono(1180, 0.5, "triangle", 0.22, i * 0.32, false);
    tono(2360, 0.3, "sine", 0.07, i * 0.32, false);
  }
}

/** Impacto seco de guante (crítico = más grave y pesado) */
export function golpe(critico = false) {
  ruido(critico ? 0.16 : 0.09, critico ? 0.4 : 0.22, 0, critico ? 420 : 700);
  tono(critico ? 90 : 150, critico ? 0.22 : 0.12, "sine", critico ? 0.4 : 0.22);
}

/** Caída a la lona: golpe sordo + campanazo */
export function caida() {
  ruido(0.3, 0.45, 0, 300);
  tono(70, 0.4, "sine", 0.4);
  tono(1180, 0.5, "triangle", 0.15, 0.35, false);
}

/** Tick del conteo de protección del réferi */
export function conteo() {
  tono(640, 0.08, "square", 0.08, 0, false);
}

/** Monedas: par de campanitas agudas */
export function monedas() {
  tono(1560, 0.14, "sine", 0.16, 0, false);
  tono(2080, 0.2, "sine", 0.14, 0.09, false);
}

/** Ovación del público (ruido filtrado en crescendo) */
export function ovacion() {
  const c = contexto();
  if (!c || !maestro) return;
  ruido(1.6, 0.3, 0, 1400);
  ruido(1.2, 0.2, 0.2, 900);
  for (let i = 0; i < 6; i++) tono(300 + Math.random() * 700, 0.3, "sine", 0.03, Math.random() * 0.8, false);
}

/** Campana final de pelea */
export function campanaFinal() {
  campana();
  ovacion();
}

/** Notificación del teléfono */
export function notificacion() {
  tono(880, 0.12, "sine", 0.12, 0, false);
  tono(1320, 0.16, "sine", 0.1, 0.12, false);
}
