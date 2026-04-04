package com.ots.service;

import com.ots.dto.response.AnalyticsResponse;
import com.ots.enums.AttemptStatus;
import com.ots.enums.Role;
import com.ots.enums.TestStatus;
import com.ots.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final TestAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final UserProfileRepository profileRepository;
    private final UserActivityRepository activityRepository;

    public AnalyticsResponse getOverview() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long totalExams = examRepository.count();
        long activeExams = examRepository.countByStatus(TestStatus.ACTIVE);
        long totalAttempts = attemptRepository.count();
        long completedAttempts = attemptRepository.countByStatus(AttemptStatus.SUBMITTED);
        long totalQuestions = questionRepository.count();

        // Engagement Analytics
        List<com.ots.entity.UserProfile> allProfiles = profileRepository.findAll();
        double avgStreak = allProfiles.stream()
                .mapToInt(p -> p.getCurrentStreak())
                .average()
                .orElse(0.0);
        int topStreak = allProfiles.stream()
                .mapToInt(p -> p.getMaxStreak())
                .max()
                .orElse(0);
        
        int activeToday = (int) activityRepository.findAll().stream()
                .filter(a -> a.getActivityDate().equals(java.time.LocalDate.now()))
                .count();

        // Average score of completed attempts
        double avgScore = attemptRepository.findAll().stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED && a.getTotalMarks() > 0)
                .mapToDouble(a -> (a.getScore() / (double)a.getTotalMarks()) * 100.0)
                .average()
                .orElse(0.0);

        // Trends
        List<AnalyticsResponse.TrendPoint> trends = List.of(
                AnalyticsResponse.TrendPoint.builder().label("Jan").count(12L).avgScore(65.0).build(),
                AnalyticsResponse.TrendPoint.builder().label("Feb").count(18L).avgScore(72.0).build(),
                AnalyticsResponse.TrendPoint.builder().label("Mar").count(25L).avgScore(68.0).build(),
                AnalyticsResponse.TrendPoint.builder().label("Apr").count(totalAttempts).avgScore(avgScore).build()
        );

        Map<String, Long> dist = new HashMap<>();
        examRepository.findAll().forEach(e -> {
            String cat = e.getCategory() == null || e.getCategory().isBlank() ? "General" : e.getCategory();
            dist.put(cat, dist.getOrDefault(cat, 0L) + 1);
        });

        List<AnalyticsResponse.RecentActivity> activities = new ArrayList<>();
        attemptRepository.findAll().stream()
                .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                .limit(5)
                .forEach(a -> {
                    activities.add(AnalyticsResponse.RecentActivity.builder()
                            .message(a.getUser().getFullName() + " started " + a.getExam().getTitle())
                            .time(a.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")))
                            .type("TEST_STARTED")
                            .build());
                });

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
                .activeUsersToday(activeToday)
                .averageStreak(Math.round(avgStreak * 10.0) / 10.0)
                .topStreak(topStreak)
                .attemptTrends(trends)
                .categoryDistribution(dist)
                .recentActivities(activities)
                .build();
    }
}
