package com.ots.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {
    private Long totalUsers;
    private Long totalStudents;
    private Long totalAdmins;
    private Long totalExams;
    private Long activeExams;
    private Long totalAttempts;
    private Long completedAttempts;
    private Double averageScore;
    private Long totalQuestions;
    private Integer activeUsersToday;
    private Double averageStreak;
    private Integer topStreak;

    // Advanced Metrics
    private List<TrendPoint> attemptTrends;
    private Map<String, Long> categoryDistribution;
    private List<RecentActivity> recentActivities;

    @Data
    @Builder
    public static class TrendPoint {
        private String label; // e.g., "Jan", "Feb"
        private Long count;
        private Double avgScore;
    }

    @Data
    @Builder
    public static class RecentActivity {
        private String message;
        private String time;
        private String type; // USER_JOINED, TEST_SUBMITTED, etc.
    }
}
