package com.kimbo.emotion_community_api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kimbo.emotion_community_api.dao.DiaryRepository;
import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.AnalyzeEmotionResponse;
import com.kimbo.emotion_community_api.dto.UpdateDiaryRequest;
import com.kimbo.emotion_community_api.entity.Diary;
import com.kimbo.emotion_community_api.entity.User;
import com.kimbo.emotion_community_api.exception.EmotionInferenceUnavailableException;

@SpringBootTest
@Transactional
class DiaryOwnershipTest {

	@Autowired
	private DiaryService diaryService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private DiaryRepository diaryRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@MockitoBean
	private EmotionInferenceService emotionInferenceService;

	private User userA;
	private User userB;
	private long diaryIdA;

	@BeforeEach
	void setUp() {
		userA = userRepository.save(new User("diary_owner_a", passwordEncoder.encode("password12")));
		userB = userRepository.save(new User("diary_owner_b", passwordEncoder.encode("password12")));
		Diary diary = diaryRepository.save(new Diary(userA, "original content", "행복"));
		diaryIdA = diary.getId();
	}

	@Test
	void userBCannotUpdateOrDeleteDiaryOwnedByUserA() {
		when(emotionInferenceService.analyze(anyString())).thenReturn(new AnalyzeEmotionResponse("슬픔"));

		assertThatThrownBy(() -> diaryService.update(userB.getId(), diaryIdA, new UpdateDiaryRequest("hacked")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(404);

		assertThatThrownBy(() -> diaryService.delete(userB.getId(), diaryIdA))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(404);

		Diary unchanged = diaryRepository.findById(diaryIdA).orElseThrow();
		assertThat(unchanged.getContent()).isEqualTo("original content");
		assertThat(unchanged.getEmotion()).isEqualTo("행복");
	}

	@Test
	void userACanUpdateOwnDiary() {
		when(emotionInferenceService.analyze("updated content"))
				.thenReturn(new AnalyzeEmotionResponse("슬픔"));

		var response = diaryService.update(userA.getId(), diaryIdA, new UpdateDiaryRequest("updated content"));

		assertThat(response.content()).isEqualTo("updated content");
		assertThat(response.emotion()).isEqualTo("슬픔");
		assertThat(response.id()).isEqualTo(diaryIdA);

		Diary inDb = diaryRepository.findById(diaryIdA).orElseThrow();
		assertThat(inDb.getContent()).isEqualTo("updated content");
		assertThat(inDb.getEmotion()).isEqualTo("슬픔");
		assertThat(inDb.getCreatedAt()).isEqualTo(response.createdAt());
	}

	@Test
	void failedInferenceDoesNotChangeStoredDiary() {
		doThrow(new EmotionInferenceUnavailableException())
				.when(emotionInferenceService)
				.analyze("new attempt");

		assertThatThrownBy(() -> diaryService.update(userA.getId(), diaryIdA, new UpdateDiaryRequest("new attempt")))
				.isInstanceOf(EmotionInferenceUnavailableException.class);

		Diary unchanged = diaryRepository.findById(diaryIdA).orElseThrow();
		assertThat(unchanged.getContent()).isEqualTo("original content");
		assertThat(unchanged.getEmotion()).isEqualTo("행복");
	}
}