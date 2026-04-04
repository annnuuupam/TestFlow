package com.ots.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CodeRunResponse {
    private int totalTests;
    private int passed;
    private int failed;
    private boolean allPassed;
    private List<TestCaseResult> results;
    private String compileError; // if compile error

    @Data
    @Builder
    public static class TestCaseResult {
        private int index;
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private boolean passed;
        private String error;
        private long executionTimeMs;
    }
}
