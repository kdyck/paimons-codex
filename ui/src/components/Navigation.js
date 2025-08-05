import React, { useState } from 'react';

const Navigation = ({ onSearch, user, onLogin, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📚</span>
          <span style={styles.logoText}>Paimon's Codex</span>
        </div>

        {/* Navigation Links */}
        <div style={styles.navLinks}>
          <a href="#home" style={styles.navLink}>Home</a>
          <a href="#browse" style={styles.navLink}>Browse</a>
          <a href="#trending" style={styles.navLink}>Trending</a>
          <a href="#genres" style={styles.navLink}>Genres</a>
          <a href="#recommendations" style={styles.navLink}>For You</a>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search manhwa, authors, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>
              🔍
            </button>
          </div>
        </form>

        {/* User Account */}
        <div style={styles.userSection}>
          {user ? (
            <div style={styles.userMenu}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={styles.userButton}
              >
                <span style={styles.userAvatar}>
                  {user.avatar || '👤'}
                </span>
                <span style={styles.userName}>{user.name}</span>
                <span style={styles.dropdownArrow}>▼</span>
              </button>
              
              {showUserMenu && (
                <div style={styles.dropdown}>
                  <a href="#profile" style={styles.dropdownItem}>👤 Profile</a>
                  <a href="#library" style={styles.dropdownItem}>📚 My Library</a>
                  <a href="#favorites" style={styles.dropdownItem}>❤️ Favorites</a>
                  <a href="#reading-list" style={styles.dropdownItem}>📖 Reading List</a>
                  <div style={styles.divider}></div>
                  <a href="#settings" style={styles.dropdownItem}>⚙️ Settings</a>
                  <button onClick={onLogout} style={styles.logoutButton}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLogin} style={styles.loginButton}>
              🚪 Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(15px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '1rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '0 2rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ffffff',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  logoText: {
    background: 'linear-gradient(45deg, #ffffff, #e0e0ff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    flex: 1,
  },
  navLink: {
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  searchForm: {
    flex: '0 0 auto',
  },
  searchContainer: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '25px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  searchInput: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '1rem',
    width: '300px',
    outline: 'none',
  },
  searchButton: {
    background: 'rgba(255, 255, 255, 0.3)',
    border: 'none',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.3s ease',
  },
  userSection: {
    position: 'relative',
  },
  userMenu: {
    position: 'relative',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '25px',
    padding: '0.5rem 1rem',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  userAvatar: {
    fontSize: '1.2rem',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
  },
  userName: {
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: '0.7rem',
    transition: 'transform 0.3s ease',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(15px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    minWidth: '200px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  dropdownItem: {
    display: 'block',
    padding: '0.75rem 1rem',
    color: '#333',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background 0.2s ease',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  },
  divider: {
    height: '1px',
    background: 'rgba(0, 0, 0, 0.2)',
    margin: '0.5rem 0',
  },
  logoutButton: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    color: '#e74c3c',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s ease',
  },
  loginButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '25px',
    padding: '0.75rem 1.5rem',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default Navigation;