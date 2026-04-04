package com.ots.dto.response;

import com.ots.enums.Language;
import com.ots.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {
    private Long id;
    private Long problemId;
    private String problemTitle;
    private String code;
    private Language language;
    private SubmissionStatus status;
    private Double executionTime;
    private Integer memoryUsed;
    private String errorMessage;
    private LocalDateTime submittedAt;
}
