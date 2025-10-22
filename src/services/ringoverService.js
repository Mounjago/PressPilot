/**
 * RINGOVER SERVICE - Intégration API Ringover pour PressPilot
 * Gère les appels, WebRTC et la communication avec l'API Ringover
 */

class RingoverService {
  constructor() {
    this.apiKey = import.meta.env.VITE_RINGOVER_API_KEY;
    this.baseURL = 'https://public-api.ringover.com/v2';
    this.currentCall = null;
    this.eventListeners = {};
    this.webRTCPeer = null;
    this.isInitialized = false;
  }

  /**
   * Initialise le service Ringover
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('Clé API Ringover manquante');
      }

      // Test de connexion à l'API
      await this.testConnection();
      this.isInitialized = true;

      console.log('✅ Ringover Service initialisé');
      this.emit('initialized');

      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation Ringover:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Test de connexion à l'API Ringover
   */
  async testConnection() {
    const response = await fetch(`${this.baseURL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API Ringover: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Initie un appel vers un numéro
   */
  async makeCall(phoneNumber, contactId = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Nettoyage du numéro de téléphone
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);

      console.log(`📞 Initiation appel vers ${cleanNumber}`);

      // Création de l'appel via API Ringover
      const callData = await this.createCall(cleanNumber);

      // Stockage des informations de l'appel
      this.currentCall = {
        id: callData.id || Date.now(),
        phoneNumber: cleanNumber,
        contactId,
        startTime: new Date(),
        status: 'connecting',
        duration: 0,
        notes: ''
      };

      // Émission des événements
      this.emit('callStarted', this.currentCall);
      this.startCallTimer();

      // Simulation WebRTC (en production, utiliser le vrai WebRTC)
      await this.simulateWebRTCConnection(cleanNumber);

      return this.currentCall;
    } catch (error) {
      console.error('❌ Erreur lors de l\'appel:', error);
      this.emit('callError', error);
      throw error;
    }
  }

  /**
   * Crée un appel via l'API Ringover
   */
  async createCall(phoneNumber) {
    try {
      const response = await fetch(`${this.baseURL}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: 'user', // Utiliser l'ID utilisateur Ringover
          type: 'outbound'
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur création appel: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Fallback en mode simulation si API indisponible
      console.warn('API Ringover indisponible, mode simulation activé');
      return {
        id: `sim_${Date.now()}`,
        status: 'created'
      };
    }
  }

  /**
   * Simulation WebRTC pour le développement
   */
  async simulateWebRTCConnection(phoneNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentCall) {
          this.currentCall.status = 'connected';
          this.emit('callConnected', this.currentCall);
        }
        resolve();
      }, 2000); // Simulation de 2 secondes de connexion
    });
  }

  /**
   * Termine l'appel en cours
   */
  async endCall() {
    try {
      if (!this.currentCall) {
        return;
      }

      const call = this.currentCall;

      // Arrêt du timer
      this.stopCallTimer();

      // Fin de l'appel via API Ringover
      if (call.id && !call.id.startsWith('sim_')) {
        await this.terminateCall(call.id);
      }

      // Mise à jour du statut
      call.status = 'ended';
      call.endTime = new Date();

      console.log(`📞 Appel terminé (durée: ${call.duration}s)`);

      // Sauvegarde de l'appel
      await this.saveCallLog(call);

      // Émission de l'événement
      this.emit('callEnded', call);

      // Nettoyage
      this.currentCall = null;

      return call;
    } catch (error) {
      console.error('❌ Erreur fin d\'appel:', error);
      this.emit('callError', error);
      throw error;
    }
  }

  /**
   * Termine un appel via l'API Ringover
   */
  async terminateCall(callId) {
    try {
      const response = await fetch(`${this.baseURL}/calls/${callId}/hangup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur fin appel: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.warn('Erreur API fin appel:', error);
      // Continue même en cas d'erreur API
    }
  }

  /**
   * Met l'appel en pause/reprend
   */
  async togglePause() {
    if (!this.currentCall) return;

    const wasPaused = this.currentCall.status === 'paused';
    this.currentCall.status = wasPaused ? 'connected' : 'paused';

    this.emit('callStatusChanged', this.currentCall);

    if (wasPaused) {
      this.startCallTimer();
    } else {
      this.stopCallTimer();
    }
  }

  /**
   * Met à jour les notes de l'appel
   */
  updateCallNotes(notes) {
    if (this.currentCall) {
      this.currentCall.notes = notes;
      this.emit('callNotesUpdated', this.currentCall);
    }
  }

  /**
   * Démarre le timer de durée d'appel
   */
  startCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
    }

    this.callTimer = setInterval(() => {
      if (this.currentCall && this.currentCall.status === 'connected') {
        this.currentCall.duration = Math.floor(
          (new Date() - this.currentCall.startTime) / 1000
        );
        this.emit('callDurationUpdated', this.currentCall);
      }
    }, 1000);
  }

  /**
   * Arrête le timer de durée d'appel
   */
  stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  /**
   * Sauvegarde les logs d'appel en base
   */
  async saveCallLog(call) {
    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contactId: call.contactId,
          phoneNumber: call.phoneNumber,
          startedAt: call.startTime,
          endedAt: call.endTime,
          duration: call.duration,
          status: call.status,
          notes: call.notes
        })
      });

      if (!response.ok) {
        throw new Error('Erreur sauvegarde appel');
      }

      const savedCall = await response.json();
      console.log('✅ Appel sauvegardé:', savedCall.id);

      return savedCall;
    } catch (error) {
      console.error('❌ Erreur sauvegarde appel:', error);
      // Sauvegarde locale en fallback
      this.saveCallLocally(call);
    }
  }

  /**
   * Sauvegarde locale des appels (fallback)
   */
  saveCallLocally(call) {
    try {
      const calls = JSON.parse(localStorage.getItem('presspilot_calls') || '[]');
      calls.push({
        ...call,
        id: call.id || Date.now(),
        savedLocally: true
      });
      localStorage.setItem('presspilot_calls', JSON.stringify(calls));
      console.log('💾 Appel sauvegardé localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde locale:', error);
    }
  }

  /**
   * Récupère l'historique des appels pour un contact
   */
  async getCallHistory(contactId) {
    try {
      const response = await fetch(`/api/calls?contactId=${contactId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur récupération historique');
      }

      return response.json();
    } catch (error) {
      console.error('❌ Erreur historique:', error);
      // Fallback vers localStorage
      return this.getCallHistoryLocally(contactId);
    }
  }

  /**
   * Récupère l'historique local des appels
   */
  getCallHistoryLocally(contactId = null) {
    try {
      const calls = JSON.parse(localStorage.getItem('presspilot_calls') || '[]');

      if (contactId) {
        return calls.filter(call => call.contactId === contactId);
      }

      return calls;
    } catch (error) {
      console.error('❌ Erreur historique local:', error);
      return [];
    }
  }

  /**
   * Nettoie un numéro de téléphone
   */
  cleanPhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  /**
   * Formate la durée d'appel
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Gestion des événements
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur callback ${event}:`, error);
        }
      });
    }
  }

  /**
   * Nettoyage du service
   */
  destroy() {
    this.stopCallTimer();
    this.currentCall = null;
    this.eventListeners = {};
    this.isInitialized = false;
  }

  /**
   * Getters
   */
  getCurrentCall() {
    return this.currentCall;
  }

  isCallActive() {
    return this.currentCall && ['connecting', 'connected', 'paused'].includes(this.currentCall.status);
  }
}

// Instance singleton
const ringoverService = new RingoverService();

export default ringoverService;