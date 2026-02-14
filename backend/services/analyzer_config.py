# ─────────────────────────────────────────────
#  VIDEO ANALYZER SCORING CONFIGURATION
# ─────────────────────────────────────────────
# This file contains all the "magic numbers", weights, and thresholds
# used in the video analysis algorithms. Tweaking these values will
# directly affect the scoring logic.

# ─── CLICK POTENTIAL ─────────────────────────
CLICK_POTENTIAL = {
    "BASELINE_SCORE": 50,
    "IDEAL_LENGTH_MIN": 40,
    "IDEAL_LENGTH_MAX": 60,
    "LENGTH_BONUS": 20,
    "OK_LENGTH_BONUS": 10,
    "SHORT_PENALTY": 15,    # < 30 chars
    "LONG_PENALTY": 5,      # > 70 chars
    "POWER_WORDS": [
        'best', 'top', 'ultimate', 'complete', 'guide', 'how to', 'tutorial',
        'review', 'vs', 'new', 'secret', 'proven', 'easy', 'fast', 'simple',
        'free', 'now', 'today', 'instantly', 'tips', 'tricks', 'hack', 'winning',
    ],
    "POWER_WORD_BONUS": 7,  # per match
    "POWER_WORD_MAX": 21,
    "NUMBER_BONUS": 9,
}

CTR_PREDICTOR = {
    "BASE_SCORE": 5.0,
    "LENGTH_BONUS": 1.0,  # >= 30 chars
    "POWER_WORD_BONUS": 1.5,
    "NUMBER_BONUS": 0.8,
    "EMOTIONAL_PUNCTUATION_BONUS": 0.7,
    "ENGAGEMENT_RATE_HIGH": 0.05, # > 5%
    "ENGAGEMENT_RATE_MED": 0.02,  # > 2%
    "ENGAGEMENT_BONUS_HIGH": 1.0,
    "ENGAGEMENT_BONUS_MED": 0.5,
}

THUMBNAIL_ALIGNMENT = {
    "BASELINE": 40,
    "MATCH_MULTIPLIER": 60,
}

HOOK_STRENGTH = {
    "BASE_SCORE": 5.0,
    "SIGNALS": [
        'watch', 'discover', 'find out', 'learn', 'today', 'in this video',
        'join', 'we will', "you'll", 'how to', 'secret', 'never seen'
    ],
    "SIGNAL_BONUS": 0.5,
    "SIGNAL_MAX": 2.5,
    "PUNCTUATION_BONUS": 0.8,
    "DESC_LENGTH_BONUS": 0.7, # > 200 chars
}

# ─── SEO STRENGTH ────────────────────────────
KEYWORD_DENSITY = {
    "MIN_DESC_LEN": 50,
    "BASELINE_LOW": 20,
    "BASELINE_EMPTY": 30,
    "DENSITY_MULTIPLIER": 8,
    "STOP_WORDS": {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
        'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'
    }
}

DESCRIPTION_STRUCTURE = {
    "LEN_600_BONUS": 30,
    "LEN_350_BONUS": 20,
    "LEN_150_BONUS": 10,
    "CTA_WORDS": ['subscribe', 'like', 'comment', 'share', 'follow', 'check out', 'click', 'visit'],
    "CTA_MULTIPLIER": 8,
    "CTA_MAX": 30,
    "LINK_BONUS": 10,
    "TIMESTAMPS_3_BONUS": 20,
    "TIMESTAMPS_1_BONUS": 10,
    "HASHTAG_RANGE_BONUS": 10, # 3-15 hashtags
}

TAG_QUALITY = {
    "BASELINE": 30,
    "COUNT_MULTIPLIER": 4,
    "COUNT_MAX": 50,
    "DIVERSITY_BONUS": 15,
    "TOO_LONG_PENALTY": 5, # > 30 chars
}

KEYWORD_DIFFICULTY = {
    "HIGH_COMP_WORDS": ['how to', 'tutorial', 'review', 'best', 'top 10', 'vs', 'guide'],
    "LOW_COMP_WORDS": ['my experience', 'vlog', 'story', 'reaction', 'behind the scenes'],
    "BASE": 55,
    "HIGH_PENALTY_ADD": 8, # Wait, logic in code was += high * 8, which increases base (difficulty).
                           # Higher return value = Higher Difficulty? 
                           # Code: val >= 70 is High Difficulty. So yes, addition increases difficulty.
    "LOW_BONUS_SUB": 10,
}

# ─── RETENTION ──────────────────────────────
PACING = {
    "MIN_8_20": 90,
    "MIN_5_8_OR_20_30": 75,
    "MIN_3_5_OR_30_45": 60,
    "MIN_1_3": 50,
    "MIN_GT_45": 45,
    "DEFAULT": 35,
}

CONTENT_STRUCTURE = {
    "BASELINE": 10,
    "LEN_500_BONUS": 25,
    "LEN_200_BONUS": 15,
    "TS_5_BONUS": 30,
    "TS_3_BONUS": 20,
    "TS_1_BONUS": 10,
    "STRUCT_WORDS": ['intro', 'introduction', 'conclusion', 'summary'],
    "STRUCT_BONUS": 15,
    "LINK_BONUS": 15,
    "CTA_BONUS": 15,
}

ENGAGEMENT_DENSITY = {
    "BASE": 5.0,
    "CTA_MULTIPLIER": 0.4,
    "CTA_MAX": 2,
    "ER_05_BONUS": 2,
    "ER_03_BONUS": 1.5,
    "ER_01_BONUS": 0.5,
    "COMMENT_RATE_BONUS": 1, # >= 0.005
}

DROP_OFF_RISK = {
    "BASE": 7.0,
    "MIN_40_PENALTY": 2.5,
    "MIN_25_PENALTY": 1.5,
    "MIN_15_PENALTY": 0.5,
    "TS_5_BONUS": 1.5,
    "TS_3_BONUS": 1,
}

# ─── VIRALITY ───────────────────────────────
EMOTIONAL_INTENSITY = {
    "BASE": 3,
    "MULTIPLIER": 0.7,
    "WORDS": [
        'amazing', 'incredible', 'shocking', 'unbelievable', 'mind-blowing', 'epic',
        'hate', 'love', 'fear', 'angry', 'excited', 'hilarious', 'sad', 'beautiful',
        'terrifying', 'surprising', 'emotional', 'powerful', 'inspiring',
    ]
}

SHAREABILITY = {
    "BASE": 40,
    "HOOK_WORDS": ['share', 'must see', 'watch this', 'everyone', 'viral', 'funny', 'amazing'],
    "HOOK_BONUS": 5,
    "HOOK_MAX_COUNT": 1, # Logic was sum(min(5,1)...) * 5 which implies count logic but code was `sum(min(5, 1) for w in share_hooks if w in text) * 5`. 
                         # `min(5,1)` is always 1. So it's count * 5.
    "ER_08_BONUS": 25,
    "ER_04_BONUS": 15,
    "ER_02_BONUS": 8,
    "VIEW_100K_BONUS": 15,
    "VIEW_10K_BONUS": 8,
}

TREND_ALIGNMENT = {
    "BASE": 30,
    "MULTIPLIER": 10,
    "SIGNALS": [
        '2025', '2026', 'new', 'latest', 'trending', 'viral', 'react', 'reaction',
        'ai', 'chatgpt', 'shorts', 'fyp', 'challenge', '#shorts',
    ]
}

CONTROVERSY = {
    "BASE": 2,
    "MULTIPLIER": 0.8,
    "WORDS": ['vs', 'debate', 'controversial', 'truth', 'expose', 'wrong',
              'disagree', 'myth', 'lie', 'real', 'fake', 'unpopular opinion']
}

# ─── TECHNICAL ──────────────────────────────
LENGTH_OPT = {
    "MIN_8_20": 95, # Different from Pacing!
    "MIN_6_8_OR_20_30": 80,
    "MIN_4_6_OR_30_40": 65,
    "MIN_2_4": 50,
    "MIN_GT_40": 40,
    "DEFAULT": 30,
}

METADATA_COMPLETENESS = {
    "TITLE_20_BONUS": 20,
    "DESC_200_BONUS": 25,
    "DESC_50_BONUS": 10,
    "TAGS_5_BONUS": 20,
    "TAGS_1_BONUS": 10,
    "HASHTAG_BONUS": 15,
    "TIMESTAMP_BONUS": 20,
}

UPLOAD_TIMING = {
    "BASE": 65,
    "THU_FRI_BONUS": 15,
    "TUE_WED_BONUS": 10,
    "WEEKEND_BONUS": 5,
    "HOUR_14_17_BONUS": 15,
    "HOUR_10_14_OR_17_20_BONUS": 8,
}

# ─── COMPETITIVE ────────────────────────────
TITLE_UNIQUENESS = {
    "BASE": 80,
    "GENERIC_WORDS": ['video', 'watch', 'click here', 'please', 'new video', 'upload', 'official'],
    "GENERIC_PENALTY": 12,
    "LONG_TITLE_BONUS": 10, # >= 6 words
}

# ─── OVERALL WEIGHTS ────────────────────────
OVERALL_WEIGHTS = {
    "CLICK": 0.25,
    "RETENTION": 0.30,
    "SEO": 0.15,
    "VIRAL": 0.20,
    "TECHNICAL": 0.10,
}
