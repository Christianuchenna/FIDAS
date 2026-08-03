import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Home.css';
import { contactAPI } from '../../api';

export default function Home() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setContactError('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setSending(true);
    setContactError('');
    try {
      const { data } = await contactAPI.send(form);
      if (data.success) {
        setSent(true);
      } else {
        setContactError(data.message || 'Failed to send message.');
      }
    } catch (err) {
      setContactError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="home-layout">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-grid">
          
          {/* Left Side: Text and Buttons */}
          <div className="hero-content">
            <div className="hero-live-pill">
              <span className="live-dot"></span> FUTO Clearance Portal — Live
            </div>
            <h1 className="hero-title">
              Smart Clearance.<br />
              <span className="text-accent">Verified Integrity.</span>
            </h1>
            <p className="hero-description">
              Bridging the verification gap with Human-Centered AI forensics. 
              Fast, transparent, and built for the FUTO graduate.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('/register')}>CREATE ACCOUNT →</button>
              <button className="btn-ghost" onClick={() => navigate('/login')}>LOGIN</button>
            </div>
            
          </div>
          
          {/* Right Side: The Animations */}
          <div className="hero-right">
            {/* Floating status cards */}
            <div className="float-card float-card--top">
              <div className="float-card-icon">🛡️</div>
              <div className="float-card-body">
                <div className="float-card-title">AI Verification</div>
                <div className="float-card-sub">Document authenticated</div>
              </div>
              <div className="float-card-badge float-card-badge--green">✓</div>
            </div>

            {/* Central avatar ring */}
            <div className="avatar-scene">
              <div className="avatar-ring avatar-ring--outer" />
              <div className="avatar-ring avatar-ring--inner" />
              <div className="avatar-core">
                <svg viewBox="0 0 100 120" fill="none" width="140">
                  <circle cx="50" cy="38" r="22" fill="#1b3f52"/>
                  <circle cx="50" cy="36" r="13" fill="#0d2535"/>
                  <ellipse cx="50" cy="90" rx="28" ry="24" fill="#1b3f52"/>
                  <circle cx="43" cy="35" r="2.5" fill="#00e5a0" opacity="0.9"/>
                  <circle cx="57" cy="35" r="2.5" fill="#00e5a0" opacity="0.9"/>
                  <path d="M44 43 Q50 48 56 43" stroke="#00e5a0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <path d="M37 30 Q50 22 63 30" stroke="#00e5a0" strokeWidth="1.2" fill="none"/>
                  <rect x="22" y="75" width="56" height="28" rx="5" fill="#0d2535"/>
                  <text x="50" y="93" textAnchor="middle" fill="#00e5a0" fontSize="8" fontWeight="bold">FUTO</text>
                </svg>
                <div className="avatar-badge">
                  <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
                    <path d="M18 3L4 10v8c0 7.35 5.95 14.21 14 15.89C26.05 32.21 32 25.35 32 18v-8L18 3z" fill="#071e2b"/>
                    <path d="M12 18l4 4 8-8" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="float-card float-card--bottom">
              <div className="float-card-icon">📋</div>
              <div className="float-card-body">
                <div className="float-card-title">Clearance Progress</div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: "60%" }} />
                  </div>
                  <span className="progress-label">3 / 5 departments</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-tag">About Us</div>
        <div className="about-split">
          <div className="about-text-content">
            <h2>The Verification<br />Gap, Solved.</h2>
            <p className="lead"><strong>FiDAS</strong> is replacing administrative friction with Algorithmic Truth.</p>
            <p>University clearance has historically been built on manual configurations. In an era of easily manipulated digital assets, secure algorithmic verification protects degree value and eliminates student wait anxiety.</p>
          </div>
          <div className="about-cards-stack">
            <div className="pillar-card">⚡ <h4>Forensic Integrity</h4><p>Deep document checking analysis.</p></div>
            <div className="pillar-card">🤖 <h4>Human-Centered AI</h4><p>Intuitive user automation paths.</p></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-section">
        <div className="section-tag">Process</div>
        <h2 className="center-headline">How It Works</h2>
        <div className="process-grid">
          {[
            { step: "01", title: "Register", text: "Create your student account with FUTO metrics." },
            { step: "02", title: "Upload Docs", text: "Submit your clearance documents through the portal." },
            { step: "03", title: "AI Verifies", text: "Our systems run architectural forensic checks." },
            { step: "04", title: "Get Cleared", text: "Download your instantaneous authentic token." }
          ].map((item, idx) => (
            <div key={idx} className="process-card">
              <span className="process-step-num">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-card-wrapper">
          <div className="section-tag">Get In Touch</div>
          <h2>Contact Us</h2>
          {sent ? (
            <div className="form-success-state">✓ Message Sent Successfully!</div>
          ) : (
            <form onSubmit={handleSendMessage} className="contact-form-layout">
              <div className="input-row-grid">
                <input type="text" name="name" placeholder="Your Name" className="fidas-input" onChange={handleInputChange} required />
                <input type="email" name="email" placeholder="Email Address" className="fidas-input" onChange={handleInputChange} required />
              </div>
              <textarea name="message" placeholder="How can we help you?" rows="5" className="fidas-input" onChange={handleInputChange} required></textarea>
              {contactError && (
                <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                  ⚠ {contactError}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}