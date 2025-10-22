import React from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const StatsGraph = () => {
  const data = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      {
        label: "Ouvertures",
        data: [12, 19, 3, 5, 2, 3, 9],
        borderColor: "#0ED894",
        backgroundColor: "#0ED894",
        tension: 0.4
      },
      {
        label: "Clics",
        data: [2, 3, 20, 5, 1, 4, 6],
        borderColor: "#6979F8",
        backgroundColor: "#6979F8",
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      }
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h2 className="chart-title">Performance des campagnes</h2>
      </div>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default StatsGraph;
