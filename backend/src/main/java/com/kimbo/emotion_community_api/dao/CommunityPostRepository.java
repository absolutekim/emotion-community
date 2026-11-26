package com.kimbo.emotion_community_api.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kimbo.emotion_community_api.entity.CommunityPost;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

	List<CommunityPost> findAllByOrderByCreatedAtDescIdDesc();

	Optional<CommunityPost> findByIdAndAuthor_Id(long id, long authorId);
}