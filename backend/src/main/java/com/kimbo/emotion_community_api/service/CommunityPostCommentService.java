package com.kimbo.emotion_community_api.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kimbo.emotion_community_api.dao.CommunityPostCommentRepository;
import com.kimbo.emotion_community_api.dao.CommunityPostRepository;
import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.CommunityPostCommentResponse;
import com.kimbo.emotion_community_api.dto.CreateCommunityPostCommentRequest;
import com.kimbo.emotion_community_api.entity.CommunityPost;
import com.kimbo.emotion_community_api.entity.CommunityPostComment;
import com.kimbo.emotion_community_api.entity.User;

@Service
public class CommunityPostCommentService {

	private final CommunityPostCommentRepository commentRepository;
	private final CommunityPostRepository postRepository;
	private final UserRepository userRepository;

	public CommunityPostCommentService(
			CommunityPostCommentRepository commentRepository,
			CommunityPostRepository postRepository,
			UserRepository userRepository) {
		this.commentRepository = commentRepository;
		this.postRepository = postRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<CommunityPostCommentResponse> listForPost(long postId) {
		if (!postRepository.existsById(postId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		return commentRepository.findByPost_IdOrderByCreatedAtAscIdAsc(postId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public CommunityPostCommentResponse create(long userId, long postId, CreateCommunityPostCommentRequest request) {
		String body = request.body() == null ? "" : request.body().trim();
		if (body.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment body must not be blank");
		}

		CommunityPost post = postRepository.findById(postId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

		User author = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

		CommunityPostComment saved = commentRepository.save(new CommunityPostComment(post, author, body));
		return toResponse(saved);
	}

	@Transactional
	public void delete(long userId, long commentId) {
		CommunityPostComment comment = commentRepository.findByIdAndAuthor_Id(commentId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		commentRepository.delete(comment);
	}

	private CommunityPostCommentResponse toResponse(CommunityPostComment comment) {
		return new CommunityPostCommentResponse(
				comment.getId(),
				comment.getPost().getId(),
				comment.getBody(),
				comment.getAuthor().getLoginId(),
				comment.getCreatedAt());
	}
}