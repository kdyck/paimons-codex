import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ReaderContainer = styled.div`
  background: ${props => props.theme.colors.background};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ReaderHeader = styled.div`
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: #667eea;
  }
`;

const ChapterInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${props => props.theme.colors.text.primary};
`;

const ManhwaTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const ChapterTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const ReaderControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ControlButton = styled.button`
  background: ${props => props.theme.colors.glass.background};
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${props => props.theme.colors.text.primary};
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.theme.colors.glass.hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReaderContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
`;

const PageImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.3s ease;
  transform: scale(var(--zoom-level, 1));
  transform-origin: center;
`;

const NavigationBar = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  padding: 1rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 1rem;
  align-items: center;
  z-index: 100;
`;

const PageCounter = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  min-width: 100px;
  text-align: center;
`;

const SettingsPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.$isOpen ? '0' : '-300px'};
  width: 300px;
  height: 100vh;
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  transition: right 0.3s ease;
  z-index: 200;
`;

const SettingGroup = styled.div`
  margin-bottom: 2rem;
`;

const SettingLabel = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
`;

const SettingSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: ${props => props.theme.colors.glass.hover};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  
  option {
    background: ${props => props.theme.colors.background};
  }
`;

const ZoomControl = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ZoomButton = styled.button`
  background: ${props => props.theme.colors.glass.background};
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${props => props.theme.colors.text.primary};
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 40px;

  &:hover {
    background: ${props => props.theme.colors.glass.hover};
  }
`;

const ZoomLevel = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
`;

interface Chapter {
  id: string;
  manhwa_id: string;
  chapter_number: number;
  title: string;
  pages: string[];
}

const ReaderPage: React.FC = () => {
  const { manhwaId, chapterId } = useParams<{ manhwaId: string; chapterId: string }>();
  const navigate = useNavigate();
  
  // Reader state
  const [manhwaTitle, setManhwaTitle] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [readingDirection, setReadingDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true);
      
      // Mock chapter data - replace with actual API call
      const mockChapter: Chapter = {
        id: chapterId || 'chapter-1',
        manhwa_id: manhwaId || '',
        chapter_number: 1,
        title: 'The Beginning',
        pages: [
          'https://via.placeholder.com/800x1200/333333/ffffff?text=Page+1',
          'https://via.placeholder.com/800x1200/444444/ffffff?text=Page+2',
          'https://via.placeholder.com/800x1200/555555/ffffff?text=Page+3',
          'https://via.placeholder.com/800x1200/666666/ffffff?text=Page+4',
          'https://via.placeholder.com/800x1200/777777/ffffff?text=Page+5'
        ]
      };
      
      setCurrentChapter(mockChapter);
      setManhwaTitle('Sample Manhwa Title');
      setLoading(false);
    };

    loadChapter();
  }, [manhwaId, chapterId]);

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        if (readingDirection === 'ltr') {
          previousPage();
        } else {
          nextPage();
        }
        break;
      case 'ArrowRight':
        if (readingDirection === 'ltr') {
          nextPage();
        } else {
          previousPage();
        }
        break;
      case 'Escape':
        setShowSettings(false);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [readingDirection, currentPage]);

  const nextPage = () => {
    if (currentChapter && currentPage < currentChapter.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const handleImageClick = () => {
    if (readingDirection === 'ltr') {
      nextPage();
    } else {
      previousPage();
    }
  };

  if (loading || !currentChapter) {
    return (
      <ReaderContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
          Loading chapter...
        </div>
      </ReaderContainer>
    );
  }

  return (
    <ReaderContainer>
      <ReaderHeader>
        <BackButton onClick={() => navigate(`/manhwa/${manhwaId}`)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          Back
        </BackButton>
        
        <ChapterInfo>
          <ManhwaTitle>{manhwaTitle}</ManhwaTitle>
          <ChapterTitle>Chapter {currentChapter.chapter_number}: {currentChapter.title}</ChapterTitle>
        </ChapterInfo>
        
        <ReaderControls>
          <ControlButton onClick={() => setShowSettings(!showSettings)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </ControlButton>
        </ReaderControls>
      </ReaderHeader>

      <ReaderContent ref={contentRef}>
        <PageImage
          src={currentChapter.pages[currentPage]}
          alt={`Page ${currentPage + 1}`}
          onClick={handleImageClick}
          style={{ '--zoom-level': zoomLevel } as React.CSSProperties}
        />
      </ReaderContent>

      <NavigationBar>
        <ControlButton onClick={previousPage} disabled={currentPage === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </ControlButton>
        
        <PageCounter>
          {currentPage + 1} / {currentChapter.pages.length}
        </PageCounter>
        
        <ControlButton 
          onClick={nextPage} 
          disabled={currentPage === currentChapter.pages.length - 1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </ControlButton>
      </NavigationBar>

      <SettingsPanel $isOpen={showSettings}>
        <h3 style={{ color: 'white', marginTop: 0 }}>Reader Settings</h3>
        
        <SettingGroup>
          <SettingLabel>Reading Direction</SettingLabel>
          <SettingSelect
            value={readingDirection}
            onChange={(e) => setReadingDirection(e.target.value as 'ltr' | 'rtl')}
          >
            <option value="ltr">Left to Right</option>
            <option value="rtl">Right to Left</option>
          </SettingSelect>
        </SettingGroup>

        <SettingGroup>
          <SettingLabel>Zoom Level</SettingLabel>
          <ZoomControl>
            <ZoomButton onClick={handleZoomOut}>-</ZoomButton>
            <ZoomLevel>{Math.round(zoomLevel * 100)}%</ZoomLevel>
            <ZoomButton onClick={handleZoomIn}>+</ZoomButton>
            <ZoomButton onClick={resetZoom}>Reset</ZoomButton>
          </ZoomControl>
        </SettingGroup>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
          <p>Keyboard shortcuts:</p>
          <p>← → Arrow keys to navigate</p>
          <p>ESC to close settings</p>
        </div>
      </SettingsPanel>
    </ReaderContainer>
  );
};

export default ReaderPage;