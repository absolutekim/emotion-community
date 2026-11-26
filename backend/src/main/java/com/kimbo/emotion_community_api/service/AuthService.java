package com.kimbo.emotion_community_api.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kimbo.emotion_community_api.dao.UserRepository;
import com.kimbo.emotion_community_api.dto.LoginRequest;
import com.kimbo.emotion_community_api.dto.SignupRequest;
import com.kimbo.emotion_community_api.dto.UserResponse;
import com.kimbo.emotion_community_api.entity.User;
import com.kimbo.emotion_community_api.exception.DuplicateLoginIdException;
import com.kimbo.emotion_community_api.security.AppUserDetails;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository securityContextRepository;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			SecurityContextRepository securityContextRepository) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
	}

	@Transactional
	public UserResponse signup(SignupRequest request) {
		String loginId = request.loginId().trim();
		if (userRepository.existsByLoginId(loginId)) {
			throw new DuplicateLoginIdException();
		}

		User user = new User(loginId, passwordEncoder.encode(request.password()));
		try {
			user = userRepository.save(user);
		}
		catch (DataIntegrityViolationException ex) {
			throw new DuplicateLoginIdException();
		}
		return new UserResponse(user.getId(), user.getLoginId());
	}

	public UserResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
		try {
			Authentication authentication = authenticationManager.authenticate(
					UsernamePasswordAuthenticationToken.unauthenticated(
							request.loginId().trim(),
							request.password()));

			SecurityContext context = SecurityContextHolder.createEmptyContext();
			context.setAuthentication(authentication);
			SecurityContextHolder.setContext(context);
			securityContextRepository.saveContext(context, httpRequest, httpResponse);
			httpRequest.changeSessionId();

			AppUserDetails principal = (AppUserDetails) authentication.getPrincipal();
			User user = principal.getUser();
			return new UserResponse(user.getId(), user.getLoginId());
		}
		catch (BadCredentialsException ex) {
			throw new BadCredentialsException("Invalid login id or password", ex);
		}
	}

	public UserResponse currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !authentication.isAuthenticated()
				|| !(authentication.getPrincipal() instanceof AppUserDetails principal)) {
			throw new BadCredentialsException("Not authenticated");
		}
		User user = principal.getUser();
		return new UserResponse(user.getId(), user.getLoginId());
	}
}