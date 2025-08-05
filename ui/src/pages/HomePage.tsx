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
`;

const ManhwaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const LoadingText = styled.p`
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  font-size: 1.2rem;
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
        console.error('Error fetching manhwas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchManhwas();
  }, []);

  if (loading) {
    return (
      <HomeContainer>
        <LoadingText>Loading manhwas...</LoadingText>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Title>Featured Manhwa</Title>
      <ManhwaGrid>
        {manhwas.map(manhwa => (
          <ManhwaCard key={manhwa.id} manhwa={manhwa} />
        ))}
      </ManhwaGrid>
    </HomeContainer>
  );
};

export default HomePage;