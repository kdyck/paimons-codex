import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ThemeToggle from './ThemeToggle';

const HeaderContainer = styled.header`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
`;

const TopRow = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
  }
`;

const BottomRow = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
`;

const Logo = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  cursor: pointer;
  font-size: 1.8rem;
  font-weight: bold;
  transition: all 0.3s ease;
  background: linear-gradient(45deg, #f093fb, #f5576c, #4facfe, #00f2fe);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 3s ease infinite;
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  &:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const Navigation = styled.nav<{ $isOpen?: boolean }>`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${props => props.theme.colors.glass.background};
    backdrop-filter: ${props => props.theme.colors.glass.backdrop};
    flex-direction: column;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    gap: 1rem;
  }
`;

const NavLink = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
    transition: left 0.3s ease;
    z-index: -1;
  }
  
  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    transform: translateY(-1px);
    text-shadow: 0 0 8px rgba(102, 126, 234, 0.4);
    
    &::before {
      left: 0;
    }
  }
  
  &.active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
    font-weight: 600;
    text-shadow: 0 0 6px rgba(102, 126, 234, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    width: 100%;
    text-align: center;
  }
`;

const RightSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.5rem;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileTopLeft = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
`;

const ProfileIcon = styled.button`
  background: ${props => props.theme.colors.glass.background};
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;
  
  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
`;

const SearchSection = styled.div`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
`;

const SearchInputContainer = styled.div`
  position: relative;
  flex: 0 1 70%;
  min-width: 200px;
`;

const ClearSearchButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0;
  transition: all 0.3s ease;
  
  ${SearchInputContainer}:hover & {
    opacity: 1;
  }
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }
  
  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.background};
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
  }
`;

const SearchButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #764ba2, #f093fb);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
`;

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  console.log('Header rendering');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <HeaderContainer>
      {/* Desktop Layout */}
      <LeftSection>
        <Logo onClick={() => navigate('/')}>
          Paimon's Codex
        </Logo>
      </LeftSection>
      
      <Navigation $isOpen={isMenuOpen}>
        <NavLink onClick={() => { navigate('/'); setIsMenuOpen(false); }}>
          Home
        </NavLink>
        <NavLink onClick={() => { navigate('/library'); setIsMenuOpen(false); }}>
          Library
        </NavLink>
        <NavLink onClick={() => { navigate('/favorites'); setIsMenuOpen(false); }}>
          Favorites
        </NavLink>
        <NavLink onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}>
          Admin
        </NavLink>
      </Navigation>
      
      <RightSection>
        <SearchSection>
          <SearchContainer>
            <SearchInputContainer>
              <SearchInput
                type="text"
                placeholder="Search manhwa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {searchQuery && (
                <ClearSearchButton onClick={handleClearSearch}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </ClearSearchButton>
              )}
            </SearchInputContainer>
            <SearchButton onClick={handleSearch}>
              Search
            </SearchButton>
          </SearchContainer>
        </SearchSection>
        <ProfileIcon onClick={() => navigate('/profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </ProfileIcon>
        <ThemeToggle />
      </RightSection>

      {/* Mobile Layout */}
      <TopRow>
        <MobileTopLeft>
          <MobileMenuButton onClick={toggleMenu}>
            {isMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </MobileMenuButton>
          <Logo onClick={() => navigate('/')}>
            Paimon's Codex
          </Logo>
        </MobileTopLeft>
      </TopRow>
      
      <BottomRow>
        <ProfileIcon onClick={() => navigate('/profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </ProfileIcon>
        <ThemeToggle />
      </BottomRow>
    </HeaderContainer>
  );
};

export default Header;