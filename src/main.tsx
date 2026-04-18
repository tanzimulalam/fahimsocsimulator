import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { FontGate } from "./components/FontGate";
import { ClassroomProvider } from "./context/ClassroomContext";
import { SimulatorProvider } from "./context/SimulatorContext";
import "./styles/global.css";

// HashRouter: GitHub Pages has no SPA fallback for deep links on refresh (B1).
// Do NOT set basename to import.meta.env.BASE_URL: the hash path is always "/" or "/inbox"
// etc., not "/fahimsocsimulator/...". Wrong basename makes Router render null (blank page).
// Vite `base` still prefixes /fahimsocsimulator/ for built assets only.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
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