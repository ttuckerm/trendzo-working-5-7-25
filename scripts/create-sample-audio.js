const fs = require('fs');
const path = require('path');

// Directory for the audio files
const audioDir = path.join(__dirname, '../public/audio');

// Create directory if it doesn't exist
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log(`Created directory: ${audioDir}`);
}

// Files to create
const audioFiles = [
  'guitar-acoustic.mp3',
  'electronic-beat.mp3', 
  'piano-melody.mp3'
];

// Create each file if it doesn't exist
audioFiles.forEach(fileName => {
  const filePath = path.join(audioDir, fileName);
  
  console.log(`Checking file: ${fileName} at path: ${filePath}`);
  
  // Skip if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`File ${fileName} already exists, skipping.`);
    return;
  }
  
  // Create a placeholder file with simple content
  // Note: This won't be a valid MP3 file, but it will prevent 404 errors in development
  fs.writeFileSync(filePath, 'PLACEHOLDER AUDIO FILE');
  console.log(`Created placeholder file: ${fileName}`);
});

console.log('Done creating placeholder audio files.'); 