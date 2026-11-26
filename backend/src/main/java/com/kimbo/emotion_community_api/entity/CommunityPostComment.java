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

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "community_post_comments")
public class CommunityPostComment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	@JoinColumn(name = "post_id", nullable = false)
	private CommunityPost post;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User author;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String body;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt = Instant.now();

	protected CommunityPostComment() {
	}

	public CommunityPostComment(CommunityPost post, User author, String body) {
		this.post = post;
		this.author = author;
		this.body = body;
	}

	public Long getId() {
		return id;
	}

	public CommunityPost getPost() {
		return post;
	}

	public User getAuthor() {
		return author;
	}

	public String getBody() {
		return body;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}