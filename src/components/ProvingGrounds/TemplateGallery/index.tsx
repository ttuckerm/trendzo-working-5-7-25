import React, { useEffect, useState } from 'react';
import { TemplateData } from '../types';
import styles from './TemplateGallery.module.css';
import TemplateCard from './TemplateCard';
import RecipeList from './RecipeList';

const TemplateGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trending');

  const defaultTemplates: TemplateData[] = [
    {
      id: '1',
      name: 'POV Experience',
      score: 97,
      description: 'First-person storytelling that creates instant connection',
      tags: ['Viral', 'Storytelling'],
      category: 'trending'
    },
    {
      id: '2',
      name: 'Transformation Reveal',
      score: 94,
      description: 'Before/after format driving massive engagement',
      tags: ['Transform', 'Visual'],
      category: 'trending'
    },
    {
      id: '3',
      name: 'Quick Tutorial',
      score: 91,
      description: '60-second educational content with high saves',
      tags: ['Education', 'Tutorial'],
      category: 'trending'
    },
    {
      id: '4',
      name: 'Comedy Sketch',
      score: 96,
      description: 'Relatable humor with explosive share potential',
      tags: ['Comedy', 'Relatable'],
      category: 'new'
    },
    {
      id: '5',
      name: 'Behind the Scenes',
      score: 89,
      description: 'Exclusive content building authentic connections',
      tags: ['Authentic', 'Exclusive'],
      category: 'new'
    },
  ];

  const [templates, setTemplates] = useState<TemplateData[]>(defaultTemplates);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/gallery/recipe-book');
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const mapped: TemplateData[] = data.map((t: any, idx: number) => ({
          id: t.template_id || t.id || String(idx + 1),
          name: t.name || 'Template',
          score: Math.round((t.success_rate ?? 0.85) * 100),
          description: t.description || 'Auto-discovered viral template',
          tags: Array.isArray(t.badges) ? t.badges : [],
          category: idx < 3 ? 'trending' : 'new'
        }));
        if (mapped.length > 0) setTemplates(mapped);
      } catch (_e) {
        // keep defaults on failure
      }
    };
    load();
  }, []);

  const filteredTemplates = templates.filter(t =>
    activeTab === 'trending' ? t.category === 'trending' :
    activeTab === 'new' ? t.category === 'new' :
    false
  );

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.templateShowcase}>
        <div className={styles.showcaseHeader}>
          <h3 className={styles.showcaseTitle}>🔥 Trending Templates</h3>
          <span className={styles.viewAllBtn}>Explore All →</span>
        </div>

        <div className={styles.templateGrid}>
          {templates.slice(0, 3).map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>

      <div className={styles.recipeBook}>
        <div className={styles.recipeHeader}>
          <h3 className={styles.recipeTitle}>📚 Recipe Book</h3>
          <p className={styles.recipeSubtitle}>Discover and analyze viral templates</p>

          <div className={styles.recipeTabs}>
            <div
              className={`${styles.recipeTab} ${activeTab === 'trending' ? styles.active : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              Trending
            </div>
            <div
              className={`${styles.recipeTab} ${activeTab === 'new' ? styles.active : ''}`}
              onClick={() => setActiveTab('new')}
            >
              New
            </div>
            <div
              className={`${styles.recipeTab} ${activeTab === 'favorites' ? styles.active : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorites
            </div>
          </div>
        </div>

        <div className={styles.recipeContent}>
          <RecipeList templates={filteredTemplates} />

          <div className={styles.viewFullRecipe}>
            <div className={styles.viewFullText}>
              📖 View Full Recipe Book →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery; 