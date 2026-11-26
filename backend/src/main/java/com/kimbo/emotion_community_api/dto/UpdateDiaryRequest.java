package com.kimbo.emotion_community_api.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateDiaryRequest(
		@NotNull String content) {
}