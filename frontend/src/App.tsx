import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Vulnerable E-commerce App Components
import VulnerableLayout from './components/vulnerable/VulnerableLayout';
import HomePage from './pages/vulnerable/HomePage';
import ProductsPage from './pages/vulnerable/ProductsPage';
import LoginPage from './pages/vulnerable/LoginPage';
import ProfilePage from './pages/vulnerable/ProfilePage';
import SearchResultsPage from './pages/vulnerable/SearchResultsPage';

// Security Dashboard Components
import DashboardLayout from './components/dashboard/DashboardLayout';
import OverviewDashboard from './pages/dashboard/OverviewDashboard';
import AttackHistory from './pages/dashboard/AttackHistory';
import Analytics from './pages/dashboard/Analytics';
import AlertsManagement from './pages/dashboard/AlertsManagement';
import Reports from './pages/dashboard/Reports';
import Settings from './pages/dashboard/Settings';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          {/* Vulnerable E-commerce Application */}
          <Route path="/vulnerable/*" element={<VulnerableLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="search" element={<SearchResultsPage />} />
          </Route>

          {/* Security Dashboard */}
          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route index element={<OverviewDashboard />} />
            <Route path="overview" element={<OverviewDashboard />} />
            <Route path="history" element={<AttackHistory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="alerts" element={<AlertsManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/vulnerable" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;