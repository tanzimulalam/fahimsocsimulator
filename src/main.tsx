import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ClassroomProvider } from "./context/ClassroomContext";
import { SimulatorProvider } from "./context/SimulatorContext";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClassroomProvider>
        <SimulatorProvider>
          <App />
        </SimulatorProvider>
      </ClassroomProvider>
    </BrowserRouter>
  </StrictMode>
);