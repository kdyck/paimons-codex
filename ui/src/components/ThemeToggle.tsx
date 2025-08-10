import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const ToggleContainer = styled.button<{ $isDark: boolean }>`
  background: ${props => props.$isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.2)'};
  backdrop-filter: blur(15px);
  border: 2px solid ${props => props.$isDark ? 'rgba(248, 250, 252, 0.3)' : 'rgba(251, 191, 36, 0.6)'};
  border-radius: 50px;
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
  border-radius: 50%;
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
        {isDark ? '🌙' : '☀️'}
      </ToggleSlider>
    </ToggleContainer>
  );
};

export default ThemeToggle;