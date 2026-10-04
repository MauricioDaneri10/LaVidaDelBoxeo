import React from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
import "./index.css";
import App from "./App.tsx";
import { registrarDiagnostico } from "./diagnostics";
import { useMessages } from "./i18n";
import { TextoPaginado } from "./components/ui";

function Recuperacion({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useMessages();
  return <main className="min-h-dvh bg-ink p-4 text-cream">
    <section className="mx-auto max-w-xl rounded-2xl border border-blood bg-panel p-4">
      <h1 className="text-2xl font-bold">{t("recovery.title")}</h1>
      <TextoPaginado texto={t("recovery.saved")} capacidad={40} />
      {message && <TextoPaginado texto={t("recovery.detail", { message })} capacidad={40} />}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="min-h-11 rounded-lg bg-gold px-4 py-2 text-ink" onClick={onRetry}>{t("recovery.retry")}</button>
        <button className="min-h-11 rounded-lg border border-blood px-4 py-2" onClick={() => window.location.reload()}>{t("recovery.reload")}</button>
      </div>
    </section>
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
raiz.render(<LazyMotion features={domAnimation} strict><PantallaError><App /></PantallaError></LazyMotion>);
