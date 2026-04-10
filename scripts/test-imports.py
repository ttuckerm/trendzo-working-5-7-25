import time
import sys
sys.stdout.reconfigure(encoding='utf-8')

print('importing pandas...', flush=True)
t = time.time()
import pandas
print(f'pandas ok in {time.time()-t:.1f}s', flush=True)

print('importing sklearn...', flush=True)
t = time.time()
from sklearn.preprocessing import StandardScaler
print(f'sklearn ok in {time.time()-t:.1f}s', flush=True)

print('importing scipy...', flush=True)
t = time.time()
from scipy.stats import spearmanr
print(f'scipy ok in {time.time()-t:.1f}s', flush=True)

print('importing xgboost...', flush=True)
t = time.time()
import xgboost
print(f'xgboost ok in {time.time()-t:.1f}s', flush=True)

print('importing supabase...', flush=True)
t = time.time()
from supabase import create_client
print(f'supabase ok in {time.time()-t:.1f}s', flush=True)

print('ALL IMPORTS DONE', flush=True)
