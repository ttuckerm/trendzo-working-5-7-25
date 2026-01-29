/**
 * Update Firestore indexes for sound-related features
 * 
 * This script updates the firestore.indexes.json file to add
 * the necessary indexes for the new sound-related features.
 */

const fs = require('fs');
const path = require('path');

// Path to the firestore indexes file
const indexesFilePath = path.join(process.cwd(), 'firestore.indexes.json');

// Read the existing indexes
let indexesData;
try {
  const data = fs.readFileSync(indexesFilePath, 'utf8');
  indexesData = JSON.parse(data);
  console.log('Successfully read existing Firestore indexes.');
} catch (error) {
  console.error('Error reading Firestore indexes file:', error);
  process.exit(1);
}

// Define new sound-related indexes
const newIndexes = [
  // Sound growth metrics indexes
  {
    collectionGroup: "sounds",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "genre", order: "ASCENDING" },
      { fieldPath: "growthRate7d", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "sounds",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "usageCount", order: "DESCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "sounds",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "isOriginal", order: "ASCENDING" },
      { fieldPath: "growthRate14d", order: "DESCENDING" }
    ]
  },
  
  // Sound-template correlation indexes
  {
    collectionGroup: "sounds",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "templateUsage.templateId", order: "ASCENDING" },
      { fieldPath: "templateUsage.useCount", order: "DESCENDING" }
    ]
  },
  
  // Sound trend indexes
  {
    collectionGroup: "soundTrends",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "trendStage", order: "ASCENDING" },
      { fieldPath: "detectedAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "soundTrends",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "confidence", order: "DESCENDING" },
      { fieldPath: "detectedAt", order: "DESCENDING" }
    ]
  },
  
  // Enhanced template indexes with sound correlation
  {
    collectionGroup: "templates",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "soundId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "templates",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "category", order: "ASCENDING" },
      { fieldPath: "soundId", order: "ASCENDING" },
      { fieldPath: "engagementScore", order: "DESCENDING" }
    ]
  },
  
  // Expert input-related indexes
  {
    collectionGroup: "expertInsights",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "soundId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "soundPredictions",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "hasExpertInput", order: "ASCENDING" },
      { fieldPath: "predictedGrowth", order: "DESCENDING" }
    ]
  }
];

// Check if indexes already exist to avoid duplicates
const existingIndexPaths = indexesData.indexes.map(index => {
  return JSON.stringify(index.fields.map(field => ({ 
    path: field.fieldPath, 
    order: field.order 
  })));
});

// Filter out any new indexes that already exist
const uniqueNewIndexes = newIndexes.filter(index => {
  const indexPath = JSON.stringify(index.fields.map(field => ({ 
    path: field.fieldPath, 
    order: field.order 
  })));
  return !existingIndexPaths.includes(indexPath);
});

console.log(`Found ${uniqueNewIndexes.length} new indexes to add.`);

// Add the new indexes
indexesData.indexes = [...indexesData.indexes, ...uniqueNewIndexes];

// Write the updated indexes back to the file
try {
  fs.writeFileSync(indexesFilePath, JSON.stringify(indexesData, null, 2), 'utf8');
  console.log('Successfully updated Firestore indexes.');
  console.log('To deploy these indexes, run: firebase deploy --only firestore:indexes');
} catch (error) {
  console.error('Error writing updated Firestore indexes:', error);
  process.exit(1);
}

console.log('Firestore indexes update completed.'); 