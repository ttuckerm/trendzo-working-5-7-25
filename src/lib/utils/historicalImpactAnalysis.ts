import { 
  Prediction,
  ExpertAdjustment
} from '../types/prediction';
import {
  HistoricalImpact,
  AdjustmentTypeImpact,
  TimeseriesDataPoint,
  AdjustmentImpactDetails,
  HistoricalImpactAnalysis,
  ExpertPerformance
} from '../types/expertDashboard';

/**
 * Generates a complete historical impact analysis report
 */
export const generateHistoricalImpactAnalysis = (
  predictions: Prediction[],
  timeRange: { startDate: Date; endDate: Date },
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): HistoricalImpactAnalysis => {
  // Filter predictions within the time range
  const filteredPredictions = predictions.filter(p => {
    const predDate = new Date(p.timestamp);
    return predDate >= timeRange.startDate && predDate <= timeRange.endDate;
  });

  // Generate timeframes based on granularity
  const timeframes = generateTimeframes(filteredPredictions, timeRange, timeGranularity);
  
  // Analyze impact by adjustment type
  const adjustmentTypes = analyzeAdjustmentTypes(filteredPredictions);
  
  // Find most impactful adjustments
  const topImpactfulAdjustments = findTopImpactfulAdjustments(filteredPredictions);
  
  // Analyze expert performance
  const expertPerformance = analyzeExpertPerformance(filteredPredictions);
  
  // Generate trend data
  const trendData = {
    accuracy: generateAccuracyTrend(filteredPredictions, timeRange, timeGranularity),
    adjustmentVolume: generateAdjustmentVolumeTrend(filteredPredictions, timeRange, timeGranularity),
    impactOverTime: generateImpactTrend(filteredPredictions, timeRange, timeGranularity)
  };
  
  return {
    timeframes,
    adjustmentTypes,
    topImpactfulAdjustments,
    expertPerformance,
    trendData
  };
};

/**
 * Generates time periods based on the specified granularity
 */
const generateTimeframes = (
  predictions: Prediction[],
  timeRange: { startDate: Date; endDate: Date },
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): HistoricalImpact[] => {
  // Generate time periods based on granularity
  const timePeriods = splitTimeRange(timeRange.startDate, timeRange.endDate, timeGranularity);
  
  return timePeriods.map(period => {
    // Filter predictions for this time period
    const periodPredictions = predictions.filter(p => {
      const predDate = new Date(p.timestamp);
      return predDate >= period.startDate && predDate <= period.endDate;
    });
    
    // Count total and adjusted predictions
    const totalPredictions = periodPredictions.length;
    const adjustedPredictions = periodPredictions.filter(p => p.expertAdjustment).length;
    
    // Calculate original and adjusted accuracy
    const originalAccuracy = calculateOriginalAccuracy(periodPredictions);
    const adjustedAccuracy = calculateAdjustedAccuracy(periodPredictions);
    
    // Calculate confidence change
    const confidenceChange = calculateConfidenceChange(periodPredictions);
    
    // Get unique expert IDs
    const expertIds = Array.from(new Set(
      periodPredictions
        .filter(p => p.expertAdjustment?.expertId)
        .map(p => p.expertAdjustment!.expertId!)
    ));
    
    return {
      id: `period-${period.startDate.toISOString()}`,
      period: formatPeriod(period.startDate, timeGranularity),
      startDate: period.startDate,
      endDate: period.endDate,
      originalAccuracy,
      adjustedAccuracy,
      improvementPercent: adjustedAccuracy - originalAccuracy,
      totalPredictions,
      adjustedPredictions,
      adjustmentRate: totalPredictions > 0 ? adjustedPredictions / totalPredictions : 0,
      confidenceChange,
      expertIds
    };
  });
};

/**
 * Analyzes impact by adjustment type/category
 */
const analyzeAdjustmentTypes = (predictions: Prediction[]): AdjustmentTypeImpact[] => {
  // Get unique categories
  const categories = Array.from(new Set(predictions.map(p => p.category)));
  
  return categories.map(category => {
    // Filter predictions by category
    const categoryPredictions = predictions.filter(p => p.category === category);
    const adjustedPredictions = categoryPredictions.filter(p => p.expertAdjustment);
    
    // Calculate metrics
    const totalCount = adjustedPredictions.length;
    
    // Calculate how many adjustments improved predictions
    const successfulAdjustments = adjustedPredictions.filter(p => {
      if (p.actualValue === undefined) return false;
      
      const originalError = Math.abs(p.predictedValue - p.actualValue);
      const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue);
      
      return adjustedError < originalError;
    });
    
    const successRate = totalCount > 0 ? successfulAdjustments.length / totalCount : 0;
    
    // Calculate average improvement
    const improvements = adjustedPredictions.map(p => {
      if (p.actualValue === undefined) return 0;
      
      const originalError = Math.abs(p.predictedValue - p.actualValue) / p.actualValue;
      const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue) / p.actualValue;
      
      return originalError - adjustedError;
    });
    
    const averageImprovement = improvements.length > 0 
      ? improvements.reduce((sum, val) => sum + val, 0) / improvements.length
      : 0;
    
    // Calculate confidence change
    const confidenceChanges = adjustedPredictions.map(p => {
      const originalConfidence = p.confidence;
      const adjustedConfidence = p.expertAdjustment!.adjustedConfidence;
      return adjustedConfidence - originalConfidence;
    });
    
    const confidenceChange = confidenceChanges.length > 0
      ? confidenceChanges.reduce((sum, val) => sum + val, 0) / confidenceChanges.length
      : 0;
    
    // Generate timeseries data
    const timeseriesData = generateCategoryTimeseries(adjustedPredictions);
    
    return {
      adjustmentType: category,
      totalCount,
      averageImprovement,
      successRate,
      confidenceChange,
      timeseriesData
    };
  });
};

/**
 * Generates timeseries data for a specific category
 */
const generateCategoryTimeseries = (predictions: Prediction[]): TimeseriesDataPoint[] => {
  if (predictions.length === 0) return [];
  
  // Sort predictions by timestamp
  const sortedPredictions = [...predictions].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  
  // Group by month for visualization
  const monthlyData = new Map<string, number[]>();
  
  sortedPredictions.forEach(p => {
    if (p.actualValue === undefined || !p.expertAdjustment) return;
    
    const date = new Date(p.timestamp);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    const originalError = Math.abs(p.predictedValue - p.actualValue) / p.actualValue;
    const adjustedError = Math.abs(p.expertAdjustment.value - p.actualValue) / p.actualValue;
    const improvement = originalError - adjustedError;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }
    
    monthlyData.get(monthKey)!.push(improvement);
  });
  
  // Calculate average improvement per month
  return Array.from(monthlyData.entries()).map(([monthKey, improvements]) => {
    const [year, month] = monthKey.split('-').map(Number);
    const avgImprovement = improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
    
    return {
      date: new Date(year, month - 1, 15), // Middle of the month
      value: avgImprovement * 100 // Convert to percentage
    };
  });
};

/**
 * Finds the most impactful adjustments
 */
const findTopImpactfulAdjustments = (predictions: Prediction[], limit: number = 10): AdjustmentImpactDetails[] => {
  // Filter predictions with actual values and expert adjustments
  const adjustedPredictions = predictions.filter(p => 
    p.actualValue !== undefined && p.expertAdjustment
  );
  
  // Calculate impact for each adjustment
  const adjustmentImpacts = adjustedPredictions.map(p => {
    const originalError = Math.abs(p.predictedValue - p.actualValue!) / p.actualValue!;
    const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue!) / p.actualValue!;
    const improvementPercent = originalError - adjustedError;
    
    return {
      adjustmentId: `adj-${p.id}`,
      category: p.category,
      timestamp: new Date(p.expertAdjustment!.timestamp),
      originalValue: p.predictedValue,
      adjustedValue: p.expertAdjustment!.value,
      actualValue: p.actualValue,
      originalError,
      adjustedError,
      improvementPercent,
      expertId: p.expertAdjustment!.expertId || 'unknown',
      reason: p.expertAdjustment!.reason
    };
  });
  
  // Sort by impact (improvement) and take top N
  return adjustmentImpacts
    .sort((a, b) => b.improvementPercent! - a.improvementPercent!)
    .slice(0, limit);
};

/**
 * Analyzes expert performance
 */
const analyzeExpertPerformance = (predictions: Prediction[]): ExpertPerformance[] => {
  // Get unique expert IDs
  const expertIds = Array.from(new Set(
    predictions
      .filter(p => p.expertAdjustment?.expertId)
      .map(p => p.expertAdjustment!.expertId!)
  ));
  
  return expertIds.map(expertId => {
    // Filter predictions adjusted by this expert
    const expertAdjustments = predictions.filter(p => 
      p.expertAdjustment?.expertId === expertId
    );
    
    // Calculate adjustment count
    const adjustmentCount = expertAdjustments.length;
    
    // Calculate average impact
    const impacts = expertAdjustments
      .filter(p => p.actualValue !== undefined)
      .map(p => {
        const originalError = Math.abs(p.predictedValue - p.actualValue!) / p.actualValue!;
        const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue!) / p.actualValue!;
        return originalError - adjustedError;
      });
    
    const averageImpact = impacts.length > 0
      ? impacts.reduce((sum, val) => sum + val, 0) / impacts.length
      : 0;
    
    // Calculate success rate
    const successfulAdjustments = expertAdjustments.filter(p => {
      if (p.actualValue === undefined) return false;
      
      const originalError = Math.abs(p.predictedValue - p.actualValue);
      const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue);
      
      return adjustedError < originalError;
    });
    
    const successRate = adjustmentCount > 0
      ? successfulAdjustments.length / adjustmentCount
      : 0;
    
    // Analyze performance by category
    const categories = Array.from(new Set(expertAdjustments.map(p => p.category)));
    
    const topCategories = categories.map(category => {
      const categoryAdjustments = expertAdjustments.filter(p => p.category === category);
      
      const categoryImpacts = categoryAdjustments
        .filter(p => p.actualValue !== undefined)
        .map(p => {
          const originalError = Math.abs(p.predictedValue - p.actualValue!) / p.actualValue!;
          const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue!) / p.actualValue!;
          return originalError - adjustedError;
        });
      
      const avgCategoryImpact = categoryImpacts.length > 0
        ? categoryImpacts.reduce((sum, val) => sum + val, 0) / categoryImpacts.length
        : 0;
      
      return {
        category,
        adjustmentCount: categoryAdjustments.length,
        averageImpact: avgCategoryImpact
      };
    }).sort((a, b) => b.averageImpact - a.averageImpact);
    
    return {
      expertId,
      name: `Expert ${expertId}`, // In a real app, fetch the expert's name
      adjustmentCount,
      averageImpact,
      successRate,
      topCategories: topCategories.slice(0, 3) // Top 3 categories
    };
  });
};

/**
 * Generates accuracy trend data over time
 */
const generateAccuracyTrend = (
  predictions: Prediction[],
  timeRange: { startDate: Date; endDate: Date },
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): TimeseriesDataPoint[] => {
  // Generate time periods
  const timePeriods = splitTimeRange(timeRange.startDate, timeRange.endDate, timeGranularity);
  
  // Calculate accuracy for each period
  return timePeriods.map(period => {
    // Filter predictions for this time period
    const periodPredictions = predictions.filter(p => {
      const predDate = new Date(p.timestamp);
      return predDate >= period.startDate && predDate <= period.endDate;
    });
    
    // Calculate original and adjusted accuracy
    const originalAccuracy = calculateOriginalAccuracy(periodPredictions);
    const adjustedAccuracy = calculateAdjustedAccuracy(periodPredictions);
    
    return {
      date: new Date(period.startDate.getTime() + (period.endDate.getTime() - period.startDate.getTime()) / 2),
      value: adjustedAccuracy,
      category: 'Adjusted Accuracy'
    };
  });
};

/**
 * Generates adjustment volume trend data over time
 */
const generateAdjustmentVolumeTrend = (
  predictions: Prediction[],
  timeRange: { startDate: Date; endDate: Date },
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): TimeseriesDataPoint[] => {
  // Generate time periods
  const timePeriods = splitTimeRange(timeRange.startDate, timeRange.endDate, timeGranularity);
  
  // Calculate adjustment volume for each period
  return timePeriods.map(period => {
    // Filter predictions for this time period
    const periodPredictions = predictions.filter(p => {
      const predDate = new Date(p.timestamp);
      return predDate >= period.startDate && predDate <= period.endDate;
    });
    
    // Count adjustments
    const adjustmentCount = periodPredictions.filter(p => p.expertAdjustment).length;
    
    return {
      date: new Date(period.startDate.getTime() + (period.endDate.getTime() - period.startDate.getTime()) / 2),
      value: adjustmentCount
    };
  });
};

/**
 * Generates impact trend data over time
 */
const generateImpactTrend = (
  predictions: Prediction[],
  timeRange: { startDate: Date; endDate: Date },
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): TimeseriesDataPoint[] => {
  // Generate time periods
  const timePeriods = splitTimeRange(timeRange.startDate, timeRange.endDate, timeGranularity);
  
  // Calculate impact for each period
  return timePeriods.map(period => {
    // Filter predictions for this time period
    const periodPredictions = predictions.filter(p => {
      const predDate = new Date(p.timestamp);
      return predDate >= period.startDate && predDate <= period.endDate;
    });
    
    // Calculate original and adjusted accuracy
    const originalAccuracy = calculateOriginalAccuracy(periodPredictions);
    const adjustedAccuracy = calculateAdjustedAccuracy(periodPredictions);
    const impact = adjustedAccuracy - originalAccuracy;
    
    return {
      date: new Date(period.startDate.getTime() + (period.endDate.getTime() - period.startDate.getTime()) / 2),
      value: impact
    };
  });
};

/**
 * Splits a time range into periods based on the specified granularity
 */
const splitTimeRange = (
  startDate: Date,
  endDate: Date,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): Array<{ startDate: Date; endDate: Date }> => {
  const periods: Array<{ startDate: Date; endDate: Date }> = [];
  
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    let periodEndDate: Date;
    
    switch (granularity) {
      case 'daily':
        periodEndDate = new Date(currentDate);
        periodEndDate.setDate(periodEndDate.getDate() + 1);
        periodEndDate.setHours(0, 0, 0, 0);
        break;
        
      case 'weekly':
        periodEndDate = new Date(currentDate);
        periodEndDate.setDate(periodEndDate.getDate() + 7);
        periodEndDate.setHours(0, 0, 0, 0);
        break;
        
      case 'monthly':
        periodEndDate = new Date(currentDate);
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
        periodEndDate.setDate(1);
        periodEndDate.setHours(0, 0, 0, 0);
        break;
        
      case 'quarterly':
        periodEndDate = new Date(currentDate);
        periodEndDate.setMonth(periodEndDate.getMonth() + 3);
        periodEndDate.setDate(1);
        periodEndDate.setHours(0, 0, 0, 0);
        break;
        
      default:
        periodEndDate = new Date(currentDate);
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
        periodEndDate.setHours(0, 0, 0, 0);
    }
    
    // Cap the end date to the overall end date
    if (periodEndDate > endDate) {
      periodEndDate = new Date(endDate);
    }
    
    periods.push({
      startDate: new Date(currentDate),
      endDate: new Date(periodEndDate)
    });
    
    currentDate = new Date(periodEndDate);
  }
  
  return periods;
};

/**
 * Formats a date into a period string based on granularity
 */
const formatPeriod = (date: Date, granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly'): string => {
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  
  switch (granularity) {
    case 'daily':
      return `${month} ${date.getDate()}, ${year}`;
      
    case 'weekly':
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${month} ${date.getDate()}-${weekEnd.getDate()}, ${year}`;
      
    case 'monthly':
      return `${month} ${year}`;
      
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${year}`;
      
    default:
      return `${month} ${year}`;
  }
};

/**
 * Calculates original prediction accuracy
 */
const calculateOriginalAccuracy = (predictions: Prediction[]): number => {
  if (predictions.length === 0) return 0;
  
  const predictionsWithActual = predictions.filter(p => 
    p.actualValue !== undefined && p.predictedValue !== undefined
  );
  
  if (predictionsWithActual.length === 0) return 0;
  
  // Calculate accuracy as 1 - average relative error
  const errors = predictionsWithActual.map(p => {
    const relativeError = Math.abs(p.predictedValue - p.actualValue!) / Math.abs(p.actualValue!);
    return Math.min(relativeError, 1); // Cap error at 100%
  });
  
  const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  return (1 - avgError) * 100; // Convert to percentage
};

/**
 * Calculates adjusted prediction accuracy
 */
const calculateAdjustedAccuracy = (predictions: Prediction[]): number => {
  if (predictions.length === 0) return 0;
  
  const adjustedPredictions = predictions.filter(p => 
    p.actualValue !== undefined && p.expertAdjustment
  );
  
  if (adjustedPredictions.length === 0) {
    // If no adjustments, use original accuracy
    return calculateOriginalAccuracy(predictions);
  }
  
  // Calculate accuracy as 1 - average relative error
  const errors = adjustedPredictions.map(p => {
    const relativeError = Math.abs(p.expertAdjustment!.value - p.actualValue!) / Math.abs(p.actualValue!);
    return Math.min(relativeError, 1); // Cap error at 100%
  });
  
  const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  return (1 - avgError) * 100; // Convert to percentage
};

/**
 * Calculates average confidence change
 */
const calculateConfidenceChange = (predictions: Prediction[]): number => {
  const adjustedPredictions = predictions.filter(p => p.expertAdjustment?.adjustedConfidence !== undefined);
  
  if (adjustedPredictions.length === 0) return 0;
  
  const confidenceChanges = adjustedPredictions.map(p => {
    return p.expertAdjustment!.adjustedConfidence - p.confidence;
  });
  
  return confidenceChanges.reduce((sum, change) => sum + change, 0) / confidenceChanges.length;
}; 