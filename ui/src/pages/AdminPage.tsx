import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.glass.hover};
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
  background: rgba(0, 0, 0, 0.7);
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
  padding: 12px;
  border: 1px solid ${props => props.theme.colors.glass.hover};
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4A90E2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid ${props => props.theme.colors.glass.hover};
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #4A90E2;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
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
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem;
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

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    background: ${props => props.theme.colors.glass.background};
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }

  option {
    background: ${props => props.theme.colors.glass.background};
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
  border-radius: 8px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 8px;
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
          <SearchInput
            type="text"
            placeholder="Search by title, author, genre, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
        </SearchContainer>
        <div style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
          Showing {filteredManhwas.length} of {manhwas.length} manhwa(s)
        </div>
      </SearchSection>

      {loading ? (
        <LoadingSpinner>Loading manhwas...</LoadingSpinner>
      ) : (
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
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    padding: '12px',
                    border: `1px solid var(--border-color)`,
                    borderRadius: '8px',
                    background: 'var(--background-color)',
                    color: 'var(--text-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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