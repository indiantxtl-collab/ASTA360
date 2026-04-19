import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FaUsers, FaDollarSign, FaChartLine, FaTasks, FaBriefcase, FaBox, FaEnvelope, FaRocket, FaTrendingUp, FaFire, FaThumbsUp } from 'react-icons/fa';
import { FiActivity, FiTarget, FiAward } from 'react-icons/fi';
import axios from 'axios';

const AdvancedCEODashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    weeklyActivity: { weeklyTasks: [], weeklyLeads: [] },
    financialAnalytics: { monthlyRevenue: [], expenses: [] },
    topPerformers: [],
    aiInsights: {}
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/advanced-ceo');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center mt-1">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`ml-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {trend > 0 ? '+' : ''}{trend}% <FaTrendingUp className="ml-1" size={12} />
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: <FiActivity size={16} /> },
          { id: 'financial', label: 'Financial', icon: <FaDollarSign size={16} /> },
          { id: 'performance', label: 'Performance', icon: <FiTarget size={16} /> },
          { id: 'ai-insights', label: 'AI Insights', icon: <FaRocket size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={dashboardData.overview.totalUsers}
              icon={<FaUsers className="text-blue-600" />}
              color="bg-blue-100"
              trend={5.2}
              subtitle="Active users"
            />
            <StatCard
              title="Revenue"
              value={`$${dashboardData.overview.totalRevenue.toLocaleString()}`}
              icon={<FaDollarSign className="text-green-600" />}
              color="bg-green-100"
              trend={12.3}
              subtitle="Monthly recurring"
            />
            <StatCard
              title="Active Tasks"
              value={dashboardData.overview.totalTasks}
              icon={<FaTasks className="text-orange-600" />}
              color="bg-orange-100"
              trend={-2.1}
              subtitle="In progress"
            />
            <StatCard
              title="New Leads"
              value={dashboardData.overview.totalLeads}
              icon={<FaBriefcase className="text-purple-600" />}
              color="bg-purple-100"
              trend={8.7}
              subtitle="Last 30 days"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaChartLine className="mr-2 text-blue-600" />
                Revenue Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.financialAnalytics.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="total_revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Activity Trends */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiActivity className="mr-2 text-green-600" />
                Activity Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.weeklyActivity.weeklyTasks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiAward className="mr-2 text-yellow-600" />
                Top Performers
              </h3>
              <div className="space-y-4">
                {dashboardData.topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{performer.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{performer.completed_tasks} tasks</p>
                      <p className="text-xs text-gray-500">{performer.avg_task_score}% avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Expense Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaDollarSign className="mr-2 text-red-600" />
                Expense Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.financialAnalytics.expenses}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_amount"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dashboardData.financialAnalytics.expenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Revenue"
              value={`$${dashboardData.financialAnalytics.monthlyRevenue.reduce((sum, item) => sum + item.total_revenue, 0).toLocaleString()}`}
              icon={<FaDollarSign className="text-green-600" />}
              color="bg-green-100"
              trend={15.2}
            />
            <StatCard
              title="Total Expenses"
              value={`$${dashboardData.financialAnalytics.expenses.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}`}
              icon={<FaDollarSign className="text-red-600" />}
              color="bg-red-100"
              trend={-3.1}
            />
            <StatCard
              title="Net Profit"
              value={`$${(dashboardData.financialAnalytics.monthlyRevenue.reduce((sum, item) => sum + item.total_revenue, 0) - dashboardData.financialAnalytics.expenses.reduce((sum, item) => sum + item.total_amount, 0)).toLocaleString()}`}
              icon={<FaThumbsUp className="text-green-600" />}
              color="bg-green-100"
              trend={22.5}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dashboardData.financialAnalytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_revenue" fill="#82ca9d" name="Revenue" />
                <Bar dataKey="total_expenses" fill="#ff7300" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.topPerformers.map((performer, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{performer.name}</h4>
                    <div className="flex items-center">
                      <FaFire className="text-orange-500 mr-1" />
                      <span className="text-sm font-medium">{performer.completed_tasks}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, performer.avg_task_score)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{performer.avg_task_score}% performance</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai-insights' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaRocket className="mr-2 text-blue-600" />
              AI-Powered Business Insights
            </h3>
            <div className="prose prose-sm max-w-none">
              {dashboardData.aiInsights.summary && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Executive Summary</h4>
                  <p className="text-gray-700 text-sm">{dashboardData.aiInsights.summary}</p>
                </div>
              )}
              {dashboardData.aiInsights.insights && (
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {dashboardData.aiInsights.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCEODashboard;
