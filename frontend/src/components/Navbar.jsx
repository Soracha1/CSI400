import React from "react";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">SHARK SOUND</div>
      <ul className="menu">
        <li>Premium</li>
        <li>About</li>
        <li>Policy</li>
        <li>Sign in</li>
      </ul>
      <button className="signup-btn">Sign Up</button>
    </nav>
  );
}
export default Navbar;
