from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

router = APIRouter(prefix="/gif", tags=["gif"])

@router.get("/extract-page")
async def extract_gifs_from_page(url: str):
    """
    Extracts all GIF URLs from a given webpage.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers={"User-Agent": "Mozilla/5.0"}) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch page: {response.status}")
                
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")
                
                gifs = []
                for img in soup.find_all("img"):
                    src = img.get("src")
                    if src:
                        # Handle relative URLs
                        absolute_url = urljoin(url, src)
                        # Check if it looks like a GIF
                        if absolute_url.lower().endswith(".gif") or ".gif?" in absolute_url.lower():
                            gifs.append(absolute_url)
                
                # De-duplicate
                gifs = list(set(gifs))
                
                return {"gifs": gifs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validate")
async def validate_gif_url(url: str):
    """
    Validates if a URL points to a reachable GIF.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.head(url, allow_redirects=True) as response:
                content_type = response.headers.get("Content-Type", "").lower()
                if response.status == 200 and "image/gif" in content_type:
                    return {"valid": True, "url": url}
                else:
                     # Fallback: check extension if content-type is missing/generic
                    if url.lower().endswith(".gif"):
                         return {"valid": True, "url": url}
                    return {"valid": False, "detail": "Not a valid GIF URL"}
    except Exception as e:
        return {"valid": False, "detail": str(e)}
