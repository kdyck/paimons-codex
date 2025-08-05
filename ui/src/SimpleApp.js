import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LoginModal from './components/LoginModal';

function SimpleApp() {
  const [manhwa, setManhwa] = useState([]);
  const [filteredManhwa, setFilteredManhwa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    // Use the API service directly since nginx proxy has port issues
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/v1/manhwa/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setManhwa(data);
        setFilteredManhwa(data);
        setLoading(false);
      })
      .catch(error => {
        console.log('Error fetching manhwa:', error);
        setLoading(false);
      });
  }, []);

  const handleSearch = (searchTerm) => {
    const filtered = manhwa.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredManhwa(filtered);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}>📚</div>
          <h2>Loading amazing manhwa...</h2>
          <p>Discovering the best stories for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, ...(isDarkMode ? styles.containerDark : {})}}>
      <Navigation
        onSearch={handleSearch}
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />
      
      <button 
        onClick={toggleTheme}
        style={{...styles.themeToggle, ...(isDarkMode ? styles.themeToggleDark : {})}}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <div style={{...styles.toggleSlider, ...(isDarkMode ? styles.toggleSliderDark : {})}}>
          {isDarkMode ? '🌙' : '☀️'}
        </div>
      </button>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      <header style={styles.header}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>Discover Your Next Adventure</h1>
          <p style={styles.subtitle}>
            Explore thousands of manhwa stories from action-packed adventures to heartwarming romances
          </p>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{manhwa.length}</span>
              <span style={styles.statLabel}>Manhwa Available</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>1M+</span>
              <span style={styles.statLabel}>Happy Readers</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>50+</span>
              <span style={styles.statLabel}>Genres</span>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            {filteredManhwa.length === manhwa.length 
              ? '🔥 Trending Now' 
              : `🔍 Search Results (${filteredManhwa.length})`}
          </h2>
          {filteredManhwa.length !== manhwa.length && (
            <button 
              onClick={() => setFilteredManhwa(manhwa)}
              style={styles.clearSearchButton}
            >
              ✕ Clear Search
            </button>
          )}
        </div>

        {filteredManhwa.length === 0 ? (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>😔</div>
            <h3>No manhwa found</h3>
            <p>Try searching with different keywords or browse our full collection.</p>
            <button 
              onClick={() => setFilteredManhwa(manhwa)}
              style={styles.browseButton}
            >
              Browse All Manhwa
            </button>
          </div>
        ) : (
          <div style={styles.manhwaGrid}>
            {filteredManhwa.map((item, index) => (
              <div key={index} style={styles.manhwaCard}>
                <div style={styles.cardImage}>
                  <div style={styles.placeholder}>🎨</div>
                  <div style={styles.cardOverlay}>
                    <button style={styles.actionButton}>👁️ Read</button>
                    <button style={styles.actionButton}>❤️</button>
                    <button style={styles.actionButton}>📚</button>
                  </div>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.manhwaTitle}>{item.title}</h3>
                    <span style={styles.status}>{item.status}</span>
                  </div>
                  <p style={styles.author}>by {item.author}</p>
                  <div style={styles.genres}>
                    {item.genre.map((g, i) => (
                      <span key={i} style={styles.genreTag}>{g}</span>
                    ))}
                  </div>
                  <p style={styles.description}>{item.description}</p>
                  <div style={styles.cardFooter}>
                    <div style={styles.rating}>
                      <span style={styles.stars}>⭐⭐⭐⭐⭐</span>
                      <span style={styles.ratingText}>4.8</span>
                    </div>
                    <span style={styles.chapters}>120 chapters</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>
          <a href="/docs" style={styles.link}>API Documentation</a> | 
          <a href="/api/v1/manhwa/" style={styles.link}>Raw API Data</a>
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
  },
  header: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '3.5rem',
    margin: '0 0 1rem 0',
    fontWeight: '700',
    textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '1.3rem',
    margin: '0 0 3rem 0',
    opacity: 0.9,
    lineHeight: '1.6',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    flexWrap: 'wrap',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    display: 'block',
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#ffffff',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  statLabel: {
    fontSize: '0.9rem',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  main: {
    padding: '3rem 2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: '600',
    margin: 0,
  },
  clearSearchButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '20px',
    padding: '0.5rem 1rem',
    color: '#ffffff',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  loading: {
    textAlign: 'center',
    padding: '6rem 2rem',
  },
  loadingSpinner: {
    fontSize: '4rem',
    marginBottom: '2rem',
    animation: 'spin 2s linear infinite',
  },
  noResults: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },
  noResultsIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  browseButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '25px',
    padding: '1rem 2rem',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'all 0.3s ease',
  },
  manhwaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '2rem',
  },
  manhwaCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  cardImage: {
    position: 'relative',
    height: '200px',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    fontSize: '3rem',
    opacity: 0.5,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  actionButton: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'transform 0.2s ease',
  },
  cardContent: {
    padding: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  manhwaTitle: {
    fontSize: '1.4rem',
    margin: 0,
    fontWeight: '600',
    flex: 1,
  },
  status: {
    padding: '0.3rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500',
    background: 'rgba(255, 255, 255, 0.2)',
    marginLeft: '1rem',
  },
  author: {
    fontSize: '1rem',
    margin: '0 0 1rem 0',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  genres: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  genreTag: {
    padding: '0.3rem 0.8rem',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '15px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  description: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: '0 0 1rem 0',
    opacity: 0.9,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  stars: {
    fontSize: '0.8rem',
  },
  ratingText: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  chapters: {
    fontSize: '0.85rem',
    opacity: 0.7,
  },
  footer: {
    textAlign: 'center',
    padding: '2rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  link: {
    color: '#ffffff',
    textDecoration: 'none',
    margin: '0 1rem',
    fontWeight: '500',
    borderBottom: '1px solid transparent',
    transition: 'border-color 0.3s ease',
  },
  // Theme Toggle Styles
  themeToggle: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50px',
    padding: '8px',
    width: '70px',
    height: '36px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  themeToggleDark: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(241, 245, 249, 0.3)',
  },
  toggleSlider: {
    background: '#fbbf24',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    transform: 'translateX(0px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  toggleSliderDark: {
    background: '#f1f5f9',
    transform: 'translateX(32px)',
  },
  // Dark Theme Styles
  containerDark: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  },
};

export default SimpleApp;