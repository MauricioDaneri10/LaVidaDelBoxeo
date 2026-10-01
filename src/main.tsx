import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registrarDiagnostico } from "./diagnostics";

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
    return React.createElement("main", { className: "min-h-screen bg-[#17130f] p-8 text-[#f5e6c8]" },
      React.createElement("div", { className: "mx-auto max-w-xl rounded-2xl border border-[#a64b3c] bg-[#241b15] p-6" },
        React.createElement("h1", { className: "text-2xl font-bold" }, "El gimnasio necesita reiniciarse"),
        React.createElement("p", { className: "mt-2" }, "La partida sigue guardada. Podés intentar volver al ring o recargar el juego."),
        this.state.message && React.createElement("p", { className: "mt-2 text-xs text-[#ffb0a8]" }, this.state.message),
        React.createElement("div", { className: "mt-5 flex flex-wrap gap-2" },
          React.createElement("button", { className: "rounded-lg bg-[#e8b23a] px-4 py-2 text-[#17130f]", onClick: () => this.setState({ error: false, message: "" }) }, "Volver a intentar"),
          React.createElement("button", { className: "rounded-lg border border-[#a64b3c] px-4 py-2 text-[#ffb0a8]", onClick: () => window.location.reload() }, "Recargar juego")
        )
      )
    );
  }
}

const contenedor = document.getElementById("root")!;
type RaizGlobal = typeof globalThis & { __vidaDelBoxeoRoot?: ReturnType<typeof ReactDOM.createRoot> };
const entorno = globalThis as RaizGlobal;
const raiz = entorno.__vidaDelBoxeoRoot ?? ReactDOM.createRoot(contenedor);
entorno.__vidaDelBoxeoRoot = raiz;
raiz.render(<PantallaError><App /></PantallaError>);
