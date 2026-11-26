package com.kimbo.emotion_community_api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kimbo.emotion_community_api.dto.CsrfResponse;
import com.kimbo.emotion_community_api.dto.LoginRequest;
import com.kimbo.emotion_community_api.dto.SignupRequest;
import com.kimbo.emotion_community_api.dto.UserResponse;
import com.kimbo.emotion_community_api.security.CsrfGuard;
import com.kimbo.emotion_community_api.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@GetMapping("/csrf")
	public CsrfResponse csrf(CsrfToken csrfToken, HttpServletRequest httpRequest) {
		httpRequest.getSession(true);
		return new CsrfResponse(csrfToken.getToken(), csrfToken.getHeaderName(), csrfToken.getParameterName());
	}

	@PostMapping("/signup")
	public ResponseEntity<UserResponse> signup(
			@Valid @RequestBody SignupRequest request,
			HttpServletRequest httpRequest) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
	}

	@PostMapping("/login")
	public UserResponse login(
			@Valid @RequestBody LoginRequest request,
			HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		return authService.login(request, httpRequest, httpResponse);
	}

	@GetMapping("/me")
	public UserResponse me() {
		return authService.currentUser();
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(
			Authentication authentication,
			HttpServletRequest httpRequest,
			HttpServletResponse httpResponse) {
		CsrfGuard.requireMatchingHeader(httpRequest);
		logoutHandler.logout(httpRequest, httpResponse, authentication);
		return ResponseEntity.noContent().build();
	}
}