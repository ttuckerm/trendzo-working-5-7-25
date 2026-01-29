'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, TrendingUp, Users, Star, ExternalLink } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  niche: string;
  platform: string[];
  viral_score: number;
  usage_count: number;
  is_featured: boolean;
  thumbnail_url?: string;
  description: string;
  created_at: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Mock data for demonstration
      const mockTemplates: Template[] = [
        {
          id: '1',
          name: 'Morning Routine Transformation',
          category: 'Lifestyle',
          niche: 'wellness',
          platform: ['instagram', 'tiktok'],
          viral_score: 0.89,
          usage_count: 1247,
          is_featured: true,
          description: 'Transform your mornings with this viral template',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Business Growth Story',
          category: 'Business',
          niche: 'entrepreneur',
          platform: ['linkedin', 'youtube'],
          viral_score: 0.76,
          usage_count: 834,
          is_featured: false,
          description: 'Share your business journey with impact',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Productivity Hack Reveal',
          category: 'Education',
          niche: 'productivity',
          platform: ['instagram', 'tiktok', 'youtube'],
          viral_score: 0.92,
          usage_count: 2156,
          is_featured: true,
          description: 'Share productivity secrets that go viral',
          created_at: new Date().toISOString()
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      setTemplates(templates.filter(t => t.id !== id));
      console.log('Template deleted:', id);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleToggleFeatured = async (template: Template) => {
    try {
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, is_featured: !t.is_featured } : t
      ));
      console.log('Template featured status updated:', template.id);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600">Manage viral video templates for MVP</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          <div className="text-sm text-gray-500">Total Templates</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">
            {templates.filter(t => t.is_featured).length}
          </div>
          <div className="text-sm text-gray-500">Featured</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {templates.reduce((sum, t) => sum + t.usage_count, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Uses</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">
            {(templates.reduce((sum, t) => sum + t.viral_score, 0) / templates.length * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500">Avg Viral Score</div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-500 relative">
              {template.thumbnail_url ? (
                <img 
                  src={template.thumbnail_url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                  🎬
                </div>
              )}
              {template.is_featured && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Featured
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{(template.viral_score * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{template.usage_count} uses</span>
                </div>
              </div>

              {/* Category and Niche */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {template.category}
                </span>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                  {template.niche}
                </span>
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.platform.map((p) => (
                  <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFeatured(template)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    template.is_featured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {template.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first viral template</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add First Template
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowAddModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            loadTemplates();
            setShowAddModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}

// Template Modal Component
function TemplateModal({ 
  template, 
  onClose, 
  onSave 
}: { 
  template: Template | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    category: template?.category || '',
    niche: template?.niche || 'general',
    description: template?.description || '',
    viral_score: template?.viral_score || 0.5,
    platform: template?.platform || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In real implementation, this would save to database
      console.log('Saving template:', formData);
      onSave();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, platform: [...formData.platform, platform] });
    } else {
      setFormData({ ...formData, platform: formData.platform.filter(p => p !== platform) });
    }
  };

  const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {template ? 'Edit Template' : 'Add New Template'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niche
            </label>
            <select
              value={formData.niche}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="creator">Creator</option>
              <option value="fitness">Fitness</option>
              <option value="education">Education</option>
              <option value="wellness">Wellness</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="productivity">Productivity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platforms
            </label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((platform) => (
                <label key={platform} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.platform.includes(platform)}
                    onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Viral Score (0-1)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.viral_score}
              onChange={(e) => setFormData({ ...formData, viral_score: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}