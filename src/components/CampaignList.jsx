import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import axios from "axios";

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/campaigns`);
        setCampaigns(res.data);
      } catch (err) {
        console.error("Erreur lors du chargement des campagnes :", err);
        setError("Impossible de charger les campagnes.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) return <div className="campaigns-section">Chargement des campagnes...</div>;
  if (error) return <div className="campaigns-section error-message">{error}</div>;
  if (campaigns.length === 0) return <div className="campaigns-section">Aucune campagne disponible.</div>;

  return (
    <div className="campaigns-section">
      <div className="section-header">
        <h2 className="chart-title">Campagnes récentes</h2>
      </div>

      <table className="campaigns-table">
        <thead className="table-header">
          <tr>
            <th>Nom</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Ouverture</th>
            <th>Clic</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr className="table-row" key={c.id}>
              <td className="campaign-name">{c.name}</td>
              <td>{new Date(c.created_at).toLocaleDateString()}</td>
              <td>
                <span className={`status ${c.status === "sent" ? "sent" : "draft"}`}>
                  {c.status === "sent" ? "Envoyée" : "Brouillon"}
                </span>
              </td>
              <td>
                <div className="rate-bar">
                  <div className="rate-progress" style={{ width: `${c.open_rate || 0}%` }}></div>
                </div>
              </td>
              <td>
                <div className="rate-bar">
                  <div className="rate-progress" style={{ width: `${c.click_rate || 0}%` }}></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignList;
