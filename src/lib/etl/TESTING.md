# Testing the Template Analyzer

This document explains how to test the TikTok template analyzer to verify that it's working correctly.

## Prerequisites

Before running tests, ensure you have set up your environment correctly:

1. Make sure your `.env.local` file contains the required environment variables:
   - `APIFY_API_TOKEN`: For fetching TikTok videos
   - `ANTHROPIC_API_KEY`: For Claude AI template analysis
   - `FIREBASE_*`: Firebase configuration variables

2. Install all dependencies:
   ```bash
   npm install
   ```

## Running Tests

We provide several ways to test the template analyzer:

### 1. Run All Tests

To run all template analyzer tests:

```bash
npm run test-analyzer
```

This will test:
- Video processing
- Template categorization
- Structure extraction
- Template similarity (if templates exist in Firebase)

### 2. Test Individual Components

You can test specific components of the analyzer:

```bash
# Test video processing (fetching videos and running them through the analyzer)
npm run test-analyzer processing

# Test template categorization
npm run test-analyzer categorization

# Test template structure extraction
npm run test-analyzer structure

# Test template similarity detection
npm run test-analyzer similarity
```

### 3. Configure Sample Size

Adjust the number of TikTok videos to sample in your tests:

```bash
npm run test-analyzer processing --samples=5
npm run test-analyzer categorization --samples=10
```

## What Each Test Verifies

### Video Processing Test

This test verifies:
- Connection to Apify scraper works
- Videos can be fetched from TikTok
- Video structure can be validated
- Claude AI can analyze the videos

### Template Categorization Test

This test verifies:
- Videos can be correctly categorized into template types
- Compares basic categorization vs. AI-enhanced categorization
- Shows the range of categories detected

### Template Structure Extraction Test

This test verifies:
- Template sections (intro, content, outros) are correctly identified
- Sections have the expected properties (timing, duration, etc.)
- Sections cover the full video duration
- Text overlays are detected and extracted
- AI enhancement improves structure extraction

### Template Similarity Test

This test verifies:
- Similarity detection works between templates
- Templates with similar structure are correctly identified
- Similarity scores are calculated properly

## Troubleshooting

If your tests fail, check these common issues:

1. **API Token Issues**
   - Verify your Apify API token is valid
   - Verify your Anthropic API key is valid

2. **Network Issues**
   - Check your internet connection
   - Verify you can access Apify and Anthropic APIs

3. **Firebase Issues**
   - Verify Firebase connection is working
   - Check Firebase permissions

4. **Video Processing Issues**
   - Apify might return malformed or invalid videos
   - TikTok structure might have changed

## Adding New Tests

When developing new analyzer features, add corresponding tests in:

```
src/lib/etl/test-template-analyzer.ts
```

Follow the existing pattern for tests, and make sure to update the `runAllAnalyzerTests` function to include your new test. 