import sys, os, json

LOG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'sandbox', 'crash-test.txt')
f = open(LOG, 'w')

def log(msg):
    f.write(msg + '\n')
    f.flush()
    os.fsync(f.fileno())

log('step 1: basic python')
log(f'step 2: python {sys.version}')

log('step 3: importing numpy...')
import numpy as np
log(f'step 3 done: numpy {np.__version__}')

log('step 4: importing pandas...')
import pandas as pd
log(f'step 4 done: pandas {pd.__version__}')

log('step 5: importing xgboost...')
import xgboost as xgb
log(f'step 5 done: xgboost {xgb.__version__}')

log('step 6: importing sklearn...')
import sklearn
log(f'step 6 done: sklearn {sklearn.__version__}')

log('step 7: importing scipy...')
from scipy.stats import spearmanr
log('step 7 done: scipy OK')

log('step 8: importing optuna...')
import optuna
log(f'step 8 done: optuna {optuna.__version__}')

log('step 9: importing supabase...')
from supabase import create_client
log('step 9 done: supabase OK')

log('step 10: loading env...')
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
if os.path.exists(env_path):
    with open(env_path) as ef:
        for line in ef:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()
log('step 10 done: env loaded')

log('step 11: connecting supabase...')
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_KEY')
sb = create_client(url, key)
log('step 11 done: supabase connected')

log('step 12: fetching 100 training_features...')
resp = sb.table('training_features').select('video_id,extracted_at').limit(100).execute()
log(f'step 12 done: got {len(resp.data)} rows')

log('step 13: creating dataframe...')
df = pd.DataFrame(resp.data)
log(f'step 13 done: df shape={df.shape}')

log('step 14: reading v10 metadata...')
v10_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models', 'xgboost-v10-metadata.json')
with open(v10_path) as jf:
    v10 = json.load(jf)
log(f'step 14 done: v10 keys={list(v10.keys())}')

log('ALL STEPS COMPLETE')
f.close()
