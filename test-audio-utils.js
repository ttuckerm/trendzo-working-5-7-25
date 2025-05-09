// Test script for formatAudioTime

const { formatAudioTime } = require('./src/lib/utils/audioUtils');

// Test cases
console.log('Testing formatAudioTime function:');
console.log('------------------------------');
console.log(`75 seconds -> ${formatAudioTime(75)}`);
console.log(`125 seconds -> ${formatAudioTime(125)}`);
console.log(`3661 seconds -> ${formatAudioTime(3661)}`);
console.log(`3661 seconds (with hours) -> ${formatAudioTime(3661, true)}`);
console.log(`Invalid input (negative) -> ${formatAudioTime(-10)}`);
console.log(`Invalid input (NaN) -> ${formatAudioTime(NaN)}`);
console.log('------------------------------'); 