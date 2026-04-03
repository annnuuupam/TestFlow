package com.ots.dto.request;

import com.ots.enums.QuestionType;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class QuestionRequest {
    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull
    private QuestionType questionType = QuestionType.MCQ;

    private Integer marks = 1;
    private String explanation;
    private String difficulty = "MEDIUM";
    private Integer displayOrder = 0;

    private List<OptionRequest> options;

    @Data
    public static class OptionRequest {
        @NotBlank
        private String optionText;
        private Boolean isCorrect = false;
        private Integer displayOrder = 0;
    }
}
