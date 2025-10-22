import { useState } from "react";

function AiModal({ isOpen, onClose, selectedCount }) {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  const generateWithAI = async () => {
    setLoading(true);

    const promptText = `
Tu es un expert en relations presse. Rédige un communiqué de presse professionnel et percutant à destination des journalistes.

Le communiqué doit inclure :
- Un titre clair et accrocheur
- Un chapeau (résumé de 2 phrases)
- Un corps structuré avec paragraphes informatifs
- Des citations humaines si pertinent
- Un encart “Infos clés” si nécessaire
- Un appel à action ou à contact à la fin

Sujet du communiqué : "${prompt}"

Reste sobre, concis, orienté presse écrite. Langue : français.
`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: promptText }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const finalText = data.choices?.[0]?.message?.content || "Erreur de génération.";
      setGenerated(finalText);
    } catch (error) {
      console.error(error);
      setGenerated("❌ Une erreur est survenue lors de la génération.");
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
