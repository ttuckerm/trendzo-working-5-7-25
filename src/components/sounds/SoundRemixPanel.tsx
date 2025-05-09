"use client"

import { useState } from 'react';
import { 
  Sparkles, 
  Music, 
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Sound {
  id: string;
  title: string;
  authorName: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  soundId?: string;
}

interface SoundRemixPanelProps {
  template: Template;
  onSoundSelected: (sound: Sound) => void;
  className?: string;
}

export default function SoundRemixPanel({
  template,
  onSoundSelected,
  className = ''
}: SoundRemixPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Simplified mock data
  const mockSounds: Sound[] = [
    {
      id: 'sound1',
      title: 'Summer Vibes',
      authorName: 'MusicProducer'
    },
    {
      id: 'sound2',
      title: 'Epic Background',
      authorName: 'SoundStudio'
    }
  ];
  
  const handleSoundSelected = (sound: Sound) => {
    onSoundSelected(sound);
    setIsOpen(false);
  };
  
  return (
    <div className={className}>
      <Card className="border-dashed border-primary/50 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Music className="h-5 w-5 mr-2 text-primary" />
            Sound Remix Studio
          </CardTitle>
          <CardDescription>
            AI-powered sound selection for maximum engagement
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2 space-y-2">
          <div className="space-y-1 text-sm">
            <div className="flex items-center text-muted-foreground">
              <BadgeCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>AI-powered sound recommendations</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <BadgeCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>Sound-template compatibility scoring</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <BadgeCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>Engagement prediction</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Open Sound Remix Studio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Sound Remix Studio</DialogTitle>
                <DialogDescription>
                  Find the perfect sound for your template with AI-powered recommendations
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-white p-4">
                <h3 className="text-lg font-medium mb-4">Recommended Sounds</h3>
                <div className="space-y-4">
                  {mockSounds.map(sound => (
                    <div key={sound.id} className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{sound.title}</p>
                        <p className="text-sm text-gray-500">By {sound.authorName}</p>
                      </div>
                      <Button 
                        onClick={() => handleSoundSelected(sound)}
                        size="sm"
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
} 