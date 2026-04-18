import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import DashboardLayout from './components/DashboardLayout';
import CEODashboard from './components/dashboards/CEODashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';

// Set base URL for API calls
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('asta360_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('asta360_token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    localStorage.setItem('asta360_token', userData.token);
    setUser(userData.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('asta360_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ASTA360...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={`/${user?.role.toLowerCase().replace('/', '')}`} /> : 
          <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to={`/${user?.role.toLowerCase().replace('/', '')}`} /> : 
          <Register />
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to={`/${user?.role.toLowerCase().replace('/', '')}`} /> : 
          <Navigate to="/login" />
        } />
        
        <Route path="/ceo/*" element={
          user?.role === 'Founder/CEO' ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <CEODashboard user={user} />
          </DashboardLayout> : 
          <Navigate to="/login" />
        } />
        
        <Route path="/admin/*" element={
          user?.role === 'Admin' ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <AdminDashboard user={user} />
          </DashboardLayout> : 
          <Navigate to="/login" />
        } />
        
        <Route path="/manager/*" element={
          user?.role === 'Manager' ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <ManagerDashboard user={user} />
          </DashboardLayout> : 
          <Navigate to="/login" />
        } />
        
        <Route path="/employee/*" element={
          user?.role === 'Employee' ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <EmployeeDashboard user={user} />
          </DashboardLayout> : 
          <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
