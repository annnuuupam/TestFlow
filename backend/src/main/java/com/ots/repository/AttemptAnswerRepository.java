package com.ots.repository;

import com.ots.entity.AttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    List<AttemptAnswer> findByAttemptId(Long attemptId);
    Optional<AttemptAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
    void deleteByAttemptId(Long attemptId);
}
