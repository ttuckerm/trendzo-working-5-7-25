import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });

async function scrapeChannel() {
  console.log('Starting Apify scrape for @thereallauwerz...');

  const run = await client.actor('clockworks/tiktok-scraper').call({
    profiles: ['thereallauwerz'],
    resultsPerPage: 50,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
  });

  console.log('Scrape completed. Run ID:', run.id);
  console.log('Fetching results...');

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log('\nFetched', items.length, 'videos from @thereallauwerz\n');

  items.forEach((v: any, i: number) => {
    const caption = v.text?.substring(0, 60) || 'No caption';
    console.log(`${i + 1}. ${v.id} - ${caption}... (Views: ${v.playCount?.toLocaleString()})`);
  });

  console.log('\n✅ Successfully scraped', items.length, 'videos');
}

scrapeChannel().catch(console.error);
