'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MiniApp {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  creator_name: string;
  icon: string;
  rating: number;
  rating_count: number;
  install_count: number;
  version: string;
}

export default function MarketplacePage() {
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<MiniApp[]>([]);
  const [userApps, setUserApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'price'>('popular');

  // Modal
  const [selectedApp, setSelectedApp] = useState<MiniApp | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchApps();
    fetchUserApps();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [apps, searchQuery, selectedCategory, sortBy]);

  const fetchApps = async () => {
    const { data, error } = await supabase
      .from('mini_apps')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching apps:', error);
    } else {
      setApps(data || []);
    }
    setLoading(false);
  };

  const fetchUserApps = async () => {
    // For now, use mock user ID
    const userId = 'default_user';

    const { data, error } = await supabase
      .from('user_apps')
      .select('app_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user apps:', error);
    } else {
      const installedIds = new Set(data?.map((ua: any) => ua.app_id) || []);
      setUserApps(installedIds);
    }
  };

  const applyFilters = () => {
    let filtered = [...apps];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'popular') {
      filtered.sort((a, b) => b.install_count - a.install_count);
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => a.name.localeCompare(b.name)); // Mock: alphabetical
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    }

    setFilteredApps(filtered);
  };

  const categories = ['All', ...Array.from(new Set(apps.map(app => app.category)))];

  const handleInstall = async (app: MiniApp) => {
    setInstalling(true);

    try {
      const userId = 'default_user';

      // Check if app is paid
      if (app.price > 0) {
        // Calculate revenue split
        const creatorShare = app.price * 0.80;
        const platformShare = app.price * 0.20;

        // Record transaction
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            app_id: app.id,
            amount: app.price,
            creator_share: creatorShare,
            platform_share: platformShare,
            transaction_type: 'purchase',
            status: 'completed',
          });

        if (txError) throw txError;
      }

      // Install app
      const { error: installError } = await supabase
        .from('user_apps')
        .insert({
          user_id: userId,
          app_id: app.id,
        });

      if (installError) {
        if (installError.code === '23505') { // Unique constraint violation
          alert('App already installed!');
        } else {
          throw installError;
        }
      } else {
        alert(`Successfully installed ${app.name}!`);
        setUserApps(prev => new Set([...prev, app.id]));
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Installation error:', error);
      alert('Failed to install app. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (app: MiniApp) => {
    const confirm = window.confirm(`Uninstall ${app.name}?`);
    if (!confirm) return;

    const userId = 'default_user';

    const { error } = await supabase
      .from('user_apps')
      .delete()
      .eq('user_id', userId)
      .eq('app_id', app.id);

    if (error) {
      console.error('Uninstall error:', error);
      alert('Failed to uninstall app');
    } else {
      alert(`${app.name} uninstalled`);
      setUserApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(app.id);
        return newSet;
      });
    }
  };

  const isInstalled = (appId: string) => userApps.has(appId);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mini App Marketplace</h1>
        <p className="text-gray-400">Extend CleanCopy with powerful third-party tools</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Recently Added</option>
          <option value="price">Price: Low to High</option>
        </select>
      </div>

      {/* App Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading apps...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map(app => (
            <div
              key={app.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition cursor-pointer"
              onClick={() => {
                setSelectedApp(app);
                setShowDetailModal(true);
              }}
            >
              {/* Icon & Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{app.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{app.name}</h3>
                  <span className="inline-block px-3 py-1 bg-blue-900 text-blue-300 text-xs rounded-full">
                    {app.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {app.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⭐ {app.rating}</span>
                  <span className="text-gray-500">({app.rating_count})</span>
                </div>
                <div className="text-gray-500">
                  {app.install_count.toLocaleString()} installs
                </div>
              </div>

              {/* Price & Button */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {app.price === 0 ? (
                    <span className="text-green-400">FREE</span>
                  ) : (
                    <span>${app.price}/mo</span>
                  )}
                </div>
                {isInstalled(app.id) ? (
                  <span className="px-4 py-2 bg-green-900 text-green-300 rounded-lg text-sm">
                    ✓ Installed
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstall(app);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && filteredApps.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No apps found matching your criteria
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="text-6xl">{selectedApp.icon}</div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{selectedApp.name}</h2>
                <span className="inline-block px-3 py-1 bg-blue-900 text-blue-300 text-sm rounded-full mb-2">
                  {selectedApp.category}
                </span>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>by {selectedApp.creator_name}</span>
                  <span>•</span>
                  <span>v{selectedApp.version}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-800">
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  ⭐ {selectedApp.rating}
                </div>
                <div className="text-xs text-gray-500">{selectedApp.rating_count} ratings</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {selectedApp.install_count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">installs</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {selectedApp.price === 0 ? (
                    <span className="text-green-400">FREE</span>
                  ) : (
                    <span>${selectedApp.price}/mo</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">About This App</h3>
              <p className="text-gray-300">{selectedApp.description}</p>
            </div>

            {/* Screenshots placeholder */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Screenshots</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 h-40 rounded-lg flex items-center justify-center text-gray-600">
                  Screenshot 1
                </div>
                <div className="bg-gray-800 h-40 rounded-lg flex items-center justify-center text-gray-600">
                  Screenshot 2
                </div>
              </div>
            </div>

            {/* Install/Uninstall Button */}
            <div className="flex gap-4">
              {isInstalled(selectedApp.id) ? (
                <button
                  onClick={() => handleUninstall(selectedApp)}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
                >
                  Uninstall
                </button>
              ) : (
                <button
                  onClick={() => handleInstall(selectedApp)}
                  disabled={installing}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {installing ? 'Installing...' : `Install ${selectedApp.price > 0 ? `($${selectedApp.price}/mo)` : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
