/**
 * APP.JSX - Routing principal avec split workspace (press / rp)
 * Routes publiques + routes protegees par interface
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./utils/clearData.js";

// Pages publiques
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import TestPage from "./pages/TestPage";
import TestConnectivity from "./pages/TestConnectivity";

// Pages communes
import WorkspaceSelector from "./pages/WorkspaceSelector";
import Settings from "./pages/Settings";

// Pages Attaches de presse (press)
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

// Pages BandStream RP
import DashboardRP from "./pages/rp/DashboardRP";
import PressReleases from "./pages/rp/PressReleases";
import Events from "./pages/rp/Events";
import MediaKits from "./pages/rp/MediaKits";

// Pages Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import OrganizationManagement from "./pages/admin/OrganizationManagement";

// Composants de route
import ProtectedRoute, { PublicRoute, AdminRoute } from "./components/ProtectedRoute";

// Composant de redirection intelligente post-login
const SmartRedirect = () => {
  return <ProtectedRoute><RedirectToWorkspace /></ProtectedRoute>;
};

const RedirectToWorkspace = () => {
  // Ce composant est rendu dans un ProtectedRoute, donc l'auth est garantie
  // Le ProtectedRoute gere deja la redirection vers /workspace si multi-workspace
  // Si on arrive ici, c'est qu'on a un workspace selectionne
  const workspace = localStorage.getItem('pp_workspace');
  if (workspace === 'rp') {
    return <Navigate to="/rp/dashboard" replace />;
  }
  return <Navigate to="/press/dashboard" replace />;
};

function App() {
  const [hasError, setHasError] = React.useState(false);
  const [errorInfo, setErrorInfo] = React.useState(null);

  React.useEffect(() => {
    window.onerror = (msg, src, line, col, error) => {
      console.error("GLOBAL JS ERROR:", msg, error);
      setHasError(true);
      setErrorInfo({ msg, src, line, col, error: error?.toString() });
    };

    window.addEventListener('unhandledrejection', (event) => {
      console.error("UNHANDLED PROMISE REJECTION:", event.reason);
      setHasError(true);
      setErrorInfo({ msg: 'Unhandled Promise Rejection', error: event.reason?.toString() });
    });

    console.log("App.jsx charge avec succes");
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
          Application Error Detected
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
      {/* ===== Routes publiques ===== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/test-connectivity" element={<TestConnectivity />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* ===== Workspace selector (admin multi-interface) ===== */}
      <Route path="/workspace" element={
        <ProtectedRoute>
          <WorkspaceSelector />
        </ProtectedRoute>
      } />

      {/* ===== Redirection intelligente ===== */}
      <Route path="/dashboard" element={<SmartRedirect />} />

      {/* ===== Routes Attaches de presse (/press/*) ===== */}
      <Route element={<ProtectedRoute requireInterface="press" />}>
        <Route path="/press/dashboard" element={<Dashboard />} />
        <Route path="/press/artists" element={<Artists />} />
        <Route path="/press/projects" element={<Projects />} />
        <Route path="/press/artists/:artistId/projects" element={<Projects />} />
        <Route path="/press/artists/:artistId/projects/:projectId/campaigns" element={<Campaigns />} />
        <Route path="/press/contacts" element={<Contacts />} />
        <Route path="/press/campaigns" element={<Campaigns />} />
        <Route path="/press/phoning" element={<Phoning />} />
        <Route path="/press/analytics" element={<Analytics />} />
        <Route path="/press/analytics/campaigns/:campaignId" element={<CampaignAnalytics />} />
        <Route path="/press/analytics/journalists/:contactId" element={<JournalistAnalytics />} />
        <Route path="/press/analytics/best-times" element={<BestTimesAnalytics />} />
        <Route path="/press/settings" element={<Settings />} />
      </Route>

      {/* ===== Routes BandStream RP (/rp/*) ===== */}
      <Route element={<ProtectedRoute requireInterface="rp" />}>
        <Route path="/rp/dashboard" element={<DashboardRP />} />
        <Route path="/rp/press-releases" element={<PressReleases />} />
        <Route path="/rp/events" element={<Events />} />
        <Route path="/rp/media-kits" element={<MediaKits />} />
        <Route path="/rp/contacts" element={<Contacts />} />
        <Route path="/rp/settings" element={<Settings />} />
      </Route>

      {/* ===== Routes Admin (/admin/*) ===== */}
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      } />
      <Route path="/admin/organizations" element={
        <AdminRoute>
          <OrganizationManagement />
        </AdminRoute>
      } />

      {/* ===== Retrocompatibilite: anciennes routes -> redirect ===== */}
      <Route path="/artists" element={<Navigate to="/press/artists" replace />} />
      <Route path="/projects" element={<Navigate to="/press/projects" replace />} />
      <Route path="/contacts" element={<Navigate to="/press/contacts" replace />} />
      <Route path="/campaigns" element={<Navigate to="/press/campaigns" replace />} />
      <Route path="/phoning" element={<Navigate to="/press/phoning" replace />} />
      <Route path="/analytics" element={<Navigate to="/press/analytics" replace />} />
      <Route path="/analytics/*" element={<Navigate to="/press/analytics" replace />} />
      <Route path="/settings" element={<Navigate to="/press/settings" replace />} />

      {/* ===== 404 -> redirect ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
