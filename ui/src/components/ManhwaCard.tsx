import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Manhwa } from '../types/manhwa';

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
`;

const CoverImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
`;

const Author = styled.p`
  color: rgba(255, 255, 255, 0.8);
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
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 15px;
  font-size: 0.8rem;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.9);
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

  const handleClick = () => {
    navigate(`/manhwa/${manhwa.id}`);
  };

  return (
    <Card onClick={handleClick}>
      {manhwa.cover_image && (
        <CoverImage src={manhwa.cover_image} alt={manhwa.title} />
      )}
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