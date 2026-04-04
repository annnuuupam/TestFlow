package com.ots.dto.request;

import com.ots.enums.ProblemDifficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemRequest {
    
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Difficulty is required")
    private ProblemDifficulty difficulty;

    private String tags;

    private Double timeLimit;

    private Integer memoryLimit;

    private List<TestCaseRequest> testCases;
}
