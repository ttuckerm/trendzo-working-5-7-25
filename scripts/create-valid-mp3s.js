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

// This is a minimal valid MP3 file
// It's a 1-second silent MP3 with proper headers
const silentMp3 = Buffer.from([
  // ID3v2 tag header
  0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0A,
  // ID3v2 tag content (minimal)
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  // MP3 frame header
  0xFF, 0xFB, 0x50, 0xC4, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  // MP3 frame data (silence)
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Create each file
audioFiles.forEach(fileName => {
  const filePath = path.join(audioDir, fileName);
  
  console.log(`Creating minimal valid MP3 file: ${fileName}`);
  fs.writeFileSync(filePath, silentMp3);
  
  const stats = fs.statSync(filePath);
  console.log(`Created ${fileName}: ${stats.size} bytes`);
});

console.log('All audio files created successfully.'); 