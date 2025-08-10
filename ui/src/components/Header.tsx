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
`;

const Navigation = styled.nav`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const NavLink = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: ${props => props.theme.colors.glass.hover};
    transition: left 0.3s ease;
    z-index: -1;
  }
  
  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    transform: translateY(-1px);
    
    &::before {
      left: 0;
    }
  }
  
  &.active {
    background: ${props => props.theme.colors.glass.background};
    font-weight: 600;
  }
`;

const RightSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.background};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }
  
  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.hover};
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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
  const navigate = useNavigate();
  
  console.log('Header rendering');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <HeaderContainer>
      <Logo onClick={() => navigate('/')}>
        Paimon's Codex
      </Logo>
      <Navigation>
        <NavLink onClick={() => navigate('/')}>
          Home
        </NavLink>
        <NavLink onClick={() => navigate('/library')}>
          Library
        </NavLink>
        <NavLink onClick={() => navigate('/favorites')}>
          Favorites
        </NavLink>
        <NavLink onClick={() => navigate('/admin')}>
          Admin
        </NavLink>
      </Navigation>
      <RightSection>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search manhwa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <SearchButton onClick={handleSearch}>
            Search
          </SearchButton>
        </SearchContainer>
        <ThemeToggle />
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;