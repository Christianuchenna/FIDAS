import React, { useState, useRef, useEffect } from "react";
import logo from "../../assets/FIDAS logo.png";
import "./DashboardNavbar.css";

export default function DashboardNavbar({ navigate, student, setActiveTab, onLogout }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropOpen(false);
    if (onLogout) onLogout();
    else navigate("/login");
  };

  return (
    <nav className="dashboard-nav">
      <div className="nav-brand" onClick={() => setActiveTab("upload")}>
        <img src={logo} alt="FiDAS Logo" className="brand-logo-img" style={{ width: '28px', height: '28px' }} />
        <span className="logo-text">FiDAS</span>
      </div>

      <div className="nav-center">
        <span className="portal-title">STUDENT PORTAL</span>
      </div>

      <div className="nav-actions">
        <button className="icon-btn" title="Notifications">
          🔔<span className="notification-dot" />
        </button>
        <div className="avatar-wrapper" ref={dropdownRef} onClick={() => setDropOpen(!dropOpen)}>
          <div className="avatar-circle">{student.avatar}</div>

        {dropOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <strong>{student.name}</strong>
              <span>{student.regNumber}</span>
            </div>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => { setActiveTab("profile"); setDropOpen(false); }}>👤 My Profile</button>
            <button className="dropdown-item" onClick={() => { setActiveTab("settings"); setDropOpen(false); }}>⚙️ Settings</button>
            <div className="dropdown-divider" />
            <button className="dropdown-item danger" onClick={handleLogout}>🚪 Log Out</button>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
}
