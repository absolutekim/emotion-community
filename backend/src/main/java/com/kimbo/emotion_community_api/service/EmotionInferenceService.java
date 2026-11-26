package com.kimbo.emotion_community_api.service;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.kimbo.emotion_community_api.dto.AnalyzeEmotionResponse;
import com.kimbo.emotion_community_api.exception.EmotionInferenceUnavailableException;

@Service
public class EmotionInferenceService {

	private final RestClient emotionInferenceRestClient;

	public EmotionInferenceService(RestClient emotionInferenceRestClient) {
		this.emotionInferenceRestClient = emotionInferenceRestClient;
	}

	public AnalyzeEmotionResponse analyze(String content) {
		try {
			AnalyzeEmotionResponse response = emotionInferenceRestClient.post()
					.uri("/api/emotions/analyze")
					.contentType(MediaType.APPLICATION_JSON)
					.body(Map.of("content", content))
					.retrieve()
					.body(AnalyzeEmotionResponse.class);

			if (response == null || response.emotion() == null || response.emotion().isBlank()) {
				throw new EmotionInferenceUnavailableException();
			}
			return response;
		}
		catch (RestClientException ex) {
			throw new EmotionInferenceUnavailableException(ex);
		}
	}
}