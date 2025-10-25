import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Layout from "../components/Layout";

const Campaigns = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous"); // tous, traites, a_traiter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  // État des messages de réponse
  const [responseMessages, setResponseMessages] = useState([]);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Simuler le chargement des données
        await new Promise(resolve => setTimeout(resolve, 1000));

        // En production, ici vous feriez appel à votre API pour récupérer les messages
        // const response = await api.get('/campaign-responses');
        // setResponseMessages(response.data);

      } catch (error) {
        console.error('Erreur chargement des messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les messages
  const filteredMessages = responseMessages.filter(message => {
    const matchesFilter = filter === "tous" || message.status === filter;
    const matchesSearch = searchTerm === "" ||
      message.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.mediaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.campaignName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Marquer un message comme traité/non traité
  const toggleMessageStatus = (messageId) => {
    setResponseMessages(prev => prev.map(message =>
      message.id === messageId
        ? { ...message, status: message.status === "traite" ? "a_traiter" : "traite" }
        : message
    ));
  };

  // Supprimer un message
  const deleteMessage = (messageId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      setResponseMessages(prev => prev.filter(message => message.id !== messageId));
    }
  };

  // Ouvrir la modale au double-clic
  const handleMessageDoubleClick = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
    setReplyContent("");
  };

  // Fermer la modale
  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
    setReplyContent("");
  };

  // Envoyer la réponse
  const sendReply = () => {
    if (!replyContent.trim()) {
      alert("Veuillez saisir un message de réponse.");
      return;
    }

    // En production, ici vous enverriez la réponse via votre API
    console.log("Envoi de la réponse:", {
      to: selectedMessage.sender,
      subject: `Re: ${selectedMessage.subject}`,
      content: replyContent,
      campaignId: selectedMessage.campaignName,
      artistId: selectedMessage.artistName
    });

    // Marquer le message comme traité
    toggleMessageStatus(selectedMessage.id);

    alert("Réponse envoyée avec succès !");
    closeModal();
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir l'icône selon le type de message
  const getMessageTypeIcon = (type) => {
    switch(type) {
      case 'demande_interview': return '🎤';
      case 'confirmation_chronique': return '📝';
      case 'confirmation_playlist': return '🎵';
      case 'confirmation_diffusion': return '📻';
      default: return '📧';
    }
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'haute': return '#ff4757';
      case 'moyenne': return '#ffa502';
      case 'basse': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const stats = {
    total: responseMessages.length,
    aTraiter: responseMessages.filter(m => m.status === "a_traiter").length,
    traites: responseMessages.filter(m => m.status === "traite").length,
    prioriteHaute: responseMessages.filter(m => m.priority === "haute").length
  };

  if (loading) {
    return (
      <Layout title="QUEUE DE RECEPTION" subtitle="Chargement...">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des messages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="QUEUE DE RECEPTION" subtitle="Messages de réponse aux campagnes">

      {/* Statistiques */}
      <div className="queue-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total messages</div>
        </div>
        <div className="stat-card urgent">
          <div className="stat-number">{stats.aTraiter}</div>
          <div className="stat-label">À traiter</div>
        </div>
        <div className="stat-card success">
          <div className="stat-number">{stats.traites}</div>
          <div className="stat-label">Traités</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-number">{stats.prioriteHaute}</div>
          <div className="stat-label">Priorité haute</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="queue-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par émetteur, média, sujet, artiste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "tous" ? "active" : ""}`}
            onClick={() => setFilter("tous")}
          >
            Tous ({stats.total})
          </button>
          <button
            className={`filter-btn ${filter === "a_traiter" ? "active" : ""}`}
            onClick={() => setFilter("a_traiter")}
          >
            À traiter ({stats.aTraiter})
          </button>
          <button
            className={`filter-btn ${filter === "traite" ? "active" : ""}`}
            onClick={() => setFilter("traite")}
          >
            Traités ({stats.traites})
          </button>
        </div>
      </div>

      {/* Table des messages */}
      <div className="messages-container">
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <span className="empty-icon">📬</span>
              <h3>Aucun message trouvé</h3>
              <p>
                {filter === "tous"
                  ? "Aucune réponse aux campagnes pour le moment."
                  : `Aucun message ${filter === "a_traiter" ? "à traiter" : "traité"} trouvé.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="messages-table">
            <div className="table-header">
              <div className="col-sender">Émetteur</div>
              <div className="col-subject">Objet du mail</div>
              <div className="col-artist">Artiste</div>
              <div className="col-campaign">Campagne</div>
              <div className="col-date">Reçu le</div>
              <div className="col-status">Statut</div>
              <div className="col-actions">Actions</div>
            </div>

            <div className="table-body">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message-row ${message.status}`}
                  onDoubleClick={() => handleMessageDoubleClick(message)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="col-sender">
                    <div className="sender-info">
                      <div className="sender-name">
                        {message.senderName}
                      </div>
                      <div className="sender-email">{message.sender}</div>
                      <div className="media-name">{message.mediaName}</div>
                    </div>
                  </div>

                  <div className="col-subject">
                    <div className="subject-info">
                      <div className="subject-text">{message.subject}</div>
                      <div className="priority-indicator"
                           style={{ backgroundColor: getPriorityColor(message.priority) }}>
                        {message.priority}
                      </div>
                    </div>
                  </div>

                  <div className="col-artist">
                    <div className="artist-name">{message.artistName}</div>
                  </div>

                  <div className="col-campaign">
                    <div className="campaign-name">{message.campaignName}</div>
                  </div>

                  <div className="col-date">
                    <div className="date-text">{formatDate(message.receivedAt)}</div>
                  </div>

                  <div className="col-status">
                    <button
                      className={`status-btn ${message.status}`}
                      onClick={() => toggleMessageStatus(message.id)}
                    >
                      {message.status === "traite" ? "✓ Traité" : "⏱ À traiter"}
                    </button>
                  </div>

                  <div className="col-actions">
                    <button
                      className="action-btn view"
                      onClick={() => {
                        // Ouvrir le détail du message
                        alert(`Contenu du message:\n\n${message.content}`);
                      }}
                      title="Voir le message"
                    >
                      👁
                    </button>
                    <button
                      className="action-btn reply"
                      onClick={() => {
                        // Ouvrir l'interface de réponse
                        window.open(`mailto:${message.sender}?subject=Re: ${message.subject}`);
                      }}
                      title="Répondre"
                    >
                      ↩️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteMessage(message.id)}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions en lot */}
      {filteredMessages.length > 0 && (
        <div className="bulk-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              const unprocessed = filteredMessages.filter(m => m.status === "a_traiter");
              unprocessed.forEach(message => toggleMessageStatus(message.id));
            }}
          >
            Marquer tous comme traités
          </button>
          <button
            className="btn-tertiary"
            onClick={() => {
              if (window.confirm("Êtes-vous sûr de vouloir marquer tous les messages visibles comme non traités ?")) {
                const processed = filteredMessages.filter(m => m.status === "traite");
                processed.forEach(message => toggleMessageStatus(message.id));
              }
            }}
          >
            Marquer tous comme non traités
          </button>
        </div>
      )}

      {/* Modale de détail et réponse */}
      {showModal && selectedMessage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="message-type-icon">
                  {getMessageTypeIcon(selectedMessage.type)}
                </span>
                <h3>{selectedMessage.subject}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Informations du message */}
              <div className="message-details">
                <div className="detail-row">
                  <strong>De :</strong>
                  <span>{selectedMessage.senderName} ({selectedMessage.sender})</span>
                </div>
                <div className="detail-row">
                  <strong>Média :</strong>
                  <span>{selectedMessage.mediaName}</span>
                </div>
                <div className="detail-row">
                  <strong>Artiste :</strong>
                  <span>{selectedMessage.artistName}</span>
                </div>
                <div className="detail-row">
                  <strong>Campagne :</strong>
                  <span>{selectedMessage.campaignName}</span>
                </div>
                <div className="detail-row">
                  <strong>Reçu le :</strong>
                  <span>{formatDate(selectedMessage.receivedAt)}</span>
                </div>
                <div className="detail-row">
                  <strong>Priorité :</strong>
                  <span className="priority-badge" style={{ backgroundColor: getPriorityColor(selectedMessage.priority) }}>
                    {selectedMessage.priority}
                  </span>
                </div>
              </div>

              {/* Contenu du message */}
              <div className="message-content">
                <h4>Message :</h4>
                <div className="content-text">{selectedMessage.content}</div>
              </div>

              {/* Zone de réponse */}
              <div className="reply-section">
                <h4>Répondre :</h4>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Votre réponse..."
                  rows="6"
                  className="reply-textarea"
                />
                <div className="reply-info">
                  <small>
                    Cette réponse sera rattachée à la campagne "{selectedMessage.campaignName}"
                    pour l'artiste {selectedMessage.artistName}
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={sendReply}
                disabled={!replyContent.trim()}
              >
                📧 Envoyer la réponse
              </button>
              <button
                className="btn-secondary"
                onClick={() => toggleMessageStatus(selectedMessage.id)}
              >
                {selectedMessage.status === "traite" ? "⏱ Marquer non traité" : "✓ Marquer traité"}
              </button>
              <button className="btn-tertiary" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .queue-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 2px solid #f0f0f0;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .stat-card.urgent {
          border-color: #ff4757;
          background: linear-gradient(135deg, #fff5f5 0%, #white 100%);
        }

        .stat-card.success {
          border-color: #2ed573;
          background: linear-gradient(135deg, #f0fff4 0%, #white 100%);
        }

        .stat-card.warning {
          border-color: #ffa502;
          background: linear-gradient(135deg, #fffaf0 0%, #white 100%);
        }

        .stat-number {
          font-size: 36px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: 500;
        }

        .queue-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #0ED894;
        }

        .search-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 2px solid #e5e5e5;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: #0ED894;
        }

        .filter-btn.active {
          background: #0ED894;
          border-color: #0ED894;
          color: white;
        }

        .messages-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .messages-table {
          width: 100%;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.5fr 1fr 1fr 120px;
          background: #f8f9fa;
          padding: 16px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .message-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.5fr 1fr 1fr 120px;
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
          align-items: center;
        }

        .message-row:hover {
          background-color: #f8f9fa;
        }

        .message-row.a_traiter {
          background-color: #fff5f5;
          border-left: 4px solid #ff4757;
        }

        .message-row.traite {
          background-color: #f0fff4;
          border-left: 4px solid #2ed573;
        }

        .sender-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sender-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
        }

        .message-type-icon {
          font-size: 16px;
        }

        .sender-email {
          font-size: 12px;
          color: #7f8c8d;
        }

        .media-name {
          font-size: 12px;
          color: #0ED894;
          font-weight: 500;
        }

        .subject-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .subject-text {
          font-size: 14px;
          color: #2c3e50;
          line-height: 1.4;
        }

        .priority-indicator {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          color: white;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
        }

        .artist-name, .campaign-name {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
        }

        .date-text {
          font-size: 13px;
          color: #7f8c8d;
        }

        .status-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .status-btn.traite {
          background: #2ed573;
          color: white;
        }

        .status-btn.a_traiter {
          background: #ff4757;
          color: white;
        }

        .status-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        .col-actions {
          display: flex;
          gap: 4px;
          justify-content: center;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #f0f0f0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .action-btn.view:hover {
          background: #3498db;
          color: white;
        }

        .action-btn.reply:hover {
          background: #0ED894;
          color: white;
        }

        .action-btn.delete:hover {
          background: #e74c3c;
          color: white;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
        }

        .empty-state h3 {
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #7f8c8d;
          margin-bottom: 0;
        }

        .bulk-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #0ED894;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Styles pour la modale */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e5e5;
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 20px;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f0f0f0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: #e0e0e0;
          transform: scale(1.1);
        }

        .modal-body {
          padding: 24px;
        }

        .message-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-row strong {
          min-width: 100px;
          color: #7f8c8d;
          font-size: 14px;
        }

        .detail-row span {
          color: #2c3e50;
          font-size: 14px;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .message-content {
          margin-bottom: 24px;
        }

        .message-content h4 {
          margin: 0 0 12px 0;
          color: #2c3e50;
          font-size: 16px;
        }

        .content-text {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 16px;
          color: #2c3e50;
          line-height: 1.6;
          white-space: pre-wrap;
          font-size: 14px;
        }

        .reply-section h4 {
          margin: 0 0 12px 0;
          color: #2c3e50;
          font-size: 16px;
        }

        .reply-textarea {
          width: 100%;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        .reply-textarea:focus {
          outline: none;
          border-color: #0ED894;
        }

        .reply-info {
          margin-top: 8px;
          color: #7f8c8d;
          font-style: italic;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 24px;
          border-top: 1px solid #e5e5e5;
          background: #f8f9fa;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .table-header, .message-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .queue-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: none;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            max-height: 95vh;
          }

          .modal-header, .modal-body, .modal-footer {
            padding: 16px;
          }

          .modal-footer {
            flex-direction: column;
          }

          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .detail-row strong {
            min-width: auto;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Campaigns;