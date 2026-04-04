package com.ots.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String bio;
    private String profilePicture;
    private List<String> skills;
    private String githubUrl;
    private String linkedinUrl;
    private String twitterUrl;
    
    private Integer currentStreak;
    private Integer maxStreak;
    private Integer totalSolved;
    private Integer totalSubmissions;
    private Double accuracy;
    private LocalDate lastActiveDate;
    
    private List<BadgeResponse> badges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeResponse {
        private Long id;
        private String name;
        private String description;
        private String iconUrl;
        private String awardedAt;
        private boolean isEarned;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityPoint {
        private String date;
        private Integer count;
    }
}
