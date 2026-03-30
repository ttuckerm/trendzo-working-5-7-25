'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TemplateData {
  id: string;
  title: string;
  description: string;
  success_rate: number;
  patterns: any[];
  created_at: string;
}

interface TemplateGalleryProps {
  onTemplateSelect?: (template: any) => void;
}

const mockTemplates = {
  trending: [
    {
      id: '1',
      name: 'POV Experience',
      description: 'First-person storytelling that creates instant connection',
      score: 97,
      tags: ['Viral', 'Storytelling']
    },
    {
      id: '2', 
      name: 'Transformation Reveal',
      description: 'Before/after format driving massive engagement',
      score: 94,
      tags: ['Transform', 'Visual']
    },
    {
      id: '3',
      name: 'Quick Tutorial',
      description: '60-second educational content with high saves',
      score: 91,
      tags: ['Education', 'Tutorial']
    }
  ],
  new: [
    {
      id: '4',
      name: 'Comedy Sketch',
      description: 'Relatable humor with explosive share potential',
      score: 96,
      tags: ['Comedy', 'Relatable']
    },
    {
      id: '5',
      name: 'Behind the Scenes',
      description: 'Exclusive content building authentic connections',
      score: 89,
      tags: ['Authentic', 'Exclusive']
    }
  ]
};

export default function TemplateGallery({ onTemplateSelect }: TemplateGalleryProps) {
  const [activeTab, setActiveTab] = useState('trending');
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('TemplateGallery rendering with:', { activeTab, templates: templates?.length, loading });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/gallery/recipe-book');
      if (response.ok) {
        const data = await response.json();
        setTemplates(
          (data || []).map((t: any) => ({
            id: t.template_id || t.id,
            name: t.name,
            description: t.description || '',
            score: Math.round((t.success_rate ?? 0.85) * 100),
            patterns: (t.badges || []).map((b: string) => ({ value: b })),
          }))
        );
      } else {
        console.warn('recipe-book API failed, using empty list');
        setTemplates([]);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: any) => {
    if (onTemplateSelect) {
      const recipeData = {
        id: template.id,
        name: template.name || template.title,
        description: template.description,
        tags: template.tags || template.patterns?.map((p: any) => p.value) || [],
        template_data: template
      };
      onTemplateSelect(recipeData);
    }
  };

  const renderTemplateCards = (templateList: any[]) => (
    <div className="template-cards">
      {templateList.map((template) => (
        <div 
          key={template.id}
          className="template-card"
          onClick={() => handleTemplateClick(template)}
        >
          <div className="template-card-header">
            <div className="template-name">{template.name || template.title}</div>
            <div className="template-score">{template.score || Math.round((template.success_rate || 0.85) * 100)}%</div>
          </div>
          <p className="template-description">{template.description}</p>
          <div className="template-tags">
            {(template.tags || template.patterns?.slice(0, 2) || []).map((tag: any, index: number) => (
              <span key={index} className="template-tag">
                {typeof tag === 'string' ? tag : tag.value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="template-gallery">
      <div className="gallery-header">
        <h2 className="gallery-title">
          📚 Template Gallery
        </h2>
        <p className="gallery-subtitle">Discover and analyze viral templates</p>
        
        <div className="gallery-tabs">
          <div 
            className={`gallery-tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            Trending
          </div>
          <div 
            className={`gallery-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New
          </div>
          <div 
            className={`gallery-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
          </div>
        </div>
      </div>
      
      <div className="gallery-content">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
            Loading templates...
          </div>
        ) : (
          <>
            {/* Trending Templates Row */}
            {activeTab === 'trending' && (
              <div className="template-row">
                <h3 className="template-row-title">🔥 Trending Templates</h3>
                {templates.length > 0 ? 
                  renderTemplateCards(templates.slice(0, 3)) : 
                  renderTemplateCards(mockTemplates.trending)
                }
              </div>
            )}

            {/* New Discoveries Row */}
            {activeTab === 'new' && (
              <div className="template-row">
                <h3 className="template-row-title">✨ New Discoveries</h3>
                {templates.length > 3 ? 
                  renderTemplateCards(templates.slice(3, 6)) : 
                  renderTemplateCards(mockTemplates.new)
                }
              </div>
            )}

            {/* Favorites */}
            {activeTab === 'favorites' && (
              <div className="template-row">
                <h3 className="template-row-title">⭐ Your Favorites</h3>
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  No favorites yet. Click templates to add to favorites.
                </div>
              </div>
            )}

            {/* Bridge to Full Recipe Book */}
            <Link href="/admin/viral-recipe-book" className="view-all-recipes">
              <div className="view-all-text">
                📖 View Full Recipe Book →
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}