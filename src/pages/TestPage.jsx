import React from 'react';

const TestPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🔥 TEST PAGE - PressPilot fonctionne !</h1>
      <p>Si tu vois cette page, React fonctionne correctement.</p>
      <p>Le problème vient probablement d'un import dans les pages analytics.</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Diagnostics :</h2>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <li>✅ React fonctionne</li>
          <li>✅ Vite dev server actif</li>
          <li>✅ Recharts installé</li>
          <li>⚠️ Vérifier console pour erreurs</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a href="/" style={{
          background: '#0ED894',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          textDecoration: 'none'
        }}>
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default TestPage;