import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  React.useEffect(() => {
    console.log("✅ App.jsx simplifiée chargée");
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={
        <div style={{ padding: '20px' }}>
          <h1>🚀 PressPilot - Page Test</h1>
          <p>Route non trouvée. Aller vers:</p>
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </div>
      } />
    </Routes>
  );
}

export default App;