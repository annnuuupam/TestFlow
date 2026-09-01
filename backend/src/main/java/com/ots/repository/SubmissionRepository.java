package com.ots.repository;

import com.ots.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserId(Long userId);
    List<Submission> findByUserIdAndProblemId(Long userId, Long problemId);
    void deleteByProblemId(Long problemId);
    void deleteByUserId(Long userId);
}
