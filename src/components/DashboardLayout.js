import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBars, FaTimes, FaTachometerAlt, FaUsers, FaTasks, FaChartLine, FaBell, FaCog, FaSignOutAlt } from 'react-icons/fa';

const DashboardLayout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = {
    'Founder/CEO': [
      { path: '/ceo', label: 'Dashboard', icon: FaTachometerAlt },
      { path: '/ceo/team', label: 'Team Management', icon: FaUsers },
      { path: '/ceo/sales', label: 'Sales Analytics', icon: FaChartLine },
      { path: '/ceo/finance', label: 'Finance', icon: FaChartLine },
      { path: '/ceo/settings', label: 'Settings', icon: FaCog }
    ],
    'Admin': [
      { path: '/admin', label: 'Dashboard', icon: FaTachometerAlt },
      { path: '/admin/users', label: 'User Management', icon: FaUsers },
      { path: '/admin/workflows', label: 'Workflows', icon: FaTasks },
      { path: '/admin/settings', label: 'Settings', icon: FaCog }
    ],
    'Manager': [
      { path: '/manager', label: 'Dashboard', icon: FaTachometerAlt },
      { path: '/manager/tasks', label: 'Task Management', icon: FaTasks },
      { path: '/manager/reports', label: 'Reports', icon: FaChartLine },
      { path: '/manager/team', label: 'My Team', icon: FaUsers }
    ],
    'Employee': [
      { path: '/employee', label: 'Dashboard', icon: FaTachometerAlt },
      { path: '/employee/tasks', label: 'My Tasks', icon: FaTasks },
      { path: '/employee/profile', label: 'Profile', icon: FaUsers }
    ]
  };

  const getMenuItems = () => {
    return menuItems[user.role] || [];
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ASTA360</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {getMenuItems().map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3" size={18} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="mr-3" />
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
              >
                <FaBars size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {user.role} Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="text-gray-500 hover:text-gray-700 relative">
                  <FaBell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
