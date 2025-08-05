import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';

const ToggleContainer = styled.button<{ $isDark: boolean }>`
  background: ${props => props.$isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.3)'};
  backdrop-filter: blur(10px);
  border: 2px solid ${props => props.$isDark ? '#f1f5f9' : '#fbbf24'};
  border-radius: 50px;
  padding: 0.5rem;
  width: 70px;
  height: 36px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    background: ${props => props.$isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.4)'};
    transform: scale(1.05);
  }
`;

const ToggleSlider = styled.div<{ $isDark: boolean }>`
  background: ${props => props.$isDark ? '#f1f5f9' : '#fbbf24'};
  width: 26px;
  height: 26px;
  border-radius: 50%;
  transition: transform 0.3s ease;
  transform: translateX(${props => props.$isDark ? '32px' : '0px'});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const ThemeToggle: React.FC = () => {
  try {
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
  } catch (error) {
    console.error('ThemeToggle error:', error);
    // Fallback toggle without theme context
    return (
      <ToggleContainer 
        $isDark={false} 
        onClick={() => console.log('Theme toggle clicked')} 
        title="Theme Toggle (Error)"
        style={{ border: '2px solid red' }}
      >
        <ToggleSlider $isDark={false}>
          ⚠️
        </ToggleSlider>
      </ToggleContainer>
    );
  }
};

export default ThemeToggle;