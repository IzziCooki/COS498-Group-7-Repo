"""
eval/metrics.py
Structural metrics for PC Pal conversation evaluation.
All metrics are computed without any external API calls.
"""

import re


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _agent_turns(conv):
    """Return only the agent turns from a conversation."""
    return [t for t in conv.get("turns", []) if t.get("role") == "agent"]


def _user_turns(conv):
    """Return only the user turns from a conversation."""
    return [t for t in conv.get("turns", []) if t.get("role") == "user"]


def _word_count(text):
    return len(text.split())


def _has_numbered_steps(text):
    """
    Return True if any line in text starts with a numbered step.
    Matches bare '1.' or bold-numbered '**1.**' at the start of a line.
    """
    return bool(re.search(r"(?m)^\*{0,2}\d+\.\*{0,2}", text))


def _count_numbered_steps(text):
    """Count how many lines start with a numbered step pattern (bare or bold)."""
    return len(re.findall(r"(?m)^\*{0,2}\d+\.\*{0,2}", text))


# ---------------------------------------------------------------------------
# Metric 1 — turn_count
# ---------------------------------------------------------------------------

def turn_count(conv):
    """Total number of turns in the conversation. Flag if < 2."""
    total = len(conv.get("turns", []))
    flag = "WARNING: Very short conversation (< 2 turns)" if total < 2 else None
    return {"metric": "turn_count", "value": total, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 2 — question_ratio
# ---------------------------------------------------------------------------

def question_ratio(conv):
    """Percentage of agent turns that contain at least one '?'."""
    agent = _agent_turns(conv)
    if not agent:
        return {"metric": "question_ratio", "value": 0.0, "flag": "WARNING: No agent turns found"}

    with_question = sum(1 for t in agent if "?" in t.get("content", ""))
    ratio = round(with_question / len(agent) * 100, 1)

    flag = None
    if ratio < 20:
        flag = "WARNING: Agent rarely asks questions (< 20%) — may not be engaging"
    elif ratio > 80:
        flag = "WARNING: Agent asks questions too often (> 80%) — may feel like interrogation"

    return {"metric": "question_ratio", "value": ratio, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 3 — response_length
# ---------------------------------------------------------------------------

def response_length(conv):
    """Average words per agent turn. Flag if > 150 (too long) or < 10 (too terse)."""
    agent = _agent_turns(conv)
    if not agent:
        return {"metric": "response_length", "value": 0.0, "flag": "WARNING: No agent turns found"}

    avg = round(sum(_word_count(t.get("content", "")) for t in agent) / len(agent), 1)

    flag = None
    if avg > 150:
        flag = "WARNING: Average response too long (> 150 words) — may overwhelm elderly users"
    elif avg < 10:
        flag = "WARNING: Average response too terse (< 10 words) — may be unhelpfully brief"

    return {"metric": "response_length", "value": avg, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 4 — step_format_check
# ---------------------------------------------------------------------------

_HOW_TO_PATTERNS = re.compile(
    r"\b(how (do|can|to)|step(s)?|instruct|walk me|show me|guide|explain how|set up|turn on|connect|open|find|go to)\b",
    re.IGNORECASE,
)


def step_format_check(conv):
    """
    Percentage of agent turns that contain numbered steps.
    Flag if 0% on conversations that contain how-to user questions.
    """
    agent = _agent_turns(conv)
    if not agent:
        return {"metric": "step_format_check", "value": 0.0, "flag": None}

    with_steps = sum(1 for t in agent if _has_numbered_steps(t.get("content", "")))
    ratio = round(with_steps / len(agent) * 100, 1)

    # Check if any user turn contains a how-to question
    user = _user_turns(conv)
    has_howto = any(_HOW_TO_PATTERNS.search(t.get("content", "")) for t in user)

    flag = None
    if ratio == 0.0 and has_howto:
        flag = "WARNING: Conversation has how-to questions but agent never used numbered steps"

    return {"metric": "step_format_check", "value": ratio, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 5 — bold_usage
# ---------------------------------------------------------------------------

def bold_usage(conv):
    """Percentage of agent turns that use **bold** markdown markers. Flag if 0%."""
    agent = _agent_turns(conv)
    if not agent:
        return {"metric": "bold_usage", "value": 0.0, "flag": "WARNING: No agent turns found"}

    with_bold = sum(1 for t in agent if "**" in t.get("content", ""))
    ratio = round(with_bold / len(agent) * 100, 1)

    flag = "WARNING: Agent never uses bold formatting — responses may be harder to scan" if ratio == 0.0 else None
    return {"metric": "bold_usage", "value": ratio, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 6 — device_accuracy
# ---------------------------------------------------------------------------

_IPHONE_WRONG = re.compile(
    r"\b(click|Start menu|taskbar|Windows key|right-click|double-click|Control Panel|"
    r"File Explorer|desktop shortcut|right click|double click|ctrl\+|windows button)\b",
    re.IGNORECASE,
)

_WINDOWS_WRONG = re.compile(
    r"\b(tap|swipe|App Store|Siri|home button|Face ID|Touch ID|AirDrop|"
    r"pinch|long press|iCloud)\b",
    re.IGNORECASE,
)


def device_accuracy(conv):
    """
    Count wrong-device references in agent turns.
    If user.os_type == 'iPhone', flag Windows-specific terms.
    If user.os_type == 'Windows', flag iPhone-specific terms.
    """
    os_type = conv.get("user", {}).get("os_type", "")
    agent = _agent_turns(conv)

    count = 0
    if os_type.lower() in ("iphone", "ios", "ipad"):
        pattern = _IPHONE_WRONG
    elif os_type.lower() in ("windows", "pc"):
        pattern = _WINDOWS_WRONG
    else:
        # Unknown device — no check possible
        return {"metric": "device_accuracy", "value": 0, "flag": None}

    for t in agent:
        matches = pattern.findall(t.get("content", ""))
        count += len(matches)

    flag = None
    if count > 0:
        flag = f"CRITICAL: {count} wrong-device reference(s) detected for {os_type} user"

    return {"metric": "device_accuracy", "value": count, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 7 — jargon_check
# ---------------------------------------------------------------------------

_JARGON_TERMS = [
    "browser", "URL", "cache", "bandwidth", "firewall",
    "malware", "phishing", "toolbar", "router",
]

_JARGON_RE = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in _JARGON_TERMS) + r")\b",
    re.IGNORECASE,
)


def jargon_check(conv):
    """
    Count occurrences of technical jargon in agent turns.
    These terms should have been simplified for elderly users.
    """
    agent = _agent_turns(conv)
    total = 0
    for t in agent:
        matches = _JARGON_RE.findall(t.get("content", ""))
        total += len(matches)

    flag = None
    if total > 0:
        flag = f"WARNING: {total} jargon term(s) found that should be simplified for elderly users"

    return {"metric": "jargon_check", "value": total, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 8 — safety_response_check
# ---------------------------------------------------------------------------

_SAFETY_KEYWORDS = re.compile(
    r"\b(scam|fraud|hang up|do not|don't give|never give|suspicious|warning|danger|"
    r"emergency|call 911|police|bank|account number|password|credit card|"
    r"social security|identity theft|stay safe|be careful|protect)\b",
    re.IGNORECASE,
)


def safety_response_check(conv):
    """
    If safety_events exist in the conversation dict, verify the agent acknowledged them.
    Flag CRITICAL if a safety event is present but no safety-related response found.
    """
    safety_events = conv.get("safety_events", [])
    agent = _agent_turns(conv)

    if not safety_events:
        return {"metric": "safety_response_check", "value": 0, "flag": None}

    acknowledged = any(
        _SAFETY_KEYWORDS.search(t.get("content", "")) for t in agent
    )

    if not acknowledged:
        return {
            "metric": "safety_response_check",
            "value": len(safety_events),
            "flag": "CRITICAL: Safety event present but agent never gave a safety-related response",
        }

    return {"metric": "safety_response_check", "value": len(safety_events), "flag": None}


# ---------------------------------------------------------------------------
# Metric 9 — encouragement_check
# ---------------------------------------------------------------------------

_ENCOURAGEMENT_RE = re.compile(
    r"\b(great|wonderful|good job|well done|perfect|excellent|you did it|"
    r"nice work|awesome|proud|fantastic|well done|you got it|superb|bravo|"
    r"that's right|that's great|that's wonderful|good for you|well done)\b",
    re.IGNORECASE,
)


def encouragement_check(conv):
    """
    Percentage of agent turns containing positive/encouraging words.
    Flag if < 20%.
    """
    agent = _agent_turns(conv)
    if not agent:
        return {"metric": "encouragement_check", "value": 0.0, "flag": "WARNING: No agent turns found"}

    with_encouragement = sum(
        1 for t in agent if _ENCOURAGEMENT_RE.search(t.get("content", ""))
    )
    ratio = round(with_encouragement / len(agent) * 100, 1)

    flag = None
    if ratio < 20:
        flag = "WARNING: Agent rarely encourages the user (< 20% of turns) — important for elderly users"

    return {"metric": "encouragement_check", "value": ratio, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 10 — steps_per_response
# ---------------------------------------------------------------------------

def steps_per_response(conv):
    """
    Maximum number of numbered steps found in a single agent response.
    Flag WARNING if > 5 (too many at once for elderly users).
    """
    agent = _agent_turns(conv)
    if not agent:
        return {"metric": "steps_per_response", "value": 0, "flag": None}

    max_steps = max(
        (_count_numbered_steps(t.get("content", "")) for t in agent),
        default=0,
    )

    flag = None
    if max_steps > 5:
        flag = f"WARNING: One response has {max_steps} numbered steps — may overwhelm elderly users (keep <= 5)"

    return {"metric": "steps_per_response", "value": max_steps, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 11 — confusion_event_rate
# ---------------------------------------------------------------------------

_CONFUSION_SIGNALS = re.compile(
    r"\b(don'?t understand|i'?m confused|i'?m lost|what do you mean|huh\b|"
    r"i don'?t see (it|that)|say that again|too hard|too confusing|"
    r"i give up|forget it|can'?t figure|can'?t find it|nothing happened|"
    r"where (is|do i find|do i see)|i don'?t get it|what does that mean)\b",
    re.IGNORECASE,
)


def confusion_event_rate(conv):
    """
    Percentage of user turns containing confusion signals.
    Grounded in gerontology research: elderly users express confusion
    through specific phrases that signal the agent needs to adapt.
    Flag WARNING if rate > 30%, CRITICAL if 3+ consecutive confusion signals.
    """
    user = _user_turns(conv)
    if not user:
        return {"metric": "confusion_event_rate", "value": 0.0, "flag": None}

    confused_count = sum(1 for t in user if _CONFUSION_SIGNALS.search(t.get("content", "")))
    rate = round(confused_count / len(user) * 100, 1)

    # Check for consecutive confusions (user-side streaks)
    max_consecutive = 0
    current_consecutive = 0
    for t in conv.get("turns", []):
        if t.get("role") == "user" and _CONFUSION_SIGNALS.search(t.get("content", "")):
            current_consecutive += 1
            max_consecutive = max(max_consecutive, current_consecutive)
        elif t.get("role") == "user":
            current_consecutive = 0

    flag = None
    if max_consecutive >= 3:
        flag = (
            f"CRITICAL: User expressed confusion {max_consecutive} times in a row "
            f"— escalation protocol may not be working"
        )
    elif rate > 30:
        flag = f"WARNING: High confusion rate ({rate}%) — user struggling throughout conversation"

    return {"metric": "confusion_event_rate", "value": rate, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 12 — step_atomic_check
# ---------------------------------------------------------------------------

_COMPOUND_STEP = re.compile(
    r"(?m)^\*{0,2}\d+\.\*{0,2}\s+.+(?:,\s*(?:then|and then|next|after that)|;\s*(?:then|and))\s+",
    re.IGNORECASE,
)


def step_atomic_check(conv):
    """
    Check whether numbered steps contain multiple actions (e.g. "click X, then Y").
    Based on Salthouse 1996: elderly users process info ~40% slower,
    so each step must contain exactly one physical action.
    """
    agent = _agent_turns(conv)
    compound_count = 0
    for t in agent:
        matches = _COMPOUND_STEP.findall(t.get("content", ""))
        compound_count += len(matches)

    flag = None
    if compound_count > 0:
        flag = (
            f"WARNING: {compound_count} step(s) contain multiple actions "
            f"— should be split into atomic steps (Salthouse 1996)"
        )

    return {"metric": "step_atomic_check", "value": compound_count, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 13 — working_memory_overload
# ---------------------------------------------------------------------------

def working_memory_overload(conv):
    """
    Count agent responses with 4+ numbered steps before any user confirmation.
    Based on Hasher & Zacks 1988: elderly working memory holds 3-4 items max.
    Giving more than 3 steps at once risks the user forgetting earlier steps.
    """
    agent = _agent_turns(conv)
    violations = 0
    for t in agent:
        step_count = _count_numbered_steps(t.get("content", ""))
        if step_count > 3:
            violations += 1

    flag = None
    if violations > 0:
        flag = (
            f"WARNING: {violations} response(s) exceeded 3-step working memory cap "
            f"(Hasher & Zacks 1988) — may overwhelm elderly users"
        )

    return {"metric": "working_memory_overload", "value": violations, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 14 — fear_reassurance_check
# ---------------------------------------------------------------------------

_REASSURANCE = re.compile(
    r"\b(you can'?t break|you won'?t break|it'?s safe to|nothing will break|"
    r"don'?t worry|safe to try|can'?t do any damage|it'?s okay to try|"
    r"you can always undo|nothing bad will happen|it'?s reversible)\b",
    re.IGNORECASE,
)

_RISKY_ACTIONS = re.compile(
    r"\b(delete|remove|uninstall|reset|format|erase|clear all|change.*setting|"
    r"update|restart|shut down|turn off|wipe|restore)\b",
    re.IGNORECASE,
)


def fear_reassurance_check(conv):
    """
    Check if agent responses describing risky-sounding actions include reassurance.
    Based on Marquie et al. 2002: the #1 barrier for elderly users is fear of
    'breaking' their computer. Risky-sounding steps (delete, reset, restart)
    must include reassurance language.
    """
    agent = _agent_turns(conv)
    risky_without_reassurance = 0

    for t in agent:
        content = t.get("content", "")
        if _RISKY_ACTIONS.search(content) and not _REASSURANCE.search(content):
            risky_without_reassurance += 1

    flag = None
    if risky_without_reassurance > 0:
        flag = (
            f"WARNING: {risky_without_reassurance} response(s) describe risky-sounding actions "
            f"without reassurance — elderly users fear 'breaking' their computer (Marquie 2002)"
        )

    return {"metric": "fear_reassurance_check", "value": risky_without_reassurance, "flag": flag}


# ---------------------------------------------------------------------------
# Metric 15 — device_verb_check
# ---------------------------------------------------------------------------

_DEVICE_VERB_VIOLATIONS = {
    "iphone": re.compile(r"\bclick\b", re.IGNORECASE),
    "ios": re.compile(r"\bclick\b", re.IGNORECASE),
    "ipad": re.compile(r"\bclick\b", re.IGNORECASE),
    "windows": re.compile(r"\b(?:tap|swipe)\b", re.IGNORECASE),
    "pc": re.compile(r"\b(?:tap|swipe)\b", re.IGNORECASE),
}


def device_verb_check(conv):
    """
    Check for wrong action verbs for the user's device type.
    iPhone/iPad users should never see 'click'; Windows users should never see 'tap'/'swipe'.
    Complements device_accuracy (metric 6) which catches UI element names.
    """
    os_type = conv.get("user", {}).get("os_type", "").lower()
    pattern = _DEVICE_VERB_VIOLATIONS.get(os_type)

    if not pattern:
        return {"metric": "device_verb_check", "value": 0, "flag": None}

    agent = _agent_turns(conv)
    total = sum(len(pattern.findall(t.get("content", ""))) for t in agent)

    flag = None
    if total > 0:
        flag = f"WARNING: {total} wrong action verb(s) for {os_type} user — use correct device verbs"

    return {"metric": "device_verb_check", "value": total, "flag": flag}


# ---------------------------------------------------------------------------
# compute_all
# ---------------------------------------------------------------------------

_ALL_METRICS = [
    turn_count,
    question_ratio,
    response_length,
    step_format_check,
    bold_usage,
    device_accuracy,
    jargon_check,
    safety_response_check,
    encouragement_check,
    steps_per_response,
    confusion_event_rate,
    step_atomic_check,
    working_memory_overload,
    fear_reassurance_check,
    device_verb_check,
]


def compute_all(conv):
    """Run all 15 structural metrics and return a list of result dicts."""
    return [metric(conv) for metric in _ALL_METRICS]
