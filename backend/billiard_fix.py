# billiard_fix.py
# Monkey patch for Python 3.13 compatibility

import logging
import threading

# Python 3.13 removed _acquireLock and _releaseLock
# This restores them for billiard compatibility

if not hasattr(logging, '_acquireLock'):
    _lock = threading.RLock()
    
    def _acquireLock():
        if _lock:
            _lock.acquire()
    
    def _releaseLock():
        if _lock:
            _lock.release()
    
    logging._acquireLock = _acquireLock
    logging._releaseLock = _releaseLock

print("✅ Billiard Python 3.13 compatibility patch applied")
