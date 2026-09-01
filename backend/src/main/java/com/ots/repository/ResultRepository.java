package com.ots.repository;

import com.ots.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByContestIdOrderByScoreDescRankAsc(Long contestId);
    List<Result> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
