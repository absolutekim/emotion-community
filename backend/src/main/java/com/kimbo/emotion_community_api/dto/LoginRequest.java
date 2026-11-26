package com.kimbo.emotion_community_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
		@NotBlank @Size(max = 64) String loginId,
		@NotBlank String password) {
}