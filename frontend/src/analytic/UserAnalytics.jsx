import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

function UserAnalytics() {
  const token = localStorage.getItem("token");
  const [limits, setLimits] = useState({
    uploadCount: 0,
    downloadCount: 0,
    maxUpload: 0,
    maxDownload: 0,
  });
  const [topSongs, setTopSongs] = useState([]);
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28AFF"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ข้อมูลการอัปโหลด / ดาวน์โหลด ของตัวเอง
        const userRes = await axios.get("http://localhost:5000/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = userRes.data;
        setLimits(user);

        // เพลงที่ดาวน์โหลด / ถูกใจมากที่สุด
        const songsRes = await axios.get(
          "http://localhost:5000/api/songs/top-downloads",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTopSongs(songsRes.data);
      } catch (err) {
        console.error(err);
        alert("❌ โหลดข้อมูล Dashboard ไม่สำเร็จ");
      }
    };

    fetchData();
  }, [token]);

  // เตรียมข้อมูล Bar Chart ของตัวเอง
  const barData = [
    { type: "Uploads", count: limits.uploadCount },
    { type: "Downloads", count: limits.downloadCount },
  ];

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>📊 Your Dashboard</h2>

      {/* Upload / Download ของตัวเอง */}
      <section style={{ marginBottom: "3rem" }}>
        <h3>Your Uploads / Downloads</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
        <p>
          Upload limit: {limits.uploadCount} / {limits.maxUpload} | Download
          limit: {limits.downloadCount} / {limits.maxDownload}
        </p>
      </section>

      {/* Top Songs */}
      <section style={{ marginBottom: "3rem" }}>
        <h3>Top Songs in Platform</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={topSongs}
              dataKey="downloads"
              nameKey="title"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {topSongs.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} downloads`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

export default UserAnalytics;
