package com.kimbo.emotion_community_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
		@NotBlank @Size(min = 1, max = 64) String loginId,
		@NotBlank @Size(min = 8, max = 72) String password) {
}