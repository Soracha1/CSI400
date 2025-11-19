import React, { useState } from "react";
import "./member.css";
import { FaCompactDisc, FaMicrophoneAlt, FaSpeakerDeck } from "react-icons/fa";

function Member() {
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [code, setCode] = useState("");

  const plans = [
    {
      name: "Newbie",
      credits: "",
      price: "Free",
      per: "",
      icon: <FaCompactDisc className="icon cyan" />,
    },
    {
      name: "So Cozy",
      credits: "300 Monthly Sample Credits",
      price: "150 THB",
      per: "per month",
      icon: <FaMicrophoneAlt className="icon pink" />,
    },
    {
      name: "Super Cozy",
      credits: "600 Monthly Sample Credits",
      price: "300 THB",
      per: "per month",
      icon: <FaSpeakerDeck className="icon pink" />,
    },
    {
      name: "Coziest!",
      credits: "Unlimited Sample Credits",
      price: "1000 THB",
      per: "per month",
      icon: <FaSpeakerDeck className="icon pink" />,
    },
  ];

  // เปิด popup
  const handleSubscribe = (planName) => {
    setSelectedPlan(planName);
    setShowCodeBox(true);
  };

  // ส่งโค้ดไป backend
  const submitCode = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const res = await fetch("http://localhost:5000/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId: user._id }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Redeem สำเร็จ 🎉 สิทธิ์ถูกอัปเดตแล้ว");
      setShowCodeBox(false);
      setCode("");
    } catch (err) {
      console.error("Redeem error:", err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  return (
    <div className="member-page">
      {/* Header Profile */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="member-profile">
            <div className="profile-avatar">
              <img src="/src/assets/logo.png" alt="Profile" />
            </div>
            <h2 className="profile-name">Name</h2>
            <p className="profile-username">10 download credits</p>
          </div>
        </div>
      </div>

      {/* Member Status */}
      <div className="status-section">
        <div className="status-text">
          <h1>Member status</h1>
          <p>
            You are currently on our free plan.
            <br />
            Your account will be topped up to 5 download credits every Sunday.
          </p>
        </div>

        <div className="divider"></div>

        {/* Plans */}
        <div className="plan-list">
          {plans.map((plan, index) => (
            <div key={index} className="plan-card">
              {plan.icon}
              <h2>{plan.name}</h2>
              <p className="credit-text">{plan.credits}</p>
              <p className="price">
                {plan.price}{" "}
                <span className="per">{plan.per ? plan.per : ""}</span>
              </p>

              {plan.name !== "Newbie" && (
                <button
                  className="subscribe-btn"
                  onClick={() => handleSubscribe(plan.name)}
                >
                  SUBSCRIBE
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Popup กรอกโค้ด */}
      {showCodeBox && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Enter Code for {selectedPlan}</h2>

            <input
              type="text"
              className="code-input"
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <button onClick={submitCode} className="redeem-btn">
              Redeem
            </button>

            <button className="close-btn" onClick={() => setShowCodeBox(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Member;
