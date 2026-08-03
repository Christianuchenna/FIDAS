import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import logo from '../../assets/FIDAS logo.png';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullName: '', regNumber: '', email: '', department: '', password: '', confirmPassword: ''
  });
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [isSplashLoading, setIsSplashLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsSplashLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // ── Client-side validation ────────────────────────────────────────────────
    const nameRegex    = /^[A-Za-z\s\W]+$/;
    const regNumRegex  = /^(\d{11}|\d{4}\/\d{6})$/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/;

    if (!form.fullName || !form.regNumber || !form.email || !form.department || !form.password || !form.confirmPassword) {
      return setErrorMsg('All fields are required.');
    }
    if (!nameRegex.test(form.fullName)) {
      return setErrorMsg('Full Name can only contain letters, spaces, and special characters.');
    }
    if (!regNumRegex.test(form.regNumber)) {
      return setErrorMsg('Registration Number must be 11 digits or FUTO format (e.g. 2021/269405).');
    }
    if (!passwordRegex.test(form.password)) {
      return setErrorMsg('Password must contain at least one letter, one number, and one special character.');
    }
    if (form.password !== form.confirmPassword) {
      return setErrorMsg('Passwords do not match.');
    }

    // ── Year check (also enforced on server) ──────────────────────────────────
    const digits = form.regNumber.replace(/\D/g, '');
    const year   = parseInt(digits.substring(0, 4), 10);
    if (year > 2021) {
      return setErrorMsg(`Only final-year students (2021 or earlier) can register. Your year appears to be ${year}.`);
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data } = await authAPI.register({
        full_name:        form.fullName,
        matric_no:        form.regNumber,
        department:       form.department,
        email:            form.email,
        password:         form.password,
        confirm_password: form.confirmPassword,
      });

      if (data.success) {
        login(data);           // store token + student in context
        navigate('/dashboard');
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Server error. Please try again.');
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
            <div className="auth-white-card">
              <form className="auth-grid-form" onSubmit={handleRegisterSubmit}>

                {errorMsg && (
                  <div style={{ gridColumn: 'span 2', color: '#ff6b6b', background: '#ffebeb', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                    ⚠ {errorMsg}
                  </div>
                )}

                <div className="auth-field-group">
                  <label className="auth-label">Full Name</label>
                  <input type="text" name="fullName" placeholder="Chukwu Precious" className="fidas-input input-override" onChange={handleInputChange} />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Registration Number</label>
                  <input type="text" name="regNumber" placeholder="2021/269405" className="fidas-input input-override" onChange={handleInputChange} />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Email Address</label>
                  <input type="email" name="email" placeholder="you@gmail.com" className="fidas-input input-override input-blue-tint" onChange={handleInputChange} />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Department</label>
                  <select name="department" className="fidas-input input-override" defaultValue="" onChange={handleInputChange}>
                    <option value="" disabled>Select Department</option>
                    <option>Computer Science</option>
                    <option>Computer Engineering</option>
                    <option>Mechanical Engineering</option>
                    <option>Electrical Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Chemical Engineering</option>
                    <option>Agricultural Engineering</option>
                    <option>Architecture</option>
                    <option>Biochemistry</option>
                    <option>Biology</option>
                    <option>Chemistry</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Statistics</option>
                  </select>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Password</label>
                  <input type="password" name="password" placeholder="••••••••••••" className="fidas-input input-override input-blue-tint" onChange={handleInputChange} />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Confirm Password</label>
                  <input type="password" name="confirmPassword" placeholder="••••••••" className="fidas-input input-override" onChange={handleInputChange} />
                </div>

                <div className="auth-submission-block">
                  <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                    {isLoading ? 'REGISTERING...' : 'REGISTER'}
                  </button>
                  <p className="auth-switch-link">
                    Already have an account? <Link to="/login">Log In</Link>
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
