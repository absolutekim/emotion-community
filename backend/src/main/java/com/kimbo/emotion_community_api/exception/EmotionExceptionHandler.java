package com.kimbo.emotion_community_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class EmotionExceptionHandler {

	@ExceptionHandler(EmotionInferenceUnavailableException.class)
	public ResponseEntity<MapBody> handleUnavailable(EmotionInferenceUnavailableException ex) {
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
				.body(new MapBody("Emotion inference service is unavailable"));
	}

	@ExceptionHandler(DuplicateLoginIdException.class)
	public ResponseEntity<MapBody> handleDuplicateLoginId(DuplicateLoginIdException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new MapBody(ex.getMessage()));
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<MapBody> handleBadCredentials(BadCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(new MapBody("Invalid login id or password"));
	}

	private record MapBody(String message) {
	}
}