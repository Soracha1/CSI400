import React from "react";
import "./Footer.css";
import logo from "../assets/02.png"; // โลโก้
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa"; // ใช้ react-icons
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <img src={logo} alt="Shark Sound Logo" className="footer-logo-img" />

      <div className="footer-links">
        <Link to="/help">Help</Link>
        <span>|</span>
        <Link to="/qa">Q&A</Link>
        <span>|</span>
        <Link to="/about">About</Link>
        <span>|</span>
        <Link to="/contact">Contact</Link>
      </div>

      <div className="footer-socials">
        <a
          href="https://www.facebook.com/sound.share.2025"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFacebook />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <FaTiktok />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
