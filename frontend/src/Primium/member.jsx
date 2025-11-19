import React, { useState, useEffect } from "react";
import "./member.css";
import { FaCompactDisc, FaMicrophoneAlt, FaSpeakerDeck } from "react-icons/fa";

function Member() {
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [code, setCode] = useState("");
  const [user, setUser] = useState(null);
  const [limits, setLimits] = useState(null);

  // ดึงข้อมูล user และ limits
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);

          // ดึง limits จาก API
          const res = await fetch(`http://localhost:5000/api/user/${userData._id}/limits`);
          const limitsData = await res.json();
          setLimits(limitsData);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();

    // รับฟังการอัปเดตโปรไฟล์
    const handleProfileUpdated = (event) => {
      const updatedUser = event.detail;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    window.addEventListener("profileUpdated", handleProfileUpdated);
    
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };
  }, []);

  const plans = [
    {
      name: "Newbie",
      credits: "5 Download Credits per Week",
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
      if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

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
      
      // อัปเดตข้อมูล user ใหม่
      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: updatedUser }));
      
      setShowCodeBox(false);
      setCode("");
      
      // รีโหลด limits
      const limitsRes = await fetch(`http://localhost:5000/api/user/${user._id}/limits`);
      const limitsData = await limitsRes.json();
      setLimits(limitsData);
      
    } catch (err) {
      console.error("Redeem error:", err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  // ใช้ avatar เดียวกับ Profile
  const avatarUrl = user?.avatar || user?.picture || "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  
  // คำนวณวันหมดอายุ
  const getExpiryText = () => {
    if (!user?.planExpire) return null;
    const expireDate = new Date(user.planExpire);
    const today = new Date();
    const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return "หมดอายุแล้ว";
    if (daysLeft === 0) return "หมดอายุวันนี้";
    return `เหลืออีก ${daysLeft} วัน`;
  };

  // แสดงชื่อ plan ปัจจุบัน
  const getCurrentPlanName = () => {
    const planName = user?.plan || "Free";
    return planName === "Free" ? "Newbie" : planName;
  };

  return (
    <div className="member-page">
      {/* Header Profile - ใช้ข้อมูลจาก user state */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="member-profile">
            <div className="profile-avatar">
              <img src={avatarUrl} alt="Profile" />
            </div>
            <h2 className="profile-name">{user?.username || "Name"}</h2>
            <p className="profile-username">
              {limits ? `${limits.downloadCount}/${limits.maxDownload}` : "0"} download credits
            </p>
            {user?.email && (
              <p className="profile-email" style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Member Status */}
      <div className="status-section">
        <div className="status-text">
          <h1>Member status: {getCurrentPlanName()}</h1>
          <p>
            {user?.plan === "Free" || !user?.plan ? (
              <>
                You are currently on our free plan.
                <br />
                Your account will be topped up to 5 download credits every Sunday.
              </>
            ) : (
              <>
                You are on <strong>{user.plan}</strong> plan.
                <br />
                {getExpiryText() && (
                  <>Plan expires: {new Date(user.planExpire).toLocaleDateString()} ({getExpiryText()})</>
                )}
              </>
            )}
          </p>
        </div>

        <div className="divider"></div>

        {/* Plans */}
        <div className="plan-list">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`plan-card ${getCurrentPlanName() === plan.name ? 'current-plan' : ''}`}
            >
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
                  disabled={getCurrentPlanName() === plan.name}
                >
                  {getCurrentPlanName() === plan.name ? "CURRENT PLAN" : "SUBSCRIBE"}
                </button>
              )}
              
              {plan.name === "Newbie" && getCurrentPlanName() === "Newbie" && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '4px',
                  color: '#2e7d32',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  CURRENT PLAN
                </div>
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