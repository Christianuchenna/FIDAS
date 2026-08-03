import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/FIDAS logo.png';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToSection = (id) => {
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      {/* Dark overlay backdrop for mobile menu */}
      <div 
        className={`nav-backdrop ${mobileOpen ? 'open' : ''}`} 
        onClick={() => setMobileOpen(false)}
      ></div>

      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Left Side: Logo */}
          <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
            <img src={logo} alt="FiDAS Logo" className="brand-logo-img" />
            <span>FiDAS</span>
          </Link>

          {/* Right Side: Desktop Menu */}
          <div className={`nav-menu ${mobileOpen ? 'nav-menu--open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/register" className="nav-link" onClick={() => setMobileOpen(false)}>Register</Link>
            <Link to="/login" className="nav-link" onClick={() => setMobileOpen(false)}>Login</Link>
            <button onClick={() => handleScrollToSection('about')} className="nav-link-btn">About us</button>
            <button onClick={() => handleScrollToSection('contact')} className="nav-link-btn">Contact</button>
          </div>

          {/* Right Side: Mobile Hamburger Button */}
          <button className="nav-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle Menu">
            {mobileOpen ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}