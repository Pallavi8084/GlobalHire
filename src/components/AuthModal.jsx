
import { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  UserRound,
  Mail,
  Lock,
  BriefcaseBusiness,
  ShieldCheck,
} from 'lucide-react';
import './AuthModal.css';

const ADMIN_EMAIL = 'admin@globalhire.demo';
const ADMIN_PASSWORD = 'GH-Admin-Demo-2026!';

export default function AuthModal({ open, mode = 'login', onClose, onSuccess }) {
  const [activeMode, setActiveMode] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Candidate',
  });
  const [error, setError] = useState('');

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError('');
  };

  const switchMode = (nextMode) => {
    setActiveMode(nextMode);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    // Demo administrator login
    if (activeMode === 'login' && email === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        setError('Incorrect administrator password.');
        return;
      }

      const adminUser = {
        id: 'globalhire-admin',
        name: 'GlobalHire Administrator',
        email: ADMIN_EMAIL,
        role: 'Admin',
      };

      localStorage.setItem(
        'globalhire_current_user',
        JSON.stringify(adminUser)
      );

      onSuccess?.(adminUser);
      onClose?.();
      return;
    }

    // Read registered users
    let storedUsers;

    try {
      storedUsers = JSON.parse(
        localStorage.getItem('globalhire_users') || '[]'
      );

      if (!Array.isArray(storedUsers)) {
        storedUsers = [];
      }
    } catch {
      storedUsers = [];
    }

    if (activeMode === 'signup') {
      if (!form.name.trim()) {
        setError('Please enter your full name.');
        return;
      }

      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }

      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }

      if (email === ADMIN_EMAIL) {
        setError('This email is reserved for administrator access.');
        return;
      }

      const existingUser = storedUsers.find(
        (user) => user.email?.toLowerCase() === email
      );

      if (existingUser) {
        setError('An account with this email already exists.');
        return;
      }

      const newUser = {
        id: `user-${Date.now()}`,
        name: form.name.trim(),
        email,
        password,
        role: form.role,
      };

      const updatedUsers = [...storedUsers, newUser];

      localStorage.setItem(
        'globalhire_users',
        JSON.stringify(updatedUsers)
      );

      const sessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      };

      localStorage.setItem(
        'globalhire_current_user',
        JSON.stringify(sessionUser)
      );

      onSuccess?.(sessionUser);
      onClose?.();
      return;
    }

    // Normal user login
    const matchedUser = storedUsers.find(
      (user) =>
        user.email?.toLowerCase() === email &&
        user.password === password
    );

    if (!matchedUser) {
      setError('Invalid email or password. Please try again.');
      return;
    }

    const sessionUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
    };

    localStorage.setItem(
      'globalhire_current_user',
      JSON.stringify(sessionUser)
    );

    onSuccess?.(sessionUser);
    onClose?.();
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="auth-heading">
          <div className="auth-logo">
            <BriefcaseBusiness size={25} />
          </div>

          <h2>
            {activeMode === 'login'
              ? 'Welcome back'
              : 'Create your account'}
          </h2>

          <p>
            {activeMode === 'login'
              ? 'Sign in to continue your GlobalHire journey.'
              : 'Join GlobalHire and discover new opportunities.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={activeMode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Login
          </button>

          <button
            type="button"
            className={activeMode === 'signup' ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {activeMode === 'signup' && (
            <>
              <label>Full Name</label>
              <div className="auth-input-wrap">
                <UserRound size={18} />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                />
              </div>

              <label>I am joining as</label>
              <select
                value={form.role}
                onChange={(event) =>
                  updateField('role', event.target.value)
                }
              >
                <option value="Candidate">Candidate</option>
                <option value="Employer">Employer</option>
                <option value="Recruiter">Recruiter</option>
              </select>
            </>
          )}

          <label>Email Address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(event) =>
                updateField('email', event.target.value)
              }
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) =>
                updateField('password', event.target.value)
              }
              required
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          {activeMode === 'login' && (
            <div className="admin-demo-hint">
              <ShieldCheck size={20} />
              <div>
                <strong>Admin Demo Access</strong>
                <p>Email: {ADMIN_EMAIL}</p>
                <p>Password: {ADMIN_PASSWORD}</p>
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit-btn">
            {activeMode === 'login' ? 'Login to Account' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch-text">
          {activeMode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}

          <button
            type="button"
            onClick={() =>
              switchMode(activeMode === 'login' ? 'signup' : 'login')
            }
          >
            {activeMode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
