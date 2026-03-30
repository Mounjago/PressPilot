import { useState } from "react";
import config from '../config';

function AiModal({ isOpen, onClose, selectedCount }) {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  const generateWithAI = async () => {
    setLoading(true);

    try {
      // Proxy AI requests through backend to keep API key server-side
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${config.apiUrl}/ai/generate-press-release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ subject: prompt }),
      });

      const data = await response.json();
      if (data.success) {
        setGenerated(data.data?.content || "Erreur de génération.");
      } else {
        setGenerated(`Erreur: ${data.message || 'Erreur de génération.'}`);
      }
    } catch (error) {
      setGenerated("Une erreur est survenue lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-xl w-full relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-black text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-4 text-green-700">
          Générer un communiqué pour {selectedCount} contact{selectedCount > 1 ? "s" : ""}
        </h2>

        <input
          type="text"
          placeholder="Sujet ou idée du communiqué"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />

        <button
          onClick={generateWithAI}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={loading || !prompt}
        >
          {loading ? "Génération..." : "Générer avec IA"}
        </button>

        {generated && (
          <textarea
            rows="14"
            className="mt-4 w-full border rounded p-2 text-sm font-mono"
            value={generated}
            readOnly
          />
        )}
      </div>
    </div>
  );
}

export default AiModal;
