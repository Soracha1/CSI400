import React, { useState } from "react";

function AdminGenCode() {
  const [plan, setPlan] = useState("SOCOZY");
  const [code, setCode] = useState("");

  const generate = async () => {
    const res = await fetch("http://localhost:5000/api/admin/gencode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setCode(data.code);
  };

  return (
    <div className="gencode-page">
      <h1>Generate Premium Code</h1>

      <select onChange={(e) => setPlan(e.target.value)}>
        <option value="SOCOZY">So Cozy</option>
        <option value="SUPERCOZY">Super Cozy</option>
        <option value="COZIEST">Coziest</option>
      </select>

      <button onClick={generate}>Generate</button>

      {code && <h2>Your Code: {code}</h2>}
    </div>
  );
}

export default AdminGenCode;
