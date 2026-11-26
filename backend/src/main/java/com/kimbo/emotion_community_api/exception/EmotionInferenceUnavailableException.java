package com.kimbo.emotion_community_api.exception;

public class EmotionInferenceUnavailableException extends RuntimeException {

	public EmotionInferenceUnavailableException() {
		super("Emotion inference service is unavailable");
	}

	public EmotionInferenceUnavailableException(Throwable cause) {
		super("Emotion inference service is unavailable", cause);
	}
}