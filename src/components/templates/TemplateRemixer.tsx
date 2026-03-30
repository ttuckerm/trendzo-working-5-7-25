"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { 
  Wand2, 
  RefreshCcw, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Save,
  Loader2,
  Music
} from 'lucide-react'
import { Template, TemplateSection } from '@/lib/types/template'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import SoundRemixPanel from '@/components/sounds/SoundRemixPanel'

interface RemixOption {
  id: string
  name: string
  description: string
  icon: JSX.Element
}

// Remix options for templates
const REMIX_OPTIONS: RemixOption[] = [
  {
    id: 'structure',
    name: 'Structure Variation',
    description: 'Change the template structure while keeping the core message',
    icon: <RefreshCcw className="h-5 w-5" />
  },
  {
    id: 'tone',
    name: 'Tone Adjustment',
    description: 'Modify the tone to be more casual, formal, humorous, or serious',
    icon: <Wand2 className="h-5 w-5" />
  },
  {
    id: 'optimize',
    name: 'Engagement Optimizer',
    description: 'Tweak the template to maximize engagement based on current trends',
    icon: <ThumbsUp className="h-5 w-5" />
  },
  {
    id: 'sound',
    name: 'Sound Remix',
    description: 'Find the perfect sound to match your template and increase engagement',
    icon: <Music className="h-5 w-5" />
  }
]

interface TemplateRemixerProps {
  template: Template | null
  onApplyChanges: (updatedTemplate: Template) => void
}

export default function TemplateRemixer({ template, onApplyChanges }: TemplateRemixerProps) {
  const [selectedOption, setSelectedOption] = useState<string>('structure')
  const [remixIntensity, setRemixIntensity] = useState<number>(50)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [remixedTemplate, setRemixedTemplate] = useState<Template | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<'thumbsUp' | 'thumbsDown' | null>(null)
  const [soundDialogOpen, setSoundDialogOpen] = useState(false)

  // Handle sound selection
  const handleSoundSelected = (sound: any) => {
    if (!template || !sound) return;
    
    // Create a copy of the template with the new sound
    const updatedTemplate = {
      ...template,
      soundId: sound.id,
      soundTitle: sound.title,
      soundAuthor: sound.authorName,
      // Since we're using a simplified sound interface, provide a default URL
      soundUrl: 'https://example.com/default-sound.mp3'
    };
    
    setRemixedTemplate(updatedTemplate);
  };

  // Remix the template
  const handleRemix = async () => {
    if (!template) return
    
    // If sound remix is selected, open the sound dialog instead
    if (selectedOption === 'sound') {
      setSoundDialogOpen(true);
      return;
    }
    
    setIsGenerating(true)
    
    try {
      // This would be an actual API call in a production environment
      // For now, we'll simulate a delay and create a mock remix
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create a cloned template with some modified sections
      const clonedTemplate = JSON.parse(JSON.stringify(template)) as Template
      
      // Apply different modifications based on selected option
      if (selectedOption === 'structure') {
        // Modify the structure a bit
        if (clonedTemplate.sections.length > 2) {
          // Swap the order of two sections
          const temp = clonedTemplate.sections[1]
          clonedTemplate.sections[1] = clonedTemplate.sections[2]
          clonedTemplate.sections[2] = temp
          
          // Update order properties
          clonedTemplate.sections.forEach((section, index) => {
            section.order = index
          })
        }
      } else if (selectedOption === 'tone') {
        // Modify text tone
        clonedTemplate.sections.forEach(section => {
          section.textOverlays.forEach(overlay => {
            // Add some emoji to make it more casual if intensity is high
            if (remixIntensity > 75) {
              overlay.text = overlay.text + ' 🔥'
            } else if (remixIntensity > 50) {
              // Make text more formal by capitalizing first letter of each word
              overlay.text = overlay.text.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            }
          })
        })
      } else if (selectedOption === 'optimize') {
        // Add more engaging call-to-action
        if (clonedTemplate.sections.length > 0) {
          const lastSection = clonedTemplate.sections[clonedTemplate.sections.length - 1]
          if (lastSection.textOverlays.length > 0) {
            lastSection.textOverlays[0].text = 'MUST WATCH UNTIL THE END! 👀'
          }
        }
      }
      
      setRemixedTemplate(clonedTemplate)
    } catch (error) {
      console.error('Error remixing template:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Apply remixed changes
  const handleApplyChanges = () => {
    if (remixedTemplate) {
      onApplyChanges(remixedTemplate)
    }
  }
  
  // Handle feedback
  const handleFeedback = (type: 'thumbsUp' | 'thumbsDown') => {
    setFeedbackGiven(type)
    // In a real app, we would send this feedback to improve the AI
    setTimeout(() => {
      setFeedbackGiven(null)
    }, 2000)
  }
  
  if (!template) {
    return <div className="p-6 text-center">No template selected</div>
  }
  
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Template Remix Studio</h3>
      
      {/* Remix options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Remix Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REMIX_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`flex items-start p-3 border rounded-lg text-left transition-colors ${
                selectedOption === option.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={`mr-3 ${selectedOption === option.id ? 'text-blue-500' : 'text-gray-500'}`}>
                {option.icon}
              </span>
              <div>
                <p className="font-medium text-sm">{option.name}</p>
                <p className="text-xs text-gray-600">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Remix intensity (hide for sound remix) */}
      {selectedOption !== 'sound' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remix Intensity: {remixIntensity}%
          </label>
          <Slider
            defaultValue={[50]}
            max={100}
            step={5}
            className="w-full"
            onValueChange={(value: number[]) => setRemixIntensity(value[0])}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Subtle</span>
            <span>Moderate</span>
            <span>Dramatic</span>
          </div>
        </div>
      )}
      
      {/* Generate button */}
      <Button 
        onClick={handleRemix}
        disabled={isGenerating} 
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Remix...
          </>
        ) : selectedOption === 'sound' ? (
          <>
            <Music className="mr-2 h-4 w-4" />
            Open Sound Remix Studio
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Template Remix
          </>
        )}
      </Button>
      
      {/* Debug button to directly open Sound Remix */}
      <Button 
        onClick={() => setSoundDialogOpen(true)}
        className="w-full mt-2 bg-purple-600 text-white"
      >
        <Music className="mr-2 h-4 w-4" />
        Debug: Open Sound Remix Dialog
      </Button>
      
      {/* Sound remix dialog */}
      <Dialog open={soundDialogOpen} onOpenChange={setSoundDialogOpen}>
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
      
      {/* Remix results */}
      {remixedTemplate && !isGenerating && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium mb-2">Remix Preview</h4>
          
          {/* If sound was changed, show sound info */}
          {remixedTemplate.soundId && remixedTemplate.soundId !== template.soundId && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800 flex items-center">
                <Music className="h-4 w-4 mr-2" />
                Sound Updated
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {remixedTemplate.soundTitle} by {remixedTemplate.soundAuthor || 'Unknown'}
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded mb-4 max-h-60 overflow-y-auto">
            {remixedTemplate.sections.map((section, index) => (
              <div key={section.id} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                <p className="text-sm font-medium">{section.name} ({section.duration}s)</p>
                {section.textOverlays.map(overlay => (
                  <p key={overlay.id} className="text-sm bg-white p-2 mt-1 rounded">
                    {overlay.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFeedback('thumbsUp')}
                disabled={feedbackGiven !== null}
                className={feedbackGiven === 'thumbsUp' ? 'bg-green-50 text-green-600' : ''}
              >
                <ThumbsUp className="mr-1 h-4 w-4" />
                {feedbackGiven === 'thumbsUp' ? 'Thanks!' : 'Looks Good'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFeedback('thumbsDown')}
                disabled={feedbackGiven !== null}
                className={feedbackGiven === 'thumbsDown' ? 'bg-red-50 text-red-600' : ''}
              >
                <ThumbsDown className="mr-1 h-4 w-4" />
                {feedbackGiven === 'thumbsDown' ? 'Feedback Sent' : 'Needs Work'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRemixedTemplate(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyChanges}
              >
                <Check className="mr-1 h-4 w-4" />
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 