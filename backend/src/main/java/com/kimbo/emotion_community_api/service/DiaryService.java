package com.kimbo.emotion_community_api.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kimbo.emotion_community_api.dao.DiaryRepository;
import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.AnalyzeEmotionResponse;
import com.kimbo.emotion_community_api.dto.CreateDiaryRequest;
import com.kimbo.emotion_community_api.dto.DiaryResponse;
import com.kimbo.emotion_community_api.entity.Diary;
import com.kimbo.emotion_community_api.entity.User;
import com.kimbo.emotion_community_api.exception.EmotionInferenceUnavailableException;

@Service
public class DiaryService {

	private final DiaryRepository diaryRepository;
	private final UserRepository userRepository;
	private final EmotionInferenceService emotionInferenceService;

	public DiaryService(
			DiaryRepository diaryRepository,
			UserRepository userRepository,
			EmotionInferenceService emotionInferenceService) {
		this.diaryRepository = diaryRepository;
		this.userRepository = userRepository;
		this.emotionInferenceService = emotionInferenceService;
	}

	@Transactional
	public DiaryResponse create(long userId, CreateDiaryRequest request) {
		String content = request.content() == null ? "" : request.content().trim();
		if (content.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content must not be blank");
		}

		AnalyzeEmotionResponse analyzed;
		try {
			analyzed = emotionInferenceService.analyze(content);
		}
		catch (EmotionInferenceUnavailableException ex) {
			throw ex;
		}

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

		Diary saved = diaryRepository.save(new Diary(user, content, analyzed.emotion()));
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public List<DiaryResponse> listForUser(long userId) {
		return diaryRepository.findByUser_IdOrderByCreatedAtDescIdDesc(userId).stream()
				.map(this::toResponse)
				.toList();
	}

	private DiaryResponse toResponse(Diary diary) {
		return new DiaryResponse(diary.getId(), diary.getContent(), diary.getEmotion(), diary.getCreatedAt());
	}
}