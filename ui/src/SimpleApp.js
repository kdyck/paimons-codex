import React, { useState, useEffect } from 'react';

function SimpleApp() {
  const [manhwa, setManhwa] = useState([]);
  const [filteredManhwa, setFilteredManhwa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('trending');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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

  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearchQuery(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredManhwa(manhwa);
      return;
    }
    
    const filtered = manhwa.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredManhwa(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredManhwa(manhwa);
  };

  const getSectionTitle = () => {
    switch(activeSection) {
      case 'trending': return '🔥 Trending Manhwa';
      case 'history': return '📖 My Reading History';
      case 'updates': return '🔔 Latest Updates';
      case 'library': return '📚 My Library';
      default: return '🔥 Trending Manhwa';
    }
  };

  const getSectionContent = () => {
    if (searchQuery) return filteredManhwa;
    
    switch(activeSection) {
      case 'trending': return filteredManhwa;
      case 'history': return []; // Would load from history API
      case 'updates': return []; // Would load from updates API  
      case 'library': return []; // Would load from library API
      default: return filteredManhwa;
    }
  };

  if (loading) {
    return (
      <div style={{...styles.container, ...(isDarkMode ? styles.containerDark : {})}}>
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}>📱</div>
          <h2>Loading Webtoons...</h2>
          <p>Discovering amazing stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, ...(isDarkMode ? styles.containerDark : {})}}>
      {/* Header */}
      <header style={{...styles.header, ...(isDarkMode ? styles.headerDark : {})}}>
        <div style={styles.headerContent}>
          {/* Mobile Hamburger */}
          {isMobile && (
            <button 
              onClick={toggleMenu}
              style={{...styles.hamburger, ...(isDarkMode ? styles.hamburgerDark : {})}}
              aria-label="Menu"
            >
            <span style={{
              ...styles.hamburgerLine, 
              ...(isDarkMode ? styles.hamburgerLineDark : {}),
              ...(isMenuOpen ? styles.hamburgerLineOpen1 : {})
            }}></span>
            <span style={{
              ...styles.hamburgerLine, 
              ...(isDarkMode ? styles.hamburgerLineDark : {}),
              ...(isMenuOpen ? styles.hamburgerLineOpen2 : {})
            }}></span>
            <span style={{
              ...styles.hamburgerLine, 
              ...(isDarkMode ? styles.hamburgerLineDark : {}),
              ...(isMenuOpen ? styles.hamburgerLineOpen3 : {})
            }}></span>
            </button>
          )}
          
          <h1 style={{...styles.logo, ...(isDarkMode ? styles.logoDark : {})}}>
            📚 Paimon's Codex
          </h1>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav style={styles.desktopNav}>
            <a 
              href="#" 
              onClick={() => setActiveSection('trending')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'trending' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
            >
              🔥 Trending
            </a>
            <a 
              href="#" 
              onClick={() => setActiveSection('history')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'history' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
            >
              📖 My History
            </a>
            <a 
              href="#" 
              onClick={() => setActiveSection('updates')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'updates' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
            >
              🔔 My Updates
            </a>
            <a 
              href="#" 
              onClick={() => setActiveSection('library')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'library' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
            >
              📚 Library
            </a>
            </nav>
          )}
          
          <button 
            onClick={toggleTheme}
            style={{...styles.themeToggle, ...(isDarkMode ? styles.themeToggleDark : {})}}
            aria-label="Toggle theme"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
        
        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search manhwa..."
              value={searchQuery}
              onChange={handleSearch}
              style={{...styles.searchInput, ...(isDarkMode ? styles.searchInputDark : {})}}
            />
            {searchQuery && (
              <button 
                onClick={clearSearch} 
                style={{...styles.clearButton, ...(isDarkMode ? styles.clearButtonDark : {})}}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {isMobile && (
        <div 
          style={{
            ...styles.mobileMenu, 
            ...(isMenuOpen ? styles.mobileMenuOpen : {}),
            ...(isDarkMode ? styles.mobileMenuDark : {})
          }}
          onClick={toggleMenu}
        >
        <div 
          style={{
            ...styles.menuContent,
            ...(isDarkMode ? styles.menuContentDark : {}),
            transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          }} 
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.menuHeader}>
            <h3 style={{...styles.menuTitle, ...(isDarkMode ? styles.menuTitleDark : {})}}>Menu</h3>
            <button onClick={toggleMenu} style={styles.closeButton}>✕</button>
          </div>
          <nav style={styles.menuNav}>
            <a 
              href="#" 
              onClick={() => {setActiveSection('trending'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
            >
              🔥 Trending
            </a>
            <a 
              href="#" 
              onClick={() => {setActiveSection('history'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
            >
              📖 My History
            </a>
            <a 
              href="#" 
              onClick={() => {setActiveSection('updates'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
            >
              🔔 My Updates
            </a>
            <a 
              href="#" 
              onClick={() => {setActiveSection('library'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
            >
              📚 Library
            </a>
            <a href="#" style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}>⭐ Favorites</a>
            <a href="#" style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}>👤 Profile</a>
            <a href="#" style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}>⚙️ Settings</a>
          </nav>
        </div>
        </div>
      )}

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.sectionHeader}>
          <h2 style={{...styles.sectionTitle, ...(isDarkMode ? styles.sectionTitleDark : {})}}>
            {searchQuery ? `🔍 "${searchQuery}" (${filteredManhwa.length})` : getSectionTitle()}
          </h2>
        </div>

        {getSectionContent().length === 0 ? (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>
              {activeSection === 'history' ? '📖' : 
               activeSection === 'updates' ? '🔔' : 
               activeSection === 'library' ? '📚' : '😔'}
            </div>
            <h3 style={{...styles.noResultsTitle, ...(isDarkMode ? styles.noResultsTitleDark : {})}}>
              {activeSection === 'history' ? 'No reading history yet' :
               activeSection === 'updates' ? 'No new updates' :
               activeSection === 'library' ? 'Your library is empty' :
               searchQuery ? 'No manhwa found' : 'No content available'}
            </h3>
            <p style={{...styles.noResultsText, ...(isDarkMode ? styles.noResultsTextDark : {})}}>
              {activeSection === 'history' ? 'Start reading some manhwa to build your history' :
               activeSection === 'updates' ? 'Check back later for new chapters' :
               activeSection === 'library' ? 'Add manhwa to your library to keep track' :
               searchQuery ? 'Try different keywords or browse our collection' : 'Content will appear here'}
            </p>
            {searchQuery && (
              <button onClick={clearSearch} style={styles.browseButton}>
                Browse All
              </button>
            )}
          </div>
        ) : (
          <div style={styles.webtoonGrid}>
            {getSectionContent().map((item, index) => (
              <div 
                key={index} 
                style={{...styles.webtoonCard, ...(isDarkMode ? styles.webtoonCardDark : {})}}
                onClick={() => console.log('Open webtoon:', item.title)}
              >
                <div style={styles.cardImageContainer}>
                  <div style={styles.cardImage}>
                    <div style={styles.imagePlaceholder}>📱</div>
                  </div>
                  <div style={styles.statusBadge}>
                    {item.status === 'completed' ? '✅' : '🔄'}
                  </div>
                </div>
                
                <div style={styles.cardInfo}>
                  <h3 style={{...styles.cardTitle, ...(isDarkMode ? styles.cardTitleDark : {})}}>
                    {item.title}
                  </h3>
                  <p style={{...styles.cardAuthor, ...(isDarkMode ? styles.cardAuthorDark : {})}}>
                    {item.author}
                  </p>
                  <div style={styles.genreContainer}>
                    {item.genre.slice(0, 2).map((g, i) => (
                      <span key={i} style={{...styles.genreBadge, ...(isDarkMode ? styles.genreBadgeDark : {})}}>
                        {g}
                      </span>
                    ))}
                    {item.genre.length > 2 && (
                      <span style={{...styles.genreBadge, ...(isDarkMode ? styles.genreBadgeDark : {})}}>
                        +{item.genre.length - 2}
                      </span>
                    )}
                  </div>
                  <div style={styles.cardFooter}>
                    <div style={styles.rating}>
                      <span style={styles.stars}>⭐</span>
                      <span style={{...styles.ratingText, ...(isDarkMode ? styles.ratingTextDark : {})}}>4.8</span>
                    </div>
                    <span style={{...styles.chapterCount, ...(isDarkMode ? styles.chapterCountDark : {})}}>
                      120 Ch.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  // Base Container
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
    overflow: 'hidden',
  },
  containerDark: {
    background: 'linear-gradient(135deg, #1e293b 0%, #374151 100%)',
    color: '#f9fafb',
  },
  
  // Header
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(203, 213, 225, 0.6)',
    padding: '0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  headerDark: {
    background: 'rgba(30, 41, 59, 0.95)',
    borderBottom: '1px solid rgba(75, 85, 99, 0.6)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    height: '56px',
  },
  
  // Hamburger Menu
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
  },
  hamburgerDark: {
    color: '#f1f5f9',
  },
  hamburgerLine: {
    width: '20px',
    height: '2px',
    background: '#374151',
    margin: '2px 0',
    transition: 'all 0.3s ease',
    transformOrigin: 'center',
  },
  hamburgerLineDark: {
    background: '#e5e7eb',
  },
  hamburgerLineOpen1: {
    transform: 'rotate(45deg) translateY(6px)',
  },
  hamburgerLineOpen2: {
    opacity: 0,
  },
  hamburgerLineOpen3: {
    transform: 'rotate(-45deg) translateY(-6px)',
  },
  
  // Logo
  logo: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
    flex: 1,
    textAlign: 'center',
    color: '#111827',
    '@media (min-width: 768px)': {
      textAlign: 'left',
      flex: 'none',
      marginRight: '2rem',
    },
  },
  logoDark: {
    color: '#f9fafb',
  },
  
  // Desktop Navigation
  desktopNav: {
    display: 'flex',
    gap: '0',
    alignItems: 'center',
  },
  navItem: {
    padding: '8px 16px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  navItemDark: {
    color: '#d1d5db',
  },
  navItemActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#4f46e5',
    fontWeight: '600',
  },
  
  // Theme Toggle
  themeToggle: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease',
  },
  themeToggleDark: {
    background: 'rgba(15, 23, 42, 0.5)',
  },
  
  // Search Container
  searchContainer: {
    padding: '0 16px 12px 16px',
    display: 'flex',
    justifyContent: 'center',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px', // Constrain width on desktop
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '40px',
    border: '1px solid rgba(209, 213, 219, 0.8)',
    borderRadius: '25px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#111827',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  searchInputDark: {
    background: 'rgba(55, 65, 81, 0.9)',
    color: '#f9fafb',
    border: '1px solid rgba(75, 85, 99, 0.8)',
  },
  clearButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
  clearButtonDark: {
    color: '#94a3b8',
  },
  
  // Mobile Menu
  mobileMenu: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease',
  },
  mobileMenuOpen: {
    opacity: 1,
    visibility: 'visible',
  },
  mobileMenuDark: {
    background: 'rgba(0, 0, 0, 0.8)',
  },
  menuContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '280px',
    height: '100%',
    background: 'rgba(248, 250, 252, 0.95)',
    backdropFilter: 'blur(20px)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    padding: '20px',
    boxSizing: 'border-box',
    borderRight: '1px solid rgba(226, 232, 240, 0.8)',
  },
  menuContentDark: {
    background: 'rgba(15, 23, 42, 0.95)',
    borderRight: '1px solid rgba(51, 65, 85, 0.8)',
  },
  mobileMenuOpen: {
    opacity: 1,
    visibility: 'visible',
  },
  menuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  },
  menuTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
  },
  menuTitleDark: {
    color: '#f9fafb',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px',
  },
  menuNav: {
    display: 'flex',
    flexDirection: 'column',
  },
  menuItem: {
    display: 'block',
    padding: '15px 0',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'color 0.3s ease',
    cursor: 'pointer',
  },
  menuItemDark: {
    color: '#e5e7eb',
    borderBottom: '1px solid rgba(229, 231, 235, 0.1)',
  },
  
  // Main Content
  main: {
    padding: '20px 16px',
    paddingBottom: '80px',
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto',
  },
  
  // Section Header
  sectionHeader: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0',
    color: '#111827',
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  
  // Loading
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
  },
  loadingSpinner: {
    fontSize: '48px',
    marginBottom: '20px',
    animation: 'spin 2s linear infinite',
  },
  
  // No Results
  noResults: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  noResultsIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  noResultsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#111827',
  },
  noResultsTitleDark: {
    color: '#f9fafb',
  },
  noResultsText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  noResultsTextDark: {
    color: '#d1d5db',
  },
  browseButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '25px',
    padding: '12px 24px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  
  // Webtoon Grid
  webtoonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
    },
  },
  
  // Webtoon Card
  webtoonCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(209, 213, 219, 0.4)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  webtoonCardDark: {
    background: 'rgba(55, 65, 81, 0.8)',
    border: '1px solid rgba(75, 85, 99, 0.4)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  
  // Card Image Container
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    paddingBottom: '140%', // 5:7 aspect ratio for webtoon covers
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  imagePlaceholder: {
    fontSize: '32px',
    opacity: 0.6,
  },
  statusBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    fontSize: '12px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '12px',
    padding: '4px 8px',
  },
  
  // Card Info
  cardInfo: {
    padding: '12px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#111827',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardTitleDark: {
    color: '#f9fafb',
  },
  cardAuthor: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 8px 0',
    fontStyle: 'italic',
  },
  cardAuthorDark: {
    color: '#d1d5db',
  },
  
  // Genre Container
  genreContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '8px',
  },
  genreBadge: {
    background: 'rgba(209, 213, 219, 0.6)',
    color: '#374151',
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: '500',
  },
  genreBadgeDark: {
    background: 'rgba(75, 85, 99, 0.6)',
    color: '#e5e7eb',
  },
  
  // Card Footer
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  stars: {
    fontSize: '10px',
  },
  ratingText: {
    fontWeight: '600',
    color: '#374151',
  },
  ratingTextDark: {
    color: '#e5e7eb',
  },
  chapterCount: {
    color: '#6b7280',
    fontWeight: '500',
  },
  chapterCountDark: {
    color: '#9ca3af',
  },
};

export default SimpleApp;