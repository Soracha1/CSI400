import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

import './AdminAnalytics.css';

function AdminAnalytics() {
  const token = localStorage.getItem("token");
  const [usersGrowth, setUsersGrowth] = useState([]);
  const [uploadsDownloads, setUploadsDownloads] = useState([]);
  const [topSongs, setTopSongs] = useState([]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28AFF"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get(
          "http://localhost:5000/api/admin/analytics/users-growth",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsersGrowth(usersRes.data);

        const udRes = await axios.get(
          "http://localhost:5000/api/admin/analytics/uploads-downloads",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUploadsDownloads(udRes.data);

        const topSongsRes = await axios.get(
          "http://localhost:5000/api/admin/analytics/top-songs",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTopSongs(topSongsRes.data);
      } catch (err) {
        console.error(err);
        alert("โหลดข้อมูล Analytics ไม่สำเร็จ");
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="admin-analytics-container">
      
      

      {/* ================= Main Title ================= */}
      <h2 className="admin-analytics-main-title">📊 Admin Analytics Dashboard</h2>

      {/* ================= Users Growth ================= */}
      <section className="admin-analytics-section">
        <h3>Users Growth</h3>
        <LineChart width={700} height={300} data={usersGrowth}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="totalUsers" stroke="#8884d8" />
        </LineChart>
      </section>

      {/* ================= Uploads / Downloads ================= */}
      <section className="admin-analytics-section">
        <h3>Uploads / Downloads</h3>
        <BarChart width={700} height={300} data={uploadsDownloads}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="username" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="uploads" fill="#82ca9d" />
          <Bar dataKey="downloads" fill="#8884d8" />
        </BarChart>
      </section>

      {/* ================= Top Songs ================= */}
      <section className="admin-analytics-section">
        <h3>Top Songs</h3>
        <PieChart width={400} height={400}>
          <Pie
            data={topSongs}
            dataKey="downloads"
            nameKey="title"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label
          >
            {topSongs.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </section>
    </div>
  );
}

export default AdminAnalytics;
