import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Manhwa } from '../types/manhwa';
import { toMinioUrl, coverUrlFromSlug, pageUrlFromSlug } from '../services/minio';
import axios from 'axios';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const BackButton = styled.button`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    transform: translateY(-2px);
  }
`;

const DetailContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 3rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const CoverSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CoverImage = styled.img`
  width: 100%;
  max-width: 300px;
  border-radius: 15px;
  box-shadow: 0 10px 30px ${props => props.theme.colors.shadow};
  margin-bottom: 1rem;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
`;

const Author = styled.h2`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  margin: 0;
  font-style: italic;
`;

const Status = styled.div<{ status: string }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  width: fit-content;
  background: ${props => 
    props.status === 'completed' ? '#4CAF50' :
    props.status === 'ongoing' ? '#2196F3' :
    props.status === 'hiatus' ? '#FF9800' : '#9E9E9E'};
  color: white;
  text-transform: capitalize;
`;

const GenreList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const GenreTag = styled.span`
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`;

const ChaptersSection = styled.div`
  margin-top: 3rem;
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const ChapterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const ChapterCard = styled.div`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    transform: translateY(-2px);
  }
`;

const ChapterTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 0.5rem 0;
`;

const ChapterThumbnail = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorMessage = styled.div`
  color: #f44336;
  text-align: center;
  padding: 2rem;
  background: ${props => props.theme.colors.glass.background};
  border-radius: 10px;
`;

const ManhwaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManhwa = async () => {
      if (!id) return;
      
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/manhwa/${id}`);
        setManhwa(response.data);
      } catch (err) {
        setError('Failed to load manhwa details');
        console.error('Error fetching manhwa:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchManhwa();
  }, [id]);

  const handleChapterClick = (chapterNumber: number) => {
    navigate(`/manhwa/${id}/chapter/${chapterNumber}`);
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading manhwa details...</LoadingSpinner>
      </Container>
    );
  }

  if (error || !manhwa) {
    return (
      <Container>
        <ErrorMessage>{error || 'Manhwa not found'}</ErrorMessage>
      </Container>
    );
  }

  const slug = manhwa.slug || manhwa.id;
  const coverSrc = manhwa.cover_image
    ? toMinioUrl(manhwa.cover_image)
    : coverUrlFromSlug(slug);

  return (
    <Container>
      <BackButton onClick={() => navigate('/')}>
        ← Back to Library
      </BackButton>
      
      <DetailContainer>
        <CoverSection>
          <CoverImage src={coverSrc} alt={manhwa.title} />
          <Status status={manhwa.status}>{manhwa.status}</Status>
        </CoverSection>
        
        <InfoSection>
          <Title>{manhwa.title}</Title>
          <Author>by {manhwa.author}</Author>
          
          <div>
            <GenreList>
              {manhwa.genre.map((genre, index) => (
                <GenreTag key={index}>{genre}</GenreTag>
              ))}
            </GenreList>
          </div>
          
          <Description>{manhwa.description}</Description>
        </InfoSection>
      </DetailContainer>

      <ChaptersSection>
        <SectionTitle>Chapters</SectionTitle>
        <ChapterGrid>
          {/* For now, showing a placeholder chapter - you can expand this based on your data structure */}
          <ChapterCard onClick={() => handleChapterClick(1)}>
            <ChapterThumbnail 
              src={pageUrlFromSlug(slug, 1, 1)} 
              alt="Chapter 1 - Page 1"
            />
            <ChapterTitle>Chapter 1</ChapterTitle>
          </ChapterCard>
        </ChapterGrid>
      </ChaptersSection>
    </Container>
  );
};

export default ManhwaDetailPage;