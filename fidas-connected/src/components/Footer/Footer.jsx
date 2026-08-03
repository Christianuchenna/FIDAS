import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/FIDAS logo.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand-column">
          <div className="footer-brand">
            <img src={logo} alt="FiDAS Logo" className="footer-logo-img" />
            <span>FiDAS</span>
          </div>
          <p>FUTO Integrity Detection Authentication System</p>
        </div>
        
        <div className="footer-links">
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/register" className="footer-link">Register</Link>
          <Link to="/login" className="footer-link">Login</Link>
        </div>
        
        <div className="footer-divider"></div>
        <p className="footer-copy">© 2026 FiDAS · Federal University of Technology Owerri · All rights reserved.</p>
      </div>
    </footer>
  );
}