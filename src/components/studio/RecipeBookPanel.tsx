'use client';

import React, { useState, useEffect } from 'react';

// Updated interface to match our new recipe structure
interface ContentRecipe {
  id: string;
  title: string;
  description: string;
  success_rate: number;
  patterns: any[]; // Kept generic for now
  created_at: string;
}

interface RecipeBookPanelProps {
  onSelectRecipe?: (recipe: any) => void;
}

export const RecipeBookPanel: React.FC<RecipeBookPanelProps> = ({ onSelectRecipe }) => {
  const [recipes, setRecipes] = useState<ContentRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from the new endpoint
      const response = await fetch('/api/recipes/today');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch recipes');
      }
      const data: ContentRecipe[] = await response.json();
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      console.error('Recipe book fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'sound': return '🎵';
      case 'hashtag': return '#️⃣';
      case 'keyword': return '🔑';
      default: return '💡';
    }
  };


  if (loading) {
    return (
      <div className="recipe-book-panel">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Fetching Today's Viral Recipes...</p>
        </div>
        <style jsx>{`
          .recipe-book-panel {
            background: #0F0F0F;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
            border: 1px solid #262626;
          }
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #262626;
            border-top: 3px solid #FF4444;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-book-panel">
        <div className="error-container">
          <h3>❌ Could Not Load Recipes</h3>
          <p>{error}</p>
          <button onClick={fetchRecipes} className="retry-button">
            Try Again
          </button>
        </div>
        <style jsx>{`
          .recipe-book-panel {
            background: #0F0F0F;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
            border: 1px solid #262626;
          }
          .error-container {
            text-align: center;
            padding: 40px;
          }
          .retry-button {
            background: #FF4444;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 16px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="recipe-book-panel">
      <div className="recipe-header">
        <h2>🍽️ Today's Recipe Book</h2>
        <div className="recipe-meta">
          <span className="recipe-date">{formatDate(new Date().toISOString())}</span>
          <button onClick={fetchRecipes} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {recipes.length === 0 ? (
        <div className="empty-state">
          <h3>No Recipes Generated Today</h3>
          <p>Run the daily generation job to discover new viral patterns.</p>
        </div>
      ) : (
        <div className="recipe-sections">
          <div className="template-grid">
            {recipes.map(recipe => (
              <div 
                key={recipe.id} 
                className="recipe-card hot clickable"
                onClick={() => {
                  if (onSelectRecipe) {
                    // Transform recipe to match the Recipe interface expected by the editor
                    const recipeData = {
                      id: recipe.id,
                      name: recipe.title,
                      description: recipe.description,
                      tags: recipe.patterns?.map((p: any) => p.value) || [],
                      template_data: recipe
                    };
                    onSelectRecipe(recipeData);
                  }
                }}
              >
                <div className="recipe-card-header">
                  <div className="recipe-name">{recipe.title}</div>
                  <div className="use-recipe-icon">✨</div>
                </div>
                <div className="recipe-metrics">
                  <div className="recipe-success">
                    {`🔥 ${(recipe.success_rate * 100).toFixed(0)}% Success Rate`}
                  </div>
                </div>
                <div className="recipe-desc">{recipe.description}</div>
                <div className="recipe-patterns">
                  <h4>Key Patterns:</h4>
                  {Array.isArray(recipe.patterns) && recipe.patterns.map((pattern, index) => (
                    <div key={index} className="pattern-tag">
                      {getPatternIcon(pattern.type)} {pattern.value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .recipe-book-panel {
          background: #0F0F0F;
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          border: 1px solid #262626;
        }

        .recipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .recipe-header h2 {
          font-size: 28px;
          margin: 0;
          color: #FF4444;
        }

        .recipe-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .recipe-date {
          color: #888;
          font-size: 14px;
        }

        .refresh-button {
          background: #262626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .refresh-button:hover {
          background: #404040;
        }

        .recipe-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .recipe-section h3 {
          font-size: 20px;
          margin: 0 0 16px 0;
          color: #fff;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .recipe-card {
          background: #1A1A1A;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #333;
          transition: all 0.2s ease;
        }

        .recipe-card:hover {
          transform: translateY(-2px);
          border-color: #404040;
        }
        
        .recipe-card.clickable {
          cursor: pointer;
        }
        
        .recipe-card.clickable:hover {
          border-color: #FF4444;
          box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
        }
        
        .use-recipe-icon {
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 20px;
        }
        
        .recipe-card.clickable:hover .use-recipe-icon {
          opacity: 1;
        }

        .recipe-card.hot {
          border-left: 4px solid #FF4444;
        }

        .recipe-card.cooling {
          border-left: 4px solid #FFA500;
        }

        .recipe-card.new {
          border-left: 4px solid #4CAF50;
        }

        .recipe-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .recipe-name {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          line-height: 1.3;
        }

        .recipe-status {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .recipe-metrics {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .recipe-success {
          font-size: 18px;
          font-weight: 700;
          color: #4CAF50;
        }

        .recipe-usage {
          font-size: 14px;
          color: #888;
        }

        .recipe-desc {
          font-size: 14px;
          color: #ccc;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .recipe-framework {
          font-size: 12px;
          color: #666;
          background: #262626;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .recipe-patterns {
          margin-top: 12px;
          font-size: 14px;
        }
        .pattern-tag {
          background: #333;
          border-radius: 4px;
          padding: 4px 8px;
          display: inline-block;
          margin-right: 8px;
          margin-top: 8px;
        }

        .recipe-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #262626;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
};