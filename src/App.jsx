import React from "react";
import { Routes, Route } from "react-router-dom";
import "./utils/clearData.js"; // Utilitaires de réinitialisation
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Artists from "./pages/Artists";
import Projects from "./pages/Projects";
import Campaigns from "./pages/Campaigns";
import Contacts from "./pages/Contacts";
import Phoning from "./pages/Phoning";
import Analytics from "./pages/Analytics";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import JournalistAnalytics from "./pages/JournalistAnalytics";
import BestTimesAnalytics from "./pages/BestTimesAnalytics";
import Settings from "./pages/Settings";
import HomePage from "./pages/HomePage";
import TestPage from "./pages/TestPage";
import TestConnectivity from "./pages/TestConnectivity";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [hasError, setHasError] = React.useState(false);
  const [errorInfo, setErrorInfo] = React.useState(null);

  // Logger d'erreurs globales
  React.useEffect(() => {
    window.onerror = (msg, src, line, col, error) => {
      console.error("🌍 GLOBAL JS ERROR:", msg, error);
      setHasError(true);
      setErrorInfo({ msg, src, line, col, error: error?.toString() });
    };

    window.addEventListener('unhandledrejection', (event) => {
      console.error("🌍 UNHANDLED PROMISE REJECTION:", event.reason);
      setHasError(true);
      setErrorInfo({ msg: 'Unhandled Promise Rejection', error: event.reason?.toString() });
    });

    console.log("✅ App.jsx chargé avec succès");
  }, []);

  if (hasError) {
    return (
      <div style={{
        padding: '20px',
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '20px',
        fontFamily: 'monospace'
      }}>
        <h2 style={{ color: '#dc2626', margin: '0 0 16px 0' }}>
          🚨 Application Error Detected
        </h2>
        <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>Error:</strong> {errorInfo?.msg}<br/>
          <strong>Source:</strong> {errorInfo?.src}<br/>
          <strong>Line:</strong> {errorInfo?.line}<br/>
          <strong>Details:</strong> {errorInfo?.error}
        </div>
        <button
          onClick={() => {
            setHasError(false);
            setErrorInfo(null);
            window.location.reload();
          }}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Application
        </button>
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<HomePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/test-connectivity" element={<TestConnectivity />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:artistId/projects" element={<Projects />} />
        <Route path="/artists/:artistId/projects/:projectId/campaigns" element={<Campaigns />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/phoning" element={<Phoning />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/analytics/campaigns/:campaignId" element={<CampaignAnalytics />} />
        <Route path="/analytics/journalists/:contactId" element={<JournalistAnalytics />} />
        <Route path="/analytics/best-times" element={<BestTimesAnalytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;