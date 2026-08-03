import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home           from './pages/Home/Home';
import Register       from './pages/Register/Register';
import Login          from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword  from './pages/ResetPassword/ResetPassword';
import Dashboard      from './pages/Dashboard/Dashboard';
import Admin          from './pages/Admin/Admin';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/"                    element={<Home />} />
      <Route path="/register"            element={<Register />} />
      <Route path="/login"               element={<Login />} />
      <Route path="/forgot-password"     element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/admin"               element={<Admin />} />

      {/* Protected — must be logged in */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
