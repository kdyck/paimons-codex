import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  colors: {
    background: string;
    backgroundGradient: string;
    text: {
      primary: string;
      secondary: string;
      placeholder: string;
    };
    glass: {
      background: string;
      backdrop: string;
      hover: string;
    };
    shadow: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    background: '#f8fafc',
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)',
      placeholder: 'rgba(255, 255, 255, 0.7)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdrop: 'blur(20px)',
      hover: 'rgba(255, 255, 255, 0.25)',
    },
    shadow: 'rgba(0, 0, 0, 0.2)',
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#0f172a',
    backgroundGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1f2937 100%)',
    text: {
      primary: '#f8fafc',
      secondary: 'rgba(248, 250, 252, 0.85)',
      placeholder: 'rgba(248, 250, 252, 0.6)',
    },
    glass: {
      background: 'rgba(30, 41, 59, 0.4)',
      backdrop: 'blur(20px)',
      hover: 'rgba(30, 41, 59, 0.6)',
    },
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};