"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { ManualAdjustmentLog } from '@/lib/types/trendingTemplate';
import { trendPredictionService } from '@/lib/services/trendPredictionService';

const adjustmentSchema = z.object({
  field: z.string().min(1, "Field is required"),
  newValue: z.string().min(1, "New value is required"),
  reason: z.string().min(10, "Please provide a detailed reason"),
  expertConfidence: z.number().min(0).max(1),
  adjustmentCategory: z.enum(['growth', 'engagement', 'audience', 'content', 'other']),
  supportingData: z.string().optional(),
  impactAssessment: z.string().optional(),
  validityPeriod: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface ExpertAdjustmentFormProps {
  templateId: string;
  onAdjustmentComplete: (adjustment: ManualAdjustmentLog) => void;
  currentValue?: any;
}

export default function ExpertAdjustmentForm({
  templateId,
  onAdjustmentComplete,
  currentValue
}: ExpertAdjustmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      expertConfidence: 0.8,
      adjustmentCategory: 'other'
    }
  });
  
  const onSubmit = async (data: AdjustmentFormData) => {
    try {
      setIsSubmitting(true);
      
      const adjustment = await trendPredictionService.saveExpertAdjustment({
        templateId,
        field: data.field,
        previousValue: currentValue,
        newValue: data.newValue,
        reason: data.reason,
        adjustedBy: 'expert', // This should come from auth context
        expertConfidence: data.expertConfidence,
        adjustmentCategory: data.adjustmentCategory,
        supportingData: data.supportingData,
        impactAssessment: data.impactAssessment,
        validityPeriod: data.validityPeriod
      });
      
      toast.success('Expert adjustment saved successfully');
      onAdjustmentComplete(adjustment.manualAdjustments[adjustment.manualAdjustments.length - 1]);
      reset();
    } catch (error) {
      console.error('Error saving adjustment:', error);
      toast.error('Failed to save adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Field to Adjust</label>
        <Input
          {...register('field')}
          placeholder="e.g., trendData.confidenceScore"
        />
        {errors.field && (
          <p className="text-red-500 text-sm mt-1">{errors.field.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">New Value</label>
        <Input
          {...register('newValue')}
          placeholder="Enter new value"
        />
        {errors.newValue && (
          <p className="text-red-500 text-sm mt-1">{errors.newValue.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Reason for Adjustment</label>
        <Textarea
          {...register('reason')}
          placeholder="Explain why this adjustment is needed"
          rows={3}
        />
        {errors.reason && (
          <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <Select
          {...register('adjustmentCategory')}
          defaultValue="other"
        >
          <option value="growth">Growth Pattern</option>
          <option value="engagement">Engagement Metrics</option>
          <option value="audience">Target Audience</option>
          <option value="content">Content Analysis</option>
          <option value="other">Other</option>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Confidence Level (0-1)</label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="1"
          {...register('expertConfidence', { valueAsNumber: true })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Supporting Data (Optional)</label>
        <Textarea
          {...register('supportingData')}
          placeholder="Add any supporting data or evidence"
          rows={2}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Impact Assessment (Optional)</label>
        <Textarea
          {...register('impactAssessment')}
          placeholder="Describe expected impact of this adjustment"
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Valid From (Optional)</label>
          <Input
            type="date"
            {...register('validityPeriod.start')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valid Until (Optional)</label>
          <Input
            type="date"
            {...register('validityPeriod.end')}
          />
        </div>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Adjustment'}
      </Button>
    </form>
  );
} 