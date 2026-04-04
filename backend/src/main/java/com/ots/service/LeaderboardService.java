package com.ots.service;

import com.ots.dto.response.LeaderboardEntry;
import com.ots.entity.TestAttempt;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.ExamRepository;
import com.ots.repository.TestAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final TestAttemptRepository attemptRepository;
    private final ExamRepository examRepository;

    public List<LeaderboardEntry> getLeaderboard(Long examId) {
        if (!examRepository.existsById(examId)) {
            throw new ResourceNotFoundException("Exam", examId);
        }

        List<TestAttempt> topAttempts = attemptRepository.findLeaderboardByExam(examId);
        List<LeaderboardEntry> entries = new ArrayList<>();

        for (int i = 0; i < topAttempts.size(); i++) {
            TestAttempt attempt = topAttempts.get(i);
            entries.add(LeaderboardEntry.builder()
                    .rank(i + 1)
                    .userId(attempt.getUser().getId())
                    .username(attempt.getUser().getUsername())
                    .fullName(attempt.getUser().getFullName())
                    .score(attempt.getScore())
                    .totalMarks(attempt.getTotalMarks())
                    .percentage(attempt.getPercentage())
                    .timeTakenSeconds(attempt.getTimeTakenSeconds())
                    .passed(attempt.getPercentage() >= attempt.getExam().getPassingMarks())
                    .build());
        }

        return entries;
    }

    public List<LeaderboardEntry> getGlobalLeaderboard() {
        List<TestAttempt> topAttempts = attemptRepository.findGlobalLeaderboard();
        List<LeaderboardEntry> entries = new ArrayList<>();

        for (int i = 0; i < topAttempts.size(); i++) {
            TestAttempt attempt = topAttempts.get(i);
            entries.add(LeaderboardEntry.builder()
                    .rank(i + 1)
                    .userId(attempt.getUser().getId())
                    .username(attempt.getUser().getUsername())
                    .fullName(attempt.getUser().getFullName())
                    .score(attempt.getScore())
                    .totalMarks(attempt.getTotalMarks())
                    .percentage(attempt.getPercentage())
                    .timeTakenSeconds(attempt.getTimeTakenSeconds())
                    .passed(attempt.getPercentage() >= attempt.getExam().getPassingMarks())
                    .build());
        }

        return entries;
    }
}
