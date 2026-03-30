import React from 'react';
import { TemplateData } from '../types';
import styles from './TemplateGallery.module.css';

const RecipeList: React.FC<{ templates: TemplateData[] }> = ({ templates }) => {
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category === 'trending' ? '🔥 Trending Templates' : '✨ New Discoveries';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, TemplateData[]>);

  return (
    <>
      {Object.entries(groupedTemplates).map(([category, items]) => (
        <div key={category} className={styles.recipeRow}>
          <h4 className={styles.recipeRowTitle}>{category}</h4>
          <div className={styles.recipeCards}>
            {items.map(template => (
              <div key={template.id} className={styles.recipeCard}>
                <div className={styles.recipeCardHeader}>
                  <div className={styles.recipeName}>{template.name}</div>
                  <div className={styles.recipeScore}>{template.score}%</div>
                </div>
                <p className={styles.recipeDescription}>{template.description}</p>
                <div className={styles.recipeTags}>
                  {template.tags.map((tag, i) => (
                    <span key={i} className={styles.recipeTag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default RecipeList; 