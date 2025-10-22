import React from "react";
import "../styles/HomePage.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-bandstream.png";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <header>
        {/* Logo dans une bannière verte */}
      </header>
      <main className="main-content">
        <div className="logo-container">
          <img src={logo} alt="Bandstream Logo" className="homepage-logo" />
        </div>
        <section className="hero-section">
          <h1 className="slogan">No fluff, just results</h1>
          <h2 className="headline">
            Bienvenue sur <span className="accent-text">PressPilot</span> by Bandstream
          </h2>
          <p className="description">
            Simplifiez la gestion de vos campagnes presse grâce à une solution intelligente,
            moderne et entièrement intégrée. Transformez vos relations presse avec notre CRM
            dédié aux professionnels.
          </p>
          <div className="cta-section">
            <button
              className="cta-button"
              onClick={() => navigate("/login")}
            >
              Acceder a PressPilot
            </button>
          </div>
        </section>
      </main>
      <section className="features-section">
        <div className="features-container">
          <div className="feature-card">
            <h3 className="feature-title">Gestion de contacts optimisée</h3>
            <p className="feature-description">
              Centralisez et organisez efficacement votre base de journalistes et influenceurs.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Suivi de campagnes intuitif</h3>
            <p className="feature-description">
              Visualisez en temps réel les performances de vos actions presse.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Reporting instantané</h3>
            <p className="feature-description">
              Générez des rapports professionnels pour démontrer votre impact.
            </p>
          </div>
        </div>
      </section>
      <footer>
        <p>© 2025 Bandstream. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default HomePage;
