"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card-component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clipboard, ExternalLink, Music, Wand2, BarChart3, Check } from 'lucide-react';
import WeeklyTrendingSounds from '@/components/newsletter/WeeklyTrendingSounds';
import SoundTemplatePairings from '@/components/newsletter/SoundTemplatePairings';
import OneClickSoundSelector from '@/components/newsletter/OneClickSoundSelector';
import SoundPerformanceTracker from '@/components/newsletter/SoundPerformanceTracker';
import { newsletterSoundService } from '@/lib/services/newsletterSoundService';

// Define test templates
const TEST_TEMPLATES = [
  { id: 'dance-challenge', name: 'Viral Dance Challenge', category: 'Dance' },
  { id: 'product-review', name: 'ASMR Product Review', category: 'Marketing' },
  { id: 'cooking-hack', name: '30-Second Cooking Hack', category: 'Tutorial' },
  { id: 'story-time', name: 'Dramatic Story Time Format', category: 'Comedy' }
]

// Define test sounds
const TEST_SOUNDS = [
  { id: 'sound-1', title: 'Summer Vibes', authorName: 'MusicProducer', category: 'Pop', playUrl: 'https://example.com/audio-1.mp3' },
  { id: 'sound-2', title: 'Epic Intro', authorName: 'SoundDesigner', category: 'EDM', playUrl: 'https://example.com/audio-2.mp3' },
  { id: 'sound-3', title: 'Trending Beat', authorName: 'BeatMaker', category: 'Hip Hop', playUrl: 'https://example.com/audio-3.mp3' },
]

export default function TestNewsletterPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('dance-challenge')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPremiumMode, setIsPremiumMode] = useState(false)
  const [templateId, setTemplateId] = useState('template-001')
  const [campaign, setCampaign] = useState('test-campaign')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [newsletterId, setNewsletterId] = useState('newsletter-001')
  const [linkId, setLinkId] = useState('link-001')
  const [showWeeklyTrending, setShowWeeklyTrending] = useState(true)
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  
  // Generate test link
  const generateLink = () => {
    try {
      // Create a URL that includes the template ID
      const params = new URLSearchParams()
      params.append('template', selectedTemplate)
      params.append('utm_source', 'testing')
      params.append('utm_medium', 'email')
      params.append('utm_campaign', 'testing')
      
      // Add premium mode parameter if selected
      if (isPremiumMode) {
        params.append('to_editor', 'true')
      }
      
      // Build the URL
      const baseUrl = window.location.origin
      // Use the simple-test API route instead of the complex one
      const apiUrl = `/api/newsletter/simple-test?${params.toString()}`
      
      // Set the generated URL
      setGeneratedUrl(`${baseUrl}${apiUrl}`)
    } catch (error) {
      console.error('Error generating link:', error)
    }
  }
  
  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerate = () => {
    // Get the base URL from window.location
    const baseUrl = window.location.origin;
    
    // Generate the link
    const url = new URL(`${baseUrl}/template-redirect`);
    url.searchParams.append('id', templateId);
    url.searchParams.append('source', 'newsletter');
    url.searchParams.append('newsletterId', newsletterId);
    url.searchParams.append('linkId', linkId);
    
    if (campaign) {
      url.searchParams.append('campaign', campaign);
    }
    
    setGeneratedLink(url.toString());
  };
  
  const handleSoundSelect = (soundId: string) => {
    setSelectedSound(soundId);
    // In a real implementation, this would update the template with the selected sound
    console.log(`Selected sound: ${soundId} for template: ${templateId}`);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Newsletter Sound Integration Test</h1>
        
        <Tabs defaultValue="sound-features">
          <TabsList className="mb-6">
            <TabsTrigger value="sound-features">Sound Features</TabsTrigger>
            <TabsTrigger value="link-generator">Newsletter Link Generator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sound-features" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Weekly Trending Sounds Showcase */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Weekly Trending Sounds</h2>
                </div>
                <p className="text-muted-foreground">
                  Showcase of trending sounds in weekly newsletters.
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox" 
                    id="show-trending" 
                    checked={showWeeklyTrending}
                    onChange={(e) => setShowWeeklyTrending(e.target.checked)}
                  />
                  <label htmlFor="show-trending">Show Weekly Trending</label>
                </div>
                
                {showWeeklyTrending && (
                  <WeeklyTrendingSounds 
                    newsletterId={newsletterId}
                    linkId={linkId}
                    onSoundSelect={handleSoundSelect}
                    compactView={true}
                  />
                )}
              </div>
              
              {/* Sound-Template Pairing Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Sound-Template Pairings</h2>
                </div>
                <p className="text-muted-foreground">
                  AI-powered sound recommendations for templates.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Template ID</label>
                  <Input
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="Enter template ID"
                    className="mb-2"
                  />
                </div>
                
                <SoundTemplatePairings
                  templateId={templateId}
                  templateTitle="Demo Template"
                  newsletterId={newsletterId}
                  linkId={linkId}
                  onSoundSelect={handleSoundSelect}
                />
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* One-Click Sound Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">One-Click Sound Selection</h2>
                </div>
                <p className="text-muted-foreground">
                  Easily apply sounds to templates with one click.
                </p>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Apply Sound to Template</CardTitle>
                    <CardDescription>Select a sound to apply to your template</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {TEST_SOUNDS.map(sound => (
                      <OneClickSoundSelector
                        key={sound.id}
                        sound={sound}
                        templateId={templateId}
                        linkId={linkId}
                        newsletterId={newsletterId}
                        onSelect={handleSoundSelect}
                      />
                    ))}
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Selected sound: {selectedSound || 'None'}
                    </p>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Sound Performance Tracking */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Sound Performance Tracking</h2>
                </div>
                <p className="text-muted-foreground">
                  Track performance metrics for sounds.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sound ID</label>
                  <Select 
                    value={selectedSound || 'sound-1'} 
                    onValueChange={setSelectedSound}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_SOUNDS.map(sound => (
                        <SelectItem key={sound.id} value={sound.id}>
                          {sound.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <SoundPerformanceTracker
                  soundId={selectedSound || 'sound-1'}
                  linkId={linkId}
                  newsletterId={newsletterId}
                />
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Testing Information</h3>
              <p className="mb-4">Use these IDs for testing the integration features:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Newsletter ID:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={newsletterId} onChange={(e) => setNewsletterId(e.target.value)} />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(newsletterId)}
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Link ID:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={linkId} onChange={(e) => setLinkId(e.target.value)} />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(linkId)}
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="link-generator">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold mb-4">Generate Test Link</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template ID</label>
                  <Input
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="Enter template ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Name</label>
                  <Input
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <Button onClick={handleGenerate}>
                  Generate Link
                </Button>
              </div>
              
              {generatedLink && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                  <p className="font-medium mb-2">Generated Link:</p>
                  <div className="bg-white p-3 border border-gray-300 rounded break-all mb-3">
                    {generatedLink}
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link
                        href={generatedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink)}
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Test Templates</h2>
              <p className="mb-4">Click on one of the pre-configured test links below:</p>
              
              <div className="space-y-3">
                {TEST_TEMPLATES.map(template => (
                  <div key={template.id} className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium mb-1">{template.name} ({template.category})</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link 
                        href={`/template-redirect?id=${template.id}&source=newsletter&campaign=${campaign}&newsletterId=${newsletterId}&linkId=${linkId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Test Template
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 