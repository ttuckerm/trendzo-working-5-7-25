'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NICHES = [
  { id: 'business', title: 'Business Leader', emoji: '💼', color: 'from-blue-500 to-purple-500' },
  { id: 'creator', title: 'Content Creator', emoji: '🎨', color: 'from-purple-500 to-pink-500' },
  { id: 'fitness', title: 'Fitness Guru', emoji: '💪', color: 'from-pink-500 to-red-500' },
  { id: 'education', title: 'Educator', emoji: '🎓', color: 'from-green-500 to-blue-500' }
];

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0077B5' },
  { id: 'twitter', name: 'Twitter', color: '#1DA1F2' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F' }
];

export default function CampaignLauncher() {
  const router = useRouter();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleLaunch = () => {
    if (selectedNiche && selectedPlatform) {
      router.push(`/viral-template-landing?niche=${selectedNiche}&platform=${selectedPlatform}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
              Campaign Command Center
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Select your niche and platform to launch optimized viral campaigns
          </p>
        </div>

        {/* Niche Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Niche</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NICHES.map((niche) => (
              <button
                key={niche.id}
                onClick={() => setSelectedNiche(niche.id)}
                className={`p-6 rounded-2xl transition-all duration-300 ${
                  selectedNiche === niche.id
                    ? 'ring-2 ring-purple-500 bg-white/10'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-4xl mb-2">{niche.emoji}</div>
                <div className="font-semibold">{niche.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`p-6 rounded-2xl transition-all duration-300 ${
                  selectedPlatform === platform.id
                    ? 'ring-2 ring-purple-500 bg-white/10'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                style={{
                  borderColor: selectedPlatform === platform.id ? platform.color : 'transparent'
                }}
              >
                <div className="font-semibold" style={{ color: platform.color }}>
                  {platform.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <div className="text-center">
          <button
            onClick={handleLaunch}
            disabled={!selectedNiche || !selectedPlatform}
            className={`px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
              selectedNiche && selectedPlatform
                ? 'bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] hover:scale-105 shadow-lg shadow-purple-500/50'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            Launch Campaign 🚀
          </button>
        </div>

        {/* Current Selection Display */}
        {(selectedNiche || selectedPlatform) && (
          <div className="mt-8 p-6 rounded-2xl bg-white/5 text-center">
            <p className="text-gray-400">Selected Configuration:</p>
            <p className="text-lg font-semibold">
              {selectedNiche && NICHES.find(n => n.id === selectedNiche)?.title} 
              {selectedNiche && selectedPlatform && ' × '}
              {selectedPlatform && PLATFORMS.find(p => p.id === selectedPlatform)?.name}
            </p>
          </div>
        )}

        {/* Quick Launch Grid */}
        <div className="mt-16">
          <h3 className="text-xl font-bold mb-6 text-center">Quick Launch Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NICHES.slice(0, 2).map((niche) =>
              PLATFORMS.slice(0, 2).map((platform) => (
                <button
                  key={`${niche.id}-${platform.id}`}
                  onClick={() => router.push(`/viral-template-landing?niche=${niche.id}&platform=${platform.id}`)}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-sm"
                >
                  <div className="text-2xl mb-1">{niche.emoji}</div>
                  <div className="font-medium">{niche.title}</div>
                  <div className="text-xs text-gray-400">{platform.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}