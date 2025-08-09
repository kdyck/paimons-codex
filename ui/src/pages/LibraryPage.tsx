import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Manhwa } from '../types/manhwa';
import { manhwaService } from '../services/manhwaService';
import ManhwaCard from '../components/ManhwaCard';

const LibraryContainer = styled.div`
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

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 12px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  
  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.background};
  }
  
  option {
    background: ${props => props.theme.colors.glass.background};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  flex: 1;
  min-width: 200px;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }
  
  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.background};
  }
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

const NoResultsText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  font-size: 1.1rem;
  margin-top: 2rem;
`;

const LibraryPage: React.FC = () => {
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    const fetchManhwas = async () => {
      try {
        console.log('LibraryPage: Fetching manhwas...');
        const data = await manhwaService.getAllManhwa(0, 100);
        console.log('LibraryPage: Received data:', data);
        setManhwas(data);
      } catch (error) {
        console.error('LibraryPage: Error fetching manhwas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchManhwas();
  }, []);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    manhwas.forEach(manhwa => {
      if (Array.isArray(manhwa.genre)) {
        manhwa.genre.forEach(g => genres.add(g));
      }
    });
    return Array.from(genres).sort();
  }, [manhwas]);

  const filteredAndSortedManhwas = useMemo(() => {
    console.log('LibraryPage: Filtering manhwas:', manhwas);
    console.log('LibraryPage: Search term:', searchTerm);
    console.log('LibraryPage: Selected genre:', selectedGenre);
    console.log('LibraryPage: Selected status:', selectedStatus);
    
    let filtered = manhwas.filter(manhwa => {
      const matchesSearch = manhwa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manhwa.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manhwa.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = selectedGenre === 'all' || 
                          (Array.isArray(manhwa.genre) && manhwa.genre.includes(selectedGenre));
      
      const matchesStatus = selectedStatus === 'all' || manhwa.status === selectedStatus;

      return matchesSearch && matchesGenre && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    console.log('LibraryPage: Filtered results:', filtered);
    return filtered;
  }, [manhwas, searchTerm, selectedGenre, selectedStatus, sortBy]);

  if (loading) {
    return (
      <LibraryContainer>
        <LoadingText>Loading library...</LoadingText>
      </LibraryContainer>
    );
  }

  console.log('LibraryPage: About to render, filteredAndSortedManhwas.length:', filteredAndSortedManhwas.length);

  return (
    <LibraryContainer>
      <Title>Library</Title>
      
      <FilterContainer>
        <FilterGroup>
          <FilterLabel>Search</FilterLabel>
          <SearchInput
            type="text"
            placeholder="Search titles, authors, descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Genre</FilterLabel>
          <Select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="all">All Genres</option>
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <Select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="hiatus">Hiatus</option>
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Sort By</FilterLabel>
          <Select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="status">Status</option>
          </Select>
        </FilterGroup>
      </FilterContainer>

      {filteredAndSortedManhwas.length === 0 ? (
        <NoResultsText>
          No manhwa found matching your criteria.
        </NoResultsText>
      ) : (
        <ManhwaGrid>
          {filteredAndSortedManhwas.map(manhwa => (
            <ManhwaCard key={manhwa.id} manhwa={manhwa} />
          ))}
        </ManhwaGrid>
      )}
    </LibraryContainer>
  );
};

export default LibraryPage;