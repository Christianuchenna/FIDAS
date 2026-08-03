import React, { useState, useRef, useEffect } from "react";
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
        <div className="logo-icon-box">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 1L3 5V11C3 15.97 6.58 20.56 11 22C15.42 20.56 19 15.97 19 11V5L11 1Z" fill="#00E5A0"/>
            <path d="M7 11L9.5 13.5L15 8" stroke="#07111F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
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
