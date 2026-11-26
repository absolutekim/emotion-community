#!/usr/bin/env python3
"""Load Korean emotion model once, run probe texts, print top label per document."""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Cache model weights under ai/.hf_cache (gitignored)
_AI_DIR = Path(__file__).resolve().parent
os.environ.setdefault("HF_HOME", str(_AI_DIR / ".hf_cache"))

MODEL_ID = "dlckdfuf141/korean-emotion-kluebert-v2"

PROBE_TEXTS: dict[str, str] = {
    "A": "몇 주 동안 준비한 시험에 드디어 합격했다. 집에 오는 길에도 자꾸 웃음이 났다.",
    "B": "친구가 내 허락 없이 비밀을 말하고 다녔다. 생각할수록 화가 난다.",
    "C": "내일 발표에서 머리가 하얘질까 봐 계속 연습했다. 누워서도 잠이 오지 않는다.",
    "D": "아침에는 면접 때문에 긴장했는데 끝나고 나니 마음이 놓였다. 저녁에는 편하게 밥을 먹었다.",
    "E": "퇴근하고 장을 봤다. 집에서 저녁을 먹고 빨래를 개었다.",
}


def main() -> int:
    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except ImportError as exc:
        print(f"Missing dependency: {exc}", file=sys.stderr)
        print("Run: pip install -r requirements.txt", file=sys.stderr)
        return 1

    device = torch.device("cpu")
    print(f"Loading model once on {device} ...", flush=True)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)
    model.to(device)
    model.eval()

    print("\n=== Top label per diary (single forward pass each) ===\n")
    print(f"{'ID':<4} {'label':<20} {'score':>10}")
    print("-" * 38)

    for case_id, text in PROBE_TEXTS.items():
        encoded = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        )
        encoded = {k: v.to(device) for k, v in encoded.items()}

        with torch.no_grad():
            logits = model(**encoded).logits
            probs = torch.softmax(logits, dim=-1)
            top_score, top_idx = torch.max(probs, dim=-1)
            idx = top_idx.item()
            score = top_score.item()

        id2label = model.config.id2label
        raw_label = id2label.get(idx, id2label.get(str(idx), str(idx)))

        print(f"{case_id:<4} {raw_label!s:<20} {score:10.6f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())