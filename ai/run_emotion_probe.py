#!/usr/bin/env python3
"""Load Korean emotion model once, run probe texts, print top label per document."""

from __future__ import annotations

import sys

from emotion_engine import LABEL_ID_TO_NAME, load_emotion_model, predict_emotion

PROBE_TEXTS: dict[str, str] = {
    "A": "몇 주 동안 준비한 시험에 드디어 합격했다. 집에 오는 길에도 자꾸 웃음이 났다.",
    "B": "친구가 내 허락 없이 비밀을 말하고 다녔다. 생각할수록 화가 난다.",
    "C": "내일 발표에서 머리가 하얀질까 봐 계속 연습했다. 누워서도 잠이 오지 않는다.",
    "D": "아침에는 면접 때문에 긴장했는데 끝나고 나니 마음이 놓였다. 저녁에는 편하게 밥을 먹었다.",
    "E": "퇴근하고 장을 봤다. 집에서 저녁을 먹고 빨래를 개었다.",
}


def main() -> int:
    try:
        load_emotion_model()
    except ImportError as exc:
        print(f"Missing dependency: {exc}", file=sys.stderr)
        print("Run: pip install -r requirements.txt", file=sys.stderr)
        return 1

    print("Model loaded (CPU).\n")
    print("=== Top label per diary ===\n")
    print(f"{'ID':<4} {'emotion':<8} {'score':>10}")
    print("-" * 28)

    for case_id, text in PROBE_TEXTS.items():
        result = predict_emotion(text)
        print(f"{case_id:<4} {result.emotion:<8} {result.confidence:10.6f}")

    print(f"\nLabel map: {LABEL_ID_TO_NAME}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())