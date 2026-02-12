import yt_dlp
import re
from typing import Dict, Any
from collections import Counter

# Power words for title analysis
POWER_WORDS = [
    "amazing", "secret", "proven", "ultimate", "complete", "essential",
    "perfect", "best", "worst", "never", "always", "easy", "simple",
    "quick", "fast", "shocking", "incredible", "mind-blowing", "insane"
]

EMOTIONAL_WORDS = {
    "fear": ["scary", "terrifying", "dangerous", "warning", "avoid", "mistake", "disaster"],
    "excitement": ["amazing", "incredible", "awesome", "epic", "unbelievable", "insane"],
    "curiosity": ["secret", "hidden", "revealed", "truth", "exposed", "mystery"],
    "urgency": ["now", "today", "immediately", "hurry", "limited", "ending"],
    "authority": ["proven", "expert", "professional", "official", "certified", "guaranteed"]
}

FILLER_WORDS = ["um", "uh", "like", "you know", "actually", "basically", "literally"]


def analyze_title(title: str) -> Dict[str, Any]:
    """Analyze video title for click potential"""
    length = len(title)
    words = title.lower().split()
    
    # Check for power words
    power_word_count = sum(1 for word in words if word in POWER_WORDS)
    
    # Check for numbers
    has_numbers = bool(re.search(r'\d+', title))
    
    # Check for question
    is_question = title.endswith('?')
    
    # Sentiment analysis
    sentiment = "Neutral"
    for emotion, emotion_words in EMOTIONAL_WORDS.items():
        if any(word in title.lower() for word in emotion_words):
            sentiment = emotion.capitalize()
            break
    
    # Calculate title score (0-10)
    score = 5.0  # Base score
    
    # Length optimization (45-65 chars ideal)
    if 45 <= length <= 65:
        score += 2
    elif 40 <= length < 45 or 65 < length <= 70:
        score += 1
    
    # Power words bonus
    score += min(power_word_count * 0.5, 2)
    
    # Numbers bonus
    if has_numbers:
        score += 0.5
    
    # Question bonus
    if is_question:
        score += 0.5
    
    score = min(score, 10)
    
    # CTR Prediction
    if score >= 8:
        ctr_prediction = "High"
        ctr_reason = "Strong title with good length, power words, and engagement hooks"
    elif score >= 6:
        ctr_prediction = "Medium"
        ctr_reason = "Decent title but could be optimized further"
    else:
        ctr_prediction = "Low"
        ctr_reason = "Title needs improvement - add power words, optimize length"
    
    return {
        "score": round(score, 1),
        "length": length,
        "power_words": power_word_count,
        "has_numbers": has_numbers,
        "is_question": is_question,
        "sentiment": sentiment,
        "ctr_prediction": ctr_prediction,
        "ctr_reason": ctr_reason
    }


def analyze_description(description: str) -> Dict[str, Any]:
    """Analyze video description for SEO"""
    if not description:
        return {
            "score": 0,
            "length": 0,
            "keyword_count": 0,
            "has_cta": False,
            "hashtag_count": 0
        }
    
    length = len(description)
    hashtags = re.findall(r'#\w+', description)
    
    # Check for CTA (Call to Action)
    cta_keywords = ["subscribe", "like", "comment", "share", "follow", "click", "watch"]
    has_cta = any(keyword in description.lower() for keyword in cta_keywords)
    
    # Calculate score
    score = 0
    if length > 200:
        score += 3
    if length > 500:
        score += 2
    if len(hashtags) > 0:
        score += 2
    if has_cta:
        score += 3
    
    return {
        "score": min(score, 10),
        "length": length,
        "hashtag_count": len(hashtags),
        "has_cta": has_cta
    }


def analyze_tags(tags: list) -> Dict[str, Any]:
    """Analyze video tags"""
    if not tags:
        return {"score": 0, "count": 0, "quality": "Poor"}
    
    tag_count = len(tags)
    
    # Check for long-tail tags (3+ words)
    long_tail = sum(1 for tag in tags if len(tag.split()) >= 3)
    
    score = min(tag_count * 0.5, 5)  # Base on count
    score += min(long_tail * 0.5, 3)  # Bonus for long-tail
    score = min(score, 10)
    
    if score >= 7:
        quality = "Excellent"
    elif score >= 5:
        quality = "Good"
    else:
        quality = "Needs Improvement"
    
    return {
        "score": round(score, 1),
        "count": tag_count,
        "long_tail_count": long_tail,
        "quality": quality
    }


def analyze_seo(title: str, description: str, tags: list) -> Dict[str, Any]:
    """Overall SEO analysis"""
    # Extract potential main keyword (first 3 words usually)
    title_words = title.lower().split()[:3]
    main_keyword = " ".join(title_words)
    
    # Check keyword presence
    keyword_in_title = True  # Main keyword is from title
    keyword_in_desc = main_keyword in description.lower() if description else False
    keyword_in_tags = any(main_keyword in tag.lower() for tag in tags) if tags else False
    
    keyword_score = 3  # Always in title
    if keyword_in_desc:
        keyword_score += 3
    if keyword_in_tags:
        keyword_score += 2
    
    # Keyword position in title
    if title_words[0] in ["how", "what", "why", "when", "best", "top"]:
        keyword_position = "Beginning (Optimal)"
    else:
        keyword_position = "Not Optimized"
    
    # Calculate overall SEO score
    title_analysis = analyze_title(title)
    desc_analysis = analyze_description(description)
    tag_analysis = analyze_tags(tags)
    
    seo_overall = (
        title_analysis["score"] * 0.4 +
        desc_analysis["score"] * 0.3 +
        tag_analysis["score"] * 0.3
    ) * 10
    
    return {
        "keyword_score": min(keyword_score, 10),
        "main_keyword": main_keyword,
        "keyword_position": keyword_position,
        "description_score": desc_analysis["score"],
        "description_length": desc_analysis["length"],
        "tag_score": tag_analysis["score"],
        "tag_count": tag_analysis["count"],
        "seo_overall": round(seo_overall, 1)
    }


def analyze_retention(duration: int, description: str) -> Dict[str, Any]:
    """Analyze retention potential"""
    # Pacing score based on duration
    if duration < 180:  # < 3 mins
        pacing_score = 9
    elif duration < 600:  # < 10 mins
        pacing_score = 8
    elif duration < 1200:  # < 20 mins
        pacing_score = 6
    else:
        pacing_score = 4
    
    # Engagement density (based on description for now)
    questions_asked = description.count('?') if description else 0
    engagement_density = min(questions_asked * 2, 10)
    
    # Content structure score (simplified)
    structure_score = 7  # Default moderate score
    
    # Retention risks
    risks = []
    if duration > 1200:
        risks.append("Very long video - may lose viewers")
    if duration > 600:
        risks.append("Consider adding chapters for better navigation")
    if engagement_density < 3:
        risks.append("Low engagement signals - add more questions/interactions")
    if not risks:
        risks.append("No major retention risks detected")
    
    return {
        "pacing_score": pacing_score,
        "engagement_density": engagement_density,
        "questions_asked": questions_asked,
        "structure_score": structure_score,
        "retention_risks": risks
    }


def analyze_virality(title: str, description: str, views: int, duration: int) -> Dict[str, Any]:
    """Analyze viral potential"""
    # Emotional triggers
    emotional_triggers = {}
    for emotion, words in EMOTIONAL_WORDS.items():
        text = (title + " " + (description or "")).lower()
        trigger_count = sum(1 for word in words if word in text)
        emotional_triggers[emotion] = min(trigger_count * 2, 10)
    
    # Shareability score
    shareability_factors = 0
    
    # Strong opinion indicators
    opinion_words = ["best", "worst", "never", "always", "everyone", "nobody"]
    if any(word in title.lower() for word in opinion_words):
        shareability_factors += 3
    
    # Data/Numbers
    if re.search(r'\d+', title):
        shareability_factors += 2
    
    # Story indicators
    story_words = ["story", "journey", "experience", "happened"]
    if any(word in title.lower() for word in story_words):
        shareability_factors += 2
    
    # Relatable struggle
    struggle_words = ["struggle", "fail", "mistake", "problem", "challenge"]
    if any(word in title.lower() for word in struggle_words):
        shareability_factors += 3
    
    shareability_score = min(shareability_factors, 10)
    
    # Trend alignment (simplified - check for trending keywords)
    trending_keywords = ["ai", "2024", "2025", "new", "latest", "trend", "viral"]
    trend_score = sum(2 for keyword in trending_keywords if keyword in title.lower())
    trend_score = min(trend_score, 10)
    
    trending_topics = ", ".join([kw for kw in trending_keywords if kw in title.lower()]) or None
    
    # Overall viral probability
    avg_emotional = sum(emotional_triggers.values()) / len(emotional_triggers)
    viral_score = (avg_emotional + shareability_score + trend_score) / 3
    
    if viral_score >= 7:
        viral_probability = "High"
    elif viral_score >= 5:
        viral_probability = "Medium"
    else:
        viral_probability = "Low"
    
    return {
        "emotional_triggers": emotional_triggers,
        "shareability_score": round(shareability_score, 1),
        "trend_score": round(trend_score, 1),
        "trending_topics": trending_topics,
        "viral_probability": viral_probability
    }


def generate_recommendations(analysis_data: Dict[str, Any]) -> list:
    """Generate improvement recommendations"""
    recommendations = []
    
    metrics = analysis_data["metrics"]
    
    # Title recommendations
    if metrics["title_score"] < 7:
        recommendations.append({
            "priority": "high",
            "title": "Optimize Your Title",
            "suggestion": f"Your title is {metrics['title_length']} characters. Aim for 45-65 characters and include power words."
        })
    
    # SEO recommendations
    if metrics["seo_overall"] < 60:
        recommendations.append({
            "priority": "high",
            "title": "Improve SEO",
            "suggestion": "Add more relevant tags and optimize your description with keywords and hashtags."
        })
    
    # Keyword position
    if metrics["keyword_position"] != "Beginning (Optimal)":
        recommendations.append({
            "priority": "medium",
            "title": "Keyword Placement",
            "suggestion": "Move your main keyword to the beginning of the title for better SEO."
        })
    
    # Description
    if metrics["description_length"] < 200:
        recommendations.append({
            "priority": "medium",
            "title": "Expand Description",
            "suggestion": "Write a longer description (500+ characters) with keywords and relevant links."
        })
    
    # Engagement
    if metrics["engagement_density"] < 5:
        recommendations.append({
            "priority": "medium",
            "title": "Increase Engagement",
            "suggestion": "Add more questions and calls-to-action to boost viewer interaction."
        })
    
    # Hook strength
    if metrics["hook_strength"] < 7:
        recommendations.append({
            "priority": "high",
            "title": "Strengthen Your Hook",
            "suggestion": "Create a stronger opening in the first 15 seconds to grab attention immediately."
        })
    
    # Viral potential
    if metrics["trend_score"] < 5:
        recommendations.append({
            "priority": "low",
            "title": "Trend Alignment",
            "suggestion": "Consider incorporating trending topics or keywords to increase discoverability."
        })
    
    # Add positive feedback if doing well
    if analysis_data["overall_score"] >= 80:
        recommendations.append({
            "priority": "low",
            "title": "Great Job!",
            "suggestion": "Your video is well-optimized. Keep up the excellent work!"
        })
    
    return recommendations


def analyze_video_comprehensive(url: str) -> Dict[str, Any]:
    """Main function to analyze video from any platform"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if 'entries' in info:
                info = info['entries'][0]
            
            # Extract data
            title = info.get('title', 'Untitled')
            description = info.get('description', '')
            duration = info.get('duration', 0)
            views = info.get('view_count', 0)
            uploader = info.get('uploader', 'Unknown')
            thumbnail = info.get('thumbnail', '')
            tags = info.get('tags', [])
            
            # Detect platform
            if 'youtube' in url:
                platform = 'YouTube'
            elif 'tiktok' in url:
                platform = 'TikTok'
            elif 'instagram' in url:
                platform = 'Instagram'
            elif 'facebook' in url:
                platform = 'Facebook'
            elif 'twitter' in url or 'x.com' in url:
                platform = 'X (Twitter)'
            else:
                platform = 'Unknown'
            
            # Run analyses
            title_analysis = analyze_title(title)
            seo_analysis = analyze_seo(title, description, tags)
            retention_analysis = analyze_retention(duration, description)
            virality_analysis = analyze_virality(title, description, views, duration)
            
            # Calculate component scores
            click_potential = title_analysis["score"]
            seo_score = seo_analysis["seo_overall"] / 10
            retention_score = (
                retention_analysis["pacing_score"] * 0.4 +
                retention_analysis["engagement_density"] * 0.3 +
                retention_analysis["structure_score"] * 0.3
            )
            
            # Hook strength (simplified - based on title for now)
            hook_strength = title_analysis["score"]
            
            # Overall score
            overall_score = (
                click_potential * 0.3 +
                seo_score * 0.25 +
                retention_score * 0.25 +
                (10 if virality_analysis["viral_probability"] == "High" else 
                 7 if virality_analysis["viral_probability"] == "Medium" else 4) * 0.2
            ) * 10
            
            # Combine all metrics
            metrics = {
                "title_score": title_analysis["score"],
                "title_length": title_analysis["length"],
                "ctr_prediction": title_analysis["ctr_prediction"],
                "ctr_reason": title_analysis["ctr_reason"],
                "title_sentiment": title_analysis["sentiment"],
                "hook_strength": hook_strength,
                **seo_analysis,
                **retention_analysis,
                **virality_analysis
            }
            
            result = {
                "overall_score": round(overall_score, 1),
                "click_potential": round(click_potential, 1),
                "seo_score": round(seo_score, 1),
                "retention_score": round(retention_score, 1),
                "viral_probability": virality_analysis["viral_probability"],
                "title": title,
                "description": description[:200] + "..." if len(description) > 200 else description,
                "duration": duration,
                "views": views,
                "uploader": uploader,
                "thumbnail": thumbnail,
                "platform": platform,
                "metrics": metrics,
                "recommendations": []
            }
            
            # Generate recommendations
            result["recommendations"] = generate_recommendations(result)
            
            return result
            
    except Exception as e:
        return {"error": f"Failed to analyze video: {str(e)}"}
