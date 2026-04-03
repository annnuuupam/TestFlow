package com.ots.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Boolean isActive;
    private String phone;
    private LocalDateTime createdAt;
    private Long totalAttempts;
    private Long completedExams;
}
