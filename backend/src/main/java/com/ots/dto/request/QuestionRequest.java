package com.ots.dto.request;

import com.ots.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {
    // Null for question-bank questions, required for questions attached to an exam section
    private Long sectionId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull
    @Builder.Default
    private QuestionType questionType = QuestionType.MCQ;

    @Builder.Default
    private Integer marks = 1;
    
    private String explanation;
    
    @Builder.Default
    private String difficulty = "MEDIUM";
    
    @Builder.Default
    private Integer displayOrder = 0;

    // Coding question specific fields
    private String boilerplate;
    private String constraints;
    private String sampleInput;
    private String sampleOutput;

    private List<OptionRequest> options;
    private List<TestCaseRequest> testCases;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionRequest {
        @NotBlank
        private String optionText;
        
        @Builder.Default
        private Boolean isCorrect = false;
        
        @Builder.Default
        private Integer displayOrder = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseRequest {
        private String input;
        private String expectedOutput;

        @com.fasterxml.jackson.annotation.JsonProperty("isHidden")
        @Builder.Default
        private boolean isHidden = false;
    }
}
