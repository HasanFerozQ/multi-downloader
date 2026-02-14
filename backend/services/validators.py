import re
from urllib.parse import urlparse

# Strict regex patterns for supported platforms
PATTERNS = {
    "youtube": r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})",
    "twitter": r"(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/\d+",
    "tiktok": r"(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+|vt\.tiktok\.com\/\w+)",
    "facebook": r"(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/|fb\.watch\/)",
    "instagram": r"(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[\w-]+"
}

def validate_url(url: str) -> bool:
    """
    Validates if the URL belongs to one of the supported platforms.
    """
    if not url or len(url) > 500:  # Basic length check
        return False
        
    for platform, pattern in PATTERNS.items():
        if re.search(pattern, url):
            return True
            
    return False

def sanitize_input(input_str: str) -> str:
    """
    Sanitizes string input to prevent XSS and injection attacks.
    Removes HTML tags and dangerous characters.
    """
    if not isinstance(input_str, str):
        return ""
        
    # Remove HTML tags
    clean = re.sub(r'<[^>]*>', '', input_str)
    
    # Remove potential script injections
    clean = re.sub(r'javascript:', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'vbscript:', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'data:', '', clean, flags=re.IGNORECASE)
    
    return clean.strip()
