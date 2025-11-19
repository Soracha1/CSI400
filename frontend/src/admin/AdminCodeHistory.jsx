import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminCodeHistory() {
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/codes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setCodes(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Code History</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Plan</th>
            <th>Created At</th>
            <th>Used</th>
            <th>Used By</th>
            <th>Expire At</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c._id}>
              <td>{c.code}</td>
              <td>{c.plan}</td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
              <td>{c.used ? "Yes" : "No"}</td>
              <td>
                {c.usedBy ? c.usedBy.username || c.usedBy.email || "-" : "-"}
              </td>
              <td>
                {c.expireAt ? new Date(c.expireAt).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
