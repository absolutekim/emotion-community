package com.kimbo.emotion_community_api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.EntityManager;

import com.kimbo.emotion_community_api.dao.CommunityPostCommentRepository;
import com.kimbo.emotion_community_api.dao.CommunityPostRepository;
import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.CreateCommunityPostCommentRequest;
import com.kimbo.emotion_community_api.entity.CommunityPost;
import com.kimbo.emotion_community_api.entity.User;

@SpringBootTest
@Transactional
class CommunityPostCommentOwnershipTest {

	@Autowired
	private CommunityPostCommentService commentService;

	@Autowired
	private CommunityPostService postService;

	@Autowired
	private CommunityPostRepository postRepository;

	@Autowired
	private CommunityPostCommentRepository commentRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private EntityManager entityManager;

	private User userA;
	private User userB;
	private long postId;

	@BeforeEach
	void setUp() {
		userA = userRepository.save(new User("comment_post_owner_a", passwordEncoder.encode("password12")));
		userB = userRepository.save(new User("comment_post_owner_b", passwordEncoder.encode("password12")));
		CommunityPost post = postRepository.save(new CommunityPost(userA, "post title", "post body"));
		postId = post.getId();
	}

	@Test
	void postAuthorCannotDeleteCommentByAnotherUser() {
		var created = commentService.create(userB.getId(), postId, new CreateCommunityPostCommentRequest("B reply"));
		long commentId = created.id();

		assertThatThrownBy(() -> commentService.delete(userA.getId(), commentId))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(404);

		assertThat(commentRepository.findById(commentId)).isPresent();
	}

	@Test
	void deletingPostRemovesComments() {
		var created = commentService.create(userB.getId(), postId, new CreateCommunityPostCommentRequest("to cascade"));
		long commentId = created.id();
		assertThat(commentRepository.findById(commentId)).isPresent();

		postService.delete(userA.getId(), postId);
		entityManager.flush();
		entityManager.clear();

		assertThat(postRepository.findById(postId)).isEmpty();
		assertThat(commentRepository.findById(commentId)).isEmpty();
		assertThat(commentRepository.countByPost_Id(postId)).isZero();
	}

	@Test
	void blankCommentRejected() {
		assertThatThrownBy(() -> commentService.create(userB.getId(), postId, new CreateCommunityPostCommentRequest("  ")))
				.isInstanceOf(ResponseStatusException.class)
				.extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
				.isEqualTo(400);
	}

	@Test
	void authorCanDeleteOwnComment() {
		var created = commentService.create(userB.getId(), postId, new CreateCommunityPostCommentRequest("mine"));
		commentService.delete(userB.getId(), created.id());
		assertThat(commentRepository.findById(created.id())).isEmpty();
	}
}