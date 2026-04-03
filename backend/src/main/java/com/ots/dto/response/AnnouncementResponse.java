package com.ots.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String content;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
}
