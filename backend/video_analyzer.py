import yt_dlp
import re
from typing import Dict, List, Tuple, Any
from collections import Counter


def check_tag_title_match(title: str, tags: List[str]) -> Tuple[int, str]:
    """
    Check if main tags appear in the video title
    Impact: -3 points if no match
    """
    if not tags:
        return -2, "No tags found"
    
    title_words = set(word.lower() for word in title.split() if len(word) > 3)
    matched_tags = [tag for tag in tags if tag.lower() in title_words or any(word in title.lower() for word in tag.lower().split())]
    
    if not matched_tags:
        return -3, "❌ None of your tags appear in title. Try to match your main topic tags with title keywords."
    elif len(matched_tags) < 2:
        return -1, f"⚠️ Only {len(matched_tags)} tag matches title. Add more tag-title alignment."
    else:
        return 0, f"✅ {len(matched_tags)} tags match title keywords"


def validate_hashtags(description: str) -> Tuple[int, str]:
    """
    Validate hashtag count (YouTube ignores all if >15)
    Impact: -5 points if >15, -2 if 0
    """
    hashtags = re.findall(r'#\w+', description)
    count = len(hashtags)
    
    if count > 15:
        return -5, f"❌ Too many hashtags ({count} found). Using more than 15 causes YouTube to ignore all hashtags."
    elif count == 0:
        return -2, "⚠️ No hashtags found. Add 3-5 hashtags for better discoverability."
    elif count < 3:
        return -1, f"⚠️ Only {count} hashtags. 3-5 is optimal for YouTube SEO."
    elif count >= 3 and count <= 15:
        return 0, f"✅ {count} hashtags (optimal range: 3-15)"
    else:
        return 0, f"✅ Hashtag count is good ({count})"


def analyze_keyword_density(title: str, description: str) -> Tuple[int, str]:
    """
    Check if title keywords appear in description
    Impact: -3 points if very low density
    """
    if not description or len(description) < 50:
        return -2, "⚠️ Description too short to analyze keyword density"
    
    # Extract important keywords from title (first 5-7 words, excluding stop words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'}
    title_keywords = [word.lower() for word in title.split() if word.lower() not in stop_words and len(word) > 3][:7]
    
    if not title_keywords:
        return -1, "⚠️ Cannot extract keywords from title"
    
    desc_lower = description.lower()
    density_score = sum(desc_lower.count(kw) for kw in title_keywords)
    
    if density_score < 3:
        return -3, f"❌ Title keywords barely appear in description (only {density_score} mentions). Repeat main keywords 2-3 times."
    elif density_score < 6:
        return -1, f"⚠️ Low keyword density ({density_score} mentions). Aim for 6-10 keyword mentions."
    else:
        return 0, f"✅ Good keyword density ({density_score} keyword mentions in description)"


def score_description_length(description: str) -> Tuple[int, str]:
    """
    Score description based on optimal length
    Impact: -3 points if <100 chars
    """
    length = len(description) if description else 0
    
    if length < 100:
        return -3, f"❌ Description too short ({length} chars). YouTube recommends 250+ characters."
    elif length < 250:
        return -2, f"⚠️ Description is short ({length} chars). 500+ is better for SEO."
    elif length < 500:
        return -1, f"⚠️ Description okay ({length} chars). 1000+ is ideal for maximum SEO."
    elif length >= 1000:
        return 0, f"✅ Excellent description length ({length} chars)"
    else:
        return 0, f"✅ Good description length ({length} chars)"


def detect_cta(description: str) -> Tuple[int, str]:
    """
    Detect call-to-action phrases that boost engagement
    Impact: -2 points if none found
    """
    if not description:
        return -2, "❌ No description to analyze for CTAs"
    
    cta_keywords = [
        'subscribe', 'like', 'comment', 'share', 'bell', 'notification',
        'watch next', 'click here', 'check out', 'follow', 'join',
        'download', 'get', 'learn more', 'visit', 'support'
    ]
    
    desc_lower = description.lower()
    found_ctas = [kw for kw in cta_keywords if kw in desc_lower]
    
    if not found_ctas:
        return -2, "❌ No call-to-action found. Add phrases like 'Subscribe', 'Like', 'Comment' to boost engagement."
    elif len(found_ctas) < 2:
        return -1, f"⚠️ Only 1 CTA found: '{found_ctas[0]}'. Add more CTAs for better engagement."
    else:
        return 0, f"✅ {len(found_ctas)} CTAs detected ({', '.join(found_ctas[:3])}...)"


def check_chapters(description: str) -> Tuple[int, str]:
    """
    Check for chapter markers/timestamps
    Impact: -2 points if no chapters
    """
    if not description:
        return -2, "⚠️ No description to check for chapters"
    
    # Look for timestamp patterns: 0:00, 1:23, 10:45, 1:23:45
    timestamps = re.findall(r'\b\d{1,2}:\d{2}(?::\d{2})?\b', description)
    
    if len(timestamps) >= 3:
        return 0, f"✅ {len(timestamps)} timestamps found (chapters enabled - great for retention!)"
    elif len(timestamps) > 0:
        return -1, f"⚠️ Only {len(timestamps)} timestamps. Add 3+ timestamps to enable YouTube chapters."
    else:
        return -2, "❌ No chapter markers found. Add timestamps (0:00, 1:23, etc.) to improve watch time."


def score_title_optimization(title: str) -> Tuple[int, str]:
    """
    Analyze title for SEO best practices
    Impact: -3 points total for multiple issues
    """
    if not title:
        return -3, "❌ No title to analyze"
    
    length = len(title)
    issues = []
    score = 0
    
    # Length check (optimal: 50-60 chars)
    if length < 30:
        issues.append("Title too short (under 30 chars)")
        score -= 2
    elif length > 70:
        issues.append("Title may be truncated in search results (over 70 chars)")
        score -= 1
    
    # Check for numbers/stats (proven CTR booster)
    if not re.search(r'\d+', title):
        issues.append("No numbers/stats (e.g., '5 Tips', '2024')")
        score -= 1
    
    # Check for power words
    power_words = ['best', 'top', 'ultimate', 'complete', 'guide', 'how to', 'tutorial', 'review', 'vs', 'new', 'secret', 'proven', 'easy', 'fast', 'simple']
    if not any(word in title.lower() for word in power_words):
        issues.append("No power words (Best, Ultimate, Complete, etc.)")
        score -= 1
    
    if issues:
        return score, f"⚠️ Title issues: {', '.join(issues)}"
    else:
        return 0, f"✅ Title well-optimized ({length} chars)"


def analyze_tag_quality(tags: List[str]) -> Tuple[int, str]:
    """
    Analyze tag diversity and quality
    Impact: -3 points if no tags, -2 if poor diversity
    """
    if not tags:
        return -3, "❌ No tags found. Add 10-15 relevant tags."
    
    tag_count = len(tags)
    
    # Check tag length diversity (need short, medium, and long-tail tags)
    tag_lengths = [len(tag.split()) for tag in tags]
    
    has_short = any(l == 1 for l in tag_lengths)  # Single word tags
    has_medium = any(1 < l <= 3 for l in tag_lengths)  # 2-3 word phrases
    has_long = any(l > 3 for l in tag_lengths)  # Long-tail keywords
    
    # Check for overly long tags (YouTube ignores tags >30 chars)
    too_long = [tag for tag in tags if len(tag) > 30]
    
    if too_long:
        return -1, f"⚠️ {len(too_long)} tags are too long (over 30 chars). YouTube may ignore them."
    
    if tag_count < 5:
        return -2, f"⚠️ Only {tag_count} tags. Add at least 10-15 for better SEO."
    elif not (has_short and has_medium):
        return -2, f"⚠️ Tags lack diversity. Include: short (1 word), medium (2-3 words), and long-tail (4+ words) tags."
    elif tag_count > 15:
        return 0, f"✅ {tag_count} tags with good diversity"
    else:
        return 0, f"✅ {tag_count} tags (good diversity detected)"


def calculate_engagement_score(view_count: int, like_count: int, comment_count: int = 0) -> Tuple[int, str]:
    """
    Calculate engagement rate and score it
    Impact: -3 points if very low engagement
    """
    if view_count == 0:
        return -2, "⚠️ No views yet to calculate engagement"
    
    engagement_rate = (like_count / view_count * 100) if view_count > 0 else 0
    
    if engagement_rate < 1:
        return -3, f"❌ Very low engagement ({engagement_rate:.2f}%). Encourage likes and comments."
    elif engagement_rate < 2:
        return -2, f"⚠️ Low engagement ({engagement_rate:.2f}%). Average is 3-5%."
    elif engagement_rate < 3:
        return -1, f"⚠️ Below average engagement ({engagement_rate:.2f}%). Aim for 3%+."
    elif engagement_rate >= 5:
        return 0, f"✅ Excellent engagement ({engagement_rate:.2f}%)"
    else:
        return 0, f"✅ Average engagement ({engagement_rate:.2f}%)"


def analyze_video_comprehensive(url: str) -> Dict[str, Any]:
    """
    Main analyzer function - runs all checks and returns comprehensive score
    Returns score between 0-100
    """
    # Import here to avoid circular imports
    try:
        from .scraper import get_video_info
    except ImportError:
        # Fallback for different import paths
        try:
            from scraper import get_video_info
        except ImportError:
            return {"error": "Cannot import video info scraper"}
    
    # Fetch video metadata
    video_data = get_video_info(url)
    
    if "error" in video_data:
        return video_data
    
    # Extract metadata
    title = video_data.get('title', '')
    description = video_data.get('description', '')
    tags = video_data.get('tags', [])
    view_count = video_data.get('view_count', 0)
    like_count = video_data.get('like_count', 0)
    comment_count = video_data.get('comment_count', 0)
    
    # Initialize scoring
    total_score = 100
    issues = []
    strengths = []
    
    # Run all checks
    checks = [
        ("Tag-Title Match", check_tag_title_match(title, tags)),
        ("Hashtag Validation", validate_hashtags(description)),
        ("Keyword Density", analyze_keyword_density(title, description)),
        ("Description Length", score_description_length(description)),
        ("Call-to-Action", detect_cta(description)),
        ("Chapter Markers", check_chapters(description)),
        ("Title Optimization", score_title_optimization(title)),
        ("Tag Quality", analyze_tag_quality(tags)),
        ("Engagement Rate", calculate_engagement_score(view_count, like_count, comment_count))
    ]
    
    # Aggregate scores
    for check_name, (score_delta, message) in checks:
        total_score += score_delta
        
        if score_delta < 0:
            issues.append({
                "category": check_name,
                "impact": score_delta,
                "message": message
            })
        else:
            strengths.append({
                "category": check_name,
                "message": message
            })
    
    # Clamp score between 0-100
    final_score = max(0, min(100, total_score))
    
    # Calculate engagement rate
    engagement_rate = (like_count / view_count * 100) if view_count > 0 else 0
    
    # Generate improvement suggestions
    suggestions = []
    if final_score < 70:
        suggestions.append("🎯 Priority: Fix the issues marked with ❌ first - they have the biggest impact")
    if final_score < 85:
        suggestions.append("⚡ Quick wins: Address items marked with ⚠️ for easy score boosts")
    if final_score >= 85:
        suggestions.append("🎉 Great job! Your video is well-optimized. Minor tweaks can get you to 90+")
    
    return {
        "score": final_score,
        "grade": get_letter_grade(final_score),
        "title": title,
        "view_count": view_count,
        "like_count": like_count,
        "comment_count": comment_count,
        "engagement_rate": round(engagement_rate, 2),
        "issues": issues,
        "strengths": strengths,
        "suggestions": suggestions,
        "metadata": {
            "tag_count": len(tags),
            "description_length": len(description),
            "hashtag_count": len(re.findall(r'#\w+', description)),
            "timestamp_count": len(re.findall(r'\b\d{1,2}:\d{2}(?::\d{2})?\b', description))
        }
    }


def get_letter_grade(score: int) -> str:
    """Convert numeric score to letter grade"""
    if score >= 90:
        return "A+"
    elif score >= 85:
        return "A"
    elif score >= 80:
        return "B+"
    elif score >= 75:
        return "B"
    elif score >= 70:
        return "C+"
    elif score >= 65:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"


# Example usage and testing
if __name__ == "__main__":
    # Test with a YouTube URL
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    result = analyze_video_comprehensive(test_url)
    
    print(f"\n{'='*60}")
    print(f"VIDEO SEO ANALYSIS - Score: {result['score']}/100 (Grade: {result['grade']})")
    print(f"{'='*60}\n")
    
    print(f"📊 Engagement: {result['engagement_rate']}%")
    print(f"👁️  Views: {result['view_count']:,}")
    print(f"👍 Likes: {result['like_count']:,}\n")
    
    if result['issues']:
        print(f"⚠️  ISSUES TO FIX ({len(result['issues'])}):")
        for issue in result['issues']:
            print(f"   {issue['message']} (Impact: {issue['impact']} points)")
        print()
    
    if result['strengths']:
        print(f"✅ STRENGTHS ({len(result['strengths'])}):")
        for strength in result['strengths']:
            print(f"   {strength['message']}")
        print()
    
    if result['suggestions']:
        print("💡 SUGGESTIONS:")
        for suggestion in result['suggestions']:
            print(f"   {suggestion}")
