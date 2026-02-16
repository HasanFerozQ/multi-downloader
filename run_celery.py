import sys
import os

# Apply patches for Python 3.13 compatibility
# This must be done before importing celery
try:
    import backend.billiard_fix
    print("Patch applied via run_celery.py")
except ImportError as e:
    print(f"Failed to apply patch: {e}")

from celery.__main__ import main

if __name__ == '__main__':
    sys.exit(main())
