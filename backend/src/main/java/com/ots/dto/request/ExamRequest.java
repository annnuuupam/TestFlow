package com.ots.dto.request;

import com.ots.enums.TestStatus;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExamRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull @Min(1)
    private Integer durationMinutes = 60;

    @NotNull @Min(1)
    private Integer totalMarks = 100;

    @NotNull @Min(0)
    private Integer passingMarks = 40;

    private Boolean negativeMarking = false;
    private Double negativeMarksPerWrong = 0.25;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private TestStatus status = TestStatus.DRAFT;
    private Boolean isRandomized = true;
    private Integer maxAttempts = 1;
    private List<SectionRequest> sections;
}
