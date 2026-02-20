
import uuid
import pathlib
import sys
import os

print("--- Verifying Imports ---")
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


print("\n--- Verifying Code Fixes ---")

# Test UUID hex slicing with explicit str cast
try:
    # Mimic the fix: uid = str(uuid.uuid4().hex)[:8]
    # uuid4().hex is already a str, but the IDE was compliant. 
    # ensuring str() wrap doesn't break it.
    val = uuid.uuid4().hex
    uid = str(val)[:8]
    print(f"UUID hex slice success: {uid} (type: {type(uid)})")
except Exception as e:
    print(f"UUID hex slice failed: {e}")

# Test Path.write_bytes with explicit bytes cast
try:
    p = pathlib.Path("test_write_verify.tmp")
    content = b"some bytes"
    # Mimic the fix: input_path.write_bytes(bytes(content))
    p.write_bytes(bytes(content)) 
    print("Path.write_bytes success")
    os.remove("test_write_verify.tmp")
except Exception as e:
    print(f"Path.write_bytes failed: {e}")

# Test bytes slice/string conversion for error handling
try:
    # Mimic: error_msg = str(result.stderr) ... error_msg[-500:]
    dummy_stderr = "Some error output"
    error_msg = str(dummy_stderr)
    sliced = error_msg[-500:]
    print(f"Error string slicing success: {sliced}")
except Exception as e:
    print(f"Error string slicing failed: {e}")
