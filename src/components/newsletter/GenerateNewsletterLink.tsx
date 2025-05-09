'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Link as LinkIcon, Copy, Check, Sparkles, User } from 'lucide-react';
import { CreateNewsletterLinkParams } from '@/lib/types/newsletter';

// Simple Switch component since we don't have the ui/switch available
const Switch = ({ id, checked, onCheckedChange, disabled }: { 
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        id={id}
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
      <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${checked ? 'bg-blue-600' : ''}`}>
        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-all ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
    </label>
  );
};

interface GenerateNewsletterLinkProps {
  templateId: string;
  templateTitle: string;
  onSuccess?: (linkData: any) => void;
}

/**
 * Component for generating shareable newsletter links with content source tagging
 */
export default function GenerateNewsletterLink({
  templateId,
  templateTitle,
  onSuccess
}: GenerateNewsletterLinkProps) {
  const router = useRouter();
  const [title, setTitle] = useState(templateTitle || 'Template Link');
  const [description, setDescription] = useState('');
  const [campaign, setCampaign] = useState('newsletter');
  const [isExpertContent, setIsExpertContent] = useState(false);
  const [expertNote, setExpertNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate a newsletter link
  const generateLink = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create link params
      const linkParams: CreateNewsletterLinkParams = {
        templateId,
        title,
        description,
        utm_source: 'newsletter',
        utm_medium: 'email',
        utm_campaign: campaign,
        expertCreated: isExpertContent,
        expertNote: isExpertContent ? expertNote : undefined
      };
      
      // Call API to generate link
      const response = await fetch('/api/newsletter/generate-template-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkParams)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate link');
      }
      
      const data = await response.json();
      
      // Also tag the template for analytics
      await tagTemplateSource(isExpertContent);
      
      // Set state with generated link
      setGeneratedLink(data.fullUrl);
      setLinkGenerated(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error generating link:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };
  
  // Tag the template source for analytics
  const tagTemplateSource = async (isExpert: boolean) => {
    try {
      const response = await fetch('/api/analytics/expert-vs-automated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          isExpert,
          notes: isExpert ? expertNote : 'Generated for newsletter'
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to tag template source, but link was generated');
      }
    } catch (error) {
      console.warn('Error tagging template source:', error);
      // Don't throw the error, as the link was still generated
    }
  };

  // Copy the link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Generate Newsletter Link</CardTitle>
        <CardDescription>
          Create a shareable link to this template for your newsletter
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!linkGenerated ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Link Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for this link"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for your reference"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="campaign">Campaign</Label>
              <Input
                id="campaign"
                placeholder="Campaign name"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be used for tracking in analytics
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isExpert" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Expert-Created Content</span>
                </Label>
                <Switch
                  id="isExpert"
                  checked={isExpertContent}
                  onCheckedChange={setIsExpertContent}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Tag this template as expert-created for analytics comparison
              </p>
            </div>
            
            {isExpertContent && (
              <div className="pl-3 border-l-2 border-blue-200">
                <Label htmlFor="expertNote">Expert Notes</Label>
                <Textarea
                  id="expertNote"
                  placeholder="Add notes about this expert-created template"
                  value={expertNote}
                  onChange={(e) => setExpertNote(e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>
            )}
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-blue-50">
              <Label className="text-sm text-blue-700 mb-1 block">Your Generated Link:</Label>
              <div className="flex items-center">
                <Input
                  value={generatedLink}
                  readOnly
                  className="pr-10 bg-white"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-[-40px]"
                  onClick={copyLink}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <h4 className="font-medium mb-1">Link Details:</h4>
              <ul className="space-y-1">
                <li>
                  <span className="text-gray-500">Title:</span> {title}
                </li>
                {description && (
                  <li>
                    <span className="text-gray-500">Description:</span> {description}
                  </li>
                )}
                <li>
                  <span className="text-gray-500">Campaign:</span> {campaign}
                </li>
                <li>
                  <span className="text-gray-500">Content Type:</span> {isExpertContent ? 'Expert-Created' : 'Automated'}
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {!linkGenerated ? (
          <>
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={generateLink} disabled={loading || !title}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Generate Link
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setLinkGenerated(false)}>
              Create Another
            </Button>
            <Button onClick={() => router.push('/dashboard-view/analytics/newsletter')}>
              <Sparkles className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
} 