'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  TrendingUp, 
  Target, 
  Zap,
  BarChart3,
  Eye,
  Filter,
  Search,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ViralFramework {
  id: string;
  name: string;
  category: 'hook' | 'content' | 'structure' | 'cta' | 'full_framework';
  description: string;
  
  // Core Framework Data
  triggers: string[];
  transitions: string[];
  visualCues: string[];
  structure: string;
  
  // Platform Effectiveness (1-5 scale)
  effectiveness: {
    instagram: number;
    tiktok: number;
    youtube: number;
    linkedin: number;
    twitter: number;
    facebook: number;
  };
  
  // Performance Metrics
  usage_count: number;
  success_rate: number;
  last_updated: string;
  saturation_level: number; // 0-100%
  
  // Meta Information
  created_by: string;
  tags: string[];
  examples: string[];
  notes: string;
  
  status: 'active' | 'testing' | 'deprecated' | 'archived';
}

export default function FrameworkReservoirManager() {
  const [frameworks, setFrameworks] = useState<ViralFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<ViralFramework | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      setIsLoading(true);
      
      // In production, load from database
      // For demo, use comprehensive mock data
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
            'Nobody talks about...',
            'The secret that...'
          ],
          transitions: [
            'But here\'s the thing...',
            'What happened next...',
            'The truth is...',
            'It turns out...'
          ],
          visualCues: [
            'close_up_face',
            'dramatic_zoom',
            'text_overlay',
            'suspenseful_pause'
          ],
          structure: 'Hook (3-5s) → Build anticipation (10-15s) → Reveal (remaining time)',
          effectiveness: {
            instagram: 4.5,
            tiktok: 4.8,
            youtube: 4.2,
            linkedin: 3.8,
            twitter: 3.5,
            facebook: 4.0
          },
          usage_count: 1247,
          success_rate: 78.5,
          last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          saturation_level: 45,
          created_by: 'admin',
          tags: ['engagement', 'hook', 'curiosity', 'viral'],
          examples: [
            'Did you know this simple morning routine can boost productivity by 300%?',
            'What if I told you there\'s a way to never feel tired again?'
          ],
          notes: 'Extremely effective for educational and self-improvement content',
          status: 'active'
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
          transitions: [
            'But then...',
            'Suddenly...',
            'Plot twist...',
            'Little did I know...',
            'Fast forward to...'
          ],
          visualCues: [
            'multiple_scenes',
            'emotional_expressions',
            'transition_effects',
            'revelation_moment'
          ],
          structure: 'Setup (20%) → Rising action (40%) → Climax (20%) → Resolution (20%)',
          effectiveness: {
            instagram: 4.7,
            tiktok: 4.9,
            youtube: 4.6,
            linkedin: 4.1,
            twitter: 3.2,
            facebook: 4.3
          },
          usage_count: 892,
          success_rate: 82.3,
          last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          saturation_level: 32,
          created_by: 'admin',
          tags: ['narrative', 'storytelling', 'emotional', 'complete'],
          examples: [
            'Three years ago I was broke. Then I discovered this one thing...',
            'So this happened at work yesterday and it changed everything...'
          ],
          notes: 'Best for personal stories and transformational content',
          status: 'active'
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
          transitions: [
            'Step 1:...',
            'Next, you need to...',
            'The key is...',
            'Pro tip:...'
          ],
          visualCues: [
            'screen_recording',
            'step_by_step_visual',
            'checklist_overlay',
            'before_after_shots'
          ],
          structure: 'Value delivery (60%) → Brief explanation (20%) → Soft CTA (20%)',
          effectiveness: {
            instagram: 4.3,
            tiktok: 4.1,
            youtube: 4.8,
            linkedin: 4.9,
            twitter: 4.2,
            facebook: 4.0
          },
          usage_count: 634,
          success_rate: 71.2,
          last_updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          saturation_level: 28,
          created_by: 'content_expert',
          tags: ['value', 'educational', 'professional', 'helpful'],
          examples: [
            'Here\'s exactly how to get 10k followers in 30 days (free template)',
            'Step by step guide to doubling your productivity'
          ],
          notes: 'Performs exceptionally well on professional platforms',
          status: 'active'
        },
        {
          id: 'before_after_transformation',
          name: 'Before/After Transformation',
          category: 'structure',
          description: 'Shows dramatic change or improvement over time',
          triggers: [
            'From this to this...',
            'Before vs after...',
            'My transformation...',
            '30 days ago vs today...'
          ],
          transitions: [
            'The difference is...',
            'What changed everything...',
            'The secret was...',
            'Here\'s how...'
          ],
          visualCues: [
            'split_screen',
            'before_after_shots',
            'time_lapse',
            'comparison_overlay'
          ],
          structure: 'Before state → Transformation process → After state → How-to',
          effectiveness: {
            instagram: 4.6,
            tiktok: 4.4,
            youtube: 4.3,
            linkedin: 3.9,
            twitter: 3.7,
            facebook: 4.2
          },
          usage_count: 756,
          success_rate: 75.8,
          last_updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          saturation_level: 52,
          created_by: 'viral_expert',
          tags: ['transformation', 'before_after', 'progress', 'visual'],
          examples: [
            'From 0 to 100k followers in 6 months',
            'My room transformation that went viral'
          ],
          notes: 'High saturation - consider new variations',
          status: 'testing'
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
      transitions: [],
      visualCues: [],
      structure: '',
      effectiveness: {
        instagram: 3,
        tiktok: 3,
        youtube: 3,
        linkedin: 3,
        twitter: 3,
        facebook: 3
      },
      usage_count: 0,
      success_rate: 0,
      last_updated: new Date().toISOString(),
      saturation_level: 0,
      created_by: 'admin',
      tags: [],
      examples: [],
      notes: '',
      status: 'testing'
    };

    setSelectedFramework(newFramework);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleSaveFramework = async () => {
    if (!selectedFramework) return;

    try {
      if (isCreating) {
        // Generate ID for new framework
        const id = selectedFramework.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const frameworkWithId = { ...selectedFramework, id };
        
        setFrameworks(prev => [...prev, frameworkWithId]);
        console.log('✅ New framework created:', frameworkWithId.name);
      } else {
        // Update existing framework
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
    const matchesStatus = filterStatus === 'all' || framework.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'testing': return 'text-yellow-400 bg-yellow-500/20';
      case 'deprecated': return 'text-orange-400 bg-orange-500/20';
      case 'archived': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hook': return 'text-purple-400 bg-purple-500/20';
      case 'content': return 'text-blue-400 bg-blue-500/20';
      case 'structure': return 'text-green-400 bg-green-500/20';
      case 'cta': return 'text-orange-400 bg-orange-500/20';
      case 'full_framework': return 'text-pink-400 bg-pink-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSaturationWarning = (level: number) => {
    if (level >= 80) return { color: 'text-red-400', icon: AlertTriangle, message: 'High saturation - avoid using' };
    if (level >= 60) return { color: 'text-orange-400', icon: AlertTriangle, message: 'Medium saturation - use sparingly' };
    if (level >= 40) return { color: 'text-yellow-400', icon: Eye, message: 'Moderate saturation - monitor usage' };
    return { color: 'text-green-400', icon: CheckCircle, message: 'Low saturation - safe to use' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading viral frameworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">
              <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
                Framework Reservoir Manager
              </span>
            </h1>
            <p className="text-gray-300">Manage viral content frameworks and patterns</p>
          </div>
          
          <button
            onClick={handleCreateFramework}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-semibold text-white hover:from-purple-700 hover:to-pink-600 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add Framework
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search frameworks, descriptions, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="hook">Hook</option>
            <option value="content">Content</option>
            <option value="structure">Structure</option>
            <option value="cta">Call to Action</option>
            <option value="full_framework">Full Framework</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="testing">Testing</option>
            <option value="deprecated">Deprecated</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-purple-400">{frameworks.length}</div>
            <div className="text-sm text-gray-400">Total Frameworks</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-green-400">
              {frameworks.filter(f => f.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-blue-400">
              {frameworks.reduce((sum, f) => sum + f.usage_count, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Usage</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-orange-400">
              {(frameworks.reduce((sum, f) => sum + f.success_rate, 0) / frameworks.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Avg Success Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Framework List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <AnimatePresence>
                {filteredFrameworks.map((framework) => {
                  const saturationWarning = getSaturationWarning(framework.saturation_level);
                  
                  return (
                    <motion.div
                      key={framework.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                        selectedFramework?.id === framework.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/8'
                      }`}
                      onClick={() => setSelectedFramework(framework)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{framework.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(framework.category)}`}>
                              {framework.category.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(framework.status)}`}>
                              {framework.status}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{framework.description}</p>
                          
                          {/* Performance Metrics */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-green-400" />
                              <span>{framework.success_rate}% success</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4 text-blue-400" />
                              <span>{framework.usage_count} uses</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <saturationWarning.icon className={`w-4 h-4 ${saturationWarning.color}`} />
                              <span className={saturationWarning.color}>{framework.saturation_level}% saturated</span>
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
                            className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFramework(framework.id);
                            }}
                            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Platform Effectiveness */}
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(framework.effectiveness).map(([platform, rating]) => (
                          <div key={platform} className="text-center">
                            <div className="text-xs text-gray-400 mb-1 capitalize">{platform}</div>
                            <div className="flex justify-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  className={`w-3 h-3 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Framework Details/Editor */}
          <div className="space-y-6">
            {selectedFramework ? (
              <motion.div
                key={selectedFramework.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {isEditing ? (isCreating ? 'Create Framework' : 'Edit Framework') : 'Framework Details'}
                  </h3>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveFramework}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700"
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
                        className="flex items-center gap-1 px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedFramework.name}
                        onChange={(e) => setSelectedFramework(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedFramework.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    {isEditing ? (
                      <textarea
                        value={selectedFramework.description}
                        onChange={(e) => setSelectedFramework(prev => prev ? {...prev, description: e.target.value} : null)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-20"
                      />
                    ) : (
                      <p className="text-gray-300">{selectedFramework.description}</p>
                    )}
                  </div>

                  {/* Triggers */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Trigger Phrases</label>
                    {isEditing ? (
                      <textarea
                        value={selectedFramework.triggers.join('\n')}
                        onChange={(e) => setSelectedFramework(prev => prev ? {...prev, triggers: e.target.value.split('\n').filter(t => t.trim())} : null)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-24"
                        placeholder="One trigger phrase per line"
                      />
                    ) : (
                      <div className="space-y-1">
                        {selectedFramework.triggers.map((trigger, index) => (
                          <div key={index} className="text-sm text-gray-300 bg-white/5 px-2 py-1 rounded">
                            "{trigger}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Saturation Level */}
                  {!isCreating && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Saturation Level</label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              selectedFramework.saturation_level >= 80 ? 'bg-red-500' :
                              selectedFramework.saturation_level >= 60 ? 'bg-orange-500' :
                              selectedFramework.saturation_level >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${selectedFramework.saturation_level}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{selectedFramework.saturation_level}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {getSaturationWarning(selectedFramework.saturation_level).message}
                      </p>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {!isCreating && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-400">{selectedFramework.success_rate}%</div>
                        <div className="text-sm text-gray-400">Success Rate</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-400">{selectedFramework.usage_count}</div>
                        <div className="text-sm text-gray-400">Total Uses</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Framework</h3>
                <p className="text-gray-400">Choose a framework from the list to view details or edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}