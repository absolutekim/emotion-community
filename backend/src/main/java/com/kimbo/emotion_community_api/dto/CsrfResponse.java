package com.kimbo.emotion_community_api.dto;

public record CsrfResponse(String token, String headerName, String parameterName) {
}