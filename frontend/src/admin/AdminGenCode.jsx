import React, { useState } from "react";
import Swal from "sweetalert2";
import "./AdminGenCode.css";

function AdminGenCode() {
  const [plan, setPlan] = useState("SOCOZY");
  const [code, setCode] = useState("");

  const generate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/gencode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await res.json();
      setCode(data.code);

      // แสดงโค้ดและข้อความสำเร็จใน popup พร้อมปุ่ม copy
      Swal.fire({
        title: 'Success!',
        html: `
          <p>Plan "<strong>${plan}</strong>" has been successfully generated!</p>
          <p>Your Code: <strong id="genCode">${data.code}</strong></p>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Copy Code',
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          const codeText = data.code;
          navigator.clipboard.writeText(codeText)
            .then(() => {
              Swal.fire({
                title: 'Copied!',
                text: 'The code has been copied to clipboard.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });
            })
            .catch(() => {
              Swal.fire('Error', 'Failed to copy code', 'error');
            });
        }
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: 'Cannot generate code. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className="gencode-page-wrapper">
      <div className="gencode-page">
        <h1>Generate Premium Code</h1>

        <select onChange={(e) => setPlan(e.target.value)}>
          <option value="SOCOZY">So Cozy</option>
          <option value="SUPERCOZY">Super Cozy</option>
          <option value="COZIEST">Coziest</option>
        </select>

        <button onClick={generate}>Generate</button>

        {code && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <h2>Your Code: {code}</h2>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code)
                  .then(() => alert('Code copied!'))
                  .catch(() => alert('Failed to copy'));
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: '#00c6ff',
                color: '#fff'
              }}
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminGenCode;
