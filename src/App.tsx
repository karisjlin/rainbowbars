import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './CSS/App.css';
import Modal from './components/Modal';
import AccountPage from './pages/account';
import AboutPage from './pages/about';
import HomePage from './pages/homepage';

const CURRENT_USER_CHANGE_EVENT = 'currentuserchange';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('currentUser')));
  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
      return '';
    }

    try {
      const currentUser = JSON.parse(currentUserRaw) as { email?: string };
      return currentUser.email?.trim().toLowerCase() || '';
    } catch (error) {
      return '';
    }
  });
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuCloseTimer = useRef<number | null>(null);
  const navigate = useNavigate();
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
    const currentUserRaw = localStorage.getItem('currentUser');
    let nextEmail = '';

    if (currentUserRaw) {
      try {
        const currentUser = JSON.parse(currentUserRaw) as { email?: string };
        nextEmail = currentUser.email?.trim().toLowerCase() || '';
      } catch (error) {
        nextEmail = '';
      }
    }

    setIsModalOpen(false);
    setCurrentUserEmail(nextEmail);
    setIsLoggedIn(Boolean(nextEmail));
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event(CURRENT_USER_CHANGE_EVENT));
    setIsLoggedIn(false);
    setCurrentUserEmail('');
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
            element={<HomePage barsKey={barsInstanceKey} currentUserEmail={currentUserEmail} />}
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
