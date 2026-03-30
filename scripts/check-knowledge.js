const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log("Checking extracted_knowledge table...");

  const { data, error } = await supabase
    .from("extracted_knowledge")
    .select("video_id, confidence_score, consensus_insights")
    .limit(3);

  if (error) {
    console.error("ERROR:", error.message);
    return;
  }

  console.log("Rows found:", data ? data.length : 0);

  if (data && data.length > 0) {
    console.log("\nSample consensus_insights structure:");
    console.log(JSON.stringify(data[0].consensus_insights, null, 2));
  } else {
    console.log("TABLE IS EMPTY - no extractions run yet");
  }
}

checkData();
