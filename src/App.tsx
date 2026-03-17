import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './CSS/App.css';
import Modal from './components/Modal';
import { useAuth } from './context/AuthContext';
import AccountPage from './pages/account';
import AboutPage from './pages/about';
import HomePage from './pages/homepage';

// Root application component: renders the header, routing, and the login modal.
function App() {
  // Controls whether the login/signup modal is visible.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Controls the hover dropdown that appears over the Account nav link.
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // Ref to the close-delay timer so it can be cancelled if the user moves
  // the cursor back into the menu before it dismisses.
  const accountMenuCloseTimer = useRef<number | null>(null);

  const navigate = useNavigate();
  const { currentUser, isLoggedIn, logout } = useAuth();
  const currentUserEmail = currentUser?.email?.trim().toLowerCase() || '';

  // Unique key for the Bars component — changes when auth state changes so the
  // component fully remounts and reloads the correct user colors.
  const barsInstanceKey = `${isLoggedIn ? 'logged-in' : 'logged-out'}:${currentUserEmail}`;

  // Clean up any pending close timer when the component unmounts.
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
    // Redirect to home after logout so the user doesn't stay on the account page.
    navigate('/karis');
  };

  // Show the account dropdown immediately, cancelling any in-flight close timer.
  const openAccountMenu = () => {
    if (accountMenuCloseTimer.current) {
      window.clearTimeout(accountMenuCloseTimer.current);
      accountMenuCloseTimer.current = null;
    }
    setIsAccountMenuOpen(true);
  };

  // Delay closing the dropdown so the user has time to move the cursor into it.
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
        {/* Left-side navigation links */}
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

        {/* Right-side: Account link with hover dropdown (logged in) or Login button */}
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
          {/* Redirect bare "/" to the home route */}
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
          {/* Catch-all: redirect unknown paths to home */}
          <Route
            path="*"
            element={<Navigate to="/karis" replace />}
          />
        </Routes>
      </div>

      {/* Login/signup modal — rendered outside the route tree so it overlays any page */}
      {isModalOpen && <Modal onClose={handleCloseModal} />}
    </>
  );
}

export default App;
