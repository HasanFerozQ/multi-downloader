from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import ipaddress
import socket

router = APIRouter(prefix="/gif", tags=["gif"])

# --- SSRF Protection ---
_PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # AWS metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

def _is_safe_url(url: str) -> bool:
    """Block SSRF: reject private/loopback IPs and non-http(s) schemes."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        # Resolve hostname to IP(s)
        infos = socket.getaddrinfo(hostname, None)
        for info in infos:
            ip_str = info[4][0]
            ip = ipaddress.ip_address(ip_str)
            for private_range in _PRIVATE_RANGES:
                if ip in private_range:
                    return False
        return True
    except Exception:
        return False


@router.get("/extract-page")
async def extract_gifs_from_page(url: str):
    """
    Extracts all GIF URLs from a given webpage.
    """
    if not _is_safe_url(url):
        raise HTTPException(status_code=400, detail="Invalid or disallowed URL.")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch page: {response.status}")

                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")

                gifs = []
                for img in soup.find_all("img"):
                    src = img.get("src")
                    if src:
                        absolute_url = urljoin(url, src)
                        if absolute_url.lower().endswith(".gif") or ".gif?" in absolute_url.lower():
                            gifs.append(absolute_url)

                gifs = list(set(gifs))
                return {"gifs": gifs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validate")
async def validate_gif_url(url: str):
    """
    Validates if a URL points to a reachable GIF.
    """
    if not _is_safe_url(url):
        return {"valid": False, "detail": "Invalid or disallowed URL."}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.head(
                url,
                allow_redirects=True,
                timeout=aiohttp.ClientTimeout(total=8),
            ) as response:
                content_type = response.headers.get("Content-Type", "").lower()
                if response.status == 200 and "image/gif" in content_type:
                    return {"valid": True, "url": url}
                else:
                    if url.lower().endswith(".gif"):
                        return {"valid": True, "url": url}
                    return {"valid": False, "detail": "Not a valid GIF URL"}
    except Exception as e:
        return {"valid": False, "detail": str(e)}
