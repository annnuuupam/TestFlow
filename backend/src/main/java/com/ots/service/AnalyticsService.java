package com.ots.service;

import com.ots.dto.response.AnalyticsResponse;
import com.ots.enums.AttemptStatus;
import com.ots.enums.Role;
import com.ots.enums.TestStatus;
import com.ots.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final TestAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;

    public AnalyticsResponse getOverview() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long totalExams = examRepository.count();
        long activeExams = examRepository.countByStatus(TestStatus.ACTIVE);
        long totalAttempts = attemptRepository.count();
        long completedAttempts = attemptRepository.countByStatus(AttemptStatus.SUBMITTED);
        long totalQuestions = questionRepository.count();

        // Average score of completed attempts
        double avgScore = attemptRepository.findAll().stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED && a.getTotalMarks() > 0)
                .mapToDouble(a -> (a.getScore() / a.getTotalMarks()) * 100)
                .average()
                .orElse(0.0);

        return AnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalAdmins(totalAdmins)
                .totalExams(totalExams)
                .activeExams(activeExams)
                .totalAttempts(totalAttempts)
                .completedAttempts(completedAttempts)
                .averageScore(Math.round(avgScore * 100.0) / 100.0)
                .totalQuestions(totalQuestions)
                .build();
    }
}
