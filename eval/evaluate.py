"""
eval/evaluate.py
Orchestrator for the PC Pal evaluation framework.
Loads conversations, runs structural metrics, combines with rubric scores,
and produces a structured result per conversation.
"""

import json
import os
from pathlib import Path

from metrics import compute_all


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_conversations(json_path=None):
    """
    Load conversations from a specific JSON file or from the data/conversations/ directory.

    Parameters
    ----------
    json_path : str | Path | None
        Path to a specific JSON file containing a list of conversations or a single
        conversation dict.  If None, all *.json files under data/conversations/ are loaded.

    Returns
    -------
    dict[str, dict]
        Mapping of conversation_id -> conversation dict.
    """
    conversations = {}

    if json_path is not None:
        json_path = Path(json_path)
        if not json_path.exists():
            raise FileNotFoundError(f"Conversation file not found: {json_path}")

        with json_path.open(encoding="utf-8") as fh:
            data = json.load(fh)

        # Accept either a list of conversations or a single dict keyed by id
        if isinstance(data, list):
            for conv in data:
                cid = conv.get("id") or conv.get("conversation_id") or f"conv-{len(conversations)}"
                conversations[cid] = conv
        elif isinstance(data, dict):
            # Could be {id: conv, ...} or a single conversation
            if "turns" in data:
                cid = data.get("id") or "conv-0"
                conversations[cid] = data
            else:
                for cid, conv in data.items():
                    conversations[cid] = conv
        return conversations

    # Scan data/conversations/
    repo_root = Path(__file__).parent.parent
    data_dir = repo_root / "data" / "conversations"
    if not data_dir.exists():
        raise FileNotFoundError(f"data/conversations directory not found: {data_dir}")

    json_files = sorted(data_dir.glob("*.json"))
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in {data_dir}")

    for jf in json_files:
        with jf.open(encoding="utf-8") as fh:
            conv = json.load(fh)
        cid = conv.get("id") or jf.stem
        conversations[cid] = conv

    return conversations


# ---------------------------------------------------------------------------
# Structural metrics
# ---------------------------------------------------------------------------

def run_structural(conversation):
    """Run all structural metrics on a conversation and return the list of results."""
    return compute_all(conversation)


# ---------------------------------------------------------------------------
# Per-conversation evaluation
# ---------------------------------------------------------------------------

def evaluate_conversation(conversation_id, conversation, rubric_scores):
    """
    Combine structural metrics with rubric scores into a single evaluation result.

    If the conversation has an end-of-chat ``feedback`` block (written by the
    server's conversation exporter) and the rubric_scores don't already include
    "User Satisfaction", the user's star rating and comment are folded in so
    that real user feedback flows into the eval automatically.

    Parameters
    ----------
    conversation_id : str
    conversation : dict
    rubric_scores : dict[str, dict]
        e.g. {"Clarity": {"score": 5, "notes": "..."}, ...}

    Returns
    -------
    dict
    """
    # Make a shallow copy so we don't mutate a caller's dict (e.g. PRECOMPUTED_SCORES)
    rubric_scores = dict(rubric_scores) if rubric_scores else {}

    feedback = conversation.get("feedback")
    if (
        feedback
        and feedback.get("rating") is not None
        and "User Satisfaction" not in rubric_scores
    ):
        rubric_scores["User Satisfaction"] = {
            "score": feedback["rating"],
            "notes": (feedback.get("comment") or "(no comment)"),
        }

    structural = run_structural(conversation)
    summary = compute_summary(structural, rubric_scores)

    return {
        "conversation_id": conversation_id,
        "name": conversation.get("name", conversation_id),
        "structural_metrics": structural,
        "rubric_scores": rubric_scores,
        "summary": summary,
    }


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def compute_summary(structural_metrics, rubric_scores):
    """
    Compute a high-level summary from structural metric flags and rubric scores.

    Parameters
    ----------
    structural_metrics : list[dict]
        Output of compute_all().
    rubric_scores : dict[str, dict | int | float]
        Either {"Clarity": {"score": 5}, ...} or {"Clarity": 5, ...}

    Returns
    -------
    dict
    """
    flags = [m["flag"] for m in structural_metrics if m.get("flag")]
    warnings = [f for f in flags if "WARNING" in f]
    criticals = [f for f in flags if "CRITICAL" in f]

    # Support both {"score": n, "notes": "..."} and plain numeric formats
    rubric_values = []
    for v in rubric_scores.values():
        if isinstance(v, dict):
            rubric_values.append(v["score"])
        elif isinstance(v, (int, float)):
            rubric_values.append(v)

    avg_rubric = round(sum(rubric_values) / len(rubric_values), 1) if rubric_values else 0

    return {
        "avg_rubric_score": avg_rubric,
        "total_flags": len(flags),
        "warnings": len(warnings),
        "criticals": len(criticals),
        "flag_details": flags,
    }
