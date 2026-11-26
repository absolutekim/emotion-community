package com.kimbo.emotion_community_api.dto;

import java.time.Instant;

public record CommunityPostResponse(
		long id,
		String title,
		String body,
		String authorLoginId,
		Instant createdAt) {
}