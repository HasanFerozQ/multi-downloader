import re
from typing import Dict, List, Tuple, Any


# ─────────────────────────────────────────────
#  HELPER UTILITIES
# ─────────────────────────────────────────────

def _clamp(val: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, val))

def _score_color(score: float, max_val: float = 100) -> str:
    pct = (score / max_val) * 100
    if pct >= 75: return "excellent"
    if pct >= 50: return "good"
    if pct >= 30: return "average"
    return "poor"


# ─────────────────────────────────────────────
#  SECTION 1 — CLICK POTENTIAL (5 sub-metrics)
# ─────────────────────────────────────────────

def _title_performance_score(title: str) -> float:
    """Score 0-100 based on length, power words, numbers, structure."""
    if not title:
        return 0
    score = 50  # baseline

    length = len(title)
    if 40 <= length <= 60:
        score += 20
    elif 30 <= length < 40 or 60 < length <= 70:
        score += 10
    elif length < 30:
        score -= 15
    else:  # >70, truncated
        score -= 5

    power_words = [
        'best', 'top', 'ultimate', 'complete', 'guide', 'how to', 'tutorial',
        'review', 'vs', 'new', 'secret', 'proven', 'easy', 'fast', 'simple',
        'free', 'now', 'today', 'instantly', 'tips', 'tricks', 'hack', 'winning',
    ]
    matches = sum(1 for w in power_words if w in title.lower())
    score += min(matches * 7, 21)

    if re.search(r'\d+', title):
        score += 9

    return round(_clamp(score))


def _ctr_predictor(title: str, view_count: int, like_count: int) -> Tuple[float, str, str]:
    """Returns (score_0_10, label, reason)."""
    score = 5.0
    reasons = []

    if len(title) >= 30:
        score += 1
        reasons.append("good title length")
    power_words = ['how to', 'best', 'top', 'secret', 'ultimate', 'guide', 'tips', 'tricks']
    if any(w in title.lower() for w in power_words):
        score += 1.5
        reasons.append("power words present")
    if re.search(r'\d+', title):
        score += 0.8
        reasons.append("numbers in title")
    if '?' in title or '!' in title:
        score += 0.7
        reasons.append("emotional punctuation")

    if view_count > 0:
        er = like_count / view_count
        if er >= 0.05: score += 1
        elif er >= 0.02: score += 0.5

    score = _clamp(score, 0, 10)

    if score >= 7.5:
        label = "High"
    elif score >= 5:
        label = "Medium"
    else:
        label = "Low"

    reason = "Based on " + ", ".join(reasons) if reasons else "Standard title without standout hooks"
    return round(float(score), 1), label, reason  # type: ignore


def _title_sentiment(title: str) -> str:
    """Classify the dominant emotional tone."""
    t = title.lower()
    curiosity = ['how', 'why', 'what', 'secret', 'mystery', 'hidden', '?', 'truth']
    inspiration = ['best', 'amazing', 'incredible', 'transform', 'change', 'success']
    urgency = ['now', 'today', 'fast', 'quickly', 'instantly', 'limited', 'urgent']
    fear = ['avoid', 'mistake', 'worst', 'danger', 'stop', 'never', 'fail']
    excitement = ['!', 'wow', 'incredible', 'unbelievable', 'shocking', 'mind-blowing']

    scores = {
        "Curiosity-driven": sum(1 for w in curiosity if w in t),
        "Inspirational": sum(1 for w in inspiration if w in t),
        "Urgency-based": sum(1 for w in urgency if w in t),
        "Fear of missing out": sum(1 for w in fear if w in t),
        "Excitement": sum(1 for w in excitement if w in t),
    }
    best = max(scores, key=scores.get)  # type: ignore
    return best if scores[best] > 0 else "Neutral / Informational"


def _thumbnail_title_alignment(title: str, tags: List[str]) -> float:
    """Proxy: how well do the tags reinforce the title topic? 0-100."""
    if not tags or not title:
        return 40
    title_words = set(w.lower() for w in title.split() if len(w) > 3)
    matches = sum(
        1 for tag in tags
        if any(w in title_words for w in tag.lower().split())
    )
    ratio = matches / max(len(tags), 1)
    return round(_clamp(40 + ratio * 60))


def _hook_strength(title: str, description: str) -> float:
    """Score 0-10 based on opening hook signals."""
    score = 5.0
    first_para = (str(description) or "")[:300].lower()  # type: ignore
    hook_signals = ['watch', 'discover', 'find out', 'learn', 'today', 'in this video',
                    'join', 'we will', "you'll", 'how to', 'secret', 'never seen']
    matches = sum(1 for s in hook_signals if s in first_para)
    score += min(matches * 0.5, 2.5)

    if title and any(c in title for c in ['?', '!']):
        score += 0.8
    if description and len(description) > 200:
        score += 0.7

    return round(float(_clamp(score, 0, 10)), 1)  # type: ignore


def compute_click_potential(title: str, description: str, tags: List[str],
                             view_count: int, like_count: int) -> Dict:
    tps = _title_performance_score(title)
    ctr_score, ctr_label, ctr_reason = _ctr_predictor(title, view_count, like_count)
    sentiment = _title_sentiment(title)
    tta = _thumbnail_title_alignment(title, tags)
    hook = _hook_strength(title, description)

    master = round((tps + ctr_score * 10 + tta + hook * 10) / 4)
    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "title_performance_score": tps,
            "ctr_predictor": ctr_score,         # 0-10
            "title_sentiment": sentiment,
            "thumbnail_title_alignment": tta,
            "hook_strength": hook,               # 0-10
        },
        "ctr_label": ctr_label,
        "ctr_reason": ctr_reason,
    }


# ─────────────────────────────────────────────
#  SECTION 2 — SEO STRENGTH (5 sub-metrics)
# ─────────────────────────────────────────────

def _keyword_density_map(title: str, description: str) -> float:
    """How well do title keywords saturate the description? 0-100."""
    if not description or len(description) < 50:
        return 20
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
                  'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'}
    keywords = [w.lower() for w in title.split() if w.lower() not in stop_words and len(w) > 3][:7]  # type: ignore
    if not keywords:
        return 30
    desc_lower = description.lower()
    density = sum(desc_lower.count(kw) for kw in keywords)
    return round(_clamp(20 + density * 8))


def _description_structure_score(description: str) -> float:
    """Assess structure quality: length, CTAs, links, chapters. 0-100."""
    if not description:
        return 0
    score = 0
    # Adjusted thresholds (more realistic)
    if len(description) >= 600: score += 30
    elif len(description) >= 350:  score += 20
    elif len(description) >= 150:  score += 10
    
    cta_words = ['subscribe', 'like', 'comment', 'share', 'follow', 'check out', 'click', 'visit']
    cta_count = sum(1 for w in cta_words if w in description.lower())
    score += min(cta_count * 8, 30)
    
    if re.search(r'https?://', description): score += 10
    
    timestamps = re.findall(r'\b\d{1,2}:\d{2}\b', description)
    if len(timestamps) >= 3: score += 20
    elif len(timestamps) >= 1: score += 10
    
    hashtag_count = len(re.findall(r'#\w+', description))
    if 3 <= hashtag_count <= 15: score += 10
    
    return round(_clamp(score))


def _tag_quality_score(tags: List[str]) -> float:
    """Assess tag diversity and count. 0-100."""
    if not tags:
        return 30  # Baseline score even without explicit tags (don't fail completely)
        
    count = len(tags)
    lengths = [len(t.split()) for t in tags]
    short = any(l == 1 for l in lengths)
    medium = any(2 <= l <= 3 for l in lengths)
    long_tail = any(l > 3 for l in lengths)
    
    diversity = sum([short, medium, long_tail])
    score = min(count * 4, 50) + diversity * 15
    
    too_long = sum(1 for t in tags if len(t) > 30)
    score -= too_long * 5
    
    return round(_clamp(score))


def _searchability_index(title: str, description: str, tags: List[str]) -> float:
    """Composite SEO discoverability score. 0-100."""
    components = [
        _keyword_density_map(title, description),
        _tag_quality_score(tags),
        _description_structure_score(description),
        min(len(title) / 60 * 100, 100),
    ]
    return round(sum(components) / len(components))


def _keyword_difficulty(title: str) -> Tuple[float, str]:
    """Estimate keyword competitiveness from title. 0-100."""
    t = title.lower()
    high_comp = ['how to', 'tutorial', 'review', 'best', 'top 10', 'vs', 'guide']
    low_comp = ['my experience', 'vlog', 'story', 'reaction', 'behind the scenes']
    high_score = sum(1 for w in high_comp if w in t)
    low_score = sum(1 for w in low_comp if w in t)
    base = 55
    base += high_score * 8
    base -= low_score * 10
    val = round(_clamp(base))
    if val >= 70: label = "High"
    elif val >= 40: label = "Medium"
    else: label = "Low"
    return val, label


def compute_seo_strength(title: str, description: str, tags: List[str]) -> Dict:
    kd = _keyword_density_map(title, description)
    ds = _description_structure_score(description)
    tqs = _tag_quality_score(tags)
    si = _searchability_index(title, description, tags)
    kd_val, kd_label = _keyword_difficulty(title)

    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
                  'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'}
    title_keywords = [w for w in title.split() if w.lower() not in stop_words and len(w) > 3]
    main_keyword = title_keywords[0] if title_keywords else title.split()[0] if title else "N/A"
    keyword_in_position = "first word" if title_keywords and title.lower().startswith(title_keywords[0].lower()) else "mid-title"

    master = round((kd + ds + tqs + si) / 4)
    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "keyword_density_map": kd,
            "description_structure_score": ds,
            "tag_quality_score": tqs,
            "searchability_index": si,
            "keyword_difficulty_score": kd_val,
        },
        "keyword_difficulty_label": kd_label,
        "main_keyword": main_keyword,
        "keyword_position": f"Main keyword '{main_keyword}' appears in {keyword_in_position}",
        "seo_overall": master,
    }


# ─────────────────────────────────────────────
#  SECTION 3 — RETENTION & WATCHABILITY (6 sub-metrics)
# ─────────────────────────────────────────────

def _pacing_score(duration_seconds: int) -> float:
    """Score video length against YouTube optimal ranges. 0-100."""
    if duration_seconds <= 0:
        return 50
    minutes = duration_seconds / 60
    if 8 <= minutes <= 20:
        return 90
    elif 5 <= minutes < 8 or 20 < minutes <= 30:
        return 75
    elif 3 <= minutes < 5 or 30 < minutes <= 45:
        return 60
    elif 1 <= minutes < 3:
        return 50
    elif minutes > 45:
        return 45
    return 35


def _content_structure_completeness(description: str) -> float:
    """Check if description has structured, complete content. 0-100."""
    if not description:
        return 10
    score = 0
    if len(description) >= 500: score += 25
    elif len(description) >= 200: score += 15
    timestamps = re.findall(r'\b\d{1,2}:\d{2}\b', description)
    if len(timestamps) >= 5: score += 30
    elif len(timestamps) >= 3: score += 20
    elif len(timestamps) >= 1: score += 10
    if any(w in description.lower() for w in ['intro', 'introduction', 'conclusion', 'summary']):
        score += 15
    if re.search(r'https?://', description): score += 15
    cta_words = ['subscribe', 'like', 'comment', 'share']
    if any(w in description.lower() for w in cta_words): score += 15
    return round(_clamp(score))


def _engagement_signal_density(description: str, view_count: int, like_count: int, comment_count: int) -> float:
    """Measure engagement call-to-action strength + real engagement. 0-10."""
    score = 5.0
    ctas = ['subscribe', 'like', 'comment', 'share', 'bell', 'notification',
            'watch next', 'click', 'follow', 'join', 'download']
    cta_count = sum(1 for w in ctas if w in (description or "").lower())
    score += min(cta_count * 0.4, 2)
    if view_count > 0:
        er = like_count / view_count
        if er >= 0.05: score += 2
        elif er >= 0.03: score += 1.5
        elif er >= 0.01: score += 0.5
        comment_rate = comment_count / view_count if comment_count else 0
        if comment_rate >= 0.005: score += 1
    return round(float(_clamp(score, 0, 10)), 1)  # type: ignore


def _drop_off_risk(duration_seconds: int, description: str) -> Tuple[str, float]:
    """Assess drop-off risk level. Returns (label, score 0-10)."""
    score = 7.0
    if duration_seconds > 0:
        minutes = duration_seconds / 60
        if minutes > 40: score -= 2.5
        elif minutes > 25: score -= 1.5
        elif minutes > 15: score -= 0.5
    timestamps = len(re.findall(r'\b\d{1,2}:\d{2}\b', description or ""))
    if timestamps >= 5: score += 1.5
    elif timestamps >= 3: score += 1
    score = _clamp(score, 0, 10)
    if score >= 7: label = "Low Risk"
    elif score >= 5: label = "Medium Risk"
    else: label = "High Risk"
    return label, round(float(score), 1)  # type: ignore


def _watch_time_optimization(duration_seconds: int, description: str) -> float:
    """Combined watch-time score. 0-100."""
    pacing = _pacing_score(duration_seconds)
    structure = _content_structure_completeness(description)
    return round((pacing + structure) / 2)


def compute_retention(title: str, description: str, duration_seconds: int,
                       view_count: int, like_count: int, comment_count: int) -> Dict:
    pacing = _pacing_score(duration_seconds)
    hook = _hook_strength(title, description)
    structure = _content_structure_completeness(description)
    eng_density = _engagement_signal_density(description, view_count, like_count, comment_count)
    drop_label, drop_score = _drop_off_risk(duration_seconds, description)
    watch_time = _watch_time_optimization(duration_seconds, description)

    master = round((pacing + hook * 10 + structure + drop_score * 10 + watch_time) / 5)
    mins = duration_seconds // 60
    secs = duration_seconds % 60

    risks = []
    if duration_seconds > 40 * 60:
        risks.append("Video is very long (40+ min) — high drop-off risk after 15 mins")
    if not re.findall(r'\b\d{1,2}:\d{2}\b', description or ""):
        risks.append("No chapter timestamps — viewers can't navigate, may leave early")
    if view_count > 0 and like_count / view_count < 0.01:
        risks.append("Very low engagement rate suggests weak audience connection")

    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "pacing_score": round(pacing),
            "hook_strength_first_15s": hook,    # 0-10
            "content_structure_completeness": round(structure),
            "engagement_signal_density": eng_density,  # 0-10
            "drop_off_risk_label": drop_label,
            "drop_off_risk_score": drop_score,
            "watch_time_optimization": round(watch_time),
        },
        "duration_formatted": f"{mins}:{secs:02d}",
        "retention_risks": risks,
    }


# ─────────────────────────────────────────────
#  SECTION 4 — VIRALITY POTENTIAL (4 sub-metrics)
# ─────────────────────────────────────────────

def _emotional_intensity_index(title: str, description: str) -> float:
    """Detect emotional intensity in text. 0-10."""
    text = (title + " " + (str(description) or "")[:500]).lower()  # type: ignore
    emotional_words = [
        'amazing', 'incredible', 'shocking', 'unbelievable', 'mind-blowing', 'epic',
        'hate', 'love', 'fear', 'angry', 'excited', 'hilarious', 'sad', 'beautiful',
        'terrifying', 'surprising', 'emotional', 'powerful', 'inspiring',
    ]
    matches = sum(1 for w in emotional_words if w in text)
    return round(float(_clamp(3 + matches * 0.7, 0, 10)), 1)  # type: ignore


def _shareability_score(title: str, description: str, tags: List[str],
                         view_count: int, like_count: int) -> float:
    """How shareable is this content? 0-100."""
    score = 40
    share_hooks = ['share', 'must see', 'watch this', 'everyone', 'viral', 'funny', 'amazing']
    text = (title + " " + (str(description) or "")[:300]).lower()  # type: ignore
    score += sum(min(5, 1) for w in share_hooks if w in text) * 5

    if view_count > 0:
        er = like_count / view_count
        if er >= 0.08: score += 25
        elif er >= 0.04: score += 15
        elif er >= 0.02: score += 8

    if view_count > 100000: score += 15
    elif view_count > 10000: score += 8

    return round(_clamp(score))


def _trend_alignment_score(title: str, tags: List[str]) -> float:
    """Check for trending topic signals in title and tags. 0-100."""
    trend_signals = [
        '2025', '2026', 'new', 'latest', 'trending', 'viral', 'react', 'reaction',
        'ai', 'chatgpt', 'shorts', 'fyp', 'challenge', '#shorts',
    ]
    text = (title + " " + " ".join(tags or [])).lower()
    matches = sum(1 for t in trend_signals if t in text)
    return round(_clamp(30 + matches * 10))


def _controversy_meter(title: str, description: str) -> float:
    """Estimate controversy level. 0-10. Mid-range is best for engagement."""
    text = (title + " " + (str(description) or "")[:300]).lower()  # type: ignore
    controversy_words = ['vs', 'debate', 'controversial', 'truth', 'expose', 'wrong',
                         'disagree', 'myth', 'lie', 'real', 'fake', 'unpopular opinion']
    matches = sum(1 for w in controversy_words if w in text)
    return round(float(_clamp(2 + matches * 0.8, 0, 10)), 1)  # type: ignore


def compute_virality(title: str, description: str, tags: List[str],
                     view_count: int, like_count: int, comment_count: int) -> Dict:
    emotional = _emotional_intensity_index(title, description)
    shareability = _shareability_score(title, description, tags, view_count, like_count)
    trend = _trend_alignment_score(title, tags)
    controversy = _controversy_meter(title, description)

    master = round((emotional * 10 + shareability + trend + controversy * 10) / 4)

    if master >= 70: prob = "High"
    elif master >= 45: prob = "Medium"
    else: prob = "Low"

    emotional_triggers = {
        "excitement": min(10, round(emotional)),
        "curiosity": min(10, round(_hook_strength(title, description))),
        "inspiration": min(10, round(trend / 10)),
        "controversy": min(10, round(controversy)),
        "shareability": min(10, round(shareability / 10)),
    }

    return {
        "master_score": _clamp(master),
        "viral_probability": prob,
        "sub_metrics": {
            "emotional_intensity_index": emotional,   # 0-10
            "shareability_score": shareability,       # 0-100
            "trend_alignment_score": trend,           # 0-100
            "controversy_meter": controversy,         # 0-10
        },
        "emotional_triggers": emotional_triggers,
        "trending_topics": "Trending signals detected" if trend > 50 else "No strong trending signals",
    }


# ─────────────────────────────────────────────
#  SECTION 5 — TECHNICAL QUALITY (3 sub-metrics)
# ─────────────────────────────────────────────

def _video_length_optimization(duration_seconds: int) -> float:
    """Is the length optimal for YouTube monetization & retention? 0-100."""
    minutes = duration_seconds / 60 if duration_seconds > 0 else 0
    if 8 <= minutes <= 20: return 95
    if 6 <= minutes < 8 or 20 < minutes <= 30: return 80
    if 4 <= minutes < 6 or 30 < minutes <= 40: return 65
    if 2 <= minutes < 4: return 50
    if minutes > 40: return 40
    return 30


def _metadata_completeness(title: str, description: str, tags: List[str],
                            view_count: int) -> float:
    """Check if all metadata fields are present and rich. 0-100."""
    score = 0
    if title and len(title) >= 20: score += 20
    if description and len(description) >= 200: score += 25
    elif description and len(description) >= 50: score += 10
    if tags and len(tags) >= 5: score += 20
    elif tags: score += 10
    if description and re.findall(r'#\w+', description): score += 15
    if description and re.findall(r'\b\d{1,2}:\d{2}\b', description): score += 20
    return round(_clamp(score))


def _upload_timing_score(upload_date: str, timestamp: float = 0) -> Tuple[str, float]:
    """Estimate upload timing quality. 0-100."""
    score = 65  # default neutral
    label = "Unknown timing"
    
    try:
        from datetime import datetime
        
        # Prefer precise timestamp over date-only
        if timestamp and timestamp > 0:
            dt = datetime.fromtimestamp(timestamp)
        elif upload_date:
            # Fallback to upload_date (YYYY-MM-DD format)
            dt = datetime.strptime(upload_date, "%Y-%m-%d")
        else:
            return label, score
        
        weekday = dt.weekday()  # 0=Mon, 6=Sun
        hour = dt.hour

        if weekday in (3, 4):  # Thu/Fri
            score += 15
            day_label = "Thursday/Friday"
        elif weekday in (1, 2):  # Tue/Wed
            score += 10
            day_label = "Tuesday/Wednesday"
        elif weekday in (5, 6):  # Weekend
            score += 5
            day_label = "Weekend"
        else:
            day_label = "Monday"

        if 14 <= hour <= 17:
            score += 15
            label = f"Excellent ({day_label}, {hour}:00)"
        elif 10 <= hour <= 14 or 17 < hour <= 20:
            score += 8
            label = f"Good ({day_label}, {hour}:00)"
        else:
            label = f"Off-peak ({day_label}, {hour}:00)"
    except Exception:
        label = "Date parsing unavailable"

    return label, round(_clamp(score))


def compute_technical(title: str, description: str, tags: List[str],
                       duration_seconds: int, upload_date: str, view_count: int, timestamp: float = 0) -> Dict:
    length_opt = _video_length_optimization(duration_seconds)
    metadata = _metadata_completeness(title, description, tags, view_count)
    timing_label, timing_score = _upload_timing_score(upload_date, timestamp)

    master = round((length_opt + metadata + timing_score) / 3)
    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "video_length_optimization": round(length_opt),
            "metadata_completeness": metadata,
            "upload_timing_score": timing_score,
        },
        "upload_timing_label": timing_label,
    }


# ─────────────────────────────────────────────
#  SECTION 6 — COMPETITIVE INTELLIGENCE (3 sub-metrics)
# ─────────────────────────────────────────────

def _title_uniqueness_score(title: str) -> float:
    """Heuristic uniqueness of the title. 0-100."""
    generic = ['video', 'watch', 'click here', 'please', 'new video', 'upload', 'official']
    t = title.lower()
    generic_hits = sum(1 for w in generic if w in t)
    score = 80 - generic_hits * 12
    if len(title.split()) >= 6: score += 10
    return round(_clamp(score))


def _duration_benchmarking(duration_seconds: int) -> str:
    """Compare to YouTube average (~7 min for standard content)."""
    avg_seconds = 7 * 60
    if duration_seconds <= 0:
        return "Unknown"
    diff_pct = ((duration_seconds - avg_seconds) / avg_seconds) * 100
    if abs(diff_pct) <= 10:
        return "Close to average (7 min)"
    elif diff_pct > 0:
        return f"{abs(round(diff_pct))}% longer than avg"
    else:
        return f"{abs(round(diff_pct))}% shorter than avg"


def compute_competitive(title: str, description: str, tags: List[str],
                         duration_seconds: int) -> Dict:
    uniqueness = _title_uniqueness_score(title)
    duration_bench = _duration_benchmarking(duration_seconds)
    kd_val, kd_label = _keyword_difficulty(title)

    master = round((uniqueness + (100 - kd_val) / 2 + 60) / 3)
    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "title_uniqueness_score": uniqueness,
            "duration_benchmarking": duration_bench,
            "keyword_difficulty_score": kd_val,
        },
        "keyword_difficulty_label": kd_label,
    }


# ─────────────────────────────────────────────
#  SECTION 7 — AUDIENCE PSYCHOLOGY (3 sub-metrics)
# ─────────────────────────────────────────────

def _curiosity_gap_score(title: str, description: str) -> float:
    """How strong is the curiosity gap / open loop in the title? 0-10."""
    t = title.lower()
    gap_signals = ['secret', 'truth', 'why', 'how', 'what nobody tells', 'hidden',
                   '?', 'you didn\'t know', 'surprising', 'revealed', 'shocked']
    matches = sum(1 for s in gap_signals if s in t)
    desc_bonus = 1 if description and any(w in str(description)[:200].lower() for w in ['find out', 'learn why', 'discover']) else 0  # type: ignore
    return round(float(_clamp(3 + matches * 1.5 + desc_bonus, 0, 10)), 1)  # type: ignore


def _authority_signals(title: str, description: str, tags: List[str],
                        view_count: int, like_count: int) -> float:
    """Does the content signal expertise and authority? 0-100."""
    score = 40
    authority_words = ['expert', 'professional', 'years', 'certified', 'proven',
                       'research', 'study', 'data', 'science', 'official']
    text = (title + " " + (str(description) or "")[:500]).lower()  # type: ignore
    score += sum(3 for w in authority_words if w in text)
    if view_count > 100000: score += 20
    elif view_count > 10000: score += 10
    if view_count > 0 and like_count / view_count >= 0.04: score += 15
    return round(_clamp(score))


def _relatability_index(title: str, description: str) -> float:
    """How relatable / accessible is the content? 0-100."""
    score = 50
    relatable = ['you', 'your', 'we', 'our', 'everyone', 'people like', 'feel',
                 'ever wanted', 'have you', 'struggle', 'simple', 'easy', 'anyone']
    text = (title + " " + (str(description) or "")[:500]).lower()  # type: ignore
    matches = sum(1 for w in relatable if w in text)
    score += min(matches * 4, 30)
    return round(_clamp(score))


def compute_audience_psychology(title: str, description: str, tags: List[str],
                                  view_count: int, like_count: int) -> Dict:
    curiosity = _curiosity_gap_score(title, description)
    authority = _authority_signals(title, description, tags, view_count, like_count)
    relatable = _relatability_index(title, description)

    master = round((curiosity * 10 + authority + relatable) / 3)
    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "curiosity_gap_score": curiosity,       # 0-10
            "authority_signals": authority,          # 0-100
            "relatability_index": relatable,         # 0-100
        },
    }


# ─────────────────────────────────────────────
#  SECTION 8 — CALL-TO-ACTION ANALYSIS (2 sub-metrics)
# ─────────────────────────────────────────────

def _cta_strength_score(description: str) -> float:
    """How strong and varied are the CTAs? 0-100."""
    if not description:
        return 0
    ctas = ['subscribe', 'like', 'comment', 'share', 'bell', 'notification',
            'watch next', 'click here', 'check out', 'follow', 'join', 'download',
            'get', 'learn more', 'visit', 'support']
    found = [w for w in ctas if w in description.lower()]
    score = min(len(found) * 12, 60)
    if len(found) >= 3: score += 20
    if any(w in description.lower() for w in ['subscribe', 'like', 'comment']): score += 20
    return round(_clamp(score))


def _subscription_trigger_score(title: str, description: str) -> float:
    """How strongly does the content motivate subscription? 0-10."""
    score = 4.0
    text = (title + " " + (str(description) or "")[:500]).lower()  # type: ignore
    sub_triggers = ['subscribe', 'hit the bell', 'turn on notifications',
                    'join', 'become a member', 'every week', 'every day',
                    'more videos', 'series', 'part 2', 'stay tuned', 'don\'t miss']
    matches = sum(1 for t in sub_triggers if t in text)
    score += min(matches * 0.7, 3.5)
    if 'subscribe' in text: score += 1.5
    return round(float(_clamp(score, 0, 10)), 1)  # type: ignore


def compute_cta_analysis(title: str, description: str) -> Dict:
    cta_strength = _cta_strength_score(description)
    sub_trigger = _subscription_trigger_score(title, description)

    master = round((cta_strength + sub_trigger * 10) / 2)
    return {
        "master_score": _clamp(master),
        "sub_metrics": {
            "cta_strength_score": cta_strength,      # 0-100
            "subscription_trigger_score": sub_trigger,  # 0-10
        },
    }


# ─────────────────────────────────────────────
#  RECOMMENDATIONS ENGINE
# ─────────────────────────────────────────────

def _generate_recommendations(
    click: Dict, seo: Dict, retention: Dict,
    viral: Dict, technical: Dict, metadata: Dict
) -> List[Dict]:
    recs = []

    def add(priority: str, title: str, suggestion: str):
        recs.append({"priority": priority, "title": title, "suggestion": suggestion})

    # Click potential issues
    if click["master_score"] < 60:
        add("high", "Improve Click Potential",
            "Add power words (Best, Ultimate, How To) and numbers to your title. Keep it 40-60 characters.")
    if click["sub_metrics"]["hook_strength"] < 6:
        add("medium", "Strengthen Your Hook",
            "Open your description with a compelling hook. Start with 'In this video you'll discover...' or a bold statement.")

    # SEO issues
    if seo["sub_metrics"]["tag_quality_score"] < 50:
        add("high", "Improve Tag Strategy",
            "Add 10-15 tags with a mix of: broad 1-word tags, 2-3 word phrases, and 4+ word long-tail keywords.")
    if seo["sub_metrics"]["description_structure_score"] < 50:
        add("high", "Rewrite Description",
            "Write 500+ characters. Include your main keywords 2-3 times, add timestamps (0:00, 1:30...), and end with a CTA.")
    if seo["sub_metrics"]["keyword_density_map"] < 50:
        add("medium", "Boost Keyword Density",
            f"Mention your main keyword '{seo['main_keyword']}' 2-3 times naturally in your description.")

    # Retention issues
    if metadata.get("timestamp_count", 0) < 3:
        add("high", "Add Chapter Timestamps",
            "Add at least 3 timestamps (0:00 Intro, 2:30 Main topic...) to enable YouTube chapters — this alone boosts retention significantly.")
    if retention["master_score"] < 60:
        add("medium", "Optimize for Watch Time",
            "Videos between 8-20 minutes get the best retention. Break long videos into chapters using timestamps.")

    # Viral/CTA
    if viral["sub_metrics"]["shareability_score"] < 50:
        add("medium", "Increase Shareability",
            "Add emotional hooks to your title and description. Content that surprises, teaches, or makes people laugh gets shared more.")
    if metadata.get("hashtag_count", 0) == 0:
        add("medium", "Add Hashtags",
            "Add 3-5 relevant hashtags to your description (e.g., #YouTube #Tutorial). Don't exceed 15 or YouTube ignores them all.")
    elif metadata.get("hashtag_count", 0) > 15:
        add("high", "Too Many Hashtags",
            f"You have {metadata['hashtag_count']} hashtags — YouTube ignores ALL hashtags when you use more than 15. Keep it to 3-8.")

    return recs[:8]  # max 8 recs  # type: ignore


# ─────────────────────────────────────────────
#  LETTER GRADE
# ─────────────────────────────────────────────

def get_letter_grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 85: return "A"
    if score >= 80: return "B+"
    if score >= 75: return "B"
    if score >= 70: return "C+"
    if score >= 65: return "C"
    if score >= 60: return "D"
    return "F"


# ─────────────────────────────────────────────
#  REALITY CHECK & INSIGHTS
# ─────────────────────────────────────────────

def _calculate_vph(view_count: int, upload_date: str, timestamp: float = 0) -> float:
    """Calculate Views Per Hour (VPH)."""
    if not view_count:
        return 0.0
    try:
        from datetime import datetime
        now = datetime.now()
        
        if timestamp and timestamp > 0:
             # Use precise timestamp if available
            upload_dt = datetime.fromtimestamp(timestamp)
        elif upload_date:
            # Fallback to date-only (inherently inaccurate for <24h videos)
            upload_dt = datetime.strptime(upload_date, "%Y-%m-%d")
        else:
            return 0.0

        age_hours = (now - upload_dt).total_seconds() / 3600
        if age_hours < 0.1: return float(view_count) # Just uploaded
        return round(float(view_count / age_hours), 1)  # type: ignore
    except:
        return 0.0

def _apply_reality_check(
    scores: Dict[str, Any], 
    vph: float, 
    view_count: int, 
    like_count: int
) -> Dict[str, Any]:
    """
    Adjust scores based on REAL performance.
    If a video is viral (High VPH), it IS good, regardless of heuristics.
    """
    boosts = []
    
    # High VPH = High Click Potential & Virality
    if vph > 1000:
        scores['click_potential']['master_score'] = max(scores['click_potential']['master_score'], 90)
        scores['virality']['master_score'] = max(scores['virality']['master_score'], 95)
        boosts.append("🚀 Viral Velocity (High VPH) boosted Click & Viral scores")
    elif vph > 100:
        scores['click_potential']['master_score'] = max(scores['click_potential']['master_score'], 80)
        scores['virality']['master_score'] = max(scores['virality']['master_score'], 85)
        boosts.append("📈 Strong Performance (Good VPH) boosted scores")

    # High Engagement = High Retention
    if view_count > 0:
        engagement_rate = like_count / view_count
        if engagement_rate > 0.10: # 10% likes is insane
            scores['retention']['master_score'] = max(scores['retention']['master_score'], 90)
            boosts.append("❤️ Massive Engagement (10%+) boosted Retention score")
        elif engagement_rate > 0.05:
            scores['retention']['master_score'] = max(scores['retention']['master_score'], 80)
            boosts.append("👍 High Engagement (5%+) boosted Retention score")

    return {"boosts": boosts}


# ─────────────────────────────────────────────
#  DATA VALIDATION
#  ─────────────────────────────────────────────

def _validate_video_data(video_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize video data before analysis.
    Returns dict with validated data, errors, and warnings.
    """
    errors = []
    warnings = []
    
    # Required fields
    if not video_data.get("title"):
        errors.append("Missing title")
    
    # Numeric validations
    views = video_data.get("views", 0)
    if views < 0:
        warnings.append(f"Invalid view count: {views}, setting to 0")
        video_data["views"] = 0
    
    likes = video_data.get("like_count", 0)
    comments = video_data.get("comment_count", 0)
    
    # Detect impossible values
    if likes > views and views > 0:
        warnings.append(f"Likes ({likes}) exceed views ({views}) - data may be stale")
    
    # Duration validation
    duration = video_data.get("duration", 0)
    if duration <= 0:
        warnings.append("Invalid or missing duration - some metrics will be inaccurate")
    
    # Timestamp validation
    timestamp = video_data.get("timestamp", 0)
    if timestamp:
        from datetime import datetime
        now_ts = datetime.now().timestamp()
        if timestamp > now_ts:
            warnings.append("Upload timestamp is in the future - using upload_date instead")
            video_data["timestamp"] = 0
        elif timestamp < 946684800:  # Before year 2000
            warnings.append("Upload timestamp seems too old - may be incorrect")
    
    return {
        "data": video_data,
        "errors": errors,
        "warnings": warnings,
        "is_valid": len(errors) == 0
    }


# ─────────────────────────────────────────────
#  MAIN ENTRY POINT
# ─────────────────────────────────────────────

def analyze_video_comprehensive(url: str) -> Dict[str, Any]:
    """
    Full video analysis — returns all 5 master scores + 31 sub-metrics.
    Compatible with the analyzer/page.tsx frontend.
    """
    from services.scraper import get_video_info  # type: ignore
    from datetime import datetime # Added for _calculate_vph
    import re # Added for hashtag/timestamp count

    video_data = get_video_info(url)
    if "error" in video_data:
        return {"error": video_data["error"]}
    
    # Validate data integrity
    validation = _validate_video_data(video_data)
    if not validation["is_valid"]:
        return {"error": f"Data validation failed: {', '.join(validation['errors'])}"}
    
    # Log warnings but continue
    if validation["warnings"]:
        import logging
        logger = logging.getLogger(__name__)
        for warning in validation["warnings"]:
            logger.warning(f"[{url}] {warning}")
    
    # Use validated data
    video_data = validation["data"]

    # ── Extract raw fields ──────────────────────────────────────────────
    title         = video_data.get("title", "")
    desc          = video_data.get("description", "") or ""
    tags          = video_data.get("tags", []) or [] # Ensure list
    views         = int(video_data.get("views", 0) or 0) # Changed from "view_count" to "views"
    likes         = int(video_data.get("like_count", 0) or 0)
    comments      = int(video_data.get("comment_count", 0) or 0)
    duration      = int(video_data.get("duration", 0) or 0)
    upload_date   = video_data.get("upload_date", "") or "" # YYYY-MM-DD
    thumbnail     = video_data.get("thumbnail", "")
    uploader      = video_data.get("uploader", video_data.get("channel", "Unknown"))
    platform      = video_data.get("platform", "YouTube")
    timestamp     = video_data.get("timestamp", 0) # Precise upload time

    # ── Calculate Insights ──────────────────────────────────────────────
    vph = _calculate_vph(views, upload_date, timestamp)
    
    # Engagement metrics (separate for transparency)
    like_rate = 0.0
    comment_rate = 0.0
    total_engagement_rate = 0.0
    
    if views > 0:
        like_rate = round(float(likes / views * 100), 2)  # type: ignore  # VidIQ standard
        comment_rate = round(float(comments / views * 100), 2)  # type: ignore
        total_engagement_rate = round(float((likes + comments) / views * 100), 2)  # type: ignore  # Our comprehensive metric

    # ── Run all 6 section analyses ──────────────────────────────────────
    click     = compute_click_potential(title, desc, tags, views, likes)
    seo       = compute_seo_strength(title, desc, tags)
    retention = compute_retention(title, desc, duration, views, likes, comments)
    viral     = compute_virality(title, desc, tags, views, likes, comments)
    technical = compute_technical(title, desc, tags, duration, upload_date, views, timestamp)
    cta       = compute_cta_analysis(title, desc)
    competitive = compute_competitive(title, desc, tags, duration)
    psychology  = compute_audience_psychology(title, desc, tags, views, likes)

    # 🚨 REALITY CHECK: Adjust scores based on VPH/Engagement
    # The user wants "Authentic", so real stats should override theory.
    scores_map = {
        "click_potential": click,
        "virality": viral,
        "retention": retention
    }
    reality_check_info = _apply_reality_check(scores_map, vph, views, likes)

    # ── Overall score ───────────────────────────────────────────────────
    # Updated weights, competitive and psychology removed from overall score
    overall_score = round(
        click["master_score"]       * 0.25 +
        retention["master_score"]   * 0.30 +
        seo["master_score"]         * 0.15 +
        viral["master_score"]       * 0.20 +
        technical["master_score"]   * 0.10
    )

    hashtag_count = len(re.findall(r'#\w+', desc))
    timestamp_count = len(re.findall(r'\b\d{1,2}:\d{2}\b', desc))

    metadata_summary = {
        "tag_count":          len(tags),
        "description_length": len(desc),
        "hashtag_count":      hashtag_count,
        "timestamp_count":    timestamp_count,
    }

    # ── Compile the full metrics object (matches frontend expectations) ──
    # This section is updated to match the new structure and fields
    full_metrics = {
        # Title / Click
        "title_score":       round(click["sub_metrics"]["title_performance_score"] / 10, 1),
        "title_length":      len(title),
        "ctr_prediction":    click["ctr_label"],
        "ctr_reason":        click["ctr_reason"],
        "title_sentiment":   click["sub_metrics"]["title_sentiment"],
        "hook_strength":     click["sub_metrics"]["hook_strength"],
        "main_keyword":      seo["main_keyword"],
        "keyword_position":  seo.get("keyword_position", ""),

        # SEO
        "seo_overall":       round(seo["master_score"]),
        "keyword_score":     round(seo["sub_metrics"]["keyword_density_map"] / 10, 1),
        "tag_count":         len(tags),
        "description_length": len(desc),
        "description_score": round(seo["sub_metrics"]["description_structure_score"] / 10, 1),
        "tag_score":         round(seo["sub_metrics"]["tag_quality_score"] / 10, 1),

        # Retention
        "pacing_score":             retention["sub_metrics"]["pacing_score"],
        "engagement_density":       retention["sub_metrics"]["engagement_signal_density"],
        "structure_score":          round(retention["sub_metrics"]["content_structure_completeness"] / 10, 1),
        "retention_risks":          retention["retention_risks"],

        # Viral
        "shareability_score":       viral["sub_metrics"]["shareability_score"],
        "trend_score":              round(viral["sub_metrics"]["trend_alignment_score"] / 10, 1),
        "trending_topics":          viral["trending_topics"],
        "emotional_triggers":       viral["emotional_triggers"],

        # Technical
        "upload_timing":            technical["upload_timing_label"],
        "duration_formatted":       retention["duration_formatted"],

        # CTA
        "cta_strength":             cta["sub_metrics"]["cta_strength_score"],
        "subscription_trigger":     cta["sub_metrics"]["subscription_trigger_score"],
    }

    recommendations = _generate_recommendations(
        click, seo, retention, viral, technical, metadata_summary
    )

    return {
        # ── Top-level fields ────────────────────────────────────────────
        "title":            title,
        "thumbnail":        thumbnail,
        "uploader":         uploader,
        "platform":         platform,
        "duration":         duration,
        "views":            views,
        "view_count":       views,
        "like_count":       likes,
        "comment_count":    comments,
        "like_rate":        like_rate,           # VidIQ standard: likes/views
        "comment_rate":     comment_rate,        # comments/views
        "engagement_rate":  total_engagement_rate,  # Comprehensive: (likes+comments)/views
        "upload_date":      upload_date, # Added
        "vph":              vph,         # Added
        "tags":             tags,        # Added, renamed from video_tags

        # ── Score ───────────────────────────────────────────────────────
        "overall_score":    overall_score,
        "grade":            get_letter_grade(overall_score),

        # ── 5 Master scores (displayed in the dashboard cards) ──────────
        "click_potential":   round(click["master_score"] / 10, 1),
        "seo_score":         round(seo["master_score"] / 10, 1),
        "retention_score":   round(retention["master_score"] / 10, 1),
        "viral_score":       round(viral["master_score"] / 10, 1),
        "technical_score":   round(technical["master_score"] / 10, 1),
        "viral_probability": viral["viral_probability"],

        # ── Flat metrics dict (used in all tabs) ────────────────────────
        "metrics": full_metrics,

        # ── Section breakdowns (used in expandable detail panels) ───────
        "sections": {
            "click_potential":       click,
            "seo_strength":          seo,
            "retention":             retention,
            "virality":              viral,
            "technical":             technical,
            "cta":                   cta,
            "competitive":           competitive,
            "audience_psychology":   psychology,
        },

        # ── Metadata summary ────────────────────────────────────────────
        "metadata": metadata_summary,

        # ── Recommendations ─────────────────────────────────────────────
        "recommendations": recommendations,
    }
