import React, { useState, useEffect } from 'react';

function SimpleApp() {
  const [manhwa, setManhwa] = useState([]);
  const [filteredManhwa, setFilteredManhwa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('trending');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
        setIsProfileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

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
      case 'trending': return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
          </svg>
          Trending 
        </span>
      );
      case 'history': return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          My Reading History
        </span>
      );
      case 'updates': return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          Latest Updates
        </span>
      );
      case 'library': return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          My Library
        </span>
      );
      case 'favorites': return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
          </svg>
          My Favorites
        </span>
      );
      case 'settings': return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m6-12h-6m-6 0h6"/>
          </svg>
          Settings
        </span>
      );
      default: return (
        <span>
          <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
          </svg>
          Trending 
        </span>
      );
    }
  };

  const getSectionContent = () => {
    if (searchQuery) return filteredManhwa;
    
    switch(activeSection) {
      case 'trending': return filteredManhwa;
      case 'history': return []; // Would load from history API
      case 'updates': return []; // Would load from updates API  
      case 'library': return []; // Would load from library API
      case 'favorites': return []; // Would load from favorites API
      case 'settings': return []; // Settings page content
      default: return filteredManhwa;
    }
  };

  if (loading) {
    return (
      <div style={{...styles.container, ...(isDarkMode ? styles.containerDark : {})}}>
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}>
            <svg style={{width: '48px', height: '48px', animation: 'spin 2s linear infinite'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Loading webtoons">
              <circle cx="12" cy="12" r="10"/>
              <path d="M14,2 A10,10 0 0,1 22,12"/>
            </svg>
          </div>
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
          
          <h1 
            style={{
              ...styles.logo, 
              ...(!isMobile ? styles.logoDesktop : {}),
              ...(isDarkMode ? styles.logoDark : {}),
              cursor: 'pointer'
            }}
            onClick={() => {
              setActiveSection('trending');
              setSearchQuery('');
              setFilteredManhwa(manhwa);
              setIsMenuOpen(false);
            }}
            title="Go to home"
          >
            <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Paimon's Codex
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
              title="Trending"
            >
              <svg style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
              </svg>
              Trending
            </a>
            <a 
              href="#" 
              onClick={() => setActiveSection('history')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'history' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
              title="My reading history"
            >
              <svg style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              History
            </a>
            <a 
              href="#" 
              onClick={() => setActiveSection('updates')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'updates' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
              title="Latest updates"
            >
              <svg style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              Updates
            </a>
            <a 
              href="#" 
              onClick={() => setActiveSection('library')}
              style={{
                ...styles.navItem, 
                ...(activeSection === 'library' ? styles.navItemActive : {}),
                ...(isDarkMode ? styles.navItemDark : {})
              }}
              title="My library"
            >
              <svg style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Library
            </a>
            </nav>
          )}
          
          {/* Desktop Right Controls */}
          {!isMobile && (
            <div style={styles.rightControls}>
              <div style={styles.profileMenuContainer} className="profile-menu-container">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{...styles.profileButton, ...(isDarkMode ? styles.profileButtonDark : {})}}
                  aria-label="Profile menu"
                  title="Profile menu"
                >
                  <svg style={{width: '16px', height: '16px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <svg style={{width: '12px', height: '12px', marginLeft: '4px', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </button>
                
                {isProfileMenuOpen && (
                  <div style={{...styles.profileDropdown, ...(isDarkMode ? styles.profileDropdownDark : {})}}>
                    <a 
                      href="#" 
                      onClick={() => {setActiveSection('favorites'); setIsProfileMenuOpen(false);}}
                      style={{...styles.profileMenuItem, ...(isDarkMode ? styles.profileMenuItemDark : {})}}
                      title="My favorites"
                    >
                      <svg style={{width: '16px', height: '16px', marginRight: '8px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                      </svg>
                      Favorites
                    </a>
                    <a 
                      href="#" 
                      onClick={() => {setActiveSection('settings'); setIsProfileMenuOpen(false);}}
                      style={{...styles.profileMenuItem, ...(isDarkMode ? styles.profileMenuItemDark : {})}}
                      title="Settings"
                    >
                      <svg style={{width: '16px', height: '16px', marginRight: '8px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m6-12h-6m-6 0h6"/>
                      </svg>
                      Settings
                    </a>
                    <div style={styles.profileMenuDivider}></div>
                    <a 
                      href="#" 
                      style={{...styles.profileMenuItem, ...(isDarkMode ? styles.profileMenuItemDark : {})}}
                      title="Sign out"
                    >
                      <svg style={{width: '16px', height: '16px', marginRight: '8px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign Out
                    </a>
                  </div>
                )}
              </div>
              
              <button 
                onClick={toggleTheme}
                style={{...styles.themeToggle, ...(isDarkMode ? styles.themeToggleDark : {})}}
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? (
                  <svg style={{width: '16px', height: '16px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg style={{width: '16px', height: '16px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search codex..."
              value={searchQuery}
              onChange={handleSearch}
              style={{...styles.searchInput, ...(isDarkMode ? styles.searchInputDark : {})}}
            />
            {searchQuery && (
              <button 
                onClick={clearSearch} 
                style={{...styles.clearButton, ...(isDarkMode ? styles.clearButtonDark : {})}}
              >
                <svg style={{width: '14px', height: '14px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
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
            <button onClick={toggleMenu} style={styles.closeButton} aria-label="Close menu">
              <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <nav style={styles.menuNav}>
            <a 
              href="#" 
              onClick={() => {setActiveSection('trending'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="Trending"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
              </svg>
              Trending
            </a>
            <a 
              href="#" 
              onClick={() => {setActiveSection('history'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="My reading history"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              History
            </a>
            <a 
              href="#" 
              onClick={() => {setActiveSection('updates'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="Latest updates"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              Updates
            </a>
            <a 
              href="#" 
              onClick={() => {setActiveSection('library'); toggleMenu();}}
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="My library"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Library
            </a>
            <a 
              href="#" 
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="My favorites"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
              </svg>
              Favorites
            </a>
            <a 
              href="#" 
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="My profile"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </a>
            <a 
              href="#" 
              style={{...styles.menuItem, ...(isDarkMode ? styles.menuItemDark : {})}}
              title="Settings"
            >
              <svg style={{width: '18px', height: '18px', marginRight: '12px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m6-12h-6m-6 0h6"/>
              </svg>
              Settings
            </a>
          </nav>
        </div>
        </div>
      )}

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.sectionHeader}>
          <h2 style={{...styles.sectionTitle, ...(isDarkMode ? styles.sectionTitleDark : {})}}>
            {searchQuery ? (
              <span>
                <svg style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                "{searchQuery}" ({filteredManhwa.length})
              </span>
            ) : getSectionTitle()}
          </h2>
        </div>

        {getSectionContent().length === 0 ? (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>
              {activeSection === 'history' ? (
                <svg style={{width: '48px', height: '48px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No reading history">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              ) : activeSection === 'updates' ? (
                <svg style={{width: '48px', height: '48px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No updates">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
              ) : activeSection === 'library' ? (
                <svg style={{width: '48px', height: '48px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Empty library">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              ) : activeSection === 'favorites' ? (
                <svg style={{width: '48px', height: '48px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No favorites">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                </svg>
              ) : activeSection === 'settings' ? (
                <svg style={{width: '48px', height: '48px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Settings">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m6-12h-6m-6 0h6"/>
                </svg>
              ) : (
                <svg style={{width: '48px', height: '48px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="No results found">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
              )}
            </div>
            <h3 style={{...styles.noResultsTitle, ...(isDarkMode ? styles.noResultsTitleDark : {})}}>
              {activeSection === 'history' ? 'No reading history yet' :
               activeSection === 'updates' ? 'No new updates' :
               activeSection === 'library' ? 'Your library is empty' :
               activeSection === 'favorites' ? 'No favorites yet' :
               activeSection === 'settings' ? 'Settings' :
               searchQuery ? 'No manhwa found' : 'No content available'}
            </h3>
            <p style={{...styles.noResultsText, ...(isDarkMode ? styles.noResultsTextDark : {})}}>
              {activeSection === 'history' ? 'Start reading some manhwa to build your history' :
               activeSection === 'updates' ? 'Check back later for new chapters' :
               activeSection === 'library' ? 'Add manhwa to your library to keep track' :
               activeSection === 'favorites' ? 'Heart manhwa you love to see them here' :
               activeSection === 'settings' ? 'Customize your reading experience' :
               searchQuery ? 'Try different keywords or browse our collection' : 'Content will appear here'}
            </p>
            {searchQuery && (
              <button onClick={clearSearch} style={styles.browseButton}>
                Browse All
              </button>
            )}
          </div>
        ) : (
          <div style={{
            ...styles.webtoonGrid,
            ...(!isMobile ? styles.webtoonGridDesktop : {})
          }}>
            {getSectionContent().map((item, index) => (
              <div 
                key={index} 
                style={{...styles.webtoonCard, ...(isDarkMode ? styles.webtoonCardDark : {})}}
                onClick={() => console.log('Open webtoon:', item.title)}
              >
                <div style={styles.cardImageContainer}>
                  <div style={styles.cardImage}>
                    <div style={styles.imagePlaceholder}>
                      <svg style={{width: '32px', height: '32px', opacity: '0.6'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Cover image placeholder">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                      </svg>
                    </div>
                  </div>
                  <div style={styles.statusBadge}>
                    {item.status === 'completed' ? (
                      <svg style={{width: '12px', height: '12px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Completed" title="Completed">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    ) : (
                      <svg style={{width: '12px', height: '12px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Ongoing" title="Ongoing">
                        <polyline points="23,4 23,10 17,10"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"/>
                      </svg>
                    )}
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
                      <svg style={{width: '12px', height: '12px'}} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" aria-label="Rating" aria-hidden="true">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                      </svg>
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

      {/* Footer */}
      <footer style={{...styles.footer, ...(isDarkMode ? styles.footerDark : {})}}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h4 style={{...styles.footerSectionTitle, ...(isDarkMode ? styles.footerSectionTitleDark : {})}}>
              <svg style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Paimon's Codex
            </h4>
            <p style={{...styles.footerText, ...(isDarkMode ? styles.footerTextDark : {})}}>
              Your ultimate destination for discovering and reading amazing manhwa stories.
            </p>
          </div>
          
          <div style={styles.footerSection}>
            <h5 style={{...styles.footerSubtitle, ...(isDarkMode ? styles.footerSubtitleDark : {})}}>Quick Links</h5>
            <div style={styles.footerLinks}>
              <a href="#" onClick={() => setActiveSection('trending')} style={{...styles.footerLink, ...(isDarkMode ? styles.footerLinkDark : {})}}>
                Trending
              </a>
              <a href="#" onClick={() => setActiveSection('history')} style={{...styles.footerLink, ...(isDarkMode ? styles.footerLinkDark : {})}}>
                My History
              </a>
              <a href="#" onClick={() => setActiveSection('library')} style={{...styles.footerLink, ...(isDarkMode ? styles.footerLinkDark : {})}}>
                My Library
              </a>
            </div>
          </div>
          
          <div style={styles.footerSection}>
            <h5 style={{...styles.footerSubtitle, ...(isDarkMode ? styles.footerSubtitleDark : {})}}>Community</h5>
            <div style={styles.footerLinks}>
              <a href="#" style={{...styles.footerLink, ...(isDarkMode ? styles.footerLinkDark : {})}}>
                <svg style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                GitHub
              </a>
              <a href="#" style={{...styles.footerLink, ...(isDarkMode ? styles.footerLinkDark : {})}}>
                <svg style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
                Twitter
              </a>
              <a href="#" style={{...styles.footerLink, ...(isDarkMode ? styles.footerLinkDark : {})}}>
                <svg style={{width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
                Discord
              </a>
            </div>
          </div>
        </div>
        
        <div style={styles.footerBottom}>
          <div style={styles.footerBottomContent}>
            <p style={{...styles.footerCopyright, ...(isDarkMode ? styles.footerCopyrightDark : {})}}>
              © 2024 Paimon's Codex. All rights reserved.
            </p>
            <div style={styles.footerBottomLinks}>
              <a href="#" style={{...styles.footerBottomLink, ...(isDarkMode ? styles.footerBottomLinkDark : {})}}>Privacy</a>
              <span style={{...styles.footerDivider, ...(isDarkMode ? styles.footerDividerDark : {})}}>•</span>
              <a href="#" style={{...styles.footerBottomLink, ...(isDarkMode ? styles.footerBottomLinkDark : {})}}>Terms</a>
              <span style={{...styles.footerDivider, ...(isDarkMode ? styles.footerDividerDark : {})}}>•</span>
              <a href="#" style={{...styles.footerBottomLink, ...(isDarkMode ? styles.footerBottomLinkDark : {})}}>Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  // Base Container
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  containerDark: {
    background: 'linear-gradient(135deg, #000000 0%, #1f2937 100%)',
    color: '#f9fafb',
  },
  
  // Header
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  headerDark: {
    background: 'rgba(17, 24, 39, 0.15)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    height: '56px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
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
    background: '#ffffff',
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
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
  },
  logoDesktop: {
    textAlign: 'left',
    flex: '0 0 auto',
    marginRight: '0',
  },
  logoDark: {
    color: '#f9fafb',
  },
  
  // Desktop Navigation
  desktopNav: {
    display: 'flex',
    gap: '0',
    alignItems: 'center',
    flex: '1',
    justifyContent: 'center',
    marginLeft: '2rem',
    marginRight: '2rem',
  },
  navItem: {
    padding: '8px 16px',
    color: 'rgba(255, 255, 255, 0.8)',
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
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Profile Menu
  profileMenuContainer: {
    position: 'relative',
    marginRight: '12px',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    flex: '0 0 auto',
  },
  profileButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  profileButtonDark: {
    background: 'rgba(15, 23, 42, 0.5)',
    color: '#d1d5db',
  },
  profileDropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '8px',
    background: 'rgba(248, 250, 252, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '8px',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '160px',
    zIndex: 1000,
  },
  profileDropdownDark: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(51, 65, 85, 0.8)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  profileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
    borderRadius: '6px',
    margin: '4px',
  },
  profileMenuItemDark: {
    color: '#e5e7eb',
  },
  profileMenuDivider: {
    height: '1px',
    background: 'rgba(226, 232, 240, 0.8)',
    margin: '4px 12px',
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
    alignItems: 'center',
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
    border: 'none',
    borderRadius: '25px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
    backdropFilter: 'blur(20px)',
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
    paddingBottom: '20px',
    minHeight: 'calc(100vh - 240px)',
    flex: '1',
  },
  
  // Section Header
  sectionHeader: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0',
    color: '#ffffff',
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
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
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
    color: '#ffffff',
  },
  noResultsTitleDark: {
    color: '#f9fafb',
  },
  noResultsText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
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
  },
  webtoonGridDesktop: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
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
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(75, 85, 99, 0.4)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
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
  
  // Footer
  footer: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    marginTop: '40px',
  },
  footerDark: {
    background: 'rgba(15, 23, 42, 0.1)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(75, 85, 99, 0.2)',
  },
  footerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    padding: '40px 20px 30px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  footerSectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
  },
  footerSectionTitleDark: {
    color: '#f9fafb',
  },
  footerText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: '1.5',
    margin: '0',
  },
  footerTextDark: {
    color: '#d1d5db',
  },
  footerSubtitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: '#ffffff',
  },
  footerSubtitleDark: {
    color: '#f9fafb',
  },
  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerLink: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  footerLinkDark: {
    color: '#9ca3af',
  },
  footerBottom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.1)',
  },
  footerBottomContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '16px',
  },
  footerCopyright: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0',
  },
  footerCopyrightDark: {
    color: '#6b7280',
  },
  footerBottomLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  footerBottomLink: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: 'pointer',
  },
  footerBottomLinkDark: {
    color: '#6b7280',
  },
  footerDivider: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '12px',
  },
  footerDividerDark: {
    color: '#4b5563',
  },
};

// Add CSS keyframes for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default SimpleApp;