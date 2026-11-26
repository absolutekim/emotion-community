package com.kimbo.emotion_community_api.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

public final class CsrfGuard {

	private CsrfGuard() {
	}

	public static void requireMatchingHeader(HttpServletRequest request) {
		CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
		String headerName = csrfToken != null ? csrfToken.getHeaderName() : "X-XSRF-TOKEN";
		String headerValue = request.getHeader(headerName);
		if (headerValue == null || headerValue.isBlank()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid CSRF token");
		}
		if (csrfToken != null && !headerValue.equals(csrfToken.getToken())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid CSRF token");
		}
	}
}