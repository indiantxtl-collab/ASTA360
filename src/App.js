import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import socketService from './services/socketService';
import Login from './components/Login';
import Register from './components/Register';
import DashboardLayout from './components/DashboardLayout';
import AdvancedCEODashboard from './components/dashboards/AdvancedCEODashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import TaskManagement from './components/modules/TaskManagement';
import AIAssistant from './components/modules/AIAssistant';

// Set base URL for API calls
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('asta360_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('asta360_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize socket service
    socketService.initialize();
    
    // Check if user is already authenticated
    const token = localStorage.getItem('asta360_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('/auth/verify');
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
    socketService.disconnect();
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
          isAuthenticated ? <Navigate to={`/${user?.role.toLowerCase().replace('/', '').replace(' ', '-')}`} /> : 
          <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to={`/${user?.role.toLowerCase().replace('/', '').replace(' ', '-')}`} /> : 
          <Register />
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to={`/${user?.role.toLowerCase().replace('/', '').replace(' ', '-')}`} /> : 
          <Navigate to="/login" />
        } />
        
        <Route path="/ceo/*" element={
          user?.role === 'Founder/CEO' ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <AdvancedCEODashboard user={user} />
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

        {/* Module routes */}
        <Route path="/tasks" element={
          isAuthenticated ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <TaskManagement user={user} />
          </DashboardLayout> : 
          <Navigate to="/login" />
        } />

        <Route path="/ai-assistant" element={
          isAuthenticated ? 
          <DashboardLayout user={user} onLogout={handleLogout}>
            <AIAssistant user={user} />
          </DashboardLayout> : 
          <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
