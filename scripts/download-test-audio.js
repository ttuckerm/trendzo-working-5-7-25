const https = require('https');
const fs = require('fs');
const path = require('path');

// Directory for the audio files
const audioDir = path.join(__dirname, '../public/audio');

// Create directory if it doesn't exist
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log(`Created directory: ${audioDir}`);
}

// URL to a reliable test audio file
const audioUrl = 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-0.mp3';
const fileName = 'electronic-beat.mp3';
const filePath = path.join(audioDir, fileName);

console.log(`Downloading test audio file to: ${filePath}...`);

const request = https.get(audioUrl, response => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download file: Status code ${response.statusCode}`);
    return;
  }
  
  const fileStream = fs.createWriteStream(filePath);
  response.pipe(fileStream);
  
  fileStream.on('finish', () => {
    fileStream.close();
    const stats = fs.statSync(filePath);
    console.log(`Successfully downloaded ${fileName} (${stats.size} bytes)`);
    
    // Copy the file to the other sample filenames
    const otherFiles = [
      'guitar-acoustic.mp3',
      'piano-melody.mp3'
    ];
    
    otherFiles.forEach(otherFile => {
      const otherPath = path.join(audioDir, otherFile);
      fs.copyFileSync(filePath, otherPath);
      console.log(`Copied to ${otherFile}`);
    });
    
    console.log('All audio files are ready. Please refresh the browser.');
  });
});

request.on('error', err => {
  console.error(`Error downloading file: ${err.message}`);
});

console.log('Download process initiated...'); 