package com.ots.dto.response;

import com.ots.enums.ProblemDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemResponse {
    private Long id;
    private String title;
    private String description;
    private ProblemDifficulty difficulty;
    private String tags;
    private Double timeLimit;
    private Integer memoryLimit;
    private List<TestCaseResponse> testCases;
}
