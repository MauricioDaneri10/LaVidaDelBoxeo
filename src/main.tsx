import React from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
import "./index.css";
import App from "./App.tsx";
import { registrarDiagnostico } from "./diagnostics";
import { useMessages } from "./i18n";
import { TextoPaginado } from "./components/ui";
import {PrepararIdioma} from "./components/LanguagePicker";
import {useResponsiveCapacity} from "./components/useResponsiveCapacity";

function Recuperacion({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useMessages();
  const horizontal=useResponsiveCapacity("(max-height: 450px)");
  return <main className="flex h-dvh flex-col gap-2 bg-ink p-4 text-cream">
    <section className="bounded-detail mx-auto min-h-0 w-full max-w-xl flex-1 rounded-2xl border border-blood bg-panel p-4">
      <div>
      <h1 className="text-2xl font-bold">{t("recovery.title")}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <button autoFocus className="min-h-11 rounded-lg bg-gold px-4 py-2 text-ink" onClick={onRetry}>{t("recovery.retry")}</button>
        <button className="min-h-11 rounded-lg border border-blood px-4 py-2" onClick={() => window.location.reload()}>{t("recovery.reload")}</button>
      </div>
      </div>
      <TextoPaginado texto={[t("recovery.saved"),message ? t("recovery.detail", {message}) : ""].filter(Boolean).join("\n")} capacidad={horizontal?20:40} />
    </section>
    <footer role="contentinfo" data-text-role="secondary" className="shrink-0 text-center text-xs">MadArt Studios</footer>
  </main>;
}

class PantallaError extends React.Component<React.PropsWithChildren, { error: boolean; message: string }> {
  state = { error: false, message: "" };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error) {
    const diagnostico = registrarDiagnostico(error, "renderizado");
    console.error("Error de renderizado:", diagnostico);
    this.setState({ error: true, message: error.message });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <Recuperacion message={this.state.message} onRetry={() => this.setState({ error: false, message: "" })} />;
  }
}

const contenedor = document.getElementById("root")!;
type RaizGlobal = typeof globalThis & { __vidaDelBoxeoRoot?: ReturnType<typeof ReactDOM.createRoot> };
const entorno = globalThis as RaizGlobal;
const raiz = entorno.__vidaDelBoxeoRoot ?? ReactDOM.createRoot(contenedor);
entorno.__vidaDelBoxeoRoot = raiz;
// Load the animation/gesture features actually used, synchronously (also for portals).
// The default motion factory additionally bundles drag/layout projection we do not use.
raiz.render(<LazyMotion features={domAnimation} strict><PantallaError><PrepararIdioma><App /></PrepararIdioma></PantallaError></LazyMotion>);
