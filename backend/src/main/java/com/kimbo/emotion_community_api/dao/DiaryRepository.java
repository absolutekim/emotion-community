package com.kimbo.emotion_community_api.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kimbo.emotion_community_api.entity.Diary;

public interface DiaryRepository extends JpaRepository<Diary, Long> {

	List<Diary> findByUser_IdOrderByCreatedAtDescIdDesc(Long userId);
}