import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

class PantallaError extends React.Component<React.PropsWithChildren, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  descargarRespaldo = () => {
    try {
      const partida = localStorage.getItem("vida-del-boxeo-v2");
      if (!partida) return;
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(new Blob([partida], { type: "application/json" }));
      enlace.download = "respaldo-vida-del-boxeo.json";
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } catch { /* la pantalla de emergencia no debe romperse de nuevo */ }
  };
  render() {
    if (!this.state.error) return this.props.children;
    return React.createElement("main", { className: "min-h-screen bg-[#17130f] p-8 text-[#f5e6c8]" },
      React.createElement("div", { className: "mx-auto max-w-xl rounded-2xl border border-[#a64b3c] bg-[#241b15] p-6" },
        React.createElement("h1", { className: "text-2xl font-bold" }, "El gimnasio necesita reiniciarse"),
        React.createElement("p", { className: "mt-2" }, "La partida sigue guardada. Podés intentar volver al ring o descargar un respaldo antes de recargar."),
        React.createElement("div", { className: "mt-5 flex flex-wrap gap-2" },
          React.createElement("button", { className: "rounded-lg bg-[#e8b23a] px-4 py-2 text-[#17130f]", onClick: () => this.setState({ error: false }) }, "Volver a intentar"),
          React.createElement("button", { className: "rounded-lg border border-[#a58d68] px-4 py-2 text-[#f5e6c8]", onClick: this.descargarRespaldo }, "Descargar respaldo"),
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
