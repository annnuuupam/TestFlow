package com.ots.repository;

import com.ots.entity.TestAttempt;
import com.ots.enums.AttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByUserIdOrderByStartTimeDesc(Long userId);
    List<TestAttempt> findByExamIdOrderByScoreDesc(Long examId);
    Optional<TestAttempt> findByExamIdAndUserIdAndStatus(Long examId, Long userId, AttemptStatus status);
    long countByUserId(Long userId);
    long countByStatus(AttemptStatus status);
    long countByExamId(Long examId);
    boolean existsByExamIdAndUserId(Long examId, Long userId);
    Page<TestAttempt> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT ta FROM TestAttempt ta WHERE ta.exam.id = :examId " +
           "AND ta.status = 'SUBMITTED' ORDER BY ta.score DESC")
    List<TestAttempt> findLeaderboardByExam(@Param("examId") Long examId);

    @Query("SELECT COUNT(DISTINCT ta.exam.id) FROM TestAttempt ta WHERE ta.user.id = :userId AND ta.status = 'SUBMITTED'")
    long countCompletedExamsByUser(@Param("userId") Long userId);
}
