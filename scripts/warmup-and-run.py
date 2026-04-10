# Phase 1: Warm up DLL cache with a long timeout
# Phase 2: Run the experiment
import sys, os, subprocess, time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(PROJECT_ROOT, 'data', 'sandbox', 'warmup-log.txt')

with open(LOG, 'w') as f:
    f.write(f'Starting at {time.strftime("%H:%M:%S")}\n')
    f.flush()

    # Phase 1: Warm up by importing everything
    f.write('Phase 1: Warming up DLL cache...\n'); f.flush()
    os.fsync(f.fileno())

    t0 = time.time()
    try:
        import numpy
        f.write(f'  numpy {numpy.__version__} in {time.time()-t0:.1f}s\n'); f.flush(); os.fsync(f.fileno())

        t1 = time.time()
        import pandas
        f.write(f'  pandas {pandas.__version__} in {time.time()-t1:.1f}s\n'); f.flush(); os.fsync(f.fileno())

        t2 = time.time()
        import xgboost
        f.write(f'  xgboost {xgboost.__version__} in {time.time()-t2:.1f}s\n'); f.flush(); os.fsync(f.fileno())

        t3 = time.time()
        import sklearn
        f.write(f'  sklearn {sklearn.__version__} in {time.time()-t3:.1f}s\n'); f.flush(); os.fsync(f.fileno())

        t4 = time.time()
        import scipy
        f.write(f'  scipy {scipy.__version__} in {time.time()-t4:.1f}s\n'); f.flush(); os.fsync(f.fileno())

        t5 = time.time()
        import optuna
        f.write(f'  optuna {optuna.__version__} in {time.time()-t5:.1f}s\n'); f.flush(); os.fsync(f.fileno())

        f.write(f'Phase 1 complete in {time.time()-t0:.1f}s\n'); f.flush(); os.fsync(f.fileno())
    except Exception as e:
        f.write(f'IMPORT FAILED: {e}\n'); f.flush(); os.fsync(f.fileno())
        sys.exit(1)

    # Phase 2: Run the experiment in the SAME process
    exp = sys.argv[1].upper() if len(sys.argv) > 1 else 'C'
    f.write(f'Phase 2: Running experiment {exp}...\n'); f.flush(); os.fsync(f.fileno())

f.close()

# Now exec the experiment script
sys.argv = [sys.argv[0], exp if 'exp' in dir() else sys.argv[1]]
exec(open(os.path.join(PROJECT_ROOT, 'scripts', 'run-one-experiment.py')).read())
