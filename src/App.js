import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VisitorManagement from './components/VisitorManagement';
import LocationManagement from './components/LocationManagement';
import LocationPage from './components/LocationPage';
import VisitorForm from './components/VisitorForm';
import ThankYouPage from './components/ThankYouPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 🔹 Public route (login) */}
            <Route path="/" element={<Login />} />

            {/* 🔹 Protected routes - Hanya untuk admin */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/visitors" 
              element={
                <ProtectedRoute>
                  <VisitorManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/locations" 
              element={
                <ProtectedRoute>
                  <LocationManagement />
                </ProtectedRoute>
              } 
            />

            {/* 🔹 Public routes - Bisa diakses pengunjung tanpa login */}
            <Route 
              path="/location/:code" 
              element={<LocationPage />} 
            />

            <Route 
              path="/visitor-form/:locationCode/:formType" 
              element={<VisitorForm />} 
            />

            <Route 
              path="/thank-you" 
              element={<ThankYouPage />} 
            />

            {/* 🔹 Fallback jika URL tidak ditemukan */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;