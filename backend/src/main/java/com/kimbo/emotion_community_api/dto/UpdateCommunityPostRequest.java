package com.kimbo.emotion_community_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCommunityPostRequest(
		@NotBlank @Size(max = 200) String title,
		@NotBlank String body) {
}