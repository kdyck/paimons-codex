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

const GeneratorSection = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
`;

const GeneratorTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
`;

const GeneratorForm = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const GeneratorField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const GeneratorLabel = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GeneratorInput = styled.input`
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }
`;

const GeneratorTextarea = styled.textarea`
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.placeholder};
  }
`;

const GeneratorSelect = styled.select`
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: ${props => props.theme.colors.glass.background};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
  }

  option {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const GenerationProgress = styled.div`
  background: ${props => props.theme.colors.glass.background};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ProgressText = styled.p`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 500;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  width: ${props => props.$progress}%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const GeneratedResult = styled.div`
  background: ${props => props.theme.colors.glass.background};
  border-radius: 16px;
  padding: 2rem;
  margin-top: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 400px;
  overflow-y: auto;
`;

const ResultTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const ResultContent = styled.pre`
  color: ${props => props.theme.colors.text.secondary};
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  margin: 0;
`;

const ImagePreview = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  margin: 0.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
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

const GenerateButton = styled(Button)`
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 auto;
  display: block;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);

  &:hover {
    background: linear-gradient(135deg, #764ba2, #f093fb, #4facfe);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
  }

  &:disabled {
    background: ${props => props.theme.colors.glass.hover};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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

  // Manhwa Generation States
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [generatorForm, setGeneratorForm] = useState({
    genre: 'fantasy',
    setting: 'magical academy',
    main_character: 'young hero',
    plot_outline: '',
    chapter_count: 5,
    art_style: 'anime'
  });

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

  const handleGeneratorInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.name === 'chapter_count' ? parseInt(e.target.value) : e.target.value;
    setGeneratorForm({
      ...generatorForm,
      [e.target.name]: value
    });
  };

  const generateManhwa = async () => {
    if (generating) return;
    
    try {
      setGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus('Starting manhwa generation...');
      setGeneratedResult(null);
      setError(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 2000);

      setGenerationStatus('Generating story outline...');
      
      const response = await fetch('http://localhost:8000/api/v1/llm/generate-full-manhwa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatorForm),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      setGenerationProgress(100);
      setGenerationStatus('Generation completed successfully!');
      setGeneratedResult(result);
      setSuccess('Manhwa generated successfully! Check the results below.');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(`Failed to generate manhwa: ${err.message}`);
      setGenerationStatus('Generation failed');
      setGenerationProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  const downloadGeneratedContent = () => {
    if (!generatedResult) return;
    
    const dataStr = JSON.stringify(generatedResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `manhwa-${generatedResult.story?.title?.replace(/\s+/g, '_') || 'generated'}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Container>
      <Header>
        <Title>Manhwa Administration</Title>
        <Button onClick={handleCreateNew}>Create New Manhwa</Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* AI Manhwa Generator Section */}
      <GeneratorSection>
        <GeneratorTitle>🎨 AI Manhwa Generator</GeneratorTitle>
        <GeneratorForm>
          <GeneratorField>
            <GeneratorLabel>Genre</GeneratorLabel>
            <GeneratorSelect
              name="genre"
              value={generatorForm.genre}
              onChange={handleGeneratorInputChange}
              disabled={generating}
            >
              <option value="fantasy">Fantasy</option>
              <option value="romance">Romance</option>
              <option value="action">Action</option>
              <option value="mystery">Mystery</option>
              <option value="drama">Drama</option>
              <option value="comedy">Comedy</option>
              <option value="horror">Horror</option>
              <option value="sci-fi">Sci-Fi</option>
            </GeneratorSelect>
          </GeneratorField>

          <GeneratorField>
            <GeneratorLabel>Setting</GeneratorLabel>
            <GeneratorInput
              type="text"
              name="setting"
              value={generatorForm.setting}
              onChange={handleGeneratorInputChange}
              disabled={generating}
              placeholder="e.g., magical academy, modern city, medieval kingdom"
            />
          </GeneratorField>

          <GeneratorField>
            <GeneratorLabel>Main Character</GeneratorLabel>
            <GeneratorInput
              type="text"
              name="main_character"
              value={generatorForm.main_character}
              onChange={handleGeneratorInputChange}
              disabled={generating}
              placeholder="e.g., young warrior, talented student, mysterious detective"
            />
          </GeneratorField>

          <GeneratorField>
            <GeneratorLabel>Art Style</GeneratorLabel>
            <GeneratorSelect
              name="art_style"
              value={generatorForm.art_style}
              onChange={handleGeneratorInputChange}
              disabled={generating}
            >
              <option value="anime">Anime Style</option>
              <option value="realistic">Realistic</option>
              <option value="chibi">Chibi/Cute</option>
            </GeneratorSelect>
          </GeneratorField>

          <GeneratorField>
            <GeneratorLabel>Chapter Count</GeneratorLabel>
            <GeneratorInput
              type="number"
              name="chapter_count"
              value={generatorForm.chapter_count}
              onChange={handleGeneratorInputChange}
              disabled={generating}
              min="1"
              max="20"
            />
          </GeneratorField>

          <GeneratorField style={{ gridColumn: '1 / -1' }}>
            <GeneratorLabel>Plot Outline (Optional)</GeneratorLabel>
            <GeneratorTextarea
              name="plot_outline"
              value={generatorForm.plot_outline}
              onChange={handleGeneratorInputChange}
              disabled={generating}
              placeholder="Describe the main plot, key events, or story direction you want..."
            />
          </GeneratorField>
        </GeneratorForm>

        <GenerateButton
          onClick={generateManhwa}
          disabled={generating}
        >
          {generating ? 'Generating...' : '✨ Generate Complete Manhwa'}
        </GenerateButton>

        {generating && (
          <GenerationProgress>
            <ProgressText>{generationStatus}</ProgressText>
            <ProgressBar>
              <ProgressFill $progress={generationProgress} />
            </ProgressBar>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              {generationProgress}% Complete
            </div>
          </GenerationProgress>
        )}

        {generatedResult && (
          <GeneratedResult>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <ResultTitle>Generated Manhwa</ResultTitle>
              <Button onClick={downloadGeneratedContent} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                📥 Download JSON
              </Button>
            </div>
            
            {generatedResult.story && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'inherit', margin: '0 0 0.5rem 0' }}>Story: {generatedResult.story.title}</h4>
                <p style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.8)' }}>
                  <strong>Genre:</strong> {generatedResult.story.genre} | <strong>Setting:</strong> {generatedResult.story.setting}
                </p>
                <ResultContent>{generatedResult.story.synopsis || generatedResult.story.full_content}</ResultContent>
              </div>
            )}

            {generatedResult.cover_art && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'inherit', margin: '0 0 0.5rem 0' }}>Cover Art</h4>
                <ImagePreview 
                  src={`data:image/png;base64,${generatedResult.cover_art.image_base64}`} 
                  alt="Generated cover art" 
                />
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0.5rem 0 0 0' }}>
                  Prompt: {generatedResult.cover_art.prompt}
                </p>
              </div>
            )}

            {generatedResult.character_art && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'inherit', margin: '0 0 0.5rem 0' }}>Character Art</h4>
                <ImagePreview 
                  src={`data:image/png;base64,${generatedResult.character_art.image_base64}`} 
                  alt="Generated character art" 
                />
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0.5rem 0 0 0' }}>
                  Prompt: {generatedResult.character_art.prompt}
                </p>
              </div>
            )}

            {generatedResult.storage_error && (
              <div style={{ 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ <strong>Note:</strong> Content generated successfully but not stored permanently ({generatedResult.storage_error}). 
                Use the Download button to save this content.
              </div>
            )}
          </GeneratedResult>
        )}
      </GeneratorSection>

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