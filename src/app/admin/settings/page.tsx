import React from 'react'

export default function SettingsPage() {
  return (
    <div className="settings-container h-full bg-[radial-gradient(ellipse_at_center_top,#141414_0%,#0a0a0a_50%,#000000_100%)] relative overflow-y-auto">
      <div className="content-container p-10 h-full overflow-y-auto">
        <div className="settings-grid grid grid-cols-[240px_1fr] gap-8">
          <div className="settings-sidebar bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05] h-fit">
            <div className="settings-menu-item active p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 bg-[rgba(229,9,20,0.2)] text-white border border-[rgba(229,9,20,0.3)]">
              <span>👤</span>
              <span>User Profile</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>🔐</span>
              <span>Security</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>🔔</span>
              <span>Notifications</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>🎨</span>
              <span>Appearance</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>🔌</span>
              <span>Integrations</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>📊</span>
              <span>Data & Privacy</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>💳</span>
              <span>Billing</span>
            </div>
            <div className="settings-menu-item p-3.5 mb-1 rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-3 text-[#888] hover:bg-white/[0.05] hover:text-white">
              <span>🚀</span>
              <span>Advanced</span>
            </div>
          </div>
          
          <div className="settings-content bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
            <h3 className="text-2xl font-bold mb-8">User Profile Settings</h3>
            <div className="empty-state text-center py-20 px-10 text-[#666]">
              <div className="empty-icon text-[64px] mb-6 opacity-50">⚙️</div>
              <div className="empty-title text-2xl font-semibold mb-3 text-[#888]">Settings Interface</div>
              <div className="empty-desc text-base mb-8">Hierarchical settings with sidebar navigation</div>
              <button className="action-button primary px-5 py-2.5 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5">
                Configure Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 