/**
 * SCRIPT DE TEST D'AUTHENTIFICATION
 * Teste la création d'utilisateur, connexion et routes protégées
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuth() {
  try {
    log('blue', '🧪 DÉBUT DES TESTS D\'AUTHENTIFICATION');

    // Test utilisateur
    const testUser = {
      name: 'Jean Testeur',
      email: 'jean.testeur@test.com',
      password: 'TestPassword123',
      company: 'Test Company'
    };

    // 1. Test inscription
    log('yellow', '\n📝 Test d\'inscription...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      log('green', '✅ Inscription réussie');
      console.log('   Token:', registerResponse.data.token?.substring(0, 50) + '...');
      console.log('   Utilisateur:', registerResponse.data.user?.name);
    } catch (error) {
      if (error.response?.status === 409) {
        log('yellow', '⚠️  Utilisateur existe déjà, tentative de connexion...');
      } else {
        log('red', `❌ Erreur inscription: ${error.response?.data?.message || error.message}`);
        return;
      }
    }

    // 2. Test connexion
    log('yellow', '\n🔐 Test de connexion...');
    let token;
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      token = loginResponse.data.token;
      log('green', '✅ Connexion réussie');
      console.log('   Token:', token?.substring(0, 50) + '...');
      console.log('   Utilisateur:', loginResponse.data.user?.name);
    } catch (error) {
      log('red', `❌ Erreur connexion: ${error.response?.data?.message || error.message}`);
      return;
    }

    // 3. Test route protégée - profil utilisateur
    log('yellow', '\n👤 Test d\'accès au profil...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log('green', '✅ Accès au profil réussi');
      console.log('   Nom:', profileResponse.data.user?.name);
      console.log('   Email:', profileResponse.data.user?.email);
      console.log('   Rôle:', profileResponse.data.user?.role);
    } catch (error) {
      log('red', `❌ Erreur accès profil: ${error.response?.data?.message || error.message}`);
    }

    // 4. Test route protégée - contacts
    log('yellow', '\n📇 Test d\'accès aux contacts...');
    try {
      const contactsResponse = await axios.get(`${API_BASE}/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log('green', '✅ Accès aux contacts réussi');
      console.log('   Nombre de contacts:', contactsResponse.data.total || 0);
    } catch (error) {
      log('red', `❌ Erreur accès contacts: ${error.response?.data?.message || error.message}`);
    }

    // 5. Test route protégée - campagnes
    log('yellow', '\n📧 Test d\'accès aux campagnes...');
    try {
      const campaignsResponse = await axios.get(`${API_BASE}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log('green', '✅ Accès aux campagnes réussi');
      console.log('   Nombre de campagnes:', campaignsResponse.data.campaigns?.length || 0);
    } catch (error) {
      log('red', `❌ Erreur accès campagnes: ${error.response?.data?.message || error.message}`);
    }

    // 6. Test accès non autorisé
    log('yellow', '\n🚫 Test d\'accès sans token...');
    try {
      await axios.get(`${API_BASE}/contacts`);
      log('yellow', '⚠️  Accès sans token autorisé (optionalAuth)');
    } catch (error) {
      if (error.response?.status === 401) {
        log('green', '✅ Accès correctement bloqué sans token');
      } else {
        log('red', `❌ Erreur inattendue: ${error.response?.data?.message || error.message}`);
      }
    }

    // 7. Test token invalide
    log('yellow', '\n🔒 Test avec token invalide...');
    try {
      await axios.get(`${API_BASE}/campaigns`, {
        headers: { Authorization: 'Bearer invalid_token_here' }
      });
      log('red', '❌ Accès autorisé avec token invalide (problème de sécurité)');
    } catch (error) {
      if (error.response?.status === 401) {
        log('green', '✅ Token invalide correctement rejeté');
      } else {
        log('red', `❌ Erreur inattendue: ${error.response?.data?.message || error.message}`);
      }
    }

    // 8. Test vérification de token
    log('yellow', '\n🔍 Test de vérification de token...');
    try {
      const verifyResponse = await axios.post(`${API_BASE}/auth/verify-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log('green', '✅ Vérification de token réussie');
      console.log('   Valide:', verifyResponse.data.success);
    } catch (error) {
      log('red', `❌ Erreur vérification token: ${error.response?.data?.message || error.message}`);
    }

    // 9. Test refresh token
    log('yellow', '\n🔄 Test de rafraîchissement de token...');
    try {
      const refreshResponse = await axios.post(`${API_BASE}/auth/refresh-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log('green', '✅ Rafraîchissement de token réussi');
      console.log('   Nouveau token:', refreshResponse.data.token?.substring(0, 50) + '...');
    } catch (error) {
      log('red', `❌ Erreur refresh token: ${error.response?.data?.message || error.message}`);
    }

    log('blue', '\n🎉 TESTS D\'AUTHENTIFICATION TERMINÉS');

  } catch (error) {
    log('red', `💥 Erreur fatale: ${error.message}`);
    console.error(error);
  }
}

// Démarrer les tests
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };