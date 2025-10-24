// Utilitaire pour tester la connectivité avec le backend
import { contactsApi, campaignsApi, projectsApi, analyticsApi } from '../api';
import authService from './authService';

class ApiTester {
  constructor() {
    this.results = {
      backend: { status: 'pending', message: '', data: null },
      auth: { status: 'pending', message: '', data: null },
      contacts: { status: 'pending', message: '', data: null },
      campaigns: { status: 'pending', message: '', data: null },
      projects: { status: 'pending', message: '', data: null },
      analytics: { status: 'pending', message: '', data: null }
    };
  }

  async testBackendConnectivity() {
    console.log('🔍 Test de connectivité backend...');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/health`);
      const data = await response.json();

      this.results.backend = {
        status: 'success',
        message: '✅ Backend accessible',
        data: {
          version: data.version,
          environment: data.environment,
          database: data.database,
          emailService: data.services?.email?.status || 'unknown'
        }
      };

      console.log('✅ Backend health check:', data);
      return true;

    } catch (error) {
      this.results.backend = {
        status: 'error',
        message: '❌ Backend inaccessible',
        data: error.message
      };

      console.error('❌ Backend health check failed:', error);
      return false;
    }
  }

  async testAuthentication() {
    console.log('🔍 Test d\'authentification...');

    try {
      // Test avec les identifiants admin par défaut
      const response = await authService.login({
        email: 'admin@presspilot.fr',
        password: 'admin123'
      });

      this.results.auth = {
        status: 'success',
        message: '✅ Authentification réussie',
        data: {
          user: response.user,
          hasToken: !!response.token
        }
      };

      console.log('✅ Login réussi:', response.user);
      return true;

    } catch (error) {
      this.results.auth = {
        status: 'error',
        message: `❌ Erreur d'authentification: ${error.response?.data?.message || error.message}`,
        data: error.response?.data
      };

      console.error('❌ Login failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testContacts() {
    console.log('🔍 Test API Contacts...');

    try {
      const response = await contactsApi.getAll({ limit: 5 });

      this.results.contacts = {
        status: 'success',
        message: `✅ Contacts récupérés (${response.totalContacts || 0} total)`,
        data: {
          totalContacts: response.totalContacts,
          contacts: response.contacts?.slice(0, 3) || []
        }
      };

      console.log('✅ Contacts API:', response);
      return true;

    } catch (error) {
      this.results.contacts = {
        status: 'error',
        message: `❌ Erreur API Contacts: ${error.response?.data?.message || error.message}`,
        data: error.response?.data
      };

      console.error('❌ Contacts API failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testCampaigns() {
    console.log('🔍 Test API Campaigns...');

    try {
      const response = await campaignsApi.getAll({ limit: 5 });

      this.results.campaigns = {
        status: 'success',
        message: `✅ Campagnes récupérées (${response.totalCampaigns || 0} total)`,
        data: {
          totalCampaigns: response.totalCampaigns,
          campaigns: response.campaigns?.slice(0, 3) || []
        }
      };

      console.log('✅ Campaigns API:', response);
      return true;

    } catch (error) {
      this.results.campaigns = {
        status: 'error',
        message: `❌ Erreur API Campaigns: ${error.response?.data?.message || error.message}`,
        data: error.response?.data
      };

      console.error('❌ Campaigns API failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testProjects() {
    console.log('🔍 Test API Projects...');

    try {
      const response = await projectsApi.getAll({ limit: 5 });

      this.results.projects = {
        status: 'success',
        message: `✅ Projets récupérés (${response.totalProjects || 0} total)`,
        data: {
          totalProjects: response.totalProjects,
          projects: response.projects?.slice(0, 3) || []
        }
      };

      console.log('✅ Projects API:', response);
      return true;

    } catch (error) {
      this.results.projects = {
        status: 'error',
        message: `❌ Erreur API Projects: ${error.response?.data?.message || error.message}`,
        data: error.response?.data
      };

      console.error('❌ Projects API failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testAnalytics() {
    console.log('🔍 Test API Analytics...');

    try {
      const response = await analyticsApi.getDashboard('7d');

      this.results.analytics = {
        status: 'success',
        message: '✅ Analytics récupérés',
        data: {
          period: response.period,
          overview: response.overview
        }
      };

      console.log('✅ Analytics API:', response);
      return true;

    } catch (error) {
      this.results.analytics = {
        status: 'error',
        message: `❌ Erreur API Analytics: ${error.response?.data?.message || error.message}`,
        data: error.response?.data
      };

      console.error('❌ Analytics API failed:', error.response?.data || error.message);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Début des tests de connectivité Frontend ↔ Backend');
    console.log('='.repeat(60));

    const tests = [
      { name: 'Backend Health', fn: () => this.testBackendConnectivity() },
      { name: 'Authentication', fn: () => this.testAuthentification() },
      { name: 'Contacts API', fn: () => this.testContacts() },
      { name: 'Campaigns API', fn: () => this.testCampaigns() },
      { name: 'Projects API', fn: () => this.testProjects() },
      { name: 'Analytics API', fn: () => this.testAnalytics() }
    ];

    let successCount = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      try {
        const success = await test.fn();
        if (success) successCount++;

        // Petit délai entre les tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Test ${test.name} échoué:`, error);
      }
    }

    console.log('='.repeat(60));
    console.log(`📊 Résultats: ${successCount}/${totalTests} tests réussis`);

    if (successCount === totalTests) {
      console.log('🎉 Tous les tests sont passés ! Frontend ↔ Backend opérationnel');
    } else {
      console.log('⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus');
    }

    return {
      success: successCount === totalTests,
      results: this.results,
      summary: {
        total: totalTests,
        passed: successCount,
        failed: totalTests - successCount,
        successRate: Math.round((successCount / totalTests) * 100)
      }
    };
  }

  getResults() {
    return this.results;
  }

  getReadableReport() {
    const report = {
      title: '📋 Rapport de connectivité Frontend ↔ Backend',
      timestamp: new Date().toLocaleString(),
      sections: []
    };

    Object.entries(this.results).forEach(([key, result]) => {
      report.sections.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        status: result.status,
        message: result.message,
        hasData: !!result.data
      });
    });

    return report;
  }
}

// Fonction utilitaire pour tester rapidement la connectivité
export const quickConnectivityTest = async () => {
  const tester = new ApiTester();
  return await tester.runFullTest();
};

// Fonction pour créer un contact de test
export const createTestContact = async () => {
  try {
    const testContact = {
      name: 'Test Contact',
      email: `test-${Date.now()}@example.com`,
      company: 'Test Company',
      category: 'journalist',
      priority: 'medium',
      notes: 'Contact créé automatiquement pour tester la connectivité'
    };

    const response = await contactsApi.create(testContact);
    console.log('✅ Contact de test créé:', response);
    return response;

  } catch (error) {
    console.error('❌ Erreur création contact de test:', error);
    throw error;
  }
};

export default ApiTester;