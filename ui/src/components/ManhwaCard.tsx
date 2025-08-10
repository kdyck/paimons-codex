import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Manhwa } from '../types/manhwa';
import { toMinioUrl, coverUrlFromSlug } from '../services/minio';
import { useFavorites } from '../contexts/FavoritesContext';

const Card = styled.div`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 20px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px ${props => props.theme.colors.shadow};
    background: ${props => props.theme.colors.glass.hover};
    border-color: rgba(255, 255, 255, 0.2);
    
    &::before {
      left: 100%;
    }
  }
`;

const FavoriteButton = styled.button<{ $isFavorite: boolean }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${props => props.$isFavorite ? '#e91e63' : 'rgba(255, 255, 255, 0.2)'};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  transition: all 0.3s ease;
  z-index: 2;

  &:hover {
    transform: scale(1.1);
    background: ${props => props.$isFavorite ? '#c2185b' : 'rgba(255, 255, 255, 0.3)'};
  }
`;

const CoverImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 15px;
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
  
  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
`;

const Author = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  margin: 0 0 0.5rem 0;
  font-style: italic;
`;

const GenreList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const GenreTag = styled.span`
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  padding: 0.2rem 0.5rem;
  border-radius: 15px;
  font-size: 0.8rem;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

interface ManhwaCardProps {
  manhwa: Manhwa;
}

const ManhwaCard: React.FC<ManhwaCardProps> = ({ manhwa }) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleClick = () => {
    navigate(`/manhwa/${manhwa.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking favorite button
    toggleFavorite(manhwa);
  };

  const slug = manhwa.slug || manhwa.id;
  const coverSrc = manhwa.cover_image
    ? toMinioUrl(manhwa.cover_image)
    : coverUrlFromSlug(slug);

  return (
    <Card onClick={handleClick}>
      <FavoriteButton
        $isFavorite={isFavorite(manhwa.id)}
        onClick={handleFavoriteClick}
        title={isFavorite(manhwa.id) ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite(manhwa.id) ? '❤️' : '🤍'}
      </FavoriteButton>
      <CoverImage src={coverSrc} alt={manhwa.title} />
      <Title>{manhwa.title}</Title>
      <Author>by {manhwa.author}</Author>
      <GenreList>
        {manhwa.genre.map((genre, index) => (
          <GenreTag key={index}>{genre}</GenreTag>
        ))}
      </GenreList>
      <Description>{manhwa.description}</Description>
    </Card>
  );
};

export default ManhwaCard;