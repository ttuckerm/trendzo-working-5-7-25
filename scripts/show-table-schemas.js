require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function showSchemas() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 TABLE SCHEMAS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Query scraped_videos schema
  const { data: scrapedVideos, error: svError } = await supabase
    .from('scraped_videos')
    .select('*')
    .limit(1);

  if (!svError && scrapedVideos && scrapedVideos.length > 0) {
    console.log('1️⃣  SCRAPED_VIDEOS TABLE:\n');
    const columns = Object.keys(scrapedVideos[0]).sort();
    columns.forEach(col => {
      const val = scrapedVideos[0][col];
      const type = val === null ? 'null' : typeof val;
      const dataType = Array.isArray(val) ? 'array' :
                       val instanceof Date ? 'timestamptz' :
                       type === 'number' ? (Number.isInteger(val) ? 'bigint' : 'numeric') :
                       type === 'boolean' ? 'boolean' :
                       type === 'object' ? 'jsonb' : 'text';
      console.log(`   • ${col.padEnd(30)} ${dataType}`);
    });
  } else {
    console.log('❌ scraped_videos:', svError?.message || 'No data');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Query dps_calculations schema
  const { data: dpsCalcs, error: dpsError } = await supabase
    .from('dps_calculations')
    .select('*')
    .limit(1);

  if (!dpsError && dpsCalcs && dpsCalcs.length > 0) {
    console.log('2️⃣  DPS_CALCULATIONS TABLE:\n');
    const columns = Object.keys(dpsCalcs[0]).sort();
    columns.forEach(col => {
      const val = dpsCalcs[0][col];
      const type = val === null ? 'null' : typeof val;
      const dataType = Array.isArray(val) ? 'array' :
                       val instanceof Date ? 'timestamptz' :
                       type === 'number' ? (Number.isInteger(val) ? 'bigint' : 'numeric') :
                       type === 'boolean' ? 'boolean' :
                       type === 'object' ? 'jsonb' : 'text';
      console.log(`   • ${col.padEnd(30)} ${dataType}`);
    });
  } else {
    console.log('❌ dps_calculations:', dpsError?.message || 'No data');
  }

  console.log('\n═══════════════════════════════════════════════════════════');

  // Show sample data
  console.log('\n📄 SAMPLE DATA:\n');

  if (scrapedVideos && scrapedVideos.length > 0) {
    console.log('SCRAPED_VIDEOS Sample:');
    console.log(JSON.stringify(scrapedVideos[0], null, 2).substring(0, 500) + '...\n');
  }

  if (dpsCalcs && dpsCalcs.length > 0) {
    console.log('DPS_CALCULATIONS Sample:');
    console.log(JSON.stringify(dpsCalcs[0], null, 2) + '\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
}

showSchemas().catch(console.error);
