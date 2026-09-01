package com.ots.service;

import com.ots.dto.response.LeaderboardEntry;
import com.ots.entity.TestAttempt;
import com.ots.exception.ResourceNotFoundException;
import com.ots.repository.ExamRepository;
import com.ots.repository.TestAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private static final int MAX_ENTRIES = 100;

    private final TestAttemptRepository attemptRepository;
    private final ExamRepository examRepository;

    public List<LeaderboardEntry> getLeaderboard(Long examId) {
        if (!examRepository.existsById(examId)) {
            throw new ResourceNotFoundException("Exam", examId);
        }

        // Rank only the best attempt per candidate. Attempts arrive ordered by score DESC,
        // then timeTakenSeconds ASC, so the first occurrence for each user is the best one.
        List<TestAttempt> attempts = bestAttemptPerUser(attemptRepository.findLeaderboardByExam(examId));
        List<LeaderboardEntry> entries = new ArrayList<>();

        for (int i = 0; i < attempts.size() && i < MAX_ENTRIES; i++) {
            entries.add(toEntry(attempts.get(i), i + 1));
        }

        return entries;
    }

    public List<LeaderboardEntry> getGlobalLeaderboard() {
        List<TestAttempt> attempts = bestAttemptPerUser(attemptRepository.findGlobalLeaderboard());
        List<LeaderboardEntry> entries = new ArrayList<>();

        for (int i = 0; i < attempts.size() && i < MAX_ENTRIES; i++) {
            entries.add(toEntry(attempts.get(i), i + 1));
        }

        return entries;
    }

    private List<TestAttempt> bestAttemptPerUser(List<TestAttempt> attempts) {
        Set<Long> seenUsers = new LinkedHashSet<>();
        List<TestAttempt> result = new ArrayList<>();
        for (TestAttempt attempt : attempts) {
            Long userId = attempt.getUser().getId();
            if (seenUsers.add(userId)) {
                result.add(attempt);
            }
        }
        return result;
    }

    private LeaderboardEntry toEntry(TestAttempt attempt, int rank) {
        return LeaderboardEntry.builder()
                .rank(rank)
                .userId(attempt.getUser().getId())
                .username(attempt.getUser().getUsername())
                .fullName(attempt.getUser().getFullName())
                .score(attempt.getScore())
                .totalMarks(attempt.getTotalMarks())
                .percentage(attempt.getPercentage())
                .timeTakenSeconds(attempt.getTimeTakenSeconds())
                .passed(attempt.getPercentage() >= attempt.getExam().getPassingMarks())
                .examTitle(attempt.getExam().getTitle())
                .build();
    }
}