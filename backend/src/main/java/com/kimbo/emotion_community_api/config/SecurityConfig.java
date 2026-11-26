package com.kimbo.emotion_community_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.http.HttpStatus;

import com.kimbo.emotion_community_api.security.AppUserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final AppUserDetailsService userDetailsService;

	public SecurityConfig(AppUserDetailsService userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	AuthenticationManager authenticationManager(PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return new ProviderManager(provider);
	}

	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> {
					CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
					requestHandler.setCsrfRequestAttributeName(null);
					csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
							.csrfTokenRequestHandler(requestHandler)
							.ignoringRequestMatchers("/api/emotions/**");
				})
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/auth/csrf", "/api/auth/signup", "/api/auth/login").permitAll()
						.requestMatchers("/api/emotions/**").permitAll()
						.requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
						.requestMatchers("/api/diaries", "/api/diaries/**").authenticated()
						.anyRequest().denyAll())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint((request, response, authException) -> response
								.setStatus(HttpStatus.UNAUTHORIZED.value()))
						.accessDeniedHandler((request, response, accessDeniedException) -> response
								.setStatus(HttpStatus.FORBIDDEN.value())));

		return http.build();
	}
}