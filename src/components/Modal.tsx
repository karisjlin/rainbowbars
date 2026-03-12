import React, { useState } from 'react';
import '../CSS/Modal.css';
import { useAuth } from '../context/AuthContext';

interface ModalProps {
  onClose: () => void;
}

interface StoredUser {
  name: string;
  email: string;
  password: string;
}

const USERS_STORAGE_KEY = 'users';

const Modal: React.FC<ModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [formMessage, setFormMessage] = useState('');

  const getStoredUsers = (): StoredUser[] => {
    const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!rawUsers) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawUsers) as StoredUser[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveStoredUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage('');

    if (!signUpName || !signUpEmail || !signUpPassword) {
      setFormMessage('Sign up requires name, email, and password.');
      return;
    }

    const normalizedEmail = signUpEmail.trim().toLowerCase();
    const users = getStoredUsers();
    const existingUser = users.find((user) => user.email === normalizedEmail);
    if (existingUser) {
      setFormMessage('An account with that email already exists.');
      return;
    }

    users.push({
      name: signUpName.trim(),
      email: normalizedEmail,
      password: signUpPassword,
    });
    saveStoredUsers(users);
    login({ name: signUpName.trim(), email: normalizedEmail });

    alert('Sign up successful.');
    onClose();
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage('');

    if (!signInEmail || !signInPassword) {
      setFormMessage('Sign in requires email and password.');
      return;
    }

    const normalizedEmail = signInEmail.trim().toLowerCase();
    const users = getStoredUsers();
    const matchedUser = users.find(
      (user) => user.email === normalizedEmail && user.password === signInPassword
    );

    if (!matchedUser) {
      setFormMessage('Invalid email or password.');
      return;
    }

    login({ name: matchedUser.name, email: matchedUser.email });

    alert('Sign in successful.');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="forms-container">
          <div className="form-section">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
              <input
                type="text"
                placeholder="Name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
              />
              <button type="submit">Sign Up</button>
            </form>
          </div>
          <div className="form-section">
            <h2>Sign In</h2>
            <form onSubmit={handleSignIn}>
              <input
                type="email"
                placeholder="Email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
              />
              <button type="submit">Sign In</button>
            </form>
          </div>
        </div>
        {formMessage && <p className="form-message">{formMessage}</p>}
      </div>
    </div>
  );
};

export default Modal;
