const https = require('https');
const fs = require('fs');
const path = require('path');

// Create both directories to maximize chances of success
const directories = [
  path.join(__dirname, '../public/audio'),
  path.join(__dirname, '../public')
];

// Create directories if they don't exist
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// URL to a reliable test audio file
const audioUrl = 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-0.mp3';

// Files to create in both locations
const audioFiles = [
  { name: 'electronic-beat.mp3', url: audioUrl },
  { name: 'guitar-acoustic.mp3', url: audioUrl },
  { name: 'piano-melody.mp3', url: audioUrl }
];

// Download files to both locations
audioFiles.forEach(file => {
  directories.forEach(dir => {
    const filePath = path.join(dir, file.name);
    console.log(`Downloading ${file.name} to ${filePath}...`);
    
    const request = https.get(file.url, response => {
      if (response.statusCode !== 200) {
        console.error(`Failed to download file: Status code ${response.statusCode}`);
        return;
      }
      
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        
        try {
          const stats = fs.statSync(filePath);
          console.log(`Successfully downloaded ${file.name} to ${dir} (${stats.size} bytes)`);
        } catch (e) {
          console.error(`Error checking file ${filePath}: ${e.message}`);
        }
      });
    });
    
    request.on('error', err => {
      console.error(`Error downloading file: ${err.message}`);
    });
  });
});

console.log('Download process initiated...'); 