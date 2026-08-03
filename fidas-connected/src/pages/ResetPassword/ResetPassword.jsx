import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import logo from '../../assets/FIDAS logo.png';
import { authAPI } from '../../api';
import '../Register/Register.css';
import '../Login/Login.css';

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const [form, setForm]           = useState({ password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone]       = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsSplashLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setErrorMsg('Passwords do not match.');
    if (form.password.length < 8) return setErrorMsg('Password must be at least 8 characters.');
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data } = await authAPI.resetPassword(token, {
        password:         form.password,
        confirm_password: form.confirmPassword,
      });
      if (data.success) {
        setIsDone(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrorMsg(data.message || 'Reset failed.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Reset link is invalid or expired.');
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
              {!isDone ? (
                <form className="auth-grid-form single-column-override" onSubmit={handleSubmit}>
                  <h2 style={{ color: '#07111F', marginBottom: '10px' }}>Set New Password</h2>
                  <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Choose a strong password with at least 8 characters.
                  </p>

                  {errorMsg && (
                    <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <div className="auth-field-group">
                    <label className="auth-label">New Password</label>
                    <input
                      type="password" placeholder="••••••••••••"
                      className="fidas-input input-override input-blue-tint"
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>

                  <div className="auth-field-group">
                    <label className="auth-label">Confirm New Password</label>
                    <input
                      type="password" placeholder="••••••••"
                      className="fidas-input input-override"
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                  </div>

                  <div className="auth-submission-block" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                      {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '3rem', color: '#00E5A0', marginBottom: '10px' }}>✓</div>
                  <h3>Password Updated!</h3>
                  <p style={{ color: '#718096', margin: '15px 0' }}>
                    Your password has been changed. Redirecting you to login...
                  </p>
                  <Link to="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '12px', textAlign: 'center' }}>
                    GO TO LOGIN
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
