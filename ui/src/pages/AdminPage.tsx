import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.glass.hover};
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
    text-align: center;
  }
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(135deg, #764ba2, #f093fb);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    
    &::before {
      left: 100%;
    }
  }

  &:disabled {
    background: ${props => props.theme.colors.glass.hover};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const DeleteButton = styled(Button)`
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);

  &:hover {
    background: linear-gradient(135deg, #ee5a52, #ff4757);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
`;

const TableContainer = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px ${props => props.theme.colors.shadow};
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MobileCardContainer = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileCard = styled.div`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 5px 20px ${props => props.theme.colors.shadow};
`;

const MobileCardField = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MobileFieldLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MobileFieldValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
`;

const MobileActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const Th = styled.th`
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  padding: 1.2rem 1.5rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.95rem;
`;

const Tr = styled.tr`
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.glass.hover};
    transform: scale(1.005);
  }
  
  &:last-child td {
    border-bottom: none;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 1, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.glass.background};
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 95%;
    padding: 1.5rem;
    max-height: 90vh;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    background: ${props => props.theme.colors.glass.background};
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
  }
  
  &:hover {
    background: ${props => props.theme.colors.glass.background};
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #667eea;
    background: ${props => props.theme.colors.glass.background};
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
  }
  
  &:hover {
    background: ${props => props.theme.colors.glass.background};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const CancelButton = styled(Button)`
  background: ${props => props.theme.colors.glass.background};
  color: ${props => props.theme.colors.text.primary};
  box-shadow: 0 4px 15px ${props => props.theme.colors.shadow};

  &:hover {
    background: ${props => props.theme.colors.glass.hover};
  }
`;

const SearchSection = styled.div`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const SearchInputContainer = styled.div`
  position: relative;
  flex: 0 1 33%;
  min-width: 250px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
    flex: 1;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }

  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.background};
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }
`;

const ClearSearchButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0;
  transition: all 0.3s ease;
  
  ${SearchInputContainer}:hover & {
    opacity: 1;
  }
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  min-width: 140px;

  &:focus {
    outline: none;
    border-color: #667eea;
    background: ${props => props.theme.colors.glass.background};
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  &:hover {
    background: ${props => props.theme.colors.glass.background};
  }

  option {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
`;

interface Manhwa {
  id: string;
  title: string;
  author: string;
  genre: string[];
  status: string;
  description: string;
  cover_image?: string;
}

const AdminPage: React.FC = () => {
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [filteredManhwas, setFilteredManhwas] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManhwa, setEditingManhwa] = useState<Manhwa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    status: 'ongoing',
    description: '',
    cover_image: ''
  });

  useEffect(() => {
    fetchManhwas();
  }, []);

  useEffect(() => {
    filterManhwas();
  }, [manhwas, searchTerm, statusFilter]);

  const filterManhwas = () => {
    let filtered = manhwas.filter(manhwa => {
      const matchesSearch = searchTerm === '' || 
        manhwa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manhwa.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manhwa.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manhwa.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || manhwa.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredManhwas(filtered);
  };

  const fetchManhwas = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/manhwa/');
      if (!response.ok) throw new Error('Failed to fetch manhwas');
      const data = await response.json();
      setManhwas(data);
    } catch (err) {
      setError('Failed to load manhwas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingManhwa(null);
    setFormData({
      title: '',
      author: '',
      genre: '',
      status: 'ongoing',
      description: '',
      cover_image: ''
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (manhwa: Manhwa) => {
    setEditingManhwa(manhwa);
    setFormData({
      title: manhwa.title,
      author: manhwa.author,
      genre: manhwa.genre.join(', '),
      status: manhwa.status,
      description: manhwa.description,
      cover_image: manhwa.cover_image || ''
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (manhwa: Manhwa) => {
    if (!window.confirm(`Are you sure you want to delete "${manhwa.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/manhwa/${manhwa.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete manhwa');

      setSuccess(`Successfully deleted "${manhwa.title}"`);
      fetchManhwas();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to delete "${manhwa.title}"`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const genreArray = formData.genre.split(',').map(g => g.trim()).filter(g => g);
      
      const manhwaData = {
        title: formData.title,
        author: formData.author,
        genre: genreArray,
        status: formData.status,
        description: formData.description,
        cover_image: formData.cover_image || null
      };

      const url = editingManhwa 
        ? `http://localhost:8000/api/v1/manhwa/${editingManhwa.id}` 
        : 'http://localhost:8000/api/v1/manhwa/';
      
      const method = editingManhwa ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manhwaData),
      });

      if (!response.ok) throw new Error(`Failed to ${editingManhwa ? 'update' : 'create'} manhwa`);

      const action = editingManhwa ? 'updated' : 'created';
      setSuccess(`Successfully ${action} "${formData.title}"`);
      setShowModal(false);
      fetchManhwas();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to ${editingManhwa ? 'update' : 'create'} manhwa`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container>
      <Header>
        <Title>Manhwa Administration</Title>
        <Button onClick={handleCreateNew}>Create New Manhwa</Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <SearchSection>
        <SearchContainer>
          <SearchInputContainer>
            <SearchInput
              type="text"
              placeholder="Search by title, author, genre, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <ClearSearchButton onClick={() => setSearchTerm('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </ClearSearchButton>
            )}
          </SearchInputContainer>
          <FilterGroup>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
              <option value="cancelled">Cancelled</option>
            </FilterSelect>
          </FilterGroup>
        </SearchContainer>
        <div style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
          Showing {filteredManhwas.length} of {manhwas.length} manhwa(s)
        </div>
      </SearchSection>

      {loading ? (
        <LoadingSpinner>Loading manhwas...</LoadingSpinner>
      ) : (
        <>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Author</Th>
                  <Th>Genre</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredManhwas.map((manhwa) => (
                  <Tr key={manhwa.id}>
                    <Td>{manhwa.title}</Td>
                    <Td>{manhwa.author}</Td>
                    <Td>{manhwa.genre.join(', ')}</Td>
                    <Td style={{ textTransform: 'capitalize' }}>{manhwa.status}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button onClick={() => handleEdit(manhwa)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                          Edit
                        </Button>
                        <DeleteButton onClick={() => handleDelete(manhwa)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                          Delete
                        </DeleteButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          
          <MobileCardContainer>
            {filteredManhwas.map((manhwa) => (
              <MobileCard key={manhwa.id}>
                <MobileCardField>
                  <MobileFieldLabel>Title</MobileFieldLabel>
                  <MobileFieldValue>{manhwa.title}</MobileFieldValue>
                </MobileCardField>
                <MobileCardField>
                  <MobileFieldLabel>Author</MobileFieldLabel>
                  <MobileFieldValue>{manhwa.author}</MobileFieldValue>
                </MobileCardField>
                <MobileCardField>
                  <MobileFieldLabel>Genre</MobileFieldLabel>
                  <MobileFieldValue>{manhwa.genre.join(', ')}</MobileFieldValue>
                </MobileCardField>
                <MobileCardField>
                  <MobileFieldLabel>Status</MobileFieldLabel>
                  <MobileFieldValue style={{ textTransform: 'capitalize' }}>{manhwa.status}</MobileFieldValue>
                </MobileCardField>
                <MobileActions>
                  <Button onClick={() => handleEdit(manhwa)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    Edit
                  </Button>
                  <DeleteButton onClick={() => handleDelete(manhwa)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    Delete
                  </DeleteButton>
                </MobileActions>
              </MobileCard>
            ))}
          </MobileCardContainer>
        </>
      )}

      {showModal && (
        <Modal>
          <ModalContent>
            <h2 style={{ marginTop: 0, color: 'inherit' }}>
              {editingManhwa ? 'Edit Manhwa' : 'Create New Manhwa'}
            </h2>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Title *</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="author">Author *</Label>
                <Input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="genre">Genres (comma-separated) *</Label>
                <Input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  placeholder="e.g., Action, Fantasy, Romance"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="status">Status</Label>
                <FilterSelect
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                  <option value="cancelled">Cancelled</option>
                </FilterSelect>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="cover_image">Cover Image URL</Label>
                <Input
                  type="url"
                  id="cover_image"
                  name="cover_image"
                  value={formData.cover_image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/cover.jpg"
                />
              </FormGroup>

              <ButtonGroup>
                <CancelButton type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </CancelButton>
                <Button type="submit">
                  {editingManhwa ? 'Update' : 'Create'} Manhwa
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default AdminPage;