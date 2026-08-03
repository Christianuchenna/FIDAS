import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import logo from '../../assets/FIDAS logo.png';
import { authAPI } from '../../api';
import '../Register/Register.css';
import '../Login/Login.css';

export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsSplashLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setErrorMsg('Please enter your email address.');
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authAPI.forgotPassword(email);
      // Always show success (server hides whether email exists for security)
      setIsSubmitted(true);
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {(isSplashLoading || isLoading) && (
        <div className="splash-overlay">
          <div className="splash-logo-container">
            <img src={logo} alt="Loading..." className="splash-logo" />
          </div>
        </div>
      )}

      <div className={`page-content ${isSplashLoading ? 'hidden' : 'fade-in'}`}>
        <div className="auth-page-root">
          <Navbar />
          <div className="auth-container">
            <div className="auth-white-card login-card-modifier">
              {!isSubmitted ? (
                <form className="auth-grid-form single-column-override" onSubmit={handleResetSubmit}>
                  <h2 style={{ color: '#07111F', marginBottom: '10px' }}>Reset Password</h2>
                  <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Enter your registered email address and we'll send you a recovery link.
                  </p>

                  {errorMsg && (
                    <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <div className="auth-field-group">
                    <label className="auth-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      className="fidas-input input-override input-blue-tint"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                      required
                    />
                  </div>

                  <div className="auth-submission-block" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                      {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                    </button>
                    <p className="auth-switch-link">
                      Remembered your password? <Link to="/login">Log In</Link>
                    </p>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '3rem', color: '#00E5A0', marginBottom: '10px' }}>✓</div>
                  <h3>Check your email</h3>
                  <p style={{ color: '#718096', margin: '15px 0' }}>
                    If an account with that email exists, a secure reset link has been sent.
                    The link expires in 15 minutes.
                  </p>
                  <Link to="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '12px', textAlign: 'center' }}>
                    BACK TO LOGIN
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
