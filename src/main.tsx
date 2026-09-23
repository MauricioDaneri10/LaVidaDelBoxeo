import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

class PantallaError extends React.Component<React.PropsWithChildren, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (!this.state.error) return this.props.children;
    return React.createElement("main", { className: "min-h-screen bg-[#17130f] p-8 text-[#f5e6c8]" },
      React.createElement("div", { className: "mx-auto max-w-xl rounded-2xl border border-[#a64b3c] bg-[#241b15] p-6" },
        React.createElement("h1", { className: "text-2xl font-bold" }, "El gimnasio necesita reiniciarse"),
        React.createElement("p", { className: "mt-2" }, "La partida sigue guardada. Recargá la página para volver al ring."),
        React.createElement("button", { className: "mt-5 rounded-lg bg-[#e8b23a] px-4 py-2 text-[#17130f]", onClick: () => window.location.reload() }, "Recargar juego")
      )
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(<PantallaError><App /></PantallaError>);
