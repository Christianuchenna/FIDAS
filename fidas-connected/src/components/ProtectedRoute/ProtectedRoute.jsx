/**
 * ProtectedRoute
 * Wraps any route that requires a logged-in student.
 * If token is missing or invalid, redirects to /login.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { student, loading } = useAuth();

  // While verifying stored token — show nothing (avoids flash redirect)
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#07111F', color: '#00E5A0',
        fontSize: '1.1rem', fontFamily: 'sans-serif'
      }}>
        Verifying session...
      </div>
    );
  }

  return student ? children : <Navigate to="/login" replace />;
}
