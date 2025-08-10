import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Manhwa } from '../types/manhwa';
import { manhwaService } from '../services/manhwaService';
import ManhwaCard from '../components/ManhwaCard';

const HomeContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
`;

const ManhwaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  
  & > * {
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;
  }
  
  & > *:nth-child(1) { animation-delay: 0.1s; }
  & > *:nth-child(2) { animation-delay: 0.2s; }
  & > *:nth-child(3) { animation-delay: 0.3s; }
  & > *:nth-child(4) { animation-delay: 0.4s; }
  & > *:nth-child(5) { animation-delay: 0.5s; }
  & > *:nth-child(6) { animation-delay: 0.6s; }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LoadingText = styled.p`
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  font-size: 1.2rem;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

const HomePage: React.FC = () => {
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManhwas = async () => {
      try {
        const data = await manhwaService.getAllManhwa();
        setManhwas(data);
      } catch (error) {
        console.error('Error fetching codex:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchManhwas();
  }, []);

  if (loading) {
    return (
      <HomeContainer>
        <LoadingText>Loading...</LoadingText>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Title>Featured</Title>
      <ManhwaGrid>
        {manhwas.map(manhwa => (
          <ManhwaCard key={manhwa.id} manhwa={manhwa} />
        ))}
      </ManhwaGrid>
    </HomeContainer>
  );
};

export default HomePage;