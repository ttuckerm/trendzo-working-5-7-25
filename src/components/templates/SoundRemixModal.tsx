"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SoundRemixPanel from '@/components/sounds/SoundRemixPanel'
import { Template } from '@/lib/types/template'

// Simplified interface to match the SoundRemixPanel
interface Sound {
  id: string
  title: string
  authorName: string
}

interface SoundRemixModalProps {
  isOpen: boolean
  onClose: () => void
  template: Template
  onUpdateTemplate: (template: Template) => void
  setShowSoundRemixModal: (show: boolean) => void
}

export default function SoundRemixModal({
  isOpen,
  onClose,
  template,
  onUpdateTemplate,
  setShowSoundRemixModal
}: SoundRemixModalProps) {
  // Handle sound selection
  const handleSoundSelected = (sound: Sound) => {
    if (!template) return;
    
    // Create a copy of the template with the new sound
    const updatedTemplate = {
      ...template,
      soundId: sound.id,
      soundTitle: sound.title,
      soundAuthor: sound.authorName,
      // Since we're using a simplified sound interface, there's no playUrl
      // We'll need to handle this condition
      soundUrl: 'https://example.com/default-sound.mp3' // Default value
    };
    
    onUpdateTemplate(updatedTemplate);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setShowSoundRemixModal}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Sound Remix Studio</DialogTitle>
        </DialogHeader>
        
        <SoundRemixPanel 
          template={template} 
          onSoundSelected={handleSoundSelected}
        />
      </DialogContent>
    </Dialog>
  );
} 