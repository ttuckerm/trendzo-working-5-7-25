'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  DollarSign,
  Calendar,
  Users,
  Eye,
  UserPlus,
  Info,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreatePlatformCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: 5000,
    pay_per_1k_views: 5,
    pay_per_signup: 25,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    has_end_date: false,
    requirements: {
      show_dps_score: true,
      mention_cleancopy: true,
      include_affiliate_link: true,
      min_video_length: 30,
    },
    targeting: {
      min_followers: 1000,
      min_avg_dps: 50,
      platforms: ['tiktok', 'instagram', 'youtube'],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/admin/rewards/platform-campaigns');
  };

  // Estimate calculations
  const estimatedViews = Math.floor((formData.budget * 0.6) / formData.pay_per_1k_views * 1000);
  const estimatedSignups = Math.floor((formData.budget * 0.4) / formData.pay_per_signup);
  const estimatedCostPerSignup = formData.budget / (estimatedSignups || 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Megaphone className="text-yellow-400" />
            Create Platform Campaign
          </h1>
          <p className="text-gray-400 mt-1">
            Set up a new campaign to promote CleanCopy
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Campaign Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., CleanCopy Launch Promo"
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this campaign is promoting..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Budget & Payments */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-green-400" />
            Budget & Pay Rates
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Total Budget *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  min={100}
                  className="w-full pl-8 pr-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Pay per 1K Views *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.pay_per_1k_views}
                  onChange={(e) => setFormData(prev => ({ ...prev, pay_per_1k_views: Number(e.target.value) }))}
                  min={1}
                  step={0.5}
                  className="w-full pl-8 pr-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Pay per Signup *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.pay_per_signup}
                  onChange={(e) => setFormData(prev => ({ ...prev, pay_per_signup: Number(e.target.value) }))}
                  min={5}
                  className="w-full pl-8 pr-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                  required
                />
              </div>
            </div>
          </div>

          {/* Estimates */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-3">
              <Info size={16} />
              Estimated Results
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{(estimatedViews / 1000000).toFixed(1)}M</div>
                <div className="text-xs text-gray-400">Estimated Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{estimatedSignups}</div>
                <div className="text-xs text-gray-400">Estimated Signups</div>
              </div>
              <div>
                <div className="text-2xl font-bold">${estimatedCostPerSignup.toFixed(2)}</div>
                <div className="text-xs text-gray-400">Est. Cost/Signup</div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-400" />
            Schedule
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_end_date}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      has_end_date: e.target.checked,
                      end_date: e.target.checked ? prev.end_date : ''
                    }))}
                    className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0f] text-yellow-500 focus:ring-yellow-500"
                  />
                  Set End Date
                </label>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                disabled={!formData.has_end_date}
                className={cn(
                  "w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50",
                  !formData.has_end_date && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Content Requirements</h2>
          
          <div className="space-y-3">
            {[
              { key: 'show_dps_score', label: 'Must show DPS score in video' },
              { key: 'mention_cleancopy', label: 'Must mention CleanCopy by name' },
              { key: 'include_affiliate_link', label: 'Must include affiliate link in bio/description' },
            ].map((req) => (
              <label key={req.key} className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.requirements[req.key as keyof typeof formData.requirements] as boolean}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, [req.key]: e.target.checked }
                  }))}
                  className="w-5 h-5 rounded border-gray-600 bg-[#0a0a0f] text-yellow-500 focus:ring-yellow-500"
                />
                <span>{req.label}</span>
              </label>
            ))}

            <div className="flex items-center gap-4 p-3 bg-[#0a0a0f] rounded-lg">
              <span className="text-gray-400">Minimum video length:</span>
              <select
                value={formData.requirements.min_video_length}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  requirements: { ...prev.requirements, min_video_length: Number(e.target.value) }
                }))}
                className="px-3 py-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded text-white focus:outline-none"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Targeting */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            Clipper Targeting
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Minimum Followers</label>
              <input
                type="number"
                value={formData.targeting.min_followers}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  targeting: { ...prev.targeting, min_followers: Number(e.target.value) }
                }))}
                min={0}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Minimum Avg DPS</label>
              <input
                type="number"
                value={formData.targeting.min_avg_dps}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  targeting: { ...prev.targeting, min_avg_dps: Number(e.target.value) }
                }))}
                min={0}
                max={100}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Allowed Platforms</label>
            <div className="flex gap-2">
              {['tiktok', 'instagram', 'youtube'].map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    const platforms = formData.targeting.platforms.includes(platform)
                      ? formData.targeting.platforms.filter(p => p !== platform)
                      : [...formData.targeting.platforms, platform];
                    setFormData(prev => ({
                      ...prev,
                      targeting: { ...prev.targeting, platforms }
                    }));
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg border transition-colors flex items-center gap-2',
                    formData.targeting.platforms.includes(platform)
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                      : 'bg-[#0a0a0f] border-[#1a1a2e] text-gray-400 hover:border-[#2a2a3e]'
                  )}
                >
                  {formData.targeting.platforms.includes(platform) && <Check size={16} />}
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Megaphone size={18} />
                  Launch Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


























































































