import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
    : 'transparent'
  };
  color: ${props => props.$active 
    ? 'white' 
    : props.theme.colors.text.primary
  };
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-width: 120px;
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #764ba2, #f093fb)' 
      : 'rgba(102, 126, 234, 0.1)'
    };
  }
`;

const TabContent = styled.div<{ $show: boolean }>`
  display: ${props => props.$show ? 'block' : 'none'};
  animation: ${props => props.$show ? 'fadeIn 0.3s ease-in-out' : 'none'};

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
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

  &::placeholder { color: ${props => props.theme.colors.text.placeholder}; }
`;

const Textarea = styled.textarea`
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

  &::placeholder { color: ${props => props.theme.colors.text.placeholder}; }
`;

const Select = styled.select`
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

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${props => props.theme.colors.glass.hover};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  font-size: 0.9rem;

  &:hover {
    background: ${props => props.theme.colors.glass.background};
    border-color: rgba(102, 126, 234, 0.3);
  }

  &:has(input:checked) {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
    border-color: #667eea;
  }
`;

const Checkbox = styled.input`
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &:checked {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
    position: relative;
  }

  &:checked::after {
    content: '✓';
    position: absolute;
    top: -2px;
    left: 2px;
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
`;

const RangeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RangeInput = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }
`;

const RangeValue = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  text-align: center;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #764ba2, #f093fb);
    transform: translateY(-2px);
  }

  &:disabled {
    background: ${props => props.theme.colors.glass.hover};
    cursor: not-allowed;
    transform: none;
  }
`;

const PreviewSection = styled.div`
  background: ${props => props.theme.colors.glass.background};
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PreviewTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const PreviewText = styled.pre`
  color: ${props => props.theme.colors.text.secondary};
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  margin: 0;
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;


interface AdvancedManhwaGeneratorProps {
  onGenerate: (config: any) => void;
  generating: boolean;
}

interface ManhwaConfig {
  story: {
    title: string;
    genres: string[];
    setting: string;
    tone: string;
    length: string;
    maturity_rating: string;
    plot_outline: string;
    themes: string[];
    pacing: string;
  };
  characters: {
    main_character: {
      name: string;
      age: number;
      gender: string;
      ethnicity: string;
      personality: string;
      background: string;
      appearance: string;
      custom_prompt: string;
    };
    supporting_characters: Array<{
      name: string;
      role: string;
      ethnicity: string;
      personality: string;
    }>;
  };
  cover_art: {
    style: string;
    composition: string;
    mood: string;
    color_scheme: string;
    background_type: string;
    character_pose: string;
    lighting: string;
    effects: string[];
    custom_prompt: string;
    resolution: string;
  };
  technical: {
    art_style: string;
    resolution: string;
    seed: number | null;
    steps: number;
    cfg_scale: number;
    model_override: string | null;
    batch_size: number;
    enable_upscaling: boolean;
  };
}

const AdvancedManhwaGenerator: React.FC<AdvancedManhwaGeneratorProps> = ({ onGenerate, generating }) => {
  const [activeTab, setActiveTab] = useState('story');
  const [config, setConfig] = useState<ManhwaConfig>({
    // Story Configuration
    story: {
      title: '',
      genres: ['fantasy'],
      setting: 'modern city',
      tone: 'dramatic',
      length: 'medium',
      maturity_rating: 'teen',
      plot_outline: '',
      themes: ['friendship', 'growth'],
      pacing: 'balanced'
    },
    
    // Character Configuration
    characters: {
      main_character: {
        name: '',
        age: 18,
        gender: 'any',
        ethnicity: 'diverse',
        personality: 'determined',
        background: '',
        appearance: '',
        custom_prompt: ''
      },
      supporting_characters: [
        {
          name: '',
          role: 'best friend',
          ethnicity: 'diverse',
          personality: 'loyal'
        }
      ]
    },
    
    // Cover Art Configuration
    cover_art: {
      style: 'anime',
      composition: 'character focus',
      mood: 'dramatic',
      color_scheme: 'vibrant',
      background_type: 'detailed',
      character_pose: 'dynamic',
      lighting: 'dramatic',
      effects: ['none'],
      custom_prompt: '',
      resolution: '832x1216'
    },
    
    // Technical Configuration
    technical: {
      art_style: 'anime',
      resolution: '768x1152',
      seed: null,
      steps: 30,
      cfg_scale: 7.5,
      model_override: null,
      batch_size: 1,
      enable_upscaling: true
    }
  });

  const updateConfig = (section: keyof ManhwaConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const updateNestedConfig = (section: keyof ManhwaConfig, subsection: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [subsection]: {
          ...((prev[section] as any)[subsection]),
          [field]: value
        }
      }
    }));
  };

  const toggleArrayValue = (section: keyof ManhwaConfig, field: string, value: string) => {
    const current = (config[section] as any)[field] as string[];
    if (current.includes(value)) {
      updateConfig(section, field, current.filter((item: string) => item !== value));
    } else {
      updateConfig(section, field, [...current, value]);
    }
  };

  const generatePreviewPrompt = () => {
    const { cover_art, characters } = config;
    const character = characters.main_character;
    
    let prompt = `manhwa cover art, ${cover_art.style} style, ${cover_art.composition}, ${cover_art.mood} mood, ${cover_art.color_scheme} colors`;
    
    if (character.name) {
      prompt += `, featuring ${character.name}`;
    }
    
    if (character.ethnicity !== 'any') {
      prompt += `, ${character.ethnicity} features`;
    }
    
    if (character.appearance) {
      prompt += `, ${character.appearance}`;
    }
    
    prompt += `, ${cover_art.character_pose} pose, ${cover_art.lighting} lighting`;
    
    if (cover_art.background_type !== 'simple') {
      prompt += `, ${cover_art.background_type} background`;
    }
    
    if (cover_art.effects.length > 0 && !cover_art.effects.includes('none')) {
      prompt += `, ${cover_art.effects.join(', ')} effects`;
    }
    
    if (cover_art.custom_prompt) {
      prompt += `, ${cover_art.custom_prompt}`;
    }
    
    return prompt;
  };

  return (
    <Container>
      <Title>🎨 Advanced Manhwa Generator</Title>
      
      <TabContainer>
        <Tab $active={activeTab === 'story'} onClick={() => setActiveTab('story')}>
          📖 Story
        </Tab>
        <Tab $active={activeTab === 'characters'} onClick={() => setActiveTab('characters')}>
          👤 Characters
        </Tab>
        <Tab $active={activeTab === 'cover'} onClick={() => setActiveTab('cover')}>
          🎨 Cover Art
        </Tab>
        <Tab $active={activeTab === 'technical'} onClick={() => setActiveTab('technical')}>
          ⚙️ Technical
        </Tab>
        <Tab $active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
          👁️ Preview
        </Tab>
      </TabContainer>

      {/* Story Configuration */}
      <TabContent $show={activeTab === 'story'}>
        <FormGrid>
          <FormField>
            <Label>Title</Label>
            <Input
              value={config.story.title}
              onChange={(e) => updateConfig('story', 'title', e.target.value)}
              placeholder="Enter manhwa title"
            />
          </FormField>

          <FormField>
            <Label>Setting</Label>
            <Select
              value={config.story.setting}
              onChange={(e) => updateConfig('story', 'setting', e.target.value)}
            >
              <option value="modern city">Modern City</option>
              <option value="magical academy">Magical Academy</option>
              <option value="medieval kingdom">Medieval Kingdom</option>
              <option value="dystopian future">Dystopian Future</option>
              <option value="small town">Small Town</option>
              <option value="fantasy realm">Fantasy Realm</option>
              <option value="space station">Space Station</option>
              <option value="high school">High School</option>
              <option value="corporate office">Corporate Office</option>
              <option value="virtual world">Virtual World</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Tone</Label>
            <Select
              value={config.story.tone}
              onChange={(e) => updateConfig('story', 'tone', e.target.value)}
            >
              <option value="dramatic">Dramatic</option>
              <option value="comedic">Comedic</option>
              <option value="romantic">Romantic</option>
              <option value="dark">Dark</option>
              <option value="lighthearted">Lighthearted</option>
              <option value="mysterious">Mysterious</option>
              <option value="action-packed">Action-Packed</option>
              <option value="emotional">Emotional</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Maturity Rating</Label>
            <Select
              value={config.story.maturity_rating}
              onChange={(e) => updateConfig('story', 'maturity_rating', e.target.value)}
            >
              <option value="all ages">All Ages</option>
              <option value="teen">Teen (13+)</option>
              <option value="mature">Mature (16+)</option>
              <option value="adult">Adult (18+)</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Story Length</Label>
            <Select
              value={config.story.length}
              onChange={(e) => updateConfig('story', 'length', e.target.value)}
            >
              <option value="short">Short (1-5 chapters)</option>
              <option value="medium">Medium (6-20 chapters)</option>
              <option value="long">Long (21-50 chapters)</option>
              <option value="epic">Epic (50+ chapters)</option>
            </Select>
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Genres</Label>
            <CheckboxGrid>
              {['fantasy', 'romance', 'action', 'mystery', 'drama', 'comedy', 'horror', 'sci-fi', 'slice-of-life', 'psychological', 'historical', 'supernatural', 'adventure', 'thriller', 'mature', 'smut'].map(genre => (
                <CheckboxLabel key={genre}>
                  <Checkbox
                    type="checkbox"
                    checked={config.story.genres.includes(genre)}
                    onChange={() => toggleArrayValue('story', 'genres', genre)}
                  />
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </CheckboxLabel>
              ))}
            </CheckboxGrid>
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Plot Outline</Label>
            <Textarea
              value={config.story.plot_outline}
              onChange={(e) => updateConfig('story', 'plot_outline', e.target.value)}
              placeholder="Describe the main plot, key events, character arcs, and story direction..."
              rows={5}
            />
          </FormField>
        </FormGrid>
      </TabContent>

      {/* Character Configuration */}
      <TabContent $show={activeTab === 'characters'}>
        <FormGrid>
          <FormField>
            <Label>Main Character Name</Label>
            <Input
              value={config.characters.main_character.name}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'name', e.target.value)}
              placeholder="Character's name"
            />
          </FormField>

          <FormField>
            <Label>Age</Label>
            <RangeContainer>
              <RangeInput
                type="range"
                min="12"
                max="35"
                value={config.characters.main_character.age}
                onChange={(e) => updateNestedConfig('characters', 'main_character', 'age', parseInt(e.target.value))}
              />
              <RangeValue>{config.characters.main_character.age} years old</RangeValue>
            </RangeContainer>
          </FormField>

          <FormField>
            <Label>Gender</Label>
            <Select
              value={config.characters.main_character.gender}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'gender', e.target.value)}
            >
              <option value="any">Any/Random</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Ethnicity</Label>
            <Select
              value={config.characters.main_character.ethnicity}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'ethnicity', e.target.value)}
            >
              <option value="diverse">Diverse/Random</option>
              <option value="east asian">East Asian</option>
              <option value="black">Black/African</option>
              <option value="latino">Latino/Hispanic</option>
              <option value="white">White/Caucasian</option>
              <option value="middle eastern">Middle Eastern</option>
              <option value="south asian">South Asian</option>
              <option value="mixed">Mixed Ethnicity</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Personality</Label>
            <Select
              value={config.characters.main_character.personality}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'personality', e.target.value)}
            >
              <option value="determined">Determined</option>
              <option value="shy">Shy</option>
              <option value="confident">Confident</option>
              <option value="mysterious">Mysterious</option>
              <option value="cheerful">Cheerful</option>
              <option value="serious">Serious</option>
              <option value="rebellious">Rebellious</option>
              <option value="kind">Kind</option>
              <option value="ambitious">Ambitious</option>
              <option value="sarcastic">Sarcastic</option>
            </Select>
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Character Background</Label>
            <Textarea
              value={config.characters.main_character.background}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'background', e.target.value)}
              placeholder="Character's history, family, social status, occupation, goals..."
              rows={3}
            />
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Physical Appearance</Label>
            <Textarea
              value={config.characters.main_character.appearance}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'appearance', e.target.value)}
              placeholder="Hair color/style, eye color, height, build, clothing style, distinctive features..."
              rows={3}
            />
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Custom Character Prompt</Label>
            <Textarea
              value={config.characters.main_character.custom_prompt}
              onChange={(e) => updateNestedConfig('characters', 'main_character', 'custom_prompt', e.target.value)}
              placeholder="Additional AI prompt details for character generation..."
              rows={2}
            />
          </FormField>
        </FormGrid>
      </TabContent>

      {/* Cover Art Configuration */}
      <TabContent $show={activeTab === 'cover'}>
        <FormGrid>
          <FormField>
            <Label>Art Style</Label>
            <Select
              value={config.cover_art.style}
              onChange={(e) => updateConfig('cover_art', 'style', e.target.value)}
            >
              <option value="anime">Anime/Manhwa</option>
              <option value="realistic">Realistic</option>
              <option value="chibi">Chibi/Cute</option>
              <option value="watercolor">Watercolor</option>
              <option value="oil painting">Oil Painting</option>
              <option value="digital art">Digital Art</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Composition</Label>
            <Select
              value={config.cover_art.composition}
              onChange={(e) => updateConfig('cover_art', 'composition', e.target.value)}
            >
              <option value="character focus">Character Focus</option>
              <option value="full body">Full Body Shot</option>
              <option value="close-up portrait">Close-up Portrait</option>
              <option value="action scene">Action Scene</option>
              <option value="romantic pose">Romantic Pose</option>
              <option value="group shot">Group Shot</option>
              <option value="silhouette">Silhouette</option>
              <option value="environmental">Environmental</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Mood</Label>
            <Select
              value={config.cover_art.mood}
              onChange={(e) => updateConfig('cover_art', 'mood', e.target.value)}
            >
              <option value="dramatic">Dramatic</option>
              <option value="romantic">Romantic</option>
              <option value="mysterious">Mysterious</option>
              <option value="cheerful">Cheerful</option>
              <option value="dark">Dark</option>
              <option value="epic">Epic</option>
              <option value="serene">Serene</option>
              <option value="intense">Intense</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Color Scheme</Label>
            <Select
              value={config.cover_art.color_scheme}
              onChange={(e) => updateConfig('cover_art', 'color_scheme', e.target.value)}
            >
              <option value="vibrant">Vibrant</option>
              <option value="pastel">Pastel</option>
              <option value="monochromatic">Monochromatic</option>
              <option value="warm tones">Warm Tones</option>
              <option value="cool tones">Cool Tones</option>
              <option value="high contrast">High Contrast</option>
              <option value="muted">Muted</option>
              <option value="neon">Neon</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Character Pose</Label>
            <Select
              value={config.cover_art.character_pose}
              onChange={(e) => updateConfig('cover_art', 'character_pose', e.target.value)}
            >
              <option value="dynamic">Dynamic</option>
              <option value="confident">Confident</option>
              <option value="elegant">Elegant</option>
              <option value="action">Action</option>
              <option value="contemplative">Contemplative</option>
              <option value="powerful">Powerful</option>
              <option value="graceful">Graceful</option>
              <option value="casual">Casual</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Lighting</Label>
            <Select
              value={config.cover_art.lighting}
              onChange={(e) => updateConfig('cover_art', 'lighting', e.target.value)}
            >
              <option value="dramatic">Dramatic</option>
              <option value="soft">Soft</option>
              <option value="backlighting">Backlighting</option>
              <option value="golden hour">Golden Hour</option>
              <option value="neon">Neon</option>
              <option value="moonlight">Moonlight</option>
              <option value="studio">Studio</option>
              <option value="natural">Natural</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Background Type</Label>
            <Select
              value={config.cover_art.background_type}
              onChange={(e) => updateConfig('cover_art', 'background_type', e.target.value)}
            >
              <option value="detailed">Detailed Scene</option>
              <option value="simple">Simple/Minimal</option>
              <option value="gradient">Gradient</option>
              <option value="cityscape">Cityscape</option>
              <option value="nature">Nature</option>
              <option value="abstract">Abstract</option>
              <option value="magical">Magical</option>
              <option value="architectural">Architectural</option>
            </Select>
          </FormField>

          <FormField>
            <Label>Resolution</Label>
            <Select
              value={config.cover_art.resolution}
              onChange={(e) => updateConfig('cover_art', 'resolution', e.target.value)}
            >
              <option value="832x1216">832x1216 (Standard)</option>
              <option value="768x1152">768x1152 (Classic)</option>
              <option value="1024x1536">1024x1536 (High-res)</option>
              <option value="1200x1800">1200x1800 (Print)</option>
            </Select>
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Visual Effects</Label>
            <CheckboxGrid>
              {['none', 'sparkles', 'petals', 'light rays', 'magic aura', 'wind effects', 'particle effects', 'lens flare', 'motion blur'].map(effect => (
                <CheckboxLabel key={effect}>
                  <Checkbox
                    type="checkbox"
                    checked={config.cover_art.effects.includes(effect)}
                    onChange={() => toggleArrayValue('cover_art', 'effects', effect)}
                  />
                  {effect.charAt(0).toUpperCase() + effect.slice(1)}
                </CheckboxLabel>
              ))}
            </CheckboxGrid>
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <Label>Custom Cover Prompt</Label>
            <Textarea
              value={config.cover_art.custom_prompt}
              onChange={(e) => updateConfig('cover_art', 'custom_prompt', e.target.value)}
              placeholder="Additional custom prompts for cover art generation..."
              rows={3}
            />
          </FormField>
        </FormGrid>
      </TabContent>

      {/* Technical Configuration */}
      <TabContent $show={activeTab === 'technical'}>
        <FormGrid>
          <FormField>
            <Label>Generation Steps</Label>
            <RangeContainer>
              <RangeInput
                type="range"
                min="10"
                max="50"
                value={config.technical.steps}
                onChange={(e) => updateConfig('technical', 'steps', parseInt(e.target.value))}
              />
              <RangeValue>{config.technical.steps} steps</RangeValue>
            </RangeContainer>
          </FormField>

          <FormField>
            <Label>CFG Scale</Label>
            <RangeContainer>
              <RangeInput
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={config.technical.cfg_scale}
                onChange={(e) => updateConfig('technical', 'cfg_scale', parseFloat(e.target.value))}
              />
              <RangeValue>{config.technical.cfg_scale}</RangeValue>
            </RangeContainer>
          </FormField>

          <FormField>
            <Label>Seed (Optional)</Label>
            <Input
              type="number"
              value={config.technical.seed || ''}
              onChange={(e) => updateConfig('technical', 'seed', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leave empty for random"
            />
          </FormField>

          <FormField>
            <Label>Model Override</Label>
            <Select
              value={config.technical.model_override || ''}
              onChange={(e) => updateConfig('technical', 'model_override', e.target.value || null)}
            >
              <option value="">Use Default</option>
              <option value="xyn-ai/anything-v4.0">Anything v4.0</option>
              <option value="stabilityai/stable-diffusion-2-1">SD 2.1</option>
              <option value="runwayml/stable-diffusion-v1-5">SD 1.5</option>
            </Select>
          </FormField>

          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={config.technical.enable_upscaling}
              onChange={(e) => updateConfig('technical', 'enable_upscaling', e.target.checked)}
            />
            Enable High-Resolution Upscaling
          </CheckboxLabel>
        </FormGrid>
      </TabContent>

      {/* Preview */}
      <TabContent $show={activeTab === 'preview'}>
        <PreviewSection>
          <PreviewTitle>Cover Art Prompt Preview</PreviewTitle>
          <PreviewText>{generatePreviewPrompt()}</PreviewText>
        </PreviewSection>

        <PreviewSection>
          <PreviewTitle>Generation Summary</PreviewTitle>
          <PreviewText>
{`Story: ${config.story.title || 'Untitled'}
Genres: ${config.story.genres.join(', ')}
Setting: ${config.story.setting}
Main Character: ${config.characters.main_character.name || 'Unnamed'} (${config.characters.main_character.age}, ${config.characters.main_character.ethnicity}, ${config.characters.main_character.personality})
Cover Style: ${config.cover_art.style} - ${config.cover_art.composition}
Resolution: ${config.cover_art.resolution}
Steps: ${config.technical.steps}, CFG: ${config.technical.cfg_scale}`}
          </PreviewText>
        </PreviewSection>
      </TabContent>

      <Button
        onClick={() => onGenerate(config)}
        disabled={generating}
        style={{ 
          width: '100%', 
          marginTop: '2rem',
          padding: '1.5rem',
          fontSize: '1.1rem'
        }}
      >
        {generating ? '🎨 Generating Advanced Manhwa...' : '✨ Generate Advanced Manhwa'}
      </Button>
    </Container>
  );
};

export default AdvancedManhwaGenerator;