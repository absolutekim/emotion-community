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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kimbo.emotion_community_api.dto.CommunityPostResponse;
import com.kimbo.emotion_community_api.dto.CreateCommunityPostRequest;
import com.kimbo.emotion_community_api.dto.UpdateCommunityPostRequest;
import com.kimbo.emotion_community_api.security.AppUserDetails;
import com.kimbo.emotion_community_api.security.CsrfGuard;
import com.kimbo.emotion_community_api.service.CommunityPostService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/community/posts")
public class CommunityPostController {

	private final CommunityPostService communityPostService;

	public CommunityPostController(CommunityPostService communityPostService) {
		this.communityPostService = communityPostService;
	}

	@GetMapping
	public List<CommunityPostResponse> list() {
		return communityPostService.listPublic();
	}

	@PostMapping
	public ResponseEntity<CommunityPostResponse> create(
			@Valid @RequestBody CreateCommunityPostRequest request,
			HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		long userId = currentUserId();
		return ResponseEntity.status(HttpStatus.CREATED).body(communityPostService.create(userId, request));
	}

	@PutMapping("/{id}")
	public CommunityPostResponse update(
			@PathVariable long id,
			@Valid @RequestBody UpdateCommunityPostRequest request,
			HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		long userId = currentUserId();
		return communityPostService.update(userId, id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable long id, HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		long userId = currentUserId();
		communityPostService.delete(userId, id);
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