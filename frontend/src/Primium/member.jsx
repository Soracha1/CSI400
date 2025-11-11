import React from "react";
import "./member.css";
import { FaCompactDisc, FaMicrophoneAlt, FaSpeakerDeck } from "react-icons/fa";

function member() {
  const plans = [
    {
      name: "Newbie",
      credits: "30 Monthly Sample Credits",
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
      name: "Coziest!",
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

  return (
    <div className="member-page">
      {/* ส่วนหัวโปรไฟล์ */}
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

      {/* Member status */}
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

              {/* ✅ ซ่อนปุ่ม SUBSCRIBE สำหรับ Newbie */}
              {plan.name !== "Newbie" && (
                <button className="subscribe-btn">SUBSCRIBE</button>
              )} 
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default member;
