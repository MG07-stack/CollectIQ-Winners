import os
import sys
import uvicorn
from app.config import settings

if __name__ == "__main__":
    # Ensure current directory is in PYTHONPATH
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    print(f"Starting CollectIQ API Server on http://127.0.0.1:{settings.PORT} ...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
