package com.kimbo.emotion_community_api.dto;

import jakarta.validation.constraints.NotBlank;

public record AnalyzeEmotionRequest(
		@NotBlank String content
) {
}