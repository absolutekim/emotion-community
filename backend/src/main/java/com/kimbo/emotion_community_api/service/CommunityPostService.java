package com.kimbo.emotion_community_api.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kimbo.emotion_community_api.dao.CommunityPostRepository;
import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.CommunityPostResponse;
import com.kimbo.emotion_community_api.dto.CreateCommunityPostRequest;
import com.kimbo.emotion_community_api.dto.UpdateCommunityPostRequest;
import com.kimbo.emotion_community_api.entity.CommunityPost;
import com.kimbo.emotion_community_api.entity.User;

@Service
public class CommunityPostService {

	private final CommunityPostRepository communityPostRepository;
	private final UserRepository userRepository;

	public CommunityPostService(CommunityPostRepository communityPostRepository, UserRepository userRepository) {
		this.communityPostRepository = communityPostRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public CommunityPostResponse create(long userId, CreateCommunityPostRequest request) {
		String title = request.title() == null ? "" : request.title().trim();
		String body = request.body() == null ? "" : request.body().trim();
		if (title.isEmpty() || body.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title and body must not be blank");
		}

		User author = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

		CommunityPost saved = communityPostRepository.save(new CommunityPost(author, title, body));
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public List<CommunityPostResponse> listPublic() {
		return communityPostRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public CommunityPostResponse update(long userId, long postId, UpdateCommunityPostRequest request) {
		CommunityPost post = communityPostRepository.findByIdAndAuthor_Id(postId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

		String title = request.title() == null ? "" : request.title().trim();
		String body = request.body() == null ? "" : request.body().trim();
		if (title.isEmpty() || body.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title and body must not be blank");
		}

		post.updateTitleAndBody(title, body);
		return toResponse(post);
	}

	@Transactional
	public void delete(long userId, long postId) {
		CommunityPost post = communityPostRepository.findByIdAndAuthor_Id(postId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		communityPostRepository.delete(post);
	}

	private CommunityPostResponse toResponse(CommunityPost post) {
		return new CommunityPostResponse(
				post.getId(),
				post.getTitle(),
				post.getBody(),
				post.getAuthor().getLoginId(),
				post.getCreatedAt());
	}
}