// src/components/layout/Navigation.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOutUser } from '../../services/auth';
import LoginModal from '../auth/LoginModal';

const Navigation = ({ currentUser, onUserLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/projects', label: 'Proyek', adminOnly: false },
    { path: '/reports', label: 'Laporan', adminOnly: false },
  ];

  if (currentUser && currentUser.role === 'admin') {
    navLinks.unshift({ path: '/', label: 'Dashboard', adminOnly: true });
  }

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">PT Permata Energi Borneo</h1>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 space-x-4">
                {navLinks.map((link) => (
                  (!link.adminOnly || (currentUser && currentUser.role === 'admin')) && (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(link.path)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-600">
                      {currentUser.name || currentUser.email}
                      {currentUser.role === 'admin' && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Login Admin
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg
                  className={`h-6 w-6 ${mobileMenuOpen ? 'hidden' : 'block'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`h-6 w-6 ${mobileMenuOpen ? 'block' : 'hidden'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              (!link.adminOnly || (currentUser && currentUser.role === 'admin')) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>
          {currentUser && (
            <div className="border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-600">
                {currentUser.name || currentUser.email}
                {currentUser.role === 'admin' && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </nav>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          onUserLogin(user);
          if (user.role === 'admin') {
            window.location.href = '/';
          }
        }}
      />
    </>
  );
};

export default Navigation;