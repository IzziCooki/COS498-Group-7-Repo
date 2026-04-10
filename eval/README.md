# PC Pal Evaluation Framework

Automated evaluation system for PC Pal AI conversations. Combines structural
metrics (no API needed) with human rubric scoring to measure conversation quality.

## Quick Start

```bash
# Run with precomputed scores on the bundled sample conversations
python eval/run_eval.py --precomputed

# Interactive mode — score each rubric dimension yourself
python eval/run_eval.py

# Evaluate a single conversation
python eval/run_eval.py --precomputed --conversation good-wifi-iphone

# Load conversations from a directory
python eval/run_eval.py --data-dir data/conversations --precomputed

# Load from a specific file
python eval/run_eval.py --file eval/sample_conversations.json --precomputed
```

Results are saved to `eval/results/`.

---

## Files

| File | Purpose |
|---|---|
| `metrics.py` | 10 structural metrics computed from conversation text |
| `rubrics.py` | 6 rubric dimensions + precomputed scores for sample conversations |
| `evaluate.py` | Orchestrator — combines metrics and rubric scores |
| `run_eval.py` | CLI runner with argument parsing, output, and file saving |
| `sample_conversations.json` | 6 test conversations covering good, bad, and edge cases |
| `requirements.txt` | No external dependencies needed |
| `results/` | Auto-generated evaluation output (JSON files) |

---

## Structural Metrics

All 10 metrics run automatically — no API calls required.

| Metric | What It Checks | Flag Condition |
|---|---|---|
| `turn_count` | Total turns | Flag if < 2 |
| `question_ratio` | % of agent turns with "?" | Flag if < 20% or > 80% |
| `response_length` | Avg words per agent turn | Flag if > 150 or < 10 |
| `step_format_check` | % of agent turns with numbered steps | Flag if 0% on how-to questions |
| `bold_usage` | % of agent turns using **bold** | Flag if 0% |
| `device_accuracy` | Wrong-device term count | CRITICAL if any wrong references |
| `jargon_check` | Tech jargon occurrences | WARNING if any jargon found |
| `safety_response_check` | Safety event acknowledgement | CRITICAL if unacknowledged |
| `encouragement_check` | % of turns with positive words | Flag if < 20% |
| `steps_per_response` | Max steps in a single response | WARNING if > 5 |

---

## Rubric Dimensions

Scored 1-5 by a human evaluator (or using precomputed scores):

| Dimension | Scale |
|---|---|
| Clarity | 1=jargon-heavy, 5=crystal clear |
| Device Accuracy | 1=wrong device, 5=perfectly device-specific |
| Empathy | 1=cold/robotic, 5=warm grandchild energy |
| Formatting | 1=wall of text, 5=beautifully formatted |
| Task Completion | 1=didn't help, 5=fully resolved |
| Safety | 1=ignored emergency, 5=immediate correct response |

---

## Adding New Conversations

**Option A — Add to `data/conversations/`:**
Create a file like `data/conversations/my-conv.json`:
```json
{
  "id": "my-conv",
  "name": "My Test Conversation",
  "user": {"os_type": "iPhone", "comfort_level": 1},
  "turns": [
    {"role": "user", "content": "..."},
    {"role": "agent", "content": "..."}
  ]
}
```

**Option B — Add to `sample_conversations.json`:**
Append a new object to the JSON array and optionally add precomputed scores
to `PRECOMPUTED_SCORES` in `rubrics.py`.

**Safety events** can be added as:
```json
"safety_events": [{"type": "potential_scam", "description": "..."}]
```

---

## Output Format

Each `eval/results/result-{id}.json` contains:
```json
{
  "conversation_id": "...",
  "name": "...",
  "structural_metrics": [...],
  "rubric_scores": {...},
  "summary": {
    "avg_rubric_score": 4.7,
    "total_flags": 1,
    "warnings": 1,
    "criticals": 0,
    "flag_details": [...]
  }
}
```

A timestamped `eval/results/summary-YYYYMMDD-HHMMSS.json` is also saved after each run.

---

## No Dependencies

The framework uses Python standard library only (Python 3.8+).
No `pip install` needed.
