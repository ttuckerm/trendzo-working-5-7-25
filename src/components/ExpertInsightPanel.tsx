'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TrendingTemplate, ExpertInsightTag, ManualAdjustmentLog } from '@/lib/types/trendingTemplate';
import { 
  ClipboardEdit, 
  Tag, 
  User, 
  Users, 
  Star, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  ListChecks 
} from 'lucide-react';

interface ExpertInsightPanelProps {
  templateId: string;
  existingInsights?: {
    tags?: ExpertInsightTag[];
    notes?: string;
    recommendedUses?: string[];
    performanceRating?: number;
    audienceRecommendation?: string[];
  };
  adjustments?: ManualAdjustmentLog[];
  readOnly?: boolean;
}

export default function ExpertInsightPanel({
  templateId,
  existingInsights,
  adjustments = [],
  readOnly = false
}: ExpertInsightPanelProps) {
  // State for form values
  const [notes, setNotes] = useState(existingInsights?.notes || '');
  const [newTag, setNewTag] = useState('');
  const [tagCategory, setTagCategory] = useState<'content' | 'engagement' | 'trend' | 'demographic' | 'other'>('content');
  const [tagConfidence, setTagConfidence] = useState<number>(0.8);
  const [tags, setTags] = useState<ExpertInsightTag[]>(existingInsights?.tags || []);
  const [recommendedUses, setRecommendedUses] = useState<string[]>(existingInsights?.recommendedUses || []);
  const [newUse, setNewUse] = useState('');
  const [rating, setRating] = useState<number>(existingInsights?.performanceRating || 3);
  const [audiences, setAudiences] = useState<string[]>(existingInsights?.audienceRecommendation || []);
  const [newAudience, setNewAudience] = useState('');
  
  // State for manage UI
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  
  // Function to add a tag
  const addTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      setLoading({...loading, addTag: true});
      setError({...error, addTag: ''});
      
      const tag = {
        tag: newTag,
        category: tagCategory,
        confidence: tagConfidence
      };
      
      const response = await fetch('/api/templates/expert-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          action: 'add_tags',
          tags: [tag]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add tag');
      }
      
      // Add new tag to local state
      setTags([...tags, ...data.data]);
      setNewTag('');
      setSuccess({...success, addTag: true});
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess({...success, addTag: false});
      }, 3000);
    } catch (err) {
      setError({...error, addTag: err instanceof Error ? err.message : 'Unknown error'});
    } finally {
      setLoading({...loading, addTag: false});
    }
  };
  
  // Function to save notes
  const saveNotes = async () => {
    try {
      setLoading({...loading, notes: true});
      setError({...error, notes: ''});
      
      const response = await fetch('/api/templates/expert-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          action: 'add_notes',
          notes
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save notes');
      }
      
      setSuccess({...success, notes: true});
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess({...success, notes: false});
      }, 3000);
    } catch (err) {
      setError({...error, notes: err instanceof Error ? err.message : 'Unknown error'});
    } finally {
      setLoading({...loading, notes: false});
    }
  };
  
  // Function to add recommended use
  const addRecommendedUse = async () => {
    if (!newUse.trim()) return;
    
    try {
      setLoading({...loading, recommendedUse: true});
      setError({...error, recommendedUse: ''});
      
      const updatedUses = [...recommendedUses, newUse];
      
      const response = await fetch('/api/templates/expert-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          action: 'update_recommended_uses',
          recommendedUses: updatedUses
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add recommended use');
      }
      
      // Update local state
      setRecommendedUses(updatedUses);
      setNewUse('');
      setSuccess({...success, recommendedUse: true});
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess({...success, recommendedUse: false});
      }, 3000);
    } catch (err) {
      setError({...error, recommendedUse: err instanceof Error ? err.message : 'Unknown error'});
    } finally {
      setLoading({...loading, recommendedUse: false});
    }
  };
  
  // Function to update rating
  const updateRating = async (newRating: number) => {
    try {
      setLoading({...loading, rating: true});
      setError({...error, rating: ''});
      
      const response = await fetch('/api/templates/expert-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          action: 'update_performance_rating',
          rating: newRating
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update rating');
      }
      
      // Update local state
      setRating(newRating);
      setSuccess({...success, rating: true});
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess({...success, rating: false});
      }, 3000);
    } catch (err) {
      setError({...error, rating: err instanceof Error ? err.message : 'Unknown error'});
    } finally {
      setLoading({...loading, rating: false});
    }
  };
  
  // Function to add audience recommendation
  const addAudience = async () => {
    if (!newAudience.trim()) return;
    
    try {
      setLoading({...loading, audience: true});
      setError({...error, audience: ''});
      
      const updatedAudiences = [...audiences, newAudience];
      
      const response = await fetch('/api/templates/expert-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          action: 'update_audience',
          audience: updatedAudiences
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add audience');
      }
      
      // Update local state
      setAudiences(updatedAudiences);
      setNewAudience('');
      setSuccess({...success, audience: true});
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess({...success, audience: false});
      }, 3000);
    } catch (err) {
      setError({...error, audience: err instanceof Error ? err.message : 'Unknown error'});
    } finally {
      setLoading({...loading, audience: false});
    }
  };
  
  // Function to remove tag (would need a similar API call)
  const removeTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };
  
  // Function to remove recommended use
  const removeRecommendedUse = (use: string) => {
    const updatedUses = recommendedUses.filter(item => item !== use);
    setRecommendedUses(updatedUses);
  };
  
  // Function to remove audience
  const removeAudience = (audience: string) => {
    const updatedAudiences = audiences.filter(item => item !== audience);
    setAudiences(updatedAudiences);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardEdit className="h-5 w-5" />
          Expert Insights
        </CardTitle>
        <CardDescription>
          Expert analysis and recommendations for this template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="insights">
          <TabsList className="mb-4">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="uses">Recommended Uses</TabsTrigger>
            <TabsTrigger value="audience">Target Audience</TabsTrigger>
            {adjustments.length > 0 && (
              <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="insights">
            <div className="space-y-4">
              {/* Tags */}
              <div>
                <Label className="text-sm font-medium mb-1 block">Insight Tags</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      <span>{tag.tag}</span>
                      {!readOnly && (
                        <button
                          onClick={() => removeTag(tag.id)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          &times;
                        </button>
                      )}
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags added yet</span>
                  )}
                </div>
                
                {!readOnly && (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={tagCategory} onValueChange={(val: any) => setTagCategory(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="trend">Trend</SelectItem>
                          <SelectItem value="demographic">Demographic</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={tagConfidence.toString()} 
                        onValueChange={(val) => setTagConfidence(parseFloat(val))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Confidence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">50% - Low</SelectItem>
                          <SelectItem value="0.7">70% - Medium</SelectItem>
                          <SelectItem value="0.8">80% - High</SelectItem>
                          <SelectItem value="0.9">90% - Very High</SelectItem>
                          <SelectItem value="1.0">100% - Certain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <Input
                          placeholder="Add a new insight tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <Button 
                        onClick={addTag} 
                        disabled={loading.addTag || !newTag.trim()}
                        size="sm"
                      >
                        {loading.addTag ? 'Adding...' : 'Add Tag'}
                      </Button>
                    </div>
                    {error.addTag && (
                      <p className="text-sm text-destructive mt-1">{error.addTag}</p>
                    )}
                    {success.addTag && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Tag added successfully
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <div>
                <Label className="text-sm font-medium mb-1 block">Expert Notes</Label>
                <div className="mt-1">
                  <Textarea
                    placeholder="Add your expert analysis and insights about this template..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[120px]"
                    disabled={readOnly}
                  />
                </div>
                
                {!readOnly && (
                  <div className="mt-2 flex justify-end">
                    <Button 
                      onClick={saveNotes} 
                      disabled={loading.notes}
                      size="sm"
                    >
                      {loading.notes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                )}
                
                {error.notes && (
                  <p className="text-sm text-destructive mt-1">{error.notes}</p>
                )}
                {success.notes && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Notes saved successfully
                  </p>
                )}
              </div>
              
              {/* Performance Rating */}
              <div>
                <Label className="text-sm font-medium mb-1 block">Performance Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => !readOnly && updateRating(star)}
                      disabled={readOnly}
                      className={`p-1 rounded-md ${readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-muted'}`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating}/5
                  </span>
                </div>
                
                {error.rating && (
                  <p className="text-sm text-destructive mt-1">{error.rating}</p>
                )}
                {success.rating && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Rating updated successfully
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="uses">
            <div className="space-y-4">
              <Label className="text-sm font-medium mb-1 block">Recommended Uses</Label>
              <ul className="space-y-2">
                {recommendedUses.length > 0 ? (
                  recommendedUses.map((use, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="flex-grow">{use}</span>
                      {!readOnly && (
                        <button
                          onClick={() => removeRecommendedUse(use)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          &times;
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No recommended uses added yet</li>
                )}
              </ul>
              
              {!readOnly && (
                <div className="flex gap-2 mt-4">
                  <div className="flex-grow">
                    <Input
                      placeholder="Add a recommended use case..."
                      value={newUse}
                      onChange={(e) => setNewUse(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    onClick={addRecommendedUse} 
                    disabled={loading.recommendedUse || !newUse.trim()}
                    size="sm"
                  >
                    {loading.recommendedUse ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              )}
              
              {error.recommendedUse && (
                <p className="text-sm text-destructive mt-1">{error.recommendedUse}</p>
              )}
              {success.recommendedUse && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Recommended use added successfully
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="audience">
            <div className="space-y-4">
              <Label className="text-sm font-medium mb-1 block">Target Audience</Label>
              <ul className="space-y-2">
                {audiences.length > 0 ? (
                  audiences.map((audience, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="flex-grow">{audience}</span>
                      {!readOnly && (
                        <button
                          onClick={() => removeAudience(audience)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          &times;
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No audience recommendations added yet</li>
                )}
              </ul>
              
              {!readOnly && (
                <div className="flex gap-2 mt-4">
                  <div className="flex-grow">
                    <Input
                      placeholder="Add a target audience..."
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    onClick={addAudience} 
                    disabled={loading.audience || !newAudience.trim()}
                    size="sm"
                  >
                    {loading.audience ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              )}
              
              {error.audience && (
                <p className="text-sm text-destructive mt-1">{error.audience}</p>
              )}
              {success.audience && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Audience recommendation added successfully
                </p>
              )}
            </div>
          </TabsContent>
          
          {adjustments.length > 0 && (
            <TabsContent value="adjustments">
              <div>
                <Label className="text-sm font-medium mb-2 block">Manual Adjustments History</Label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {adjustments.map((adjustment) => (
                    <div key={adjustment.id} className="bg-muted p-3 rounded-md text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{adjustment.field}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(adjustment.adjustedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {adjustment.reason}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-50 p-2 rounded">
                          <div className="font-medium text-red-600">Previous</div>
                          <div className="mt-1 break-words">
                            {typeof adjustment.previousValue === 'object' 
                              ? JSON.stringify(adjustment.previousValue) 
                              : String(adjustment.previousValue)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-medium text-green-600">New</div>
                          <div className="mt-1 break-words">
                            {typeof adjustment.newValue === 'object' 
                              ? JSON.stringify(adjustment.newValue) 
                              : String(adjustment.newValue)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Adjusted by {adjustment.adjustedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Expert insights are used to enhance automated analysis</span>
        </div>
        {!readOnly && (
          <span>Expert mode: Active</span>
        )}
      </CardFooter>
    </Card>
  );
} 