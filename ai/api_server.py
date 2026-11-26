"""FastAPI inference server — loads model once at startup."""

from __future__ import annotations

import argparse
from contextlib import asynccontextmanager
from typing import Annotated

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

from emotion_engine import load_emotion_model, predict_emotion


class AnalyzeRequest(BaseModel):
    content: str = Field(...)

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, value: str) -> str:
        if value.strip() == "":
            raise ValueError("content must not be blank")
        return value


class AnalyzeResponse(BaseModel):
    emotion: str


@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_emotion_model()
    yield


app = FastAPI(title="Emotion Inference API", lifespan=lifespan)


@app.post("/api/emotions/analyze", response_model=AnalyzeResponse)
def analyze_emotion(body: Annotated[AnalyzeRequest, ...]) -> AnalyzeResponse:
    trimmed = body.content.strip()
    if trimmed == "":
        raise HTTPException(status_code=400, detail="content must not be blank")

    prediction = predict_emotion(trimmed)
    return AnalyzeResponse(emotion=prediction.emotion)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run local emotion inference API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()