/**
 * Test Apify API directly
 */

async function main() {
  const apifyToken = process.env.APIFY_API_TOKEN;

  if (!apifyToken) {
    console.error('❌ APIFY_API_TOKEN not found in environment');
    return;
  }

  console.log('✅ APIFY_API_TOKEN found');
  console.log('Token (first 20 chars):', apifyToken.substring(0, 20) + '...');
  console.log('\n=== TESTING APIFY API ===\n');

  // Test 1: Trigger scrape
  console.log('Step 1: Triggering Apify scrape...');

  const apifyResponse = await fetch('https://api.apify.com/v2/acts/OtzYfK1ndEGdwWFKQ/runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apifyToken}`
    },
    body: JSON.stringify({
      profileURLs: ['https://www.tiktok.com/@sidehustlereview'],
      resultsPerPage: 50,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: true,
      shouldDownloadSlideshowImages: false
    })
  });

  console.log('Response Status:', apifyResponse.status, apifyResponse.statusText);

  const apifyData = await apifyResponse.json();
  console.log('Response Data:', JSON.stringify(apifyData, null, 2));

  if (!apifyResponse.ok) {
    console.error('\n❌ Apify API request failed');
    return;
  }

  const runId = apifyData.data.id;
  console.log('\n✅ Apify run started:', runId);
  console.log('\nStep 2: Polling for completion...\n');

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://api.apify.com/v2/acts/OtzYfK1ndEGdwWFKQ/runs/${runId}`,
      {
        headers: { 'Authorization': `Bearer ${apifyToken}` }
      }
    );

    const statusData = await statusResponse.json();
    const status = statusData.data.status;

    console.log(`[${new Date().toISOString()}] Status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

    if (status === 'SUCCEEDED') {
      console.log('\n✅ Scrape completed successfully!');

      // Fetch results
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        {
          headers: { 'Authorization': `Bearer ${apifyToken}` }
        }
      );

      const results = await resultsResponse.json();
      console.log(`\nScraped ${results.length} videos`);

      if (results.length > 0) {
        console.log('\nSample video data (first video):');
        console.log(JSON.stringify(results[0], null, 2));
      }

      return;
    } else if (status === 'FAILED' || status === 'ABORTED') {
      console.error(`\n❌ Apify scrape failed with status: ${status}`);
      console.error('Full status data:', JSON.stringify(statusData, null, 2));
      return;
    }

    attempts++;
  }

  console.error('\n❌ Scrape timed out after 5 minutes');
}

main().catch(console.error);
