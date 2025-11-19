import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminPanel.css"; // ✅ ใช้ CSS ปกติ

export default function Adminpanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  const API_BASE = "http://localhost:5000";

  // ================= Fetch Users =================
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch users", "error");
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

      Swal.fire({
        icon: "success",
        title: "Role Updated",
        text: `User role changed to ${role}`,
        timer: 1500,
        showConfirmButton: false,
      });

      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to update role", "error");
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

      Swal.fire({
        icon: "success",
        title: "Quota Reset",
        text: "User quota has been reset",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to reset quota", "error");
    }
  };

  // ================= Delete User =================
  const handleDelete = async (userId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3342f",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "User has been deleted",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Failed to delete user", "error");
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
    <div className="adminpanel-container">
      <h2 className="adminpanel-title">Users Management</h2>

      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="adminpanel-search-box"
      />

      <table className="adminpanel-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Upload / Download</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                {u.role}{" "}
                <button
                  onClick={() =>
                    handleRoleChange(
                      u._id,
                      u.role === "admin" ? "user" : "admin"
                    )
                  }
                  className="adminpanel-btn adminpanel-btn-role"
                >
                  Make {u.role === "admin" ? "User" : "Admin"}
                </button>
              </td>

              <td>
                {u.uploadCount}/{u.maxUpload} — {u.downloadCount}/{u.maxDownload}{" "}
                <button
                  onClick={() => handleResetQuota(u._id)}
                  className="adminpanel-btn adminpanel-btn-reset"
                >
                  Reset Quota
                </button>
              </td>

              <td>
                <button
                  onClick={() => handleDelete(u._id)}
                  className="adminpanel-btn adminpanel-btn-delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="5" className="adminpanel-no-user">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
