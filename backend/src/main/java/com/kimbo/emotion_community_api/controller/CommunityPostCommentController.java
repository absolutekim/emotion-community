package com.kimbo.emotion_community_api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kimbo.emotion_community_api.dto.CommunityPostCommentResponse;
import com.kimbo.emotion_community_api.dto.CreateCommunityPostCommentRequest;
import com.kimbo.emotion_community_api.security.AppUserDetails;
import com.kimbo.emotion_community_api.security.CsrfGuard;
import com.kimbo.emotion_community_api.service.CommunityPostCommentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/community")
public class CommunityPostCommentController {

	private final CommunityPostCommentService commentService;

	public CommunityPostCommentController(CommunityPostCommentService commentService) {
		this.commentService = commentService;
	}

	@GetMapping("/posts/{postId}/comments")
	public List<CommunityPostCommentResponse> list(@PathVariable long postId) {
		return commentService.listForPost(postId);
	}

	@PostMapping("/posts/{postId}/comments")
	public ResponseEntity<CommunityPostCommentResponse> create(
			@PathVariable long postId,
			@Valid @RequestBody CreateCommunityPostCommentRequest request,
			HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		long userId = currentUserId();
		return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(userId, postId, request));
	}

	@DeleteMapping("/comments/{id}")
	public ResponseEntity<Void> delete(@PathVariable long id, HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		long userId = currentUserId();
		commentService.delete(userId, id);
		return ResponseEntity.noContent().build();
	}

	private long currentUserId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated()
				|| !(authentication.getPrincipal() instanceof AppUserDetails principal)) {
			throw new BadCredentialsException("Not authenticated");
		}
		return principal.getUser().getId();
	}
}