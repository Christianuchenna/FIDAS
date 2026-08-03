/**
 * FiDAS Auth Context
 * Provides global student auth state to the entire app.
 * Wraps App.jsx so any component can read { student, token, login, logout }.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('fidas_token'));
  const [loading, setLoading] = useState(true); // True while we verify the stored token

  // On app mount — if token exists, verify it and load the student
  useEffect(() => {
    const verify = async () => {
      const storedToken = localStorage.getItem('fidas_token');
      if (!storedToken) { setLoading(false); return; }
      try {
        const { data } = await authAPI.getMe();
        if (data.success) {
          const s = data.student;
          setStudent({
            ...s,
            name:   s.full_name,
            avatar: s.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          });
          setToken(storedToken);
        } else {
          _clear();
        }
      } catch {
        _clear();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const _clear = () => {
    localStorage.removeItem('fidas_token');
    localStorage.removeItem('fidas_user');
    setStudent(null);
    setToken(null);
  };

  /**
   * Call after a successful login or register API response.
   * Stores token and student in context + localStorage.
   */
  const login = (apiResponse) => {
    const { token: t, student: s } = apiResponse;
    localStorage.setItem('fidas_token', t);
    const enriched = {
      ...s,
      name:   s.full_name,
      avatar: s.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    };
    localStorage.setItem('fidas_user', JSON.stringify(enriched));
    setToken(t);
    setStudent(enriched);
  };

/**
   * Call after a successful profile update to refresh
   * the student data held in context + localStorage.
   */
const updateStudent = (updatedFields) => {
  setStudent((prev) => {
    const merged = { ...prev, ...updatedFields };
    merged.name = merged.full_name;
    merged.avatar = merged.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    localStorage.setItem('fidas_user', JSON.stringify(merged));
    return merged;
  });
};

  const logout = () => _clear();

  return (
    <AuthContext.Provider value={{ student, token, loading, login, logout, updateStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
