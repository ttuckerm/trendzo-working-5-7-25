"use client"

import React, { useState, useEffect } from 'react'
import { Sparkles, Type, Palette, MessageSquare, Lightbulb, Clock, Target, Wand2 } from 'lucide-react'

interface ViralVideo {
  id: string
  title: string
  creator_name: string
  thumbnail_url: string
  view_count: number
  viral_score: number
  platform: 'tiktok' | 'instagram' | 'youtube'
  duration_seconds: number
}

interface WorkspaceConfig {
  workspaceId: string
  suggestedHooks: string[]
  timingGuidance: {
    optimal_duration: number
    hook_timing_seconds: number
  }
  scriptGuidance: {
    tone: string
    style_hints: string[]
    pattern_suggestions: string[]
  }
}

interface UserContent {
  script: string
  style: string
  hook: string
}

interface Props {
  selectedVideo: ViralVideo | null
  workspaceConfig: WorkspaceConfig | null
  userContent: UserContent
  onContentChange: (content: UserContent) => void
  isLoading: boolean
}

export const DynamicWorkspace: React.FC<Props> = ({
  selectedVideo,
  workspaceConfig,
  userContent,
  onContentChange,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'hook' | 'style'>('script')
  const [showHints, setShowHints] = useState(true)

  const handleContentUpdate = (field: keyof UserContent, value: string) => {
    const updatedContent = {
      ...userContent,
      [field]: value
    }
    onContentChange(updatedContent)
  }

  const insertSuggestedHook = (hook: string) => {
    handleContentUpdate('hook', hook)
  }

  const insertStyleHint = (hint: string) => {
    const currentStyle = userContent.style
    const newStyle = currentStyle ? `${currentStyle}, ${hint}` : hint
    handleContentUpdate('style', newStyle)
  }

  const getCharacterCount = (text: string): { count: number; status: 'good' | 'warning' | 'danger' } => {
    const count = text.length
    if (count <= 100) return { count, status: 'good' }
    if (count <= 150) return { count, status: 'warning' }
    return { count, status: 'danger' }
  }

  const getOptimalTiming = (): string => {
    if (!workspaceConfig?.timingGuidance) return '30s'
    return `${workspaceConfig.timingGuidance.optimal_duration}s`
  }

  if (isLoading) {
    return (
      <div className="dynamic-workspace loading">
        <div className="loading-content">
          <Wand2 className="loading-icon" />
          <span>Configuring workspace...</span>
        </div>
        <style jsx>{`
          .dynamic-workspace.loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
          }
          .loading-content {
            display: flex;
            align-items: center;
            gap: 12px;
            color: rgba(255, 255, 255, 0.6);
          }
          .loading-icon {
            width: 20px;
            height: 20px;
            animation: spin 2s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!selectedVideo) {
    return (
      <div className="dynamic-workspace empty">
        <div className="empty-state">
          <Target className="empty-icon" />
          <h3>Select a Viral Video</h3>
          <p>Choose a viral video from the gallery to unlock the adaptive workspace with personalized editing tools</p>
        </div>
        <style jsx>{`
          .dynamic-workspace.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: rgba(255, 255, 255, 0.02);
            border: 2px dashed rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            text-align: center;
          }
          .empty-state {
            max-width: 280px;
          }
          .empty-icon {
            width: 48px;
            height: 48px;
            color: rgba(255, 255, 255, 0.4);
            margin: 0 auto 16px;
          }
          .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
          }
          .empty-state p {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="dynamic-workspace">
      {/* Workspace header */}
      <div className="workspace-header">
        <div className="selected-video-info">
          <div className="video-badge">
            <Sparkles className="badge-icon" />
            <span>Inspired by "{selectedVideo.title}"</span>
          </div>
          <div className="creator-info">
            by {selectedVideo.creator_name} • {selectedVideo.viral_score}% viral score
          </div>
        </div>
        
        <div className="workspace-actions">
          <button 
            className={`hint-toggle ${showHints ? 'active' : ''}`}
            onClick={() => setShowHints(!showHints)}
          >
            <Lightbulb className="toggle-icon" />
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
        </div>
      </div>

      {/* Content tabs */}
      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'script' ? 'active' : ''}`}
          onClick={() => setActiveTab('script')}
        >
          <MessageSquare className="tab-icon" />
          Script
        </button>
        <button 
          className={`tab ${activeTab === 'hook' ? 'active' : ''}`}
          onClick={() => setActiveTab('hook')}
        >
          <Target className="tab-icon" />
          Hook
        </button>
        <button 
          className={`tab ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
        >
          <Palette className="tab-icon" />
          Style
        </button>
      </div>

      {/* Content editing areas */}
      <div className="content-editor">
        {activeTab === 'script' && (
          <div className="editor-section">
            <div className="editor-header">
              <div className="section-title">
                <Type className="section-icon" />
                <span>Video Script</span>
              </div>
              <div className="character-count">
                <span className={`count ${getCharacterCount(userContent.script).status}`}>
                  {getCharacterCount(userContent.script).count}/150
                </span>
              </div>
            </div>
            
            <textarea
              className="script-editor"
              placeholder="Write your viral script here... Keep it engaging and concise!"
              value={userContent.script}
              onChange={(e) => handleContentUpdate('script', e.target.value)}
              maxLength={200}
            />

            {showHints && workspaceConfig?.scriptGuidance && (
              <div className="guidance-panel">
                <h4 className="guidance-title">💡 Script Guidance</h4>
                <div className="guidance-items">
                  <div className="guidance-item">
                    <strong>Tone:</strong> {workspaceConfig.scriptGuidance.tone}
                  </div>
                  <div className="guidance-item">
                    <strong>Optimal Duration:</strong> {getOptimalTiming()}
                  </div>
                  {workspaceConfig.scriptGuidance.pattern_suggestions.length > 0 && (
                    <div className="guidance-item">
                      <strong>Pattern Suggestions:</strong>
                      <div className="pattern-tags">
                        {workspaceConfig.scriptGuidance.pattern_suggestions.slice(0, 3).map((pattern, index) => (
                          <span key={index} className="pattern-tag">{pattern}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hook' && (
          <div className="editor-section">
            <div className="editor-header">
              <div className="section-title">
                <Target className="section-icon" />
                <span>Opening Hook</span>
              </div>
              <div className="timing-guidance">
                <Clock className="timing-icon" />
                <span>First {workspaceConfig?.timingGuidance?.hook_timing_seconds || 3}s</span>
              </div>
            </div>
            
            <textarea
              className="hook-editor"
              placeholder="Create a compelling opening hook that grabs attention immediately..."
              value={userContent.hook}
              onChange={(e) => handleContentUpdate('hook', e.target.value)}
              maxLength={100}
            />

            {showHints && workspaceConfig?.suggestedHooks && workspaceConfig.suggestedHooks.length > 0 && (
              <div className="suggestions-panel">
                <h4 className="suggestions-title">🎯 Suggested Hooks</h4>
                <div className="hook-suggestions">
                  {workspaceConfig.suggestedHooks.map((hook, index) => (
                    <button
                      key={index}
                      className="hook-suggestion"
                      onClick={() => insertSuggestedHook(hook)}
                    >
                      <Sparkles className="suggestion-icon" />
                      <span>{hook}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="editor-section">
            <div className="editor-header">
              <div className="section-title">
                <Palette className="section-icon" />
                <span>Visual Style</span>
              </div>
            </div>
            
            <textarea
              className="style-editor"
              placeholder="Describe your visual style, colors, effects, and overall aesthetic..."
              value={userContent.style}
              onChange={(e) => handleContentUpdate('style', e.target.value)}
              maxLength={150}
            />

            {showHints && workspaceConfig?.scriptGuidance?.style_hints && (
              <div className="style-hints-panel">
                <h4 className="hints-title">🎨 Style Recommendations</h4>
                <div className="style-hints">
                  {workspaceConfig.scriptGuidance.style_hints.map((hint, index) => (
                    <button
                      key={index}
                      className="style-hint"
                      onClick={() => insertStyleHint(hint)}
                    >
                      <Palette className="hint-icon" />
                      <span>{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button className="action-button primary">
          <Sparkles className="action-icon" />
          Generate AI Enhancement
        </button>
        <button className="action-button secondary">
          <Type className="action-icon" />
          Auto-Optimize Length
        </button>
      </div>

      <style jsx>{`
        .dynamic-workspace {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 17, 17, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          color: white;
          min-height: 500px;
        }

        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .selected-video-info {
          flex: 1;
        }

        .video-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-weight: 600;
          color: #7b61ff;
        }

        .badge-icon {
          width: 16px;
          height: 16px;
        }

        .creator-info {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .workspace-actions {
          display: flex;
          gap: 12px;
        }

        .hint-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .hint-toggle.active {
          background: rgba(123, 97, 255, 0.2);
          border-color: rgba(123, 97, 255, 0.4);
          color: white;
        }

        .toggle-icon {
          width: 16px;
          height: 16px;
        }

        .content-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
          justify-content: center;
        }

        .tab.active {
          background: rgba(123, 97, 255, 0.3);
          color: white;
        }

        .tab-icon {
          width: 16px;
          height: 16px;
        }

        .content-editor {
          margin-bottom: 24px;
        }

        .editor-section {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .section-icon {
          width: 18px;
          height: 18px;
          color: #7b61ff;
        }

        .character-count .count {
          font-size: 14px;
          font-weight: 500;
        }

        .character-count .count.good { color: #10b981; }
        .character-count .count.warning { color: #f59e0b; }
        .character-count .count.danger { color: #ef4444; }

        .timing-guidance {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .timing-icon {
          width: 16px;
          height: 16px;
        }

        .script-editor, .hook-editor, .style-editor {
          width: 100%;
          min-height: 120px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          transition: border-color 0.3s;
        }

        .script-editor:focus, .hook-editor:focus, .style-editor:focus {
          outline: none;
          border-color: rgba(123, 97, 255, 0.5);
        }

        .script-editor::placeholder, .hook-editor::placeholder, .style-editor::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .guidance-panel, .suggestions-panel, .style-hints-panel {
          margin-top: 16px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
        }

        .guidance-title, .suggestions-title, .hints-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: rgba(255, 255, 255, 0.9);
        }

        .guidance-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .guidance-item {
          font-size: 13px;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.8);
        }

        .pattern-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .pattern-tag {
          padding: 4px 8px;
          background: rgba(123, 97, 255, 0.2);
          border: 1px solid rgba(123, 97, 255, 0.3);
          border-radius: 6px;
          font-size: 12px;
          color: white;
        }

        .hook-suggestions, .style-hints {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hook-suggestion, .style-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s;
        }

        .hook-suggestion:hover, .style-hint:hover {
          background: rgba(123, 97, 255, 0.1);
          border-color: rgba(123, 97, 255, 0.3);
        }

        .suggestion-icon, .hint-icon {
          width: 14px;
          height: 14px;
          color: #7b61ff;
          flex-shrink: 0;
        }

        .quick-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
          justify-content: center;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
          color: white;
        }

        .action-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        .action-button.secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }

        .action-button.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .action-icon {
          width: 16px;
          height: 16px;
        }

        @media (max-width: 768px) {
          .workspace-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .content-tabs {
            flex-direction: column;
          }
          
          .quick-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
} 