import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { campaignsApi } from "../api";

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await campaignsApi.getAll();

        if (isMounted) {
          setCampaigns(response.campaigns || []);
          setError("");
        }
      } catch (err) {
        console.error("Erreur lors du chargement des campagnes :", err);
        if (isMounted) {
          setError("Impossible de charger les campagnes.");
          setCampaigns([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <div className="campaigns-section">Chargement des campagnes...</div>;
  if (error) return <div className="campaigns-section error-message">{error}</div>;
  if (campaigns.length === 0) return <div className="campaigns-section">Aucune campagne disponible.</div>;

  return (
    <div className="campaigns-section bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="section-header mb-4">
        <h2 className="chart-title text-lg sm:text-xl font-semibold text-gray-900">Campagnes récentes</h2>
      </div>

      {/* Mobile: Card view */}
      <div className="block sm:hidden space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-gray-900 truncate pr-2">{c.name}</h3>
              <span className={`status px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                c.status === "sent"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {c.status === "sent" ? "Envoyée" : "Brouillon"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {new Date(c.created_at).toLocaleDateString()}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Ouverture</span>
                <div className="rate-bar h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="rate-progress h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${c.open_rate || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-1 block">{c.open_rate || 0}%</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Clic</span>
                <div className="rate-bar h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="rate-progress h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${c.click_rate || 0}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-1 block">{c.click_rate || 0}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table view with horizontal scroll */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="campaigns-table w-full min-w-full">
          <thead className="table-header">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[200px]">Nom</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[120px]">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[100px]">Statut</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[120px]">Ouverture</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[100px]">Clic</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr className="table-row border-b border-gray-100 hover:bg-gray-50 transition-colors" key={c.id}>
                <td className="campaign-name py-3 px-4 font-medium text-gray-900">{c.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`status px-2 py-1 text-xs font-medium rounded-full ${
                    c.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.status === "sent" ? "Envoyée" : "Brouillon"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="rate-bar flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="rate-progress h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${c.open_rate || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 min-w-[2.5rem] text-right">{c.open_rate || 0}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="rate-bar flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="rate-progress h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${c.click_rate || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 min-w-[2.5rem] text-right">{c.click_rate || 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignList;
