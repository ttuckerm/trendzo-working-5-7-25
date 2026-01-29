/**
 * Test correct Apify TikTok Scraper
 */

async function main() {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.TIKTOK_SCRAPER_ACTOR_ID || 'GdWCkxBtKWOsKjdch';

  console.log('Token:', token?.substring(0, 20) + '...');
  console.log('Actor ID:', actorId);
  console.log('\nTesting scrape of @sidehustlereview...\n');

  const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      postURLs: [],
      hashtags: [],
      profiles: ['sidehustlereview'],
      searchQueries: [],
      searchSection: '',
      resultsPerPage: 50,
      excludePinnedPosts: false,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false
    })
  });

  console.log('Status:', response.status, response.statusText);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok && data.data?.id) {
    console.log('\n✅ Scrape started! Run ID:', data.data.id);
  }
}

main().catch(console.error);
