import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './CSS/App.css';
import Modal from './components/Modal';
import { useAuth } from './context/AuthContext';
import AccountPage from './pages/account';
import AboutPage from './pages/about';
import HomePage from './pages/homepage';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuCloseTimer = useRef<number | null>(null);
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, logout } = useAuth();
  const currentUserEmail = currentUser?.email?.trim().toLowerCase() || '';
  const barsInstanceKey = `${isLoggedIn ? 'logged-in' : 'logged-out'}:${currentUserEmail}`;

  useEffect(() => {
    return () => {
      if (accountMenuCloseTimer.current) {
        window.clearTimeout(accountMenuCloseTimer.current);
      }
    };
  }, []);

  const handleLoginClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setIsAccountMenuOpen(false);
    navigate('/karis');
  };

  const openAccountMenu = () => {
    if (accountMenuCloseTimer.current) {
      window.clearTimeout(accountMenuCloseTimer.current);
      accountMenuCloseTimer.current = null;
    }
    setIsAccountMenuOpen(true);
  };

  const closeAccountMenuWithDelay = () => {
    if (accountMenuCloseTimer.current) {
      window.clearTimeout(accountMenuCloseTimer.current);
    }
    accountMenuCloseTimer.current = window.setTimeout(() => {
      setIsAccountMenuOpen(false);
      accountMenuCloseTimer.current = null;
    }, 500);
  };

  return (
    <>
      <header className="app-header">
        <nav className="header-nav-left">
          <NavLink
            to="/karis"
            className={({ isActive }) => (isActive ? 'header-link-active' : '')}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'header-link-active' : '')}
          >
            About
          </NavLink>
        </nav>
        <nav className="header-nav-right">
          {isLoggedIn ? (
            <div
              className="account-link-wrap"
              onMouseEnter={openAccountMenu}
              onMouseLeave={closeAccountMenuWithDelay}
            >
              <NavLink
                to="/account"
                className={({ isActive }) => (isActive ? 'header-link-active' : '')}
              >
                Account
              </NavLink>
              {isAccountMenuOpen && (
                <div className="account-hover-modal">
                  <button className="account-hover-action" onClick={handleLogoutClick} type="button">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="header-link-button" onClick={handleLoginClick}>Login</button>
          )}
        </nav>
      </header>
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/karis" replace />}
          />
          <Route
            path="/karis"
            element={<HomePage barsKey={barsInstanceKey} />}
          />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="*"
            element={<Navigate to="/karis" replace />}
          />
        </Routes>
      </div>
      {isModalOpen && <Modal onClose={handleCloseModal} />}
    </>
  );
}

export default App;
