'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useWorkflowStore } from '@/lib/state/workflowStore'
import { useLiveStarterPackEnabled } from '@/lib/flags/liveStarterPack'
import { ValidationDashboard } from '@/components/admin/ValidationDashboard'

import { StudioHeader } from './components/StudioHeader'
import { TemplateLibraryTab } from './components/TemplateLibraryTab'
import { InstantAnalysisTab } from './components/InstantAnalysisTab'
import { CreatorTab } from './components/CreatorTab'
import { ViralWorkflowTab } from './components/ViralWorkflowTab'
import { TemplateScriptModal } from './components/TemplateScriptModal'
import { LaboratoryTab } from './components/LaboratoryTab'
import { LegacyProvingGroundsTab } from './components/LegacyProvingGroundsTab'
import { ArmoryTab } from './components/ArmoryTab'
import { ConceptScorerTab } from './components/ConceptScorerTab'

export default function StudioPage() {
  const params = useSearchParams();
  const pathname = usePathname();
  const flagEnabled = useLiveStarterPackEnabled();
  const {
    setNiche,
    setGoal,
    setStarterEnabled,
  } = useWorkflowStore();

  const urlNiche = params?.get('niche') || '';
  const urlGoal = params?.get('goal') || '';
  const starterParamOn = (params?.get('starter') || '').toLowerCase() === 'on';

  const [activeTab, setActiveTab] = useState('template-library');
  const [selectedNiche, setSelectedNiche] = useState<string>('');

  // Template Script Modal state
  const [showTemplateScriptModal, setShowTemplateScriptModal] = useState(false);
  const [selectedTemplateForScript, setSelectedTemplateForScript] = useState<any>(null);

  const openTemplateScriptGenerator = (template: any) => {
    setSelectedTemplateForScript(template);
    setShowTemplateScriptModal(true);
  };

  const closeTemplateScriptModal = () => {
    setShowTemplateScriptModal(false);
    setSelectedTemplateForScript(null);
  };

  // Initialize from URL for Starter Pack
  useEffect(() => {
    if (urlNiche) setNiche(urlNiche);
    if (urlGoal) setGoal(urlGoal);
    if (starterParamOn && flagEnabled) setStarterEnabled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlNiche, urlGoal, starterParamOn, flagEnabled]);

  // Dev-only probe for Studio -> Viral Workflow surface
  if (process.env.NODE_ENV !== 'production' && activeTab === 'viral-workflow') {
    // eslint-disable-next-line no-console
    console.debug('[starter] studio/viral-workflow surface', { pathname, tabKey: 'viral-workflow' });
  }

  return (
    <div
      className="studio-container h-full relative"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(155, 89, 182, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 217, 255, 0.06) 0%, transparent 50%),
          #0a0a0a
        `,
      }}
    >
      {/* Studio Header with Glass Navigation */}
      <StudioHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Scrollable content area */}
      <div className="studio-scroll-area" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div className="px-8 pb-16">
          {/* Template Library */}
          {activeTab === 'template-library' && (
            <TemplateLibraryTab
              selectedNiche={selectedNiche}
              onTemplateSelect={openTemplateScriptGenerator}
            />
          )}

          {/* LEGACY: Old Proving Grounds Content - disabled */}
          {activeTab === 'proving-grounds-OLD-DISABLED' && (
            <LegacyProvingGroundsTab selectedNiche={selectedNiche} />
          )}

          {/* The Armory Content */}
          {activeTab === 'armory' && (
            <ArmoryTab />
          )}

          {/* Instant Analysis Tab */}
          {activeTab === 'instant-analysis' && (
            <InstantAnalysisTab />
          )}

          {/* Creator Tab */}
          {activeTab === 'creator' && (
            <CreatorTab />
          )}

          {/* The Laboratory Tab */}
          {activeTab === 'laboratory' && (
            <LaboratoryTab selectedNiche={selectedNiche} />
          )}

          {/* Validation Dashboard Tab */}
          {activeTab === 'validation-dashboard' && (
            <ValidationDashboard />
          )}

          {/* Concept Scorer Tab */}
          {activeTab === 'concept-scorer' && (
            <ConceptScorerTab />
          )}

          {/* Viral Workflow Tab */}
          {activeTab === 'viral-workflow' && (
            <ViralWorkflowTab />
          )}
        </div>

        {/* Template Script Generator Modal */}
        {showTemplateScriptModal && selectedTemplateForScript && (
          <TemplateScriptModal
            template={selectedTemplateForScript}
            onClose={closeTemplateScriptModal}
          />
        )}

        {/* Unified Shell removed for this page as requested */}
      </div>
    </div>
  );
}
