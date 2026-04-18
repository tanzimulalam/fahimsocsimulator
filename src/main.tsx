import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { FontGate } from "./components/FontGate";
import { ClassroomProvider } from "./context/ClassroomContext";
import { SimulatorProvider } from "./context/SimulatorContext";
import "./styles/global.css";

// HashRouter: GitHub Pages has no SPA fallback for deep links on refresh (B1).
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter basename={basename}>
      <FontGate>
        <ClassroomProvider>
          <SimulatorProvider>
            <App />
          </SimulatorProvider>
        </ClassroomProvider>
      </FontGate>
    </HashRouter>
  </StrictMode>
);