"""Shared Korean emotion model loading and inference (CPU)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

_AI_DIR = Path(__file__).resolve().parent
os.environ.setdefault("HF_HOME", str(_AI_DIR / ".hf_cache"))

MODEL_ID = "dlckdfuf141/korean-emotion-kluebert-v2"
MAX_SEQ_LEN = 512
SPECIAL_TOKEN_SLOTS = 2

LABEL_ID_TO_NAME: dict[int, str] = {
    0: "공포",
    1: "놀람",
    2: "분노",
    3: "슬픔",
    4: "중립",
    5: "행복",
    6: "혐오",
}

NUM_LABELS = len(LABEL_ID_TO_NAME)


@dataclass(frozen=True)
class EmotionPrediction:
    emotion: str
    confidence: float


_model: "AutoModelForSequenceClassification | None" = None
_tokenizer: "AutoTokenizer | None" = None
_device: "torch.device | None" = None


def load_emotion_model() -> None:
    """Load tokenizer and model once (idempotent)."""
    global _model, _tokenizer, _device

    if _model is not None and _tokenizer is not None:
        return

    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    _device = torch.device("cpu")
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    _model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)
    _model.to(_device)
    _model.eval()


def _require_loaded() -> tuple["AutoTokenizer", "AutoModelForSequenceClassification", "torch.device"]:
    if _tokenizer is None or _model is None or _device is None:
        raise RuntimeError("Emotion model is not loaded. Call load_emotion_model() first.")
    return _tokenizer, _model, _device


def _segment_token_ids(token_ids: list[int]) -> list[list[int]]:
    max_body = MAX_SEQ_LEN - SPECIAL_TOKEN_SLOTS
    segments: list[list[int]] = []
    for start in range(0, len(token_ids), max_body):
        segments.append(token_ids[start : start + max_body])
    return segments


def _forward_probs(text: str) -> "torch.Tensor":
    import torch

    tokenizer, model, device = _require_loaded()
    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_SEQ_LEN,
    )
    encoded = {k: v.to(device) for k, v in encoded.items()}

    with torch.no_grad():
        logits = model(**encoded).logits
        return torch.softmax(logits, dim=-1).squeeze(0)


def predict_emotion(text: str) -> EmotionPrediction:
    """Predict a single representative emotion for the full diary text."""
    import torch

    load_emotion_model()
    tokenizer, _, _ = _require_loaded()

    token_ids = tokenizer.encode(text, add_special_tokens=False)
    max_body = MAX_SEQ_LEN - SPECIAL_TOKEN_SLOTS

    if len(token_ids) <= max_body:
        probs = _forward_probs(text)
        idx = int(probs.argmax().item())
        return EmotionPrediction(
            emotion=LABEL_ID_TO_NAME[idx],
            confidence=float(probs[idx].item()),
        )

    weighted_sum = torch.zeros(NUM_LABELS)
    total_weight = 0

    for segment_ids in _segment_token_ids(token_ids):
        segment_text = tokenizer.decode(segment_ids, skip_special_tokens=True)
        weight = len(segment_ids)
        probs = _forward_probs(segment_text)
        weighted_sum += probs * weight
        total_weight += weight

    avg_probs = weighted_sum / total_weight
    idx = int(avg_probs.argmax().item())
    return EmotionPrediction(
        emotion=LABEL_ID_TO_NAME[idx],
        confidence=float(avg_probs[idx].item()),
    )