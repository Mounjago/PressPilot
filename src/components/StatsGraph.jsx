import React, { useState, useEffect, useRef } from "react";
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
import { useDashboardData } from "../pages/Dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const StatsGraph = () => {
  const { dashboardData, loading } = useDashboardData();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const chartRef = useRef(null);

  useEffect(() => {
    // Use shared dashboard data instead of making separate API calls
    if (dashboardData.chartData) {
      setChartData({
        labels: dashboardData.chartData.labels || ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: dashboardData.chartData.datasets || [
          {
            label: "Ouvertures",
            data: dashboardData.chartData.openings || [0, 0, 0, 0, 0, 0, 0],
            borderColor: "#0ED894",
            backgroundColor: "#0ED894",
            tension: 0.4
          },
          {
            label: "Clics",
            data: dashboardData.chartData.clicks || [0, 0, 0, 0, 0, 0, 0],
            borderColor: "#6979F8",
            backgroundColor: "#6979F8",
            tension: 0.4
          }
        ]
      });
    } else {
      // Default data when no chart data available
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
  }, [dashboardData.chartData]);

  // Options optimisées pour mobile
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: window.innerWidth < 640 ? 11 : 12
          }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        bodyFont: {
          size: window.innerWidth < 640 ? 11 : 12
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0,
          minRotation: window.innerWidth < 640 ? 45 : 0
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : 12
          }
        },
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        radius: window.innerWidth < 640 ? 3 : 4,
        hoverRadius: window.innerWidth < 640 ? 5 : 6
      },
      line: {
        borderWidth: window.innerWidth < 640 ? 2 : 3
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Performance des campagnes
          </h2>
        </div>
        <div className="h-64 sm:h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Performance des campagnes
        </h2>
        {/* Mobile: Période compacte */}
        <span className="text-xs text-gray-500 sm:text-sm">
          7 derniers jours
        </span>
      </div>

      {/* Container responsive pour le graphique */}
      <div className="relative h-64 sm:h-80 md:h-96">
        <Line
          ref={chartRef}
          data={chartData}
          options={options}
        />
      </div>

      {/* Légende mobile additionnelle si nécessaire */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs sm:hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0ED894' }}></span>
          <span className="text-gray-600">Ouvertures</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6979F8' }}></span>
          <span className="text-gray-600">Clics</span>
        </div>
      </div>
    </div>
  );
};

export default StatsGraph;