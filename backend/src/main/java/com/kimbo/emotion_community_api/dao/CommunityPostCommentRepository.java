package com.kimbo.emotion_community_api.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kimbo.emotion_community_api.entity.CommunityPostComment;

public interface CommunityPostCommentRepository extends JpaRepository<CommunityPostComment, Long> {

	List<CommunityPostComment> findByPost_IdOrderByCreatedAtAscIdAsc(long postId);

	Optional<CommunityPostComment> findByIdAndAuthor_Id(long id, long authorId);

	long countByPost_Id(long postId);
}