package com.kimbo.emotion_community_api.dao;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kimbo.emotion_community_api.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	boolean existsByLoginId(String loginId);

	Optional<User> findByLoginId(String loginId);
}