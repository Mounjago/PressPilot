import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

console.log("🚀 Initialisation de PressPilot...");

// Créer le root et rendre l'application
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log("✅ PressPilot initialisé avec succès !");