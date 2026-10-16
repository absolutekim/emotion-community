package com.kimbo.emotion_community_api.dto;

import java.time.Instant;

public record DiaryResponse(
		long id,
		String content,
		String emotion,
		Instant createdAt) {
}