import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid ${props => props.theme.colors.glass.hover};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const Button = styled.button`
  background: #4A90E2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #357ABD;
    transform: translateY(-1px);
  }

  &:disabled {
    background: ${props => props.theme.colors.text.secondary};
    cursor: not-allowed;
    transform: none;
  }
`;

const DeleteButton = styled(Button)`
  background: #dc3545;
  padding: 8px 16px;
  font-size: 12px;

  &:hover {
    background: #c82333;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${props => props.theme.colors.glass.background};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text.primary};
  padding: 16px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid ${props => props.theme.colors.glass.hover};
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
`;

const Tr = styled.tr`
  &:hover {
    background: ${props => props.theme.colors.background};
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
  background: ${props => props.theme.colors.text.secondary};

  &:hover {
    background: ${props => props.theme.colors.text.primary};
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManhwa, setEditingManhwa] = useState<Manhwa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const fetchManhwas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/manhwa/');
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
      const response = await fetch(`/api/v1/manhwa/${manhwa.id}`, {
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
        ? `/api/v1/manhwa/${editingManhwa.id}` 
        : '/api/v1/manhwa/';
      
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
            {manhwas.map((manhwa) => (
              <Tr key={manhwa.id}>
                <Td>{manhwa.title}</Td>
                <Td>{manhwa.author}</Td>
                <Td>{manhwa.genre.join(', ')}</Td>
                <Td style={{ textTransform: 'capitalize' }}>{manhwa.status}</Td>
                <Td>
                  <Button onClick={() => handleEdit(manhwa)} style={{ marginRight: '8px' }}>
                    Edit
                  </Button>
                  <DeleteButton onClick={() => handleDelete(manhwa)}>
                    Delete
                  </DeleteButton>
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