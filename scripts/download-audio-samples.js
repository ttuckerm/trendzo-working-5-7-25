const https = require('https');
const fs = require('fs');
const path = require('path');

// Sample audio files to download
const audioFiles = [
  {
    url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
    fileName: 'electronic-beat.mp3',
    description: 'Electronic Beat'
  },
  {
    url: 'https://actions.google.com/sounds/v1/ambiences/forest_ambience.ogg',
    fileName: 'guitar-acoustic.mp3',
    description: 'Guitar Acoustic'
  },
  {
    url: 'https://actions.google.com/sounds/v1/ambiences/piano_bar.ogg',
    fileName: 'piano-melody.mp3',
    description: 'Piano Melody'
  }
];

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '../public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log(`Created directory: ${audioDir}`);
}

// Download each audio file
audioFiles.forEach(file => {
  const filePath = path.join(audioDir, file.fileName);
  
  console.log(`Downloading ${file.description} (${file.fileName})...`);
  
  const request = https.get(file.url, response => {
    // Check if response is successful
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${file.fileName}: Status code ${response.statusCode}`);
      return;
    }
    
    // Create a write stream to save the file
    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);
    
    // Handle completion of download
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${file.fileName} successfully!`);
    });
  });
  
  // Handle errors
  request.on('error', err => {
    console.error(`Error downloading ${file.fileName}: ${err.message}`);
  });
});

console.log('Download process initiated for all audio files...'); 