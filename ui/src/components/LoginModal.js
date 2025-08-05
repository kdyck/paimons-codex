import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      // Mock sign up
      onLogin({
        name: formData.username,
        email: formData.email,
        avatar: '👤'
      });
    } else {
      // Mock login
      onLogin({
        name: formData.email.split('@')[0] || 'User',
        email: formData.email,
        avatar: '👤'
      });
    }
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isSignUp ? '📚 Join Paimon\'s Codex' : '🚪 Welcome Back'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={styles.input}
                placeholder="Choose a username"
                required
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={styles.input}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button type="submit" style={styles.submitButton}>
            {isSignUp ? '🚀 Create Account' : '🚪 Sign In'}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <div style={styles.socialButtons}>
            <button type="button" style={styles.socialButton}>
              🔍 Continue with Google
            </button>
            <button type="button" style={styles.socialButton}>
              📘 Continue with Facebook
            </button>
          </div>

          <div style={styles.switchMode}>
            <span style={styles.switchText}>
              {isSignUp ? 'Already have an account?' : 'New to Paimon\'s Codex?'}
            </span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={styles.switchButton}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    width: '90%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem 1rem 2rem',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'background 0.2s ease',
  },
  form: {
    padding: '2rem',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#333',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.8)',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    marginBottom: '1rem',
  },
  divider: {
    textAlign: 'center',
    margin: '1.5rem 0',
    position: 'relative',
  },
  dividerText: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '0 1rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  socialButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  socialButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.05)',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  switchMode: {
    textAlign: 'center',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
    paddingTop: '1.5rem',
  },
  switchText: {
    color: '#666',
    fontSize: '0.9rem',
    marginRight: '0.5rem',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default LoginModal;