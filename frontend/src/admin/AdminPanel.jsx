import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Adminpanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token"); // สมมติ JWT เก็บใน localStorage

  const API_BASE = "http://localhost:5000"; // ชี้ไป backend

  // ================= Fetch Users =================
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Users fetched:", res.data);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      alert("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= Role Change =================
  const handleRoleChange = async (userId, role) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
      alert("Failed to update role");
    }
  };

  // ================= Reset Quota =================
  const handleResetQuota = async (userId) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/reset-quota`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to reset quota:", err);
      alert("Failed to reset quota");
    }
  };

  // ================= Delete User =================
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user");
    }
  };

  // ================= Filter Users =================
  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Users Management</h2>

      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 rounded w-full max-w-sm"
      />

      <table className="min-w-full border bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Upload/Download</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u._id} className="border-b">
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                {u.role}{" "}
                <button
                  onClick={() =>
                    handleRoleChange(
                      u._id,
                      u.role === "admin" ? "user" : "admin"
                    )
                  }
                  className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                >
                  Make {u.role === "admin" ? "User" : "Admin"}
                </button>
              </td>
              <td className="p-2">
                {u.uploadCount}/{u.maxUpload} / {u.downloadCount}/
                {u.maxDownload}{" "}
                <button
                  onClick={() => handleResetQuota(u._id)}
                  className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                >
                  Reset Quota
                </button>
              </td>
              <td className="p-2">
                <button
                  onClick={() => handleDelete(u._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-4">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
