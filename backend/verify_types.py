
import uuid
import pathlib
import sys
import os

try:
    import PIL
    print("PIL imported successfully")
except ImportError as e:
    print(f"PIL import failed: {e}")

try:
    import pdf2docx
    print("pdf2docx imported successfully")
except ImportError as e:
    print(f"pdf2docx import failed: {e}")

try:
    import docx
    print("docx imported successfully")
except ImportError as e:
    print(f"docx import failed: {e}")

try:
    from fastapi import APIRouter
    print("fastapi imported successfully")
except ImportError as e:
    print(f"fastapi import failed: {e}")

# Test UUID hex slicing
try:
    uid = uuid.uuid4().hex[:8]
    print(f"UUID hex slice success: {uid} (type: {type(uid)})")
except Exception as e:
    print(f"UUID hex slice failed: {e}")

# Test Path.write_bytes with bytes from string (simulating file.read())
try:
    p = pathlib.Path("test_write.tmp")
    content = b"some bytes"
    p.write_bytes(content)
    print("Path.write_bytes success")
    os.remove("test_write.tmp")
except Exception as e:
    print(f"Path.write_bytes failed: {e}")
