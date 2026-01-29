import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkLastPrediction() {
  const { data, error } = await supabase
    .from('kai_predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No predictions found');
    return;
  }

  const prediction = data[0];
  console.log('Last prediction (ed032a69-5e35-4427-9b4f-a96d097a791d):');
  console.log(JSON.stringify(prediction, null, 2));
}

checkLastPrediction();
