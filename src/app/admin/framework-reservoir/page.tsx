'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Target, BarChart3, Search, Filter } from 'lucide-react';

interface ViralFramework {
  id: string;
  name: string;
  category: 'hook' | 'content' | 'structure' | 'cta' | 'full_framework';
  description: string;
  triggers: string[];
  success_rate: number;
  usage_count: number;
  status: 'active' | 'testing' | 'deprecated' | 'archived';
  created_by: string;
  tags: string[];
  examples: string[];
}

export default function FrameworkReservoirManager() {
  const [frameworks, setFrameworks] = useState<ViralFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<ViralFramework | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockFrameworks: ViralFramework[] = [
        {
          id: 'curiosity_gap',
          name: 'Curiosity Gap Hook',
          category: 'hook',
          description: 'Creates anticipation by promising information without revealing it immediately',
          triggers: [
            'Did you know...',
            'What if I told you...',
            'This will blow your mind...',
            'Nobody talks about...'
          ],
          success_rate: 78.5,
          usage_count: 1247,
          status: 'active',
          created_by: 'admin',
          tags: ['engagement', 'hook', 'curiosity', 'viral'],
          examples: [
            'Did you know this simple morning routine can boost productivity by 300%?',
            'What if I told you there\'s a way to never feel tired again?'
          ]
        },
        {
          id: 'story_arc',
          name: 'Story Arc Framework',
          category: 'full_framework',
          description: 'Complete narrative structure with setup, conflict, and resolution',
          triggers: [
            'So this happened...',
            'Let me tell you a story...',
            'Three years ago...',
            'I\'ll never forget...'
          ],
          success_rate: 82.3,
          usage_count: 892,
          status: 'active',
          created_by: 'admin',
          tags: ['narrative', 'storytelling', 'emotional', 'complete'],
          examples: [
            'Three years ago I was broke. Then I discovered this one thing...',
            'So this happened at work yesterday and it changed everything...'
          ]
        },
        {
          id: 'value_first',
          name: 'Value-First Approach',
          category: 'structure',
          description: 'Leads with immediate value before any personal branding or promotion',
          triggers: [
            'Here\'s exactly how to...',
            'Free template:...',
            'Step by step guide:...',
            'Here\'s what works...'
          ],
          success_rate: 71.2,
          usage_count: 634,
          status: 'active',
          created_by: 'content_expert',
          tags: ['value', 'educational', 'professional', 'helpful'],
          examples: [
            'Here\'s exactly how to get 10k followers in 30 days (free template)',
            'Step by step guide to doubling your productivity'
          ]
        }
      ];

      setFrameworks(mockFrameworks);
    } catch (error) {
      console.error('Error loading frameworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFramework = () => {
    const newFramework: ViralFramework = {
      id: '',
      name: '',
      category: 'hook',
      description: '',
      triggers: [],
      success_rate: 0,
      usage_count: 0,
      status: 'testing',
      created_by: 'admin',
      tags: [],
      examples: []
    };

    setSelectedFramework(newFramework);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleSaveFramework = async () => {
    if (!selectedFramework) return;

    try {
      if (isCreating) {
        const id = selectedFramework.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const frameworkWithId = { ...selectedFramework, id };
        
        setFrameworks(prev => [...prev, frameworkWithId]);
        console.log('✅ New framework created:', frameworkWithId.name);
      } else {
        setFrameworks(prev => prev.map(f => 
          f.id === selectedFramework.id ? selectedFramework : f
        ));
        console.log('✅ Framework updated:', selectedFramework.name);
      }

      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving framework:', error);
    }
  };

  const handleDeleteFramework = async (frameworkId: string) => {
    try {
      setFrameworks(prev => prev.filter(f => f.id !== frameworkId));
      setSelectedFramework(null);
      console.log('🗑️ Framework deleted:', frameworkId);
    } catch (error) {
      console.error('Error deleting framework:', error);
    }
  };

  const filteredFrameworks = frameworks.filter(framework => {
    const matchesSearch = framework.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         framework.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         framework.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || framework.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'deprecated': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hook': return 'bg-purple-100 text-purple-800';
      case 'content': return 'bg-blue-100 text-blue-800';
      case 'structure': return 'bg-green-100 text-green-800';
      case 'cta': return 'bg-orange-100 text-orange-800';
      case 'full_framework': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading viral frameworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Framework Reservoir Manager</h1>
          <p className="text-gray-600">Manage viral content frameworks and patterns</p>
        </div>
        
        <button
          onClick={handleCreateFramework}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Framework
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search frameworks, descriptions, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="hook">Hook</option>
          <option value="content">Content</option>
          <option value="structure">Structure</option>
          <option value="cta">Call to Action</option>
          <option value="full_framework">Full Framework</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{frameworks.length}</div>
          <div className="text-sm text-gray-500">Total Frameworks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {frameworks.filter(f => f.status === 'active').length}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">
            {frameworks.reduce((sum, f) => sum + f.usage_count, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Usage</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">
            {(frameworks.reduce((sum, f) => sum + f.success_rate, 0) / frameworks.length).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Avg Success Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Framework List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredFrameworks.map((framework) => (
              <div
                key={framework.id}
                className={`p-6 rounded-lg border cursor-pointer transition-all ${
                  selectedFramework?.id === framework.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedFramework(framework)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{framework.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(framework.category)}`}>
                        {framework.category.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(framework.status)}`}>
                        {framework.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{framework.description}</p>
                    
                    {/* Performance Metrics */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-green-600" />
                        <span>{framework.success_rate}% success</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <span>{framework.usage_count} uses</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFramework(framework);
                        setIsEditing(true);
                        setIsCreating(false);
                      }}
                      className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFramework(framework.id);
                      }}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {framework.tags.slice(0, 4).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework Details/Editor */}
        <div>
          {selectedFramework ? (
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditing ? (isCreating ? 'Create Framework' : 'Edit Framework') : 'Framework Details'}
                </h3>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveFramework}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        if (isCreating) setSelectedFramework(null);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedFramework.name}
                      onChange={(e) => setSelectedFramework(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-600">{selectedFramework.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  {isEditing ? (
                    <textarea
                      value={selectedFramework.description}
                      onChange={(e) => setSelectedFramework(prev => prev ? {...prev, description: e.target.value} : null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                    />
                  ) : (
                    <p className="text-gray-600">{selectedFramework.description}</p>
                  )}
                </div>

                {/* Triggers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Phrases</label>
                  {isEditing ? (
                    <textarea
                      value={selectedFramework.triggers.join('\n')}
                      onChange={(e) => setSelectedFramework(prev => prev ? {...prev, triggers: e.target.value.split('\n').filter(t => t.trim())} : null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      placeholder="One trigger phrase per line"
                    />
                  ) : (
                    <div className="space-y-1">
                      {selectedFramework.triggers.map((trigger, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          "{trigger}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                {!isCreating && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">{selectedFramework.success_rate}%</div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">{selectedFramework.usage_count}</div>
                      <div className="text-sm text-gray-500">Total Uses</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Framework</h3>
              <p className="text-gray-600">Choose a framework from the list to view details or edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}