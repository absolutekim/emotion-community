package com.kimbo.emotion_community_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class EmotionExceptionHandler {

	@ExceptionHandler(EmotionInferenceUnavailableException.class)
	public ResponseEntity<MapBody> handleUnavailable(EmotionInferenceUnavailableException ex) {
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
				.body(new MapBody("Emotion inference service is unavailable"));
	}

	private record MapBody(String message) {
	}
}