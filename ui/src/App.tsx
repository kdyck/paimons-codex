import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import AdminPage from './pages/AdminPage';
import ManhwaDetailPage from './pages/ManhwaDetailPage';
import Header from './components/Header';

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.backgroundGradient};
  transition: background 0.3s ease;
`;

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <StyledThemeProvider theme={theme}>
      <AppContainer>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/favorites" element={<LibraryPage favoritesOnly />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/manhwa/:id" element={<ManhwaDetailPage />} />
          </Routes>
        </Router>
      </AppContainer>
    </StyledThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
    </ThemeProvider>
  );
};

export default App;