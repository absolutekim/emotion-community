package com.kimbo.emotion_community_api.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kimbo.emotion_community_api.dto.AnalyzeEmotionRequest;
import com.kimbo.emotion_community_api.dto.AnalyzeEmotionResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/emotions")
public class EmotionController {

	@PostMapping("/analyze")
	public AnalyzeEmotionResponse analyze(@Valid @RequestBody AnalyzeEmotionRequest request) {
		return new AnalyzeEmotionResponse("평온");
	}
}