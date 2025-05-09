// Simple script to check if components are exported correctly
const fs = require('fs');
const path = require('path');

function checkFilesInDirectory(directory) {
  try {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        console.log(`Checking directory: ${filePath}`);
        checkFilesInDirectory(filePath);
      } else if (stats.isFile() && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
        console.log(`Checking file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for proper export syntax
        const hasDefaultExport = content.includes('export default');
        const hasNamedExports = content.match(/export\s+(?:const|function|class|let|var|interface|type)\s+\w+/g);
        
        console.log(`  - Has default export: ${hasDefaultExport}`);
        if (hasNamedExports) {
          console.log(`  - Named exports: ${hasNamedExports.length}`);
          hasNamedExports.forEach(exp => console.log(`    * ${exp}`));
        } else {
          console.log(`  - No named exports found`);
        }
      }
    });
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Check the analytics dashboard components
const componentPath = path.join(__dirname, 'src', 'app', 'analytics', 'sound-dashboard', 'components');
console.log(`\n=== Checking components in ${componentPath} ===\n`);
checkFilesInDirectory(componentPath);

// Check the charts component
const chartsPath = path.join(__dirname, 'src', 'components', 'ui', 'charts.tsx');
console.log(`\n=== Checking charts component ===\n`);
if (fs.existsSync(chartsPath)) {
  const content = fs.readFileSync(chartsPath, 'utf8');
  const hasLineChartExport = content.includes('export function LineChart');
  const hasBarChartExport = content.includes('export function BarChart');
  const hasPieChartExport = content.includes('export function PieChart');
  
  console.log(`Charts component exists at ${chartsPath}`);
  console.log(`  - Exports LineChart: ${hasLineChartExport}`);
  console.log(`  - Exports BarChart: ${hasBarChartExport}`);
  console.log(`  - Exports PieChart: ${hasPieChartExport}`);
} else {
  console.log(`Charts component NOT found at ${chartsPath}`);
} 