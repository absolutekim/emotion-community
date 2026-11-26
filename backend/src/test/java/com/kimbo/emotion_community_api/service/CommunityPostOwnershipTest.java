package com.kimbo.emotion_community_api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kimbo.emotion_community_api.dao.CommunityPostRepository;
import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.CreateCommunityPostRequest;
import com.kimbo.emotion_community_api.dto.UpdateCommunityPostRequest;
import com.kimbo.emotion_community_api.entity.CommunityPost;
import com.kimbo.emotion_community_api.entity.User;

@SpringBootTest
@Transactional
class CommunityPostOwnershipTest {

	@Autowired
	private CommunityPostService communityPostService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private CommunityPostRepository communityPostRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private User userA;
	private User userB;
	private long postIdA;
	private Instant createdAtA;

	@BeforeEach
	void setUp() {
		userA = userRepository.save(new User("post_owner_a", passwordEncoder.encode("password12")));
		userB = userRepository.save(new User("post_owner_b", passwordEncoder.encode("password12")));
		CommunityPost post = communityPostRepository.save(new CommunityPost(userA, "original title", "original body"));
		postIdA = post.getId();
		createdAtA = post.getCreatedAt();
	}

	@Test
	void userBCannotUpdateOrDeletePostOwnedByUserA() {
		assertThatThrownBy(() -> communityPostService.update(
				userB.getId(),
				postIdA,
				new UpdateCommunityPostRequest("hacked title", "hacked body")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(404);

		assertThatThrownBy(() -> communityPostService.delete(userB.getId(), postIdA))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(404);

		CommunityPost unchanged = communityPostRepository.findById(postIdA).orElseThrow();
		assertThat(unchanged.getTitle()).isEqualTo("original title");
		assertThat(unchanged.getBody()).isEqualTo("original body");
		assertThat(unchanged.getCreatedAt()).isEqualTo(createdAtA);
	}

	@Test
	void userACanUpdateOwnPostAndKeepsAuthorAndCreatedAt() {
		var response = communityPostService.update(
				userA.getId(),
				postIdA,
				new UpdateCommunityPostRequest("updated title", "updated body"));

		assertThat(response.title()).isEqualTo("updated title");
		assertThat(response.body()).isEqualTo("updated body");
		assertThat(response.authorLoginId()).isEqualTo("post_owner_a");
		assertThat(response.createdAt()).isEqualTo(createdAtA);

		CommunityPost inDb = communityPostRepository.findById(postIdA).orElseThrow();
		assertThat(inDb.getTitle()).isEqualTo("updated title");
		assertThat(inDb.getBody()).isEqualTo("updated body");
		assertThat(inDb.getAuthor().getId()).isEqualTo(userA.getId());
		assertThat(inDb.getCreatedAt()).isEqualTo(createdAtA);
	}

	@Test
	void userACanDeleteOwnPost() {
		communityPostService.delete(userA.getId(), postIdA);
		assertThat(communityPostRepository.findById(postIdA)).isEmpty();
	}

	@Test
	void blankUpdateRejected() {
		assertThatThrownBy(() -> communityPostService.update(
				userA.getId(),
				postIdA,
				new UpdateCommunityPostRequest("  ", "body")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(400);
	}

	@Test
	void createStillWorks() {
		var created = communityPostService.create(userA.getId(), new CreateCommunityPostRequest("new", "content"));
		assertThat(created.title()).isEqualTo("new");
		assertThat(created.authorLoginId()).isEqualTo("post_owner_a");
	}
}