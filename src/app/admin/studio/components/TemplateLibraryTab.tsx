'use client'

import GalleryPhase from '@/app/admin/viral-studio/components/phases/GalleryPhase'

interface TemplateLibraryTabProps {
  selectedNiche: string;
  onTemplateSelect: (template: any) => void;
}

export function TemplateLibraryTab({ selectedNiche, onTemplateSelect }: TemplateLibraryTabProps) {
  return (
    <div className="template-library-content -mx-8">
      <GalleryPhase
        selectedNiche={selectedNiche || ''}
        onTemplateSelect={(template) => onTemplateSelect(template)}
        hoveredTemplate={null}
        onTemplateHover={() => {}}
        isEmbedded={true}
      />
    </div>
  );
}
