package com.ots.dto.response;

import lombok.Builder;
import lombok.Data;

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
}
