import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import logo from '../../assets/FIDAS logo.png';
import '../../pages/Register/Register.css';
import './Admin.css';

const ADMIN_TOKEN_KEY = 'fidas_admin_token';

export default function Admin() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [form, setForm]             = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg]     = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const [students, setStudents]     = useState([]);
  const [fetching, setFetching]     = useState(false);
  const [fetchErr, setFetchErr]     = useState('');
  const [search, setSearch]         = useState('');

  // Load cleared students when logged in
  useEffect(() => {
    if (!adminToken) return;
    const load = async () => {
      setFetching(true);
      try {
        // Inject admin token manually for this call
        const { data } = await adminAPI.getClearedStudents();
        if (data.success) setStudents(data.students);
      } catch {
        setFetchErr('Failed to load cleared students. Try refreshing.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [adminToken]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.email || !form.password) return setErrorMsg('All fields are required.');
    setIsLoading(true);
    try {
      const { data } = await adminAPI.login(form);
      if (data.success) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setAdminToken(data.token);
      } else {
        setErrorMsg(data.message || 'Login failed.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('fidas_token');
    setAdminToken(null);
    setStudents([]);
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.matric_no?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Admin Login Screen ────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <div style={{ minHeight: '100vh', background: '#07111F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img src={logo} alt="FiDAS Logo" style={{ width: '56px', height: '56px', marginBottom: '8px' }} />
            <h2 style={{ color: '#07111F', margin: 0 }}>FiDAS Admin</h2>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '6px' }}>Restricted access — authorised personnel only</p>
          </div>

          {errorMsg && (
            <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', marginBottom: '16px' }}>
              ⚠ {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Email</label>
              <input
                type="email" placeholder="admin@futo.edu.ng"
                className="fidas-input input-override"
                style={{ width: '100%', boxSizing: 'border-box' }}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>Password</label>
              <input
                type="password" placeholder="••••••••"
                className="fidas-input input-override"
                style={{ width: '100%', boxSizing: 'border-box' }}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={isLoading}>
              {isLoading ? 'LOGGING IN...' : 'ADMIN LOGIN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#07111F', fontFamily: 'sans-serif' }}>
      {/* Admin Navbar */}
      <nav style={{ background: '#0d1b2a', borderBottom: '1px solid #1a2e40', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="FiDAS Logo" style={{ width: '24px', height: '24px' }} />
            <span style={{ color: '#00E5A0', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>FiDAS ADMIN</span>
          </div>
        <button
          onClick={handleLogout}
          style={{ background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          🚪 Log Out
        </button>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Summary card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#0d1b2a', border: '1px solid #1a2e40', borderRadius: '10px', padding: '24px' }}>
            <p style={{ color: '#718096', margin: '0 0 8px', fontSize: '0.85rem' }}>TOTAL CLEARED</p>
            <p style={{ color: '#00E5A0', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{students.length}</p>
          </div>
          <div style={{ background: '#0d1b2a', border: '1px solid #1a2e40', borderRadius: '10px', padding: '24px' }}>
            <p style={{ color: '#718096', margin: '0 0 8px', fontSize: '0.85rem' }}>EMAILS SENT</p>
            <p style={{ color: '#00E5A0', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
              {students.filter(s => s.email_sent).length}
            </p>
          </div>
          <div style={{ background: '#0d1b2a', border: '1px solid #1a2e40', borderRadius: '10px', padding: '24px' }}>
            <p style={{ color: '#718096', margin: '0 0 8px', fontSize: '0.85rem' }}>SHOWING</p>
            <p style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{filtered.length}</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text" placeholder="🔍 Search by name, reg. number or department..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 16px',
            background: '#0d1b2a', border: '1px solid #1a2e40', borderRadius: '8px',
            color: '#fff', fontSize: '0.95rem', marginBottom: '20px', outline: 'none',
          }}
        />

        {/* Table */}
        {fetching ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>Loading cleared students...</p>
        ) : fetchErr ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '40px' }}>{fetchErr}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
            {search ? 'No students match your search.' : 'No students have been cleared yet.'}
          </p>
        ) : (
          <div className="admin-table-wrapper">
            <div className="admin-table-header">
              {['S/N', 'Full Name', 'Reg. Number', 'Department', 'Cleared On', 'Email'].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {filtered.map((s, i) => (
              <div key={s.clearance_id} className={`admin-table-row ${i % 2 === 0 ? 'row-even' : 'row-odd'}`}>
                <span className="col-sn" data-label="S/N">{i + 1}</span>
                <span className="col-name" data-label="Full Name">{s.full_name}</span>
                <span className="col-reg" data-label="Reg. Number">{s.matric_no}</span>
                <span className="col-dept" data-label="Department">{s.department}</span>
                <span className="col-cleared" data-label="Cleared On">
                  {s.cleared_at
                    ? new Date(s.cleared_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
                <span data-label="Email">
                  <span className={`col-email-badge ${s.email_sent ? 'sent' : 'pending'}`}>
                    {s.email_sent ? 'Sent ✓' : 'Pending'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
