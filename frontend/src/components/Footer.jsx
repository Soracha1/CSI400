import React from "react";
import "./Footer.css";
import logo from "../assets/02.png"; // โลโก้
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa"; // ✅ ใช้ react-icons

function Footer() {
  return (
    <footer className="footer">
      <img src={logo} alt="Shark Sound Logo" className="footer-logo-img" />

      <div className="footer-links">
        <a href="/help">Help</a>
        <span>|</span>
        <a href="/qa">Q&A</a>
        <span>|</span>
        <a href="/contact">Contact</a>
      </div>

      <div className="footer-socials">
        <a href="#" target="_blank"><FaFacebook /></a>
        <a href="#" target="_blank"><FaInstagram /></a>
        <a href="#" target="_blank"><FaTiktok /></a>
      </div>
    </footer>
  );
}

export default Footer;
