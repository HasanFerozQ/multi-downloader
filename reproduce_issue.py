import sys
import os

# Add current directory to sys.path
cwd = os.getcwd()
sys.path.append(cwd)
print(f"Testing imports from {cwd}")

try:
    import backend
    print("Successfully imported backend package")
except ImportError as e:
    print(f"Failed to import backend: {e}")

try:
    from backend.routers import convert_router
    print("Successfully imported backend.routers.convert_router")
    print(f"Router object: {convert_router.router}")
except ImportError as e:
    print(f"Failed to import convert_router: {e}")
except Exception as e:
    print(f"An error occurred with convert_router: {e}")

try:
    from backend.main import app
    print("Successfully imported backend.main.app")
except ImportError as e:
    print(f"Failed to import backend.main: {e}")
except Exception as e:
    print(f"An error occurred with backend.main: {e}")
