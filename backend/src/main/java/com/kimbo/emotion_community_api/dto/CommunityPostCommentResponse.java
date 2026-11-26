package com.kimbo.emotion_community_api.dto;

import java.time.Instant;

public record CommunityPostCommentResponse(
		long id,
		long postId,
		String body,
		String authorLoginId,
		Instant createdAt) {
}