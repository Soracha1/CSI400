import React, { useEffect, useState } from "react";
import "./AdminRedeemHistory.css";

const AdminRedeemHistory = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "http://localhost:5000/api/admin/redeem-codes",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setCodes(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  if (loading)
    return (
      <div className="page-content">
        <p className="loading-text">Loading...</p>
      </div>
    );

  return (
    <div className="page-content">
      <h2 className="page-title">ประวัติโค้ด Redeem (Admin)</h2>
      <div className="table-wrapper">
        <table className="redeem-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c._id}>
                <td className="code-cell">{c.code}</td>
                <td>{c.plan}</td>
                <td className={c.used ? "used" : "unused"}>
                  {c.used ? "Used" : "Unused"}
                </td>
                <td>
                  {new Date(c.createdAt).toLocaleDateString()}{" "}
                  {new Date(c.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRedeemHistory;
