import { useState } from "react";

function SendEmailModal({ isOpen, onClose, contacts, message }) {
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSend = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const payload = {
        // On envoie les IDs des contacts sélectionnés
        contactIds: contacts.map((c) => c.id),
        subject: subject,
        content: message,
        campaign_id: null, // ou passer un identifiant de campagne si nécessaire
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedback("📤 Emails envoyés avec succès !");
      } else {
        setFeedback("❌ Erreur d'envoi des emails.");
      }
    } catch (error) {
      console.error(error);
      setFeedback("❌ Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-black text-xl"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-blue-700">Envoyer le communiqué</h2>
        <input
          type="text"
          placeholder="Objet de l'email"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <textarea
          rows="10"
          value={message}
          readOnly
          className="w-full p-2 mb-4 border rounded font-mono text-sm"
        />
        <button
          onClick={handleSend}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!subject || loading}
        >
          {loading ? "Envoi en cours..." : "Envoyer le communiqué"}
        </button>
        {feedback && <p className="mt-4 text-center text-sm">{feedback}</p>}
      </div>
    </div>
  );
}

export default SendEmailModal;
