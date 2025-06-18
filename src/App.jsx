// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChange } from './services/auth';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/dashboard/Dashboard';
import ProjectList from './components/projects/ProjectList';
import ProjectDetail from './components/projects/ProjectDetail';
import Reports from './components/reports/Reports';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/globals.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation currentUser={currentUser} onUserLogin={setCurrentUser} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Dashboard - Admin only */}
            <Route
              path="/"
              element={
                currentUser && currentUser.role === 'admin' ? (
                  <Dashboard currentUser={currentUser} />
                ) : (
                  <Navigate to="/projects" replace />
                )
              }
            />
            
            {/* Projects - Public */}
            <Route path="/projects" element={<ProjectList currentUser={currentUser} />} />
            <Route path="/projects/:id" element={<ProjectDetail currentUser={currentUser} />} />
            
            {/* Reports - Public */}
            <Route path="/reports" element={<Reports currentUser={currentUser} />} />
            
            {/* Redirect any unknown routes */}
            <Route path="*" element={<Navigate to={currentUser?.role === 'admin' ? '/' : '/projects'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;