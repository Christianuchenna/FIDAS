import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../../components/DashboardNavbar/DashboardNavbar';
import { useAuth } from '../../context/AuthContext';
import { documentAPI, authAPI } from '../../api';
import "./Dashboard.css";

/* ── Doc definitions — IDs match backend exactly ────────── */
const DOCS = [
  { id: "school_fees",  label: "School Fees",        desc: "Upload your current session school fees receipt",         icon: "🏫" },
  { id: "departmental", label: "Departmental Dues",   desc: "Upload your departmental association dues receipt",       icon: "🏛️" },
  { id: "sug",          label: "SUG Receipt",         desc: "Upload your Student Union Government dues receipt",       icon: "🎓" },
  { id: "medical",      label: "Medical Receipt",     desc: "Upload your medical/health center clearance receipt",     icon: "🏥" },
  { id: "library",      label: "Library Receipt",     desc: "Upload your library clearance/no-debt receipt",          icon: "📚" },
];

/* ── Welcome Banner ─────────────────────────────────────── */
function WelcomeBanner({ student, scrollToUpload }) {
  const firstName = student?.first_name || student?.name?.split(' ')[0] || "Student";
  return (
    <div className="welcome-banner">
      <div className="banner-content">
        <h1 className="banner-greeting">
          <span className="wave-emoji">👋</span> Good to see you, {firstName}!
        </h1>
        <p className="banner-subtext">Your dashboard is up to date. Continue your clearance process below.</p>
      </div>
      <div className="banner-right">
        <p className="banner-quote">"Your journey to graduation,<br/>verified with algorithmic truth."</p>
        <button className="btn-upload-link" onClick={scrollToUpload}>↑ UPLOAD YOUR DOCUMENTS</button>
      </div>
      <div className="banner-visual">
        <div className="scanner-top"></div>
        <div className="scanner-beam"></div>
        <div className="scanner-doc">
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-line short"></div>
        </div>
      </div>
    </div>
  );
}

/* ── Progress Bar ───────────────────────────────────────── */
function ClearanceProgress({ docStatuses }) {
  const authenticated = docStatuses.filter(d => d.status === 'authenticated').length;
  const total         = DOCS.length;
  const pct           = (authenticated / total) * 100;
  const hasIssues     = docStatuses.some(d => d.status === 'flagged' || d.status === 'rejected');
  const allVerified   = authenticated === total;

  let statusClass = "pending", label = "In Progress";
  if (allVerified)   { statusClass = "success"; label = "All Clear! 🎉"; }
  else if (hasIssues){ statusClass = "danger";  label = "Action Required ⚠️"; }

  return (
    <div className="progress-card">
      <div className="progress-header">
        <div>
          <h3>Clearance Progress</h3>
          <p>{authenticated} of {total} documents verified</p>
        </div>
        <div className={`status-badge status-${statusClass}`}>{label}</div>
      </div>
      <div className="progress-container">
        <div className="progress-track-bg"></div>
        <div className="progress-track-fill" style={{ width: `${pct}%`, backgroundColor: hasIssues ? 'var(--danger-red)' : 'var(--color-green)' }}></div>
        <div className="progress-nodes">
          {DOCS.map((doc) => {
            const ds = docStatuses.find(d => d.doc_type === doc.id);
            const isDone   = ds?.status === 'authenticated';
            const isFailed = ds?.status === 'flagged' || ds?.status === 'rejected';
            return (
              <div key={doc.id} className={`node-wrapper ${isDone ? "node-done" : ""} ${isFailed ? "node-failed" : ""}`}>
                <div className="node-dot"></div>
                <span className="node-label">{doc.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Upload Card ────────────────────────────────────────── */
function UploadCard({ doc, docStatus, onUpload, uploading }) {
  const inputRef  = useRef();
  const [dragging, setDragging] = useState(false);
  const isUploading = uploading === doc.id;

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; }
    const allowed = ["image/jpeg","image/png","application/pdf"];
    if (!allowed.includes(file.type)) { alert("Only JPG, PNG, or PDF files allowed."); return; }
    onUpload(doc.id, file);
  };

  const status = docStatus?.status || 'not_uploaded';
  const hasFile = status !== 'not_uploaded';

  const statusColor = {
    authenticated: '#00E5A0',
    flagged:       '#ff6b6b',
    rejected:      '#ff6b6b',
    processing:    '#f6ad55',
    pending:       '#f6ad55',
    not_uploaded:  'inherit',
  }[status] || 'inherit';

  return (
    <div
      className={`upload-card ${hasFile ? 'uploaded' : ''} ${dragging ? 'drag-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
    >
      <div className="upload-icon-circle">
        <span className="emoji">
          {isUploading ? '⏳' : status === 'authenticated' ? '✓' : doc.icon}
        </span>
      </div>

      <div className="upload-text">
        <h4>{doc.label}</h4>
        <p>{doc.desc}</p>
        {hasFile && (
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: statusColor, textTransform: 'capitalize' }}>
            ● {status === 'not_uploaded' ? '' : status === 'authenticated' ? 'Verified ✅' : status}
          </span>
        )}
      </div>

      {isUploading ? (
        <div className="uploaded-file-info">
          <div className="file-name-pill">⏳ Uploading & analysing...</div>
        </div>
      ) : hasFile ? (
        <div className="uploaded-file-info">
          <div className="file-name-pill">📄 Submitted</div>
          <button className="btn-choose-file" onClick={() => inputRef.current?.click()}>
            ↑ Replace File
          </button>
        </div>
      ) : (
        <button className="btn-choose-file" onClick={() => inputRef.current?.click()}>
          ↑ Choose File
        </button>
      )}

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}

/* ── Modals ─────────────────────────────────────────────── */
function SuccessModal({ onClose, navigate, emailSent }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon-large">🎓</div>
        <h2>Clearance Approved!</h2>
        <p>
          Congratulations! All documents have been verified successfully by FiDAS. You are cleared for graduation.{' '}
          {emailSent
            ? 'A confirmation email has been sent to your inbox.'
            : 'However, we could not send the confirmation email — please contact the Student Affairs office to confirm your clearance.'}
        </p>
        {!emailSent && (
          <div style={{ color: '#f6ad55', background: 'rgba(246,173,85,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠ Email delivery failed
          </div>
        )}
        <div className="modal-actions-row">
          <button className="btn-finalize" onClick={onClose}>Dashboard</button>
          <button className="btn-finalize ready" onClick={() => navigate("/")}>Return Home</button>
        </div>
      </div>
    </div>
  );
}

function RejectionModal({ doc, xaiMessage, onClose }) {
  if (!doc) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="success-modal rejection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon-large" style={{ color: 'var(--danger-red)' }}>⚠️</div>
        <h2 style={{ color: 'var(--danger-red)' }}>Verification Failed</h2>
        <p style={{ marginBottom: '16px' }}><strong>{doc.label}</strong></p>
        <div className="reference-box error-box">
          <strong>FiDAS AI Feedback:</strong><br />
          {xaiMessage || 'Document could not be verified. Please re-upload the original file.'}
        </div>
        <p style={{ fontSize: '0.9rem', marginBottom: '24px' }}>
          Go to <strong>Upload Documents</strong>, replace the file, and try again.
        </p>
        <div className="modal-actions-row">
          <button className="btn-finalize danger-btn" onClick={onClose}>I Understand</button>
        </div>
      </div>
    </div>
  );
}

/* ── Profile Tab (editable) ────────────────────────────── */
function ProfileTab({ student, enrichedStudent, updateStudent }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: student?.full_name || '',
    email: student?.email || '',
    department: student?.department || '',
    matric_no: student?.matric_no || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await authAPI.updateProfile(form);
      if (data.success) {
        updateStudent(data.student);
        setSuccessMsg('Profile updated successfully.');
        setEditing(false);
      } else {
        setError(data.message || 'Update failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <h2 className="section-title">My Profile</h2>
      <div className="profile-card">
        <div className="profile-header-large">
          <div className="profile-avatar-large">{enrichedStudent.avatar}</div>
          <div className="profile-header-text">
            <h3>{enrichedStudent.name}</h3>
            <p>FUTO Final Year Student</p>
          </div>
        </div>

        {successMsg && (
          <div style={{ color: '#00E5A0', background: 'rgba(0,229,160,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
            ✓ {successMsg}
          </div>
        )}
        {error && (
          <div style={{ color: '#ff6b6b', background: '#ffebeb22', padding: '10px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
            ⚠ {error}
          </div>
        )}

        {!editing ? (
          <>
            <div className="profile-details-grid">
              <div className="detail-box"><label>Full Name</label><p>{student?.full_name}</p></div>
              <div className="detail-box"><label>Registration Number</label><p>{student?.matric_no}</p></div>
              <div className="detail-box"><label>Department</label><p>{student?.department}</p></div>
              <div className="detail-box"><label>Current Level</label><p>500L</p></div>
              <div className="detail-box"><label>Email Address</label><p>{student?.email}</p></div>
            </div>
            <button className="btn-finalize ready" style={{ marginTop: '20px', width: 'max-content', padding: '10px 24px' }} onClick={() => setEditing(true)}>
              ✏️ Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="settings-form" style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Full Name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} />

            <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Registration Number</label>
            <input name="matric_no" value={form.matric_no} onChange={handleChange} />

            <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Department</label>
            <input name="department" value={form.department} onChange={handleChange} />

            <label style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-finalize ready" style={{ padding: '10px 24px', flex: '1 1 auto', minWidth: '140px' }} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button type="button" className="btn-finalize" style={{ padding: '10px 24px', flex: '1 1 auto', minWidth: '100px' }} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Settings Tab (change password) ─────────────────────── */
function SettingsTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const { data } = await authAPI.changePassword(form);
      if (data.success) {
        setSuccessMsg('Password updated successfully.');
        setForm({ current_password: '', new_password: '', confirm_new_password: '' });
      } else {
        setError(data.message || 'Update failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-wrapper">
      <h2 className="section-title">Account Settings</h2>
      <div className="settings-card">
        <div className="settings-group">
          <h3>Change Password</h3>
          <p className="settings-desc">Ensure your account is using a long, random password to stay secure.</p>

          {successMsg && (
            <div style={{ color: '#00E5A0', background: 'rgba(0,229,160,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
              ✓ {successMsg}
            </div>
          )}
          {error && (
            <div style={{ color: '#ff6b6b', background: '#ffebeb22', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="settings-form">
            <input
              type="password" name="current_password" placeholder="Current Password"
              value={form.current_password} onChange={handleChange} required
            />
            <input
              type="password" name="new_password" placeholder="New Password"
              value={form.new_password} onChange={handleChange} required
            />
            <input
              type="password" name="confirm_new_password" placeholder="Confirm New Password"
              value={form.confirm_new_password} onChange={handleChange} required
            />
            <button type="submit" className="btn-finalize ready" style={{ width: 'max-content', padding: '10px 24px' }} disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="settings-divider"></div>

        <div className="settings-group">
          <h3>Notification Preferences</h3>
          <p className="settings-desc">Manage how you receive updates about your clearance status.</p>
          <div className="toggle-row">
            <span>Email Alerts for Clearance Updates</span>
            <label className="toggle-switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────── */
export default function Dashboard() {
  const navigate         = useNavigate();
  const { student, logout, updateStudent } = useAuth();

  const [docStatuses, setDocStatuses]   = useState([]);
  const [activeTab, setActiveTab]       = useState("upload");
  const [uploading, setUploading]       = useState(null);    // doc_type currently uploading
  const [finalizing, setFinalizing]     = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [emailSent, setEmailSent]       = useState(true);
  const [rejectionDoc, setRejectionDoc] = useState(null);   // { doc, xai_message }
  const [fetchError, setFetchError]     = useState('');
  const [finalizeError, setFinalizeError] = useState('');
  const uploadRef = useRef();

  // ── Poll document statuses every 4 seconds ──────────────────────────────────
  const fetchStatuses = useCallback(async () => {
    try {
      const { data } = await documentAPI.getStatus();
      if (data.success) setDocStatuses(data.documents);
    } catch {
      setFetchError('Could not load document statuses. Check your connection.');
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 4000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  // ── Upload handler ───────────────────────────────────────────────────────────
  const handleUpload = async (docType, file) => {
    setUploading(docType);
    try {
      await documentAPI.upload(docType, file);
      await fetchStatuses(); // Refresh immediately after upload
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  // ── Finalize clearance ───────────────────────────────────────────────────────
  const handleFinalize = async () => {
    setFinalizing(true);
    setFinalizeError('');
    try {
      const { data } = await documentAPI.finalize();
      if (data.success) {
        setEmailSent(data.email_sent !== false);
        setShowSuccess(true);
        await fetchStatuses();
      } else {
        setFinalizeError(data.message || 'Could not finalize clearance.');
      }
    } catch (err) {
      setFinalizeError(err.response?.data?.message || 'Finalization failed. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const allAuthenticated = docStatuses.length === 5 && docStatuses.every(d => d.status === 'authenticated');
  const anyProcessing    = docStatuses.some(d => d.status === 'processing');
  const uploadedCount    = docStatuses.filter(d => d.status !== 'not_uploaded').length;

  const scrollToUpload = () => {
    setActiveTab("upload");
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Student enrichment for navbar
  const enrichedStudent = student ? {
    ...student,
    name:       student.full_name || student.name || 'Student',
    regNumber:  student.matric_no || student.regNumber || 'N/A',
    avatar:     (student.full_name || student.name || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
  } : { name: 'Student', regNumber: 'N/A', avatar: 'ST' };

  return (
    <div className="dashboard-container">
      <DashboardNavbar navigate={navigate} student={enrichedStudent} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="dashboard-main-content">

        {['upload','status','help'].includes(activeTab) && (
          <>
            <WelcomeBanner student={enrichedStudent} scrollToUpload={scrollToUpload} />
            <ClearanceProgress docStatuses={docStatuses} />

            {fetchError && (
              <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '12px', borderRadius: '8px', margin: '0 0 16px', textAlign: 'center' }}>
                ⚠ {fetchError}
              </div>
            )}

            {anyProcessing && (
              <div style={{ background: '#fff8e1', color: '#b45309', padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>
                ⏳ FiDAS is analysing your document(s). Status updates every few seconds automatically.
              </div>
            )}

            <div className="dashboard-tabs">
              <button className={`tab-btn ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
                <span className="tab-icon">📥</span> Upload Documents
              </button>
              <button className={`tab-btn ${activeTab === "status" ? "active" : ""}`} onClick={() => setActiveTab("status")}>
                <span className="tab-icon">📄</span> Clearance Status
              </button>
              <button className={`tab-btn ${activeTab === "help" ? "active" : ""}`} onClick={() => setActiveTab("help")}>
                <span className="tab-icon">❓</span> Help
              </button>
            </div>
          </>
        )}

        {/* ── UPLOAD TAB ── */}
        {activeTab === "upload" && (
          <div ref={uploadRef} className="upload-section">
            <div className="upload-instruction">
              Upload your clearance documents below. Accepted formats: JPG, PNG, PDF (max 5MB each).
            </div>
            <div className="upload-grid">
              {DOCS.map((doc) => (
                <UploadCard
                  key={doc.id}
                  doc={doc}
                  docStatus={docStatuses.find(d => d.doc_type === doc.id)}
                  onUpload={handleUpload}
                  uploading={uploading}
                />
              ))}
            </div>
            <div className="finalize-footer">
              <div className="remaining-warning">
                {uploadedCount === 5 ? '✅ All files uploaded.' : `⚠️ ${5 - uploadedCount} document(s) remaining`}
              </div>
              <button className={`btn-finalize ${uploadedCount === 5 ? 'ready' : ''}`} onClick={() => setActiveTab("status")}>
                📄 Go to Clearance Status
              </button>
            </div>
          </div>
        )}

        {/* ── STATUS TAB ── */}
        {activeTab === "status" && (
          <div className="status-section">
            <div className="status-list">
              {DOCS.map((doc) => {
                const ds = docStatuses.find(d => d.doc_type === doc.id);
                const status = ds?.status || 'not_uploaded';

                let badgeClass = 'pill-warning', badgeText = 'Pending Upload', clickable = false;
                if (status === 'processing')    { badgeClass = 'pill-info';    badgeText = 'Analysing ⏳'; }
                if (status === 'pending')       { badgeClass = 'pill-info';    badgeText = 'Awaiting Analysis'; }
                if (status === 'authenticated') { badgeClass = 'pill-success'; badgeText = 'Verified ✅'; }
                if (status === 'flagged')       { badgeClass = 'pill-danger clickable-pill'; badgeText = 'Flagged ⚠️'; clickable = true; }
                if (status === 'rejected')      { badgeClass = 'pill-danger clickable-pill'; badgeText = 'Rejected ⚠️'; clickable = true; }

                return (
                  <div key={doc.id} className="status-row">
                    <div className="status-row-icon">{doc.icon}</div>
                    <div className="status-row-details">
                      <h4>{doc.label}</h4>
                      <p>{doc.desc}</p>
                    </div>
                    {clickable ? (
                      <button className={`status-pill ${badgeClass}`} onClick={() => setRejectionDoc({ doc, xai_message: ds?.xai_message })}>
                        {badgeText}
                      </button>
                    ) : (
                      <div className={`status-pill ${badgeClass}`}>{badgeText}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="finalize-footer" style={{ marginTop: '30px' }}>
              {finalizeError && (
                <div style={{ color: '#ff6b6b', background: '#ffebeb', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center', width: '100%' }}>
                  ⚠ {finalizeError}
                </div>
              )}
              <div className="remaining-warning">
                {allAuthenticated
                  ? '✅ All documents verified! You are cleared to finalize.'
                  : anyProcessing
                    ? '⏳ Documents are being analysed. Please wait...'
                    : `${uploadedCount} of 5 documents submitted.`}
              </div>
              {allAuthenticated && (
                <button className="btn-finalize ready" onClick={handleFinalize} disabled={finalizing}>
                  {finalizing ? '⏳ Processing...' : '🎓 Get Your Final Clearance'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── HELP TAB ── */}
        {activeTab === "help" && (
          <div className="faq-section">
            {[
              { q: "What documents do I need?", a: "School Fees receipt, Departmental Dues receipt, SUG receipt, Medical receipt, and Library receipt." },
              { q: "What file formats are accepted?", a: "JPG, PNG, and PDF. Each file must be under 5MB." },
              { q: "How long does verification take?", a: "FiDAS AI verification typically completes within seconds to a few minutes after upload." },
              { q: "What if my document is flagged?", a: "Click the red 'Flagged' badge on the Status page to see the specific AI reason. Then return to Upload to replace the file with the original." },
              { q: "Why was my document rejected?", a: "Common reasons: traces of editing software (Photoshop/Canva) detected in metadata, pixel-level tampering found, or payment reference not found in FUTO records. Always upload the original, unedited receipt." },
            ].map((item, i) => (
              <div key={i} className="faq-item">
                <h4>{item.q}</h4>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        )}

{/* ── PROFILE TAB ── */}
{activeTab === "profile" && (
          <ProfileTab student={student} enrichedStudent={enrichedStudent} updateStudent={updateStudent} />
        )}

{/* ── SETTINGS TAB ── */}
{activeTab === "settings" && (
          <SettingsTab />
        )}
      </main>

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} navigate={navigate} emailSent={emailSent} />}
      {rejectionDoc && (
        <RejectionModal
          doc={rejectionDoc.doc}
          xaiMessage={rejectionDoc.xai_message}
          onClose={() => setRejectionDoc(null)}
        />
      )}
    </div>
  );
}
