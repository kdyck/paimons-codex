import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const ToggleContainer = styled.button<{ $isDark: boolean }>`
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.2)'};
  backdrop-filter: blur(15px);
  border: 2px solid ${props => props.$isDark ? 'rgba(248, 250, 252, 0.3)' : 'rgba(251, 191, 36, 0.6)'};
  border-radius: 0;
  padding: 0.3rem;
  width: 70px;
  height: 36px;
  cursor: pointer;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  box-shadow: 0 8px 32px ${props => props.$isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(251, 191, 36, 0.2)'};
  
  &:hover {
    background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.3)'};
    transform: scale(1.1);
    box-shadow: 0 12px 40px ${props => props.$isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(251, 191, 36, 0.3)'};
  }
`;

const ToggleSlider = styled.div<{ $isDark: boolean }>`
  background: ${props => props.$isDark ? 
    'linear-gradient(45deg, #f8fafc, #e2e8f0)' : 
    'linear-gradient(45deg, #fbbf24, #f59e0b)'};
  width: 28px;
  height: 28px;
  border-radius: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(${props => props.$isDark ? '30px' : '2px'});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 4px 12px ${props => props.$isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(251, 191, 36, 0.4)'};
  
  &:hover {
    transform: translateX(${props => props.$isDark ? '30px' : '2px'}) scale(1.1);
  }
`;

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  
  console.log('ThemeToggle rendering, isDark:', isDark);

  return (
    <ToggleContainer 
      $isDark={isDark} 
      onClick={toggleTheme} 
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <ToggleSlider $isDark={isDark}>
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        )}
      </ToggleSlider>
    </ToggleContainer>
  );
};

export default ThemeToggle;