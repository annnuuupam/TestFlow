package com.ots.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRunRequest {
    private String code;
    private String language; // java, python, cpp, c, javascript
    private List<TestCaseInput> testCases;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseInput {
        private String input;
        private String expectedOutput;
    }
}
