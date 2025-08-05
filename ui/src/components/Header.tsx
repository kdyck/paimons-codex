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
`;

const Logo = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  cursor: pointer;
  font-size: 1.8rem;
  font-weight: bold;
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
  border-radius: 25px;
  background: ${props => props.theme.colors.glass.background};
  color: ${props => props.theme.colors.text.primary};
  
  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }
  
  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.hover};
  }
`;

const SearchButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 25px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: background 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    opacity: 0.8;
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