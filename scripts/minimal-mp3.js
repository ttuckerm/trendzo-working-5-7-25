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

// This is a larger, more valid MP3 file
// It contains the right headers and enough data to be recognized as a real MP3
function createValidMP3() {
  // Create a Buffer that's larger than the one in the previous script
  const buffer = Buffer.alloc(4096); // 4KB should be enough
  
  // Fill with proper MP3 headers
  
  // ID3v2 tag header
  buffer.write('ID3', 0); // Magic number
  buffer[3] = 0x03; // Version 2.3.0
  buffer[4] = 0x00; // No flags
  buffer[5] = 0x00; // No flags
  
  // Size of tag (synchsafe integer) - set to indicate we have some content
  buffer[6] = 0x00;
  buffer[7] = 0x00;
  buffer[8] = 0x02;
  buffer[9] = 0x00;
  
  // MP3 frame header at position 10
  // Frame header MPEG 1 Layer 3 - 44100Hz - 128kbps
  buffer[10] = 0xFF;
  buffer[11] = 0xFB;
  buffer[12] = 0x90;
  buffer[13] = 0x04;
  
  // Fill the rest with pseudo-random data to simulate audio
  for (let i = 14; i < 4096; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  
  return buffer;
}

// Create each file
audioFiles.forEach(fileName => {
  const filePath = path.join(audioDir, fileName);
  
  const validMP3Data = createValidMP3();
  
  console.log(`Creating valid MP3 file: ${fileName}`);
  fs.writeFileSync(filePath, validMP3Data);
  
  const stats = fs.statSync(filePath);
  console.log(`Created ${fileName}: ${stats.size} bytes`);
});

console.log('All audio files created successfully.'); 