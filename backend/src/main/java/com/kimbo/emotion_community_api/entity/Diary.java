package com.kimbo.emotion_community_api.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "diaries")
public class Diary {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(nullable = false, length = 64)
	private String emotion;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected Diary() {
	}

	public Diary(User user, String content, String emotion) {
		this.user = user;
		this.content = content;
		this.emotion = emotion;
	}

	public Long getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public String getContent() {
		return content;
	}

	public String getEmotion() {
		return emotion;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void updateContentAndEmotion(String content, String emotion) {
		this.content = content;
		this.emotion = emotion;
	}
}