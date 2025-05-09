// Simple script to find all references to AudioVisualDashboardCard
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Use grep to find references
  const output = execSync('findstr /s /i "AudioVisualDashboardCard" .\\src\\*.tsx .\\src\\*.ts').toString();
  console.log('References found:');
  console.log(output);
} catch (error) {
  if (error.status === 1) {
    console.log('No references found, which is good!');
  } else {
    console.error('Error running search:', error.message);
  }
} 