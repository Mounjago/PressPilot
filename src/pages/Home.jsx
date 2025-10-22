import { useEffect, useState } from "react";
import { getContacts } from "../api";
import ContactCard from "../components/ContactCard";
import FilterBar from "../components/FilterBar";
import { exportToCsv } from "../utils/exportToCsv";
import AiModal from "../components/AiModal";
import SendEmailModal from "../components/SendEmailModal";

function Home() {
  // État pour les contacts et filtres
  const [contacts, setContacts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    periodicity: "",
    zone: "",
  });

  // États pour les modales
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [communicatedMessage, setCommunicatedMessage] = useState("");

  // Chargement initial des contacts depuis l'API
  useEffect(() => {
    getContacts()
      .then((data) => {
        setContacts(data);
        setFiltered(data);
      })
      .catch(console.error);
  }, []);

  // Appliquer les filtres lorsque ceux-ci ou les contacts changent
  useEffect(() => {
    const result = contacts.filter((c) => {
      return (
        (!filters.periodicity || c.periodicity === filters.periodicity) &&
        (!filters.zone || c.zone === filters.zone)
      );
    });
    setFiltered(result);
  }, [filters, contacts]);

  // Gestion de la sélection des contacts
  const toggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-600 mb-2">Contacts Presse</h1>

      {/* Barre de filtres et compteur de sélection */}
      <div className="flex justify-between items-center mb-4">
        <FilterBar filters={filters} setFilters={setFilters} />
        <div className="text-right text-sm text-gray-600">
          {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Boutons d'actions si une sélection est faite */}
      {selected.length > 0 && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              const toExport = contacts.filter((c) => selected.includes(c.id));
              exportToCsv("contacts-selection.csv", toExport);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exporter la sélection (.csv)
          </button>
          <button
            onClick={() => setAiModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Générer un communiqué IA
          </button>
          <button
            onClick={() => setSendModalOpen(true)}
            disabled={!communicatedMessage}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Envoyer ce communiqué
          </button>
        </div>
      )}

      {/* Affichage de la liste des contacts filtrés */}
      {filtered.length > 0 ? (
        <ul className="grid gap-4">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              isSelected={selected.includes(contact.id)}
              toggleSelection={toggleSelection}
            />
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Aucun contact trouvé.</p>
      )}

      {/* Modale pour générer le communiqué via IA */}
      <AiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        selectedCount={selected.length}
        onGenerated={(text) => setCommunicatedMessage(text)}
      />

      {/* Modale pour envoyer le communiqué par Mailmeteor */}
      <SendEmailModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        contacts={contacts.filter((c) => selected.includes(c.id))}
        message={communicatedMessage}
      />
    </div>
  );
}

export default Home;
