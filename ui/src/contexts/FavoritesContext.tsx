import React, { createContext, useContext, useState, useEffect } from 'react';
import { Manhwa } from '../types/manhwa';

interface FavoritesContextType {
  favorites: Manhwa[];
  addToFavorites: (manhwa: Manhwa) => void;
  removeFromFavorites: (manhwaId: string) => void;
  isFavorite: (manhwaId: string) => boolean;
  toggleFavorite: (manhwa: Manhwa) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Manhwa[]>(() => {
    const saved = localStorage.getItem('paimons-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('paimons-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (manhwa: Manhwa) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === manhwa.id)) {
        return prev;
      }
      return [...prev, manhwa];
    });
  };

  const removeFromFavorites = (manhwaId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== manhwaId));
  };

  const isFavorite = (manhwaId: string) => {
    return favorites.some(fav => fav.id === manhwaId);
  };

  const toggleFavorite = (manhwa: Manhwa) => {
    if (isFavorite(manhwa.id)) {
      removeFromFavorites(manhwa.id);
    } else {
      addToFavorites(manhwa);
    }
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      toggleFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};