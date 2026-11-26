package com.kimbo.emotion_community_api.exception;

public class DuplicateLoginIdException extends RuntimeException {

	public DuplicateLoginIdException() {
		super("Login id already exists");
	}
}