import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import "./dashboard.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

function Dashboard() {
  const [filter, setFilter] = useState("all");

  // ข้อมูลจำลอง (สามารถเชื่อมต่อ API จริงได้)
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Download",
        data: [12, 19, 10, 25, 20, 30, 15],
        borderColor: "#A56EFF", // ม่วง
        backgroundColor: "#A56EFF33",
        tension: 0.3,
        hidden: filter !== "all" && filter !== "download",
      },
      {
        label: "Play",
        data: [8, 14, 20, 18, 25, 35, 30],
        borderColor: "#00C6FF", // ฟ้า
        backgroundColor: "#00C6FF33",
        tension: 0.3,
        hidden: filter !== "all" && filter !== "play",
      },
      {
        label: "Favorite",
        data: [5, 8, 12, 15, 10, 20, 18],
        borderColor: "#FF7AB8", // ชมพู
        backgroundColor: "#FF7AB833",
        tension: 0.3,
        hidden: filter !== "all" && filter !== "favorite",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">overrall performance</h1>
      <p>Hey Kira Your samples have had 0 downloads in the last all time
</p>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-btn purple ${filter === "download" ? "active" : ""}`}
          onClick={() => setFilter("download")}
        >
          Download
        </button>
        <button
          className={`filter-btn blue ${filter === "play" ? "active" : ""}`}
          onClick={() => setFilter("play")}
        >
          Play
        </button>
        <button
          className={`filter-btn pink ${filter === "favorite" ? "active" : ""}`}
          onClick={() => setFilter("favorite")}
        >
          Favorite
        </button>
      </div>

      <div className="chart-box">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default Dashboard;
