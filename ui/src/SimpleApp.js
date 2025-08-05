import React, { useState, useEffect } from 'react';

function SimpleApp() {
  const [manhwa, setManhwa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/manhwa/')
      .then(response => response.json())
      .then(data => {
        setManhwa(data);
        setLoading(false);
      })
      .catch(error => {
        console.log('Error fetching manhwa:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <h2>Loading amazing manhwa...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>📚 Paimon's Codex</h1>
        <p style={styles.subtitle}>Discover Amazing Manhwa Adventures</p>
      </header>

      <main style={styles.main}>
        <div style={styles.manhwaGrid}>
          {manhwa.map((item, index) => (
            <div key={index} style={styles.manhwaCard}>
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
            </div>
          ))}
        </div>
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
    padding: '3rem 2rem',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 0.5rem 0',
    fontWeight: '700',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '1.2rem',
    margin: 0,
    opacity: 0.9,
  },
  main: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
  },
  manhwaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2rem',
  },
  manhwaCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
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
    margin: 0,
    opacity: 0.9,
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
};

export default SimpleApp;