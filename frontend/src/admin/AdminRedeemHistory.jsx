import React, { useEffect, useState } from "react";

const AdminRedeemHistory = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const token = localStorage.getItem("token"); // assume JWT stored
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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">ประวัติโค้ด Redeem (Admin)</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Code</th>
            <th className="border px-4 py-2">Plan</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c._id}>
              <td className="border px-4 py-2 font-mono">{c.code}</td>
              <td className="border px-4 py-2">{c.plan}</td>
              <td className="border px-4 py-2">
                {c.used ? (
                  <span className="text-red-600 font-semibold">Used</span>
                ) : (
                  <span className="text-green-600 font-semibold">Unused</span>
                )}
              </td>
              <td className="border px-4 py-2">
                {new Date(c.createdAt).toLocaleDateString()}{" "}
                {new Date(c.createdAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRedeemHistory;
