// src/pages/Register.js
import React, { useState } from "react";
import "../styles/Register.css";
import axios from "axios";
import logo from "../assets/logo-presspilot.png";
import FacebookLoginButton from "../components/FacebookLoginButton";

const Register = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, form);
      setMessage(`Inscription réussie ! Bienvenue, ${res.data.user.email}`);
      setForm({ email: "", password: "" });
    } catch (error) {
      console.error("Erreur d'inscription :", error.response?.data || error.message);
      setMessage("Erreur : " + (error.response?.data?.error || error.message));
    }
  };

  const handleFacebookSuccess = (msg) => {
    setMessage(msg);
  };

  const handleFacebookError = (errMsg) => {
    setMessage(errMsg);
  };

  return (
    <div className="register-page">
      <div className="logo-container">
        <img src={logo} alt="Bandstream Logo" className="register-logo" />
      </div>

      <div className="register-container">
        <h1 className="page-title">
          Créer un compte <span className="accent-text">PressPilot</span>
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Adresse e-mail</label>
            <input
              type="email"
              name="email"
              id="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <input
              type="password"
              name="password"
              id="password"
              className="form-input"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="register-button">S'inscrire</button>
        </form>

        <div className="social-login">
          <p>Ou</p>
          <FacebookLoginButton
            onSuccess={handleFacebookSuccess}
            onError={handleFacebookError}
          />
        </div>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Register;
