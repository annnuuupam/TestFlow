package com.ots.dto.request;

import com.ots.enums.TestStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title too long")
    private String title;

    private String description;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Builder.Default
    private Integer durationMinutes = 60;

    @NotNull(message = "Total marks is required")
    @Builder.Default
    private Integer totalMarks = 100;

    @NotNull(message = "Passing marks is required")
    @Builder.Default
    private Integer passingMarks = 40;

    @Builder.Default
    private Boolean negativeMarking = false;

    @Builder.Default
    private Double negativeMarksPerWrong = 0.25;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Builder.Default
    private TestStatus status = TestStatus.DRAFT;

    @Builder.Default
    private Boolean isRandomized = true;

    @Builder.Default
    private Integer maxAttempts = 1;

    private String category;
    private String instructions;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Boolean isShuffleQuestions = false;
}
