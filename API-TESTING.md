# API Testing Guide

This guide explains how to test the newly created API endpoints for the Trendzo application.

## API Endpoints Overview

The following endpoints have been implemented:

1. **Trending Sounds API**
   - Endpoint: `/api/sounds/trending`
   - Purpose: Returns trending sounds with growth metrics
   - Parameters: `timeframe`, `category`, `limit`, `minViralityScore`, `lifecycle`

2. **Sound Categories API**
   - Endpoint: `/api/sounds/categories`
   - Purpose: Returns all available sound categories, genres, moods, etc.
   - Parameters: `includeStats`, `includeGenres`, `includeMoods`, `includeTempos`

3. **Sound Recommendations API**
   - Endpoint: `/api/sounds/recommendations`
   - Purpose: Returns sound recommendations for a specific template
   - Parameters: `templateId`, `limit`, `minScore`, `includeDetails`, `category`

## Running the Tests

To test these endpoints, we've created automated test scripts that validate their functionality. 

### Prerequisites

Make sure you have the following dependencies installed:

```bash
npm install --save-dev node-fetch@2 ts-node
```

### Running All Tests

To run all API endpoint tests:

```bash
npm run test-api
```

This will test all three endpoints with various parameter combinations and display the results.

### Running Individual Tests

If you want to test specific endpoints individually:

1. Start the development server (if not already running):
   ```bash
   npm run dev
   ```

2. Open a new terminal and run one of the following commands:

   ```bash
   # For trending endpoint
   npx ts-node src/app/test-trending-endpoint.ts
   
   # For categories endpoint
   npx ts-node src/app/test-categories-endpoint.ts
   
   # For recommendations endpoint
   npx ts-node src/app/test-recommendations-endpoint.ts
   ```

## Manual Testing

You can also test the endpoints manually using curl or a tool like Postman:

### Example curl commands:

```bash
# Test trending endpoint
curl "http://localhost:3000/api/sounds/trending?timeframe=7d&limit=10&category=music"

# Test categories endpoint
curl "http://localhost:3000/api/sounds/categories?includeStats=true"

# Test recommendations endpoint (replace {templateId} with a valid ID)
curl "http://localhost:3000/api/sounds/recommendations?templateId={templateId}&limit=10"
```

### Expected Responses

The responses should follow these general structures:

1. **Trending Sounds API**:
   ```json
   {
     "success": true,
     "timeframe": "7d",
     "count": 10,
     "sounds": [
       {
         "id": "sound123",
         "title": "Example Sound",
         "soundCategory": "music",
         "usageCount": 1000,
         "viralityScore": 85,
         "stats": {
           "usageChange": 200,
           "trend": "rising",
           "growthVelocity": 28.5,
           "relativeGrowth": 0.2
         }
       },
       // More sounds...
     ]
   }
   ```

2. **Sound Categories API**:
   ```json
   {
     "success": true,
     "categories": {
       "soundCategories": ["music", "voiceover", "soundEffect"],
       "genres": ["pop", "rock", "hip-hop"],
       "moods": ["happy", "energetic", "calm"],
       "tempos": ["slow", "medium", "fast"]
     },
     "stats": {
       "soundCategories": {
         "music": 150,
         "voiceover": 75,
         "soundEffect": 50
       },
       // More stats...
     }
   }
   ```

3. **Sound Recommendations API**:
   ```json
   {
     "success": true,
     "template": {
       "id": "template123",
       "title": "Example Template",
       "category": "tutorial"
     },
     "count": 5,
     "recommendations": [
       {
         "sound": {
           "id": "sound123",
           "title": "Example Sound",
           // More sound details...
         },
         "recommendationSource": "correlation",
         "recommendationStrength": "high",
         "correlationScore": 85
       },
       // More recommendations...
     ]
   }
   ```

## Troubleshooting

If you encounter issues with the tests:

1. Ensure your development server is running
2. Check that you have the required environment variables set
3. Verify that you have sample data in your database
4. For recommendation endpoint tests, make sure you have valid template IDs

## Next Steps

Once you've confirmed that all endpoints are working correctly, you can:

1. Document the API for frontend developers
2. Integrate these endpoints with the frontend components
3. Add more comprehensive error handling and validation 