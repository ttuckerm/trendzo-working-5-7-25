'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Share, 
  TrendingUp,
  AlertTriangle,
  Filter,
  Search,
  Play,
  ExternalLink,
  Sparkles,
  Target
} from 'lucide-react';

interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  platform: string;
  creatorUsername: string;
  creatorFollowerCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  uploadDate: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  priority: number; // 1-5, 1 = highest
  aiRecommendation: 'approve' | 'reject' | 'review';
  aiConfidence: number; // 0-1
  aiReasoning: string;
  readyForTemplate: boolean;
  templateComplexity: 'simple' | 'moderate' | 'complex';
  createdAt: string;
  hashtags: string[];
  duration: number;
}

export default function ViralApprovalQueue() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high_priority' | 'ai_approved'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQueueItems();
  }, []);

  const loadQueueItems = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would fetch from the approval_queue table
      // For now, we'll use mock data that represents the actual structure
      const mockQueueItems: QueueItem[] = [
        {
          id: 'queue_1',
          videoId: 'viral_vid_001',
          title: 'This simple morning routine changed my life!',
          platform: 'instagram',
          creatorUsername: 'morning_guru',
          creatorFollowerCount: 85000,
          viewCount: 1200000,
          likeCount: 45000,
          commentCount: 2800,
          shareCount: 8500,
          uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          sourceUrl: 'https://instagram.com/p/ABC123',
          status: 'pending',
          priority: 1,
          aiRecommendation: 'approve',
          aiConfidence: 0.87,
          aiReasoning: 'Exceptional view-to-follower ratio (14.1x); High engagement rate (4.7%); Recent viral content',
          readyForTemplate: true,
          templateComplexity: 'moderate',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          hashtags: ['#morningroutine', '#productivity', '#selfcare', '#wellness'],
          duration: 28
        },
        {
          id: 'queue_2',
          videoId: 'viral_vid_002',
          title: 'POV: You discover this secret productivity hack',
          platform: 'tiktok',
          creatorUsername: 'productivity_hacks',
          creatorFollowerCount: 150000,
          viewCount: 2800000,
          likeCount: 185000,
          commentCount: 12500,
          shareCount: 28000,
          uploadDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          sourceUrl: 'https://tiktok.com/@productivity_hacks/video/123',
          status: 'pending',
          priority: 1,
          aiRecommendation: 'approve',
          aiConfidence: 0.93,
          aiReasoning: 'Exceptional viral performance; High engagement; POV framework detected; Optimal duration',
          readyForTemplate: true,
          templateComplexity: 'simple',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          hashtags: ['#fyp', '#productivity', '#lifehack', '#viral'],
          duration: 25
        },
        {
          id: 'queue_3',
          videoId: 'viral_vid_003',
          title: 'Why every entrepreneur needs to know this',
          platform: 'linkedin',
          creatorUsername: 'business_insights',
          creatorFollowerCount: 45000,
          viewCount: 180000,
          likeCount: 2800,
          commentCount: 450,
          shareCount: 850,
          uploadDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          sourceUrl: 'https://linkedin.com/posts/business-insights-123',
          status: 'pending',
          priority: 2,
          aiRecommendation: 'review',
          aiConfidence: 0.68,
          aiReasoning: 'Good view performance; Professional platform match; Moderate engagement',
          readyForTemplate: true,
          templateComplexity: 'moderate',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          hashtags: ['#entrepreneurship', '#business', '#startup', '#leadership'],
          duration: 45
        }
      ];

      setQueueItems(mockQueueItems);
    } catch (error) {
      console.error('Error loading queue items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      // Update item status
      setQueueItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'approved' as const }
          : item
      ));

      // In real implementation, this would:
      // 1. Update approval_queue table
      // 2. Trigger template generation pipeline
      // 3. Add to generated_templates table

      console.log(`✅ Approved video ${itemId} for template generation`);
    } catch (error) {
      console.error('Error approving item:', error);
    }
  };

  const handleReject = async (itemId: string) => {
    try {
      setQueueItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'rejected' as const }
          : item
      ));

      console.log(`❌ Rejected video ${itemId}`);
    } catch (error) {
      console.error('Error rejecting item:', error);
    }
  };

  const handleNeedsReview = async (itemId: string) => {
    try {
      setQueueItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'needs_review' as const, priority: Math.max(1, item.priority - 1) }
          : item
      ));

      console.log(`⚠️ Marked video ${itemId} as needs review`);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const filteredItems = queueItems.filter(item => {
    // Status filter
    if (filter === 'pending' && item.status !== 'pending') return false;
    if (filter === 'high_priority' && item.priority > 2) return false;
    if (filter === 'ai_approved' && item.aiRecommendation !== 'approve') return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.creatorUsername.toLowerCase().includes(searchLower) ||
        item.hashtags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const getPlatformEmoji = (platform: string) => {
    const emojis = {
      instagram: '📸',
      tiktok: '🎵',
      youtube: '📺',
      linkedin: '💼',
      twitter: '🐦',
      facebook: '👥'
    };
    return emojis[platform as keyof typeof emojis] || '📱';
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'text-red-400 bg-red-500/20';
    if (priority === 2) return 'text-orange-400 bg-orange-500/20';
    return 'text-blue-400 bg-blue-500/20';
  };

  const getAIRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'approve': return 'text-green-400 bg-green-500/20';
      case 'reject': return 'text-red-400 bg-red-500/20';
      case 'review': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const calculateEngagementRate = (item: QueueItem) => {
    if (item.viewCount === 0) return 0;
    return ((item.likeCount + item.commentCount + item.shareCount) / item.viewCount * 100).toFixed(2);
  };

  const calculateViralRatio = (item: QueueItem) => {
    if (item.creatorFollowerCount === 0) return 0;
    return (item.viewCount / item.creatorFollowerCount).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading viral approval queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
              Viral Approval Queue
            </span>
          </h1>
          <p className="text-gray-300">Review AI-detected viral videos for template generation</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos, creators, hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 appearance-none"
            >
              <option value="all">All Items</option>
              <option value="pending">Pending Review</option>
              <option value="high_priority">High Priority</option>
              <option value="ai_approved">AI Approved</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-green-400">
              {queueItems.filter(item => item.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-400">Pending Review</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-yellow-400">
              {queueItems.filter(item => item.priority === 1).length}
            </div>
            <div className="text-sm text-gray-400">High Priority</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-blue-400">
              {queueItems.filter(item => item.aiRecommendation === 'approve').length}
            </div>
            <div className="text-sm text-gray-400">AI Approved</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-2xl font-bold text-purple-400">
              {queueItems.filter(item => item.readyForTemplate).length}
            </div>
            <div className="text-sm text-gray-400">Ready for Templates</div>
          </div>
        </div>

        {/* Queue Items */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:bg-white/8 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlatformEmoji(item.platform)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>@{item.creatorUsername}</span>
                            <span>{formatNumber(item.creatorFollowerCount)} followers</span>
                            <span>{item.duration}s</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Priority & Status */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          P{item.priority}
                        </span>
                        {item.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                        {item.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {item.status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span className="text-sm">{formatNumber(item.viewCount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm">{formatNumber(item.likeCount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-sm">{formatNumber(item.commentCount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share className="w-4 h-4 text-purple-400" />
                        <span className="text-sm">{formatNumber(item.shareCount)}</span>
                      </div>
                    </div>

                    {/* Viral Metrics */}
                    <div className="flex items-center gap-6 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span>Engagement: {calculateEngagementRate(item)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span>Viral Ratio: {calculateViralRatio(item)}x</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Complexity: {item.templateComplexity}</span>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAIRecommendationColor(item.aiRecommendation)}`}>
                          AI: {item.aiRecommendation.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {Math.round(item.aiConfidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{item.aiReasoning}</p>
                    </div>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-2">
                      {item.hashtags.slice(0, 4).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300">
                          {tag}
                        </span>
                      ))}
                      {item.hashtags.length > 4 && (
                        <span className="px-2 py-1 bg-gray-500/20 rounded text-xs text-gray-400">
                          +{item.hashtags.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-3">
                    <button
                      onClick={() => window.open(item.sourceUrl, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </button>
                    
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={item.status !== 'pending'}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-xl text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    
                    <button
                      onClick={() => handleNeedsReview(item.id)}
                      disabled={item.status !== 'pending'}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-xl text-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Review
                    </button>
                    
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={item.status !== 'pending'}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-xl text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">No videos in queue</h3>
            <p className="text-gray-400">Start a scraping job to populate the approval queue</p>
          </div>
        )}
      </div>
    </div>
  );
}