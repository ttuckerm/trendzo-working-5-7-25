import sys, os, time
sys.stdout.reconfigure(encoding='utf-8')
print('1. checking xgboost location...', flush=True)
import importlib.util
spec = importlib.util.find_spec('xgboost')
print(f'   location: {spec.origin if spec else "NOT FOUND"}', flush=True)

print('2. importing xgboost.core...', flush=True)
t = time.time()
try:
    import xgboost.core as xgb_core
    print(f'   core imported in {time.time()-t:.1f}s', flush=True)
except Exception as e:
    print(f'   FAILED: {e}', flush=True)

print('3. importing xgboost...', flush=True)
t = time.time()
try:
    import xgboost
    print(f'   xgboost {xgboost.__version__} in {time.time()-t:.1f}s', flush=True)
except Exception as e:
    print(f'   FAILED: {e}', flush=True)

print('DONE', flush=True)
