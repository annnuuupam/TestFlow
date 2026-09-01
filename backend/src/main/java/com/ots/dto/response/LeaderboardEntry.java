package com.ots.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardEntry {
    private Integer rank;
    private Long userId;
    private String username;
    private String fullName;
    private Double score;
    private Integer totalMarks;
    private Double percentage;
    private Integer timeTakenSeconds;
    private Boolean passed;
    private String examTitle;
}
