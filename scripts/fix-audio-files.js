const fs = require('fs');
const path = require('path');
const https = require('https');

// Directory for the audio files
const audioDir = path.join(__dirname, '../public/audio');

// Create directory if it doesn't exist
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log(`Created directory: ${audioDir}`);
}

// URLs for reliable audio files from a single source
const soundUrls = [
  {
    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    fileName: 'electronic-beat.mp3'
  },
  {
    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand60.wav',
    fileName: 'guitar-acoustic.mp3'
  },
  {
    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
    fileName: 'piano-melody.mp3'
  }
];

// Download each file
let completedDownloads = 0;

soundUrls.forEach(({ url, fileName }) => {
  const filePath = path.join(audioDir, fileName);
  
  console.log(`Downloading ${fileName} from ${url}...`);
  
  const request = https.get(url, response => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${fileName}: Status code ${response.statusCode}`);
      checkAllCompleted();
      return;
    }
    
    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);
    
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${fileName} successfully!`);
      checkAllCompleted();
    });
  });
  
  request.on('error', err => {
    console.error(`Error downloading ${fileName}: ${err.message}`);
    checkAllCompleted();
  });
});

function checkAllCompleted() {
  completedDownloads++;
  if (completedDownloads === soundUrls.length) {
    console.log('All downloads completed.');
    
    // Verify all files exist
    let allFilesExist = true;
    soundUrls.forEach(({ fileName }) => {
      const filePath = path.join(audioDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`WARNING: ${fileName} is missing!`);
        allFilesExist = false;
      } else {
        const stats = fs.statSync(filePath);
        console.log(`${fileName}: ${stats.size} bytes`);
      }
    });
    
    if (allFilesExist) {
      console.log('All audio files are ready!');
    } else {
      console.log('Some files are missing, falling back to empty MP3 files');
      
      // Create empty files for any missing ones
      soundUrls.forEach(({ fileName }) => {
        const filePath = path.join(audioDir, fileName);
        if (!fs.existsSync(filePath)) {
          // Create a minimal valid MP3 file (ID3v2 tag header)
          // This is a very simple valid MP3 file header
          const header = Buffer.from([
            0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // ID3v2 tag header
          ]);
          fs.writeFileSync(filePath, header);
          console.log(`Created minimal MP3 file: ${fileName}`);
        }
      });
    }
  }
} 