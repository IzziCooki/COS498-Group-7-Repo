"""
eval/run_eval.py
CLI runner for the PC Pal evaluation framework.

Usage
-----
python eval/run_eval.py                                  # Interactive mode
python eval/run_eval.py --precomputed                    # Use precomputed rubric scores
python eval/run_eval.py --conversation conv-xxx          # Single conversation
python eval/run_eval.py --data-dir data/conversations    # Scan a directory
python eval/run_eval.py --file eval/sample_conversations.json  # Specific file
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Ensure the eval/ directory is on the path so we can import siblings
_EVAL_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(_EVAL_DIR))

from evaluate import load_conversations, evaluate_conversation  # noqa: E402
from rubrics import RUBRICS, PRECOMPUTED_SCORES  # noqa: E402


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def _separator(char="-", width=70):
    print(char * width)


def _print_table(results):
    """Print a summary table of all evaluation results."""
    _separator("=")
    print(f"{'ID':<30} {'Avg Rubric':>10} {'Flags':>6} {'Warn':>5} {'CRIT':>5}")
    _separator()
    for r in results:
        s = r["summary"]
        print(
            f"{r['conversation_id']:<30} "
            f"{s['avg_rubric_score']:>10} "
            f"{s['total_flags']:>6} "
            f"{s['warnings']:>5} "
            f"{s['criticals']:>5}"
        )
    _separator("=")


def _print_result_detail(result):
    """Print detailed output for a single conversation."""
    _separator("=")
    print(f"Conversation: {result['name']} ({result['conversation_id']})")
    _separator()

    print("\nStructural Metrics:")
    for m in result["structural_metrics"]:
        flag_str = f"  [{m['flag']}]" if m.get("flag") else ""
        print(f"  {m['metric']:<25} {str(m['value']):<10}{flag_str}")

    print("\nRubric Scores:")
    rubric_scores = result["rubric_scores"]
    for rubric in RUBRICS:
        name = rubric["name"]
        entry = rubric_scores.get(name)
        if entry is None:
            score_str = "N/A"
            notes_str = ""
        elif isinstance(entry, dict):
            score_str = str(entry.get("score", "?"))
            notes_str = f"  — {entry.get('notes', '')}"
        else:
            score_str = str(entry)
            notes_str = ""
        print(f"  {name:<20} {score_str}{notes_str}")

    s = result["summary"]
    print(f"\nSummary:")
    print(f"  Avg Rubric Score : {s['avg_rubric_score']}/5")
    print(f"  Total Flags      : {s['total_flags']}  (Warnings: {s['warnings']}, Criticals: {s['criticals']})")
    if s["flag_details"]:
        print("  Flag Details:")
        for fd in s["flag_details"]:
            print(f"    - {fd}")
    _separator("=")


# ---------------------------------------------------------------------------
# Interactive rubric scoring
# ---------------------------------------------------------------------------

def _prompt_rubric_scores(conversation_id, conversation):
    """Interactively ask the user to score each rubric dimension."""
    print(f"\nScoring rubrics for: {conversation_id}")
    print("Rate each dimension 1-5 (or press Enter to skip / mark as N/A).\n")

    scores = {}
    for rubric in RUBRICS:
        name = rubric["name"]
        desc = rubric["description"]
        scale = rubric["scale"]
        print(f"  {name}")
        print(f"    {desc}")
        print(f"    Scale: {scale}")
        while True:
            raw = input(f"    Score (1-5): ").strip()
            if raw == "":
                scores[name] = {"score": 0, "notes": "Not scored"}
                break
            try:
                val = int(raw)
                if 1 <= val <= 5:
                    notes = input(f"    Notes (optional): ").strip()
                    scores[name] = {"score": val, "notes": notes}
                    break
                else:
                    print("    Please enter a number between 1 and 5.")
            except ValueError:
                print("    Please enter a valid integer.")
    return scores


# ---------------------------------------------------------------------------
# Save helpers
# ---------------------------------------------------------------------------

def _save_result(result, results_dir):
    results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)
    out_file = results_dir / f"result-{result['conversation_id']}.json"
    with out_file.open("w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)
    return out_file


def _save_summary(results, results_dir):
    results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_file = results_dir / f"summary-{timestamp}.json"
    summary_data = {
        "timestamp": timestamp,
        "conversations_evaluated": len(results),
        "results": [
            {
                "conversation_id": r["conversation_id"],
                "name": r["name"],
                "summary": r["summary"],
            }
            for r in results
        ],
    }
    with out_file.open("w", encoding="utf-8") as fh:
        json.dump(summary_data, fh, indent=2)
    return out_file


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="PC Pal Evaluation Framework CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--precomputed",
        action="store_true",
        help="Use precomputed rubric scores from rubrics.py instead of prompting.",
    )
    parser.add_argument(
        "--conversation",
        metavar="ID",
        help="Evaluate only the conversation with this ID.",
    )
    parser.add_argument(
        "--data-dir",
        metavar="DIR",
        help="Directory to scan for *.json conversation files.",
    )
    parser.add_argument(
        "--file",
        metavar="FILE",
        help="Specific JSON file containing conversations.",
    )
    parser.add_argument(
        "--results-dir",
        metavar="DIR",
        default=str(_EVAL_DIR / "results"),
        help="Directory to write result files (default: eval/results/).",
    )
    args = parser.parse_args()

    # ---- Determine source of conversations ----
    repo_root = _EVAL_DIR.parent
    default_sample = _EVAL_DIR / "sample_conversations.json"

    if args.file:
        json_path = Path(args.file)
    elif args.data_dir:
        json_path = None
        # Override load_conversations to use this data_dir
    elif default_sample.exists():
        json_path = default_sample
    else:
        json_path = None

    try:
        if args.data_dir:
            # Temporarily patch data dir by loading manually
            data_path = Path(args.data_dir)
            conversations = {}
            for jf in sorted(data_path.glob("*.json")):
                with jf.open(encoding="utf-8") as fh:
                    conv = json.load(fh)
                cid = conv.get("id") or jf.stem
                conversations[cid] = conv
        else:
            conversations = load_conversations(json_path)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

    if not conversations:
        print("No conversations loaded. Nothing to evaluate.", file=sys.stderr)
        sys.exit(1)

    # ---- Filter to single conversation if requested ----
    if args.conversation:
        if args.conversation not in conversations:
            print(
                f"ERROR: Conversation '{args.conversation}' not found. "
                f"Available: {list(conversations.keys())}",
                file=sys.stderr,
            )
            sys.exit(1)
        conversations = {args.conversation: conversations[args.conversation]}

    print(f"\nPC Pal Evaluation Framework")
    print(f"Loaded {len(conversations)} conversation(s).")

    results = []

    for conv_id, conv in conversations.items():
        print(f"\nEvaluating: {conv_id}")

        if args.precomputed:
            if conv_id not in PRECOMPUTED_SCORES:
                print(f"  WARNING: No precomputed scores for '{conv_id}' — skipping rubric scoring.")
                rubric_scores = {}
            else:
                rubric_scores = PRECOMPUTED_SCORES[conv_id]
                print(f"  Using precomputed rubric scores.")
        else:
            rubric_scores = _prompt_rubric_scores(conv_id, conv)

        result = evaluate_conversation(conv_id, conv, rubric_scores)
        _print_result_detail(result)

        out_file = _save_result(result, args.results_dir)
        print(f"  Saved: {out_file}")

        results.append(result)

    # ---- Summary table ----
    if len(results) > 1:
        print("\nOverall Summary Table")
        _print_table(results)

    summary_file = _save_summary(results, args.results_dir)
    print(f"\nSummary saved: {summary_file}")
    print("Done.")


if __name__ == "__main__":
    main()
