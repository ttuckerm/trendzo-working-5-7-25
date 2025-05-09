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

// URLs from GitHub audio samples repository
const audioSamples = [
  {
    url: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-0.mp3',
    fileName: 'electronic-beat.mp3',
    description: 'Electronic Beat'
  },
  {
    url: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-1.mp3', 
    fileName: 'guitar-acoustic.mp3',
    description: 'Guitar Acoustic'
  },
  {
    url: 'https://audio-samples.github.io/samples/mp3/blizzard_biased/sample-2.mp3',
    fileName: 'piano-melody.mp3',
    description: 'Piano Melody'
  }
];

// Counter for downloads completed
let completedDownloads = 0;

// Download each file
audioSamples.forEach(({ url, fileName, description }) => {
  const filePath = path.join(audioDir, fileName);
  
  console.log(`Downloading ${description} (${fileName}) from ${url}...`);
  
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
      console.log(`Successfully downloaded ${fileName}`);
      checkAllCompleted();
    });
  });
  
  request.on('error', err => {
    console.error(`Error downloading ${fileName}: ${err.message}`);
    checkAllCompleted();
  });
});

// Check if all downloads are completed
function checkAllCompleted() {
  completedDownloads++;
  if (completedDownloads === audioSamples.length) {
    console.log('All audio downloads completed!');
    
    // Verify files
    let allValid = true;
    audioSamples.forEach(({ fileName }) => {
      const filePath = path.join(audioDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.error(`ERROR: ${fileName} is missing!`);
        allValid = false;
      } else {
        const stats = fs.statSync(filePath);
        console.log(`${fileName}: ${stats.size} bytes`);
      }
    });
    
    if (allValid) {
      console.log('✅ All audio files successfully downloaded and verified.');
      console.log('You can now test the sound player component.');
    } else {
      console.error('❌ Some files are missing or invalid.');
    }
  }
} 