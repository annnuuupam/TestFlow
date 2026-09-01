package com.ots.dto.response;

import com.ots.enums.TestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExamResponse {
    private Long id;
    private String title;
    private String description;
    private Integer durationMinutes;
    private Integer totalMarks;
    private Integer passingMarks;
    private Boolean negativeMarking;
    private Double negativeMarksPerWrong;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private TestStatus status;
    private Boolean isRandomized;
    private Integer maxAttempts;
    private String category;
    private String createdBy;
    private LocalDateTime createdAt;
    private Integer totalQuestions;
    private Integer sectionCount;
    private Long attemptCount;
    private List<SectionResponse> sections;
}
