package com.kimbo.emotion_community_api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kimbo.emotion_community_api.dto.CreateDiaryRequest;
import com.kimbo.emotion_community_api.dto.DiaryResponse;
import com.kimbo.emotion_community_api.security.AppUserDetails;
import com.kimbo.emotion_community_api.security.CsrfGuard;
import com.kimbo.emotion_community_api.service.DiaryService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/diaries")
public class DiaryController {

	private final DiaryService diaryService;

	public DiaryController(DiaryService diaryService) {
		this.diaryService = diaryService;
	}

	@PostMapping
	public ResponseEntity<DiaryResponse> create(
			@Valid @RequestBody CreateDiaryRequest request,
			HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		long userId = currentUserId();
		return ResponseEntity.status(HttpStatus.CREATED).body(diaryService.create(userId, request));
	}

	@GetMapping
	public List<DiaryResponse> list() {
		long userId = currentUserId();
		return diaryService.listForUser(userId);
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