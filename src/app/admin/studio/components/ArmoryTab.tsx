'use client'

import React from 'react'

export function ArmoryTab() {
  return (
    <div className="armory-content">
      {/* Armory Header */}
      <div className="armory-header flex justify-between items-start mb-12">
        <div className="armory-title-section">
          <h2 className="text-[32px] font-black mb-2">🛡️ The Armory</h2>
          <p className="armory-subtitle text-base text-[#888] font-medium">Your viral template weapons vault - Deploy battle-tested formats with confidence</p>
        </div>

        <div className="armory-quick-stats flex gap-12">
          <div className="armory-stat text-center">
            <span className="armory-stat-number text-[36px] font-black block mb-1">248</span>
            <span className="armory-stat-label text-xs text-[#666] uppercase tracking-wider">Total Weapons</span>
          </div>
          <div className="armory-stat text-center">
            <span className="armory-stat-number text-[36px] font-black block mb-1 text-[#e50914]">67</span>
            <span className="armory-stat-label text-xs text-[#666] uppercase tracking-wider">Hot Templates</span>
          </div>
          <div className="armory-stat text-center">
            <span className="armory-stat-number text-[36px] font-black block mb-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">12</span>
            <span className="armory-stat-label text-xs text-[#666] uppercase tracking-wider">New Discoveries</span>
          </div>
        </div>
      </div>

      {/* Main Arsenal Grid */}
      <div className="arsenal-container grid grid-cols-[320px_1fr] gap-10">
        {/* Framework Library Sidebar */}
        <aside className="framework-library bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] border border-white/[0.05] p-8 h-fit">
          <div className="library-header flex justify-between items-center mb-8">
            <h3 className="library-title text-xl font-bold flex items-center gap-3"><span>📚</span>Framework Library</h3>
            <span className="framework-count text-xs text-[#666] bg-white/[0.05] px-3 py-1 rounded-xl">48 Frameworks</span>
          </div>

          <div className="framework-categories flex flex-col gap-3 mb-8">
            {[
              { icon: '🎭', name: 'Storytelling', count: '12' },
              { icon: '🎵', name: 'Music-Driven', count: '8' },
              { icon: '😂', name: 'Comedy', count: '10' },
              { icon: '🎓', name: 'Educational', count: '9' },
              { icon: '💫', name: 'Transformation', count: '9' }
            ].map((category, index) => (
              <div key={index} className="framework-category">
                <div className="framework-category-header flex items-center gap-3 p-3.5 bg-white/[0.03] rounded-[10px] cursor-pointer transition-all duration-300 hover:bg-[rgba(102,126,234,0.1)] hover:translate-x-1">
                  <span className="framework-icon text-lg">{category.icon}</span>
                  <span className="framework-name flex-1 text-sm font-semibold">{category.name}</span>
                  <span className="framework-badge bg-[rgba(102,126,234,0.2)] text-[#667eea] px-2 py-0.5 rounded-[10px] text-xs font-semibold">{category.count}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="combo-section border-t border-white/[0.05] pt-6">
            <h4 className="combo-title text-base font-bold mb-4 flex items-center gap-2">🎯 Battle-Tested Combos</h4>
            <div className="combo-list flex flex-col gap-2.5">
              {[
                { name: 'POV + Trending Audio', success: '94%' },
                { name: 'Tutorial + Quick Cuts', success: '91%' },
                { name: 'Transformation + Reveal', success: '89%' }
              ].map((combo, index) => (
                <div key={index} className="combo-item flex justify-between items-center p-3 bg-white/[0.03] rounded-lg transition-all duration-300 hover:bg-[rgba(229,9,20,0.1)] hover:translate-x-1">
                  <span className="combo-name text-[13px] font-medium">{combo.name}</span>
                  <span className="combo-success text-sm font-bold text-[#00ff88]">{combo.success}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Weapon Cards Grid */}
        <div className="weapons-grid grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
          {/* Hot Template Card */}
          <div className="weapon-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] relative transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(229,9,20,0.5)]">
            <div className="weapon-status-badge absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(229,9,20,0.2)] border border-[rgba(229,9,20,0.3)] rounded-full text-xs font-bold"><span className="status-icon text-sm">🔥</span><span className="status-text">HOT</span></div>
            <div className="weapon-header mb-6"><h4 className="weapon-name text-lg font-bold mb-2 text-white">POV: You&apos;re the Main Character</h4><div className="weapon-category text-[13px] text-[#888] uppercase tracking-wider">Storytelling</div></div>
            <div className="weapon-stats-grid grid grid-cols-2 gap-4 mb-6">
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">92%</span><span className="stat-name text-xs text-[#666] uppercase">Success Rate</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">1.2M</span><span className="stat-name text-xs text-[#666] uppercase">Avg Views</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">847</span><span className="stat-name text-xs text-[#666] uppercase">Deployments</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">2h ago</span><span className="stat-name text-xs text-[#666] uppercase">Last Used</span></div>
            </div>
            <div className="weapon-velocity mb-5"><span className="velocity-label text-xs text-[#888] block mb-2">Viral Velocity</span><div className="velocity-bar h-1.5 bg-white/10 rounded-sm overflow-hidden"><div className="velocity-fill h-full bg-gradient-to-r from-[#00ff88] to-[#00d672] rounded-sm transition-all duration-[600ms]" style={{ width: '92%' }}></div></div></div>
            <div className="weapon-lifespan flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg mb-5 text-[13px] text-[#aaa]"><span className="lifespan-icon text-base">⏰</span><span className="lifespan-text">14 days remaining</span></div>
            <button className="quick-deploy-btn w-full p-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-[10px] text-white text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)]"><span className="deploy-icon text-lg">🚀</span><span>Quick Deploy</span></button>
          </div>

          {/* Cooling Template Card */}
          <div className="weapon-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] relative transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(59,130,246,0.5)]">
            <div className="weapon-status-badge absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.3)] rounded-full text-xs font-bold"><span className="status-icon text-sm">🧊</span><span className="status-text">COOLING</span></div>
            <div className="weapon-header mb-6"><h4 className="weapon-name text-lg font-bold mb-2 text-white">Before & After Transformation</h4><div className="weapon-category text-[13px] text-[#888] uppercase tracking-wider">Visual Impact</div></div>
            <div className="weapon-stats-grid grid grid-cols-2 gap-4 mb-6">
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">78%</span><span className="stat-name text-xs text-[#666] uppercase">Success Rate</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">890K</span><span className="stat-name text-xs text-[#666] uppercase">Avg Views</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">1,234</span><span className="stat-name text-xs text-[#666] uppercase">Deployments</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">5h ago</span><span className="stat-name text-xs text-[#666] uppercase">Last Used</span></div>
            </div>
            <div className="weapon-velocity mb-5"><span className="velocity-label text-xs text-[#888] block mb-2">Viral Velocity</span><div className="velocity-bar h-1.5 bg-white/10 rounded-sm overflow-hidden"><div className="velocity-fill h-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-sm transition-all duration-[600ms]" style={{ width: '78%' }}></div></div></div>
            <div className="weapon-lifespan flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg mb-5 text-[13px] text-[#aaa]"><span className="lifespan-icon text-base">⏰</span><span className="lifespan-text">Starting to cool down</span></div>
            <button className="quick-deploy-btn w-full p-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-[10px] text-white text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)]"><span className="deploy-icon text-lg">🚀</span><span>Quick Deploy</span></button>
          </div>

          {/* New Template Card */}
          <div className="weapon-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] relative transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(168,85,247,0.5)]">
            <div className="weapon-status-badge absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)] rounded-full text-xs font-bold"><span className="status-icon text-sm">✨</span><span className="status-text">NEW</span></div>
            <div className="weapon-header mb-6"><h4 className="weapon-name text-lg font-bold mb-2 text-white">Reverse Tutorial Reveal</h4><div className="weapon-category text-[13px] text-[#888] uppercase tracking-wider">Educational</div></div>
            <div className="weapon-stats-grid grid grid-cols-2 gap-4 mb-6">
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">94%</span><span className="stat-name text-xs text-[#666] uppercase">Success Rate</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">1.5M</span><span className="stat-name text-xs text-[#666] uppercase">Avg Views</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">8</span><span className="stat-name text-xs text-[#666] uppercase">Deployments</span></div>
              <div className="weapon-stat flex flex-col"><span className="stat-value text-xl font-bold mb-1">New</span><span className="stat-name text-xs text-[#666] uppercase">Last Used</span></div>
            </div>
            <div className="weapon-velocity mb-5"><span className="velocity-label text-xs text-[#888] block mb-2">Viral Velocity</span><div className="velocity-bar h-1.5 bg-white/10 rounded-sm overflow-hidden"><div className="velocity-fill h-full bg-gradient-to-r from-[#a855f7] to-[#9333ea] rounded-sm transition-all duration-[600ms]" style={{ width: '94%' }}></div></div></div>
            <div className="weapon-lifespan flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg mb-5 text-[13px] text-[#aaa]"><span className="lifespan-icon text-base">🚨</span><span className="lifespan-text">High potential - Use now!</span></div>
            <button className="quick-deploy-btn w-full p-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-[10px] text-white text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)]"><span className="deploy-icon text-lg">🚀</span><span>Quick Deploy</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
