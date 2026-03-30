'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuroraText } from '@/components/ui/aurora-text';

export default function MarketingStudioPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleMagicAction = async (action: string) => {
    alert(`Marketing Studio: ${action} activated!`);
    // In real implementation, this would call your AI services
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <AuroraText>🎯 Marketing Studio</AuroraText>
          </h1>
          <p className="text-gray-600 mt-2">Super Admin Ultra-Charged Marketing Tools</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold">
          SUPER ADMIN MODE
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'templates', 'campaigns', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-black p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400">Total Views</h3>
              <p className="text-2xl font-bold text-white">12.5M</p>
              <p className="text-sm text-green-500">📈 +23%</p>
            </div>
            <div className="bg-black p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400">Conversions</h3>
              <p className="text-2xl font-bold text-white">45.2K</p>
              <p className="text-sm text-green-500">📈 +18%</p>
            </div>
            <div className="bg-black p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400">Avg ROI</h3>
              <p className="text-2xl font-bold text-white">385%</p>
              <p className="text-sm text-green-500">📈 +42%</p>
            </div>
            <div className="bg-black p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <h3 className="text-sm font-medium text-gray-400">Viral Score</h3>
              <p className="text-2xl font-bold text-white">94/100</p>
              <p className="text-sm text-green-500">📈 Top 1%</p>
            </div>
          </div>

          {/* Magic Actions */}
          <div className="bg-black p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-white">✨ Magic Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleMagicAction('Copy Viral Winner')}
                className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <div className="text-2xl mb-2">✨</div>
                <div className="font-bold">Copy Viral Winner</div>
                <div className="text-sm opacity-80">Auto-fill from 1M+ view video</div>
              </button>
              
              <button
                onClick={() => handleMagicAction('Optimize for Viral')}
                className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-bold">Optimize for Viral</div>
                <div className="text-sm opacity-80">AI-powered improvements</div>
              </button>
              
              <button
                onClick={() => handleMagicAction('Platform Optimize')}
                className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-bold">Platform Optimize</div>
                <div className="text-sm opacity-80">Multi-platform magic</div>
              </button>
            </div>
          </div>

          {/* AI Content Generation */}
          <div className="bg-black p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-white">🧠 AI Content Generation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleMagicAction('Competitor Analysis')}
                className="p-4 border border-gray-600 rounded-lg hover:bg-gray-800 text-left"
              >
                <div className="text-2xl mb-2">👁️</div>
                <h3 className="font-medium text-white">Competitor Analysis</h3>
                <p className="text-sm text-gray-400">Analyze and outperform competitors</p>
              </button>
              
              <button
                onClick={() => handleMagicAction('Success Stories')}
                className="p-4 border border-gray-600 rounded-lg hover:bg-gray-800 text-left"
              >
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-medium text-white">Success Stories</h3>
                <p className="text-sm text-gray-400">Generate compelling case studies</p>
              </button>
              
              <button
                onClick={() => handleMagicAction('Feature Showcase')}
                className="p-4 border border-gray-600 rounded-lg hover:bg-gray-800 text-left"
              >
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-medium text-white">Feature Showcase</h3>
                <p className="text-sm text-gray-400">Highlight product features</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">📋 Viral Template Library</h2>
          <p className="text-gray-600 mb-6">Manage and analyze your viral template collection.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 rounded mb-3 flex items-center justify-center text-2xl">✨</div>
              <h3 className="font-medium">Template 1</h3>
              <p className="text-sm text-gray-600 mb-3">Viral score: 86%</p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
                Edit Template
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <div className="h-32 bg-gradient-to-r from-blue-100 to-cyan-100 rounded mb-3 flex items-center justify-center text-2xl">⚡</div>
              <h3 className="font-medium">Template 2</h3>
              <p className="text-sm text-gray-600 mb-3">Viral score: 92%</p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
                Edit Template
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">📈 Marketing Campaigns</h2>
          <p className="text-gray-600 mb-6">Create and manage your viral marketing campaigns.</p>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium">Q4 Product Launch</h3>
                <p className="text-sm text-gray-600">Status: Active</p>
              </div>
              <div className="space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Edit</button>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Launch</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">📊 Performance Analytics</h2>
          <p className="text-gray-600 mb-6">Detailed analytics and performance insights.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Top Performing Content</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tech Product Demo</span>
                  <span className="text-green-600 font-medium">2.5M views</span>
                </div>
                <div className="flex justify-between">
                  <span>Behind the Scenes</span>
                  <span className="text-green-600 font-medium">2.2M views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-black p-4 rounded-lg shadow-lg border border-gray-700">
        <h3 className="font-medium mb-2 text-white">Quick Access</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-700">
            ← Back to Admin
          </Link>
          <Link href="/admin/templates" className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-700">
            Template Manager
          </Link>
          <Link href="/admin/analytics" className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-700">
            Full Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}