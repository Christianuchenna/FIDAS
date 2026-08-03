import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import logo from '../../assets/FIDAS logo.png';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import '../Register/Register.css';
import './Login.css';

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsSplashLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.email || !form.password) {
      return setErrorMsg('Please fill in all fields.');
    }

    setIsLoading(true);

    try {
      const { data } = await authAPI.login({
        email:    form.email,
        password: form.password,
      });

      if (data.success) {
        login(data);           // store token + student in context
        navigate('/dashboard');
      } else {
        setErrorMsg(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
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
              <form className="auth-grid-form single-column-override" onSubmit={handleLoginSubmit}>

                {errorMsg && (
                  <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                    ⚠ {errorMsg}
                  </div>
                )}

                <div className="auth-field-group">
                  <label className="auth-label">Email Address</label>
                  <input type="email" name="email" placeholder="you@gmail.com" className="fidas-input input-override input-blue-tint" onChange={handleInputChange} />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Password</label>
                  <input type="password" name="password" placeholder="••••••••••••" className="fidas-input input-override" onChange={handleInputChange} />
                  <div style={{ textAlign: 'right', marginTop: '8px' }}>
                    <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#00E5A0', textDecoration: 'none', fontWeight: '600' }}>
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <div className="auth-submission-block" style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                    {isLoading ? 'LOGGING IN...' : 'LOG IN'}
                  </button>
                  <p className="auth-switch-link">
                    Don't have an account yet? <Link to="/register">Register</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
