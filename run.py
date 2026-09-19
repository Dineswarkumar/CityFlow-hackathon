#!/usr/bin/env python3
"""
CityFlow AI — Unified CLI Runner & Entrypoint
Usage:
    python run.py           # Start the web app and REST API server on http://localhost:8000
    python run.py --test    # Run all automated test suites
    python run.py --eval    # Run LightGBM forecaster evaluation & benchmark metrics
"""

import sys
import io
import unittest
from pathlib import Path

# Fix Windows console UTF-8 output safely
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

def run_tests():
    print("\n[TEST] Running CityFlow AI Test Suite...")
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=str(ROOT_DIR / 'tests'))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)

def run_eval():
    print("\n[EVAL] Running Model Evaluation Benchmark...")
    from scripts.evaluate_models import main as eval_main
    eval_main()

def run_server(port=8000):
    from backend.server import start_server
    start_server(port=port)

if __name__ == '__main__':
    if '--test' in sys.argv:
        run_tests()
    elif '--eval' in sys.argv:
        run_eval()
    else:
        port = 8000
        for arg in sys.argv[1:]:
            if arg.isdigit():
                port = int(arg)
        run_server(port)
