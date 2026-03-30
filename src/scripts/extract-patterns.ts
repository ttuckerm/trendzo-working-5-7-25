import { extractPatternsFromAllVideos } from '../lib/pattern-extraction/extraction-pipeline';

async function main() {
  console.log('Starting Viral Pattern Extraction...');
  try {
    const results = await extractPatternsFromAllVideos();
    console.log('Extraction Complete!');
    console.log(`Videos Analyzed: ${results.videosAnalyzed}`);
    console.log(`Patterns Extracted: ${results.patternsExtracted}`);
  } catch (error) {
    console.error('Extraction failed:', error);
    process.exit(1);
  }
}

main();





