# TikTok Template Analyzer

## Overview

The TikTok Template Analyzer is an advanced tool for analyzing TikTok videos to identify template patterns, engagement metrics, and viral potential. It leverages Claude AI for enhanced analysis capabilities and provides comprehensive insights for content creators.

## Components

### Main Components

- **TemplateAnalyzerPage**: Main container component with the analyzer interface
- **VideoPreview**: Displays TikTok video information with engagement metrics
- **TemplateVisualizer**: Visualizes template structure as a timeline with sections
- **EngagementMetrics**: Shows key metrics with visual indicators
- **AnalysisSummary**: Provides a comprehensive summary of the analysis
- **TestRunner**: Allows testing the analyzer with different configurations
- **HelpGuide**: Offers usage tips and troubleshooting information
- **StoredTemplateList**: Displays templates stored in Firebase

### Services

- **advancedTemplateAnalysisService**: Handles advanced template analysis with AI
- **templateAnalysisService**: Provides basic template analysis functionality
- **templateStorageService**: Manages template storage in Firebase

## Features

### AI-Powered Analysis

The analyzer uses Claude AI to extract detailed insights from TikTok videos:

1. **Template Structure Detection**: Identifies distinct sections (hook, intro, content, etc.) with timing information
2. **Engagement Metrics**: Calculates engagement rate, completion rate, and other performance indicators
3. **Virality Prediction**: Estimates viral potential based on content patterns
4. **Content Optimization**: Provides recommendations for improving template effectiveness

### Visualization Tools

1. **Template Timeline**: Visual representation of template sections
2. **Metric Dashboards**: Color-coded indicators of performance metrics
3. **Similarity Detection**: Identifies similar templates for comparison

### Firebase Integration

All analysis results can be stored in Firebase for:

1. **Template Library Building**: Creating a database of effective templates
2. **Trend Analysis**: Tracking evolving template patterns over time
3. **Engagement Comparison**: Benchmarking performance across templates

## How to Use

1. **Fetch Videos**: Enter the number of videos to fetch and click "Fetch Videos"
2. **Select Video**: Choose a video from the list to analyze
3. **Analyze Template**: Click "Analyze Template" to process the selected video
4. **View Results**: Explore the comprehensive analysis with visualizations
5. **Store Template**: Templates are automatically stored in Firebase if available

## Advanced Usage

### Testing Tools

Use the Test Runner to evaluate analyzer performance:

1. **Fetch Test**: Tests video fetching functionality
2. **Analysis Test**: Tests template analysis with mock data
3. **Storage Test**: Tests Firebase storage integration

### Stored Templates

Access the "Stored Templates" tab to:

1. View all stored template analyses
2. Compare template performance
3. Delete templates when no longer needed

## Development Notes

- The analyzer uses the Claude 3.5 Sonnet model for optimal analysis
- API calls are mocked in development when API keys are not available
- Firebase storage status is displayed after each analysis 