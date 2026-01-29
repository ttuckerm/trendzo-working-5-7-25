"use client";

import { useState } from "react";
import SoundBrowser from "@/components/sounds/SoundBrowser";
import SoundValidator from "@/components/sounds/SoundValidator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from "lucide-react";

interface Sound {
  id: string;
  title: string;
  authorName: string;
  // Other properties omitted for brevity
}

export default function SoundsPage() {
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [activeTab, setActiveTab] = useState<string>('browse');

  const handleSelectSound = (sound: Sound) => {
    setSelectedSound(sound);
    console.log("Selected sound:", sound);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sound Library</h1>
      
      <Tabs defaultValue="browse" onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Sounds</TabsTrigger>
          <TabsTrigger value="validate">Validate Sound</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {activeTab === 'browse' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-3/4">
            <SoundBrowser 
              onSelectSound={handleSelectSound} 
              selectedSoundId={selectedSound?.id}
              title="" 
            />
          </div>
          
          <div className="w-full lg:w-1/4">
            <Card className="p-4 h-full">
              <h2 className="text-xl font-bold mb-4">Selected Sound</h2>
              
              {selectedSound ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Music size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedSound.title}</h3>
                      <p className="text-sm text-muted-foreground">By {selectedSound.authorName}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Button className="w-full">Add to Template</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <Music className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">No Sound Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a sound from the browser to see details
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'validate' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Sound Validator</CardTitle>
            <CardDescription>
              Validate sound data structure before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoundValidator 
              onValidate={(result) => console.log('Validation result:', result)}
              initialSound={{
                id: '',
                title: 'New Sound',
                authorName: 'Creator Name',
                duration: 0,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 