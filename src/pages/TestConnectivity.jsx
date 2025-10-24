import React, { useState, useEffect } from 'react';
import { quickConnectivityTest, createTestContact } from '../utils/apiTest';
import authService from '../utils/authService';

const TestConnectivity = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      const results = await quickConnectivityTest();
      setTestResults(results);
    } catch (error) {
      console.error('Erreur lors des tests:', error);
      setTestResults({
        success: false,
        error: error.message,
        summary: { total: 0, passed: 0, failed: 1, successRate: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateContact = async () => {
    try {
      const contact = await createTestContact();
      alert(`Contact de test créé avec succès: ${contact.contact.name}`);
    } catch (error) {
      alert(`Erreur lors de la création du contact: ${error.message}`);
    }
  };

  const logout = () => {
    authService.logout();
    window.location.reload();
  };

  useEffect(() => {
    // Lancer les tests automatiquement au chargement
    runTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🔗 Test de connectivité Frontend ↔ Backend
          </h1>
          <p className="text-gray-600">
            Cette page teste la connexion entre le frontend et le backend PressPilot
          </p>

          {/* Informations de configuration */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Configuration actuelle:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">API URL:</span>
                <span className="ml-2 font-mono text-blue-600">
                  {import.meta.env.VITE_API_URL || 'http://localhost:3002'}
                </span>
              </div>
              <div>
                <span className="font-medium">Utilisateur connecté:</span>
                <span className="ml-2">
                  {authService.isAuthenticated() ?
                    authService.getCurrentUser()?.email || 'Oui' :
                    'Non connecté'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🔄 Tests en cours...' : '🚀 Lancer les tests'}
            </button>

            <button
              onClick={testCreateContact}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              👤 Créer un contact test
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              {showDetails ? '🙈 Masquer détails' : '👁️ Voir détails'}
            </button>

            {authService.isAuthenticated() && (
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                🚪 Se déconnecter
              </button>
            )}
          </div>
        </div>

        {/* Résultats des tests */}
        {testResults && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Résultats des tests
            </h2>

            {/* Résumé global */}
            <div className={`p-4 rounded-lg mb-6 ${
              testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${
                  testResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResults.success ? '🎉 Tous les tests sont passés !' : '⚠️ Certains tests ont échoué'}
                </span>
                {testResults.summary && (
                  <span className="text-sm text-gray-600">
                    {testResults.summary.passed}/{testResults.summary.total} réussis
                    ({testResults.summary.successRate}%)
                  </span>
                )}
              </div>
            </div>

            {/* Détails des tests */}
            {testResults.results && (
              <div className="space-y-4">
                {Object.entries(testResults.results).map(([key, result]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusIcon(result.status)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">
                            {key}
                          </h3>
                          <p className={`text-sm ${getStatusColor(result.status)}`}>
                            {result.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Détails supplémentaires */}
                    {showDetails && result.data && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Erreur globale */}
            {testResults.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">❌ Erreur globale:</h3>
                <p className="text-red-700 text-sm">{testResults.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions de debugging */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">🛠️ Instructions de debugging</h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p><strong>1.</strong> Vérifiez que le backend fonctionne sur le port 3002 :</p>
            <code className="block bg-blue-100 p-2 rounded font-mono text-xs">
              cd Backend-PressPilot-main && npm start
            </code>

            <p><strong>2.</strong> Vérifiez l'URL du backend dans .env :</p>
            <code className="block bg-blue-100 p-2 rounded font-mono text-xs">
              VITE_API_URL=http://localhost:3002
            </code>

            <p><strong>3.</strong> Testez manuellement l'API :</p>
            <code className="block bg-blue-100 p-2 rounded font-mono text-xs">
              curl http://localhost:3002/health
            </code>

            <p><strong>4.</strong> Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnectivity;