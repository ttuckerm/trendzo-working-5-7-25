import sys, time
sys.stdout.reconfigure(encoding='utf-8')
print('start', flush=True)
t = time.time()
import xgboost as xgb
print(f'xgboost {xgb.__version__} in {time.time()-t:.1f}s', flush=True)
import numpy as np
print('numpy ok', flush=True)
X = np.random.rand(100, 5)
y = np.random.rand(100)
dtrain = xgb.DMatrix(X, label=y)
bst = xgb.train({'objective': 'reg:squarederror', 'max_depth': 3, 'verbosity': 0}, dtrain, num_boost_round=10)
preds = bst.predict(dtrain)
print(f'trained, pred mean={preds.mean():.3f}', flush=True)
print('DONE', flush=True)
