import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { analyticsApi } from "../api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const StatsGraph = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);

      // Charger les données analytiques depuis l'API
      const response = await analyticsApi.getDashboard('7d');

      if (response && response.chartData) {
        // Utiliser les vraies données de l'API
        setChartData({
          labels: response.chartData.labels || ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
          datasets: response.chartData.datasets || [
            {
              label: "Ouvertures",
              data: response.chartData.openings || [0, 0, 0, 0, 0, 0, 0],
              borderColor: "#0ED894",
              backgroundColor: "#0ED894",
              tension: 0.4
            },
            {
              label: "Clics",
              data: response.chartData.clicks || [0, 0, 0, 0, 0, 0, 0],
              borderColor: "#6979F8",
              backgroundColor: "#6979F8",
              tension: 0.4
            }
          ]
        });
      } else {
        // Données par défaut si l'API ne retourne rien
        setChartData({
          labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
          datasets: [
            {
              label: "Ouvertures",
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: "#0ED894",
              backgroundColor: "#0ED894",
              tension: 0.4
            },
            {
              label: "Clics",
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: "#6979F8",
              backgroundColor: "#6979F8",
              tension: 0.4
            }
          ]
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du graphique:', error);

      // Données par défaut en cas d'erreur
      setChartData({
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [
          {
            label: "Ouvertures",
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: "#0ED894",
            backgroundColor: "#0ED894",
            tension: 0.4
          },
          {
            label: "Clics",
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: "#6979F8",
            backgroundColor: "#6979F8",
            tension: 0.4
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      }
    }
  };

  if (loading) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h2 className="chart-title">Performance des campagnes</h2>
        </div>
        <div className="chart-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h2 className="chart-title">Performance des campagnes</h2>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StatsGraph;
