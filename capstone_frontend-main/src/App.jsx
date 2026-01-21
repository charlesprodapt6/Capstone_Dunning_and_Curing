import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SnackbarProvider from './components/SnackbarProvider';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import CustomerLayout from './components/customer/CustomerLayout';
import DunningDashboard from './components/DunningDashboard';
import CustomerList from './components/CustomerList';
import CustomerStatus from './components/CustomerStatus';
import RuleList from './components/RuleList';
import OverdueCustomers from './components/OverdueCustomers';
import DunningLogs from './components/DunningLogs';
import CuringProcess from './components/CuringProcess';
import CustomerDashboard from './components/customer/CustomerDashboard';

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && userRole !== allowedRole)
    return <Navigate to={userRole === 'ADMIN' ? '/dashboard' : '/customer/dashboard'} replace />;

  return children;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'hello-kitty');

  const toggleTheme = () => {
    const next = theme === 'hello-kitty' ? 'oni-samurai' : 'hello-kitty';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <SnackbarProvider>
      <Router>
        <Routes>
          {/* Login Route */}
          <Route
            path="/login"
            element={
              localStorage.getItem('isAuthenticated') === 'true' ? (
                <Navigate
                  to={
                    localStorage.getItem('userRole') === 'ADMIN'
                      ? '/dashboard'
                      : '/customer/dashboard'
                  }
                  replace
                />
              ) : (
                <LoginForm />
              )
            }
          />

          {/* Admin Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Layout onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DunningDashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerStatus />} />
            <Route path="rules" element={<RuleList />} />
            <Route path="overdue" element={<OverdueCustomers />} />
            <Route path="logs" element={<DunningLogs />} />
            <Route path="curing/process" element={<CuringProcess />} />
          </Route>

          {/* Customer Routes */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRole="CUSTOMER">
                <CustomerLayout onLogout={handleLogout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
          </Route>
        </Routes>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
