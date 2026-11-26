package com.kimbo.emotion_community_api.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "emotion.inference")
public record EmotionInferenceProperties(
		String baseUrl,
		Duration connectTimeout,
		Duration readTimeout) {
}